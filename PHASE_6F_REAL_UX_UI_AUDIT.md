# PHASE 6F — Audit UX/UI réel du parcours pédagogique Hikma

## Résumé exécutif

**Verdict : fondation solide, expérience complète encore au niveau “bon produit interne”, pas encore “premium EdTech mémorable”.**

L’audit a été mené en `READ_ONLY` sur le code, les composants documentés et l’application réellement rendue. Les routes publiques `/dashboard`, `/learn`, `/learn/basmala` et `/review` ont été observées, avec une leçon réelle aux viewport `1280×720` et `390×844`. Les états authentifiés, la révision réelle et les parcours audio/microphone complets restent à valider avec une session connectée.

Score global du parcours observable : **3,4/5**.

Le problème principal n’est pas une rupture technique : c’est le rythme. La fiche de leçon présente trop de contexte avant la première action, la découverte répète le mot courant dans le bloc de prononciation guidée, et la navigation globale reste visible pendant un moment qui devrait devenir un espace de concentration.

## Verdict par axe

| Axe | Score | Verdict |
|---|---:|---|
| Navigation | 4/5 | Le prochain lien est clair, mais la navigation globale concurrence la session de leçon sur mobile. |
| Hiérarchie | 3/5 | Le shell d’exercice est lisible ; la fiche de leçon donne trop de poids au contexte avant l’action. |
| Cognition | 3/5 | La boucle exercice est calme, mais la découverte et le contexte cumulent plusieurs objets à traiter. |
| Pédagogie | 4/5 | Les prérequis, l’effort de rappel, le feedback et l’interleaving sont bien protégés visuellement. |
| Accessibilité | 4/5 | Bons labels, RTL local, focus et feedback annoncé ; clavier radio et états authentifiés restent à vérifier. |
| Responsive | 2/5 | Pas d’overflow observé à 390 px, mais la densité verticale et la bottom nav dégradent le focus mobile. |

## Méthode et preuves

- Inspection READ_ONLY des pages, composants, tokens et skills UI/UX.
- Observation navigateur réelle de `/dashboard`, `/learn`, `/learn/basmala`, `/review`.
- Observation desktop `1280×720` : le contexte de la leçon remplit le premier viewport ; la découverte commence au niveau du fold.
- Observation mobile `390×844` : pas d’overflow horizontal ; la première découverte s’étend sur environ 2 025 px et la navigation globale reste visible en bas.
- Observation réelle d’un choix correct puis incorrect : les options se verrouillent, le feedback distingue `Ta réponse` et `Réponse attendue`, et un seul CTA `Continuer` apparaît.
- Les erreurs d’environnement Next Dev Tools visibles dans la session locale sont exclues de l’évaluation produit.

Les données détaillées sont dans [`tmp/phase6f/`](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase6f/).

## Audit par écran

### Dashboard

La première visite est claire : promesse, mascotte et CTA “Commencer avec Al-Fatiha”. Elle est toutefois proche d’une landing page générique. L’effet premium apparaîtra lorsque l’état apprenant actif, la reprise et la révision due seront observés comme une seule hiérarchie d’action.

### Parcours

Le parcours explique bien l’étape suivante et les verrous. La continuité est meilleure qu’une grille uniforme. En revanche, les leçons verrouillées répétitives alourdissent le défilement et produisent peu de signal visuel entre les étapes.

### Fiche leçon et contexte

Le titre, l’objectif, le nombre d’exercices et les versets sont utiles, mais ils se succèdent avant l’action. À `1280×720`, “Étape 1 · Découverte” arrive seulement au bas de l’écran ; sur mobile, le risque est plus marqué. Le contexte coranique doit rester accessible et intact, mais devenir secondaire au moment d’apprendre le mot.

### Découverte

La boucle “mot → translittération → écouter → voir le sens → mot suivant” est juste et protège l’effort. Le mot actuel est bien dominant dans sa carte. Le bloc “Écouter et produire” réaffiche cependant `بِسْمِ` sous la carte courante au lieu de ressembler à une progression intégrée : cela casse le rythme “un objet à la fois”.

### Exercices

