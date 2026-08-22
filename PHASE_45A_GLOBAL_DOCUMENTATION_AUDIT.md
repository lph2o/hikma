# PHASE 45A — AUDIT GLOBAL DE LA DOCUMENTATION DU PROJET

Statut : **`PHASE_45A_GLOBAL_DOCUMENTATION_AUDIT_COMPLETE`**

Nature : **STRICTEMENT READ-ONLY.** Aucun code modifié, aucune migration, aucune
écriture DB, aucun seed, aucun changement UI, aucun commit, aucun push. Seul
livrable : ce rapport.

---

## 0. Méthode & périmètre de lecture

- Corpus documentaire Markdown : **280 fichiers** `*.md` / `*.markdown`
  (hors `node_modules/` et `.next/`), répartis sur :
  - racine du dépôt (226 fichiers `PHASE_*.md`, `ONBOARDING_STATE_AUDIT_AND_PLAN.md`,
    `HIKMA_UIUX_AUDIT_V2.md`, `QURAN_PROGRESS_*.md`, `RAPPORT_TARTEEL_WBW_FR.md`,
    `README.md`, `AGENTS.md`, `CLAUDE.md`) ;
  - `docs/plans/` (5 design docs datés) et `docs/ui-ux-skills/` (skills UI/UX) ;
  - `archive/lingua-nextjs-prompts/` (14 prompts hérités, obsolètes) ;
  - `tmp/` (quelques `.md` de revue humaine : `phase30-medium-review.md`,
    `phase17b-kazimirski-human-review.md`, `phase22b-qf-commercial-license-request.md`).
- Lecture exhaustive des rapports de phase **couvrant 16 → 44** (lexique → moteur
  → MASAQ → onboarding → curriculum → explications), des rapports UI/UX (1–6),
  des rapports landing (6–7), et des audits transverses. Les anciens prompts
  `archive/lingua-nextjs-prompts/` sont **obsolètes** (spécifications pré-Hikma :
  Clerk, PostHog, agent Python — abandonnés), à ne plus considérer comme source de vérité.
- Vérifications croisées dans le **code réel** pour lever les ambiguïtés
  (`lib/learning/onboarding.ts`, `lib/learning/sense-explanation.ts`,
  `components/ui/hikma-explanation.tsx`, `supabase/migrations/0030*`, `0031*`).

---

## 1. Cartographie des phases (chronologie reconstruite)

Légende de statut : ✅ TERMINÉE · 🔁 REMPLACÉE/SUPERSÉDÉE · 🗂 OBSOLÈTE · 📋 PLANIFIÉE/À FAIRE · ⛔ READ-ONLY (audit).

### 1.1 Fondations applicatives (phases 1–15, antérieures au périmètre lexical)

| Phase | Objet | Statut |
|---|---|---|
| 1–5 | Setup Next.js 16, design system, état de leçon, UX | ✅ (rapports partiels : `PHASE_UI_UX_1`, `PHASE_UI_UX_5_LESSON_AUDIT`) |
| 6A–6I | UX/UI réelle, focus leçon premium, feedback pédagogique, hardening, multi-sourate | ✅ |
| 7A–7D | Landing (hero, product story, conversion premium, brand/couleurs/logo) | ✅ |

### 1.2 Chaîne lexicale française (16–21)

| Phase | Objet | Statut |
|---|---|---|
| 16A–16R | Audit/decision du canal source lexical FR (Kazimirski 1860/1869 domaine public retenu ; Tarteel/QUL, QF, Quranic Corpus, QAMAR, Qabas écartés ou en revue légale) | ✅ |
| 17 | Import Kazimirski (traductions) | ✅ |
| 17C / 17C_A | Architecture des lemmes (32 lemmas) + traductions de lemmes | ✅ |
| 17D | Import des gloses Kazimirski | ✅ |
| 18A–18C | Traductions FR (Hamidullah + Kazimirski) → `translations` (4 traducteurs) | ✅ |
| 19A–19E | Analyse multi-traductions, propositions + import de gloses pédagogiques, revue éditoriale, validation glose de lemme | ✅ |
| 20A–20D | Contexte maître pédagogique, verrou pédagogique Al-Fātiḥah, fix relation de lemme, **`FATIHAH_REFERENCE_LOCKED = TRUE`** | ✅ |
| 21A–21G | Pipeline multi-sourate, mapping mot→lemme (`word_lemma_mapping`), expansions, imports contrôlés, intégrité post-import | ✅ |

