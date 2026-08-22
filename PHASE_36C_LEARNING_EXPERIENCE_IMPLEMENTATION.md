# PHASE 36C — LEARNING EXPERIENCE IMPLEMENTATION

Statut : `PHASE_36C_IMPLEMENTATION_COMPLETE_READY_FOR_VALIDATION`

Référence : `PHASE_36B_RESEARCH_COMPLETE_READY_FOR_IMPLEMENTATION`

---

## A. BEFORE

Avant Phase 36C, la boucle d'apprentissage était : Découverte passive →
séquence cumulative d'exercices (figée au chargement) → feedback → fin de
leçon. Trois lacunes issues de l'audit 36A/36B :

1. Une erreur ne re-présentait **jamais** le mot dans la session (rétention
   immédiate faible) — P1.
2. La signature « ce mot, tu le récites déjà » n'était pas perceptible malgré
   les données réelles déjà chargées (`getWordAyahContexts`) — P1.
3. Pas de cadrage d'entrée (durée/mots), fin de leçon sans sourate ni « quand
   revenir », radiogroup sans navigation flèche, champ libre sans label, ton
   d'erreur impersonnel (« Ce n'est pas la réponse attendue ») — P2.

---

## B. CHANGES (fichiers)

**Nouveaux fichiers**

| Fichier | Rôle |
| ------- | ---- |
| `lib/learning/lesson-copy.ts` | Copy pure de la leçon (signature, anticipation, mini-révision, fin de leçon) |
| `lib/ui/radio-group-keyboard.ts` | Navigation clavier (flèches/Home/End) des radiogroups |
| `components/learn/mini-review.tsx` | Mini-révision de fin de session (auto-évaluation non notée) |
| `tests/lesson-experience.test.ts` | 14 tests unitaires (sélection + copy) |

**Fichiers modifiés**

| Fichier | Modification |
| ------- | ------------ |
| `lib/learning/session.ts` | Ajout `selectMiniReviewWords` + `MAX_MINI_REVIEW_WORDS` (purement additif) |
| `components/learn/lesson-player.tsx` | Nouvelle phase `miniReview` + `reinforcedWords` + `pendingFinish` ; `DiscoveryWord.ayahRef` |
| `components/learn/lesson-discovery.tsx` | Anticipation (« N mots · courte session » + flux) + signature par mot + lead-in ayah |
| `components/learn/lesson-complete.tsx` | Sourate visible + mots renforcés (prop `reinforcedWords`) |
| `app/(app)/learn/[slug]/page.tsx` | Passage de `ayahRef` réel par mot (depuis `contextByWord`) |
| `components/learn/exercises/options-exercise.tsx` | `onKeyDown` sur radiogroup |
| `components/learn/exercises/index.tsx` | `onKeyDown` sur 4 radiogroups + `aria-label` sur champ libre |
| `components/ui/exercise.tsx` | `onKeyDown` sur `AnswerGrid` + microcopy d'erreur adoucie |
| `components/learn/review-player.tsx` | `onKeyDown` sur radiogroup auto-évaluation |

---

## C. MINI-RÉVISION (P1)

### Architecture

La mini-révision est une **couche de présentation/séquençage de session**,
strictement séparée du moteur :

1. `selectMiniReviewWords(results)` (pur) — sélectionne les mots ayant reçu au
   moins une réponse incorrecte, dans l'ordre de première rencontre, plafonnés
   à **4** (`MAX_MINI_REVIEW_WORDS`).
2. `LessonPlayer` intercepte la fin de la séquence principale et, si des mots
   candidats existent, bascule sur la phase `miniReview` au lieu d'appeler
   `finish()` directement.
