# PHASE 93B — SURFACE / CARD / VISUAL HIERARCHY AUDIT

## VERDICT

```
PHASE_93B_AUDIT_ONLY
PRODUCTION_CHANGES = 0
DATABASE_WRITES = 0
```

| Statut | Valeur |
|---|---|
| SURFACE_SYSTEM_STATUS | **FLAT** — 2 paliers de lumière perceptibles seulement (ivory, puis cream/subtle quasi identiques) |
| CARD_HIERARCHY_STATUS | **WEAK** — cartes standards à 1.050:1 du fond ; imbriqués à 1.000:1 |
| BORDER_STATUS | **WEAK** — border-subtle à 1.127:1, invisible à 1px |
| SHADOW_STATUS | **FUNCTIONALLY_ABSENT** — shadow-card imperceptible |
| MOBILE_STATUS | **DEGRADED** — sans hover, seule reste une hairline invisible |
| DESKTOP_STATUS | **WEAK** — partiellement compensé par hover, hiérarchie toujours plate |

---

## Cause racine (mesurée, pas supposée)

**Combinaison de 4 facteurs** — pas « il faut des shadows partout » :

1. **Couleurs de surface trop proches** : cream `#fffdf8` sur ivory `#f8f8f0` = **1.050:1** (zéro séparation lumineuse) ; subtle/featured = 1.024:1.
2. **Borders trop faibles** : border-subtle `#e4ece8` = **1.127:1** → invisible à 1px ; border `#d7e0dc` = 1.263:1 (à peine visible).
3. **shadow-card fonctionnellement absente** : `0 1px 2px rgba(46,42,28,0.04) + 0 8px 24px -12px rgba(46,42,28,0.10)` → sous le seuil de perception.
4. **Imbriqués même couleur que le parent** : `surface-elevated/70` dans `surface-elevated` = **1.000:1**.

**Et la cause structurelle** : les tokens d'élévation sont dupliqués — `surface = surface-elevated = card = popover` (une seule couleur `#fffdf8` pour 4 rôles) et `surface-subtle = surface-featured` (`#f1f6f3`). Il n'existe **aucun vrai palier d'élévation** dans le design system.

---

## Findings

| ID | Sévérité | Finding | Mobile/Desktop |
|---|---|---|---|
| 93B-P1-01 | **P1** | Cartes standards indiscernables du fond (23 usages du pattern faible `border-border-subtle bg-surface-elevated` : dashboard, learn, review, surahs, sources, auth) | BOTH (mobile pire) |
| 93B-P1-02 | **P1** | Imbriqués de même couleur que leur parent (bloc « Prochaine étape » /learn : 1.000:1) | BOTH |
| 93B-P2-01 | P2 | Tokens dupliqués : 4 rôles = 1 couleur, 2 rôles = 1 couleur — aucun palier réel | System |
| 93B-P2-02 | P2 | Langage d'élévation incohérent au sein du dashboard (TodayCard featured vs « Tes sourates » plain) | BOTH |
| 93B-P2-03 | P2 | shadow-card fonctionnellement absente | BOTH |
| 93B-P2-04 | P2 | Dashboard : 5-6 cartes cream identiques empilées (monotonie + scroll) | MOBILE |
| 93B-P2-05 | P2 | Grille /surahs plate sur mobile (élévation au hover uniquement) | MOBILE |
| 93B-P3-01 | P3 | border vs border-subtle : deux gris quasi identiques aux noms trompeurs | System |
| 93B-P3-02 | P3 | Sidebar 1.044:1, séparée par border-r seule | DESKTOP |
| 93B-N-01 | NOTE | Les panneaux colorés (success/error 8% + bordure 32%) sont le modèle de différenciation qui fonctionne | — |
| 93B-N-02 | NOTE | Le pattern featured (border-primary/20 + featured + shadow-elevated) fonctionne déjà — 25 usages | — |
| 93B-N-03 | NOTE | Dark mode : tokens cohérents, aucun toggle (hors périmètre) | — |
| 93B-O-01…06 | OPP | Échelle Surface 0-4 · séparer surface/elevated · renforcer shadow-card · border sur cartes standalone · imbriqués ≠ couleur parent · réduire les cartes du dashboard | — |

**P0 = 0 · P1 = 2 · P2 = 5 · P3 = 2 · NOTE = 3 · OPPORTUNITY = 6**

---

## Design system proposé (conceptuel — rien appliqué)

| Niveau | Fond | Bordure | Ombre | Usage |
|---|---|---|---|---|
| 0 · Page | ivory `#f8f8f0` | — | — | fond de page |
| 1 · Section plate | ivory/cream | hairline border-subtle (optionnelle) | — | containers non-cliquables |
| 2 · Card | cream `#fffdf8` | **border `#d7e0dc`** | shadow-card renforcée (≈0.06/0.14) | cartes standards |
| 3 · Elevated card | featured `#f1f6f3` | border-primary/20 | shadow-elevated | cartes clés (Today, progression, vedette) |
| 4 · Overlay | popover cream | border | shadow-lg + backdrop | modals, sheets, menus |
| **Règle imbriqués** | — | — | — | **jamais la couleur du parent** : surface-subtle + border-subtle, ou teinte de sens (success/error/warning) |

**Performance** : les box-shadows sont paint-only (pas de reflow) — renforcer shadow-card n'a aucun impact mesurable sur le scroll mobile ni le GPU. Ordre de priorité : contraste de surface > bordure > ombre (clarté > décoration).

---

## Pages les plus touchées

`/dashboard` (4 cartes faibles) · `/learn` (« Comment avancer » + imbriqué invisible) · `/surahs` (grille plate sur mobile) · `/review` · `/sources` · `/mots` · auth.

**Bien différenciées (références)** : landing · TodayCard · « Ta progression » · tous les feedbacks colorés.

## Composants réutilisables à corriger

`components/ui/card.tsx` (base border + shadow) — **1 correctif répare ~23+ usages** · tokens globals.css (`--surface`, `--surface-elevated`, `--shadow-card`) · pattern imbriqué `bg-surface-elevated/70`.

## Ce qu'il ne faut PAS changer

Identité chaude teal/gold/ivoire · pattern featured (référence) · panneaux colorés · shadows diffuses chaudes (jamais noires dures) · typo/arabe/RTL/radius · **pas de bordure/shadow partout** — la règle est « clarté > décoration ».

---

```
PRODUCTION_CHANGES = 0
DATABASE_WRITES = 0
```

Rapport : `reports/phase-93b-surface-hierarchy-audit.json` (validé) + `-summary.md`. Aucune modification effectuée — en attente de votre décision pour la phase d'implémentation.
