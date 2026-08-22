# PHASE 24H-Q2-B — IMPLÉMENTATION DES EXERCICES DE DISCRIMINATION PHONÉTIQUE

STATUT = `PHONETIC_DISCRIMINATION_IMPLEMENTED`
DÉCISION = `READY_FOR_IMPLEMENTATION` (implémentée — Q2-B est une implémentation approuvée)

> Réutilise la compétence existante `audio_recognition` (décision 24H-Q2-A :
> `NOT_JUSTIFIED_AS_SEPARATE_SKILL`). **Aucune nouvelle compétence, aucune
> migration, aucune donnée importée, aucun STT, aucun micro.**

---

## 0. Baseline après implémentation

| Vérification | Résultat |
|---|---|
| `npm test` | **382/382** (366 existants + 16 nouveaux) |
| `npx tsc --noEmit` | **0 erreur** |
| `npm run lint` | **clean** |
| `npm run build` | **OK** |
| `verify:persistence` / `verify:rls` | non re-exécutés (DB/credentials) |

## 1. Ce qui a été créé

Un **nouveau type d'exercice** `PHONETIC_DISCRIMINATION` (1 type, pas 30) :

| Fichier | Rôle |
|---|---|
| `lib/exercises/types.ts` | `ExerciseType` + `"PHONETIC_DISCRIMINATION"` (14 types) |
| `lib/learning/phonetics.ts` | export `allPhoneticMarks()` (source unique des définitions de marques) |
| `lib/exercises/generators/phonetic-discrimination.ts` | générateur déterministe + `generatePhoneticDiscriminationSet` borné |
| `lib/exercises/generators/index.ts` | enregistrement du générateur |
| `lib/learning/skills.ts` | `skillForExerciseType` : `PHONETIC_DISCRIMINATION → audio_recognition` |
| `lib/exercises/engine.ts` | `validateAnswer` : explication pédagogique du trait (correct/incorrect) |
| `components/learn/exercises/index.tsx` | composant `PhoneticDiscriminationExercise` + registre |
| `app/(app)/learn/[slug]/page.tsx` | ajout borné (max 3/leçon) des exercices de discrimination |
| `lib/exercises/index.ts` | exports publics (helper + constantes) |
| `tests/phonetic-discrimination.test.ts` | 16 tests unitaires |

## 2. Caractéristiques phonétiques réellement couvertes

Catalogue retenu (caractéristiques **audibles**, détectées de façon fiable,
compréhensibles par un débutant) — dans l'ordre de priorité pédagogique :

| Trait | Symbole | Formes Al-Fatiha | Détectable | Enseignable |
|---|---|---|---|---|
| hamza | ء | 3 (إِيَّاكَ, وَإِيَّاكَ, أَنْعَمْتَ) | ✓ | ✓ |
| madda | آ | 1 (ٱلضَّآلِّينَ) | ✓ | ✓ |
| shadda | ◌ّ | 8 | ✓ | ✓ |
| soukoun | ◌ْ | 11 | ✓ | ✓ |
| tanwīn | ◌ً | 0 dans Al-Fatiha | ✓ | ✓ (général) |

**Exclues de la discrimination à l'écoute** (documenté dans le générateur) :
- `dagger_alef` — voyelle longue « ā » identique à l'oreille au madda/alef plein :
  distinction **orthographique**, pas un son discriminable ;
- `wasla` — alif de liaison **silencieux** (absence de coup de glotte), notion
  trop fine pour un débutant.

## 3. Mots réels utilisables

**23 / 26 formes d'Al-Fatiha** produisent un exercice (au moins une
caractéristique retenue + audio 26/26). Matrice complète :
`tmp/phase24hq2-b/candidate-matrix.json`.

## 4. Mots exclus et pourquoi

| Mot | Raison |
|---|---|
| مَـٰلِكِ (1:4) | seul trait = `dagger_alef` (orthographique, exclu) |
| صِرَٰطَ (1:7) | seul trait = `dagger_alef` (orthographique, exclu) |
| وَلَا (1:7) | aucune caractéristique retenue |

Ces exclusions sont **honnêtes** : pas de trait simulé, pas de paire inventée.

## 5. Distracteurs

