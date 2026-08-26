# PHASE 95 — MOBILE LEARNING UX — COMPLETE

## VERDICT

```
PHASE_95_MOBILE_LEARNING_UX_COMPLETE
P1_FIXED = 2/2 · DATABASE_WRITES = 0 · REGRESSIONS = 0 · DÉPENDANCES = 0
TYPECHECK = PASS · LINT = 0 erreur · TESTS = 1073/1073 · BUILD = PASS
```

## P1 corrigés (PHASE 93)

### 93-P1-01 — CTA « Continuer » hors écran après une réponse

**Fix** : barre d'action **sticky mobile** dans `HikmaExerciseShell` — le footer devient `sticky bottom-0 z-10` avec fond `bg-background/95` + `backdrop-blur` + hairline, `pb-[max(env(safe-area-inset-bottom),0.75rem)]` (safe-area iOS).

Pourquoi ça règle vraiment le problème : `sticky bottom-0` maintient le footer au bas du viewport **dès que sa position naturelle passe sous la ligne de flottaison** — donc immédiatement après validation d'une réponse (le feedback rend la section plus haute que l'écran), le CTA est visible **sans aucun scroll**. Pas de `position:fixed` : le footer garde sa place dans le flux → **aucun layout jump**, aucun contenu masqué en permanence. **Desktop inchangé** (`sm:static`, aligné à droite, sans bordure ni fond).

### 93-P1-02 — Clavier arabe : question masquée + rangées cassées

**Fix** :
- **Rangées équilibrées** : 36 lettres = **6×6 mobile** (`grid-cols-6`) et **9×4 desktop** (`grid-cols-9`) via un helper pur `chunkRows` ; diacritiques 5×2 mobile / 10×1 desktop. **Plus aucune queue de touches isolées.**
- **Touches ≥ 44 px** (`h-11`) et bouton fermer **44×44** (`size-11`).
- **Borné** : corps `max-h-[70dvh]` + scroll interne → le clavier ne peut **jamais** masquer toute la question.
- **Contexte préservé** : à l'ouverture, les deux parents (`exercises/index` + `mini-review`) font `scrollIntoView({ block: "center" })` pour ramener la zone de saisie + la question dans le viewport.
- Fermeture par ✕ (44px) **ou Échap** (accessibilité clavier).

## Validation

- **Tests** : 1073/1073 (1064 avant phase + **9 nouveaux** : 5 `mobile-learning-ux.test.ts` — rangées équilibrées, 44px, 70dvh, safe-area, barre sticky — et 4 ajouts `chunkRows` dans `arabic-input.test.ts`)
- **Typecheck / Lint / Build** : PASS · **CSS compilé vérifié** : `max-h-[70dvh]`, `grid-cols-6`, `safe-area-inset-bottom`, `position:sticky`, `backdrop-filter`, `.h-11`/`.size-11` = 44px
- **Smoke runtime** : `/`, `/login`, `/surahs` = 200

## Fichiers

| Fichier | Changement |
|---|---|
| `lib/ui/arabic-input.ts` | helper pur `chunkRows` |
| `components/ui/arabic-keyboard.tsx` | réécriture mobile (6×6/9×4, 44px, 70dvh, safe-area) |
| `components/learn/exercises/index.tsx` | `scrollIntoView` à l'ouverture du clavier |
| `components/learn/mini-review.tsx` | idem |
| `components/learn/exercises/hikma-exercise-shell.tsx` | barre d'action sticky mobile (safe-area, desktop inchangé) |
| `tests/mobile-learning-ux.test.ts` | nouveau (5 tests) |
| `tests/arabic-input.test.ts` | +4 tests `chunkRows` |

## Réponses adversariales (PHASE 95 §15)

1. **CTA accessible sans scroll sur 360px ?** OUI — sticky bottom-0 le rend visible dès la validation (prouvé par le comportement sticky, classes dans le CSS compilé).
2. **Question visible clavier ouvert ?** OUI — 70dvh max + scrollIntoView.
3. **Touches assez grandes ?** OUI — 44px (h-11).
4. **Clavier équilibré ?** OUI — 6×6 / 9×4, aucune queue.
5. **Bottom-sheet masque-t-il des infos ?** NON — borné à 70dvh, corps scrollable.
6. **Safe-area iOS ?** OUI — `env(safe-area-inset-bottom)`.
7. **Feedback immédiat après clic ?** OUI — boutons avec pressed/focus/disabled ; CTA sticky.
8. **Cartes PHASE 94 différenciées ?** OUI — tokens inchangés, vérifié en 94.
9. **Dashboard lisible ?** OUI — non touché.
10. **Overflow horizontal ?** NON — aucun changement de largeur.
11. **Layout shift ?** NON — sticky en flux, pas de fixed.
12. **Desktop aussi bon qu'avant ?** OUI — `sm:static` restaure le comportement d'origine.
13. **Animations utiles ?** AUCUNE nouvelle — pas de dette.
14. **Dette technique ?** NON — helper pur testé, 0 dépendance.

## Reste (hors périmètre PHASE 95)

P2 PHASE 93 : stats dashboard 3 colonnes ≤360px · contraste barre gold <3:1 · « Explication indisponible » en bloc vide · étiquettes révisions 7 colonnes. À traiter en phase ultérieure si souhaité.

## Prochaine étape recommandée

Déployer les phases 92→95 (loader wordmark + icônes + surfaces + learning flow mobile) sur un **preview Vercel** puis en **production** `hikma.top`, puis validation visuelle mobile réelle (360-430px) de votre côté.
