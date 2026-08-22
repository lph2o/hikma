# PHASE 32F — UX VISUAL QA & POLISH DE L’ONBOARDING HIKMA

## Statut

`PHASE_32F_UX_VISUAL_POLISH_COMPLETE_READY_FOR_APPROVAL`

Audit réalisé en lecture seule. Aucun composant, fichier métier, migration ou donnée n’a été modifié pendant cette phase. Aucun commit n’a été créé.

## A. Ce qui fonctionne déjà

### Architecture et invariants

- `/onboarding` vérifie la session côté serveur et redirige un visiteur vers `/login`.
- Un onboarding déjà terminé est redirigé vers `/dashboard` via `CURRENT_ONBOARDING_VERSION = 2`.
- `OnboardingForm` conserve l’action serveur `completeOnboarding` et la persistance existante.
- La recommandation utilise le catalogue dynamique et limite les choix aux états `REFERENCE` et `READY`.
- Les éléments `IN_PREPARATION` sont informatifs et ne disposent d’aucun CTA de démarrage.
- Le catalogue onboarding ne charge pas les mots, exercices, MASAQ ou données de leçon.
- La sélection est revalidée côté serveur avant persistance, y compris contre une sourate `IN_PREPARATION` devenue indisponible.

### Composition UX

- Les écrans techniques sont regroupés en six étapes visibles : Bienvenue, À propos de toi, Ton expérience, Ton rythme, Ton parcours, Prêt à apprendre.
- La progression utilise six segments dorés au lieu d’un compteur administratif.
- Les cartes de réponse sont sémantiques (`button[role=radio]`, `aria-checked`) et présentent un état sélectionné clair avec bordure, fond, check et accent doré.
- L’espacement titre/sous-titre puis sous-titre/contenu a déjà été renforcé dans `StepShell`.
- Le récapitulatif reprend le prénom, l’objectif, la durée, le rythme et la sourate sélectionnée.
- La célébration intervient après la réussite de la sauvegarde, utilise des particules teal/dorées légères et respecte `prefers-reduced-motion`.
- Les tokens Hikma existants sont utilisés : teal structurel, doré pour progression/sélection/recommandation/célébration, surfaces existantes.

### Microcopy et ton

- Le ton général est chaleureux, simple et non évaluatif.
- L’écran de lecture arabe rassure explicitement : « Il n’y a pas de bonne ou de mauvaise réponse. »
- Les contrôles « Plus tard » et « Modifier mon choix » évitent de rendre le parcours anxiogène.
- Le CTA final est explicite : « Commencer mon parcours ».

## B. Ce qui est visuellement ou narrativement faible

### P1 — Le récapitulatif ne reflète pas toujours la sélection explicite

`summarySentence()` contient la phrase générique : « Nous te proposons de commencer par une première sourate disponible ». Cette formulation reste affichée même si l’utilisateur a choisi une autre sourate dans l’écran précédent. La carte affiche bien la sourate choisie, mais la phrase crée une contradiction narrative.

Impact : l’utilisateur peut avoir l’impression que son choix n’a pas été écouté, alors que la sélection est bien persistée correctement.

Recommandation : générer une phrase distincte selon le cas :

- recommandation conservée : « Nous te proposons de commencer par Al-Fātiḥah. » ;
- choix explicite différent : « Nous allons commencer avec [sourate]. »

Fichier concerné : `components/app/onboarding-form.tsx`, `SummaryCard` / `summarySentence`.

### P1 — Expiration de session insuffisamment actionnable

`completeOnboarding()` peut retourner « Connecte-toi pour continuer. », mais `ErrorNotice` affiche seulement le message et « Réessayer ». Il n’y a pas de navigation vers `/login` ni d’action dédiée lorsque la session a expiré.

Impact : l’utilisateur peut rester bloqué sur un écran de récapitulatif avec ses réponses intactes mais sans chemin clair pour poursuivre.

Recommandation : distinguer l’erreur de session côté présentation et proposer « Se reconnecter » avec navigation vers `/login`, tout en conservant les réponses locales si le routeur permet le retour.