3. `MiniReview` (composant) — interstitiel (« Un dernier rappel ? ») → un mot à
   la fois (arabe dominant + réécoute + auto-évaluation « Je m'en souviens /
   Pas encore » + sens révélé) → résumé (« C'est bon 👏 ») → `finish()`.

### Comportement garanti

- **Aucun re-grading** : l'auto-évaluation de la mini-révision n'appelle pas
  `validateAnswer` et n'est **jamais** ajoutée à `results`.
- **Aucun effet SRS/mastery/progression** : `finish()` reçoit exactement les
  résultats de la séquence principale (payload conservé via `pendingFinish`).
- **Aucune table, aucune migration, aucun nouveau statut**.
- **Pas de boucle infinie** : le nombre de mots est plafonné et chaque mot n'est
  re-présenté qu'**une** fois ; le parcours se termine automatiquement.
- **Skippable** : « Terminer la leçon » depuis l'interstitiel court-circuite la
  mini-révision (`reinforced = 0`).

### Limite

Plafond à 4 mots (évite de transformer la mini-révision en seconde leçon).

---

## D. SIGNATURE HIKMA (P1)

La signature « **ce mot, tu le récites peut-être déjà** » n'est affichée **que
lorsqu'elle est factuellement vraie** :

- Le `LessonDiscovery` reçoit par mot une `ayahRef` réelle (ex.
  « Al-Fātiḥah 1:3 »), calculée dans `app/(app)/learn/[slug]/page.tsx` depuis
  `getWordAyahContexts` (`word_occurrences` réelles) — **jamais inventée**.
- Si le mot n'a pas de contexte dans la sourate, `ayahRef = null` et
  `getSignatureCopy(null)` renvoie `null` : **aucune phrase n'est affichée**.
- Un lead-in « Tu viens de découvrir ces mots — retrouve-les dans l'ayah que tu
  récites » précède le `HikmaContextDisclosure` (verset réel), uniquement quand
  un contexte existe.

Aucune relation mot↔ayah n'est fabriquée ; le texte Quran et la traduction
Hamidullah restent la source de vérité absolue (non modifiés).

---

## E. FIN DE LEÇON (P2)

`LessonComplete` affiche désormais :

- le **nom de la sourate** (« Tu progresses dans {sourate} ») via
  `getLessonProgressCopy`, uniquement si le nom est connu ;
- les **mots renforcés** en fin de session (« N mots renforcés ») si la
  mini-révision a réellement été effectuée ;
- la hiérarchie d'action inchangée et correcte : `Continuer` (action principale)
  → `Réviser mes mots` → `Retour au parcours` ; `Voir mes sourates` en fin de
  sourate.

Aucune action vers `IN_PREPARATION` n'est proposée.

---

## F. CÉLÉBRATIONS

Hiérarchie conservée et rendue explicite, sans nouvelle bibliothèque :

| Niveau | Déclencheur | Rendu |
| ------ | ----------- | ----- |
| 1 — micro | bonne réponse | feedback texte + icône (aucun confetti) |
| 2 — mini-révision | fin du renforcement | « C'est bon 👏 » + mascotte (pas de confettis) |
| 3 — leçon | fin de leçon ordinaire | mascotte + stats + CTA |
| 4 — sourate | vraie transition `completed` | confettis dorés/teal courts (existant, inchangé) |

Toujours : `prefers-reduced-motion`, teal structurel, doré émotionnel.

---

## G. ACCESSIBILITÉ

- **Radiogroup clavier** : `handleRadioGroupKeyDown` (flèches gauche/droite/
  haut/bas + Home/End) attaché aux radiogroups de `OptionsExercise`,
  `WordRecognition`, `AudioToWord`, `WordToAudio`, `PhoneticDiscrimination`,
  `AnswerGrid` et l'auto-évaluation de `review-player`.
- **Champ libre** : `aria-label={exercise.prompt}` sur l'input de rappel.
- **Ton d'erreur** : titre « Pas encore » (au lieu de « À revoir ») et message
  « Ce mot n'est pas encore fixé. Voici la bonne réponse. » — l'erreur reste
  identifiée comme incorrecte mais présentée comme une étape d'apprentissage.
- Le résultat reste **véridique** : le verdict `incorrect` (rouge) et la bonne
  réponse sont inchangés ; seule la formulation évolue.

---

## H. TESTS

- `npx tsc --noEmit` → ✅
- `npx eslint` (fichiers modifiés) → ✅
- `npx vitest run` → **651 / 651 tests** (51 fichiers ; **+14** nouveaux
  `tests/lesson-experience.test.ts`)
- `npm run build` (Next 16.3.0) → ✅

Nouveaux tests couvrent : sélection mini-révision (aucun incorrect, un,
plusieurs, plafond 4, ordre déterministe, liste vide) et copy pure (signature
null si contexte absent, anticipation sans durée fictive, accords singulier/
pluriel, fin de leçon sans nom de sourate → null).

Aucun test existant supprimé ni modifié pour masquer une régression.

---

## I. NON-RÉGRESSION

Invariants vérifiés **non modifiés** :

- grading, scoring, réponses libres, SRS, mastery, scheduler, curriculum,
  interleaving : **inchangés** ;
- `LessonPlayer` : seule l'orchestration UI (nouvelle phase + interception) a
  évolué — la validation, la persistance et le séquenceur pédagogique sont
  intacts ;
- Quran, traductions, MASAQ, corpus lexical, `FATIHAH_REFERENCE_LOCKED` :
  inchangés ;
- Al-Māʿūn 107 `IN_PREPARATION` (aucun CTA) : inchangé ;
- 114 sourates, 90 leçons publiées, 14 parcours exposables, `word_translations
  = 263`, MASAQ `97 / 170` : inchangés ;
- aucune migration, aucune écriture Supabase nouvelle, aucun second moteur de
  progression/révision.

---

## J. LIMITATIONS

- **`BROWSER_VALIDATION_LIMITED`** : aucun navigateur contrôlable dans cet
  environnement. Les comportements suivants ne sont **pas** déclarés PASS en
  conditions réelles : responsive (390×844 / 375×812 / 1280×720), navigation
  clavier/focus réelle des radiogroups, RTL, `prefers-reduced-motion`,
  célébrations, contexte Quran (non coupé), erreurs d'hydratation.
- La navigation clavier et les labels ont été vérifiés **structurellement**
  (types + lint + lecture du code), pas par un lecteur d'écran ou un vrai
  clavier.

Aucun commit n'a été créé.
