# PHASE 24I — Implémentation du moteur d'explication linguistique MASAQ (Al-Fātiḥah)

**Décision finale : `A — IMPLEMENTATION_SUCCESSFUL_READY_FOR_REVIEW`**

Cette phase est la **première intégration runtime de MASAQ**, limitée au moteur
d'explication pédagogique (« Comprendre pourquoi », après réponse incorrecte ou
ambiguë) et à **Al-Fātiḥah uniquement**. MASAQ reste une couche d'**EXPLICATION** :
aucun effet sur le grading, le scoring, le SRS, la maîtrise, la progression, le
curriculum, la résolution lexicale, le word bank ni la génération des exercices.

---

## 1. Architecture utilisée

Principe (Phase 24H) : `existing explanation + linguistic evidence = rich pedagogical explanation`,
**sans** créer de seconde architecture parallèle. Séparation stricte en trois couches :

| Couche | Fichier | Rôle |
|---|---|---|
| **1. Données brutes** | `lib/learning/queries.ts` → `getWordLinguisticEvidence` | Lecture seule de `linguistic_occurrences` + `linguistic_segments`, filtrée `surah_number = 1`, jointe sur `word_occurrences.word_id` (batch, aucun N+1) |
| **2. Normalisation** | `lib/linguistic/explanation.ts` → `buildLinguisticExplanation` + tables de correspondance | Fonctions **pures** transformant les tags MASAQ en concepts pédagogiques français |
| **3. Présentation** | `components/ui/hikma-explanation.tsx` | Affiche uniquement des textes pédagogiques — jamais les tags MASAQ bruts |

**Point d'injection minimal** : `components/learn/exercises/pedagogical-feedback.ts`
appelle `buildLinguisticExplanation(exercise.metadata.linguisticEvidence)` et ajoute
le champ `linguistic` (optionnel) à `HikmaExplanationData`. La page de leçon
(`app/(app)/learn/[slug]/page.tsx`) attache `linguisticEvidence` à chaque exercice,
réutilisant les données déjà lues (aucune requête pédagogique parallèle).

### Fichiers modifiés / créés

**Créés**
- `lib/linguistic/explanation.ts` — normalisation pédagogique pure.
- `tests/linguistic-explanation.test.ts` — 23 tests.

**Modifiés**
- `lib/learning/queries.ts` — `getWordLinguisticEvidence` (lecture seule).
- `lib/exercises/types.ts` — `metadata.linguisticEvidence?: LinguisticEvidence | null` (additif).
- `components/learn/exercises/pedagogical-feedback.ts` — injection.
- `components/ui/hikma-explanation.tsx` — rendu des blocs.
- `app/(app)/learn/[slug]/page.tsx` — câblage de la requête + metadata.

**Non modifiés** (contrat préservé) : grading, scoring, SRS, mastery, progression,
curriculum, `resolveWordMeanings`, `buildWordBank`, `generateExercise(s)`, générateurs,
review, session, skill-progress.

---

## 2. Données MASAQ consommées

| Donnée | Colonnes lues | Usage |
|---|---|---|
| Segmentation | `segment_text / morph_type / segment_kind / morph_tag` | bloc « Décomposition » |
| Stem | segment `Stem` → `morph_tag` | bloc « Identification » (catégorie) |
| POS | `morph_tag` du noyau | identité grammaticale |
| Cas | `case_mood` (après retrait de `INVARIABLE`) | bloc « Forme » |
| Syntaxe | `syntactic_roles` (après retrait des rôles de particules) | bloc « Fonction » |

## 3. Données MASAQ volontairement non consommées

