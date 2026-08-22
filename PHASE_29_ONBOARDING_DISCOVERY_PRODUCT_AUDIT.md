# PHASE 29 — Onboarding & Discovery Experience (Audit produit READ_ONLY)

**Décision finale : `B — AUDIT_COMPLETED_DESIGN_REQUIRED`**

**Statut : STRICTEMENT READ_ONLY** — `DATABASE_WRITES = 0`, `CODE_WRITES = 0`.
Aucune migration, aucun seed, aucun changement de grading/SRS/mastery/
progression/curriculum. Ce rapport est une proposition produit structurée,
prête pour une Phase 30 d'implémentation contrôlée après approbation humaine.

État de référence préservé : `FATIHAH_REFERENCE_LOCKED = TRUE` · quran_words
21 296 · word_occurrences 77 430 · ayahs 6 236 · translations 24 944 ·
lemmas 32 · word_translations 74 · lemma_translations 32 · word_lemma_mapping
184 · linguistic_occurrences 97 · linguistic_segments 170 · racines/schèmes 0
(ABSENT_DATA) · 539 tests PASS.

---

## A. État actuel (produit réel, audité dans le code et la base)

### A.1 Parcours réel tracé

```
LANDING (/)
  → CTA « Commencer avec Al-Fatiha » → /learn/basmala (anonyme possible)
  → CTA « Se connecter » → /login (sign-in / sign-up, email + mot de passe)
SIGNUP (authenticate → redirect /dashboard)
  → app/(app)/layout.tsx : user connecté SANS user_settings → redirect /onboarding
ONBOARDING (/onboarding)
  → 1 écran : « Comprends le Coran, mot par mot. » + bouton « Commencer avec Al-Fatiha »
    + objectif quotidien OPTIONNEL replié (mots/leçons · 5/10/20)
  → completeOnboarding (onboarded=true, objectif par défaut 5 mots/jour)
  → redirect /learn/basmala
DASHBOARD (/dashboard)
  → « Ton prochain pas » (reprendre/commencer la leçon)
  → Réviser · Ton rythme (objectif du jour) · Progression · Activité 30 j · Révisions 7 j
PREMIÈRE LEÇON (/learn/basmala)
  → Découverte (mot → arabe → translittération → audio → « Voir le sens » + badge)
  → Exercices (reconnaissance → rappel → audio → contexte)
  → Feedback après chaque réponse (correct/incorrect/ambigu)
  → Leçon terminée (progression persistée, session nettoyée)
FEEDBACK
  → CORRECT : Bonne réponse + audio + rappel court + « Comprendre ce mot » replié
  → INCORRECT : Ta réponse + Réponse attendue + explication ciblée + « Comprendre ce mot » ouvert
PROGRESSION
  → user_word_progress (mastery/status) + review_items (SRS) + activité quotidienne
```

### A.2 Réponses aux questions de l'audit onboarding

| Question | Réponse réelle |
|---|---|
| Existe-t-il un onboarding ? | **Oui** — `/onboarding`, 1 écran (Phase 24D/F6) |
| Écran de bienvenue ? | **Oui** — Mascot « Bienvenue ! » |
| Création de profil pédagogique ? | **Non** — seul l'objectif quotidien est capturé |
| Informations demandées ? | Objectif quotidien (mots/leçons · 5/10/20), optionnel |
| L'utilisateur peut-il commencer immédiatement ? | **Oui** — 1 clic (« Commencer avec Al-Fatiha ») |
| Premier écran après inscription ? | `/onboarding` (puis `/dashboard`) |
| Premier exercice ? | Leçon basmala (1:1), ordre reconnaissance → rappel |
| L'app explique-t-elle son objectif ? | Partiellement (landing + 1 ligne onboarding) |
| Choix de niveau ? | **Non** |
| Choix d'objectif ? | **Oui** (quotidien, mots/leçons) |
| Choix de fréquence / temps ? | **Non** |
| Sélection de sourates ? | **Non** (aucun sélecteur) |
| Personnalisation du parcours ? | **Non** |

### A.3 Navigation et surfaces