Fichiers concernés : `components/app/onboarding-form.tsx`, éventuellement le contrat de résultat de `lib/learning/actions.ts` uniquement si nécessaire. Ne pas modifier les règles métier.

### P2 — Écran de sélection de sourate encore trop utilitaire

La recommandation est correctement sélectionnée et dorée, mais sa personnalité reste limitée à un badge « Notre recommandation » et à une icône. Elle ne donne pas encore pleinement le sentiment d’un moment de découverte important.

Recommandation : renforcer visuellement uniquement la carte recommandée avec une hiérarchie plus généreuse, un sous-texte contextualisé et un traitement de surface discret, sans inventer de statistiques ni de données pédagogiques.

Fichier concerné : `components/app/onboarding-form.tsx`, `SurahChoice`.

### P2 — La mascotte est limitée au premier écran

La mascotte humanise bien l’accueil, mais disparaît entièrement des écrans suivants. Ce n’est pas une erreur : les écrans de choix gagnent en concentration. Cependant, un rappel ponctuel au récapitulatif ou une petite présence dans la transition finale pourrait mieux relier l’expérience à la marque.

Recommandation : tester une seule présence secondaire au récapitulatif ou conserver volontairement l’absence actuelle si elle produit une meilleure concentration. Ne pas ajouter une mascotte décorative à chaque étape.

### P2 — Libellé de durée ambigu

La valeur interne `30` est affichée sous la forme « +20 min ». Cette formulation peut être comprise comme « vingt minutes supplémentaires » plutôt que « plus de vingt minutes ».

Recommandation : remplacer visuellement par « 20+ min » ou « Plus de 20 min », sans modifier la valeur métier `30`.

### P2 — Progression secondaire un peu générique

Le texte « Ton parcours se prépare… » est affiché à toutes les étapes, y compris l’accueil. Il soutient l’idée de préparation mais apporte peu d’information et peut sembler automatique.

Recommandation : conserver les segments et remplacer cette ligne par une formulation plus contextuelle ou plus discrète, par exemple une phrase de respiration unique, sans réintroduire de compteur technique.

## C. Ce qui peut nuire à l’envie de continuer

- La contradiction du récapitulatif est le principal risque émotionnel : les réponses semblent collectées, mais pas toujours entendues.
- L’écran de sourate est fonctionnel mais pourrait davantage ressembler à une invitation à commencer un chemin qu’à une liste de catalogue.
- Sur mobile, les cartes et le contenu sont volontairement verticaux ; la densité reste acceptable, mais le récapitulatif et les états d’erreur doivent être vérifiés sur hauteur réduite.
- La microcopy « +20 min » est le seul libellé immédiatement ambigu dans les choix.

## D. Corrections recommandées par priorité

| Priorité | Correction | Fichier | Impact |
|---|---|---|---|
| P1 | Adapter la phrase du récapitulatif à la recommandation ou au choix explicite | `components/app/onboarding-form.tsx` | Renforce la confiance et la personnalisation ressentie |
| P1 | Rendre l’expiration de session actionnable avec retour vers `/login` | `components/app/onboarding-form.tsx` | Évite un blocage utilisateur |
| P2 | Donner plus de personnalité à la carte recommandée | `components/app/onboarding-form.tsx` | Rend le choix de sourate plus inspirant |
| P2 | Clarifier « +20 min » | `components/app/onboarding-form.tsx` | Réduit l’ambiguïté |
| P2 | Décider d’un traitement plus contextuel de la ligne de progression | `components/app/onboarding-form.tsx` | Réduit l’impression automatique |
| P2 | Évaluer une présence ponctuelle de la mascotte au récapitulatif | `components/app/onboarding-form.tsx` | Renforce la continuité de marque, sans surcharge |

## Validation observée

- La protection serveur a été vérifiée par requête HTTP : `/onboarding` sans session répond `307` vers `/login`.
- Les validations automatisées de la Phase 32E restent : 563 tests, TypeScript, ESLint et build production PASS.
- La validation navigateur réelle de Phase 32E couvre `390×844`, `375×812` et `1280×720`, avec parcours complet jusqu’à la première leçon.
- Une nouvelle session authentifiée n’a pas été créée dans cette phase READ_ONLY, conformément à l’interdiction de modifier la base de données. Le rendu visuel post-ajustement doit donc être revalidé après approbation des corrections.

