# PHASE 24C — HIKMA DESIGN SYSTEM FOUNDATION

**STATUS = `UX_UI_FOUNDATION_IMPLEMENTED`**

Phase d'**implémentation du socle UI** uniquement. Garanties :
`DATABASE_WRITES = 0` · `MIGRATIONS = 0` · `STORAGE_WRITES = 0` ·
`ENGINE_CHANGES = 0` · `RESOLVER_CHANGES = 0` · `CURRICULUM_CHANGES = 0` ·
`EXERCISES_CHANGES = 0` · `MASTERY_CHANGES = 0` · `SRS_CHANGES = 0`.

Source de vérité : `PHASE_24B_HIKMA_UX_UI_DESIGN_SYSTEM.md` + `tmp/phase24b-*.json`.

---

## 1. Résumé

Le socle Design System défini en 24B est implémenté : tokens (typographie
Display/Label, variantes texte AA, ombres, motion, `prefers-reduced-motion`),
composants modifiés (typographie, badge, mascotte, empty) et briques créées
(**AudioPlayer**, **ErrorState**, **LockedState**, **7 primitives d'exercice**,
pages **error/404 brandées**). Aucun écran (landing, dashboard, onboarding,
LessonPlayer, review, profile) n'a été redesigné ; aucune donnée ni aucun moteur
modifié.

---

## 2. Composants conservés

~50 composants existants (`button`, `card`, `progress`, `alert`, `input`,
`field`, `label`, `textarea`, `select`, `checkbox`, `radio-group`, `switch`,
`dialog`, `alert-dialog`, `tooltip`, `tabs`, `toast`, `spinner`, `skeleton`,
`separator`, `scroll-area`, `sidebar`, `avatar`, `kbd`, `table`, `menu`,
`popover`, `sheet`, `drawer`, `command`, `combobox`, `calendar`, `slider`,
`meter`, `toggle*`, `otp-field`, `number-field`, `autocomplete`, `toolbar`,
`accordion`, `collapsible`, `form`, `fieldset`, `input-group`, `pagination`,
`breadcrumb`, `frame`, `preview-card`, `group`, `arabic-text`, …) — conservés
tels quels, déjà corrects et cohérents.

Détail : `tmp/phase24c-component-inventory.json`.

---

## 3. Composants modifiés

| Composant | Modification | Raison |
|---|---|---|
| `components/ui/typography.tsx` | + `Display` (44px) et `Label` (12px) | Hiérarchie typographique 24B (§5) |
| `components/ui/badge.tsx` | Variantes success/error/info/warning en texte `*_text` AA | Corrige **U6** + le texte blanc sur fond 8% (illisible) |
| `components/ui/mascot.tsx` | + prop `decorative` (`aria-hidden`) | Accessibilité (usages décoratifs) |
| `components/ui/empty.tsx` | + slot `EmptyAction` | CTA des EmptyState (§19) |

---

## 4. Composants créés

| Composant | Rôle |
|---|---|
| `components/ui/audio-player.tsx` | AudioPlayer générique (idle/loading/playing/paused/ended/error ; play/pause/replay ; clavier, focus, cible ≥48px). **Non câblé au LessonPlayer** (phase ultérieure, §17). |
| `components/ui/error-state.tsx` | ErrorState : titre, message humain, Réessayer + Retour. Jamais d'info technique. |
| `components/ui/locked-state.tsx` | LockedState : quoi / pourquoi / comment déverrouiller (résout **U5**). |
| `components/ui/exercise.tsx` | 7 primitives : ExerciseContainer, ExercisePrompt, AnswerOption, AnswerGrid, ExerciseFeedback, ExerciseActions, ExerciseProgress. Visuelles uniquement, aucune logique moteur. |
| `app/error.tsx` | Page d'erreur brandée (résout **U4**). |
| `app/not-found.tsx` | Page 404 brandée (résout **U4**). |

---

## 5. Tokens ajoutés

- **Typographie** : `--text-display` (44px/1.15), `--text-label` (12px/1.3).
- **Couleurs texte AA** : `--color-primary-strong`, `--color-success-text`,
  `--color-error-text`, `--color-warning-text`, `--color-info-text` (+ valeurs
  claires dédiées en `.dark`).
- **Ombres** : `--shadow-card`, `--shadow-elevated` (diffuses, chaudes).
- **Motion** : `--ease-hikma`, `--ease-soft-out`, `--animate-feedback-in`,
  `--animate-reward-pulse` (+ keyframes `feedback-in`, `reward-pulse` —
  transform/opacity uniquement).
