# PHASE 24H-UX-NAV-REVIEW-A — AUDIT NAVIGATION, ACCUEIL ET RÉVISION

**STATUS = `AUDIT_COMPLETE_READY_FOR_APPROVAL`** · **DÉCISION = audit terminé, aucune correction appliquée**

Phase 100 % READ-ONLY : 0 écriture DB, 0 migration, 0 modification de code/UI, 0 modification moteur/grading/SRS/curriculum, 0 modification Storage.

---

## 1. Réponse centrale

Le comportement observé est **correct au sens SRS** mais **trompeur au niveau UX** :

> Après avoir terminé sa première leçon, un utilisateur ouvre `/review` et lit
> « Tout est à jour ! Rien à réviser 🎉 » alors qu'il vient d'étudier. Le moteur a
> raison (aucun mot n'est *dû* : `next_review_at = demain`), mais l'interface ne
> distingue pas **« jamais étudié »** de **« étudié, planifié, pas encore dû »**.

Deux problèmes réels sont documentés (P1) :
1. **UX-NAV-002** — l'état vide de `/review` est un écran unique qui confond trois états distincts.
2. **DATA-REVIEW-001** — deux systèmes de rétention coexistent (`review_items` SRS **et** `user_word_skill_progress.retention`) mais `/review` n'en lit qu'un.

Aucun bug de données, aucun bug de calcul d'échéance, aucun problème de fuseau.

---

## 2. A — Page d'accueil `/`

| Élément | Constat | Preuve |
|---|---|---|
| Modèle d'exécution | Next.js 16 : **pas de `middleware.ts`** — convention `proxy.ts` (session refresh uniquement, **aucune redirection auth**) | `proxy.ts` |
| Utilisateur anonyme | `LandingPage` (proposition de valeur) | `app/page.tsx` |
| Utilisateur connecté | `redirect("/dashboard")` inconditionnel | `app/page.tsx` |
| Intention | **OUI**, documentée (Phase 24D) : « visiteur → landing ; connecté → dashboard » | commentaire `app/page.tsx` |
| `/` vs `/dashboard` | **Distincts** : `/` = landing anonyme ; `/dashboard` = accueil applicatif | — |
| Un connecté peut-il voir `/` ? | **Non** (redirect boucle) | `app/page.tsx` |
| Logo « Hikma » | **Non cliquable** (`<div>` statique, pas de `<Link>`) | `components/app/app-nav.tsx` |
| Item « Accueil » | Pointe vers **`/dashboard`**, pas `/` | `app-nav.tsx` |

**Conclusion** : le redirect connecté → `/dashboard` est **intentionnel** (pas un bug). Le seul vrai trou de navigation est le **logo non cliquable** (`NAV-001`, P3).

---

## 3. B — Navigation globale

`components/app/app-nav.tsx` — sidebar fixe desktop (≥ md) + bottom navigation mobile (< md, safe-area), 4 items :

| Libellé | Route |
|---|---|
| Accueil | `/dashboard` |
| Apprendre | `/learn` |
| Réviser | `/review` |
| Profil | `/profile` |

Gate d'onboarding : `app/(app)/layout.tsx` redirige un connecté **sans** `user_settings` vers `/onboarding` (groupe séparé, anti-boucle). Matrice complète des routes dans `tmp/phase24h-ux-nav-review/route-access-matrix.json`.

---

## 4. C & D — Page `/review` et états de révision

**Flux réel** (voir `review-data-flow.json`) :

```
DB review_items ── getDueReviewItems(queries.ts) ── WHERE next_review_at <= now()
        ↓
items.length === 0 → « Tout est à jour ! Rien à réviser 🎉 »
items.length  > 0 → « N mots à revoir » + ReviewPlayer (MULTIPLE_CHOICE)
```

- **Table lue** : `review_items` (Leitner `next_review_at`), **uniquement**.
- **Date** : `now.toISOString()` (UTC), cohérente avec `getActivityDate()` (UTC). **Aucun bug de fuseau.**
- **`due`** = `next_review_at <= now`. Une 1ʳᵉ bonne réponse → `intervalDays = 1` → échéance **demain** → pas encore dû.

**Les 6 états (STATE A–F) sont documentés dans `review-state-analysis.json`.** Le point clé : l'UI ne possède que **2 branches** (vide / liste), alors qu'il existe **≥ 4 états** réellement distincts (jamais étudié / étudié pas dû / planifié / dû / fraîchement terminé / rétention sans SRS).

**Deux systèmes de rétention non réconciliés** :
- ① `review_items.next_review_at` → `/review` + `reviewDueCount` (dashboard) ;
- ② `user_word_skill_progress.retention` (`retentionLevel` 0/25/50/75/100) → porte de ré-activation du séquenceur (`RETENTION_REACTIVATION_THRESHOLD = 75`), **jamais affiché** sur `/review`.

---

## 5. E — Cohérence avec la Phase 24H-Q1

Vérifié : l'exercice `PRONUNCIATION_GUIDED` est intégré dans la **Découverte** (pas la séquence notée), `skillForExerciseType → null`, `validateAnswer`/`scoreAnswer` **neutres**. → **Aucune** écriture `user_word_skill_progress` / `review_items` / session, **aucun** impact sur le nombre d'exercices notés, les index de session, le SRS, la maîtrise ou l'activité de révision. ✅

---

## 6. F — Scénarios utilisateurs (7)

Traçage conceptuel complet dans `user-scenarios.json`. Synthèse :

| # | Scénario | État dû | Affichage `/review` réel |
|---|---|---|---|
| 1 | Nouveau → termine Basmala | aucun dû (échéance demain) | « Rien à réviser 🎉 » (trompeur) |
| 2 | Retour le lendemain | 4 mots dus | « 4 mots à revoir » ✅ |
| 3 | Ouvre `/review` | dépend échéance | vide OU liste (pas d'état intermédiaire) |
| 4 | Recommence Basmala | inchangé jusqu'à complétion | ✅ (24E) |
| 5 | Termine 2× la même leçon | re-calculé, pas doublé | ✅ (idempotent, 24H-ACTIVITY) |
| 6 | Quitte puis reprend | rien écrit avant la fin | ✅ (24E) |
| 7 | `retentionLevel` sans `review_items` | **vide** (`/review` ne lit que `review_items`) | « Rien à réviser 🎉 » **alors qu'une rétention existe** |

---

## 7. G — Réponses aux 10 questions UX

| # | Question | Réponse |
|---|---|---|
| 1 | Revenir à l'accueil ? | Oui via `/dashboard` ; **non** vers `/` (landing) une fois connecté |
| 2 | Dashboard distinct de l'accueil ? | **Oui** |
| 3 | Logo → `/` ? | **Non** (logo non cliquable) |
| 4 | L'utilisateur sait-il où il est ? | Partiel (`aria-current=page`, pas de breadcrumb, logo non cliquable) |
| 5 | « Rien à réviser » exact ? | Exact SRS, **trompeur** UX (confond les états) |
| 6 | Distingue « rien dû » de « aucune planification » ? | **Non** |
| 7 | Sait quand revenir ? | **Non** sur `/review` (le dashboard montre les révisions à venir 7 j, pas `/review`) |
| 8 | Prochaine action claire ? | Partiel (CTA unique « Voir le parcours ») |
| 9 | Continuer facilement ? | Oui |
| 10 | Impression de vide malgré progression ? | **Oui** — point central |

---

## 8. Problèmes identifiés

| ID | Type | Prio | Titre | Phase |
|---|---|---|---|---|
| UX-NAV-002 | UX | **P1** | « Rien à réviser 🎉 » confond jamais-étudié / étudié-pas-dû / dû | 24H-UX-NAV-REVIEW-B |
| DATA-REVIEW-001 | DATA | **P1** | Deux systèmes de rétention, `/review` n'en lit qu'un | 23G / SRS dédiée |
| UX-NAV-001 | NAVIGATION | P2 | Connecté ne peut plus atteindre `/` (intentionnel 24D, à confirmer produit) | décision produit |
| NAV-001 | NAVIGATION | P3 | Logo Hikma non cliquable | 24H-UX-NAV-REVIEW-B |
| UX-NAV-003 | UX | P3 | EmptyState de `/review` sans « prochaine révision » ni CTA primaire | 24H-UX-NAV-REVIEW-B |

Détail + preuves dans `ux-issues.json`.

---

## 9. Vérifications read-only (inchangées)

| Vérification | Résultat |
|---|---|
| `npm test` | **339/339** ✓ |
| `npx tsc --noEmit` | **0 erreur** ✓ |
| `npm run lint` | clean ✓ |
| `npm run build` | OK ✓ |
| `npm run verify:persistence` | **13/13** ✓ |
| `npm run verify:rls` | **44/44** ✓ |

**Compteurs DB inchangés** : `quran_words` 21 296 · `word_occurrences` 77 430 · `word_audio` 21 295 · `ayah_audio` 0 · `lemmas` 32 · `word_translations FR` 25 · `word_lemma_mapping` 183. **Aucune migration, aucune écriture, aucune modification Storage.**

> Note d'hygiène (hors périmètre pédagogique) : un artefact généré corrompu
> `.next/dev/types/validator.ts` (écrit partiellement par un `next dev`
> interrompu) faisait échouer `tsc`/`build`. Il a été **supprimé** (dossier
> gitignoré, régénéré automatiquement) — aucun code source modifié ; après
> nettoyage, `tsc` 0 et `build` OK.

---

## 10. Recommandation

La correction **P1/P3** (`UX-NAV-002`, `NAV-001`, `UX-NAV-003`) est purement UI :
distinguer 3 états de `/review` en réutilisant `getUpcomingReviewCounts` (donnée
déjà calculée pour le dashboard), rendre le logo cliquable vers `/dashboard`, et
enrichir l'EmptyState. Aucune modification moteur/SRS/curriculum nécessaire.

`DATA-REVIEW-001` (réconcilier `retentionLevel` et `review_items`) relève d'une
phase SRS dédiée (**23G**) et ne doit **pas** être corrigé à la va-vite ici.

**Phase suivante recommandée : `24H-UX-NAV-REVIEW-B`** (correction UX ciblée), après approbation explicite.

---

## 11. Livrables

- `PHASE_24H_UX_NAV_REVIEW_AUDIT.md` (ce rapport)
- `tmp/phase24h-ux-nav-review/`
  - `navigation-matrix.json`
  - `route-access-matrix.json`
  - `review-state-analysis.json`
  - `review-data-flow.json`
  - `homepage-flow.json`
  - `user-scenarios.json`
  - `ux-issues.json`
  - `recommendations.json`

**ARRÊT OBLIGATOIRE** : aucune correction appliquée ; 24H-Q2, 24I, 24J, 24K, 23G non démarrés.
