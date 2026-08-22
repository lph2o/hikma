# PHASE 24H-UX-NAV-REVIEW-B — CORRECTION UX NAVIGATION + RÉVISION

**STATUS = `UX_NAV_REVIEW_COMPLETE`** — correction strictement UX/navigation/rendu des états de révision.

---

## 1. État avant

- Un utilisateur connecté était redirigé de `/` vers `/dashboard` (intentionnel 24D), mais le **logo « Hikma » de la sidebar n'était pas cliquable** (simple `<div>`).
- `/review` ne possédait qu'un écran vide unique : « Tout est à jour ! Rien à réviser 🎉 » quel que soit l'état — donc un utilisateur venant de terminer sa première leçon lisait « rien à réviser » comme si sa progression avait disparu.

## 2. Cause des problèmes

- **Navigation** : le wordmark était rendu hors de tout `<Link>` ; aucun retour évident via le logo.
- **Révision** : `review/page.tsx` branchait uniquement sur `items.length === 0` (données SRS `review_items`), sans jamais lire la progression réelle (`user_word_progress`) ni la prochaine échéance → confusion « jamais étudié » vs « étudié mais pas encore dû ».

## 3. Modifications effectuées

| Fichier | Changement |
|---|---|
| `lib/navigation.ts` (nouveau) | `APP_HOME_HREF` + `NAV_ITEMS` — source unique des routes, testable sans React/Next |
| `components/app/app-nav.tsx` | logo Hikma → `<Link href="/dashboard">` (`aria-label`, `focus-visible:ring`) ; `NAV_ITEMS` importés ; icônes via `NAV_ICONS` |
| `lib/learning/review-status.ts` (nouveau) | `classifyReviewState()` (pur) + `formatNextReviewLabel()` (pur) — aucun I/O, aucun calcul SRS |
| `lib/learning/queries.ts` | `getReviewOverview()` — lit `dueCount` + `studiedCount` + `nextReviewAt` (lecture seule, 0 écriture) |
| `app/(app)/review/page.tsx` | 3 états UX distincts + microcopy + « Prochaine révision » |

## 4. États `/review` implémentés

| État | Condition | Affichage |
|---|---|---|
| **A — Aucun apprentissage** | `studiedCount === 0` (aucune ligne `user_word_progress`) | « Rien à réviser pour le moment » · « Commence une première leçon… » · CTA **Commencer une leçon** → `/learn` |
| **B — Mots étudiés, rien de dû** | `studiedCount > 0`, `dueCount === 0` | « Tout est à jour 🎉 » · « Tu as déjà étudié des mots. Rien n'est à réviser maintenant. » · « Prochaine révision : demain / dans X jours » (si disponible) · CTA **Continuer à apprendre** + **Voir mon parcours** |
| **C — Révisions disponibles** | `dueCount > 0` | « Tu as des mots à réviser » · « X mots sont prêts à être révisés. » · ReviewPlayer |
| **D — Révision terminée aujourd'hui** | — | **Non implémenté comme état distinct** : les journaux d'activité fusionnent leçons et révisions (`user_activity_words`), il est impossible de distinguer « révision du jour » sans inventer une donnée. Replié dans l'état B. |

**Règle respectée** : `review_items.length === 0` n'est **jamais** confondu avec « jamais étudié » — la source retenue pour « a déjà étudié » est `user_word_progress` (vue agrégée réelle, même signal que `wordsSeen` du dashboard).

## 5. Navigation corrigée

- Logo Hikma **cliquable** → `/dashboard` (lien réel, `aria-label="Hikma — accueil"`, focus clavier visible).
- Item **« Accueil » → `/dashboard`** conservé, état actif via `isPathActive` + `aria-current`.
- Aucun nouvel élément de navigation ajouté.

## 6. Microcopy

Ton calme, friendly, professionnel : « Rien à réviser **pour le moment** », « Tu as **déjà étudié** des mots », « **Prochaine révision** : demain ». Aucune formulation laissant croire à une perte de progression ; « Rien à réviser » n'est jamais affiché seul quand l'utilisateur a étudié.

## 7. Tests ajoutés

- `tests/review-status.test.ts` — 10 tests : NO_PROGRESS / UP_TO_DATE / DUE ; « demain » / « dans 2 jours » / « dans 3 jours » ; absence de date → null ; date invalide/passée → null ; déterminisme + non-mutation.
- `tests/navigation.test.ts` — 3 tests : logo → `/dashboard` ; « Accueil » → `/dashboard` ; 4 routes présentes et uniques.
- **Aucun calcul SRS modifié** : les tests existants du scheduler/learning/mastery passent inchangés (régression vérifiée par la suite complète).

## 8. Non-régression

| Vérification | Résultat |
|---|---|
| `npm test` | **352/352** (339 + 13 nouveaux) ✓ |
| `npx tsc --noEmit` | **0 erreur** ✓ |
| `npm run lint` | clean ✓ |
| `npm run build` | OK ✓ |
| `npm run verify:persistence` | **13/13** ✓ |
| `npm run verify:rls` | **44/44** ✓ |

## 9. Données vérifiées (inchangées)

`quran_words` 21 296 · `word_occurrences` 77 430 · `word_audio` 21 295 · `ayah_audio` 0 · `lemmas` 32 · `word_translations FR` 25 · `word_lemma_mapping` 183.

**Aucune migration, aucune écriture DB/Storage, aucun changement de :** `review_items.next_review_at`, `user_word_skill_progress.retention`, moteur pédagogique, mastery, SRS, grading, curriculum, phonétique, audio, données Quran, traductions, mappings.

## 10. Limitations

- **`BROWSER_VALIDATION_PENDING`** — aucun navigateur automatisé : le rendu pixel-perfect, tactile, clavier et axe-core n'est pas validé ici (à traiter en 24I/24J).
- **ÉTAT D non distingué** — voir §4 (donnée insuffisante, pas de date inventée).
- Navigation testée au niveau des **constantes** (`lib/navigation.ts`) : vitest est en environnement `node` (pas de jsdom/rendu composant).

---

**Livrables** : `PHASE_24H_UX_NAV_REVIEW_B_IMPLEMENTATION_REPORT.md` · `tmp/phase24h-ux-nav-review-b-audit.json` (ÉTAPE 0) · `tmp/phase24h-ux-nav-review-b-evidence.json`.

**ARRÊT OBLIGATOIRE** : 24H-Q2, 24I, 24J, 24K, 23G non démarrés — en attente de l'approbation du propriétaire.
