# PHASE 93 — FULL UI/UX PRODUCT AUDIT + MOBILE-FIRST BRAINSTORMING

## Verdict

```
PHASE_93_UI_UX_MOBILE_AUDIT_COMPLETE
AUDIT_ONLY = YES
PRODUCTION_CHANGES = 0
DATABASE_WRITES = 0
```

```
UX_SCORE        = 71/100
MOBILE_UX_SCORE = 64/100
P0 = 0 · P1 = 2 · P2 = 5 · P3 = 2 · NOTE = 3 · OPPORTUNITY = 5 · REGRESSIONS = 0
```

---

## 1. Executive Summary

Hikma est une application **pédagogiquement excellente et visuellement soignée**, avec un design system cohérent (teal = action, gold = récompense, palette chaude ivoire/crème), une typographie arabe exemplaire (Amiri, RTL, interligne 1.9) et une navigation mobile claire (5 onglets + mode immersion leçon). **Aucun P0.** Les faiblesses majeures sont **concentrées dans le flux d'exercice mobile** : le CTA principal passe sous la ligne de flottaison après chaque réponse, et le clavier arabe (inline) masque la question et présente des rangées visuellement cassées. Le reste relève de la densité (dashboard), de touch targets légèrement sous la norme et de polish.

**Ce qui est déjà excellent** (ne pas toucher) : identité, mode immersion leçon, honnêteté pédagogique (aucun XP inventé), arabe/RTL, états vides/erreurs, loading wordmark, privacy.

---

## 2. Current State

| Axe | Constat |
|---|---|
| Stack | Next.js 16.3 App Router · Tailwind v4 · Base UI · Poppins + Amiri + Geist Mono |
| Navigation | Sidebar desktop · bottom-nav 5 onglets mobile (Accueil/Apprendre/Sourates/Réviser/Profil), min-h-16 + safe-area · leçon en immersion sans chrome |
| Typo | h1 32 · h2 24 · body-md 15 · caption 12 · arabe min 16px, 18px mobile, interligne 1.9 |
| Touch | Boutons 44px ✓ · nav 64px ✓ · touches clavier 40px ✗ · fermer clavier 32px ✗ |
| Loading | Wordmark différé 150 ms (Phase 92) |
| États | Empty (review ×2, learn, coverage) · erreur leçon avec retry partiel · success + confettis sourate |
| A11y | focus-visible partout, aria (nav/radiogroup/status), reduced-motion global |

---

## 3–12. Audits par axe

### 3. Mobile audit (priorité 360–430px)
- **P1 — CTA exercice hors écran** : le footer « Continuer » est placé après le panneau de feedback (300-500px), donc sous la ligne de flottaison après chaque réponse (captures 0723/0725).
- **P1 — Clavier arabe** : inline dans la page → masque la question sur petit écran (capture 0724) ; rangées `[7][10][10][9]` rendues `7 / 7+3 / 7+3 / 7+2` en grid-cols-7.
- P2 — Stats dashboard 3 colonnes serrées (« Maîtrise moyenne » casse, capture 0722).
- P2 — « Révisions à venir » : 7 colonnes, étiquettes qui cassent ≤360px.

### 4. Desktop audit
Solide : sidebar 64, max-w-5xl/7xl, grilles lg:grid-cols-2, aucun overflow. Rien de bloquant.

### 5. Navigation audit
Excellente. 5 onglets avec labels + état actif en pastille teal, profondeur ≤3 avec retour explicite, safe-area iOS gérée. Le mode immersion leçon (sortie + étape dans le header de focus) est un vrai bon choix produit.

### 6. Dashboard audit
**TodayCard « Aujourd'hui » en tête = excellent** (le test « 5 secondes » passe). En revanche 5-6 cartes empilées = scroll long ; la couverture, les sourates, l'activité et les révisions pourraient se condenser en 2 sections visibles sans scroll. Stats 3 colonnes trop serrées sur mobile.

### 7. Learning UX audit
Pédagogie irréprochable (découverte → exercices → mini-révision → fin, feedback différencié, honnêteté). Le seul vrai défaut UX mobile est la position du CTA (voir P1-01). Le feedback « Ta réponse vs Réponse attendue » est très lisible.

### 8. Arabic / RTL audit
**9/10.** Amiri, `dir=rtl` + `lang=ar` isolés, interligne 1.9, zéro letter-spacing, tailles généreuses (mot 24px, verset 30px). Aucun cas extrême cassé détecté.

### 9. Accessibility audit
Fort : AA sur les textes, focus-visible partout, aria-live sur les feedbacks, radiogroup clavier, reduced-motion global. Points : touches clavier 40px < 44px, fermer 32px, contraste barre gold < 3:1 (non-textuel).

### 10. Design system audit
Cohérent. La règle teal/gold est respectée dans l'ensemble ; le gold reste parfois décoratif (pill landing, confettis) — à documenter. `CardContent` sans `flex flex-col` a été un piège récurrent (corrigé cette semaine sur learn + dashboard).

