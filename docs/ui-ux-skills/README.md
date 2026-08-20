# Skills UI/UX Hikma — architecture de référence

Ces six responsabilités couvrent la fondation et les futures refontes sans multiplier artificiellement les skills.

## `hikma-design-system`

- Objectif : source unique des tokens, surfaces, typographie, états et motion.
- Quand : toute création ou modification visuelle.
- Inputs : écran, composant, état, breakpoint, contenu arabe éventuel.
- Workflow : lire les tokens → choisir une primitive → vérifier contraste/focus → vérifier mobile → valider les états.
- Règles : tokens uniquement, palette warm, variantes `*_text` AA, ombres chaudes, motion transform/opacity.
- Anti-patterns : couleurs/rayons/ombres isolés, cartes uniformes, gradients gratuits.
- Validation : aucune valeur visuelle arbitraire non justifiée et page visible dans `/design-system`.
- Output : décision de tokens et checklist de conformité.

## `hikma-component-design`

- Objectif : créer ou refactorer une primitive réutilisable sans doublon.
- Quand : lorsqu’un même langage apparaît sur au moins deux routes.
- Inputs : usages existants, API du composant, états et contraintes tactiles.
- Workflow : rechercher l’existant → préserver l’API utile → définir variantes → tester états/focus → documenter.
- Règles : composition avant duplication, API explicite, `data-slot` stable, SSR/client maîtrisé.
- Anti-patterns : composant métier caché dans une primitive, variant implicite, hardcode de page.
- Validation : TypeScript, lint, usages existants inchangés ou migration justifiée.
- Output : composant, variantes, exemple laboratoire.

## `hikma-arabic-typography`

- Objectif : préserver la lisibilité et l’intégrité du texte arabe vocalisé.
- Quand : mot, verset, translittération, phonétique, audio ou texte mixte.
- Inputs : niveau `inline/small/word/verse/hero`, contenu, contexte RTL/LTR.
- Workflow : isoler l’arabe → choisir Amiri et échelle → vérifier diacritiques/line-height → tester 375px.
- Règles : RTL local, `lang="ar"`, line-height ≥1.9, aucun tracking, sélection native conservée.
- Anti-patterns : inversion globale, text-transform, texte sous 16px, réponse révélée trop tôt.
- Validation : diacritiques visibles, wrapping naturel, lecture mobile sans zoom.
- Output : structure arabe et garde-fous de rendu.

## `hikma-responsive-design`

- Objectif : concevoir une structure adaptée, pas une simple réduction desktop.
- Quand : toute route interactive et tout état non nominal.
- Inputs : 375px, 768px, desktop, contenu, CTA et navigation.
- Workflow : définir la priorité mobile → composer la structure → ajouter l’espace desktop → vérifier tactile/safe-area.
- Règles : cibles ≥44px, CTA critique visible, mode focus pour les sessions, scroll vertical.
- Anti-patterns : overflow horizontal, nav illisible, CTA sous le fold, densité inchangée.
- Validation : revue des états principaux aux trois largeurs.
- Output : matrice responsive et décisions de structure.

## `hikma-accessibility`

- Objectif : viser WCAG 2.2 AA sans attendre la fin de la phase.
- Quand : chaque composant, état et livraison.
- Inputs : contraste, clavier, lecteur d’écran, motion, RTL, touch targets.
- Workflow : sémantique → focus → contraste → annonces → reduced motion → test mobile.
- Règles : couleur jamais seule, focus visible, labels explicites, `aria-live` pour feedback, `lang` correct.
- Anti-patterns : texte sémantique en couleur vive, emoji informatif non nommé, focus supprimé.
- Validation : clavier complet, contraste mesuré et revue des états d’erreur/succès.
- Output : checklist AA avec écarts classés.

## `hikma-motion-design`

