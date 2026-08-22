# Hikma — Audit UI/UX global hybride pondéré

**Statut : `UI_UX_GLOBAL_AUDIT_COMPLETE_READY_FOR_APPROVAL`**  
**Périmètre : audit en lecture seule de l’interface**  
**Date : 2026-08-16**

## Résumé exécutif

Hikma possède déjà une base produit solide : App Router, shell authentifié, navigation desktop/mobile, composants UI partagés, affichage arabe dédié, lecteur audio coordonné, découverte, exercices, prononciation guidée, reprise de session, soumission idempotente, progression par compétence et états d’erreur explicites.

Le problème principal n’est pas l’absence de fonctionnalités, mais l’absence d’une mise en scène commune. L’interface reste souvent une fondation fonctionnelle : cartes répétées, hiérarchie plate, CTA concurrents, contenu pédagogique dense et langage visuel encore générique.

### Score hybride

| Axe | Score | Poids | Verdict |
|---|---:|---:|---|
| Compréhension / pédagogie | 3.6/5 | 30 % | Le moteur protège bien l’effort de rappel, mais l’UI n’explique pas toujours la compétence. |
| Navigation / hiérarchie | 3.1/5 | 20 % | Les routes existent, mais le shell et l’action principale manquent de signature. |
| Responsive / mobile | 3.0/5 | 15 % | La base mobile est là ; densité et mode focus restent à traiter. |
| Accessibilité | 3.3/5 | 15 % | Bon socle ARIA/focus, normalisation des contrastes et tailles nécessaire. |
| Cohérence visuelle | 2.8/5 | 15 % | Tokens documentés mais application encore partielle. |
| États / feedback | 3.5/5 | 5 % | Beaucoup d’états métier présents, expression visuelle à unifier. |
| **Score global pondéré** | **3.2/5** | 100 % | **Fondation prometteuse, refonte de cohérence nécessaire.** |

## 1. Protections

Les modifications non commitées ont été constatées avant l’audit. Aucune réinitialisation, suppression, checkout destructif ou écrasement n’a été effectué.

Cette phase ne modifie pas Supabase, migrations, RLS, données Quran, grading, générateurs, SRS, mastery, curriculum, audio, phonétique, routes ou contrats de persistance. Le seul livrable ajouté est ce rapport d’audit.

## 2. Cartographie des routes

| Route | État actuel / composants | Problèmes principaux | Priorité | Recommandation / dépendances |
|---|---|---|---|---|
| `/` | `landing`, `Mascot`, `Button`, `Card`, `ArabicText`, `Display` | Hero compact, mascotte très présente, manque de preuve de méthode | P1 | Manifeste produit, aperçu mot/verset, CTA unique. Dépend de la fondation. |
| `/login` | `AuthLayout`, `Card`, `Mascot`, `LoginForm` | Carte générique, marque répétée dans la carte | P2 | Cadre auth éditorial et rassurant. Dépend du shell public. |
| `/onboarding` | `OnboardingLayout`, `OnboardingForm` | Mono-écran, rythme et bénéfice différé peu hiérarchisés | P1 | Entrée progressive sans changer le contrat de données. |
| `(app)/layout.tsx` | Redirection onboarding, `AppNav`, `pb-24`, sidebar | Shell peu expressif, contexte absent | P0 | `HikmaPageShell`, header contextuel, mode focus. |
| `/dashboard` | `GoalRing`, historique, révisions, `Progress`, stats, plusieurs `Card` | Trop de blocs concurrents ; « apprendre / reprendre / réviser » indistinct | P0 | Une carte « quoi faire maintenant », détails secondaires ensuite. |
| `/learn` | Parcours, unités, `Progress`, `lesson-status` | Catalogue vertical dense, statuts répétés | P1 | Parcours narratif avec prochaine leçon en vedette. |
| `/learn/units/[slug]` | En-tête unité, progression, cartes leçons | CTA de leçon noyé, bénéfice de l’unité faible | P1 | Intention de l’unité + prochaine leçon prioritaire. |
| `/learn/[slug]` | Contexte verset, metadata, audio badge, `LessonPlayer` | Contexte, fallback, audio, difficulté et session mélangés | P0 | Séparer introduction, découverte et session ; remplacer difficulté technique par objectif humain. |
| Découverte | Dans `LessonPlayer` : prononciation, cartes mots, fiche, CTA | Piles de cartes, audio peu visible, badges longs, peu de transition vers le rappel | P1 | `WordCard` compacte, audio explicite, contexte repliable, CTA mobile persistant. |
| Exercices | `ExerciseCard`, options, prononciation, `FeedbackPanel` | Compétence peu explicite, réponse et feedback dans une même surface | P0 | Header focus, bandeau « tu apprends à… », feedback séparé après soumission. |
| Fin de leçon | `LessonComplete`, stats, prochaine leçon | Risque d’écran de stats générique | P1 | Surface signature : accomplissement, acquis, prochaine action, révision secondaire. |
| `/review` | Trois états métier, `ReviewPlayer` | Bon modèle d’états, mais jargon SRS et CTA redondants | P1 | « Pourquoi ce mot revient » en langage humain. |
| `/mots/[id]` | `ArabicText`, sens, badge, leçons, occurrences | Audio absent en premier plan, hiérarchie encyclopédique | P1 | Fiche d’apprentissage : écouter, sens, contexte, occurrences secondaires. |
| `/profile` | Stats, `GoalSettings`, déconnexion | Profil statistique, email en H1, compétences absentes | P1 | Profil de maîtrise par verbes humains, réglages séparés visuellement. |
| `/admin` | Données/import Quran, typographie partagée | Hors parcours apprenant, densité différente | P3 | Thème admin séparé, tokens communs. |
| `/design-system` | Palette, typographie, mascottes | Affiche encore anciens neutres/tailles | P1 | Galerie V2 vivante : tokens, états, RTL, audio, focus, mobile. |
| `/error`, `/not-found` | États globaux | À harmoniser avec les erreurs de session et retours contextuels | P2 | Même langage d’état, action de reprise contextualisée. |

