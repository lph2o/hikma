# PHASE 50 — AL-MĀʿŪN (107) — DÉBLOCAGE ÉDITORIAL CIBLÉ

**Statut final : `PHASE_50_AL_MAUN_READY`**

> Phase de données lexicales + seed curriculum uniquement (workflow 40C/41B/42B).
> Aucun moteur, resolver, SRS, mastery, Daily Plan, coach, exercice, onboarding,
> explication de sens, MASAQ, schéma ni migration modifié. Aucun commit, aucun push.

---

## 1. Contexte verrouillé (respecté)

Conformément au brief Phase 50 : aucune nouvelle fonctionnalité, aucun changement
architectural, aucun changement de moteur. Onboarding V2 = READY (aucune V3) ;
explications de sens = cours/feedback post-réponse (non déplacées) ; MASAQ = couche
passive ; SRS = seule source de priorité des révisions ; coach adaptatif = DEFERRED ;
fréquence / gamification / grammaire / tafsir / Médine = REJECTED ; racines/schèmes =
FUTURE_WORK ; features Quran Progress = non converties en roadmap.

Priorité suivie : **DONNÉES LEXICALES FR → SOURATES COURTES READY → CURRICULUM →
STABILISATION**.

---

## 2. Audit READ-ONLY des candidates (données DB réelles, jamais d'estimation)

Sourates courtes non READY (90–114), source de vérité = DB actuelle :

| Sourate | Ayahs | Formes | FR forme | FR lemme | EN-only | Gloses manquantes | Parcours | Statut |
|---|---:|---:|---:|---:|---:|---:|---|---|
| 90 Al-Balad | 20 | 73 | 27 | 2 | 44 | 46 | — | HORS_CATALOGUE |
| 91 Ash-Shams | 15 | 48 | 7 | 1 | 40 | 41 | — | HORS_CATALOGUE |
| 92 Al-Layl | 21 | 62 | 14 | 1 | 47 | 48 | — | HORS_CATALOGUE |
| **93 Ad-Duhaa** | 11 | 36 | 34 | 0 | 2 | 2 | `quran-surah-93` | IN_PREPARATION |
| **94 Ash-Sharh** | 8 | 24 | 23 | 0 | 1 | 1 | `quran-surah-94` | IN_PREPARATION |
| 96 Al-'Alaq | 19 | 59 | 13 | 3 | 43 | 46 | — | HORS_CATALOGUE |
| 98 Al-Bayyinah | 8 | 79 | 21 | 2 | 56 | 58 | — | HORS_CATALOGUE |
| **105 Al-Fil** | 5 | 22 | 21 | 0 | 1 | 1 | `quran-surah-105` | IN_PREPARATION |
| **107 Al-Ma'un** | 7 | 23 | 22 | 0 | 1 | 1 | `quran-surah-107` | IN_PREPARATION |
| **110 An-Nasr** | 3 | 18 | 15 | 2 | 1 | 1 | `quran-surah-110` | IN_PREPARATION |

*(Les sourates 95, 97, 99, 100, 101, 102, 103, 104, 106, 108, 109, 111, 112, 113, 114
sont déjà READY ; 1 = REFERENCE.)*

**Constat clé (formes manquantes des 5 IN_PREPARATION) :**

| Sourate | Forme(s) manquante(s) | word_id | Occ. dans la sourate |
|---|---|---|---|
| 93 | `رَبِّكَ`, `رَبُّكَ` | `c90fbdb2…`, `69821ea7…` | 1 + 2 |
| 94 | `رَبِّكَ` | `c90fbdb2…` | 1 |
| 105 | `رَبُّكَ` | `69821ea7…` | 1 |
| 107 | `ٱلْمَاعُونَ` | `ac23eaed…` | 1 |
| 110 | `رَبِّكَ` | `c90fbdb2…` | 1 |

**Seulement 3 `word_id` distincts couvrent les 5 IN_PREPARATION** : `رَبِّكَ`
(partagé 93/94/110), `رَبُّكَ` (partagé 93/105) et `ٱلْمَاعُونَ` (unique à 107).

---

## 3. Choix justifié : 107 Al-Māʿūn

**Critères du brief (ordre de priorité) :**

