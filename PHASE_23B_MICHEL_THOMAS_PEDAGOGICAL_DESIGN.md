# PHASE 23B — CONCEPTION DU MOTEUR PÉDAGOGIQUE HIKMA

Inspiré de la méthode Michel Thomas · Adapté à l'apprentissage du vocabulaire coranique

**STATUS : `PEDAGOGICAL_DESIGN_COMPLETE`** · Mode `READ_ONLY · DESIGN/AUDIT ONLY`

Garanties : `DATABASE_WRITES = 0` · `MIGRATIONS = 0` · `PRODUCTION_CODE_CHANGES = 0` · `STORAGE_WRITES = 0`

---

## 1. Principes pédagogiques identifiés (Michel Thomas, sans caricature)

La méthode ne se réduit ni à « écouter puis répéter » ni à « répéter beaucoup ».
Elle repose sur un enchaînement : **comprendre → construire → rappeler → produire →
réutiliser → consolider**, avec une production par l'apprenant dès le début.

| Principe | Classe | Mécanisme concret Hikma |
|---|---|---|
| Construction progressive (connu → inconnu) | A. principe général | chaque nouveau mot/forme est introduit dans un contexte composé d'éléments déjà appris |
| Compréhension avant mémorisation | A. principe général | l'étape Découverte explique le sens AVANT tout exercice noté |
| Rappel actif (retrouver avant de voir) | A. principe général | l'apprenant produit mentalement le sens puis le révèle (auto-gradation) ou le saisit |
| Production par l'apprenant | A. principe général | production du sens FR (arabe→sens) et production de l'arabe (sens→arabe) |
| Recombinaison / réutilisation | A. principe général | chaque nouvelle expression est construite à partir de segments connus |
| Correction immédiate, non punitive | A. principe général | feedback immédiat + relance guidée (le `FeedbackPanel` existant est la base) |
| Réduction de la charge cognitive | A. principe général | petites unités (2–5 nouveaux), une compétence à la fois |
| Réactivation espacée / consolidation | A. principe général | SRS par compétence + mixed review remélangeant ancien/nouveau |
| Transfert du mot isolé au contexte | A. principe général | réintroduction du mot dans son verset puis compréhension du verset entier |
| Gestion des erreurs par reconstruction | A. principe général | sur erreur, relancer avec un indice (lemme, translittération, segment) plutôt que montrer la réponse |
| Conversation libre / production orale spontanée | C. non pertinent | Hikma vise la COMPRÉHENSION d'un texte sacré figé, pas la production orale d'une langue vivante |
| Jeux de rôle / dialogues construits | C. non pertinent | non applicable au Coran |
| Prononciation/parler fluide | C. non pertinent | l'audio sert la reconnaissance et l'ancrage, pas l'entraînement à la parole |

---

## 2. Adaptation à Hikma — question centrale

**Réponse : OUI.** Partiellement dès aujourd'hui (reconnaissance FR de 8 formes sur
3 versets), intégralement une fois le design implémenté et les données FR/lemme
comblées. Concrètement, le design permet à un utilisateur de :

1. comprendre les mots d'une sourate — via Découverte + sens validé ;
2. mémoriser leur signification — via rappel actif et réactivation espacée ;
3. reconnaître les formes arabes — via RECOGNITION + CONTEXT ;
4. produire la traduction française — via ACTIVE RECALL (B) ;
5. retrouver l'arabe depuis le français — via REVERSE RECALL (C) ;
6. reconnaître le mot à l'écoute — via AUDIO RECOGNITION (D) ;
7. associer mot ↔ son ↔ sens ↔ contexte — via les familles D/E/H/I ;
8. relier un lemme à ses formes — via FORM→LEMMA / LEMMA→FORMS (F/G) ;
9. comprendre une sourate complète — via le parcours sourate + compréhension de verset.

Preuve : basée sur le code réel (`lib/exercises`, `lib/learning`, `lib/review`) et
les données réelles (26 formes Al-Fatiha, 9/26 FR, 21 295 word_audio, 0 racine, 9 lemmes).

---

## 3. Modèle d'apprentissage du mot (jamais une simple carte flash)

Modèle en **7 couches**, conservées distinctes :

```
ARABE (forme coranique réelle)
  → FORME (quran_words)
  → LEMME (regroupement)
  → SIGNIFICATION (FR validé, sinon repli EN marqué)
  → AUDIO (word_audio)
  → CONTEXTE (occurrence dans le verset)
  → PRODUCTION
```