La structure `compétence → consigne → contenu → réponse → feedback → continuer` est la partie la plus aboutie du parcours. À 390 px, les options ont une bonne largeur et le CTA reste atteignable. Le compteur “Exercice 1 sur 46” est clair mais annonce une session lourde ; le sentiment de progression par compétence pourrait être plus humain que purement numérique.

### Feedback

Le feedback correct est immédiatement identifiable. Le feedback incorrect observé montre réellement `Ta réponse`, puis `Réponse attendue`, puis l’explication : c’est une bonne décision pédagogique et anti-pattern corrigé. La marge premium restante est le rythme visuel : transformer ce panneau d’état correct en moment d’apprentissage plus distinct, sans spectacle ni gamification.

### Fin de leçon et révision

Le composant de fin expose les statistiques réelles et trois actions hiérarchisées. Le ton “🎉 Leçon terminée” et la mascotte rendent l’état chaleureux mais tirent légèrement l’expérience vers le ludique générique. La révision authentifiée n’a pas pu être observée sans compte ; ce manque est un risque de continuité de parcours, pas une conclusion sur son rendu.

## États audités

| État | Observation |
|---|---|
| First visit | Observé sur dashboard et parcours visiteur. Compréhensible. |
| Loading | Présent dans le code ; non observé comme état stable navigateur. |
| Discovery ready | Observé avec données réelles. |
| Audio available | Contrôles réels observés sur les mots. |
| Audio unavailable | Copy neutre présente dans le code ; couverture complète 8 mots non prouvée. |
| Choice selected | Observé ; options désactivées après sélection. |
| Correct | Observé ; verdict + CTA unique. |
| Incorrect | Observé ; réponse brute et attendue séparées. |
| Ambiguous | Présent dans la primitive ; non exercé navigateur. |
| Free recall | Contrat source audité ; clavier mobile et réponse longue à valider. |
| NO_SIGNAL / REVIEW_REQUIRED | Non observés dans la session réelle. |
| Micro denied / network error / partial saving | Présents dans les contrats ou le code ; validation réelle requise. |
| Completed | Source auditée ; pas atteinte dans la session navigateur. |

## Arabe, RTL et audio

`ArabicText` fournit une base solide : `dir="rtl"`, `lang="ar"`, Amiri, interligne généreux et préservation des diacritiques. Les options arabes ont un poids visuel cohérent. Le point UX à corriger est la hiérarchie : le verset complet et le bloc de prononciation guidée peuvent concurrencer le mot de la compétence courante. Le contenu coranique ne doit pas être raccourci ou altéré ; il doit être placé avec plus de retenue.

`AudioPlayer` couvre idle, loading, playing, pause, ended, erreur et retry, avec coordination d’un seul audio actif. Dans l’écran observé, l’audio existe mais reste visuellement moins dominant que le contenu textuel. Une passe authentifiée avec les 8 mots, réseau dégradé et permission microphone est nécessaire avant de conclure sur la robustesse réelle.

## Accessibilité et responsive

Forces observées : landmarks, labels humains, `aria-current`, feedback `aria-live`, cibles tactiles d’au moins 44 px, focus-visible et RTL local. À examiner en priorité : le comportement clavier attendu d’un groupe radio rendu par des boutons, le safe-area mobile, et les annonces des états de microphone, réseau et sauvegarde partielle.

À 390 px, aucune largeur horizontale ne déborde. Le problème est vertical et attentionnel : la fiche de contexte repousse l’apprentissage, et la bottom navigation fixe reste présente pendant la session. Une leçon est un mode de focus ; elle ne devrait pas avoir le même chrome persistant qu’une page de parcours.

## Architecture UI recommandée

À conserver : `HikmaExerciseShell`, `ExerciseFeedback`, `HikmaProgress`, `HikmaReveal`, `ArabicText`, `AudioPlayer`, `HikmaLessonCard`.

À envisager dans les phases d’implémentation suivantes, sans les créer ici :

- `HikmaLessonFocusHeader` — étape, progression, titre et sortie de session ;
- `HikmaLessonContext` — contexte coranique secondaire et repliable ;
- `HikmaDiscoveryWordStage` — mot, audio, sens, prononciation et action suivante ;
- `HikmaExercisePrompt` — compétence, consigne et hiérarchie arabe ;
- `HikmaAnswerArea` — options, rappel libre, audio et clavier ;
- `HikmaLessonActionBar` — action mobile persistante avec safe-area ;
- `HikmaLessonSummary` — consolidation, prochaine leçon et révision.