1. **Roadmap éditoriale existante** — Al-Māʿūn (107) est la SEULE sourate
   IN_PREPARATION explicitement nommée par la roadmap : Phase 46 §16.2 et Phase 47 §17
   (« compléter la 1 forme EN-only de Al-Māʿūn (107) pour la faire passer de
   IN_PREPARATION à READY »).
2. **Faible coût** — 1 seule glose manquante (coût minimal, à égalité avec 94/105/110,
   inférieur aux 2 gloses de 93).
3. **Sourate courte** — 7 ayahs, 23 formes distinctes.
4. **Aucun blocage juridique/data** — workflow PD standard (Kazimirski 1860),
   aucune source nouvelle, aucun contenu protégé.
5. **Gain réel de couverture** — 107 est déjà seedée (parcours/leçons/lesson_words
   présents) : l'unique glose fait passer la sourate de `IN_PREPARATION` (non
   démarrable) à `READY` (démarrable dans le catalogue). Gain immédiat, zéro seed nouveau.
6. **Cohérence du workflow** — 40C/41B/42B exactement.

**Pourquoi 107 plutôt que 94/105/110 (1 forme chacune) ou 93 (2 formes) :**
- `رَبِّكَ` / `رَبُّكَ` sont des `word_id` PARTAGÉS entre 93, 94, 105 et 110. Écrire leur
  glose au titre d'une seule sourate aurait modifié *incidemment* la couverture FR de
  plusieurs autres sourates, ce qui contredit la contrainte « seules les données
  lexicales et curriculum de CETTE sourate peuvent changer ».
- `ٱلْمَاعُونَ` est un `word_id` **unique à 107** : aucun effet de bord inter-sourates.
  Le périmètre « une seule sourate » reste donc strictement propre.
- 107 est en outre la seule candidate IN_PREPARATION citée par la roadmap (critère n°1).

Les autres IN_PREPARATION (93/94/105/110, formes `رَبِّكَ`/`رَبُّكَ`) constituent un
chantier de finition distinct, à traiter dans des phases ultérieures (une sourate par
phase, avec la gestion explicite du partage des word_id).

---

## 4. État avant (audit READ-ONLY, confirmé DB)

| Élément | Valeur |
|---|---:|
| Ayahs | 7 |
| Occurrences | 25 |
| Formes distinctes | 23 |
| Gloses FR forme validées | 22 |
| Résolutions via lemme FR | 0 |
| **Formes manquantes** | **1** (`ٱلْمَاعُونَ`, 107:7) |
| Curriculum (path / unit / lessons / lesson_words) | 1 / 1 / 7 / 47 |

---

## 5. Glose ajoutée (1)

| Forme | Glose Hikma | Type | Note sensible |
|---|---|---|---|
| ٱلْمَاعُونَ | le moindre secours / l'ustensile | lexical | **SENSIBLE** — polysémie |

**Arbitrage éditorial `ٱلْمَاعُونَ` :**
- Contexte 107:7 `وَيَمْنَعُونَ ٱلْمَاعُونَ` (« et refusent le mâʿūn »).
- Convergence des 4 traductions alignées sur les MÊMES ayahs :
  - Hamidullah FR : « l'ustensile » ;
  - Kazimirski FR : « l'aumône » ;
  - Sahih EN : « simple assistance » (small kindnesses) ;
  - Piccardo IT : « ce qui est utile » (note : prêter l'ustensile commun, seau/marteau).
- Référence lexicale Kazimirski — Dictionnaire arabe-français (1860), domaine public :
  مَاعُون = ustensile de ménage / secours / aumône.
- **Noyau retenu** : « le moindre secours / l'ustensile » (polysémie conservée, sur le
  précédent éditorial `بِٱلدِّينِ` → « la rétribution / la religion »).
- Décision : **1/1 `VALIDATED`, 0 `NEEDS_REVIEW`, 0 `REJECT`**.

Écriture : `word_translations` (`language='fr'`, `source_id` = « Hikma — lexique
éditorial » `79e6412e-e349-4fe5-b29b-108237375a2d`, `is_validated=true`,
`validated_at` horodaté, `editorial_notes` = workflow + décision). **0 UPDATE,
0 DELETE, aucune glose existante modifiée, aucune source créée.**