### 1.3 Moteur d'explication & socle pédagogique (22–23)

| Phase | Objet | Statut |
|---|---|---|
| 22 | Audit moteur d'explication (`HikmaExplanation`) — décision `LINGUISTIC_DATA_SOURCE_REQUIRED` | ✅ |
| 22A–22E | Audio word-learning : audit licences → import Muʿallim (21 295 audios) | ✅ |
| 23 | Recherche + fondation données linguistiques | ✅ |
| 23A–23B | Méthode pédagogique Hikma (inspirée Michel Thomas) | ✅ |
| 23C–23E | Données pédagogiques Al-Fātiḥah (audit → préparation → validation gloses) | ✅ |
| 23F | **Socle moteur pédagogique** : 8 compétences, séquenceur cumulatif, rappel actif, audio | ✅ |

### 1.4 MASAQ + UX/UI + feedback (24)

| Phase | Objet | Statut |
|---|---|---|
| 24A–24C | Découverte source linguistique → **MASAQ (CC BY) retenue** (QAMAR/Quranic Corpus en revue légale) | ✅ |
| 24D | Pilote READ-ONLY MASAQ Al-Fātiḥah (alignement 29/29) | ✅ |
| 24E | Harmonisation linguistique MASAQ | ✅ |
| 24F | Conception schéma couche linguistique (migration 0028 **préparée**) | ✅ |
| 24G | **Import contrôlé MASAQ Al-Fātiḥah** (29 occ / 56 segments) | ✅ |
| 24H | Conception moteur d'explication linguistique MASAQ → pédagogique | ✅ |
| 24I | **Intégration runtime MASAQ** dans `HikmaExplanation` (Al-Fātiḥah only) | ✅ |
| 24I_B / 24I_* | Feedback après chaque réponse (audit) + sécurité navigateur | ✅ |
| 24J | **Implémentation feedback pédagogique après chaque réponse** | ✅ |
| 24H_Q, 24H_Q1–Q3 | Prononciation/phonétique (design, reconnaissance, production) | ✅ / 📋 (partiel) |
| UI_UX 1–6 | Design system, app shell, dashboard, learning path, leçon, exercice shell, feedback, état/variété | ✅ |

### 1.5 Verrou référence + multi-sourate (25–28)

| Phase | Objet | Statut |
|---|---|---|
| 25 | **`FATIHAH_REFERENCE_LOCKED`** (verrou UX de référence) | ✅ |
| 26–27 | Généralisation linguistique multi-sourate + import | ✅ |
| 28 | Validation éditoriale des gloses | ✅ |

### 1.6 Onboarding + découverte + personnalisation (29–33)

| Phase | Objet | Statut |
|---|---|---|
| 29 | Audit produit onboarding/découverte (READ-ONLY) | ✅ |
| 30 | Découverte des sourates + consolidation lexicale FR (103 gloses HIGH, catalogue `/surahs`, 5 READY) | ✅ |
| 31 | Validation 87 gloses MEDIUM → ouverture 10 sourates | ✅ |
| 32 / 32A–32I | **Onboarding V2 personnalisé + obligatoire** (migration 0029 + 0030) | ✅ |
| 33A–33B | Personnalisation consommée (dashboard, `/surahs`, profil) | ✅ |

### 1.7 Expérience & progression (34–39)

