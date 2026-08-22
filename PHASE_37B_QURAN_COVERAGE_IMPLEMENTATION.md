# PHASE 37B — QURAN COMPREHENSION COVERAGE : IMPLÉMENTATION

Statut : `PHASE_37B_IMPLEMENTATION_COMPLETE`

Référence : `PHASE_37A_DEFINITION_APPROVED` (`PHASE_37A_QURAN_COVERAGE_AUDIT.md`).

---

## A. Fichiers créés

| Fichier | Rôle |
| --- | --- |
| `lib/learning/coverage.ts` | Logique PURE (définition de « compris », somme des occurrences, pourcentage) |
| `tests/coverage.test.ts` | 22 tests unitaires de la logique pure |

Scripts d'audit jetables (hors produit, dans `tmp/`) : `phase37b-db-rls.cjs`, `phase37b-e2e.cjs`, `phase37b-topwords.cjs`.

## B. Fichiers modifiés

| Fichier | Modification |
| --- | --- |
| `lib/learning/queries.ts` | + import `coverage` ; + `QuranCoverage` ; + `getQuranCoverage(client, userId)` |
| `app/(app)/dashboard/page.tsx` | + import ; + `getQuranCoverage` dans le `Promise.all` ; + prop `coverage` ; + carte `QuranCoverageCard` |

## C. Migration éventuelle

**Aucune migration créée. Aucune table, colonne, donnée ou fonction SQL ajoutée.**

**Décision d'architecture (documentée) :** le brief recommandait un RPC `SECURITY INVOKER`, mais l'audit d'ÉTAPE 1 a montré qu'il n'est **pas nécessaire** : PostgREST `count: 'exact'` + `.in()` produit exactement le même résultat (somme des occurrences des formes comprises, total lu depuis `word_occurrences`) en **3 requêtes, sans récupération de lignes, sans N+1**, et sans toucher au schéma. Le codebase n'utilise **aucun RPC** (0 occurrence de `.rpc(`) : le choix sans migration est donc cohérent avec les conventions existantes. Le RPC reste une optimisation possible (1 seul round-trip) si un profilage ultérieur le justifie — consigné, non implémenté.

## D. Formule finale

```
couverture = round( 100 × occurrences_couvertes / occurrences_totales )
```