## 3. États couverts

### Forces à préserver

- absence de parcours et leçon sans exercices ;
- découverte sans mots ;
- reprise de session ;
- soumission en cours ;
- erreur totale ou partielle de synchronisation ;
- utilisateur non connecté ;
- révision sans progression, à jour, ou disponible ;
- audio idle/loading/playing/paused/ended/error ;
- progression indéterminée, skeleton et réduction de mouvement.

### États à normaliser

Loading de page versus loading d’action, erreur pédagogique versus erreur technique, succès d’exercice versus succès de leçon, empty culturel versus empty technique, verrouillage versus donnée indisponible, fallback de traduction et auto-évaluation non notée.

## 4. État du design system

### Forces

- `Poppins` et `Amiri` sont chargées à la racine via `next/font`.
- Les tokens de marque, variantes `*_text`, radius, ombres chaudes et easings existent.
- Les primitives sont centralisées dans `components/ui`.
- `ArabicText` formalise `dir="rtl"` et `lang="ar"`.
- `AudioPlayer` gère les états et la coordination d’un seul audio actif.
- Le focus visible et `prefers-reduced-motion` sont pris en compte.

### Incohérences

| Sujet | État observé | Impact |
|---|---|---|
| Neutres | `#687280`, `#e5e7eb`, `#f6f7fb` encore actifs | Identité froide malgré la direction warm V2. |
| Typographie | Body 16/14, Caption 11, Display 44 dans `globals.css` | Sous-dimensionnement par rapport à la cible V2 17/15/12/56. |
| Valeurs en dur | `text-sm`, `text-[11px]`, `rounded-lg`, `p-5`, transitions dispersés | Les tokens ne gouvernent pas réellement toute l’interface. |
| Couleurs texte | Usages directs `text-success`, `text-primary` possibles | Risque de contraste et de sémantique non-AA. |
| Cartes | Conteneur par défaut de presque tous les écrans | Fatigue visuelle et poids équivalent de tous les contenus. |
| Arabe | Wrapper correct mais niveaux Quran non centralisés | Variations possibles entre mot, verset, exercice et fiche. |
| Motion | Certaines primitives génériques animent aussi dimensions/ombres | À contrôler par rapport à la règle transform/opacity. |

La priorité est de transformer le système en grammaire de produit avec des composants de niveau `PageHeader`, `FocusHeader`, `LessonCard`, `WordCard`, `ArabicVerse`, `AudioAction`, `FeedbackPanel`, `ProgressSummary`, `ReviewReason` et `SkillProgressList`.

## 5. Audit UX par axe

### Navigation — 3/5

Les quatre destinations principales et `aria-current` sont présents. Le bouton quitter avec confirmation est une bonne base. En revanche, le contexte courant, les retours et l’étape pédagogique sont trop discrets.

**Actions :** header contextuel P1, CTA primaire unique P1, retours cohérents P2.

### Hiérarchie — 3/5

La typographie existe mais les cartes empilées rendent dashboard, profil et découverte visuellement équivalents.

**Actions :** structure `intention → action → preuve → détails` P0 ; surfaces signature P1 ; stats secondaires P2.

### Cognition — 3/5

Le moteur protège déjà l’effort de rappel et la persistance. La découverte et l’introduction de leçon montrent cependant trop d’informations simultanément.