### 11. Responsive audit
Scan statique propre : 0 abus de 100vh/100vw, 0 largeur fixe px, overflow-x contenu, z-index maîtrisé. Les défauts restants sont de densité, pas de rupture.

### 12. Performance UX
Perception rapide : wordmark différé (pas de flash), routes statiques générées, dashboard ~12 requêtes en Promise.all. P3 : 3 familles de polices (Poppins 4 graisses) — mesurer au Lighthouse post-déploiement.

---

## 13. Findings

| ID | Sévérité | Finding | Preuve |
|---|---|---|---|
| 93-P1-01 | **P1** | CTA « Continuer » hors écran après réponse (footer non sticky, feedback haut) | Code HikmaExerciseShell + captures 0723/0725 |
| 93-P1-02 | **P1** | Clavier arabe inline masque la question + rangées déséquilibrées | `ARABIC_KEYBOARD_LETTERS` + capture 0724 |
| 93-P2-01 | P2 | Stats dashboard 3 colonnes serrées ≤360px | Capture 0722 |
| 93-P2-02 | P2 | Touches clavier 40px, fermer 32px (<44px) | arabic-keyboard.tsx |
| 93-P2-03 | P2 | Révisions à venir : étiquettes cassées ≤360px | daily-activity.tsx |
| 93-P2-04 | P2 | « Explication indisponible » affichée en bloc vide | Capture 0725 |
| 93-P2-05 | P2 | Contraste barre dorée < 3:1 (indicateur non-textuel) | tokens hikma-gold |
| 93-P3-01 | P3 | 3 familles de polices, payload fonts | layout.tsx |
| 93-P3-02 | P3 | Gold décoratif vs règle « gold = récompense » | landing |
| 93-N-01 | NOTE | Bottom-nav 5 onglets claire et suffisante | app-nav.tsx |
| 93-N-02 | NOTE | Scan responsive statique propre | grep 100vh/100vw/min-w |
| 93-N-03 | NOTE | États empty/error/loading bien couverts | review, learn, lesson-player |
| 93-O-01 | OPP | Barre d'action sticky (pattern natif) | — |
| 93-O-02 | OPP | Clavier en bottom-sheet overlay | — |
| 93-O-03 | OPP | Dashboard condensé « 5 secondes » | — |
| 93-O-04 | OPP | Haptiques légères (vibrate) correct/incorrect | — |
| 93-O-05 | OPP | CTA « Reprendre » session active renforcé | — |

---

## 14. Scorecard

| Catégorie | Note |
|---|---|
| Visual hierarchy | 7/10 |
| Mobile UX | 6/10 |
| Navigation | 8/10 |
| Learning UX | 7/10 |
| Dashboard | 6/10 |
| Typography | 8/10 |
| Arabic | 9/10 |
| RTL | 9/10 |
| Accessibility | 7/10 |
| Micro-interactions | 6/10 |
| Responsive | 7/10 |
| Performance UX | 7/10 |
| Design consistency | 8/10 |
| Premium feel | 6/10 |
| **OVERALL UX** | **71/100** |
| **MOBILE UX** | **64/100** |

---

## 15–17. Brainstorming / Quick wins / Recommended changes

**Quick wins (impact fort, effort faible) :**
1. Footer sticky « Continuer » dans le flux d'exercice — résout le P1 dominant.
2. Clavier arabe en overlay + rangées 7/7/7/7/7/1 sur mobile.
3. Stats dashboard en 2 colonnes ≤360px + libellés courts.
4. Masquer l'accordéon d'explication quand aucune donnée.
5. Touches clavier ≥44px + fermer ≥44px.

**Recommandations :** conserver la bottom-nav et l'immersion leçon ; ajouter des barres d'action contextuelles sticky ; clavier en overlay ; dashboard hiérarchisé (Today en tête, une seule section de progression visible sans scroll).

---

## 18. Proposed Mobile Architecture

- **A (recommandé)** : bottom-nav actuelle + barres d'action contextuelles sticky + clavier overlay.
- B : 4 onglets (fusion) — rejeté, perd la découverte directe.
- C : FAB central — rejeté, compétition avec le CTA principal.

L'architecture actuelle est **saine** : pas de refonte radicale nécessaire.

---

## 19. Priority Roadmap

**P1** → 93-P1-01 barre d'action sticky exercice → 93-P1-02 clavier overlay + rangées.
**P2** → stats dashboard → explication vide → touch targets → révisions serrées → contraste gold.
**P3** → fonts → règle gold → haptiques.

---

## 20. What NOT to change

Identité teal/gold/ivoire · mode immersion leçon · honnêteté pédagogique (pas d'XP inventé) · typographie arabe (Amiri/RTL/interligne) · privacy 0 tracker · structure des routes publiques Coran.

---

## 21. Final Recommendation

Corriger d'abord les **2 P1** (barre d'action sticky + clavier arabe) dans une **PHASE 94 — Mobile UX fixes**, puis les P2 en priorité (stats dashboard, explication vide, touch targets). Valider chaque correctif en navigateur réel sur un preview Vercel (pas de navigateur persistant dans cet environnement). Aucune modification de production n'a été effectuée pendant cette phase.
