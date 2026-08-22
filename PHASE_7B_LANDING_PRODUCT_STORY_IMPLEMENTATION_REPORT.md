# Phase 7B — Landing Page · Product Storytelling & Conversion

## Statut

`UI_UX_7B_LANDING_PRODUCT_STORY_COMPLETE_READY_FOR_APPROVAL`

## A. Audit

L’audit Phase 7B avait établi que la landing 7A possédait une bonne première impression mais racontait encore Hikma par blocs parallèles : grille de cinq cartes pour la méthode, mot différent entre hero et section suivante, aucune scène d’erreur utile, aucune `HikmaExplanation` visible, et un parcours de démonstration avec progression implicite.

L’audit runtime avant implémentation avait également confirmé : 3 CTA `/learn/basmala`, 3 blocs arabes, aucun `AudioPlayer`, aucun feedback d’erreur et aucune erreur console.

## B. Architecture implémentée

La landing suit désormais un fil rouge statique autour de `ٱلرَّحْمَـٰنِ` :

```text
HERO
↓
LE PROBLÈME
↓
LE MOT AU CENTRE
↓
LA MÉTHODE
↓
LE CONTEXTE
↓
ÉCOUTER ET S’ENTRAÎNER
↓
L’ERREUR UTILE
↓
LE PARCOURS
↓
POUR QUI
↓
COMMENCER
```

La page reste un composant serveur déterministe. Les scènes de démonstration n’utilisent aucun état utilisateur, aucune requête Supabase et aucune logique de grading.

## C. Sections créées ou modifiées

- Hero conservé et réorienté vers `Voir un mot en action`.
- Section courte sur le problème : reconnaître/réciter sans toujours comprendre chaque mot.
- Fil rouge du mot : forme arabe, translittération, sens et dimensions de compréhension.
- Méthode Hikma montrée par fragments `VOIR → COMPRENDRE → SE RAPPELER → PRODUIRE → FEEDBACK`.
- Contexte coranique distinct : `Texte coranique`, `Traduction`, `Référence`.
- Audio honnête : lien vers la vraie leçon et séquence `Écoute → Répète → Compare`, sans URL audio inventée.
- Exercice statique avec scène de rappel et option sélectionnée, explicitement démonstrative.
- Feedback incorrect avec `Ta réponse`, `Réponse attendue` et `Comprendre pourquoi`.
- Parcours statique avec états terminée, en cours, prochaine et verrouillée, marqué comme démonstration.
- Section audiences sans notion de niveau ni promesse de placement automatique.
- CTA final narratif : `Commence par un mot` / `Commencer à apprendre` vers `/learn/basmala`.
- Design System Lab renommé `Landing / Product Storytelling`.

## D. Composants utilisés ou créés

- `components/app/landing.tsx` — composition publique, hero, CTA, footer.
- `components/app/landing-product-preview.tsx` — preview hero existante conservée.
- `components/app/landing-product-story.tsx` — nouvelles scènes statiques de storytelling.
- Primitives réutilisées : `ArabicText`, `Card`, `Button`, `HikmaProgress`, `HikmaFeedback`, `HikmaExerciseShell`, `ExerciseFeedback`, `HikmaExplanation` et `AnswerOption`.
- Aucun composant métier ou moteur d’exercice n’a été modifié.

## E. Responsive

Validation navigateur réelle sur :

| Format | Résultat |
|---|---|
| 1440×900 | PASS — CTA dans le viewport, sections rendues, aucun overflow |
| 1280×720 | PASS — CTA dans le viewport, sections rendues, aucun overflow |
| 390×844 | PASS — CTA dans le viewport, empilement lisible, aucun overflow |
| 375×812 | PASS — CTA dans le viewport, empilement lisible, aucun overflow |

Le document a conservé une largeur de scroll égale à la largeur du viewport sur les quatre formats.

## F. Accessibilité et intégrité pédagogique

- H1 unique et titres de sections reliés par `aria-labelledby`.
- CTA et liens construits avec `next/link` et primitives Hikma.
- Cibles principales conservées à au moins 44 px.
- Arabe rendu par `ArabicText`, RTL local, `lang="ar"`, diacritiques préservées.
- Texte coranique, traduction et référence séparés.
- Les états correct/incorrect sont accompagnés de texte et d’icônes, pas uniquement de couleur.
- La scène d’exercice est étiquetée comme démonstration et ne révèle pas une réponse dans la scène d’effort ; le feedback est présenté comme un état post-réponse.
- L’explication détaillée indisponible est annoncée honnêtement, sans analyse morphologique inventée.
- Aucun mouvement permanent ou nouvelle animation décorative n’a été ajouté.

## G. Tests

| Commande | Résultat |
|---|---|
| `npm test` | PASS — 34 fichiers, 428 tests |
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS — Next.js 16.3.0, génération statique réussie |

Aucun test métier n’a été modifié et aucun nouveau test n’était nécessaire pour ces compositions statiques.

## H. Browser Validation

Runtime utilisé : build production local via `next start --port 3010`, puis navigateur neuf.

Vérifications effectuées :

- aucune erreur ou warning console ;
- aucun symptôme d’hydratation observé ;
- aucun overflow horizontal ;
- CTA `/learn/basmala` rendu et visible dans le viewport ;
- six blocs arabes `lang="ar"` présents dans la page finale ;
- sections `method`, `context`, `practice`, `feedback-story` et `path-story` rendues ;
- footer rendu ;
- libellé de démonstration du parcours présent ;
- viewport réinitialisé et session navigateur finalisée après validation.

## I. Régression et périmètre métier

Confirmé inchangé par cette phase :

- backend ;
- DB et migrations ;
- Supabase ;
- grading ;
- scoring ;
- SRS ;
- mastery ;
- scheduler ;
- interleaving ;
- curriculum ;
- générateurs d’exercices ;
- persistance ;
- données Quran ;
- audio backend ;
- logique d’authentification métier.

L’audio n’est pas simulé : la landing renvoie vers la leçon réelle pour l’écoute et ne fabrique aucune URL signée publique.

## J. AFTER_STATE

La landing ne se contente plus de décrire Hikma. Elle montre une continuité produit : un mot devient forme, sens, contexte, écoute, effort, feedback et étape de parcours. Les scènes restent sobres, statiques, accessibles et indépendantes des données utilisateur.

## Éléments restant non validés

Aucun élément requis de la Phase 7B ne reste en attente. Les interactions métier internes à `/learn/basmala` restent hors périmètre et n’ont pas été modifiées.

La Phase 7C n’est pas commencée.