- **Accessibilité** : règle `@media (prefers-reduced-motion: reduce)`.

Validation : `tmp/phase24c-token-validation.json`.

---

## 6. Tokens modifiés

**Aucun.** La palette Hikma existante est conservée ; l'orange `#FF7732` reste
l'accent (CTA, progression, interactif, feedback), le fond reste calme et
respirant. Le passage du fond au crème (`#FCFAF5`) proposé en 24B était
« à valider au rendu » — **évité** en phase fondation pour ne pas introduire de
changement perçu ni de risque de contraste.

---

## 7. Décisions prises

1. **Structure** : conservation de `components/ui/` (flat) plutôt que le
   sous-dossier `components/hikma/` de l'exemple 24B §26 — la structure réelle
   du projet prime (24B §26 : « respecter la structure réellement présente »).
2. **Feedback générique** : pas de composant `feedback.tsx` séparé — `Alert`
   fournit déjà Success/Error/Warning/Info/Neutral ; `ExerciseFeedback` apporte
   le ton pédagogique humain (« Bien joué. » / « Presque. » / « Tu étais
   proche. »). Évite la duplication (24C §27).
3. **Nav mobile** : le passage 11px→12px d'`AppNav` est **reporté à 24I** (ne
   pas toucher à la coquille applicative en 24C, respect du §28).
4. **global-error.tsx** : reporté — `error.tsx` + `not-found.tsx` couvrent les
   cas courants ; `global-error` implique la reconstruction `<html>/<body>`,
   faible valeur marginale.
5. **Audio / primitives non câblés** : `AudioPlayer` et les primitives
   d'exercice sont créés mais **non branchés** aux écrans (§16/§17) — le
   branchement fonctionnel relève de 24F/24G.

---

## 8. Problèmes rencontrés

Aucun bloquant. Deux points signalés lors de l'implémentation :
- Le badge « success/error/info » existant utilisait un **texte blanc sur fond
  à 8 % d'opacité** (quasi illisible) — corrigé par le passage en `*_text` AA.
- Nommage : le `Label` typographique coexiste avec le `Label` de formulaire
  (`components/ui/label.tsx`) — documenté dans `typography.tsx` (fichiers
  distincts, pas de collision d'import).

---

## 9. Limites de validation visuelle

Aucun navigateur automatisé n'est disponible dans l'environnement (limitation
déjà documentée en 24A). La validation est donc **au niveau code** : compilation
Tailwind/CSS (build OK), typecheck, lint, inspection des classes/tokens. Le
rendu pixel et la vérification instrumentée des contrastes (axe-core) sont
reportés à **24I/24J**. Aucun résultat n'est inventé.

---

## 10. Résultats des tests (non-régression)

| Vérification | Résultat |
|---|---|
| `npm test` | **278/278** ✓ |
| `npx tsc --noEmit` | **0 erreur** ✓ |
| `npm run lint` | clean ✓ |
| `npm run build` | OK ✓ |
| `npm run verify:persistence` | **13/13** ✓ |
| `npm run verify:rls` | **38/38** ✓ |

Aucun test supprimé ni affaibli.

---

## 11. Non-régression données (§31)

| Compteur | Attendu | Réel | État |
|---|---|---|---|
| quran_words | 21 296 | 21 296 | ✓ |
| word_occurrences | 77 430 | 77 430 | ✓ |
| word_audio | 21 295 | 21 295 | ✓ |
| ayah_audio | 0 | 0 | ✓ |
| lemmas | 32 | 32 | ✓ |
| word_translations FR | 25 | 25 | ✓ |
| word_lemma_mapping | 183 | 183 | ✓ |

**Aucune écriture.**

---

## 12. Livrables

- `PHASE_24C_DESIGN_SYSTEM_FOUNDATION_REPORT.md` (ce rapport)
- `tmp/phase24c-design-system-evidence.json`
- `tmp/phase24c-component-inventory.json`
- `tmp/phase24c-token-validation.json`
- `tmp/phase24c-accessibility-audit.json`

---

## 13. Règle finale — ARRÊT

Après 24C : **ARRÊTER**. Ne pas commencer automatiquement 24D. Ne pas refaire la
landing, le dashboard, le LessonPlayer, le moteur pédagogique, les exercices, le
SRS ni les données. Le propriétaire doit examiner ce rapport puis donner une
approbation explicite pour la phase suivante.