## TOP 10 DES CHANGEMENTS À FAIRE

1. Faire commencer la découverte dans le premier viewport de la fiche leçon.
2. Introduire un mode de focus de leçon qui réduit ou masque la navigation globale mobile.
3. Intégrer la prononciation guidée au stage du mot courant au lieu de réafficher le même mot dans un bloc parallèle.
4. Rendre le contexte du verset secondaire/repliable sans modifier le texte ni les données.
5. Valider les 8 audios d’une leçon réelle et tous les états réseau/audio/microphone.
6. Donner aux états de feedback une hiérarchie visuelle plus éditoriale et moins “status alert”.
7. Tester et affiner le clavier des groupes de réponses.
8. Stabiliser l’action mobile avec safe-area et éviter la concurrence entre footer d’exercice et bottom nav.
9. Remplacer la célébration générique de fin par une consolidation plus calme et spirituelle.
10. Réaliser une QA contenu séparée pour translittération, copy française et qualité phonétique.

## LES 5 CHANGEMENTS QUI CRÉERONT LE PLUS DE “WOW”

1. Un stage découverte où le mot arabe devient un véritable objet d’apprentissage : écouter → observer → révéler → produire.
2. Une leçon mobile en mode focus, silencieuse autour de l’action courante.
3. Un contexte de verset présent mais discret, ouvrable sans interrompre la progression.
4. Un feedback qui montre l’effort, l’attendu et le prochain geste avec une micro-transition calme.
5. Une fin de leçon réflexive qui montre ce qui a été consolidé plutôt qu’une simple récompense.

## CE QU’IL NE FAUT SURTOUT PAS MODIFIER

- le grading, le score, la mastery, le SRS et la persistance ;
- l’ordre pédagogique, les prérequis et le moteur d’interleaving ;
- le texte coranique, ses diacritiques, sa direction et ses données source ;
- le backend audio et les URLs audio réelles ;
- les contrats de réponse brute / réponse attendue ;
- la règle d’effort avant révélation ;
- l’identité warm, calme, spirituelle et non infantilisante de Hikma.

## ROADMAP DE REFONTE

1. **6F — Audit UX/UI réel** — terminé.
2. **6G — Lesson focus & visual hierarchy** — contexte secondaire, header de focus, chrome mobile.
3. **6H — Discovery word stage** — intégration audio/sens/prononciation sans duplication.
4. **6I — Exercise visual refinement** — prompt, options, rappel libre et parité des réponses.
5. **6J — Feedback & micro-interactions** — états premium, `NO_SIGNAL`, `REVIEW_REQUIRED`, motion fonctionnelle.
6. **6K — Mobile-first & accessibility refinement** — 375/390/430 px, clavier, focus, safe-area et annonces.
7. **6L — Arabic/RTL & audio quality pass** — QA contenu, couverture audio, permissions et erreurs.
8. **6M — Lesson completion & review experience** — fin réflexive et révision authentifiée.
9. **6N — Final visual polish** — spacing, surfaces, iconographie et détails premium.

## Validation et périmètre

- fichiers source modifiés pendant cette phase : **0** ;
- composants/pages/tokens/CSS métier modifiés : **0** ;
- migrations : **0** ;
- données DB modifiées : **0** ;
- moteur pédagogique modifié : **0** ;
- grading modifié : **0** ;
- SRS modifié : **0** ;
- mastery modifiée : **0** ;
- tests exécutés : **410 tests passés**, 32 fichiers ;
- TypeScript : **OK** ;
- lint : **OK** ;
- build Next.js 16.3.0 : **OK** ;
- validation navigateur réelle : **partielle** — routes visiteur et leçon réelle observées à 1280×720 et 390×844 ; états authentifiés, révision complète et microphone restent à valider.

STATUS: `AUDIT_COMPLETE_READY_FOR_APPROVAL`

`BROWSER_VALIDATION_PENDING`