**Actions :** découper le flux P0 ; phrase de compétence humaine P1 ; détails secondaires repliables P2.

### Pédagogie — 3.5/5

La boucle `VOIR → COMPRENDRE → SE RAPPELER → PRODUIRE → FEEDBACK` est bien représentée dans le code. L’interface doit mieux distinguer apprendre, s’entraîner, s’auto-évaluer et réviser.

**Actions :** bandeau de compétence P0 ; raison de révision sans jargon P1 ; auto-évaluation distincte P1.

### Accessibilité — 3/5

Bon socle : focus, labels, `aria-current`, `aria-busy`, `role="status"`, cibles larges, reduced motion, RTL local. Risques : bottom nav en `11px`, textes muted et sémantiques non toujours AA, emoji dans des titres, information d’état parfois portée par la couleur.

**Actions :** audit contrastes P0 ; Caption ≥12px et cible ≥44px P1 ; icône/texte en plus de la couleur P1.

### Responsive — 3/5

La bottom nav et la safe-area sont positives. Le risque est la hauteur consommée par les cartes de dashboard, découverte et session à 375px.

**Actions :** mode focus LessonPlayer P0 ; tests 375/768/desktop P1 ; CTA primaire avant le fold P1.

## 6. Problèmes prioritaires

### P0

| ID | Axe | Effet | Recommandation |
|---|---|---|---|
| P0-01 | Dashboard | L’action du jour est ambiguë | Une seule carte de reprise/apprentissage/révision primaire. |
| P0-02 | LessonPlayer | La compétence n’est pas toujours comprise | Bandeau utilisateur : « Tu vas retrouver le sens ». |
| P0-03 | Leçon | Trop de contexte concurrent avant l’exercice | Séparer introduction, découverte et exercice. |
| P0-04 | Mobile | Header, carte, feedback et CTA dépassent la zone de focus | Header compact et CTA tactile persistant. |
| P0-05 | Tokens | V1 et V2 coexistent | Aligner neutres, tailles et variantes avant le polish. |
| P0-06 | Accessibilité | Texte sémantique potentiellement non-AA | Centraliser variantes texte/icône/surface. |

### P1

Découverte compacte et audio-first ; parcours narratif ; review sans jargon SRS ; fin de leçon signature ; compétences visibles dans le profil ; composants d’états unifiés ; Caption 12px et body 15px minimum ; niveaux arabes centralisés ; tests réels 375px/768px.

### P2

Réduire la répétition de mascottes ; retours contextuels ; transitions uniformes ; fallback de traduction plus court ; thème admin séparé ; empty states avec cause et prochaine action.

### P3

Galerie de design system comme outil QA ; micro-interactions ; emoji décoratifs marqués `aria-hidden` ; documentation des breakpoints et dimensions de focus.

## 7. Direction artistique Hikma

Hikma doit ressembler à un objet que l’on a envie de retrouver : un carnet de notes relié, posé près d’une lampe, avec une précision éditoriale. Trois mots à protéger : **sobre, vivant, mémorisable**. Trois pièges : corporate, scolaire, gamifié.

- Palette warm : orange signature pour action/accents, `primary-strong` pour texte AA, neutrals ivoire/cream, couleurs sémantiques vives réservées aux icônes et fonds dilués.
- Poppins pour le français et la translittération ; Amiri pour l’arabe. Une Display et un H1 maximum par page. Arabe vocalisé ≥18px mobile, line-height ≥1.9, sélection conservée.
- Cartes applicatives en hairline + radius 2xl ; surfaces signature en 4xl, ombre chaude diffuse et espace généreux. Aucune grille de cartes décoratives.
- Lucide comme base ; motifs religieux et arabesques interdits en décor. Une mascotte statique et contextuelle maximum par vue.
- Motion limitée à transform/opacity, une intention par animation, reduced motion systématique.
- Le contenu arabe est central ; audio immédiatement disponible, translittération secondaire, sens français ensuite, contexte selon l’étape. LTR français et RTL arabe restent locaux.
- Mobile-first : l’écran ajoute de l’espace sur desktop, pas des panneaux concurrents.

## 8. Skills UI/UX réutilisables