Les distracteurs sont des caractéristiques **réellement ABSENTES** de la forme
arabe (extraites du catalogue via `detectMarks`), jamais un trait présent, jamais
deux bonnes réponses simultanées. La bonne réponse est en fin de liste (convention
déterministe du projet). `validateGeneratedExercise` garantit 1 seule bonne
réponse, pas de doublon, pas d'option vide.

## 6. Pourquoi chaque réponse est non ambiguë

Le générateur cible **une** caractéristique présente (première dans l'ordre de
priorité) et n'offre en distracteurs que des caractéristiques **absentes** → une
seule option est réellement présente dans la forme. La bonne réponse est toujours
dérivée du `word_id` ciblé (jamais inventée). Exemple `إِيَّاكَ` (hamza + shadda) :
cible hamza, distracteurs madda/soukoun/tanwīn (tous absents), shadda (présent)
**jamais** proposé en distracteur.

## 7. Aucune nouvelle compétence nécessaire

`PHONETIC_DISCRIMINATION` est mappé sur `audio_recognition` (canal d'écoute).
`SKILLS` reste à 8 valeurs. Test de garde : `SKILLS` ne contient pas
`pronunciation_recognition`.

## 8. Aucune migration nécessaire

Le `CHECK(skill IN 8)` (migration 0023) est inchangé. Aucune colonne, table, ni
valeur ajoutée.

## 9. Alimentation de `audio_recognition`

Chemin réel (inchangé) : `exercise → validateAnswer → result → scoreAnswer →
SkillAttempt{skill: "audio_recognition"} → submitSkillAttempts → persistSkillAttempt
→ skillMasteryLevel`. Le nouveau type emprunte exactement le chemin des autres
exercices d'écoute (AUDIO_TO_WORD / WORD_TO_AUDIO).

## 10. Intégration mastery / SRS

- **Mastery** : `audio_recognition` uniquement, aucune règle modifiée
  (`skillMasteryLevel` inchangé). La rétention n'est pas déclenchée par cette
  compétence (réservée au rappel) — comportement existant conservé.
- **SRS** : inchangé (par mot, Leitner). Le nouveau type n'ajoute aucun scheduling.

## 11. Intégration `lesson_sessions` (24E)

Le nouvel exercice est ajouté **après** la séquence de base, de façon
**déterministe et bornée** (max 3/leçon). La séquence complète est reconstruite
au chargement ; `clampSessionIndex` borne l'index de reprise → aucune modification
de l'architecture de session (index, réponses, reprise, refresh, fin de leçon).

## 12. Intégration fin de leçon (24H-LESSON-COMPLETION-FAILURE-B)

Aucun impact : le type est un QCM binaire noté, ses `attempts` rejoignent
`WordAttempts` existants. `success/partial/failed/retry/savedWordIds/pendingWordIds`
inchangés. Aucun catch générique réintroduit.

## 13. Activité (24H-ACTIVITY-IDEMPOTENCY)

Aucun impact : l'activité est dérivée de `lesson_words` (côté serveur) et des
journaux insert-only. Une double soumission ne crée ni doublon ni double
progression (mécanisme inchangé).

## 14. Accessibilité / mobile

Boutons ≥ 48 px (`min-h-12`), `role="radiogroup"` + `aria-checked`, feedback
`aria-live` (primitive `ExerciseFeedback`), RTL via `ArabicText` (Amiri) pour les
symboles, LTR français, focus visible. **Alternative visuelle** : bouton
« Afficher le mot (alternative visuelle) » → révèle la forme arabe (jamais de
dépendance exclusive au son). Grille `sm:grid-cols-2` responsive.

## 15. Risques persistants

- `madda` (1 forme) et `hamza` (3 formes) ont une couverture fine dans Al-Fatiha ;
  `tanwīn` n'apparaît pas. Acceptable pour un MVP borné, à réévaluer lors de
  l'extension aux autres sourates.
- L'exercice est placé en **fin de séquence** (append borné) ; une insertion
  chirurgicale au milieu de la ronde audio est une amélioration future.
- L'alternative visuelle révèle la forme (donc la réponse lisible) : c'est
  volontaire et opt-in, réservé aux utilisateurs qui ne peuvent pas écouter.

## 16. Arrêt obligatoire

Aucun démarrage de 24H-Q3, 24I, 24J, 24K, 23G, ni extension aux 114 sourates.