**Invariants :**
- `FORME ≠ LEMME ≠ OCCURRENCE ≠ SIGNIFICATION` — jamais fusionnés dans le modèle ;
- la **forme coranique réelle est toujours affichée** (jamais remplacée par le lemme) ;
- le **lemme est un axe de regroupement** (réutiliser `رَبّ` pour comprendre `رَبِّ`),
  pas un substitut d'affichage ;
- la **signification FR validée** est la cible ; le **repli EN est marqué** et jamais
  présenté comme français.

Exemple : `رَبِّهِمْ` → forme coranique → lemme `رَبّ` → « Seigneur / maître » → audio
Muallim → contexte du verset → production de la signification.

---

## 4. Parcours d'une sourate complète — progression en 9 étapes

| # | Étape | Description | Ordre justifié par |
|---|---|---|---|
| 1 | DÉCOUVERTE | quelques nouveaux mots, sens expliqué | compréhension d'abord |
| 2 | COMPRÉHENSION | sens relié au connu (lemme/racine si dispo) | ancrage sémantique |
| 3 | CONSTRUCTION | le nouveau mot sert à comprendre une expression composée de connu | recombinaison |
| 4 | RAPPEL | retrouver le sens sans voir la réponse | active recall |
| 5 | PRODUCTION | FR→arabe et/ou arabe→FR selon le niveau | production |
| 6 | AUDIO | écouter puis identifier/retrouver le sens | association mot↔son |
| 7 | CONTEXTE | le mot dans son verset | transfert au contexte |
| 8 | CONSOLIDATION | mélange ancien + nouveau | réutilisation |
| 9 | MAÎTRISE | démonstration stable sur plusieurs dimensions | durabilité |

**Toutes les étapes ne sont pas présentes au premier contact** : 1–2–3–4 au premier
contact ; 5–6–7–8 aux contacts suivants (SRS) ; 9 en continu.

---

## 5. Modèle de maîtrise (multidimensionnel)

Le compteur de QCM actuel est insuffisant. Proposition :

- **Axe de statut** : `novice → introduced → learning → familiar → mastered`.
- **Dimensions de maîtrise** : `RECOGNITION`, `RECALL`, `PRODUCTION_FR_TO_AR`,
  `PRODUCTION_AR_TO_FR`, `AUDIO_RECOGNITION`, `LEMMA_AWARENESS`,
  `CONTEXTUAL_UNDERSTANDING`, `RETENTION`.

**Règle :** une forme n'est **pas** « maîtrisée » parce que l'utilisateur a réussi
plusieurs QCM. `mastered` exige des seuils minimaux sur **RECALL + PRODUCTION +
AUDIO_RECOGNITION + CONTEXTUAL_UNDERSTANDING** (pas seulement RECOGNITION), avec
stabilité temporelle (RETENTION).

- **Agrégation :** maîtrise globale = agrégation pondérée ; les dimensions cœur
  (RECALL, PRODUCTION, CONTEXTUAL) pèsent plus que RECOGNITION.
- **Rétrogradation ciblée :** un échec en production rétrograde la dimension
  correspondante sans effacer les autres.
- **Réutilisation :** `user_word_progress` conservé (statut + mastery agrégée) ; les
  dimensions sont stockées de façon additive, sans réécrire le modèle actuel.

---

## 6. Exercices proposés (11 familles)

### Disposition des 8 générateurs existants

| Générateur | Disposition | Rôle |
|---|---|---|
| `WORD_TO_TRANSLATION` | CONSERVER | A. RECOGNITION |
| `TRANSLATION_TO_WORD` | CONSERVER | C. REVERSE (avec indice) |
| `REVERSE_TRANSLATION` | CONSERVER | C. REVERSE (sans indice) |
| `MULTIPLE_CHOICE` | CONSERVER (dépriorisé) | translittération — faible valeur |
| `COMPLETE_WORD` | MODIFIER | base de J. RECONSTRUCTION |
| `WORD_RECOGNITION` | REMPLACER | auto-évaluation → rappel libre auto-gradé (B) |
| `AUDIO_TO_WORD` | ACTIVER (déjà écrit, retourne `null`) | D. AUDIO RECOGNITION |
| `WORD_TO_AUDIO` | ACTIVER | support prononciation/vérification |

### Nouvelles familles

