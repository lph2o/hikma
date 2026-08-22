# PHASE 24J — Implémentation du feedback pédagogique après chaque réponse

**Décision finale : `A — IMPLEMENTATION_SUCCESSFUL_READY_FOR_BROWSER_REVIEW`**

Variante UX retenue (Phase 24I) : **D — feedback court toujours présent + approfondissement optionnel**. Le grading reste l'autorité (CORRECT / INCORRECT / AMBIGUOUS) ; l'explication est une couche pédagogique/UI **indépendante du résultat**.

`DATABASE_WRITES = 0` — aucune migration, seed, import ni donnée modifiée.

---

## 1. État avant

- `ExerciseFeedback` ne rendait `HikmaExplanation` que si `!isCorrect`.
- Une réponse correcte n'affichait ni bonne réponse, ni audio, ni rappel, ni « Comprendre pourquoi ».
- `explanationData` était calculé pour toute réponse mais abandonné sur réussite.
- `isExplanationRelevant()` existait mais n'était pas branché.
- `RecallGrade` = CORRECT / INCORRECT / AMBIGUOUS (pas de PARTIAL).

## 2. Architecture modifiée

| Fichier | Responsabilité | Modification |
|---|---|---|
| `components/learn/exercises/pedagogical-feedback.ts` | logique pédagogique pure | `AnswerOutcome`, `shortFeedbackCopy` (anti-répétition), `isExplanationRelevant` indépendant du résultat |
| `components/learn/exercises/options-exercise.tsx` | `FeedbackPanel` | câblage outcome/shortRecall ; `correctContent` affiché aussi sur réussite |
| `components/ui/exercise.tsx` | `ExerciseFeedback` | feedback court toujours présent + bonne réponse + audio + rappel + « Comprendre ce mot » pour tout statut |
| `components/ui/hikma-explanation.tsx` | présentation | bouton « Comprendre ce mot », prop `showAudio` (anti-doublon) |

Flux : `QUESTION → réponse → grading (inchangé) → feedback court → approfondissement optionnel`.

## 3. Comportements

| Issue | Comportement |
|---|---|
| **CORRECT** | statut + **Bonne réponse** + **audio** + **rappel court** (varié) + **« Comprendre ce mot »** replié (`aria-expanded=false`) |
| **INCORRECT** | **Ta réponse** + **Réponse attendue** + rappel/construction + **« Comprendre ce mot »** ouvert (`aria-expanded=true`) |
| **AMBIGUOUS** | « À vérifier » + nuance conservée + formulations acceptées + « Comprendre ce mot » |
| **PARTIAL** | **FUTURE_WORK** — aucun statut PARTIAL dans le grading, jamais inventé |

## 4. Exemples réels observés (navigateur)

- **Correct** : « Très bien » + *Bonne réponse* « la louange » + 🔊 *Écouter le mot* + rappel « Bien vu. Regarde aussi comment ce mot est construit… » + *Comprendre ce mot* (replié).
- **Incorrect** : *Ta réponse* « merci » + *Réponse attendue* « la louange » + *Comprendre ce mot* (ouvert) → *Décomposition* + *Identification* + *Sens*.
- **Ambigu** (tests) : « À vérifier » + « Ta réponse est proche… » + *Comprendre ce mot*.

## 5. Anti-répétition

- **Correct** : varie selon les données — décomposition disponible → « regarde la construction » ; contexte disponible → « s'éclaire par le contexte » ; sinon « Bien vu : sens ».
- **Incorrect** : pointe la décomposition si disponible ; sinon aucun doublon (la « Réponse attendue » affiche déjà le sens).
- **Ambigu** : « Plusieurs formulations sont acceptées — dont … ».
- Aucun système de mémoire utilisateur (on utilise les données déjà présentes).

## 6. MASAQ

Chaîne inchangée : `getWordLinguisticEvidence → buildLinguisticExplanation → HikmaExplanation`. **2 blocs max** (décomposition > identité > morphologie > syntaxe), **aucun tag brut** affiché, racine/schème = `ABSENT_DATA`.

## 7. Vérifications

| Vérification | Résultat |
|---|---|
| Tests | **525 / 42 fichiers** (+11) |
| `npx tsc --noEmit` | 0 erreur |
| `npm run lint` | PASS |
| `npm run build` | PASS |
| Navigateur | 14 correct / 59 incorrect / 0 console error / 0 overflow / RTL ok |

**Navigateur détaillé** :
- CORRECT : 14/14 ont Bonne réponse + audio + rappel + « Comprendre ce mot » replié.
- INCORRECT : 59/59 ont Ta réponse + Réponse attendue + « Comprendre ce mot » ouvert.
- AMBIGUOUS : non déclenchable en headless (vocalisation libre précise requise) — couvert par tests unitaires.
- Mobile 390×844 et desktop 1280×720 : **aucun overflow**.
- Console : **0 erreur**.

## 8. Non-régression

8 leçons · 26 formes · 26 audios · couche linguistique 29/56 · corpus (21 296 / 77 430 / 24 944 / 32 / 70 / 32 / 184) — **toutes strictement identiques**. Grading / scoring / SRS / mastery / progression / curriculum **inchangés**. `FATIHAH_REFERENCE_LOCKED = TRUE`.

## 9. Problèmes connus

1. AMBIGUOUS non déclenché en navigateur headless (couvert par tests unitaires).
2. Le bloc Fonction (syntaxe) reste non surfacé sur Al-Fātiḥah (chaîne de priorité : le cas porte déjà la fonction) — comportement voulu, anti-surcharge.

---

## RECOMMANDATION PHASE SUIVANTE

**Valider Al-Fātiḥah comme référence UX** (parcours manuel sur écran physique) avant toute extension multi-sourates ou enrichissement racines/schèmes. Le feedback après chaque réponse est en place et validé ; la consolidation de la référence UX est le prérequis naturel à la généralisation.

## PROMPT PHASE SUIVANTE

> **PHASE 25 — Validation UX de référence Al-Fātiḥah + préparation de la généralisation.**
>
> Consolider Al-Fātiḥah comme référence UX verrouillée (`FATIHAH_REFERENCE_LOCKED = TRUE`) : parcours manuel des 8 leçons sur écran physique 390×844 et 1280×720, vérification du feedback après réponse correcte/incorrecte/ambiguë, de l'audio, du RTL, de la console et de l'absence d'overflow ; documenter uniquement des observations réelles. Puis décider séparément (audit **READ_ONLY**) entre : étendre MASAQ aux autres sourates ; enrichir la couche linguistique (racines/schèmes, source auditée) ; améliorer l'UX de l'explication ; ou autre.
>
> Workflow strict : AUDIT → DESIGN → READ_ONLY → VALIDATION → APPROBATION → IMPLÉMENTATION CONTRÔLÉE → TESTS → VALIDATION NAVIGATEUR → NON-RÉGRESSION. Pas de modification de masse directe. `DATABASE_WRITES = 0` pour l'audit. Ne toucher ni au grading, ni au SRS, ni au mastery, ni à la progression, ni au curriculum, ni au resolver lexical. Décision finale unique A/B/C/D/E. Arrêt obligatoire après la phase — aucune phase suivante ne doit être exécutée automatiquement.