- `lib/navigation.ts` : NAV_ITEMS = Accueil (`/dashboard`) · Apprendre (`/learn`) · Réviser (`/review`) · Profil (`/profile`).
- Routes actives : `/`, `/login`, `/onboarding`, `/dashboard`, `/learn`, `/learn/[slug]`, `/learn/units/[slug]`, `/review`, `/profile`, `/mots/[id]`, `/admin`, `/design-system`.

---

## B. Audit onboarding

**L'onboarding actuel est déjà l'OPTION A (ultra-court)**, conforme à la consigne
« réduire le temps entre l'arrivée et le premier apprentissage ». Il est de bonne
qualité : une proposition claire, un CTA primaire, un réglage optionnel replié,
et un début immédiat sur la Basmala (mots déjà « connus » du récitateur).

**Ruptures UX identifiées :**

1. **Aucune découverte des sourates** — après onboarding, l'utilisateur est
   enfermé dans Al-Fatihah sans savoir que 14 autres parcours existent (voir C).
2. **La promesse pédagogique n'est pas verbalisée** — l'utilisateur ne comprend
   pas explicitement *pourquoi* mot par mot (répétition, SRS, contexte).
3. **Pas de profil pédagogique** — l'application ne sait pas si l'utilisateur lit
   l'arabe, ce qui conditionnerait l'affichage de la translittération et de l'audio.
4. **L'objectif est enfoui** — le réglage d'objectif est replié et sous-utilisé.

---

## C. Audit dashboard

Le dashboard est **déjà riche et cohérent** : action principale unique, révision,
rythme, progression, activité, révisions à venir. Points forts : hiérarchie
« un prochain pas », absence de vanity metrics agressives.

**Découverte structurante (vérifiée en base) :**

La base contient **15 parcours d'apprentissage et 90 leçons publiées**, mais
l'UI n'expose que **Al-Fatihah (8 leçons)** :

| Sourate | Parcours | Leçons | MASAQ |
|---|---|---|---|
| 1 — Al-Fatiha (visible) | quran-vocabulary | 8 | ✅ 29 occ / 56 seg |
| 93 — Ad-Duha | quran-surah-93 | 11 | ❌ |
| 94 — Ash-Sharh | quran-surah-94 | 8 | ❌ |
| 102 — At-Takathur | quran-surah-102 | 8 | ❌ |
| 103 — Al-'Asr | quran-surah-103 | 3 | ❌ |
| 104 — Al-Humazah | quran-surah-104 | 9 | ❌ |
| 105 — Al-Fil | quran-surah-105 | 5 | ❌ |
| 106 — Quraysh | quran-surah-106 | 4 | ❌ |
| 107 — Al-Ma'un | quran-surah-107 | 7 | ❌ |
| 108 — Al-Kawthar | quran-surah-108 | 3 | ✅ 10 occ / 21 seg |
| 109 — Al-Kafirun | quran-surah-109 | 6 | ❌ |
| 110 — An-Nasr | quran-surah-110 | 3 | ❌ |
| 112 — Al-Ikhlas | quran-surah-112 | 4 | ✅ 15 occ / 25 seg |
| 113 — Al-Falaq | quran-surah-113 | 5 | ✅ 23 occ / 33 seg |
| 114 — An-Nas | quran-surah-114 | 6 | ✅ 20 occ / 35 seg |

- `getCurriculum()` **sans filtre** est ancré sur `quran-vocabulary` (Al-Fatiha)
  → le dashboard, `/learn` et `/profile` ne montrent qu'Al-Fatiha.
- `listLearningPaths()` et `getLearningPathBySurah()` existent **mais ne sont
  utilisés par AUCUNE page UI** → les 14 autres parcours sont **invisibles**.
- 10 sourates (93, 94, 102–107, 109, 110) ont un curriculum + audio + gloses,
  **mais pas de couche MASAQ** (explication linguistique absente — absence honnête,
  pas un bug).

**Conclusion : la principale opportunité de « discovery » n'est pas de créer du
contenu, mais d'exposer ce qui existe déjà.**

---

## D. Aha Moment

Objectif : que l'utilisateur comprenne très vite
**« Je connais ce mot parce que je l'ai déjà rencontré dans le Coran. »**

Séquence cible (déjà en grande partie en place) :

```
mot arabe → réponse française → feedback → explication → exemple dans le Coran
→ audio → mémorisation (SRS)
```

Recommandations pour renforcer le « aha » :

