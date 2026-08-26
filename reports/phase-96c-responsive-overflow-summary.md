# PHASE 96C — MOBILE RESPONSIVE OVERFLOW FIX

## VERDICT

```
PHASE_96C_COMPLETE

ROOT_CAUSE = grid sans colonne mobile explicite → track auto dimensionné au max-content
             de la carte « Prochaine étape » (356px) → carte 406px > viewport

MOBILE_360 = PASS · MOBILE_390 = PASS · MOBILE_430 = PASS · TABLET = PASS · DESKTOP = PASS
HORIZONTAL_OVERFLOW = 0 · SCROLL_X = 0

TON_CHEMIN = PASS · TA_PROGRESSION = PASS · PROCHAINE_ETAPE = PASS
COMMENT_AVANCER = PASS · ETAPES_DU_PARCOURS = PASS

BOTTOM_NAV_REGRESSION = PASS · UNDERLINE_REGRESSION = PASS
TYPECHECK = PASS · LINT = PASS · BUILD = PASS · TESTS = 1087/1087

DATABASE_WRITES = 0 · MIGRATIONS = 0 · LEXICAL_WRITES = 0
P0 = 0 · P1 = 0 · P2 = 0
```

## Cause racine (mesurée, pas supposée)

Session authentifiée réelle, Chrome headless + CDP :

```
Avant :  learn360 → docSW 426 vs vw 360 (overflow 66px)
         learn390 → docSW 426 vs vw 390 (overflow 36px)
         learn430 → overflow interne de la section (406px dans 390px)

Mesure max-content : lien « Prochaine étape » = 356px  ← coupable
                     HikmaProgress = 308px · ligne stats = 308px
```

Le `grid gap-5 lg:grid-cols-[1fr_0.7fr]` n'a **pas de colonne explicite sur mobile** : `grid-template-columns: none` crée un track implicite `auto` dimensionné au **max-content** des items. La carte « Ton chemin » (contenant le lien « Prochaine étape » avec son titre en `truncate`/nowrap) atteint donc **406px** et déborde le conteneur (350px à 390 de viewport, 320px à 360).

## Correctif appliqué (à la source, aucun `overflow-x-hidden`)

| Fichier | Changement |
|---|---|
| `app/(app)/learn/page.tsx` | grid → `grid grid-cols-1 gap-5 [&>*]:min-w-0 lg:grid-cols-[1fr_0.7fr]` : colonne mobile explicite `1fr` + `min-w-0` sur les items (le track ne peut plus être poussé par le max-content) |
| `app/(app)/learn/page.tsx` | titre « Prochaine étape » : `truncate` retiré → le texte **wrappe naturellement** sur 2 lignes (comportement accepté par le cahier des charges) |
| `components/ui/hikma.tsx` | `HikmaProgress` : ligne `flex flex-wrap … gap-x-4 gap-y-1` + label `flex-none` (sans `flex-1`/`truncate`) → à ≤390px le détail passe sur sa propre ligne et le label garde toute la largeur, **jamais tronqué** |

## Validation (re-mesure après correctif, même session)

```
         docSW   overflow   scrollX   carte    nav     ligne stats
360px    360     false      0         320px    360px   détail en ligne 2, label complet
390px    390     false      0         350px    390px   détail en ligne 2, label complet
430px    430     false      0         390px    430px   une seule ligne
1440px   1440    false      —         553/387  sidebar visible (ratio 1fr/0.7fr intact)
```

Dashboard (partage `HikmaProgress`) : aucun overflow documentaire aux 3 largeurs — les seuls éléments dépassant le viewport sont les pastilles de la rangée scrollable « Révisions à venir » (défilement interne volontaire).

## Validation technique

`TYPECHECK = PASS` · `LINT = 0 erreur` · `BUILD = PASS` · **`TESTS = 1087/1087`** (1084 + 3 nouveaux).

Nouveau test de régression `tests/learn-responsive-contract.test.ts` : contrat source — `grid-cols-1` + `[&>*]:min-w-0`, titre sans `truncate`, ligne `HikmaProgress` en `flex-wrap` avec label `flex-none`.

**Fichiers modifiés** : `app/(app)/learn/page.tsx` · `components/ui/hikma.tsx` · `tests/learn-responsive-contract.test.ts`. Aucune donnée modifiée, aucune migration, aucun `overflow-x-hidden` introduit.