- Objectif : utiliser le mouvement pour orienter, confirmer et révéler.
- Quand : transition, feedback, progression ou récompense sobre.
- Inputs : intention, état avant/après, durée, reduced motion.
- Workflow : nommer l’intention → choisir opacity/transform → limiter la durée → prévoir reduced motion.
- Règles : `--ease-hikma` ou `--ease-soft-out`, une intention par animation.
- Anti-patterns : motion décorative, jump de mascotte, animation de width/height/top/left.
- Validation : mouvement compréhensible sans gêner le rappel et supprimé en reduced motion.
- Output : spécification de motion courte et testable.

## `hikma-page-redesign`

- Objectif : refondre une page autour d’une intention claire.
- Quand : phases futures de dashboard, parcours, révision ou profil.
- Inputs : audit de route, objectif utilisateur, états, composants partagés.
- Workflow : définir l’intention → hiérarchiser → choisir le CTA → composer les états → auditer pédagogie/mobile/AA.
- Règles : un H1, une action primaire, détails secondaires, aucun jargon pédagogique.
- Anti-patterns : refaire une page isolément, ajouter des cartes sans fonction, révéler la réponse prématurément.
- Validation : audit Hikma à six axes et critères de la phase correspondante.
- Output : wireframe, décisions de composants, plan de migration et preuves.

Landing page

- La référence de composition et de validation de la landing premium est documentée dans [`hikma-landing-page/README.md`](./hikma-landing-page/README.md).

## `hikma-dashboard`

- Objectif : faire du dashboard le centre d’action pédagogique, pas un tableau de KPI.
- Quand : toute création ou refonte de `/dashboard` et de ses états.
- Inputs : `LearningContext`, objectif du jour, révisions à venir et activité réelle.
- Workflow : auditer les données → choisir l’action primaire → distinguer première visite/reprise/révision → composer la progression → vérifier mobile/AA.
- Règles : `activeSession` avant `nextLesson`, statistiques secondaires, jamais de donnée inventée, révision due distincte de l’absence d’historique.
- Anti-patterns : KPI avant CTA, XP/streak inventé, cartes décoratives, double CTA primaire, « tout est à jour » sans historique.
- Validation : action comprise en moins de cinq secondes, états loading/empty/first visit/active/review/completed couverts.
- Output : hiérarchie dashboard, matrice d’états, composants utilisés et preuves de validation.

## `hikma-learning-path`

- Objectif : transformer le curriculum réel en chemin progressif et lisible.
- Quand : `/learn`, unités, cartes de leçons et progression du parcours.
- Inputs : curriculum, `lessonStatuses`, `lessonWordMap`, `progressByWord`, `activeSession`, `nextLesson`.
- Workflow : auditer les statuts → prioriser l’étape courante → composer la continuité → expliquer les verrous → vérifier mobile/AA.
- Règles : `COMPLETED` n’est pas `MASTERED`, aucun niveau ou prérequis inventé, verrou explicite, progression réelle uniquement.
- Anti-patterns : grille uniforme, cadenas sans raison, glow permanent, copie gamifiée, `/learn` transformé en `/review`.
- Validation : prochain pas compris en quelques secondes et statuts identiques au moteur.
- Output : structure du chemin, `HikmaLessonCard`, matrice des états et preuves.

## `hikma-lesson-experience`

- Objectif : composer une session de leçon calme, progressive et accessible, de la découverte à la consolidation.
- Quand : `/learn/[slug]`, découverte, exercices, audio, prononciation, feedback et écran de fin.
- Inputs : audit de leçon, états réels, exercices existants, audio enregistré et progression persistante.
- Workflow : séparer les étapes → protéger le rappel → unifier la structure d’exercice → expliciter les états → vérifier mobile/AA.
- Règles : UI seulement, aucune logique métier dupliquée, aucune donnée inventée, aucune révélation prématurée.
- Validation : tests, TypeScript, lint, build et revue des états critiques.
- Output : composants de composition, matrice d’états, patterns documentés et rapport de phase.
