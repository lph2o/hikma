# PHASE 46 — AUDIT DE CONSOLIDATION POST-43B/44B/45C

Statut : **`PHASE_46_CONSOLIDATION_COMPLETE_ONBOARDING_READY`** (READ-ONLY)

> Aucune migration, aucune écriture DB (INSERT/UPDATE/DELETE/seed), aucun
> changement runtime/UI/onboarding/SRS/mastery/curriculum/resolver/MASAQ/
> exercices/explications. Aucun commit, aucun push. Seuls des artefacts d'audit
> ont été produits.

---

## 1. Executive Summary

L'état de Hikma après 43B / 44B / 45A / 45B / 45C est **cohérent et stable** :

- **Documentation, code et DB sont alignés** : 0 divergence constatée.
- **Tests** : tsc ✅ · eslint ✅ · **733/733** ✅ · build ✅ (Next.js 16.3.0).
- **DB** : les **20 compteurs** vérifiés en lecture seule correspondent
  **exactement** aux snapshots documentés (voir §2, `tmp/phase46-db-counts.json`).
- **Onboarding V2** : confirmé dans le code (`CURRENT_ONBOARDING_VERSION = 2`,
  `isOnboardingComplete`, migrations 0029 + 0030). Il est **complet et stable** →
  `ONBOARDING_READY`. Il ne reste que 2 micro-polish P3 non bloquants.
- **Explications de sens (44B)** : confirmées dans le code + la DB (13 génériques
  validées + 1 override contextuel), résolution pure `resolveSenseExplanation`,
  affichées **après l'effort** dans `HikmaExplanation`. Aucune connexion à
  l'onboarding.
- **MASAQ (43B)** : confirmé passif (413 occurrences / 796 segments / 17 sourates
  sur 18 ; racines/schèmes = 0).
- **Curriculum** : 18 sourates / 111 leçons / 742 lesson_words — cohérent.
- **SRS / mastery / Daily Plan / coach** : **inchangés** par les phases 44B/45B/45C
  (celles-ci n'ont produit que des rapports et artefacts `tmp/`, aucun fichier
  de production).

**Prochaine priorité réellement justifiée :** continuer le déblocage éditorial
des sourates courtes READY restantes (données lexicales FR + seed idempotent),
**avant** toute fonctionnalité inspirée de Quran Progress. C'est la seule voie
qui respecte à la fois la stratégie produit et la stabilité pédagogique.

---

## 2. État DB réel (lecture seule, 0 divergence)

Vérifié par `tmp/phase46-verify-counts.cjs` (SELECT count uniquement) :

| Table | Actuel | Attendu | Statut |
|---|---:|---:|---|
| quran_words | 21 296 | 21 296 | ✅ |
| word_occurrences | 77 430 | 77 430 | ✅ |
| ayahs | 6 236 | 6 236 | ✅ |
| translations | 24 944 | 24 944 | ✅ |
| word_translations (FR validées) | 335 | 335 | ✅ |
| lemma_translations | 32 | 32 | ✅ |
| lemmas | 32 | 32 | ✅ |
| word_lemma_mapping | 184 | 184 | ✅ |
| sources | 6 | 6 | ✅ |
| linguistic_occurrences | 413 | 413 | ✅ |
| linguistic_segments | 796 | 796 | ✅ |
| linguistic_lemmas | 0 | 0 | ✅ |
| linguistic_roots | 0 | 0 | ✅ |
| word_explanations (FR validées) | 13 | 13 | ✅ |
| word_explanation_contexts | 1 | 1 | ✅ |
| learning_paths | 18 | 18 | ✅ |
| learning_paths (sourate) | 18 | 18 | ✅ |
| units | 18 | 18 | ✅ |
| lessons | 111 | 111 | ✅ |
| lesson_words | 742 | 742 | ✅ |

**Conclusion : aucune divergence documentation ↔ DB.**

---

## 3. État Onboarding V2

Vérifié dans le code réel :