1. **Première leçon = Basmala (inchangée)** — 4 mots déjà « su-côtés » du récitateur.
2. **Mettre le contexte de verset AVANT la première réponse** (l'utilisateur
   reconnaît « Au nom d'Allah, le Tout Miséricordieux… » et comprend qu'il sait déjà).
3. **Introduire l'audio après la bonne réponse** (renforce reconnaissance auditive).
4. **Montrer la progression dès la fin de la 1ʳᵉ leçon** (« 4 mots appris, tu peux
   déjà relire la Basmala »), pas avant.
5. **Retarder les fonctionnalités secondaires** (statistiques, révisions à venir)
   jusqu'à la 2ᵉ session.

---

## E. Options d'onboarding

| | A — ultra-court | B — pédagogique | C — personnalisé |
|---|---|---|---|
| Écrans | 1 | 2–3 | 4–5 |
| Infos | objectif (optionnel) | + « comment ça marche » (méthode) | + niveau arabe, objectif, temps/fréquence, sourates |
| Durée | ~10 s | ~30–45 s | ~1–2 min |
| Avantages | activation maximale | promesse comprise | parcours adapté |
| Risques | promesse floue, parcours générique | friction modérée | abandon si trop long |
| Impact activation | maximal | léger recul | recul réel |
| Impact pédagogique | faible | moyen | fort (si bien conçu) |

**Recommandation :** conserver **A comme chemin par défaut**, et proposer
**C en « étape optionnelle skippable »** (2–3 questions à forte utilité, jamais
obligatoires). Le contenu de B peut être intégré à la landing/onboarding par un
disclosure court, sans écran supplémentaire. **Ne pas imposer C.**

---

## F. Personnalisation — classification des données

| Donnée | Classification | Justification |
|---|---|---|
| Objectif quotidien (mots/leçons) | **ESSENTIEL** (déjà capturé) | rythme, déjà implémenté |
| Lit l'arabe ? | **ESSENTIEL** | conditionne translittération/audio/phonétique |
| Comprend l'arabe (niveau) | **UTILE** | ajuste le niveau d'aide |
| Objectif principal (comprendre les mots / les sourates) | **UTILE** | oriente le parcours (vocabulaire vs verset) |
| Sourate de départ | **UTILE** | remplace le défaut « Al-Fatiha obligatoire » |
| Temps disponible / fréquence | **OPTIONNEL** | déjà couvert par l'objectif quotidien |
| Sourates prioritaires | **OPTIONNEL** | utile après la découverte |
| Récite le Coran ? | **À NE PAS DEMANDER** | non actionnable pour un outil de vocabulaire |
| Niveau de grammaire arabe | **À NE PAS DEMANDER** | sur-ingénierie, non utilisé |

Règle : ne demander que ce qui **change réellement l'expérience**. Aujourd'hui,
seul « lit l'arabe ? » a un impact immédiat sur l'affichage (translittération,
audio, exercices audio).

---

## G. Analyse Quran Progress (recherche, sans copier)

Source : quranprogress.com (about) + recherche. Constats :
- App mobile 2016+, **4 000+ mots**, basée sur la **fréquence** (Dr AbdulAzeez
  Abdurraheem / Manuels de Médine).
- **Répétition espacée** + **coach virtuel** (adapte les révisions).
- **Exercices variés** (quiz, QCM, écriture, devinettes).
- **6 langues**, 500 K+ utilisateurs.

Idées fonctionnelles/pédagogiques retenues (à adapter, jamais copier) :

| Idée Quran Progress | Valeur | Pertinence Hikma | Difficulté | Dépendance données | Risque pédago | Recommandation |
|---|---|---|---|---|---|---|
| Vocabulaire par **fréquence** | forte | forte (Hikma est sourate/verset) | moyenne | fréquence dérivable des occurrences (77 430) | faible | **P1** |
| **Coach virtuel** (adaptation des révisions) | forte | moyenne | élevée | SRS existant | moyen (ne pas contourner SRS) | **P2** |
| Exercices variés | forte | **déjà couverte** (11 types) | — | — | — | **déjà fait** |
| Catalogue de vocabulaire | forte | partielle (Hikma = word-by-word 21 296 formes) | — | existant | faible | **P2** |
| Suivi de progression | forte | **déjà couvert** (dashboard) | — | — | — | **déjà fait** |

