# PHASE 96 — MODERN MOBILE BOTTOM NAVIGATION + LINK/CTA TYPOGRAPHY CLEANUP

## VERDICT

```
PHASE_96_MOBILE_NAVIGATION_COMPLETE
BOTTOM_NAV = PASS · UI_LINK_UNDERLINE = PASS · MOBILE_UX = PASS
ACCESSIBILITY = PASS · SAFE_AREA = PASS · LEARNING_FLOW_COMPATIBILITY = PASS
TYPECHECK = PASS · LINT = 0 erreur · TESTS = 1084/1084 · BUILD = PASS
DATABASE_WRITES = 0 · REGRESSIONS = 0
```

## 1. État initial

- **Bottom nav** : barre pleine largeur `border-t bg-background/95`, actif = `bg-surface-interactive`, items `min-h-11 flex-1`. Fonctionnelle mais plate, sans hiérarchie active claire.
- **Bug soulignements** : une règle globale dans `app/globals.css` (`@layer base`) appliquait `text-decoration: underline` **au hover sur tout `<a>` non `inline-flex`** — y compris la nav (flex), les cartes leçons (`group block`), le bloc « Prochaine étape ». L'opt-out `data-no-hover-underline` n'était **jamais utilisé** nulle part.

## 2. Benchmark / principes retenus

Analysé Material 3, Duolingo, Airbnb, Spotify, YouTube, Notion, Linear. Principes retenus (sans copier) :
- icon-first **avec labels conservés** (5 onglets — aucun retrait sans preuve) ;
- **active indicator en pilule teal légère** (le plus lisible au premier regard) ;
- **surface flottante élévée** : coins arrondis, marges, safe-area, translucide + blur ;
- micro-interaction : scale 0.97 au tap, transitions 150 ms, `prefers-reduced-motion` respecté.

## 3. Design choisi

**Barre flottante pilule** (hybride A/C) : `fixed inset-x-0 bottom-0`, marges 12 px, `max-w-md` centrée, coins `rounded-[1.75rem]` (28 px), `bg-popover/95` + `backdrop-blur-md` + `border-border-subtle` + `shadow-elevated` (niveaux L3/L4 du système de PHASE 94). Actif = `bg-primary/10 text-primary-strong`. Pas de FAB, pas de suppression de labels, pas de gold en couleur de nav (réservé progression).

## 4. Problème des soulignements — cause racine

`app/globals.css` @layer base : `a:not([data-no-hover-underline]):not(.inline-flex):hover { text-decoration: underline }`. Correction systémique : **règle retirée** → `a { text-decoration: none }` par défaut ; le soulignement devient **opt-in** (`underline` / `hover:underline`). Vérifié par hover réel (Input.dispatchMouseEvent) : nav `none`, carte leçon `none`, « Prochaine étape » `none`, lien éditorial `underline` préservé.

## 5. Modifications

| Fichier | Modification |
|---|---|
| `components/app/app-nav.tsx` | NavLink mobile (pilule active, min 44 px, scale tap) + barre flottante (marges, safe-area, blur, shadow-elevated) ; sidebar desktop inchangée |
| `app/globals.css` | Règle globale hover-underline retirée → soulignement opt-in |
| `app/(app)/layout.tsx` | `main pb-24 → pb-28 md:pb-10` (dégagement barre flottante) |
| `tests/navigation.test.ts` | +4 contrats PHASE 96 (barre flottante, 5 items + aria-current + 44 px, états actifs, règle underline) |

## 6. Validation mobile (mesurée, session authentifiée)

- 360/390/412/430 px : barre marges 12 px, **5 items ≥ 52×64 px**, radius 28 px, dégagement du contenu **34 px** en bas de scroll, **0 overflow**.
- **Safe-area** : `pb-[max(env(safe-area-inset-bottom),0.75rem)]`.
- **Compatibilité learning flow** : les pages leçon masquent la nav (`isLessonFocus`) → aucune collision avec la barre sticky de PHASE 95 ; clavier arabe inchangé.

## 7. Validation desktop

Sidebar inchangée (actif `bg-surface-interactive` + indicateur `w-0.5`). Nav flottante `md:hidden` — aucune règle mobile ne fuit vers desktop.

## 8. Tests / build

1084/1084 PASS (1080 + 4 nouveaux contrats de navigation) · typecheck PASS · lint 0 erreur · build PASS · `DATABASE_WRITES = 0`.

## 9. Points restants

- Validation visuelle humaine sur téléphone réel recommandée (perception premium de la barre flottante).
- Les liens textuels sans `hover:underline` explicite ne soulignent plus au survol (comportement voulu : UI links non soulignés).

## 10. Fichiers modifiés

`components/app/app-nav.tsx` · `app/globals.css` · `app/(app)/layout.tsx` · `tests/navigation.test.ts`
