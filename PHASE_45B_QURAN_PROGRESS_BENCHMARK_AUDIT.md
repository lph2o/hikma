# PHASE 45B — AUDIT & BENCHMARK QURAN PROGRESS → HIKMA

Statut : **`PHASE_45B_QURAN_PROGRESS_BENCHMARK_COMPLETE`** (READ-ONLY)

> Aucune écriture DB, aucune migration, aucun seed, aucune modification du
> runtime / onboarding / curriculum / SRS / mastery / exercices / UI. Aucun
> commit, aucun push. Seul livrable : ce rapport (analyse → comparaison →
> filtre → priorisation → décision).

---

## 1. Méthode & sources (avec niveau de confiance)

Recherche externe effectuée **sur sources primaires** (site officiel), car
l'outil de recherche web n'a renvoyé aucun résultat pendant cette session.

| Source | URL | Contenu exploité | Confiance |
|---|---|---|---|
| Site officiel (FR) | `https://www.quranprogress.com/` | proposition de valeur, stats, 3 étapes du parcours, FAQ | **ÉLEVÉE** (primaire) |
| Sitemap officiel | `https://www.quranprogress.com/sitemap.xml` | pages blog, à-propos, contact, langues (fr/en/de) | **ÉLEVÉE** |
| À propos | `https://www.quranprogress.com/a-propos/` | mission, 4 000+ mots, tomes de Médine, Dr Abdurraheem, Al-Lawh, coach virtuel | **ÉLEVÉE** |
| Blog « 125 mots » | `…/blog/125-mots-pour-comprendre-le-coran/` | méthode fréquence, données réelles (مِنْ 3215, رَبّ 971, …), seuils 125/250/500 | **ÉLEVÉE** |
| Blog « répétition espacée » | `…/blog/repetition-espacee-memoriser-coran/` | Leitner 1/3/7/14/30/90 j, adaptation, ordre par fréquence | **ÉLEVÉE** |

**Limites documentées (honnêteté) :**
- Les pages **App Store / Google Play** n'ont pas pu être récupérées (404/429).
  → tout détail **store-specific** (monétisation, captures, streak/XP/classements
  éventuels in-app) est **`NON_VÉRIFIÉ`**.
- Aucune fonctionnalité n'est présentée comme existante sur la seule foi de la
  mémoire du modèle : chaque élément ci-dessous est tracé à une source ci-dessus,
  ou marqué explicitement `NON_VÉRIFIÉ`.

---

## 2. Base de référence Hikma (déjà terminé — ne pas re-proposer)

Rappel issu de `PHASE_45A_GLOBAL_DOCUMENTATION_AUDIT.md` :

- **Onboarding V2** actif (`CURRENT_ONBOARDING_VERSION = 2`, migration 0030) — `ONBOARDING_ALREADY_IMPLEMENTED_AND_VALIDATED`.
- **Explications de sens** (44B) intégrées au **cours** (`word_explanations` + `word_explanation_contexts`), pas à l'onboarding.
- **MASAQ** (43B) : 413 occurrences / 796 segments, passif, 17/18 sourates, racines/schèmes `FUTURE_WORK`.
- **Catalogue** : 1 REFERENCE + 16 READY + 1 IN_PREPARATION (107) = 18 sourates.
- SRS (Leitner), mastery 8 compétences, Daily Plan, couverture « ≈ X % du Coran »,
  exercices variés, feedback post-réponse riche : **tous déjà en place**.

---

## 3. Inventaire structuré de Quran Progress (traçable)

### 3.1 Identité & données