---

## 6. Résultat `resolveWordMeanings`

Exercice du résolveur réel (code non modifié) : **23/23 lang=`fr`**, 0 fallback EN.

## 7. Résultat `classifySurahReadiness`

`classifySurahReadiness(107, 100 %)` → **`READY`**.

> Note de vérification : l'appel canonique `getSurahCatalog` (scan complet des 21
> parcours) a rencontré un échec réseau transitoire « fetch failed » sur la requête
> `word_lemma_mapping` en `.in()` pleine-catalogue (URL très longue). La readiness de
> 107 est confirmée par le chemin déterministe requis par le brief
> (`resolveWordMeanings` 23/23 + `classifySurahReadiness(107,100%)=READY`) **et** par
> lecture DB directe (parcours `quran-surah-107` présent, 23/23 formes FR validées).
> Aucun code modifié (contrainte de la phase).

## 8. Seed curriculum

- `seed:multisurah -- --surahs=107` (après `--dry-run` : 7 leçons).
- 107 était déjà seedée → seed **idempotent** : **1 learning_path** `quran-surah-107`,
  **1 unit**, **7 leçons publiées** (`surah-107-ayah-1` … `-7`), **47 lesson_words**.
- 0 doublon de position, 0 mot étranger (23/23), 0 leçon hors verset.

## 9. Compteurs DB avant/après

| Compteur | Avant | Après | Delta |
|---|---:|---:|---:|
| word_translations FR validées | 414 | 415 | **+1** |
| learning_paths | 21 | 21 | 0 |
| units | 21 | 21 | 0 |
| lessons | 138 | 138 | 0 |
| lesson_words | 933 | 933 | 0 |

## 10. Tables verrouillées inchangées

`word_explanations=13` · `word_explanation_contexts=1` · `linguistic_occurrences=413` ·
`linguistic_segments=796` · `lemma_translations=32` · `lemmas=32` ·
`word_lemma_mapping=184` · `sources=6` · `quran_words=21296` · `word_occurrences=77430` ·
`ayahs=6236` · `translations=24944`.

## 11. Tests

- `npx tsc --noEmit` ✅ (0 erreur)
- `npx eslint .` ✅ (0 erreur)
- `npx vitest run` → **733/733** (55 fichiers) ✅ — baseline identique, aucun test modifié
- `npm run build` ✅ (Next.js 16.3.0, routes complètes)

## 12. Idempotence

- Ré-exécution de l'écriture : `0 insérée(s), 1 déjà présente(s)`.
- Ré-exécution du seed : `✅ quran-surah-107 · 7 leçons` (état stable, aucun nouveau
  parcours/unité/leçon/lesson_word).
- 0 doublon de position, 0 doublon de glose (contrainte `word_id, language, source_id`).

## 13. Fichiers créés

- `PHASE_50_AL_MAUN_EDITORIAL_UNLOCK.md`
- `tmp/phase50-audit.cjs` · `tmp/phase50-audit.json`
- `tmp/phase50-before.cjs` · `tmp/phase50-before.json`
- `tmp/phase50-write.cjs` · `tmp/phase50-verify-resolver.ts`

## 14. Fichiers de production modifiés

**Aucun.** Phase 100 % données + seed ; 0 fichier moteur/produit touché.

## 15. Confirmation moteurs non touchés

Resolver · SRS · mastery · Daily Plan · coach (45C DEFERRED) · onboarding V2 ·
explications 44B · MASAQ (passif) · exercices · grading · schéma · migrations —
**aucun modifié**. Aucune autre sourate modifiée. Aucun commit, aucun push.

---

## Verdict final

**`PHASE_50_AL_MAUN_READY`**

1/1 glose validée et écrite (idempotent), 23/23 FR (100 %), `READY` confirmé par
`resolveWordMeanings` + `classifySurahReadiness`, seed 107 idempotent (7 leçons,
47 lesson_words, déjà présents), catalogue inchangé (21 parcours) mais 107 passe
`IN_PREPARATION → READY`, tables verrouillées inchangées, tsc/eslint/vitest 733/build
verts, aucun moteur modifié.

**STOP** — aucune Phase 51 lancée automatiquement.
