# PHASE 6I-C — FORENSIC INTERACTION & RELOAD ROOT-CAUSE AUDIT

**Mode : `STRICT_FORENSIC_READ_ONLY`**  
**Statut : `PHASE_6I_C_FORENSIC_INCONCLUSIVE`**  
**Marqueurs obligatoires : `NO_CODE_MODIFIED` · `NO_BUSINESS_LOGIC_MODIFIED` · `NO_DATA_MODIFIED`**

## Executive Summary

Le bug signalé n'a pas été reproduit : les réponses restent cliquables d'Ex1 à Ex21, l'URL reste `/learn/basmala`, `document.readyState` reste `complete`, et aucun warning/error navigateur n'a été observé. Le stress réel a couvert 20 transitions réponse → feedback → suivant à `390×844`; un passage réel a aussi été effectué à `1280×720`.

La cause racine d'un hard reload, d'une navigation Next ou d'un remount anormal n'est donc pas confirmée. La comparaison prioritaire Ex4 / Ex5 / Ex6 ne révèle pas de différence structurelle susceptible d'expliquer un clic perdu sur Ex5.

Un problème distinct, réel et mesuré, est cependant documenté : après ouverture de « Comprendre pourquoi » sur mobile, le CTA « Continuer » est à `y=962.375` dans un viewport de `844px` (`visible=false`). Cela peut donner l'impression que la progression est bloquée, mais ne correspond pas à un reload et n'empêche pas le clic sur les options avant feedback.

## BEFORE_STATE

- Audit 6I-B : Ex1–Ex10 non problématiques à `390×844`, sans cause reproduite.
- Dépôt déjà très modifié et non commité; ces changements ont été conservés.
- Aucun fichier applicatif, composant, hook, style, logique métier, donnée ou backend modifié pendant 6I-C.

## Symptômes

Symptômes investigués séparément :

1. option visible mais apparemment non cliquable;
2. page semblant se recharger ou se réinitialiser après plusieurs exercices;
3. Ex5 comme cas prioritaire;
4. feedback / explication / CTA sur mobile;
5. différences possibles entre viewport et types d'exercice.

## Méthodologie

- Lecture statique des composants du parcours, des clés React, des formulaires, des effets, du router et des Server Actions.
- Replay navigateur réel avec snapshot DOM frais avant chaque action, comptage exact des locators et hit-testing DOM.
- Ex4, Ex5 et Ex6 capturés individuellement à `390×844`.
- Ex1–Ex20 exécutés en stress réponse → feedback → suivant.
- Validation réelle à `390×844` et `1280×720`.
- Aucune instrumentation persistante, monkey-patching ou modification de fichier applicatif; la trace fine `pointerdown → pointerup → click → handler` est donc classée non observable directement dans ce mode.

## Ex5 forensic analysis

Ex5 rend : « Comprendre le sens », le mot `ٱلرَّحْمَـٰنِ`, quatre options, aucun `<form>`, aucun `<audio>`, un `radiogroup`, et le shell `data-slot="hikma-exercise-shell"`. Le contrôle correspond au chemin `OptionsExercise` utilisé par les exercices à choix.

Comparaison réelle :

| Exercice | Compétence rendue | Radios | Formulaires | Audio DOM | Hauteur document | Résultat |
|---|---|---:|---:|---:|---:|---|
| Ex4 | Retrouver la forme arabe | 4 | 0 | 0 | 864 | cliquable, transition réussie |
| Ex5 | Comprendre le sens | 4 | 0 | 0 | 872 | cliquable, transition réussie |
| Ex6 | Reconnaître un mot | 4 | 0 | 0 | 864 | cliquable, transition réussie |

Les différences sont de contenu et de libellé pédagogique, pas de structure interactive observée. Les identités d'exercices sont déterministes (`id` ou `type:targetWordId:prompt`) et `ExerciseCard` porte cette identité comme clé; aucune clé ne dépend de `answer`, `feedback`, audio ou microphone.

## Click event analysis

Les réponses testées étaient les éléments interactifs supérieurs retournés par `elementsFromPoint`, avec `pointer-events` actif. Après clic, la réponse était sélectionnée, les radios devenaient désactivées, puis « Continuer » apparaissait. Cela réfute un overlay bloquant dans les états testés.

La chaîne exacte d'événements natifs n'a pas été instrumentée, conformément au mode read-only. Le code statique relie les boutons à `onClick={() => onChoose(option)}`; `choose` refuse seulement une réponse déjà présente, une phase différente de `playing`, ou une absence d'exercice.

## DOM / layering analysis

Le shell utilise un flux normal (`flex`, `gap`, footer normal) sans CTA `fixed`/`sticky` dans le chemin inspecté. Les boutons ont `type="button"` (explicitement pour les options, par défaut dans la primitive `Button`), `pointer-events` non bloquant, et sont désactivés uniquement après réponse.