| Famille | Entrée | Sortie attendue | Difficulté | Données | Critère de réussite |
|---|---|---|---|---|---|
| A RECOGNITION | arabe | choix du sens parmi 4 | 1 | sens FR (ou EN marqué) | choix correct |
| B ACTIVE RECALL | arabe | produire le sens (mental→révélation, ou saisie normalisée) | 2 | sens FR validé | rappel sans choix affiché |
| C REVERSE RECALL | sens FR | retrouver/produire l'arabe | 3 | sens FR + forme arabe | arabe correct |
| D AUDIO RECOGNITION | audio (texte masqué) | identifier le mot | 2 | word_audio (PRÊT) | mot identifié |
| E AUDIO → MEANING | audio | produire le sens | 3 | word_audio + sens FR | sens produit |
| F FORM → LEMMA | forme fléchie | identifier le lemme | 3 | lemma_id / mapping | lemme correct |
| G LEMMA → FORMS | lemme | reconnaître ses formes | 3 | lemmas + formes liées | formes correctes |
| H CONTEXT | mot dans le verset | présentation (non notée) | 1 | occurrences + ayahs | — |
| I CONTEXTUAL MEANING | mot surligné dans le verset | choisir/produire le sens DANS ce contexte | 3 | occurrence + sens FR + trad. verset | sens contextuel correct |
| J RECONSTRUCTION | segment du verset | reconstruire le sens du segment | 4 | occurrences ordonnées + sens FR | sens du segment reconstruit |
| K MIXED REVIEW | mélange de compétences | une compétence par item, mixées | variable | toutes | précision globale |

**Feedback** : immédiat, avec bonne réponse ; sur erreur, **relance guidée** (indice :
lemme, translittération, segment du verset) plutôt que simple affichage de la réponse.

**SRS** : toutes les familles notées (A–G, I, J, K) alimentent le SRS par compétence ;
H (contexte) est une présentation non notée.

---

## 7. Rôle de l'audio

L'audio Muallim (21 295) est prêt mais sans player. **Règles de conception** (pas de
code dans cette phase) :

- **jouer automatiquement** à la Découverte (1ʳᵉ rencontre) et au feedback après erreur ;
- **Replay** toujours disponible — l'écoute n'est ni une punition ni une obligation unique ;
- **demander d'écouter** quand l'exercice est AUDIO→WORD ou AUDIO→MEANING (texte masqué) ;
- **masquer le texte** uniquement dans les exercices audio (D/E), jamais pendant la découverte ;
- **afficher le texte** dès la réponse donnée (ancrage visuel après écoute) ;
- **audio→reconnaissance (D) avant audio→production (E)** : d'abord identifier, puis produire ;
- **interdire l'audio décoratif** : chaque lecture est liée à une tâche cognitive.

Contraintes respectées : **aucun import d'ayah audio**, **aucun changement Storage**,
**aucun code player dans cette phase**.

---

## 8. Architecture des leçons

Structure proposée (ajustée) :

```
LESSON INTRO
  → Known words + échauffement (recycle le connu)   [fusion de "Known words" et "Mixed review"]
  → New words (2–5)
  → Guided discovery
  → Construction
  → Active recall
  → Audio
  → Context
  → Production
  → Mastery check
```

**Ajustements justifiés :** l'échauffement du connu précède l'introduction du nouveau
(économie cognitive) ; la Construction est placée après la Découverte et avant le Rappel
(construire avant de mémoriser). Le premier contact s'arrête à Construction + Rappel
léger ; Audio/Contexte/Production/Mixed review sont réservés aux sessions suivantes.

---

## 9. Architecture SRS (3 options + recommandation)

**Audit :** `LeitnerScheduler` actuel = 1 intervalle unique par mot, pas de distinction
par compétence, pas d'historique, pas de difficulté.

- **OPTION A — adaptation minimale** : 1 intervalle/mot piloté par la compétence la plus
  faible (worst-skill) + historique simple. Léger, mais ne distingue toujours pas
  reconnaissance/production.
- **OPTION B — modèle intermédiaire** : état de révision **PAR COMPÉTENCE**
  (`review_items` + colonne `skill`, ou table additive), chaque compétence planifiée
  indépendamment (Leitner par skill). **Corrige le défaut central, additif, testable,
  évolue vers C.**
- **OPTION C — moteur complet** : WORD MASTERY ENGINE (maîtrise multidimensionnelle +
  SM-2/FSRS par skill + confidence + rétention + historique complet).

**Recommandation : OPTION B** comme prochaine étape d'implémentation (correctif minimal
du défaut central, chemin vers C).

---

## 10. Analyse Al-Fatiha (cas pilote, données réelles)

| Métrique | Valeur |
|---|---|
| Formes distinctes | 26 |
| Glose FR validée (forme) | 8/26 |
| Glose FR via lemme | +1 (يَوْمِ) |
| **Glose FR totale** | **9/26** |
| Sens EN | 26/26 |
| Audio | 26/26 |
| Lemme résolu | 9/26 |
| Racine disponible | 0/26 |
| Lemmes avec racine | 0/9 |