| Skill | Objectif / usage | Règles principales |
|---|---|---|
| `hikma-design-system` | Tokens et primitives, toute UI | Tokens, warm palette, AA, radius, ombres chaudes, motion contrôlée. |
| `hikma-page-redesign` | Toute page non pédagogique | Une intention, un H1, un CTA primaire, états complets. |
| `hikma-learning-ux` | Découverte, leçon, fin, profil | Boucle pédagogique, effort d’abord, verbes humains. |
| `hikma-exercise-ux` | Tous les exercices | Réponse cachée, feedback 3 états, auto-évaluation distincte. |
| `hikma-arabic-typography` | Mot, verset, phonétique | RTL local, diacritiques, Amiri, line-height ≥1.9, aucun tracking. |
| `hikma-mobile-ux` | 375/768px et tactile | Cibles ≥44px, CTA visible, safe-area, mode focus. |
| `hikma-accessibility` | QA AA, clavier et ARIA | Couleur jamais seule, focus, labels, live regions, reduced motion. |
| `hikma-motion-design` | Transitions et feedback | Transform/opacity, une intention par animation. |
| `hikma-dashboard-design` | Action du jour | Reprendre/apprendre/réviser, un CTA principal. |
| `hikma-review-design` | `/review` | Pourquoi le mot revient, aucun jargon SRS. |
| `hikma-audio-interaction` | Mot, verset, audio | Un audio actif, états, retry, cible tactile. |
| `hikma-pronunciation-ux` | Q1/Q3 | Écouter, répéter, enregistrer, auto-évaluation distincte. |
| `hikma-empty-error-loading-states` | États non nominaux | Une cause, un message, une action, ton non culpabilisant. |
| `hikma-visual-consistency` | QA de fin de phase | Aucun hardcode arbitraire, vocabulaire de surfaces unifié. |

## 9. Reuse / refactor / création

### Réutiliser

`Button`, `Card`, `Badge`, `Alert`, `Progress`, `Skeleton`, `Spinner`, `ArabicText`, `AudioPlayer`, `Mascot`, `ExerciseCard`, `FeedbackPanel`, `LessonPlayer`, `ReviewPlayer`, `LessonComplete`, `GoalRing`, `lesson-status`, `WordOccurrences`, `AppNav`, `GoalSettings`, `OnboardingForm`.

### Refactorer progressivement

`AppNav`, `Card`, `typography`, `ArabicText`, `Progress`, `Mascot`, `ExerciseCard`, `FeedbackPanel`, `Empty`, `ErrorState` et `LockedState`.

### Créer

`HikmaPageShell`, `PageHeader`, `FocusHeader`, `ContinueLearningCard`, `LessonCard`, `WordCard`, `ArabicVerse`, `AudioAction`, `SkillProgressList`, `ReviewReason`, `FeedbackState`, `HikmaEmptyState`, `HikmaErrorState` et des surfaces `standard / quiet / signature / elevated`.

## 10. Refonte complète versus polish

### Refonte complète

1. Shell et `AppNav`.
2. Dashboard.
3. `LessonPlayer`.
4. Découverte.
5. `/review`.
6. `LessonComplete`.

### Polish ciblé

Landing, parcours, unité, fiche mot, profil, onboarding, login, error, not-found, design system et admin.

## 11. Dépendances et roadmap

```text
Tokens / typo / niveaux arabes
            ↓
Surfaces / états / motion
            ↓
Shell / navigation
       ↙             ↘
Dashboard       Parcours
                     ↓
          Découverte / LessonPlayer
                     ↓
             Exercices / feedback
              ↙                  ↘
       Fin de leçon             Review
                     ↓
        Profil / onboarding / polish
                     ↓
       Mobile / accessibilité / QA finale
```

1. Design foundation.
2. Navigation + shell.
3. Dashboard.
4. Parcours d’apprentissage.
5. Découverte.
6. Exercices.
7. Fin de leçon.
8. Révision / SRS.
9. Profil / onboarding / settings.
10. Mobile + responsive.
11. Accessibility + motion + polish.
12. Final visual consistency audit.

## 12. Critères d’acceptation futurs

- Aucun contrat backend, route, grading, SRS, mastery, audio ou RLS modifié.
- Chaque écran a une intention primaire identifiable en moins de cinq secondes.
- Chaque écran pédagogique expose la compétence en langage humain.
- Aucune réponse n’est révélée avant soumission.
- Correct, incorrect, ambigu et auto-évaluation sont visuellement distincts.
- Arabe mobile ≥18px, line-height ≥1.9, RTL local, sélection conservée.
- Texte sémantique via variantes AA ; cibles tactiles ≥44px ; focus visible.
- CTA primaire visible dans les flux mobiles critiques.
- Une mascotte expressive maximum par vue ; aucune gamification ajoutée.
- Tests existants et états loading/error/success vérifiés après implémentation.

## Conclusion

Hikma n’a pas besoin d’une nouvelle application : il a besoin d’une mise en ordre éditoriale et visuelle de sa richesse actuelle. La meilleure direction est une interface chaude, précise et calme, structurée autour de l’action d’apprentissage du moment. Le système — tokens, shell, états et composants pédagogiques — doit précéder les détails décoratifs.

**Statut final : `UI_UX_GLOBAL_AUDIT_COMPLETE_READY_FOR_APPROVAL`**