Le seul layering mobile confirmé est la conséquence de la hauteur du feedback + explication : le CTA est hors viewport après ouverture de l'explication. Aucun backdrop ou overlay intercepteur n'a été observé.

## React lifecycle analysis

`LessonPlayer` possède un état local `index/answer/results/phase`; sélectionner une option appelle `setAnswer`, puis continuer appelle `setAnswer(null)` et `setIndex(index + 1)`. Ce sont des rerenders normaux de la session, non des remounts de page démontrés.

La clé `ExerciseCard` est déterministe et liée à l'exercice courant. La remount attendue du composant enfant lors du changement d'exercice est intentionnelle et ne réinitialise pas la page ni l'URL. Aucun état navigateur n'entre dans l'identité de l'exercice.

## Router analysis

Dans le chemin de leçon, `router.push("/learn")` est réservé à « quitter ». Aucun `router.refresh`, `router.replace` ou navigation n'est déclenché par sélection, feedback ou progression. Les transitions observées ont conservé exactement la même URL.

## Form analysis

Les QCM Ex4–Ex6 ne sont pas dans un formulaire. Les exercices de rappel libre utilisent un formulaire avec `onSubmit` et `preventDefault`; leur bouton de validation est explicitement `type="submit"`, tandis que le clavier arabe est `type="button"`. Aucun submit involontaire n'est identifié.

## useEffect analysis

Les effets observés sont limités notamment au lecteur audio et à la prononciation guidée. L'effet microphone initialise `micState` à `unknown`, puis consulte `navigator`, `MediaDevices` et `MediaRecorder` après hydratation via `setTimeout(0)`. Ces APIs ne sont pas consultées pendant le rendu serveur/client initial. L'effet de nettoyage est à dépendance vide; aucun cycle `setState` dépendant du même état n'a été trouvé.

## Network analysis

Pour un utilisateur anonyme, la séquence de stress n'a déclenché aucune navigation observable ni reset. Pour un utilisateur authentifié, `saveLessonSession` est appelé en best-effort lors de la progression; les soumissions finales et la suppression de session interviennent à la fin. La trace réseau requête-par-requête n'a pas été instrumentée dans ce mode strict, donc un défaut spécifique de session/auth reste `POSSIBLE`, non confirmé.

## Hydration analysis

La détection microphone est hydratation-safe dans le code inspecté : état initial déterministe `unknown`, APIs navigateur uniquement dans un effet client post-rendu, permission demandée uniquement sur action explicite. Aucun mismatch, warning ou error n'a été observé dans les deux viewport testés. Les branches audio et viewport inspectées ne révèlent pas de valeur navigateur utilisée pour produire un rendu SSR différent.

## Exercise-type comparison

| Type / famille | Cliquabilité observée | Forme | Audio/micro | Verdict |
|---|---|---|---|---|
| OptionsExercise / QCM | oui Ex1–Ex21, Ex4–Ex6 | non | selon contenu | aucune anomalie reproduite |
| RecallExercise | contrat statique inspecté | oui, `preventDefault` | non | aucun submit parasite identifié |
| AudioExercise / audio | contrat statique inspecté | non | lecteur avec effet `[src]` | pas de navigation dans l'effet |
| PronunciationGuided | non exercé avec permission réelle | non | micro uniquement sur clic | `BROWSER_VALIDATION_PENDING` |
| Context / interleaving | séquence interleavée traversée | non | selon exercice | aucune anomalie Ex4–Ex6/stress |

## Stress test

Scénario réel : ouvrir la leçon → trois mots découverte → démarrer → sélectionner → feedback → continuer, répété sur 20 exercices. Fin observée : « Exercice 21 sur 46 », URL inchangée, `readyState=complete`, `scrollY=0`, options toujours disponibles, console sans warning/error.

À `1280×720`, le même parcours d'entrée et une transition d'exercice ont été exécutés; les radios étaient entièrement dans le viewport. À `390×844`, le CTA est visible dans le flux normal avant feedback; après explication, il est hors viewport jusqu'au scroll/auto-scroll du locator.

## Hypothesis matrix