| # | Fonctionnalité | Preuve (source) | Confiance |
|---|---|---|---|
| I1 | Apprendre l'arabe **du Coran** pour comprendre sa récitation/prière | site + à-propos | ÉLEVÉE |
| I2 | **Apprentissage par fréquence** (ordre des mots = fréquence décroissante) | blog 125 mots, blog SRS | ÉLEVÉE |
| I3 | Base de fréquence du **Dr AbdulAzeez Abdurraheem** | à-propos | ÉLEVÉE |
| I4 | Catalogue **4 000+ mots** (vocabulaire coranique + **tomes de Médine**) | à-propos | ÉLEVÉE |
| I5 | Traduction partiellement basée sur **Al-Lawh** | à-propos | ÉLEVÉE |
| I6 | **6 langues** (fr, en, de, tr, id, ms) | site, à-propos | ÉLEVÉE |
| I7 | App **mobile iOS + Android** depuis 2016 | à-propos | ÉLEVÉE |
| I8 | 500 K+ utilisateurs · 28 K+ avis · 4,9/5 | site | ÉLEVÉE (marketing) |

### 3.2 Apprentissage

| # | Fonctionnalité | Preuve | Confiance |
|---|---|---|---|
| L1 | Vocabulaire coranique mot par mot | site | ÉLEVÉE |
| L2 | **Ordre par fréquence** (les plus répétés d'abord) | blog SRS | ÉLEVÉE |
| L3 | **Apprendre à lire l'arabe** (de l'alphabet) | site (« apprenez à le lire ») + blog « apprendre à lire » | ÉLEVÉE |
| L4 | Chaque mot : arabe + **translittération** + **audio** + **traduction** + **contexte (verset)** + **différentes formes** | site FAQ + blog SRS | ÉLEVÉE |
| L5 | Exercices **variés** : quiz, **QCM**, **écriture**, **devinettes/énigmes** | site + à-propos | ÉLEVÉE |
| L6 | Mémorisation durable | site | ÉLEVÉE |

### 3.3 Révision / SRS

| # | Fonctionnalité | Preuve | Confiance |
|---|---|---|---|
| R1 | **Répétition espacée (SRS) Leitner** : 1/3/7/14/30/90 j | blog SRS | ÉLEVÉE |
| R2 | **Planning de révision généré automatiquement** | site | ÉLEVÉE |
| R3 | **Adaptation aux réponses** (correct → intervalle plus long, échec → plus court) | blog SRS | ÉLEVÉE |
| R4 | **Coach virtuel** qui adapte les révisions au **niveau et au rythme** | site + à-propos | ÉLEVÉE |

### 3.4 Parcours & motivation

| # | Fonctionnalité | Preuve | Confiance |
|---|---|---|---|
| P1 | Parcours « débutant → avancé », **5 minutes/jour** | site | ÉLEVÉE |
| P2 | Session = 2–3 nouveaux mots + 15–20 révisions/jour | blog SRS | ÉLEVÉE |
| P3 | Suivi de **progression jour après jour** | site | ÉLEVÉE |
| P4 | Focus **prière / salat** | site + blog « comprendre sa prière » | ÉLEVÉE |
| P5 | Gamification (XP, badges, streaks, classements, défis) | **non mentionnée sur le site** (marketing « pas de pression ») | **NON_VÉRIFIÉ** |

### 3.5 Coran / linguistique

| # | Fonctionnalité | Preuve | Confiance |
|---|---|---|---|
| C1 | Contexte coranique du mot | blog SRS | ÉLEVÉE |
| C2 | « Différentes formes » d'un mot | blog SRS | ÉLEVÉE |
| C3 | Notion de **racines** (évoquée conceptuellement) | blog 125 mots (« mots et racines reviennent ») | MOYENNE (concept marketing, pas une feature vérifiée) |
| C4 | Tafsir / grammaire dédiée / récitation (tajweed) | **non mentionnées** | NON_VÉRIFIÉ |

---

## 4. Comparaison Quran Progress vs Hikma

Statuts : `ALREADY_EXISTS` · `PARTIALLY_EXISTS` · `MISSING` · `NOT_RELEVANT` · `SUPERSEDED_BY_HIKMA`.