## IMPLEMENTATION — CHANGES RÉALISÉES

Après approbation `PHASE_32F_POLISH_APPROVED — IMPLEMENTATION_AUTHORIZED`, les corrections suivantes ont été implémentées :

- Le récapitulatif distingue maintenant une recommandation, une sélection explicite et un fallback devenu nécessaire.
- Une expiration de session affiche « Ta session a expiré », explique la récupération et propose `Se reconnecter` vers `/login`.
- La carte recommandée possède une hiérarchie dorée renforcée, un halo discret, une icône encadrée et un sous-texte de découverte.
- `+20 min` est remplacé par `Plus de 20 min`, y compris dans le récapitulatif ; la valeur interne reste `30`.
- Une mascotte secondaire accompagne l’objectif, la sélection de sourate et le récapitulatif, sans être répétée à chaque écran.
- `Ton parcours se prépare…` est remplacé par `C’est presque prêt ✨`.
- Les tests ciblés couvrent les formulations recommandation/choix/fallback et l’identification de la session expirée.

## UX

- Compréhension : le récapitulatif explique désormais exactement le choix effectué.
- Confiance : une session expirée possède une voie de récupération explicite, sans introduire de lien de connexion dans le flux normal.
- Émotion : la carte recommandée et les mascottes ponctuelles rendent les moments de découverte plus chaleureux.
- Envie de continuer : le langage est plus humain et la progression moins administrative.

## VALIDATION TECHNIQUE APRÈS IMPLÉMENTATION

| Validation | Résultat |
|---|---|
| `npm test` | PASS — 46 fichiers, 565 tests |
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS — production Next.js 16.3.0 |

## RESPONSIVE / NAVIGATEUR

La validation navigateur réelle Phase 32E reste disponible pour `390×844`, `375×812` et `1280×720`. Une nouvelle session authentifiée n’a pas été recréée après ce polish dans l’environnement courant ; les dimensions post-implémentation restent donc à revalider visuellement avant clôture définitive.

`BROWSER_VALIDATION_PENDING`

Cette mention est volontaire : aucun nouveau succès navigateur n’est déclaré sans exécution réelle après les changements.

## ACCESSIBILITÉ

- Les choix restent des boutons avec `role="radio"` et `aria-checked`.
- Le CTA `Se reconnecter` est un bouton primaire accessible.
- Les mascottes secondaires sont décoratives et masquées aux technologies d’assistance.
- Les styles `prefers-reduced-motion` et la célébration existante sont conservés.

## AUTHENTIFICATION ET CÉLÉBRATION

- La protection serveur de `/onboarding` est inchangée.
- La célébration est toujours déclenchée uniquement après `completeOnboarding()` avec `ok: true`.
- La destination reste dérivée du `firstLessonSlug` du catalogue réel.
- Aucun changement n’a été apporté à `CURRENT_ONBOARDING_VERSION`, `isOnboardingComplete` ou aux règles de catalogue.

## NON-RÉGRESSION

Aucun fichier de grading, scoring, SRS, mastery, scheduler, interleaving, curriculum, Quran, traduction, audio, LessonPlayer, MASAQ ou migration n’a été modifié.

## FILES CHANGED

- `components/app/onboarding-form.tsx`
- `lib/learning/onboarding-presentation.ts`
- `tests/onboarding-ux.test.ts`
- `PHASE_32F_UX_VISUAL_QA_AND_POLISH.md`

## Conclusion

L’onboarding est techniquement solide et déjà cohérent avec Hikma. Il ne nécessite pas de refonte d’architecture. Les corrections prioritaires concernent la cohérence du récit final et l’actionnabilité d’une session expirée. Les autres points sont du polish visuel et narratif.

`PHASE_32F_UX_VISUAL_POLISH_COMPLETE_READY_FOR_APPROVAL` — sous réserve de la validation navigateur post-implémentation documentée ci-dessus.
