# PHASE 51 — AUDIT READ-ONLY DE ROBUSTESSE `getSurahCatalog`

**Verdict final : `PHASE_51_GET_SURAH_CATALOG_FIX_REQUIRED`**

> Phase STRICTEMENT READ-ONLY : aucune migration, aucune écriture DB (INSERT/UPDATE/
> DELETE/seed), aucune modification runtime/UI/resolver/SRS/mastery/Daily Plan/
> onboarding/curriculum/MASAQ/explications/catalogue. Aucun commit, aucun push.
> Seuls des artefacts d'audit `tmp/` et ce rapport ont été produits.
> **Le problème est identifié et documenté, mais PAS corrigé** (consigne de la phase).

---

## 1. Signal initial (Phase 50)

En Phase 50, lors de la vérification du catalogue, l'appel canonique `getSurahCatalog`
(scan complet des 21 parcours) a échoué avec :

```
échec: word_lemma_mapping : TypeError: fetch failed
```

Le résolveur unitaire (`resolveWordMeanings` 23/23 FR) et `classifySurahReadiness(107,
100%) → READY` fonctionnaient. Seul le scan complet du catalogue échouait.

---

## 2. Code exact concerné

Fichier : **`lib/learning/queries.ts`**.

Chemin réellement observé (lecture du code, pas supposé depuis le rapport) :

```
getSurahCatalog(client)                                    — queries.ts:171
  1. learning_paths  .not("surah_id","is",null)            — 21 lignes
  2. units           .in("path_id", pathIds)               — 21 lignes
  3. lessons         .in("unit_id", unitIds)               — 138 lignes
  4. lesson_words    .in("lesson_id", lessonIds)           — 933 lignes
  5. allWordIds = [...new Set(lwRows.map(r => r.word_id))] — 411 word_ids distincts
     Promise.all([
        getValidatedFrenchMeanings(allWordIds)             — word_translations.in(411)
        getValidatedFrenchLemmaMeaningsByWord(allWordIds)  — quran_words.in(411)
                                                            + getWordLemmaMappingsByWordIds(411)
     ])
  6. quran_words     .in("id", allWordIds)                 — 411
```

Requête fautive (point de bascule) — `getWordLemmaMappingsByWordIds` (`queries.ts:~848`) :

```ts
const { data, error } = await client
  .from("word_lemma_mapping")
  .select("word_id, lemma_id")
  .eq("confidence", "safe")
  .in("word_id", wordIds);            // wordIds = 411 UUIDs (catalogue complet)
if (error) throw new Error(`word_lemma_mapping : ${error.message}`);
```

⚠️ Le même `allWordIds` (411) alimente aussi `word_translations.in()` et
`quran_words.in()` dans le même chemin : les trois requêtes sont structurellement
identiques et **toutes** au-delà de la limite. L'erreur surfacée alterne donc entre
`word_translations` et `word_lemma_mapping` selon celle qui échoue la première dans le
`Promise.all`.

---

## 3. Requête concernée

- **Table** : `word_lemma_mapping`
- **Filtre** : `.eq("confidence","safe").in("word_id", 411 UUIDs)`
- **Nature** : `GET /rest/v1/word_lemma_mapping?select=word_id,lemma_id&confidence=eq.safe&word_id=in.(…)`
- **Nombre d'identifiants** : **411** (mots distincts du catalogue actuel)
- **Longueur URL** : **≈ 16 156 caractères** (encodage supabase-js), ~15 281 caractères non encodés
- **Ordre des requêtes** : séquentiel (étapes 1→4) puis `Promise.all` (étape 5), puis étape 6
- **Timeout** : aucun timeout explicite côté app ; échec réseau remonté tel quel
- **Gestion d'erreur** : `throw new Error(...)` → l'exception remonte à l'appelant

---

## 4. Reproduction READ-ONLY (multiple)

### A. Catalogue complet — `getSurahCatalog` (3 essais)

| Essai | Résultat | Durée | Erreur |
|---|---:|---:|---|
| 1 | ❌ FAIL | 9 366 ms | `word_translations : TypeError: fetch failed` |
| 2 | ❌ FAIL | 9 650 ms | `word_lemma_mapping : TypeError: fetch failed` |
| 3 | ❌ FAIL | 10 258 ms | `word_translations : TypeError: fetch failed` |

**100 % d'échec, déterministe.**

### B/C/D. `getWordLemmaMappingsByWordIds` à tailles croissantes (requête réelle)

| n (word_ids) | URL encodée (chars) | Résultat | Durée |
|---:|---:|---|---:|
| 10 | 517 | ✅ OK | 239 ms |
| 50 | 2 077 | ✅ OK | 219 ms |
| 100 | 4 027 | ✅ OK | 274 ms |
| 150 | 5 977 | ✅ OK | 288 ms |
| 200 | 7 927 | ✅ OK | 206 ms |
| 250 | 9 877 | ✅ OK | 240 ms |
| 300 | 11 827 | ✅ OK | 252 ms |
| 350 | ~13 627 | ✅ OK | 265 ms |
| 390 | ~15 200 | ✅ OK | 296 ms |
| 395 | ~15 500 | ✅ OK | 190 ms |
| **397** | ~15 600 | ❌ `TypeError: fetch failed` | 8 273 ms |
| 399 | ~15 700 | ❌ `TypeError: fetch failed` | 8 507 ms |
| 400 | 15 727 | ❌ `TypeError: fetch failed` | 8 796 ms |
| 411 | 16 156 | ❌ `TypeError: fetch failed` | 8 629 ms |