- `occurrences_couvertes` = `COUNT(word_occurrences) WHERE word_id IN (formes comprises)`.
- `occurrences_totales` = `COUNT(word_occurrences)` — **lu en base, jamais hardcodé** (77 430 aujourd'hui).
- Résultat : entier 0..100, arrondi, borné. Corps vide → 0 (jamais `NaN`).

## E. Définition de « compris »

```
compris ⟺ user_word_progress.status ∈ { familiar, mastered }
```

- `new` / `learning` **ne comptent pas** (« vu ≠ compris »).
- Binaire, réutilise le modèle de progression existant (`lib/learning/progress.ts`). Aucun nouveau score.

## F. Architecture du calcul

```
getQuranCoverage(client, userId)
 ├─ (parallèle) COUNT(word_occurrences)                         → total
 ├─ (parallèle) user_word_progress.status IN (familiar,mastered)
 │              (filtré .eq("user_id", userId) + RLS)           → word_ids
 └─ COUNT(word_occurrences) WHERE word_id IN (word_ids)          → covered
     → computeCoveragePercent(covered, total)                    → { coveragePercent, coveredOccurrences, totalOccurrences }
```

- **3 requêtes** (2 vagues : `total ∥ progress` → `covered`), 0 récupération de lignes (`head: true`), 0 N+1, 0 table d'agrégation.
- Index utilisés : `word_occurrences_word_id_idx` (migration 0007) et le filtre `user_id` de `user_word_progress`.
- Erreur → `console.error` + retour `null` (l'UI affiche un état neutre, jamais un faux « 0 % »).

## G. Sécurité / RLS

- `user_word_progress` est protégé par RLS `auth.uid() = user_id` (migration 0016) ; la requête filtre **aussi** explicitement `.eq("user_id", userId)`.
- `word_occurrences` / `quran_words` : corpus public (RLS `using (true)`).
- **Isolation prouvée** (voir H) : utilisateur A ≠ B ≠ anonyme.

## H. Tests

### Unitaires (`tests/coverage.test.ts`) — 22 tests
- `isComprehendedStatus` : familiar/mastered comptent ; new/learning/inconnu ne comptent pas.
- `sumComprehendedOccurrences` : 0 compris → 0 ; forme unique → fréquence exacte ; familiar/mastered comptent ; learning ne compte pas ; somme multi-formes ; forme fréquente > forme rare ; **`الله` et `لِلَّه` distinctes (aucune fusion)** ; forme sans fréquence → 0 ; deux maps indépendants (isolation par construction).
- `computeCoveragePercent` : 0 compris → 0 ; calcul exact ; plafond curriculum 14 522/77 430 → 19 % ; arrondi entier ; corpus vide → 0 sans NaN ; toutes formes couvertes → 100 ; borné à 100 ; covered négatif → 0.

### DB / RLS (script réel, service role + anon key + JWT)
- Utilisateur A avec 2 formes comprises (34 + 33 occurrences) → `covered = 67` (= somme exacte attendue), 2 `word_ids`.
- Utilisateur B (aucune progression) → `covered = 0`.
- Anonyme (sans JWT) → `word_ids = 0` (RLS bloque toute lecture).
- Nettoyage : comptes supprimés, **0 résidu**.

### Résultats techniques
- `npx tsc --noEmit` ✅
- `npx eslint` ✅
- `npx vitest run` → **693/693** (671 + 22 nouveaux) ✅
- `npm run build` ✅

## I. Résultats

- Couverture **0 %** pour un utilisateur sans progression (vérifié E2E).
- Couverture **1 %** après un seul mot familier `فِى` (1 098 occurrences) (vérifié E2E).
- Aucune donnée existante modifiée ; aucun moteur pédagogique, onboarding, SRS, retry, session touchés.

## J. Performance

Mesures réelles (script, aller-retour réseau inclus) : **206–446 ms** pour les 3 requêtes, selon froid/chaud. Aucune récupération de lignes (`head: true`), donc le coût ne dépend pas du nombre d'occurrences, uniquement de la cardinalité du filtre (indexé). Le nombre de `word_ids` compris est borné par le curriculum (≤ 270 formes aujourd'hui), bien sous la limite `.in()` déjà utilisée ailleurs (`getSurahCatalog` passe déjà ~270 UUIDs).

## K. E2E (Playwright + Chrome, authentifié)

Scénario (390×844, fr-FR) :
1. Compte de test onboardé → login → `/dashboard`.
2. Carte « Ta compréhension » visible, **« ≈ 0 % »** (nouvel utilisateur), 0 erreur console.
3. Seed `فِى` (`familiar`) via service role.
4. Rechargement → **« ≈ 1 % »** + caption « 1 098 … 77 430 », recalcul confirmé.
5. **0 erreur console**, **aucun overflow horizontal**. Compte supprimé après (0 résidu).

## L. UX

Carte `QuranCoverageCard` sur le dashboard (design system Hikma existant) :

> **Ta compréhension** — **≈ 1 %** du Coran
> Les mots que tu as compris couvrent 1 098 des 77 430 mots du texte coranique.

- Entier + « ≈ » (estimation, pas une mesure scientifique) ; pas de décimale.
- Accent doré discret (`border-hikma-gold-muted/40`) sur fond ivoire, nombre en teal — cohérent « doré = progression/récompense, teal = structure ».
- `null` (erreur) → carte omise (état neutre, dashboard intact) ; jamais un faux « 0 % ».
- `toLocaleString("fr-FR")` pour les grands nombres. Responsive, sans overflow (vérifié).

## M. Limites connues

- **Sémantique** : couverture **lexicale** pondérée par fréquence, pas une compréhension syntaxique/phrastique/contextuelle (documenté dans `lib/learning/coverage.ts` et la carte).
- **Plafond curriculum** : ~18,76 % tant que seules 270 formes sont enseignées (aucun plafond codé ; croîtra avec le curriculum).
- **Formes non enseignées** : au dénominateur, jamais au numérateur (honnête).
- **Pas de cache / table d'agrégation** (non nécessaire au volume actuel).

## N. Décision finale

`PHASE_37B_IMPLEMENTATION_COMPLETE`

La métrique de couverture coranique est implémentée, testée (693/693), validée en base (RLS/isolation), en navigateur (E2E authentifié avec recalcul) et intégrée au dashboard, sans migration, sans modification de données existantes, sans régression des Phases 36/onboarding.

**Aucun commit, aucun push.**
