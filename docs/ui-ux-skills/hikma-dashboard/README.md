# `hikma-dashboard`

## Objectif

Concevoir le dashboard comme un centre d’action pédagogique : l’utilisateur comprend en quelques secondes où reprendre, pourquoi réviser et comment progresser.

## Quand l’utiliser

Pour toute création ou refonte de `/dashboard`, de ses états de chargement/empty/error ou de ses composants de résumé directement liés à l’accueil applicatif.

## Données autorisées

- `activeSession` et `nextLesson` pour la reprise/prochaine étape ;
- `lessonsCompleted`, `totalLessons`, `wordsSeen`, `avgMastery` pour le résumé ;
- `reviewDueCount` pour les révisions disponibles ;
- `getUpcomingReviewCounts` pour les révisions futures ;
- `getDailyGoalProgress` pour le rythme du jour ;
- `getActivityHistory` pour l’activité réellement enregistrée ;
- `curriculum` pour vérifier la présence du parcours.

Ne jamais inventer XP, streak, niveau, temps d’étude, score ou activité.

## Hiérarchie obligatoire

1. Salutation et contexte.
2. Continuer / commencer la prochaine leçon.
3. Réviser si des mots sont dus.
4. Rythme quotidien.
5. Progression du parcours.
6. Résumé et activité.
7. Révisions à venir.

Une seule action primaire doit dominer la vue.

## États

- `loading` : skeleton de la même composition que le dashboard réel ;
- `empty` : curriculum absent, message pédagogique et aucune fausse progression ;
- `first_visit` : `wordsSeen === 0`, aucune session active, aucune leçon terminée ;
- `active_learner` : reprise ou prochaine leçon ;
- `review_due` : `reviewDueCount > 0`, CTA Réviser maintenant ;
- `review_not_due` : aucun mot dû, mais distinction entre absence d’historique et mots déjà étudiés ;
- `completed_path` : parcours terminé, CTA de révision ;
- `error` : message compréhensible, retry géré par le segment parent sans exposer la technique.

## Composants

- `Card` et surface featured pour l’action principale ;
- `HikmaProgress` pour la progression humaine ;
- `GoalRing` pour le rythme quotidien ;
- `UpcomingReviews` et `ActivityHistory` pour les données réelles ;
- `Mascot` uniquement si elle accompagne l’accueil ou un état vide ;
- `Button` avec un seul CTA primaire.

## Responsive

- 360–430px : une colonne, texte court, CTA pleine largeur ;
- 768px : passage possible en deux colonnes pour actions secondaires ;
- 1024px+ : grille respirante, contenu limité, aucun panneau décoratif ajouté.

## Accessibilité

- un H1 et une hiérarchie continue ;
- landmarks `main`, `header`, `section` et labels utiles ;
- progression avec libellé textuel, jamais couleur seule ;
- cibles tactiles ≥44px ;
- ordre clavier identique à la hiérarchie visuelle ;
- contraste via tokens AA ;
- pas d’emoji nécessaire à la compréhension.

## Anti-patterns

- KPI avant le CTA ;
- statistiques techniques du corpus ;
- « Tout est à jour » quand l’utilisateur n’a jamais étudié ;
- double CTA primaire ;
- graphique dominant ;
- streak, XP, trophées ou copy culpabilisante ;
- données simulées pour remplir une carte ;
- mascotte géante qui remplace le contenu.

## Critères d’acceptation

- L’action principale est identifiable en moins de cinq secondes.
- La reprise utilise `activeSession` avant `nextLesson`.
- `reviewDueCount === 0` ne masque pas la différence entre jamais étudié et pas encore dû.
- Les statistiques restent secondaires.
- Les états loading/empty/first visit/active/review/completed existent.
- Le dashboard fonctionne avec l’App Shell Phase 2 et aucun contrat métier n’est modifié.