**Seuil précis : 395 OK / 397 FAIL → bascule ≈ 396 word_ids (~15,5 Ko d'URL encodée).**
Le catalogue actuel (**411**) est nettement au-dessus du seuil.

---

## 5. Erreurs éventuelles / mécanisme

Sondes complémentaires (toutes en lecture seule) :

| Client | Protocole | n=411 (URL ~15,3 Ko) | Observation |
|---|---|---|---|
| `curl` | HTTP/2 | ✅ 200 | serveur répond normalement |
| `curl` | HTTP/1.1 | ✅ 200 | serveur répond normalement |
| Node `https` | HTTP/1.1 | ❌ `Parse Error: Header overflow` (`HPE_HEADER_OVERFLOW`) | n≥400 |
| Node `fetch` (undici) | HTTP/1.1 | ❌ `fetch failed` (cause `HeadersOverflowError: Headers Overflow Error`) | n≥397 |

**Conclusion mécanisme** : la limite n'est **ni** la base (PostgREST) **ni** le serveur
(Cloudflare/Supabase acceptent la même URL, en HTTP/1.1 comme en HTTP/2). L'échec est
**côté client Node HTTP/1.1** (undici/`https`) : une URL de requête GET ≳ ~15 Ko
dépasse le plafond de taille d'en-tête/ligne de requête du client et déclenche
`Header overflow` avant/à l'envoi.

---

## 6. Cause probable

**Fragilité structurelle de requête (catégorie B), pas un incident transitoire.**

- Le `.in()` pleine-catalogue construit une URL GET unique de ~16 Ko (411 UUIDs).
- Le catalogue a grossi par paliers éditoriaux : **18 parcours / ~270 formes** (Phase 46,
  sous la limite, « getSurahCatalog passe déjà ~270 UUIDs ») → **21 parcours / 411 formes**
  (Phase 50), ce qui a **franchi le seuil client** (~396 formes).
- Conséquence : `getSurahCatalog` échoue désormais à 100 %, indépendamment de la charge
  réseau. Ce n'est pas un faux signal, pas un bug de données, et les preuves sont
  concluantes.

---

## 7. Impact réel

### Appelants de `getSurahCatalog` (lecture du code)

| Surface | Fichier | Gestion d'erreur |
|---|---|---|
| `/surahs` | `app/(app)/surahs/page.tsx:31` | **aucune** (composant serveur) → erreur 500 |
| `/dashboard` | `app/(app)/dashboard/page.tsx:57` | **aucune** → erreur 500 |
| `/learn` | `app/(app)/learn/page.tsx:35` | **aucune** → erreur 500 |
| `/profile` | `app/(app)/profile/page.tsx:54` | **aucune** → erreur 500 |
| `/onboarding` | `app/(onboarding)/onboarding/page.tsx:21` | **aucune** → erreur 500 |
| `completeOnboarding` | `lib/learning/actions.ts:669` | appel AVANT le try/catch → exception non gérée |
| `updateLearningPreferences` | `lib/learning/actions.ts:743` | appel AVANT le try/catch → exception non gérée |

Tous s'exécutent **côté serveur** (Next.js App Router, runtime Node → `fetch`/undici),
donc tous héritent de la limite client HTTP/1.1. En l'état, le catalogue, le dashboard,
l'apprentissage, le profil et l'onboarding (et les 2 actions serveur) **lèvent une
exception** dès que le catalogue dépasse ~396 formes — ce qui est déjà le cas (411).

### Fragilité connexe (même cause racine)

- `getSurahProgressByUser` (aussi sur `/surahs` et `/dashboard`) appelle
  `getUserWordProgress(.in("word_id", allNewWordIds))` ; `allNewWordIds` = **411**
  (411 mots `is_new` distincts vérifiés). Même risque de débordement.
- `getValidatedFrenchMeanings`, `getValidatedFrenchLemmaMeaningsByWord` et
  `getWordLemmaMappingsByWordIds` sont les helpers partagés : tout appel avec un
  `wordIds` ≳ 396 formes est exposé, pas seulement le catalogue.

---

## 8. Distinction catalogue / readiness (séparés et testés)

| Chemin | Résultat | Verdict |
|---|---|---|
| `getSurahCatalog` (scan complet) | ❌ `TypeError: fetch failed` (411 formes) | **CASSÉ** |
| `classifySurahReadiness(107, 100)` | `READY` (fonction pure, zéro requête) | ✅ OK |
| `resolveWordMeanings` sur 107 (23 formes) | 23/23 FR, 0 fallback | ✅ OK |
| `resolveWordMeanings` sur 107 via `getValidatedFrench*` (23 IDs, sous le seuil) | ✅ OK | ✅ OK |

→ La **readiness** (le résultat éditorial de la Phase 50) **n'est pas affectée**. Seul le
**scan complet du catalogue** (et tout `.in()` ≳ ~396 formes) l'est. Les deux chemins
sont bien distincts et ont été testés séparément.

---

## 9. Niveau de risque

| Critère | Évaluation |
|---|---|
| Reproductibilité | **100 %**, déterministe (fonction de la taille, pas de la charge) |
| Fréquence | Systématique dès que le catalogue ≥ ~396 formes (**déjà atteint : 411**) |
| Impact utilisateur | **Élevé** : 5 routes + 2 actions serveur en erreur non gérée |
| Risque de timeout | L'échec est rapide en termes de données (aucun timeout app), mais dure ~8–10 s (reset/reprise du client) |
| Risque de payload | Confirmé : URL GET ~16 Ko au-dessus du plafond client |
| Risque de régression si correction | **Modéré** : la correction touche le cœur catalogue/résolveur → exiger des tests |
| Nécessité d'optimisation | **Justifiée** (échec réel, croissant avec chaque sourate ajoutée) |

---

## 10. Recommandation

### `FIX_REQUIRED`

Justification : échec **déterministe et reproductible**, qui casse des surfaces produit
réelles (catalogue/dashboard/apprentissage/profil/onboarding/actions), et qui ne fera
qu'empirer (chaque sourate ajoutée augmente le nombre de formes distinctes). Ce n'est ni
un incident transitoire ni un faux signal.

**Aucune correction effectuée dans cette phase (consigne).** Correction proposée pour une
phase ultérieure :

- **Fichier concerné** : `lib/learning/queries.ts`
  - `getWordLemmaMappingsByWordIds`, `getValidatedFrenchMeanings`,
    `getValidatedFrenchLemmaMeaningsByWord` (et, par cohérence, `getUserWordProgress` /
    `getSurahProgressByUser`).
- **Nature exacte du changement** : découper chaque `.in()` en lots (chunking) de ≤ ~250
  word_ids, exécuter les lots en `Promise.all`, puis fusionner les `Map` en mémoire.
  (Alternative équivalente : basculer la lecture sur une `RPC`/`POST`, sans limite d'URL
  GET — nécessite une fonction Postgres, donc une migration, à arbitrer.)
- **Stratégie minimale** : une fonction utilitaire `chunk<T>(ids, 250)` + boucle de
  fusion, sans migration ni changement de contrat des fonctions existantes.
- **Tests nécessaires** : unit tests des helpers chunkés (client mocké, lots multiples,
  fusion sans doublon) ; test d'intégration/contrat sur catalogue complet (≥ 411 formes) ;
  conservation des 733 tests existants.

---

## 11. Confirmation READ-ONLY

- **0** écriture DB (aucun INSERT/UPDATE/DELETE/seed/migration).
- **0** fichier de production modifié (code, schéma, config, données).
- Uniquement des artefacts d'audit `tmp/` (scripts + JSON de preuve) et ce rapport.
- Le problème **n'a pas été corrigé**, conformément à la consigne « ne pas corriger
  pendant cette phase ».

---

## 12. Tests (état du projet inchangé)

- `npx tsc --noEmit` ✅ (0 erreur)
- `npx eslint .` ✅ (0 erreur)
- `npx vitest run` → **733/733** (55 fichiers) ✅ — baseline identique, aucun test modifié
- `npm run build` ✅ (Next.js 16.3.0, routes complètes)

---

## 13. Fichiers modifiés

**Fichiers de production modifiés : 0.**

Artefacts d'audit créés (non production) :
- `PHASE_51_GET_SURAH_CATALOG_ROBUSTNESS_AUDIT.md`
- `tmp/phase51-reproduce.ts` · `tmp/phase51-reproduce.json`
- `tmp/phase51-narrow.ts` · `tmp/phase51-final-threshold.cjs`
- `tmp/phase51-probe-https.cjs` · `tmp/phase51-probe-curl.cjs` · `tmp/phase51-probe-curl-http1.cjs`

---

## Verdict final

**`PHASE_51_GET_SURAH_CATALOG_FIX_REQUIRED`**

Le signal Phase 50 est confirmé et caractérisé : `getSurahCatalog` échoue de façon
**déterministe** (3/3) dès que le catalogue dépasse ~396 formes distinctes, car le
`.in()` pleine-catalogue produit une URL GET ~16 Ko qui dépasse le plafond du client
Node HTTP/1.1 (undici). Le catalogue actuel (411 formes) est au-dessus du seuil, ce qui
casse `/surahs`, `/dashboard`, `/learn`, `/profile`, `/onboarding` et deux actions
serveur. La readiness (classifySurahReadiness / resolveWordMeanings) reste fonctionnelle
et distincte. La correction (chunking du `.in()`) est requise mais **délibérément non
effectuée** dans cette phase read-only.

**STOP.** Aucune correction. Aucune Phase 52 automatique.