| Phase | Objet | Statut |
|---|---|---|
| 34A–34C | Progression par sourate (inspirée Quran Progress) | ✅ |
| 35A–35C | Harmonisation parcours d'apprentissage global | ✅ |
| 36A–36G | Expérience d'apprentissage + clavier/réécriture arabe | ✅ |
| 37A–37B | **Couverture coranique** (`≈ X % du Coran`, modèle par formes, plafond 18,76 %) | ✅ |
| 38A–38B | **Daily Plan / coach narratif** (couche pure d'orchestration) | ✅ |
| 39A–39B | Consolidation progression | ✅ |

### 1.8 Efficacité curriculum + sourates courtes (40–42)

| Phase | Objet | Statut |
|---|---|---|
| 40A | Audit efficacité curriculum (plafond = données lexicales, pas la structure) | ✅ |
| 40B | Enrichissement FR high-yield (READ-ONLY, 15 P1 proposées) | ✅ |
| 40C | **Validation éditoriale 15 gloses P1** (word_translations 263 → 278) | ✅ |
| 40D | Audit intégration P1 (conclusion : P1 absentes des sourates courtes) | ✅ |
| 41A/41B | **Al-Qadr (97) + Al-Masad (111)** : 36 gloses → READY → seed | ✅ |
| 42A/42B | **Al-Qāriʿah (101)** : 21 gloses → READY → seed | ✅ |

### 1.9 Extension MASAQ + explications de sens (43–44)

| Phase | Objet | Statut |
|---|---|---|
| 43A | Audit extension MASAQ aux 12 sourates READY (316 occ, 100 % alignées) | ✅ |
| 43B | **Import MASAQ 12 sourates** (316 occ / 626 segments → total 413 / 796) | ✅ |
| 44A | Audit + conception couche « explication pédagogique de sens » (READ-ONLY) | ✅ |
| 44B | **Implémentation explications de sens** (13 + 1 override, migration 0031) | ✅ |

---

## 2. AUDIT PARTICULIER DE L'ONBOARDING

**Réponse globale : `ONBOARDING_ALREADY_IMPLEMENTED_AND_VALIDATED`** — la version
**V2** est **active, obligatoire et versionnée**. Il ne faut **pas** créer un
nouvel onboarding.

1. **Version actuellement implémentée : V2.**
   - `lib/learning/onboarding.ts` : `CURRENT_ONBOARDING_VERSION = 2` ;
     `isOnboardingComplete(settings) = settings?.onboarded && settings.onboarding_version >= 2`.
2. **Quand :** implémentée en **Phases 32C → 32I** (2026-08-18/19), personnalisation
   consommée en **33B**.
3. **Utilisateurs concernés :** tous (nouveaux + anciens).
4. **Nouveaux utilisateurs :** après signup/signin, redirection `/onboarding`
   (server actions → `redirectAfterAuthentication`), parcours complet puis
   `/dashboard`/première leçon.
5. **Anciens utilisateurs (historiques) :** migration `0030_mandatory_onboarding_version.sql`
   → `onboarding_version` rétro-complété à **1** (default 1), donc `isOnboardingComplete`
   = faux → **forcés de compléter la V2**. Les préférences restent `NULL` (aucune
   valeur inventée) et la progression n'est **jamais** réinitialisée.
6. **Détection de l'état :** `user_settings.onboarded` + `user_settings.onboarding_version`
   via le prédicat partagé `isOnboardingComplete`.
7. **Migration V1→V2 : OUI** (migration `0030`, additive, backfill version 1).
8. **V2 active : OUI** (code vérifié : `CURRENT_ONBOARDING_VERSION = 2`).
9. **Fichiers/code implémentant V2 :**
   - `app/(onboarding)/onboarding/page.tsx` (garde serveur) + `app/(onboarding)/layout.tsx` (shell sans `AppNav`) ;
   - `app/(app)/layout.tsx` (redirect si `!isOnboardingComplete`) ;
   - `app/(auth)/login/page.tsx` (redirect post-auth) ;
   - `lib/learning/actions.ts` (`completeOnboarding`, `redirectAfterAuthentication`) ;
   - `components/app/onboarding-form.tsx` (9 écrans → 6 étapes UX) ;
   - `lib/learning/onboarding-presentation.ts` (`getOnboardingUxStage`) ;
   - `lib/learning/onboarding.ts` (`recommendStartingSurah`, `isOnboardingComplete`) ;
   - `app/(app)/profile/page.tsx` + `components/app/learning-preferences.tsx` (réédition) ;
   - `lib/learning/personalization.ts` (copy personnalisée, 33B).
10. **Fonctionnalités déjà couvertes par V2 :** bienvenue/mascotte ; prénom ;
    objectif (`learning_goal`, 5 choix) ; niveau de lecture arabe ; familiarité
    Coran ; durée (`daily_duration`) ; rythme (`learning_pace`) ; choix de sourate
    (recommandation + alternatives, `IN_PREPARATION` refusé) ; récapitulatif +
    célébration ; recommandation déterministe ; persistance nullable ; garde
    obligatoire versionnée ; personnalisation ressentie au dashboard/`/surahs`/profil.
11. **Fonctionnalités réellement manquantes (toutes P3, micro-polish) :**
    - fallback `redirectTo="/learn/basmala"` encore ancré Al-Fātiḥah (utilisé
      seulement si la sourate choisie n'a pas de `firstLessonSlug`) ;
    - `goalType`/`goalValue` morts dans `completeOnboarding` (objectif toujours `words/5`) ;
    - pas d'E2E Playwright onboarding dédié dans la suite commitée.
    - **`daily_duration` (préférence douce) ≠ `daily_goal` (`words/5`) : séparation
      volontaire, PAS un écart.**

> Il n'existe **pas** d'« onboarding V3 ». Les seules mentions d'un « nouveau
> onboarding » dans des phases antérieures (29, 30, 44B §P.2) sont des
> **recommandations historiques déjà exécutées** par 32A–32I + 33B, ou des pistes
> futures (réutiliser la couche d'explication dans l'accueil) **non encore lancées**.

---

## 3. AUDIT PARTICULIER DE LA PHASE 44B (explications de sens)

1. **Ce que 44A a décidé :** créer une couche « explication pédagogique de sens »,
   **distincte** de la glose lexicale (A) et de l'information linguistique MASAQ (B).
   Modèle retenu : **`word_explanations`** (granularité FORME, clé `(word_id, language)`)
   **+ `word_explanation_contexts`** (override contextuel optionnel `(word_explanation, ayah)`).
   Seuil anti-inflation : n'écrire que si la valeur pédagogique est démontrée (~50–80
   formes max sur 330). MASAQ = enrichissement **passif**, jamais autorité de sens.
2. **Ce que 44B a réellement implémenté :** migration `0031_word_explanations.sql` ;
   **13 explications FR validées** + **1 override contextuel** (`فَأُمُّهُۥ` 101:9) ;
   **4 formes rejetées** (glose suffisante) ; résolution pure
   `lib/learning/sense-explanation.ts → resolveSenseExplanation`.
3. **Où elles sont affichées :** dans le conteneur **`HikmaExplanation`**
   (`components/ui/hikma-explanation.tsx`), bloc **« Pourquoi ce sens »**.
4. **Quand :** **après l'effort** (après la réponse de l'utilisateur), dans le
   feedback post-réponse (comportement 24J : feedback après **chaque** réponse,
   correcte ou incorrecte). Ordre des blocs : Mot → Glose → **Explication de sens**
   → Décomposition MASAQ → Contexte du verset → Audio.
