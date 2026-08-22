# PHASE 60 — AUDIT MASAQ + EXPLICATIONS DES SOURATES 91 / 87 / 96

**Statut : READ-ONLY strict — aucune écriture.**
**Verdict : `PHASE_60_MASAQ_EXPLANATIONS_GAPS_FOUND`**

---

## A. Baseline réelle (DB fait autorité)

| Compteur | Réel DB | Réf. Phase 59 | Conforme |
|---|---:|---:|---|
| `quran_words` | 21 296 | 21 296 | ✅ |
| `word_occurrences` | 77 430 | 77 430 | ✅ |
| `ayahs` | 6 236 | — | ✅ |
| `word_translations` | 538 | 538 | ✅ |
| `translations` | 24 944 | 24 944 | ✅ |
| `learning_paths` / `units` / `lessons` / `lesson_words` | 24 / 24 / 191 / 1 307 | 24 / — / — / — | ✅ (24 parcours = 1 REFERENCE + 23 READY, 96 READY) |
| `linguistic_occurrences` | 413 | — | ✅ |
| `linguistic_segments` | 796 | — | ✅ |
| `linguistic_lemmas` / `linguistic_roots` | 0 / 0 | — | ✅ (vides, comme conçu) |
| `word_explanations` | 13 (13/13 validées FR) | — | ✅ |
| `word_explanation_contexts` | 1 (validé) | — | ✅ |
| `sources` / `lemmas` / `word_lemma_mapping` | 6 / 32 / 184 | 6 / 32 / 184 | ✅ |

Tests baseline : tsc ✅ · eslint ✅ · **vitest 743/743** ✅ · build ✅.

## B. Modèle réel MASAQ

- **Tables** : `linguistic_occurrences` (1:1 par `word_occurrence_id` × source), `linguistic_segments` (préfixe/Stem/suffixe par occurrence), `linguistic_lemmas`/`linguistic_roots` (vides, FUTURE_WORK).
- **Source** : `sources` type `linguistic`, name `MASAQ`, version `v2`.
- **Critère « exploitable par le moteur pédagogique »** : l'application consomme MASAQ via `getWordLinguisticEvidence(client, wordIds, surahNumber)` (`lib/learning/queries.ts`), qui filtre `linguistic_occurrences.surah_number` **par sourate** et joint sur `word_occurrences.word_id`. Une occurrence MASAQ est valide si son `alignment_status` est `EXACT` / `EXACT_ORTHOGRAPHIC`. **Aucune notion de publication distincte** : la présence d'une occurrence alignée = disponibilité.
- **Important (Phase 24F/26) :** la couche MASAQ a été importée **isolément pour un périmètre fixe de sourates** (voir G). Elle est STRICTEMENT passive : aucun effet sur le grading, le SRS, la maîtrise, le word bank ni la génération des exercices.

## C. Modèle réel explanations

- **Tables** : `word_explanations` (explication pédagogique **par FORME** — `word_id`), `word_explanation_contexts` (override optionnel **par ayah**).
- **Critère « active »** : `is_validated = true` + `language = 'fr'` + `validated_at` non nul (invariant de la migration 0031).
- **Consommation runtime** : `getValidatedWordExplanations` + `getValidatedWordExplanationContexts` → `resolveSenseExplanation` (`lib/learning/sense-explanation.ts`) → champ `senseExplanation` des exercices → bloc « Pourquoi ce sens ? » dans `components/learn/exercises/pedagogical-feedback.ts` + `components/ui/hikma-explanation.tsx`.
- **Règle explicite** : une forme PEUT légitimement n'avoir AUCUNE explication (absence ≠ erreur). L'explication générique est rattachée au `word_id` (réutilisable entre sourates) ; le contexte précise par ayah sans jamais contredire.

## D. Audit 91 — Ash-Shams (15 ayahs)