| Hypothèse | Statut | Évidence |
|---|---|---|
| H1 overlay invisible | REJECTED | hit-testing sans overlay bloquant |
| H2 CTA sticky recouvrant les options | REJECTED | CTA en flux normal; options cliquables |
| H3 pointer-events incorrect | REJECTED | pointer-events actif, clics effectifs |
| H4 bouton traité comme submit | REJECTED | QCM hors formulaire; `type=button` |
| H5 remount React après clic | REJECTED pour états testés | sélection puis feedback conservés |
| H6 clé React instable | REJECTED Ex4–Ex6 | identité déterministe |
| H7 reset local immédiat | REJECTED | `answer` reste présent jusqu'à Continuer |
| H8 router refresh | REJECTED | aucune occurrence dans progression; URL stable |
| H9 effect loop | REJECTED pour transition testée | effets bornés, pas de boucle détectée |
| H10 session/auth refresh | POSSIBLE | chemin authentifié non observé en navigateur |
| H11 hydration mismatch | REJECTED dans les états testés | rendu initial micro déterministe, console propre |
| H12 type d'exercice | POSSIBLE | micro/prononciation non rejoué avec permission réelle |
| H13 exercice après interleaving | REJECTED pour stress 20 | aucun numéro critique |
| H14 contenu/longueur de réponse | NOT_REPRODUCED | Ex4–Ex6 et plusieurs contenus testés |
| H15 viewport | NOT_REPRODUCED pour reload/clic; problème CTA confirmé | CTA hors viewport après explication seulement |

## Root Cause

`ROOT_CAUSE_NOT_REPRODUCED`.

Aucune cause racine de hard reload, navigation Next, remount anormal ou option non cliquable n'est confirmée avec les preuves disponibles. Le seul défaut reproductible est un défaut de visibilité du CTA de progression après expansion de l'explication sur mobile. Il explique un parcours perçu comme bloqué, pas un reload et pas une interception des options.

`NEXT_DIAGNOSTIC_REQUIRED` : obtenir une reproduction utilisateur avec timestamp, viewport, type d'exercice, état authentifié, URL complète, action exacte, et idéalement un enregistrement montrant si l'URL/document change. La prochaine instrumentation ciblée devra tracer les événements natifs et les requêtes uniquement dans un harness temporaire approuvé.

## Confidence

- Absence de hard reload/navigation dans le scénario anonyme testé : **élevée**.
- Absence d'overlay bloquant sur Ex4–Ex6 et Ex1–Ex21 : **élevée**.
- Absence de cause sur microphone, audio réel et chemin authentifié : **moyenne à faible** (`BROWSER_VALIDATION_PENDING`).
- CTA hors viewport après explication mobile : **élevée**, mesurée directement.

## Reproduction Steps

1. Servir l'application puis ouvrir `/learn/basmala`.
2. Choisir `390×844`.
3. Avancer la découverte, démarrer, sélectionner la première option et continuer jusqu'à Ex5.
4. Reproduire le même cycle sur Ex4, Ex5 et Ex6; les options répondent et l'URL reste stable.
5. Sur un exercice à feedback, sélectionner une option puis ouvrir « Comprendre pourquoi ».
6. Constater que « Continuer » est sous le viewport mobile (`bottom=1010.375` avec viewport `844`).

## Recommended Fix

Aucune correction n'est implémentée dans 6I-C. Pour la phase corrective suivante, traiter séparément la visibilité du CTA après expansion d'explication, puis instrumenter uniquement le chemin authentifié/microphone si le signal utilisateur persiste. Ne pas modifier le grading, scoring, SRS, mastery, scheduler, curriculum, persistance ou données.

## Regression Risks

- Un correctif de positionnement du CTA pourrait masquer le feedback ou réduire la zone de réponse.
- Une instrumentation de diagnostic trop large pourrait elle-même perturber le cycle React.
- Le chemin authentifié et la permission microphone restent non validés en navigateur réel.
- Le build reste non validé à cause du panic Turbopack environnemental; il faudra le rejouer dans un environnement autorisant les workers/processus internes.

## Acceptance Criteria

- [x] Investigation read-only; aucun code métier ou donnée modifié.
- [x] Ex5 comparé individuellement à Ex4 et Ex6.
- [x] `390×844` et `1280×720` exécutés réellement.
- [x] Stress de 20 exercices exécuté.
- [x] H1–H15 classées avec preuves et limites.
- [x] Hydratation microphone SSR → client inspectée.
- [x] `npm test`, TypeScript et lint passés.
- [ ] Build production validé : bloqué par Turbopack (`Operation not permitted`).
- [ ] Microphone avec permission réelle, audio et session authentifiée : `BROWSER_VALIDATION_PENDING`.

## IMPLEMENTATION_REPORT

Cette phase ne comportait volontairement aucune implémentation. Artefacts créés : ce rapport et `tmp/phase6i-c/forensic-matrix.json` uniquement. Aucun fichier applicatif n'a été modifié.

## AFTER_STATE

- Dépôt applicatif inchangé par 6I-C.
- Cause de reload non confirmée.
- Cause d'option non cliquable non reproduite.
- Défaut reproductible documenté : CTA « Continuer » hors viewport après explication mobile.
- Validation finale : `PHASE_6I_C_FORENSIC_INCONCLUSIVE`.