5. **Pendant le cours :** non, pas en amont de la réponse (l'explication est une
   couche de feedback, pas un contenu de découverte).
6. **Après la réponse :** **oui** — c'est exactement son point d'injection
   (`components/learn/exercises/pedagogical-feedback.ts`, résolu serveur dans
   `app/(app)/learn/[slug]/page.tsx` avec le même contexte que l'exercice).
7. **Intégrée à l'onboarding :** **NON.**
8. **Devait-elle l'être ?** **Non — ce n'était qu'une recommandation future.**
   44B §P.2 liste « Onboarding : réutiliser la couche d'explication dans le parcours
   d'accueil » comme **recommandation Phase 45 non exécutée**. Rien n'a été câblé.
9. **Les 13 formes actuellement expliquées :** `فَأُمُّهُۥ`, `هَاوِيَةٌۭ`, `لَهَبٍۢ`,
   `يَدَآ`, `مَّسَدٍۢ`, `ٱلْقَدْرِ`, `ٱلْقَارِعَةُ`, `نَارٌ`, `كَٱلْفَرَاشِ`,
   `أَنزَلْنَـٰهُ`, `مَن`, `مَنْ`, `مَوَٰزِينُهُۥ`.
10. **Rôle de l'override contextuel :** préciser le sens pour un verset donné
    (idiome/polysémie par verset). Il **complète** la glose et l'explication
    générique, il ne les **contredit** jamais et ne les **écrase** pas.
11. **Ce qui est volontairement absent :**
    - 4 formes rejetées : `يَكُونُ`, `وَتَكُونُ`, `سَلَـٰمٌ`, `إِنَّآ` (glose suffisante) ;
    - aucune explication EN/IT (français seul) ;
    - aucune connexion au resolver de sens, aux exercices de rappel, au SRS, au
      mastery, au Daily Plan ni à l'onboarding (couche **passive**) ;
    - racines/schèmes (`FUTURE_WORK`).

**Distinction conceptuelle à ne PAS fusionner** (confirmée par la documentation) :

```text
ONBOARDING          ≠ accueil personnalisé (Phases 32–33)
COURS               ≠ LessonPlayer / séquence d'exercices (Phases 23F, 24)
FEEDBACK APRÈS RÉPONSE ≠ feedback pédagogique après chaque réponse (Phase 24J)
EXPLICATION DE SENS ≠ couche « Pourquoi ce sens » (Phase 44B)
```

---

## 4. AUDIT MASAQ

### 4.1 Provenance, licence, périmètre

| Élément | Valeur |
|---|---|
| **Source** | MASAQ v2 — *Morphologically-Analyzed and Syntactically-Annotated Quran*, Majdi Sawalha, University of Jordan (2024) |
| **DOI / fichier** | `10.17632/9yvrzxktmr.2` · `tmp/MASAQ.csv` (18 650 409 o, 19 colonnes) |
| **SHA-256** | `777d0cc8f24f4c17d07ad83a522056fe7ebd5c83dbbae86161f1fdc95aaca900` (vérifié, conforme) |
| **Licence** | **CC BY 3.0** (page Mendeley) / **CC BY 4.0** (registre DataCite) → `SAFE_WITH_ATTRIBUTION` |
| **Texte source** | Tanzil.net (Uthmani, édition du Caire 1924, Ḥafṣ) |
| **`sources` DB** | source `72d4ac84-…` (name=MASAQ, version=v2, type=linguistic) |

### 4.2 Périmètre importé & couverture

| Phase | Périmètre | Occurrences | Segments |
|---|---|---|---|
| 24G | Al-Fātiḥah (1) seule | 29 | 56 |
| 24E/24G (préexistant) | 108, 112, 113, 114 | 68 | 114 |
| 43B | 93, 94, 97, 101, 102, 103, 104, 105, 106, 109, 110, 111 | 316 | 626 |
| **Total DB actuelle** | **17 sourates sur 18 du catalogue** (toutes sauf 107) | **413** | **796** |

- **Formes distinctes couvertes : 311/330** (94,2 %) du catalogue ; **234 formes**
  avec clitiques (segment non-Stem).
- Couverture linguistique : **POS 100 % · Cas/Modus 100 % · Syntaxe 91,8 %**.
- **Racines : 0 · Schèmes : 0** (`FUTURE_WORK`, MASAQ v2 ne les fournit pas) ;
  `linguistic_lemmas = 0`, `linguistic_roots = 0`.

### 4.3 Règles d'alignement

- Alignement par **`(surah, ayah, position)`**, jamais par chaîne arabe seule.
- Distribution post-43B (classifieur étendu validé) : **182 EXACT · 126 EXACT_ORTHOGRAPHIC
  · 8 VARIANT_ORTHOGRAPHY_DOCUMENTED · 0 MISSING · 0 EXTRA · 0 AMBIGUOUS**.
- Normalisation orthographique documentée (shadda, alif poignard, alif maqsura,
  petit yeh/waw, hamza/madda, wasla) — **aucune normalisation destructive** : les
  chaînes arabes d'origine (`quran_words`, `word_occurrences`, `translations`) sont intactes.
- Anomalie source 109:1:2 (deux `Segment_No=1`) réparée dans le plan (segment_no =
  ordre d'apparition), fichier source jamais modifié.

### 4.4 Statut passif/actif & connexion au runtime

- Couche **strictement passive** : `lib/linguistic/masaq.ts` + `lib/linguistic/masaq-plan.ts`
  + `lib/linguistic/explanation.ts` (`buildLinguisticExplanation`).
- **Seule connexion runtime :** le bloc « Décomposition »/« Identification » de
  `HikmaExplanation` (Phase 24I), lu via `getWordLinguisticEvidence`, **limité à
  l'explication post-réponse**, plafonné à **2 blocs**, sans tag MASAQ brut.
- **Aucune connexion** au resolver de sens, au grading, au SRS, au mastery, au
  curriculum, au Daily Plan ni à l'onboarding.
- **MASAQ n'est PAS une autorité sémantique** : `masaq_gloss_en` = `EXTERNAL_LINGUISTIC_EVIDENCE`
  uniquement, jamais glose FR, jamais traduit, jamais affiché. La glose FR reste
  **toujours éditoriale Hikma** (`word_translations`).

---

## 5. AUDIT DU CATALOGUE DES SOURATES

### 5.1 États réels (18 sourates ancrées, `getSurahCatalog`)

| État | Sourates | Définition |
|---|---|---|
| **REFERENCE** | 1 Al-Fātiḥah | verrouillée (`FATIHAH_REFERENCE_LOCKED = TRUE`), jamais régénérée/réimportée |
| **READY (16)** | 93, 94, 97, 101, 102, 103, 104, 105, 106, 108, 109, 110, 111, 112, 113, 114 | 100 % des formes résolvent en FR **et** parcours seedé |
| **IN_PREPARATION (1)** | 107 Al-Māʿūn | 22/23 formes FR (1 forme EN-only) — pas de CTA, listée « bientôt » |

`classifySurahReadiness(number, effectiveFrPct)` → `READY` **ssi 100 % FR**. Le
critère de readiness est **uniquement lexical français** (jamais MASAQ). Une
sourate ne devient visible dans le catalogue qu'après **seed** de son
`learning_paths` (deux écritures : gloses + seed).

### 5.2 Couches pédagogiques par sourate READY

| Couche | État | Notes |
|---|---|---|
| Traductions FR (ayah) | ✅ **toutes** | 4 traducteurs complets (Hamidullah FR, Kazimirski FR, Sahih EN, Piccardo IT) |
| Gloses FR (mot-à-mot) | ✅ **100 %** sur les 16 READY + référence | `word_translations` FR validées = **335** ; 8 formes EN-only subsistent sur l'ensemble du catalogue (dont 1 bloque 107) |
| Gloses de lemme | ✅ partiel | `lemma_translations` = 32 (28 FR validées) ; lemmes = 32 seulement |
| Explications de sens | 🟡 **13 formes** | sur 97/101/111 (Phase 44B) — couche récente et volontairement réduite |
| MASAQ | 🟡 **17/18** sourates | 413 occ / 796 segments ; **absente sur 107** ; racines/schèmes = 0 |
| Curriculum (parcours + leçons) | ✅ **18 parcours · 111 leçons · 742 lesson_words** | 1 leçon/verset, mots cumulés + revue ≤4 |
| Audio | ✅ complet (Muʿallim, 21 295 formes) | une URL signée par forme |
| Autres | progression, SRS, mastery, Daily Plan, exercices | couches transverses, indépendantes de la sourate |

### 5.3 Écart « READY » ≠ « READY + toutes les couches pédagogiques »

**Confirmé.** `READY` signifie **uniquement** : 100 % de couverture lexicale FR +
parcours seedé. Il ne garantit **ni** MASAQ (107 en est la preuve inverse, mais
elle n'est de toute façon pas READY), **ni** les explications de sens (13 formes
seulement, sur 3 sourates), **ni** la lemmatisation (32 lemmes). Aucune sourate
n'est « READY + MASAQ + explications + lemmes complets » simultanément. MASAQ et
explications sont des **enrichissements passifs**, jamais des prérequis de readiness.

---

## 6. AUDIT DES DONNÉES PÉDAGOGIQUES (couches)

| Couche | Rôle | Phase de création | Statut | Consommée par le runtime ? | Complète ? |
|---|---|---|---|---|---|
| `quran_words` (21 296) | identité lexicale (forme), `meaning` = glosse **EN** Quran.com | corpus initial | stable | oui (resolver, word bank) | oui (mais glosse EN, pas FR) |
| `word_occurrences` (77 430) | occurrences réelles (texte Uthmani) | corpus initial | stable | oui (couverture, MASAQ) | oui |
| `translations` (24 944) | traductions d'ayah (4 traducteurs) | 18A–18C | stable | oui (contexte de verset) | oui (4/4 sur tout le Coran) |
| `word_translations` (335 FR) | gloses lexicales FR validées (FORME) | 19C/21F/30/40C/41B/42B | stable | **oui** (resolver FORME) | partiel (335/21 296) |
| `lemma_translations` (32) | gloses de lemme FR | 17C/18C | stable | oui (resolver LEMME) | partiel (28 FR validées) |
| `lemmas` (32) | lemmes (forme-surface) | 17C | stable | oui (fallback lemme) | partiel (8 validés) |
| `word_lemma_mapping` (184 safe) | mapping forme→lemme | 21B | stable | oui (resolver LEMME) | partiel |
| `linguistic_occurrences` (413) | analyse MASAQ par occurrence | 24G/43B | stable | partiel (explication seulement) | partiel (17/18 sourates) |
| `linguistic_segments` (796) | segmentation MASAQ (prefix/stem/suffix) | 24G/43B | stable | partiel (décomposition) | partiel |
| `linguistic_lemmas` / `roots` (0/0) | réservées (futur) | 24F (vides) | vides | non | vide (FUTURE_WORK) |
| `word_explanations` (13) | explication pédagogique de sens (FORME) | 44B | stable | **oui** (bloc « Pourquoi ce sens ») | volontairement partielle |
| `word_explanation_contexts` (1) | override contextuel de sens | 44B | stable | oui | volontairement partielle |
| `learning_paths`/`units`/`lessons`/`lesson_words` (18/18/111/742) | curriculum (sourate→verset→mots) | 6I/23F/30/41B/42B | stable | oui (LessonPlayer) | partiel (18/114 sourates) |
| `review_items` (SRS Leitner) | répétition espacée | phases précoces | stable | oui (révision, Daily Plan) | oui |
| `user_word_progress` | progression agrégée + statuts (new/learning/familiar/mastered) | phases précoces | stable | oui (progression, couverture) | oui |
| `user_word_skill_progress` | maîtrise par 8 compétences | 23F | stable | oui (séquenceur) | oui |
| Daily Plan (`lib/learning/daily-plan.ts`) | orchestration pure (coach) | 38B | stable | oui (dashboard) | oui |
| exercices (10+ générateurs) | reconnaissance/rappel/audio/… | 23F+ | stable | oui | oui |
| audio (Muʿallim, 21 295) | prononciation signée par forme | 22E | stable | oui | oui |
| onboarding (`user_settings`) | préférences + version | 32 | stable | oui (garde) | oui (V2) |

**Résumé des dépendances de résolution (resolver) :** `FORME → LEMME → EN fallback`
(`resolveWordMeanings` / `getValidatedFrenchMeanings`). Seules les lignes
`is_validated = true` sont actives.

---

## 7. RECONSTRUCTION DE L'ARCHITECTURE ACTUELLE

```text
SOURCE CORPUS
   quran_words (21 296 formes) ── word_occurrences (77 430) ── ayahs (6 236)
        │
LEXIQUE / FORMES
   word_translations FR (335 validées)          ← glose FORME (éditoriale Hikma)
        │
TRADUCTIONS
   translations (24 944 : Hamidullah FR · Kazimirski FR · Sahih EN · Piccardo IT)
        │                                              └─ contexte de verset uniquement
GLOSES FR
   resolver FORME → LEMME → EN fallback
   lemmas (32) + lemma_translations (28 FR) + word_lemma_mapping (184 safe)
        │
MASAQ / COUCHE LINGUISTIQUE (passive)
   linguistic_occurrences (413) + linguistic_segments (796)
   → lib/linguistic/explanation.ts (décomposition, identité, cas, syntaxe)
   (racines/schèmes = FUTURE_WORK ; gloss EN MASAQ = evidence, jamais glose FR)
        │
EXPLICATIONS DE SENS (passive, 44B)
   word_explanations (13) + word_explanation_contexts (1)
   → resolveSenseExplanation (générique → override contextuel → null)
        │
CURRICULUM
   learning_paths (18) → units → lessons (111) → lesson_words (742)
   seed idempotent + planSurahCurriculum (1 leçon/verset)
        │
COURS
   LessonPlayer → séquenceur cumulatif (8 compétences) → exercices (10+ générateurs)
        │
EXERCICES
   WORD_TO_TRANSLATION · FORM_TO_MEANING · MEANING_TO_FORM ·
   AUDIO_TO_WORD · WORD_TO_AUDIO · LEMMA_RELATION · …
        │
RÉPONSE UTILISATEUR
   validateAnswer → CORRECT / INCORRECT / AMBIGUOUS (grading = autorité)
        │
FEEDBACK (après chaque réponse, 24J)
   ├── GLOSE            (FORME → LEMME → EN)
   ├── EXPLICATION DE SENS  (« Pourquoi ce sens », si word_explanations existe)
   ├── DÉCOMPOSITION    (MASAQ, 2 blocs max, si disponibilité réelle)
   ├── CONTEXTE         (verset + Hamidullah FR)
   └── AUDIO            (Muʿallim, URL signée)
        │
SRS / MASTERY
   review_items (Leitner) · user_word_progress (statuts) ·
   user_word_skill_progress (8 compétences)
        │
PROGRESSION / COUVERTURE / DAILY PLAN
   getQuranCoverage (≈ X % du Coran) · composeDailyPlan (coach pur) · dashboard
```

**Règles d'or transversales (verrouillées par les phases) :**

- `FATIHAH_REFERENCE_LOCKED = TRUE` (ne jamais ré-importer/ré-modifier Al-Fātiḥah).
- `AVAILABLE ≠ INFERABLE` : donnée absente → bloc omis, jamais inventé (racines,
  schèmes, sens contextuel auto-dérivé).
- Glose FR = **toujours éditoriale Hikma** (workflow 4 traductions + Kazimirski 1860),
  jamais copiée, jamais générée depuis l'anglais/italien seul, jamais depuis MASAQ.
- MASAQ = **enrichissement passif**, jamais autorité de sens ni critère de readiness.
- Grading / scoring / SRS / mastery / progression / curriculum = invariants protégés
  dans **toutes** les phases de données/UI.
- READY = 100 % lexical FR + parcours seedé ; **≠** toutes les couches complètes.

---

## 8. Conclusions & garde-fous pour toute phase suivante

1. **Ne pas refaire l'onboarding** : V2 est implémentée, versionnée et validée
   (32A→32I + 33B). Il ne reste que 2–3 micro-polish P3.
2. **Ne pas confondre** onboarding / cours / feedback / explication de sens : ce
   sont quatre couches distinctes, toutes déjà en place.
3. **Ne pas re-proposer l'intégration de l'explication de sens à l'onboarding**
   comme si elle était manquante : c'est une recommandation 44B §P.2 **future**,
   non exécutée, à ne lancer que sur décision explicite.
4. **Ne pas considérer MASAQ comme une autorité sémantique** ni comme un critère
   de readiness : il est passif (413 occ / 796 segments), sans racines/schèmes.
5. **Ne pas considérer READY comme synonyme de « toutes les couches pédagogiques
   complètes »** : READY = lexical FR 100 % + seed uniquement.
6. **Prochaine phase recommandée par la documentation elle-même** (non lancée) :
   Phase 45 = étendre progressivement les explications de sens (d'abord les 8 formes
   EN-only, puis les polysémies de 107), ou réutiliser la couche d'explication dans
   l'onboarding — **uniquement après validation explicite**, conformément au
   principe « STOP — aucune phase suivante lancée automatiquement » observé partout.

---

*Livrables : ce rapport. Aucun fichier de code, aucune migration, aucune donnée
modifiée. Vérification : `git status` inchangé par cette phase.*