- `masaq_gloss_en` : **evidence uniquement** — jamais affichée, jamais traduite en FR.
- `lemma_mapping_status` : **documentaire** — jamais converti en assertion de famille
  (le type `LinguisticBlock` ne comporte d'ailleurs pas de variante `lemma`).
- `root` / `pattern` : **ABSENT_DATA** (FUTURE_WORK).
- `Invariable_Declinable`, `Possessive_Construct`, `Case_Mood_Marker`, `Phrase`,
  `Phrasal_Function` : **ABSENT_DATA** (non importés en 24G).

---

## 4. Règles d'honnêteté linguistique (`AVAILABLE ≠ INFERABLE`)

- Donnée absente → bloc **omis** (jamais inventé).
- Donnée ambiguë (plusieurs cas / plusieurs rôles) → bloc **omis** (jamais affirmé).
- Donnée non vérifiée (mapping de lemme MASAQ) → aucune assertion de famille.
- Tag inconnu → ni identité, ni morphologie, ni syntaxe (retour `null`, fallback classique).

---

## 5. Anti-répétition (PERTINENCE > QUANTITÉ)

Chaîne de priorité : `décomposition → identité → morphologie → syntaxe`,
**plafonnée à 2 blocs** complémentaires. Distribution réelle sur les 26 mots
d'Al-Fātiḥah (smoke test sur la base) :

| Combinaison | Effectif |
|---|---|
| `decomposition + identity` | 17 |
| `identity + morphology` | 7 |
| `decomposition + morphology` | 2 |

Trois profils distincts — plus de « Le mot signifie X » systématique. Exemples réels :

- `بِسْمِ` → **Décomposition** (بِـ = préposition + اِسْمِ = noyau) + **Identification** (nom).
- `رَبِّ` → **Identification** (« c'est un nom ») + **Forme** (« au génitif »).
- `عَلَيْهِمْ` → **Décomposition** (عَلَيْ + هِمْ = suffixe pronominal) + **Forme**.

---

## 6. Exemples avant / après

**Avant (24H)** : Sens → Lemme → Contexte → Audio.

**Après (24I)**, pour un mot segmenté (ex. `الرَّحْمَنِ`) :
```
Pourquoi ?
  Bonne réponse : « le Tout Miséricordieux »
  Décomposition : الـ (article défini) + رَحْمَن (noyau)
  Identification : c'est un nom propre (nom divin)
  Sens : « ... » (glose éditoriale, inchangée)
  ▶ Écouter le mot (Muʿallim, inchangé)
```
Pour un mot simple (ex. `يَوْمِ`) :
```
  Identification : c'est un nom
  Forme : ici, le mot est au génitif (complément du nom ou après préposition)
```
Aucun tag brut (`NOUN_PROP`, `GENITIVE`, `DET`…) n'est exposé à l'utilisateur.

---

## 7. Tests

- Nouveau fichier : `tests/linguistic-explanation.test.ts` — **23 tests**.
- Couverture : mot sans données (fallback), segmentation, préfixe, suffixe pronominal,
  POS, cas, syntaxe, combinaison plafonnée, données absentes/ambiguës/non vérifiées,
  `AVAILABLE ≠ INFERABLE`, LEMMA_RELATION conservée + enrichie, audio présent/absent,
  réponse correcte → aucune explication d'erreur, rendu RTL sans tags bruts.
- Suite complète : **514 tests / 41 fichiers** (baseline 24G = 491/40 ; +23 attendus).

## 8. Vérifications

| Vérification | Résultat |
|---|---|
| `npx tsc --noEmit` | 0 erreur |
| `npm run lint` | PASS |
| `npm run build` | PASS |
| Smoke DB (`getWordLinguisticEvidence`) | 26/26 mots résolus (segments/cas/syntaxe/stem 100 %) |
| Smoke serveur (`GET /learn/basmala`) | HTTP 200, 0 marqueur d'erreur |

## 9. Non-régression

| Valeur | Avant | Après |
|---|---|---|
| Leçons Al-Fātiḥah | 8 | 8 |
| Formes | 26 | 26 |
| Occurrences | 29 | 29 |
| Audios | 26 | 26 |
| quran_words / word_occurrences / ayahs / translations | 21 296 / 77 430 / 6 236 / 24 944 | identiques |
| lemmas / word_translations / lemma_translations / word_lemma_mapping | 32 / 70 / 32 / 184 | identiques |
| linguistic_occurrences / segments | 29 / 56 | 29 / 56 |

Aucune écriture DB, aucun seed, aucun import. `FATIHAH_REFERENCE_LOCKED` préservé.

---

## 10. Limitations

- **Racine et schème** : toujours `FUTURE_WORK` (aucune donnée, aucune déduction).
- **Morphologie** : limitée au **cas** importé (les autres colonnes MASAQ restent `ABSENT_DATA`).
- **Composé préposition + pronom** (ex. `عَلَيْهِمْ`) : le cas attribué correspond au
  pronom attaché ; formulation acceptable mais à affiner ultérieurement.
- **Validation navigateur interactive** : le serveur rend 200 sans erreur et le rendu
  du bloc est couvert par test `react-dom/server`, mais le parcours manuel complet
  (cliquer les 8 leçons, provoquer ≥5 erreurs, vérifier 390×844 / 1280×720 / RTL /
  console / overflow) reste une **étape manuelle à effectuer**.

---

## 11. Prochaines étapes (décidées séparément, conformément au §« À LA FIN »)

1. Validation navigateur interactive manuelle.
2. Décision séparée pour l'extension multi-sourates.
3. Phase dédiée root/pattern (source auditée uniquement).

**La phase s'arrête ici.**