| Sourate | Ayahs | Avec MASAQ | Sans MASAQ | MASAQ tot. | Validés | Avec explication | Explications tot. |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 91 | 15 | **0** | **15** | **0** | 0 | 2 ayahs (via `مَن` partagé) | 2 |

- 0 occurrence MASAQ (s91 n'est pas dans le périmètre MASAQ importé).
- 2 explications « visibles » : il s'agit de l'explication générique du **word_id partagé `مَن`** (« Celui qui, quiconque : pronom relatif indéfini… »), **écrite pour la sourate 101** — propagée par mot partagé, **pas spécifique à 91** (aucune explication écrite pour une forme propre à 91).
- 0 doublon, 0 association incorrecte (les seules données présentes sont correctement rattachées à leurs word_ids).

## E. Audit 87 — Al-Aʿlā (19 ayahs)

| Sourate | Ayahs | Avec MASAQ | Sans MASAQ | MASAQ tot. | Validés | Avec explication | Explications tot. |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 87 | 19 | **0** | **19** | **0** | 0 | 2 ayahs (via `مَن` partagé) | 2 |

- 0 occurrence MASAQ (hors périmètre MASAQ).
- 2 explications « visibles » = même explication générique partagée de `مَن` (origine 101). **0 explication spécifique à 87.** Le seed Phase 57 n'a créé ni MASAQ ni explication (vérifié indépendamment, comme demandé).

## F. Audit 96 — Al-ʿAlaq (19 ayahs)

| Sourate | Ayahs | Avec MASAQ | Sans MASAQ | MASAQ tot. | Validés | Avec explication | Explications tot. |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 96 | 19 | **0** | **19** | **0** | 0 | **0** | **0** |

- 0 occurrence MASAQ ; **0 explication** (ni spécifique, ni partagée). Le seed Phase 59 n'a créé ni MASAQ ni explication (vérifié indépendamment).

## G. Matrice par ayah + comparaison

Matrice détaillée : `tmp/phase60-ayah-matrix.csv` (57 lignes : 91×15, 87×19, 96×19 — toutes `no_masaq`, 0 explication contextuelle).

**Sourates historiquement équipées (périmètre MASAQ importé) — 100 % des ayahs couverts :**

| Sourate | Ayahs | Avec MASAQ | MASAQ tot. | Explications |
|---:|---:|---:|---:|---:|
| 1 Al-Fātiḥah (REFERENCE) | 7 | 7 | 29 | 0 |
| 93 Ad-Duhaa | 11 | 11 | 40 | 0 |
| 94 Ash-Sharh | 8 | 8 | 27 | 0 |
| 97 Al-Qadr | 5 | 5 | 30 | 4 |
| 101 Al-Qāriʿah | 11 | 11 | 36 | 11 |
| 108 Al-Kawthar | 3 | 3 | 10 | 0 |
| 112 Al-Ikhlāṣ | 4 | 4 | 15 | 0 |
| 114 An-Nās | 6 | 6 | 20 | 0 |

**Lecture :** 91/87/96 ne suivent PAS encore le modèle des sourates équipées : elles disposent du lexique (gloses FR) et du curriculum, mais d'**aucune donnée MASAQ** et d'**aucune explication spécifique** (seul le `مَن` partagé, écrit pour 101, est réutilisé sur 91/87). Le périmètre MASAQ en base = {1, 93, 94, 97, 101–106, 108–114} — 91/87/96 en sont absents.

## H. Utilisation UI / runtime (comportement en absence de données)

- **MASAQ absent** → `getWordLinguisticEvidence(96)` retourne un Map vide → `linguisticEvidence: null` → `buildLinguisticExplanation(null)` ne produit **aucun bloc** (décomposition/morphologie non affichées) ; `shortFeedbackCopy` n'utilise pas `hasDecomposition`. **Aucune erreur, aucun fallback inventé** : bloc omis silencieusement (principe `ABSENT_DATA`, « AVAILABLE ≠ INFERABLE »).
- **Explication absente** → `resolveSenseExplanation(undefined, undefined, ctx)` retourne `null` → le bloc « Pourquoi ce sens ? » est absent ; l'explication n'est **jamais requise** ni remplacée par une déduction. L'absence est un état valide (test `pedagogical-feedback-after-answer` ligne 232 : `senseExplanation ?? null`).
- **Conclusion :** aucune régression UI possible ; les sourates 91/87/96 fonctionnent avec des leçons « riches » (glose + contexte + audio) mais **sans** la couche de compréhension linguistique MASAQ ni les explications de sens spécifiques.

## I. Compteurs globaux + vérification READ-ONLY

- MASAQ global : **413 occurrences / 796 segments** (413/413 alignées valides sur le périmètre importé).
- Explications : **13 validées FR** (+1 contexte validé), toutes rattachées à des word_ids réels.
- **AVANT = APRÈS** : les compteurs ont été relus après l'audit — **identiques** (`read_only_verified: true`, 0 différence). Aucune écriture effectuée.

## J. Tests de non-régression

| Validation | Résultat |
|---|---|
| `npx tsc --noEmit` | ✅ 0 erreur |
| `npx eslint .` | ✅ 0 erreur |
| `npx vitest run` | ✅ **743/743** |
| `npm run build` | ✅ compilé, généré |

## K. Gaps détectés

1. **MASAQ : 0/53 ayahs de 91/87/96** (0 occurrence sur les 3 sourates) — gap total vs les sourates équipées (100 %).
2. **Explications spécifiques : 0** sur les 3 sourates. Seul `مَن` (explication écrite pour 101) est réutilisé sur 91/87 via word_id partagé ; 96 n'a rien.
3. Aucun doublon, aucune association incorrecte, aucun schéma ambigu — les modèles sont clairs et fonctionnels.

## L. Risques

- Aucun risque runtime : les couches sont passives et optionnelles (blocs omis, jamais d'erreur).
- Risque **produit** : les leçons de 91/87/96 n'offrent pas le même niveau de compréhension que 97/101 (décomposition morphologique, explications de sens) — incohérence d'expérience entre sourates.
- Risque **données** : si l'on veut équiper ces sourates, la source MASAQ v2 couvre-t-elle ces surahs ? (Vérification nécessaire avant tout import — hors périmètre Phase 60, aucun import réalisé.)

## M. Recommandation (aucune action effectuée)

- Phase ultérieure (hors audit) : **importer/étendre MASAQ** à 91/87/96 si la source le permet (workflow d'import isolé Phase 24G/27), puis **rédiger des explications de sens** pour les formes propres de chaque sourate via le workflow éditorial 4 traductions.
- Ne pas traiter l'absence comme une anomalie de données : le modèle le permet explicitement (« absence ≠ erreur »).

## N. Verdict final

**`PHASE_60_MASAQ_EXPLANATIONS_GAPS_FOUND`**

- 91/87/96 sont éditorialement débloquées (lexique 100 % FR, curriculum seedé, READY) mais **ne disposent d'aucune donnée MASAQ** (0 occurrence) et **d'aucune explication de sens spécifique** (0 sur 96 ; seul le word_id partagé `مَن` réutilise une explication écrite pour 101 sur 91/87).
- La séquence des Phases 55/57/59 a bien produit FORME → GLOSES FR → READY → CURRICULUM ; elle **n'a pas** produit MASAQ ni EXPLANATIONS (confirmé par le point critique de l'énoncé).
- Aucune écriture, aucune migration, aucun commit/push ; compteurs DB identiques avant/après audit.

**STOP.** Aucune Phase 61 lancée automatiquement.

---

## Artefacts

- `PHASE_60_MASAQ_EXPLANATIONS_AUDIT.md` (ce rapport)
- `tmp/phase60-masaq-explanations.json` (données complètes de l'audit)
- `tmp/phase60-ayah-matrix.csv` (matrice par ayah : 57 lignes)
- Script reproductible READ-ONLY : `tmp/phase60-verification.ts`