| Fonctionnalité Quran Progress | Existe dans Hikma ? | État Hikma | Différence | Valeur potentielle |
|---|---|---|---|---|
| Vocabulaire coranique mot par mot | Oui | Complet | identique | — (`ALREADY_EXISTS`) |
| **Ordre par fréquence** | Non | — | Hikma = ordre coranique (sourate→verset), décision 40A | **Moyenne** (`MISSING`, volontaire) |
| Répétition espacée (SRS) | Oui | Complet | identique (Leitner) | — (`ALREADY_EXISTS`) |
| Planning de révision auto | Oui | Complet | Daily Plan + review_items | — (`ALREADY_EXISTS`) |
| **Coach virtuel adaptatif** | Partiel | Déterministe, non adaptatif | QP adapte révisions au niveau/rythme ; Hikma = coach statique | **Forte** (`PARTIALLY_EXISTS`) |
| Exercices variés (quiz/QCM) | Oui | Complet | Hikma ≥ 10 générateurs | — (`ALREADY_EXISTS`) |
| **Exercice d'écriture** | Partiel | Production = rappel auto-évalué, pas d'écriture machine-gradée | QP a « écriture » | **Moyenne** (`PARTIALLY_EXISTS`) |
| **Devinettes / énigmes** | Non | — | QP a des énigmes | **Faible** (`MISSING`) |
| Contexte du verset | Oui | Complet (4 traducteurs) | Hikma = 4 traductions d'ayah | — (`ALREADY_EXISTS`) |
| **Différentes formes d'un mot** | Partiel | résolu via lemme (fallback) mais non *enseigné* groupé | QP présente les formes ensemble | **Moyenne** (`PARTIALLY_EXISTS`) |
| Translittération + audio | Oui | Complet (Muʿallim) | identique | — (`ALREADY_EXISTS`) |
| Suivi de progression | Oui | Complet (mastery, couverture, activité) | Hikma plus riche | — (`SUPERSEDED_BY_HIKMA`) |
| **Couverture « % du Coran »** | Oui | **Complet et plus rigoureux** | Hikma calcule par FORME (Phase 37) ; QP = claim fréquence par racine/lemme (125→50 %) | — (`SUPERSEDED_BY_HIKMA`) |
| **Apprendre à lire l'arabe (alphabet)** | Non | translittération + niveau de lecture, pas d'enseignement de l'alphabet | QP l'enseigne | **Faible/Moyenne** (`MISSING`, hors scope probable) |
| **Tomes de Médine / grammaire arabe** | Non | Hikma refuse d'être un cours de grammaire (24H/44A) | QP inclut Médine | — (`NOT_RELEVANT`) |
| **6 langues UI** | Non | FR uniquement (documenté README) | QP multilingue | — (`NOT_RELEVANT` à ce stade) |
| Focus prière / salat | Oui | Al-Fātiḥah + sourates courtes couvrent la salat | angle marketing, pas une feature | — (`ALREADY_EXISTS`) |
| Racines | Non | 0 (FUTURE_WORK) | QP évoque les racines sans les enseigner (non vérifié) | — (`NOT_RELEVANT` à court terme) |
| Morphologie/grammaire du mot | Partiel | MASAQ (POS/cas/syntaxe, passif) | Hikma plus profond, mais passif | — (`SUPERSEDED_BY_HIKMA`) |
| Tafsir | Non | — | non mentionné chez QP non plus | — (`NOT_RELEVANT`) |
| Gamification (XP/badges/streaks) | Non | **rejetée explicitement** (29, 40A) | non vérifiée chez QP | — (`NOT_RELEVANT`/REJECTED) |

---

## 5. Ne pas confondre (équivalences vérifiées)

