# PHASE 20D — AL-FĀTIḤAH REFERENCE LOCK

**MODE : READ_ONLY · STRICTEMENT AUCUNE MODIFICATION**

**CODE_WRITES = 0 · DATABASE_WRITES = 0 · IMPORTS = 0 · MIGRATIONS = 0 · SEEDS = 0 · COMMITS = 0**

## 1. État final

`FATIHAH_REFERENCE_LOCKED`

L'audit de clôture confirme que **toutes** les conditions de verrouillage
définies dans les Phases 20A, 20B, 20C et 20C-C sont satisfaites. Le dernier
blocker identifié en Phase 20C-B (`LEMMA_RELATION` : glose et contexte omis
dans l'explication après erreur) a été corrigé en Phase 20C-C et validé en
navigateur réel (mobile `390×844` et desktop `1280×720`).

Aucune modification, écriture en base, migration, seed ou import n'a été
effectuée pendant cette phase. Les vérifications exécutées sont strictement
lecture-seule : lecture du code, lecture des JSON d'évidence, `npm test`
(tests unitaires, aucune base) et `npx tsc --noEmit`.

## 2. Critères vérifiés

| # | Critère | Verdict | Preuve |
|---|---|---:|---|
| 1 | 26 formes cohérentes | ✅ | `quran_words` distincts Al-Fātiḥah = 26 (`phase20a-hikma-master-context.json`, `phase23f-d-al-fatiha-final-matrix.json`) |
| 2 | 29 occurrences cohérentes | ✅ | `word_occurrences` Al-Fātiḥah = 29 (idem) |
| 3 | 8 leçons présentes | ✅ | `scripts/seed-curriculum.ts` : 8 slugs publiés, `total_lessons = 8` |
| 4 | 8 leçons accessibles | ✅ | Phase 20C-B : 8/8 chargées, mobile + desktop |
| 5 | objectifs pédagogiques cohérents | ✅ | objectif + difficulté 1→3 par leçon (`seed-curriculum.ts`) |
| 6 | exercices cohérents | ✅ | générateurs déterministes, `null` si donnée manquante, aucune donnée inventée |
| 7 | grading fonctionnel | ✅ | `lib/exercises/grading.ts` centralisé, `CORRECT/INCORRECT/AMBIGUOUS` |
| 8 | feedback fonctionnel | ✅ | états correct/incorrect/ambigu + réponse attendue |
| 9 | explication post-erreur fonctionnelle | ✅ | `HikmaExplanation` + fix 20C-C `LEMMA_RELATION` |
| 10 | glose fonctionnelle | ✅ | résolveur FORME > LEMME > EN (`lib/learning/language.ts`) |
| 11 | lemme/relation fonctionnelle lorsque disponible | ✅ | `getWordLemmaRelations` ; jamais de relation inventée |
| 12 | contexte réel fonctionnel | ✅ | `getWordAyahContexts` : verset réel + Hamidullah FR |
| 13 | audio 26/26 | ✅ | `word_audio` Muʿallim = 26/26 (`audio_coverage: "26/26"`) |
| 14 | RTL fonctionnel | ✅ | `ArabicText`, `dir="rtl"` observé (20C-B/20C-C) |
| 15 | responsive fonctionnel | ✅ | `390×844` et `1280×720` PASS |
| 16 | aucun overflow | ✅ | `scrollWidth == viewport` (20C-B/20C-C) |
| 17 | aucune erreur console | ✅ | console navigateur propre (20C-B/20C-C) |
| 18 | progression fonctionnelle | ✅ | `user_word_progress` + `lesson_sessions` (clé `user_id,word_id`) |
| 19 | SRS fonctionnel | ✅ | `review_items` + scheduler Leitner (clé `user_id,word_id`) |
| 20 | mastery fonctionnelle | ✅ | 8 compétences `user_word_skill_progress` (`lib/learning/skills.ts`) |
| 21 | aucune régression connue | ✅ | 445 tests / 37 fichiers re-exécutés, `tsc --noEmit` 0 erreur |
| 22 | aucune donnée inventée | ✅ | résolveur et générateurs ne retournent que du stocké ; racines/morphologie absentes non affichées |
| 23 | aucune dépendance critique non documentée | ✅ | dépendances Al-Fātiḥah documentées ; plus de fallback silencieux `surahNumber=1` |

**Résultat : 23 / 23 satisfaits.**

## 3. Lexique

- Résolveur **point unique** `lib/learning/language.ts` :
  `resolveWordMeanings` précédence **FORME > LEMME > EN**, `isFallback` explicite,
  provenance conservée, `isValidated` propagé.
- `buildWordBank` (Phase 20B) transmet les gloses de lemme (3ᵉ paramètre) :
  leçon, fiche mot et review résolvent désormais **la même glose**.
- 9 lemmes directs + mappings `safe` (183 globaux) ; 26 formes résolues en FR.
- **Racines :** `FUTURE WORK` — colonnes présentes mais 0 valeur live exploitable.
  **Non blocker** (aucune fonctionnalité actuelle ne prétend fournir l'analyse
  de racine).
- **Morphologie :** `FUTURE WORK` — aucune infrastructure démontrée.
  **Non blocker** (aucune fonctionnalité actuelle ne prétend la fournir).

## 4. Traductions

Sources existantes **intactes** (aucune modification, 28 lignes = 4 × 7 ayahs) :

| Source | resource_id | Langue | Rôle |
|---|---:|---|---|
| Muhammad Hamidullah | 31 | FR | source FR principale |
| Albert de Biberstein-Kazimirski 1869 | 9001 | FR | source FR principale |
| Sahih International | 20 | EN | contrôle |
| Hamza Roberto Piccardo | 153 | IT | contrôle |

Une traduction de verset n'est jamais utilisée comme glose mot-à-mot
(distinction sémantique Phase 5 conservée).

## 5. Gloses

- **25 gloses de forme** `word_translations` FR validées (source « Hikma — lexique éditorial »).
- **+ 1 forme couverte via le lemme** : `يَوْمِ` → glose de lemme « jour ».
- Total Al-Fātiḥah : **26/26 formes à glose FR résolue**.
- Les 4 gloses `lemma_translations` Kazimirski 1860 restent `is_validated = false`
  et sont invisibles au résolveur (aucune fuite du texte 1860).
- **Aucune nouvelle glose créée** dans cette phase (`DATABASE_WRITES = 0`).

## 6. Audio

- **26/26 audios Muʿallim** (`word_audio`, chemin `muallim/{uuid}.opus`, Storage
  `word-audio`), un par `word_id`, sans doublon.
- URL signées à la demande (TTL 1 h), jamais d'URL publique.
- `ayah_audio = 0` (documenté, non requis pour la référence).
- **Aucun nouvel audio.**

## 7. Exercices

Types disponibles : reconnaissance forme/sens, rappel forme→sens, rappel
sens→forme, audio, contexte, relation de lemme, phonétique, auto-évaluation
guidée. Générateurs déterministes depuis le word bank résolu ; ils renvoient
`null` lorsque la donnée requise manque (jamais d'exercice simulé). La séquence
visiteur est cumulative (révision plafonnée, Phase 23F-B).

## 8. Grading

Centralisé dans `lib/exercises/grading.ts`, **non modifié** par les Phases 20C
et 20C-C. Normalisation arabe contrôlée, variantes d'alef, réponse non
vocalisée, statut `AMBIGUOUS`, synonymes FR ordonnables. Pas de fuzzy matching,
pas de correction automatique de réponse partielle.

## 9. Feedback

États correct / incorrect / ambigu affichés ; bonne réponse et explication
courte après soumission. Ton non humiliant conservé. Le feedback consomme
`pedagogicalExplanation` pour les états incorrects disposant de données.

## 10. Explication

Flux : réponse → grading existant → feedback → réponse attendue →
« Comprendre pourquoi » (fermé par défaut) → sens / repère de famille /
contexte réel / audio si présents.

- `components/ui/hikma-explanation.tsx` : disponibilité
  `verified/partial/unavailable`, divulgation progressive.
- `components/learn/exercises/pedagogical-feedback.ts` : branche `LEMMA_RELATION`
  transmet maintenant `meaning`, `meaningValidated` et `context` (fix 20C-C),
  en plus de la relation de lemme et de l'audio.
- Aucune racine / morphologie / traduction / donnée linguistique inventée.
- L'ouverture d'une explication ne crée aucune tentative, score, révision,
  maîtrise ni progression.

## 11. SRS

`review_items` unique par `(user_id, word_id)`, scheduler Leitner réutilisé,
échéance `next_review_at`. Isolation utilisateur structurelle (RLS
`auth.uid()`). **Non modifié** par les Phases 20C / 20C-C.

## 12. Mastery

8 compétences (`lib/learning/skills.ts`) :
`form_recognition`, `meaning_recognition`, `form_to_meaning`,
`meaning_to_form`, `audio_recognition`, `context_recognition`,
`lemma_relation`, `retention`. Stockage `user_word_skill_progress`.
**Non modifiée** par les Phases 20C / 20C-C.

## 13. Progression

`user_word_progress` unique par `(user_id, word_id)` ; `lesson_sessions`
persiste position et résultats. Complétion de leçon fondée sur les mots
`is_new` (la révision n'est pas un critère). **Non modifiée** par les
Phases 20C / 20C-C.

## 14. RTL / Responsive

- RTL : arabe vocalisé lisible, attributs `dir="rtl"` observés, contenu FR LTR.
- Responsive : validé `390×844` (mobile) et `1280×720` (desktop).
- Aucun overflow horizontal (`scrollWidth == viewport`).
- Aucune erreur console navigateur (les messages « Failed to find Server
  Action » de 20C-B sont une observation runtime d'arrêt de serveur local, non
  reproduite en parcours).

## 15. Tests

Résultats 20C-C documentés, **re-vérifiés en lecture seule** pendant cette phase :

| Vérification | Résultat | Exécution Phase 20D |
|---|---|---|
| `npm test` | **445 passed / 37 files** | ✅ re-exécuté, identique |
| `npx tsc --noEmit` | **PASS (0 erreur)** | ✅ re-exécuté, identique |
| `npm run lint` | **PASS** | documenté 20C-C (non re-exécuté) |
| `npm run build` | **PASS** | documenté 20C-C (non re-exécuté) |

`verify:persistence` et `verify:rls` **non exécutés** : ils créent/suppriment
des utilisateurs temporaires et violeraient `DATABASE_WRITES = 0`. Derniers
résultats documentés : 13/13 et 44/44.

## 16. Blockers

**Aucun blocker.**

Éléments explicitement non blockers (documentés `FUTURE WORK`) :

- `ROOT = FUTURE WORK` — aucune valeur live fiable ; aucune fonctionnalité ne
  prétend fournir l'analyse de racine.
- `MORPHOLOGY = FUTURE WORK` — aucune infrastructure démontrée.
- `ayah_audio = 0` — non requis pour la référence mot-à-mot.
- Charge du parcours visiteur (43–86 exercices/leçon, Phase 20C) — décision
  éditoriale de curriculum distincte, plafonnée depuis (Phase 23F-B) ; ne
  bloque pas la déclaration technique de verrouillage.

## 17. Décision

```
FATIHAH_REFERENCE_LOCKED

STATUS = READ_ONLY
CODE_WRITES = 0
DATABASE_WRITES = 0
IMPORTS = 0
MIGRATIONS = 0
SEEDS = 0
COMMITS = 0
```

La référence Al-Fātiḥah est **verrouillée** et peut servir de base au chantier
multi-sourates contrôlé.

## 18. Phase suivante recommandée

**PHASE 21 — MULTI-SURAH PEDAGOGICAL GENERALIZATION**

À traiter séparément :

1. association `learning_path ↔ surah` ;
2. catalogue des parcours ;
3. suppression des dépendances implicites à Al-Fātiḥah ;
4. génération idempotente des parcours ;
5. isolation utilisateur ;
6. isolation sourate ;
7. mastery par sourate ;
8. préparation des autres sourates.

Aucun de ces éléments n'est implémenté dans la présente phase (READ_ONLY).

---

**Livrables**

- 📄 `PHASE_20D_FATIHAH_REFERENCE_LOCK_REPORT.md`
- 📄 `tmp/phase20d-fatihah-reference-lock.json`
