# AUDIT READ-ONLY — ÉTAT ACTUEL DE L'ONBOARDING HIKMA

## Décision

`ONBOARDING_ALREADY_IMPLEMENTED_AND_VALIDATED`

L'onboarding obligatoire est **déjà implémenté, versionné et validé** (Phases
32A → 32I, puis intégration de personnalisation en 33B). Il couvre l'essentiel
de la « Priority 1 ». **Aucune refonte n'est nécessaire.** Il ne reste que des
micro-polish (P3) et une option E2E. Aucun fichier n'a été modifié pendant cet
audit.

---

## 1. Ce qui existe

### Route & gardes

- `app/(onboarding)/onboarding/page.tsx` — `force-dynamic`, garde serveur :
  visiteur → `/login` ; onboarding terminé → `/dashboard` ; charge
  `getSurahCatalog`.
- `app/(onboarding)/layout.tsx` — shell minimal **sans** `AppNav` (groupe séparé
  pour éviter toute boucle de redirection).
- `app/(app)/layout.tsx` — redirige tout utilisateur authentifié non
  `isOnboardingComplete` vers `/onboarding` (version `< 2` incluse).
- `lib/learning/actions.ts` → `redirectAfterAuthentication` — choisit
  `/dashboard` ou `/onboarding` après connexion.

### Formulaire (9 écrans techniques regroupés en 6 étapes UX)

`components/app/onboarding-form.tsx` :

| Écran | Contenu |
| --- | --- |
| 0 | Bienvenue (hero + promesse + mascotte) |
| 1 | Prénom (`display_name`) |
| 2 | Objectif (`learning_goal`, 5 choix) |
| 3 | Niveau de lecture arabe (`arabic_reading_level`, 5) |
| 4 | Familiarité avec le Coran (`quran_familiarity`, 5) |
| 5 | Durée souhaitée (`daily_duration`, 5 + « quand j'ai le temps ») |
| 6 | Rythme (`learning_pace`, 4) |
| 7 | Choix de sourate (recommandation + alternatives + `IN_PREPARATION` listées sans CTA) |
| 8 | Récapitulatif + `Commencer mon parcours` → célébration → redirection |

Regroupement UX en 6 étapes via `lib/learning/onboarding-presentation.ts`
(`getOnboardingUxStage`) — pas de compteur « X / Y » administratif.

### Données collectées (`user_settings`, toutes nullable)

`display_name`, `learning_goal`, `arabic_reading_level`, `quran_familiarity`,
`daily_duration`, `learning_pace`, `preferred_surah_number`.

### Persistance

`completeOnboarding` (server action) — valide les enums **et** la disponibilité
de la sourate (`IN_PREPARATION` refusée), upsert `user_settings`
(`onboarded = true`, `onboarding_version = 2`), **ne réinitialise jamais la
progression** (mots, sessions, SRS, mastery inchangés).

### Recommandation

`lib/learning/onboarding.ts` → `recommendStartingSurah` (pure, déterministe) :
choix explicite → sourate courte si durée courte/niveau débutant → Al-Fātiḥah →
plus courte. Refuse `IN_PREPARATION`.

### Post-onboarding

- `app/(app)/profile/page.tsx` → `LearningPreferences` (mêmes 7 champs,
  rééditables) et `GoalSettings` (objectif quotidien `words/5`, **séparé** de la
  préférence `daily_duration`).
- Personnalisation réellement consommée (Phase 33B) : salutation/ouverture du
  dashboard, raison de recommandation, carte « Pour toi » de `/surahs`, copy de
  confiance du profil.

### Design system appliqué

Teal structurel, or Hikma en accent (recommandation/progression/sélection/
célébration), mascotte, confettis légers (`prefers-reduced-motion` respecté),
radiogroups + libellés accessibles, mobile-first, noms de sourates en RTL via
`ArabicText`.

### Tests existants

- `tests/onboarding-recommendation.test.ts` (7) — recommandation + gate de version.
- `tests/onboarding-ux.test.ts` (4) — étapes UX, résumé fidèle, session expirée.
- Plus activité/personnalisation → **671 tests au total**, tous verts.

---

## 2. Ce qui manque (écarts réels, tous mineurs)

| # | Prio | Écart | Localisation |
| --- | --- | --- | --- |
| 1 | P3 | Fallback `redirectTo="/learn/basmala"` encore ancré Al-Fātiḥah (utilisé **uniquement** si la sourate choisie n'a pas de `firstLessonSlug`). | `app/(onboarding)/onboarding/page.tsx` |
| 2 | P3 | Paramètres `goalType` / `goalValue` présents dans `completeOnboarding` mais **jamais envoyés** par le formulaire (objectif toujours `words/5`). | `lib/learning/actions.ts` |
| 3 | — | `daily_duration` (préférence douce) vs `daily_goal` (`words/5`, éditable via `GoalSettings`) sont **volontairement séparés** — design documenté (32B), pas un écart. | — |
| 4 | P3 | Pas d'E2E onboarding automatisé dans la suite commitée (32G = vérifications HTTP + navigateur, pas de fichier Playwright dédié). | — |

---

## 3. Fichiers / routes / tables / composants

- **Routes** : `/onboarding`, `/login`, `/dashboard`, `/profile`, `/surahs`, `/learn`.
- **Tables** : `user_settings` (10 colonnes déjà présentes — **aucune migration nécessaire**).
- **Composants réutilisables** : `Card`, `Button`, `Mascot`, `ArabicText`,
  `HikmaReveal`, `HikmaProgress`, typographies ; internes au formulaire :
  `StepShell`, `ChoiceStep`, `ChoiceButton`, `SurahChoice`, `SummaryCard`,
  `ProgressRail`, `Celebration`.

## 4. Migrations nécessaires

**Aucune.** Le schéma `user_settings` couvre déjà tous les champs.

## 5. Risques

- Aucun P0/P1/P2 identifié. `completeOnboarding` ne touche qu'aux préférences +
  au flag `onboarded` ; moteur pédagogique, SRS, mastery et progression déjà
  protégés.
- **Risque principal** : « refaire » l'onboarding casserait une expérience
  validée. Recommandation : ne pas refondre.

## 6. Proposition d'architecture (inchangée)

Conserver l'architecture actuelle (server actions + catalogue dynamique +
préférences nullable + présentation pure). Pas de nouveau moteur, pas de table,
pas de design system additionnel.

## 7. Plan d'implémentation minimal proposé

1. **(P3)** Remplacer le fallback `redirectTo="/learn/basmala"` par une
   destination neutre (`/surahs` ou `/learn`) — 1 ligne, supprime le dernier
   ancrage Al-Fātiḥah de l'onboarding.
2. **(P3, optionnel)** Retirer les paramètres morts `goalType`/`goalValue` de
   `completeOnboarding` (simplification sans impact).
3. **(Optionnel)** Ajouter un test E2E Playwright du parcours onboarding
   (nouvel utilisateur → 9 écrans → célébration → redirection vers la première
   leçon) — valeur ajoutée, sans répéter l'existant.

## 8. Décision finale

`ONBOARDING_ALREADY_IMPLEMENTED_AND_VALIDATED`

Exécuter uniquement les micro-polish (1–2 lignes) si souhaité ; sinon, passer
directement à la **Priority 2** (étude des idées pertinentes de Quran Progress,
à ne lancer qu'après validation). Aucune migration, aucun commit.