- **Formes couvertes FR (versets 1–3)** : بِسْمِ، ٱللَّهِ، ٱلرَّحْمَـٰنِ، ٱلرَّحِيمِ،
  ٱلْحَمْدُ، لِلَّهِ، رَبِّ، ٱلْعَـٰلَمِينَ (+ يَوْمِ via lemme).
- **Formes NON couvertes FR (versets 4–7, 17 formes)** : مَـٰلِكِ، ٱلدِّينِ، إِيَّاكَ،
  نَعْبُدُ، وَإِيَّاكَ، نَسْتَعِينُ، ٱهْدِنَا، ٱلصِّرَٰطَ، ٱلْمُسْتَقِيمَ، صِرَٰطَ،
  ٱلَّذِينَ، أَنْعَمْتَ، عَلَيْهِمْ، غَيْرِ، ٱلْمَغْضُوبِ، وَلَا، ٱلضَّآلِّينَ →
  **DATA_GAP** (glose FR + lemme).
- **Partage de lemme** : aucune paire de formes ne partage un lemme résolu dans Al-Fatiha
  (9 lemmes distincts pour 9 formes). La relation morphologique `رَبّ/رَبِّكَ` (exemple
  conceptuel) **n'est pas présente dans les données actuelles**.
- **Décision éditoriale requise** : 17 formes nécessitent une glose FR validée et un lemme.

**Simulation de parcours** : L1 Basmala (4 formes, FR OK) → L2 Louange (4, FR OK) →
L3 Miséricorde (2, déjà vus, consolidation) → L4 Mâlik/Jour/Jugement (3, DATA_GAP) →
L5 Verbes d'adoration (4, DATA_GAP) → L6 Guidance (3, DATA_GAP) → L7 Suite du verset 7
(8, DATA_GAP). Chaque leçon : découverte → construction → rappel → production → audio →
contexte → mixed review.

---

## 11. Données manquantes (classées)

| Niveau | Donnée manquante | Bloquant / nécessaire |
|---|---|---|
| **P0** | gloses FR validées pour les 17 formes non couvertes (1:4–1:7) | production/rappel FR et compréhension des versets 4–7 |
| **P0** | lemmes pour les 17 formes sans lemme (+ lemme/racine pour les 9 lemmes existants) | exercices FORM→LEMMA / LEMMA→FORMS / construction |
| **P1** | racines (جذر) pour formes/lemmes (actuellement 0) | généralisation par racine |
| **P2** | décomposition proclitique/enclitique (بِـ، وَ، ـهِمْ، ـكَ…) | construction morphologique fine |
| **P3** | ayah_audio (audio de verset) — NON requis, optionnel | écoute du verset complet |

---

## 12. Impact sur l'architecture existante

| Composant | Impact | Justification |
|---|---|---|
| curriculum | EXTEND | générateur de parcours par sourate (versets → occurrences → formes dédupliquées) |
| lessons (structure) | EXTEND | format de leçon multi-étapes |
| LessonPlayer | EXTEND | orchestrer étapes + rappel auto-gradé |
| exercise generators | EXTEND + 2 ACTIVER + 1 REMPLACER | activer AUDIO_TO_WORD/WORD_TO_AUDIO, remplacer WORD_RECOGNITION, ajouter B/E/F/G/I/J/K |
| resolver (language.ts) | **UNCHANGED** | précédence FORME > LEMME DIRECT > LEMME VIA MAPPING > EN conservée |
| word bank | EXTEND | ajouter lemme/racine/audio par entrée (champs dérivés) |
| progression (progress.ts) | EXTEND | statuts + dimensions (additif) |
| mastery (mastery.ts) | EXTEND | agrégation multidimensionnelle |
| ReviewEngine | EXTEND | review par compétence |
| LeitnerScheduler | EXTEND | planification par compétence (Option B) |
| audio (word_audio) | NEW (intégration) | player + URL signée — données prêtes, intégration manquante |
| quran_words / word_occurrences | **UNCHANGED** | donnée source intacte |
| lemma_translations / word_translations | **UNCHANGED** (lecture) | enrichissement éditorial seulement |
| word_lemma_mapping | **UNCHANGED** (lecture) | enrichissement éditorial seulement |
| word_audio | **UNCHANGED** (lecture) | déjà importé (21 295) |

---

## 13. Roadmap d'implémentation