| Nom Quran Progress | Équivalent Hikma | Statut |
|---|---|---|
| « Répétition espacée » | `review_items` (Leitner) | même moteur (`ALREADY_EXISTS`) |
| « Planning de révision auto » | `composeDailyPlan` + `getReviewDueCount` | `ALREADY_EXISTS` |
| « Coach virtuel » | `getCoachLine` (Daily Plan) | **partiel** : le coach Hikma est déterministe, pas adaptatif |
| « Maîtrise » | `user_word_progress` + `user_word_skill_progress` (8 compétences) | `SUPERSEDED_BY_HIKMA` (plus granulaire) |
| « Progression » | couverture + mastery + activité + statuts de leçon | `SUPERSEDED_BY_HIKMA` |
| « Contexte coranique » | `translations` (4 traducteurs) | `ALREADY_EXISTS` |
| « Différentes formes » | `lemmas` + `word_lemma_mapping` (canal de sens) | `PARTIALLY_EXISTS` |
| « Explication / pourquoi » | `HikmaExplanation` (MASAQ + explication de sens) | `SUPERSEDED_BY_HIKMA` |
| « Onboarding » | Onboarding V2 | `ALREADY_EXISTS` |
| « Catalogue de mots » | `quran_words` (21 296 formes) | `ALREADY_EXISTS` (mais gloses FR : 335 seulement) |

---

## 6. Analyse pédagogique (fonctionnalités absentes ou partielles)

Scores 1–5 (5 = max valeur / complexité / risque).

| Fonctionnalité | Valeur péda | Positionnement | Fréquence d'usage | Complexité | Risque | Dépendances Hikma |
|---|---|---|---|---|---|---|
| Coach virtuel **adaptatif** | 4 | 4 | 5 | 3 | 2 | SRS + profil (`user_settings`) + Daily Plan |
| Exercice **d'écriture** machine-gradé | 3 | 3 | 3 | 4 | 3 | clavier arabe (36G) + grading + exercices |
| **Formes d'un mot groupées** (famille) | 3 | 4 | 2 | 3 | 3 | lemmas + word_lemma_mapping + UI leçon |
| Apprendre à **lire l'arabe** | 2 | 2 | 2 | 4 | 3 | aucun (nouveau module) |
| **Piste fréquentielle** (découverte) | 2 | 2 | 3 | 2 | 4 | couverture + occurrences + catalogue |
| Devinettes/énigmes | 2 | 2 | 2 | 2 | 2 | exercices |

---

## 7. Filtre produit Hikma (application des 10 principes)

| Fonctionnalité | Verdict filtre | Justification |
|---|---|---|
| Coach virtuel adaptatif | ✅ **RETENUE (P1)** | améliore la révision réelle, cohérent avec SRS/mastery, présentation au-dessus des moteurs existants (ne contourne pas le SRS), coût raisonnable |
| Exercice d'écriture | ⚠️ **P2** | valeur réelle (production) mais complexité de grading arabe ; rappel auto-évalué déjà présent |
| Formes d'un mot groupées | ⚠️ **P2/P3** | valeur pédagogique réelle mais tension avec le Modèle A (formes strictes) — à cadrer sans casser la couverture |
| Piste fréquentielle | ❌ **REJECTED** | contraire à l'identité « j'apprends ce que je récite » (40A/40D déjà rejetée) |
| Apprendre à lire l'arabe | ⚠️ **P3 / hors scope** | hors promesse Hikma (comprendre sa récitation), coût module entier |
| Devinettes/énigmes | ❌ **REJECTED** | faible valeur, complexité ludique hors identité |
| Gamification (XP/badges/streaks/classements) | ❌ **REJECTED** | déjà rejetée (29, 40A) — vanity metrics |
| Tomes de Médine / grammaire | ❌ **REJECTED** | Hikma refuse d'être un cours de grammaire (24H/44A) |
| 6 langues UI | ⏸️ **DEFERRED** | FR-only documenté ; schéma `language` prêt, mais hors périmètre actuel |
| Tafsir | ❌ **REJECTED** | hors scope, données/licence absentes, risque éditorial |
| Racines (déjà FUTURE_WORK) | ⏸️ **DEFERRED** | nécessite source auditée (Kazimirski/Lane), décision séparée |

---

## 8. Priorisation

### P1 — HAUTE PRIORITÉ
1. **Coach virtuel adaptatif** — faire évoluer `getCoachLine`/Daily Plan pour
   adapter la **formulation** (et éventuellement l'ordre de présentation des
   révisions) au profil déjà collecté (`learning_goal`, `arabic_reading_level`,
   `daily_duration`, `learning_pace`, `quran_familiarity`) **et** aux signaux SRS
   existants — **sans** créer de second moteur de priorité (le SRS reste la seule
   source de vérité ; le coach est une couche de présentation/adaptation).

