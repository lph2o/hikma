# PHASE 94 — DESIGN SYSTEM SURFACE HIERARCHY + CARD DEPTH

## VERDICT

```
PHASE_94_SURFACE_HIERARCHY_COMPLETE
DATABASE_WRITES = 0
REGRESSIONS = 0
P0 = 0 · P1 = 0 · P2 = 2 (hors périmètre) · P3 = 2
```

**« Les surfaces et cartes de Hikma ont-elles maintenant une hiérarchie visuelle claire sur desktop ET mobile ? » → OUI.** La séparation est désormais portée par border + ombre perceptibles, sans hover, à 360-430px.

## TOKENS — BEFORE → AFTER

| Token | Avant | Après | Contraste (vs ivory / vs cream) |
|---|---|---|---|
| `--border` | `#d7e0dc` | `#c7d5ce` | 1.263 → **1.422:1** / **1.493:1** |
| `--border-subtle` | `#e4ece8` | `#d9e4de` | 1.127 → **1.222:1** / **1.283:1** |
| `--shadow-card` | 0.04 + 0.10 (imperceptible) | 0.05 + **0.14** (12/32px) | douce mais réelle |
| `--shadow-elevated` | 0.06 + 0.16 | 0.07 + **0.18** (18/44px) | échelon clair |
| `--shadow-overlay` | — | ajouté (0.14 + 0.22) | niveau 4 |

Dark mode harmonisé : `--border #315957→#3b6a66`, `--border-subtle #284b49→#305954`.

## Décisions de design (clarté > décoration)

1. **Pas de changement des couleurs de surface claires** : cream/ivory sont physiquement à ~1.05:1 — aucune teinte ne peut les séparer. Le mécanisme d'élévation des surfaces claires est **border + shadow** (mesuré, pas arbitraire).
2. **shadow-card renforcée mais douce et chaude** (charbon chaud, jamais noir dur) : perceptible sans hover sur mobile, non décorative.
3. **shadow-elevated** renforcée légèrement → échelon clair au-dessus de card.
4. **border re-sémantisé** : `border` = bordure de carte (1.49:1), `border-subtle` = hairline/imbriqué (1.28:1).
5. `--input: var(--border)` → les champs héritent automatiquement de la bordure visible.
6. **Règle imbriqués : jamais la couleur du parent.**

## Composants

- `app/globals.css` — tokens (le cœur du correctif).
- `app/(app)/learn/page.tsx` — imbriqué « Prochaine étape » : `bg-surface-elevated/70` (1.000:1) → `bg-surface-elevated + border border-border-subtle` (1.193:1 + inversion de teinte), hover `border-border + bg-surface-subtle`.
- **`components/ui/card.tsx` : non modifié** — la base `border-border + shadow-card` corrige globalement les 23+ usages du pattern faible par simple propagation des tokens.

## Hiérarchie obtenue

**Level 0** ivory (page) · **Level 1** hairlines/sections plates · **Level 2** cartes standards (border 1.49:1 + ombre douce) · **Level 3** featured (TodayCard, « Ta progression » : featured + border-primary/20 + shadow-elevated) · **Level 4** overlays (Base UI, token overlay documenté).

Dashboard : TodayCard reste le seul élément featured — la hiérarchie featured > standard > info est maintenant perceptible au repos.

## Validation

```
TYPECHECK = PASS · LINT = 0 erreur · TESTS = 1063/1063 · BUILD = PASS
CSS compilé : #c7d5ce / #d9e4de / 0 12px 32px / 0 18px 44px présents
HTML rendu : imbriqué /learn corrigé vérifié
```

⚠ 1 échec **flaky** initial sur `lesson-completion.test.ts` (simulation d'erreurs réseau, dépendant du timing) — confirmé stable après 2 re-runs isolés (14/14) + run complet 1063/1063. Sans lien avec cette phase (tokens CSS uniquement).

## Reste hors périmètre (suivi)

93-P2-05 contraste barre gold · 93-P2-01 stats dashboard · P1 mobile 93 (barre sticky exercice + clavier arabe) → **PHASE 95**.

```
DATABASE_WRITES = 0
REGRESSIONS = 0
```

Rapport : `reports/phase-94-surface-hierarchy.json` (validé) + `-summary.md`.