| Phase | Nom | Contenu | Dépend |
|---|---|---|---|
| 23C | Données pédagogiques Al-Fatiha | gloses FR (17 formes) + lemmes/racines (P0/P1) | — |
| 23D | Modèle de mastery multidimensionnel | statuts + dimensions + agrégation (pur, testé) | — |
| 23E | Intégration audio | player word_audio + URL signée + activer AUDIO_TO_WORD/WORD_TO_AUDIO | — (word_audio prêt) |
| 23F | Moteur de rappel actif et production | familles B/C/E + validateur de saisie normalisée | 23C, 23D |
| 23G | Nouveau format de leçon | découverte→construction→rappel→audio→contexte→production→mixed review | 23E, 23F |
| 23H | SRS par compétence | Option B | 23D |
| 23I | Pilote Al-Fatiha complet | parcours 7 versets, 26 formes, bout en bout | 23C–23H |
| 23J | Validation pédagogique | test utilisateurs + mesure de rétention | 23I |

**Séquence optimisée :** l'audio (23E) peut être fait tôt (données déjà prêtes) ; le
rappel/production (23F) dépend des gloses FR (23C).

---

## 14. Risques et garde-fous

| Risque | Garde-fou |
|---|---|
| apprendre la traduction anglaise par défaut | repli EN toujours marqué, jamais présenté comme FR ; FR validé requis pour B/C/E |
| mémoriser une mauvaise glose | seules les gloses `is_validated=true` entrent en pédagogie |
| confondre forme et lemme | affichage distinct : la forme réelle prime, le lemme est une étiquette |
| confondre homographes | identité = `word_id` (occurrence exacte), jamais de matching `normalized_text` |
| traduction hors contexte | exercice CONTEXTUAL MEANING après le sens isolé ; distinction Phase 5 conservée |
| surcharge | 2–5 nouveaux max, une compétence à la fois |
| croire que reconnaissance = maîtrise | maîtrise exige production + contexte + audio |
| audio sans activité cognitive | chaque lecture liée à une tâche |
| trop de nouveaux mots | plafond strict + échauffement d'ancien en tête de session |

---

## 15. Décision recommandée

1. **Adopter le modèle de mot à 7 couches** (FORME ≠ LEMME ≠ OCCURRENCE ≠ SIGNIFICATION)
   et le **modèle de maîtrise à 8 dimensions** comme cible ;
2. **Démarrer la roadmap par 23C (données)** puis **23D (mastery)** et **23E (audio)** ;
3. **Conserver le resolver et les données source inchangés** ; tout est **additif** ;
4. **SRS : Option B** (révision par compétence) comme prochaine implémentation ;
5. **Validation pédagogique (23J)** obligatoire avant généralisation à d'autres sourates.

---

## Question centrale — réponse complète

> Comment passer de « je ne connais aucun mot » à « je comprends et mémorise le
> vocabulaire d'Al-Fatiha, reconnais les formes coraniques, retrouve le sens des mots,
> identifie les mots à l'écoute, produis certaines traductions, comprends les mots dans
> leur contexte, et conserve ces connaissances dans le temps » ?

**Concrètement et progressivement :**

1. **Découverte** (2–5 mots/leçon) : le sens est expliqué avant tout exercice, la forme
   réelle toujours affichée, l'audio joué une fois pour l'ancrage.
2. **Construction** : le nouveau mot est inséré dans une expression faite d'éléments
   déjà appris (recombinaison, pas de mémorisation brute).
3. **Rappel actif** : l'apprenant retrouve le sens sans choix affiché (auto-gradation ou
   saisie), puis révèle.
4. **Production** : français→arabe et arabe→français, dans les deux sens.
5. **Audio** : identifier le mot à l'écoute (D) puis produire son sens (E) — texte masqué.
6. **Contexte** : le mot est rencontré dans son verset, puis le sens **contextuel** est
   interrogé (I), enfin le sens global du verset est reconstruit (J).
7. **Consolidation** : mixed review remélange ancien/nouveau et toutes compétences.
8. **Maîtrise durable** : la progression par mot est suivie sur 8 dimensions, chacune
   planifiée par un SRS par compétence (Option B), avec rétrogradation ciblée.

**Conditions techniques (réelles) :** le moteur d'exercices, la progression, le SRS et
l'audio (`word_audio = 21 295`) sont **déjà en place ou prêts** ; il manque uniquement
(1) les gloses FR et lemmes des 17 formes restantes d'Al-Fatiha (P0), (2) le player audio
(23E), et (3) les nouveaux types d'exercices (23F). Le pilote Al-Fatiha (23I) est la
preuve de bout en bout attendue.

---

**STATUS FINAL : `PEDAGOGICAL_DESIGN_COMPLETE`** — arrêt obligatoire, aucune
implémentation, aucune écriture. Attente de l'approbation du propriétaire avant 23C.