### P2 — MOYENNE PRIORITÉ
2. **Exercice d'écriture / production machine-gradée** — étendre le rappel
   auto-évalué actuel vers une saisie arabe vérifiée (clavier arabe 36G + formes
   attendues normalisées), en réutilisant le grading existant, sans introduire de
   reconnaissance vocale ni d'OCR.
3. **Regroupement pédagogique « formes d'un même mot »** — présenter, à la
   découverte ou dans l'explication, les formes d'un même lemme **à titre
   informatif** (déjà résolues par `word_lemma_mapping`), sans fusionner la
   couverture (Modèle A strict conservé).

### P3 — FUTURE / EXPÉRIMENTALE
4. **Module « apprendre à lire l'arabe »** (alphabet → syllabes) — uniquement si
   la stratégie produit s'élargit au-delà de « comprendre sa récitation » ; module
   lourd, à décider séparément.

### REJECTED
- Piste fréquentielle en axe d'apprentissage (déjà rejetée 40A/40D).
- Devinettes/énigmes.
- Gamification (XP, badges, streaks, classements).
- Tomes de Médine / cours de grammaire.
- Tafsir.

### DEFERRED (hors périmètre, décision future)
- 6 langues UI (FR-only documenté).
- Racines (source auditée requise, FUTURE_WORK).

---

## 9. Là où Hikma est déjà plus structuré (aucune action nécessaire)

```text
Quran Progress                         Hikma
─────────────                          ─────
SRS par mot                            SRS par mot + maîtrise 8 compétences
                                       (form/meaning/audio/context/lemma/retention)
progression « jour après jour »        mastery + couverture « ≈ X % du Coran » (par FORME,
                                       pondérée, dénominateur 77 430) — plus rigoureux
« 125 mots = 50 % » (claim fréquence   couverture honnête calculée et bornée par le
par racine/lemme)                      curriculum (18,76 %), jamais sur-comptée
contexte du verset (1 traduction)      contexte du verset × 4 traducteurs alignés
« pourquoi » / traduction              feedback post-réponse : glose + explication de sens
                                       (44B) + décomposition MASAQ + contexte + audio
onboarding minimal                     onboarding V2 versionné, personnalisé, migration 0030
catalogue de mots                      curriculum éditorial sourate→verset→mot (verrouillé)
```

→ **Aucune action nécessaire** sur ces axes : Hikma possède une architecture
différente, plus structurée et plus honnête.

---

## 10. Décision finale

**`PHASE_45B_QURAN_PROGRESS_BENCHMARK_COMPLETE`**

- **1 fonctionnalité réellement retenue en P1 : le coach adaptatif** (gap réel,
  à valeur pédagogique forte, compatible avec l'architecture — présentation au-
  dessus du SRS existant, jamais un second moteur).
- **2 pistes P2** (écriture machine-gradée, regroupement de formes) et **1 P3**
  (apprendre à lire), toutes à valider séparément.
- **Tout le reste est soit déjà présent, soit rejeté pour préserver l'identité
  Hikma** (fréquence, gamification, grammaire/Médine, tafsir).
- **Différence méthodologique clé documentée :** la « couverture » Hikma est
  calculée **par forme exacte** (d'où 18,76 % au plafond du curriculum), tandis
  que le « 125 mots = 50 % » de Quran Progress agrège **par racine/lemme** — les
  deux chiffres ne sont **pas comparables** et Hikma ne doit **pas** adopter le
  claim de fréquence par famille sans décision explicite (le Modèle A strict et
  l'absence de fusion `لِلَّه ≠ الله` sont verrouillés en 37A/40A).

**STOP — aucune implémentation lancée automatiquement.** La Phase 45C éventuelle
(étude détaillée du coach adaptatif) fera l'objet d'un audit READ-ONLY distinct
et d'une validation explicite.