**Différence d'identité à préserver :** Hikma = apprentissage **actif** mot par
mot sur les **sourates réellement récitées** + explications linguistiques
pédagogiques. Ce n'est pas un « dictionnaire de fréquence » ni un jeu de points.

---

## H. Fonctionnalités proposées (issues de l'audit)

1. **Catalogue / sélecteur de sourates** — exposer les 14 parcours existants
   (90 leçons) aujourd'hui invisibles. *(le plus gros gain, 0 donnée à créer)*
2. **Profil pédagogique minimal** — « lit l'arabe ? » (+ éventuellement objectif)
   pour adapter translittération/audio.
3. **Onboarding optionnel skippable** — variante C-lite (2–3 questions).
4. **Renforcement du Aha Moment** — contexte de verset avant la 1ʳᵉ réponse.
5. **Exploration vocabulaire** — « mots les plus fréquents » / « mots d'une
   sourate » (lecture seule, sans racine/schème inventés).
6. **Couverture par sourate** — pourcentage de mots vus/appris d'une sourate.

---

## I. Priorisation P0 / P1 / P2

| Priorité | Fonctionnalité | Raison |
|---|---|---|
| **P0** | Catalogue/sélecteur de sourates (exposer les 14 parcours) | contenu déjà en base, gros gain, faible risque |
| **P1** | Profil pédagogique minimal (« lit l'arabe ? ») | personnalisation réelle, impact UX direct |
| **P1** | Aha Moment renforcé (contexte avant réponse) | activation + compréhension |
| **P2** | Onboarding optionnel skippable (C-lite) | utile mais pas bloquant |
| **P2** | Exploration vocabulaire par fréquence | inspiré Quran Progress, à cadrer |
| **P2** | Couverture par sourate | statistique pédagogique utile |
| **REJECT** | Streaks, leaderboards, points, badges | gamification excessive, hors identité |

---

## J. Architecture dashboard — 2 alternatives

### Alternative 1 — « Un prochain pas » (actuelle, recommandée en base)

```
ACCUEIL
├── Ton prochain pas (action unique : reprendre / commencer / réviser)
├── Réviser (compteur du jour)
├── Ton rythme (objectif)
├── Progression (parcours %)
└── Activité + révisions à venir
```
- Navigation 1 clic · charge cognitive faible · mobile OK · desktop OK.
- **Recommandée**, à compléter par un accès « Explorer les sourates ».

### Alternative 2 — « Hub de progression » (plus riche)

```
ACCUEIL
├── Continuer l'apprentissage
├── Révision du jour
├── Progression globale (mastery, mots maîtrisés)
├── Couverture par sourate
├── Explorer le vocabulaire
└── Découvrir les sourates
```
- Navigation 1–2 clics · plus riche · risque de surcharge statistique.
- **À n'adopter que progressivement**, une zone à la fois, sans retirer le
  « prochain pas » unique.

**Recommandation :** partir de l'Alternative 1 et y **ajouter une seule zone
« Découvrir les sourates »** (P0). Ne pas migrer vers l'Alternative 2 d'un bloc.

---

## K. Discovery experience

Hiérarchie proposée (post-onboarding) :

1. **Commencer** — la leçon suivante (toujours le CTA principal).
2. **Continuer** — reprendre une session en cours.
3. **Réviser** — les mots dus aujourd'hui.
4. **Découvrir une sourate** — le sélecteur de sourates (P0).
5. **Explorer un mot** — la fiche mot (déjà existante, `/mots/[id]`).
6. **Voir ma progression** — le dashboard (déjà existant).

Le sélecteur de sourates doit afficher **uniquement des données réelles**
(leçons publiées, progression réelle) et **indiquer honnêtement** l'absence de
couche MASAQ pour les 10 sourates sans données linguistiques (pas d'explication
inventée).

---

## L. Progression (audit, sans modification)

Déjà disponible :
- **Globale** : `getLearningContext` (wordsSeen, wordsMastered, avgMastery,
  lessonsCompleted/totalLessons, reviewDueCount).
- **Par leçon** : `lessonStatuses` (COMPLETED / IN_PROGRESS / AVAILABLE / LOCKED).
- **Par mot** : `user_word_progress` (status new/learning/familiar/mastered +
  mastery 0–100).
- **SRS** : `review_items` (learning/review/relearning + interval_days).
- **Compétences** : `user_word_skill_progress` (8 compétences + retention).
- **Objectif** : `user_settings.daily_goal_*`.
- **Streak** : absent (souhaitable — éviter la vanity metric).

**Présentation recommandée (sans changer l'interne) :** exposer « mots maîtrisés »,
« à réviser », « progression du parcours » et « couverture par sourate » (P2),
toujours reliés à un objectif pédagogique réel.

---

## M. Statistiques — valeur pédagogique vs distraction

| Statistique | Valeur pédagogique | Risque distraction | Décision |
|---|---|---|---|
| Mots maîtrisés | forte | faible | **garder** (déjà) |
| Mots à réviser | forte | faible | **garder** (déjà) |
| Progression du parcours | forte | faible | **garder** (déjà) |
| Objectif du jour | moyenne | faible | **garder** (déjà) |
| Couverture par sourate | forte | faible | **P2** |
| Précision (% correct) | moyenne | moyen (décourageant) | **P2, prudent** |
| Temps d'étude | faible | moyen | **REJECT** |
| Streak | faible | fort (vanity) | **REJECT** |
| Classements | nulle | fort | **REJECT** |

---

## N. Audio (analyse, sans modification du système)

Le système audio (Muʿallim, 21 295 formes) est complet. Recommandations d'usage :
- **Jouer après la bonne réponse** (récompense + renforcement) — déjà en place.
- **Replay à la demande** dans la découverte et la fiche mot — déjà en place.
- **Après une erreur**, proposer l'audio en appui (pas automatiquement) pour ne
  pas transformer l'erreur en mémorisation passive.
- **Dans l'exploration vocabulaire** (P2) : audio en lecture seule.
- **Éviter la répétition inutile** : un seul audio actif à la fois (déjà géré
  par l'AudioCoordinator).

---

## O. Explications linguistiques (Phase 24I/24J conservée)

L'explication reste : facultative après bonne réponse, ouverte après erreur,
pédagogique, concise, non répétitive, honnête. **Aucune modification du moteur.**

Réutilisations possibles (sans changer le moteur) :
- **Fiche mot** (`/mots/[id]`) : afficher la décomposition/identité MASAQ quand
  disponible (5 sourates), sinon ne rien afficher (pas d'invention).
- **Exploration vocabulaire** : afficher l'explication en lecture seule.
- **Révision** : déjà branchée sur la fiche mot.

Rappel : 10 sourates n'ont **pas** de couche MASAQ → aucune explication inventée.

---

## P. Roadmap conceptuelle

| Phase | Objectif | Dépendances | Valeur | Risques | Priorité |
|---|---|---|---|---|---|
| A — Onboarding | profil minimal + variante C-lite skippable | user_settings existant | activation + personnalisation | friction si imposé | **P1** |
| B — Dashboard/Discovery | exposer les 14 sourates + « Explorer les sourates » | listLearningPaths (déjà) | fort (contenu existant visible) | surcharge UX | **P0** |
| C — Progression | couverture par sourate | données existantes | compréhension | vanity si mal présentée | **P2** |
| D — Exploration vocabulaire | mots fréquents / par sourate | occurrences (déjà) | découverte | jamais inventer racines | **P2** |
| E — Inspiré Quran Progress | fréquence + (évent.) coach | SRS existant | rétention | ne pas contourner SRS | **P2** |
| F — Linguistique future | racines/schèmes (source à auditer) | source + licence | profondeur | AVAILABLE ≠ INFERABLE | hors scope |

---

## Q. Fonctionnalités à éviter (prématurées)

- Racines **inventées** / schèmes **déduits sans source** (ABSENT_DATA).
- Nouvelles sources linguistiques **non auditées** (QAMAR, Quranic Corpus, Qabas…).
- Modification du **grading / SRS / mastery**.
- Curriculum **automatique sans audit**.
- **Gamification excessive** (streaks, points, badges, classements).
- Statistiques **inutiles** (temps, précision brute, vanity metrics).
- **Duplication** de données MASAQ.

---

## R. Risques

1. **Surcharge du dashboard** si on ajoute trop de zones d'un coup → avancer par
   incréments, garder « un prochain pas ».
2. **Onboarding trop long** → abandon ; conserver le chemin ultra-court par défaut.
3. **Exposer 10 sourates sans MASAQ** → attente d'explication déçue ; étiqueter
   honnêtement l'absence (déjà le comportement « absence honnête »).
4. **Gamification** → dérive hors de l'identité pédagogique ; la bloquer.
5. **Personnalisation sans effet réel** → ne demander que ce qui change l'UX.

---

## S. Recommandation finale

1. **P0 — Phase 30** : exposer les **14 parcours de sourates existants** dans un
   sélecteur/catalogue (données déjà en base, aucune migration). C'est le gain
   de découverte le plus important et le moins risqué.
2. **P1** : ajouter le **profil pédagogique minimal** (« lit l'arabe ? ») et le
   **Aha Moment renforcé** (contexte avant la 1ʳᵉ réponse).
3. **P2** : exploration vocabulaire par fréquence + couverture par sourate.
4. Conserver l'onboarding ultra-court, l'Alternative 1 de dashboard, et ne jamais
   toucher au grading/SRS/mastery.

**Toute implémentation en Phase 30 commencera par un AUDIT/PLAN READ_ONLY ciblé
sur la fonctionnalité retenue, puis approbation humaine, puis implémentation
contrôlée (tests + navigateur + non-régression).**

---

## PROMPT PHASE SUIVANTE (copiable)

```
PHASE 30 — DÉCOUVERTE DES SOURATES : PLAN READ_ONLY PUIS IMPLÉMENTATION CONTRÔLÉE

CONTEXTE
Phase 29 (audit produit READ_ONLY) terminée. Découverte structurante : la base
contient 15 parcours (90 leçons publiées) mais l'UI n'expose qu'Al-Fatihah
(quran-vocabulary, 8 leçons). getCurriculum() sans filtre est ancré sur
quran-vocabulary ; listLearningPaths() et getLearningPathBySurah() existent mais
ne sont utilisés par aucune page UI. 14 parcours de sourates sont invisibles :
93/94/102/103/104/105/106/107/108/109/110/112/113/114. 5 sourates ont MASAQ
(1/108/112/113/114) ; 10 n'en ont pas (absence honnête, pas un bug).

FONCTIONNALITÉ RETENUE (P0)
Exposer les 14 parcours de sourates existants dans l'UI (sélecteur/catalogue de
sourates), SANS créer de contenu ni de donnée. Aucune migration attendue.

OBJECTIF (PLAN READ_ONLY d'abord)
1. AUDIT READ_ONLY ciblé :
   - relire listLearningPaths / getLearningPathBySurah / getLearningContext ;
   - lister les parcours publiés + leçons + mots + audio + gloses FR réellement
     disponibles par sourate (NE PAS supposer : vérifier en base) ;
   - déterminer l'entrée UI minimale (ex. zone « Découvrir les sourates » sur
     /dashboard et /learn, ou sélecteur de sourate dans /learn) ;
   - définir le comportement pour les 10 sourates sans MASAQ (aucune explication
     inventée ; étiquette honnête).
2. DESIGN puis APPROBATION HUMAINE avant toute écriture.
3. IMPLÉMENTATION contrôlée, puis tests + validation navigateur + non-régression.

CONTRAINTES ABSOLUES
- FATIHAH_REFERENCE_LOCKED = TRUE (ne pas ré-importer/re-modifier Al-Fatihah).
- Aucun changement grading/SRS/mastery/progression/scoring/curriculum.
- Aucune nouvelle source linguistique, aucune racine/schème inventé.
- AVAILABLE ≠ INFERABLE : n'afficher que les données réellement présentes.
- Ne pas transformer le dashboard en hub de statistiques : conserver le
  « prochain pas » unique.

DÉCISION FINALE ATTENDUE
A — SOURAH_DISCOVERY_IMPLEMENTED
B — PLAN_READY_APPROVAL_REQUIRED
C — BLOCKER_DETECTED

LIVRABLES
PHASE_30_SOURAH_DISCOVERY.md
tmp/phase30-surah-discovery.json

Toujours terminer par le prompt de la phase suivante (Phase 31).
```
