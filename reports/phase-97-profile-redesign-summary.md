# PHASE 97 — PROFIL REDESIGN + CARTES FEEDBACK/EXERCICE

## VERDICT

```
PHASE_97_PROFILE_REDESIGN_COMPLETE
TYPECHECK = PASS · LINT = 0 erreur · TESTS = 1090/1090 · BUILD = PASS
DATABASE_WRITES = 0 · MIGRATIONS = 0 · REGRESSIONS = 0 · P0/P1/P2 = 0
```

## 1. Redesign de la page Profil

Direction validée : **Identité → Mon apprentissage → Préférences → Compte & aide** (rows de préférences + sous-pages = progressive disclosure). Fini l'aspect « formulaire administratif ».

**Avant :** en-tête mascotte + grille de 4 cartes stats (dupliquant le Dashboard) + 3 grosses cartes (Objectif quotidien, Rappels, Préférences d'apprentissage) avec 7 champs/selects empilés et de longs paragraphes explicatifs.

**Après :**
- **Identité** : avatar initiales (cercle teal), nom en H1, « Ton espace Hikma », lien « Modifier le nom », pastille **dorée** « X jours de régularité » (gold = accomplissement, affichée seulement si streak > 0), « X mots appris · Y leçons », « Membre depuis ».
- **Mon apprentissage** : 6 rows (Objectif quotidien, Sourate de départ, Lecture de l'arabe, Relation avec le Coran, Temps souhaité, Rythme) — icône + libellé + valeur actuelle + chevron, groupés en une surface avec hairlines.
- **Préférences** : row Rappels (Activés · 19:00 / Désactivés).
- **Compte & aide** : Confidentialité → /privacy, Conditions d'utilisation → /terms, Se déconnecter (destructif).
- **8 sous-pages** : /profile/{nom, objectif, parcours, lecture, relation, temps, rythme, rappels} avec retour « ← Profil ».
- **Supprimé** : la grosse carte Préférences, les paragraphes explicatifs longs, la grille de statistiques (le Dashboard reste le lieu de la progression).

Règles respectées : gold réservé à la progression, teal pour les actions, rows ≥ 44px, focus visible, aria (radiogroup, aria-checked), aucune logique métier modifiée (les mêmes server actions sont réutilisées). Options extraites dans `lib/learning/preferences.ts` (source unique partagée avec learning-preferences.tsx).

## 2. Correctifs cartes feedback / exercice (votre demande)

Deux bugs visuels signalés, même cause racine : **`CardContent` n'a pas de `flex` de base** → un `gap-*` nu est un no-op silencieux et les enfants rendent collés/alignés à gauche au lieu de prendre la largeur avec leurs marges.

| Signalé | Cause | Correctif |
|---|---|---|
| Review : carte « Très bien » collée aux réponses, éléments décalés à droite | `CardContent className="gap-5 p-6"` sans flex → gap no-op | `flex flex-col gap-5 p-6` — vérifié : écart options→feedback **20px**, symétrie parfaite (49→341) |
| Exercice : trait « Ce que tu apprends » collé aux éléments en dessous | `CardContent className="gap-6 p-6 sm:gap-8 sm:p-8"` sans flex | `flex flex-col gap-6 …` — vérifié : **24px** sous la ligne, contenu symétrique (45→345) |
| Landing : 2 préviews feedback mêmes symptômes | 2 × `gap-6 p-6 sm:p-8` sans flex | `flex flex-col gap-6 …` (les 2 occurrences) |

Vérification réelle en headless (session authentifiée, /review + page leçon) : les trois conteneurs corrigés, plus aucun `CardContent className="gap-…"` sans `flex` dans app/components. Le bug était **le même partout sur la plateforme** — il est maintenant traité à la racine et couvert par un contrat de régression.

## 3. Fichiers

- **Créés** : `lib/learning/preferences.ts`, `components/app/{profile-row,profile-preference-form,profile-option-page,display-name-form}.tsx`, 8 sous-pages `app/(app)/profile/*/page.tsx`, `tests/card-spacing-contract.test.ts` (3 contrats), `reports/phase-97-profile-redesign.json`.
- **Modifiés** : `app/(app)/profile/page.tsx` (redesign), `components/app/learning-preferences.tsx` (source unique), `components/learn/review-player.tsx`, `components/learn/exercises/hikma-exercise-shell.tsx`, `components/app/landing-product-story.tsx`, `AGENTS.md`.

## 4. Validation

- Typecheck PASS · lint 0 erreur (20 warnings préexistants hors de mes fichiers) · **1090/1090 tests** (1087 + 3 contrats card-spacing) · build PASS.
- Mobile 390 : profil rendu (identité + 8 rows, ancien formulaire absent), 0 overflow (docSW 390 = vw).
- `DATABASE_WRITES = 0` — seuls des lectures pour la mesure.

## 5. Prochaine phase

Validation visuelle humaine sur téléphone réel, puis déploiement preview groupé (phases 96B → 97) avant toute mise en production.