| Élément | Preuve | Statut |
|---|---|---|
| `CURRENT_ONBOARDING_VERSION = 2` | `lib/learning/onboarding.ts:18` | ✅ |
| `isOnboardingComplete` (onboarded && version ≥ 2) | `lib/learning/onboarding.ts:25` | ✅ |
| Migration 0029 (personnalisation) | `supabase/migrations/0029_onboarding_personalization.sql` | ✅ |
| Migration 0030 (version obligatoire) | `supabase/migrations/0030_mandatory_onboarding_version.sql` | ✅ |
| Garde serveur `/onboarding` + layout app | `app/(onboarding)/…`, `app/(app)/layout.tsx` | ✅ |
| Redirection post-auth | `lib/learning/actions.ts`, `app/(auth)/login/page.tsx` | ✅ |
| Anciens utilisateurs (backfill version 1 → V2) | migration 0030 | ✅ |
| Progression jamais réinitialisée | `completeOnboarding` (actions.ts) | ✅ |
| Absence de V3 | aucun fichier, aucune mention | ✅ |
| Absence de dépendance aux explications de sens | onboarding ≠ HikmaExplanation | ✅ |

**Verdict onboarding : `ONBOARDING_READY`.** Corrections restantes (non bloquantes) :

| # | Prio | Écart | Localisation |
|---|---|---|---|
| 1 | P3 | Fallback `redirectTo="/learn/basmala"` ancré Al-Fātiḥah (utilisé seulement si la sourate choisie n'a pas de `firstLessonSlug`) | `app/(onboarding)/onboarding/page.tsx` |
| 2 | P3 | `goalType`/`goalValue` présents dans `completeOnboarding` mais jamais envoyés (objectif toujours `words/5`) | `lib/learning/actions.ts` |
| 3 | P3 | Pas d'E2E Playwright onboarding dédié commité | — |

---

## 4. État cours / exercices

Vérifié :

- **Glose** toujours disponible via `resolveWordMeanings` (`lib/learning/language.ts`,
  FORME → LEMME → EN fallback).
- **Explication de sens optionnelle** : `metadata.senseExplanation?: string | null`
  (`lib/exercises/types.ts`), absence = état valide, jamais de bloc vide
  (`components/learn/exercises/pedagogical-feedback.ts` ligne 100 : `if (… || senseExplanation || …)`).
- **Apparition après l'effort** : résolution serveur dans `app/(app)/learn/[slug]/page.tsx`
  (même contexte que l'exercice), rendu dans `HikmaExplanation`.
- **MASAQ passif** : consommé uniquement par `buildLinguisticExplanation`
  (bloc « Décomposition »), jamais par le grading/résolveur.
- **Contexte et audio indépendants** : `translations` (4 traducteurs) + audio
  Muʿallim signé — inchangés.
- **Absence d'explication = comportement normal** : `resolveSenseExplanation` → null.

---

## 5. État explications de sens (44B)

- **Architecture** : `word_explanations` + `word_explanation_contexts` (migration 0031).
- **Résolution** : générique validée → override contextuel validé → null
  (`lib/learning/sense-explanation.ts`, fonction pure, aucune inférence).
- **Affichage** : `HikmaExplanation`, ordre Mot → Glose → **Explication de sens** →
  Décomposition MASAQ → Contexte → Audio, **après l'effort**.
- **DB** : 13 explications FR validées + 1 override (`فَأُمُّهُۥ` 101:9) — vérifié.
- **4 formes rejetées** (glose suffisante) : يَكُونُ, وَتَكُونُ, سَلَـٰمٌ, إِنَّآ.
- **Non connectée à l'onboarding** (recommandation future 44B §P.2, non exécutée).

---

## 6. État MASAQ (43B)

- **Passif** : `linguistic_occurrences` 413 · `linguistic_segments` 796 · 17/18 sourates
  (107 encore sans MASAQ) · racines/schèmes = 0 (`FUTURE_WORK`).
- **Non connecté au runtime pédagogique** (résolveur, grading, SRS, mastery,
  readiness) — uniquement bloc « Décomposition » de l'explication.
- **Pas une autorité sémantique** : `masaq_gloss_en` = evidence, jamais glose FR.

---

## 7. État curriculum

- **18 parcours** (sourates) · **18 units** · **111 leçons** · **742 lesson_words** — vérifié.
- **Catalogue** : 1 REFERENCE (Al-Fātiḥah) · 16 READY · 1 IN_PREPARATION (107).
- Cohérence catalogue ↔ curriculum : 18/18 parcours sourate présents, aucun READY
  absent, aucun non-READY introduit (107 listée sans CTA).
- `READY` = 100 % gloses FR + parcours seedé (jamais « toutes les couches complètes »).

---

## 8. État SRS / mastery / Daily Plan

- **Aucune modification** introduite par 44B/45B/45C : ces phases sont des audits
  read-only (seuls des `.md` et `tmp/` ont été créés).
- `review_items` (Leitner), `user_word_progress`, `user_word_skill_progress`
  (8 compétences), `composeDailyPlan` — **inchangés**.
- Les nouvelles couches (explications 44B) n'affectent **ni** le grading, **ni**
  le mastery, **ni** les intervalles SRS, **ni** le Daily Plan.

---

## 9. État coach (45C)

- `getCoachLine` (`lib/learning/daily-plan.ts`) + `getPersonalizedLearningCopy`
  (`lib/learning/personalization.ts`) : déterministes, pures, déjà partiellement
  adaptatives (objectif/session/progression/révisions/firstVisit/rythme/profil).
- Le moteur de décision reste **SRS + composeDailyPlan + mastery**.
- **Verdict 45C : `PHASE_45C_ADAPTIVE_COACH_DEFERRED` (P2)** — ne pas implémenter
  maintenant, ne pas créer de second moteur de priorité.

---

## 10. État Quran Progress benchmark (45B)

Décisions consolidées :

- **ALREADY_EXISTS** : vocabulaire mot par mot, SRS, révisions auto, contexte,
  audio, progression, exercices, couverture, onboarding, explications post-réponse.
- **REJECTED** : fréquence comme axe principal, gamification (XP/badges/streaks/
  classements), tomes de Médine, cours de grammaire, tafsir.
- **DEFERRED** : coach adaptatif, écriture machine-gradée, regroupement des formes,
  alphabet arabe, langues supplémentaires, racines.

**Aucune conversion automatique en roadmap.**

---

## 11. Matrice COMPLETE / BLOCKER / IMPORTANT / DEFERRED / REJECTED

| Élément | Classification | Justification |
|---|---|---|
| Onboarding V2 | **F — COMPLETE / AUCUNE ACTION** (ONBOARDING_READY) | implémenté + validé 32C→32I + 33B, migration 0030 |
| Explications de sens (44B) | **F — COMPLETE** | 13 + 1 override, migration 0031, testée |
| MASAQ (43B) | **F — COMPLETE** (107 = FUTURE_WORK) | 413/796, 17/18 sourates, passif |
| Curriculum (18/111/742) | **F — COMPLETE** | cohérent DB |
| SRS / mastery / Daily Plan / coach | **F — COMPLETE** | inchangés, fonctionnels |
| Micro-polish onboarding (fallback basmala, params morts) | **C — À FAIRE APRÈS ONBOARDING** (P3, non bloquant) | 1–2 lignes chacune |
| E2E Playwright onboarding | **C** (optionnel, P3) | valeur ajoutée, non bloquant |
| Sourates courtes READY restantes (95, 99, 100, 91…) | **B — IMPORTANT AVANT ONBOARDING (produit)** | données FR + seed, aligné stratégie |
| Sourate 107 (1 forme EN-only) | **B** (donnée) | débloquer après les autres courtes |
| Coach adaptatif | **D — FUTURE WORK** (P2, différé 45C) | après données + stabilité |
| Écriture machine-gradée / regroupement formes / alphabet | **D — FUTURE WORK** | différés 45B |
| Racines / schèmes | **D — FUTURE WORK** | source auditée requise |
| Fréquence comme axe / gamification / Médine / grammaire / tafsir | **E — REJECTED** | verrouillé 29/40A/45B |
| **A — BLOCKER** | **aucun** | 0 blocker détecté |

---

## 12. Divergences documentation ↔ code

**Aucune.** Points vérifiés :

- `CURRENT_ONBOARDING_VERSION = 2` (code) = documentation 32D/45A ✅.
- `resolveSenseExplanation` (code) = documentation 44B ✅.
- `resolveWordMeanings` FORME → LEMME → EN (code) = documentation 17C/45A ✅.
- Migrations 0028/0029/0030/0031 présentes = documentation 24F/32/32D/44B ✅.
- `HikmaExplanation` (ordre des blocs, bloc optionnel) = documentation 44B ✅.

---

## 13. Divergences code ↔ DB

**Aucune.** Les 20 compteurs DB correspondent exactement aux valeurs documentées
(§2). Les 13 explications + 1 contexte existent en base ; les 335 gloses FR
validées ; les 413 occurrences / 796 segments linguistiques ; le curriculum
18/18/111/742.

---

## 14. Tests

| Check | Résultat |
|---|---|
| `npx tsc --noEmit` | ✅ 0 erreur |
| `npx eslint .` | ✅ 0 erreur |
| `npx vitest run` | ✅ **733/733** (55 fichiers) |
| `npm run build` | ✅ Next.js 16.3.0 (Turbopack) — routes `/`, `/onboarding`, `/dashboard`, `/learn`, `/learn/[slug]`, `/review`, `/surahs`, `/profile`, `/mots/[id]`, `/admin`, `/login`, `/design-system` |

**Aucun test en échec — rien à corriger.**

---

## 15. Risques

1. **Régression si « refonte » d'un système validé** (onboarding V2, résolveur,
   SRS) — risque élevé, à éviter (aucune refonte justifiée).
2. **Inflation éditoriale** des explications de sens — plafond 44A (~50–80 formes
   max) à respecter ; aujourd'hui 13, saine.
3. **MASAQ comme autorité de sens** — interdit, rester passif.
4. **Second moteur de priorité** (coach « adaptatif » mal conçu) — interdit.
5. **Gamification / fréquence / grammaire** — verrouillés, ne pas rouvrir.
6. **Sourate 107** : 1 forme EN-only bloque son READY — risque de contenu, pas de
   moteur.

---

## 16. Recommandation de prochaine phase

**`B — IMPORTANT AVANT ONBOARDING (produit) : poursuivre le déblocage éditorial
des sourates courtes READY restantes`**

Conformément à la stratégie (données d'abord, stabilité d'abord) et au verdict
45C (§Q), la prochaine action **réellement justifiée par les preuves** est :

1. **Débloquer les sourates courtes suivantes** (workflow 40C/41B/42B déjà établi :
   4 traductions alignées + Kazimirski 1860 → gloses `is_validated=true` →
   `seed-multisurah-curriculum` idempotent) :
   - **At-Tin (95)** : ~26 gloses ;
   - **Az-Zalzalah (99)** : ~26 gloses ;
   - puis Al-ʿĀdiyāt (100), Ash-Shams (91), etc. (coûts documentés en 40D/41A).
2. **Le cas échéant**, compléter la 1 forme EN-only de **Al-Māʿūn (107)** pour la
   passer READY.
3. **Optionnel P3** : les 2 micro-polish onboarding (fallback `/learn/basmala`,
   suppression des paramètres morts `goalType`/`goalValue`).

Aucun moteur, aucun schéma, aucune couche nouvelle — **uniquement des données
lexicales éditoriales + seed**, la voie la moins risquée et la plus alignée sur
l'identité « j'apprends ce que je récite ».

---

## 17. Ce qui NE DOIT PAS être fait

- ❌ Créer une **V3 de l'onboarding** (V2 = READY).
- ❌ Déplacer les **explications de sens** dans l'onboarding.
- ❌ Transformer **MASAQ** en moteur pédagogique (grading/SRS/mastery/priorité).
- ❌ Créer un **second moteur de priorité** à côté du SRS.
- ❌ Implémenter le **coach adaptatif** maintenant (différé 45C).
- ❌ Ajouter **gamification**, **piste fréquentielle**, **grammaire/tafsir/tomes de Médine**.
- ❌ Transformer les features de **Quran Progress** en roadmap automatique.
- ❌ Inventer des gaps (racines/schèmes = FUTURE_WORK assumé, pas un blocker).

---

## 18. Verdict final

**`PHASE_46_CONSOLIDATION_COMPLETE_ONBOARDING_READY`**

- L'état est consolidé : documentation = code = DB, 0 divergence.
- Tous les moteurs (résolveur, SRS, mastery, Daily Plan, curriculum, exercices,
  feedback, explications, MASAQ passif) sont **stables et non modifiés** par les
  audits 44B/45A/45B/45C.
- **L'onboarding V2 est READY** — version produit de référence, aucune refonte,
  aucune V3, seuls 2 micro-polish P3 subsistent.
- La **prochaine priorité justifiée** est le déblocage éditorial des sourates
  courtes READY restantes (données FR + seed idempotent), pas une nouvelle
  fonctionnalité.

**STOP.** Aucune phase suivante lancée automatiquement.

---

*Artefacts : `PHASE_46_POST_45C_CONSOLIDATION_AUDIT.md` (ce rapport),
`tmp/phase46-db-counts.json` (preuve des comptes), `tmp/phase46-verify-counts.cjs`
(script SELECT-only).*
