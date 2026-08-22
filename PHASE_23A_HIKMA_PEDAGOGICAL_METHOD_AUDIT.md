# PHASE 23A — AUDIT PÉDAGOGIQUE HIKMA

Michel Thomas × Active Recall × Spaced Repetition × Audio × Apprentissage d'une sourate

**STATUS : `AUDIT_COMPLETE`** · Mode `READ_ONLY`

Garanties : `DATABASE_WRITES = 0` · `MIGRATIONS = 0` · `CODE_PRODUCTION_CHANGES = 0` · `STORAGE_WRITES = 0`

---

## A. EXECUTIVE SUMMARY

Hikma possède un **moteur pédagogique minimal mais réel et câblé de bout en bout** :
leçons → découverte → exercices → feedback → progression → répétition espacée.
Le pipeline (génération → validation → score → progression → maîtrise → SRS) est
pur, testé (242 tests), et persisté via Server Actions sur `user_word_progress`
et `review_items`.

Mais ce moteur est aujourd'hui un moteur de **RECONNAISSANCE uniquement** :

- les **6 types d'exercices actifs sont tous des QCM** (choix parmi 4 options), plus
  une auto-évaluation non notée ; **aucun exercice de production, aucun rappel libre** ;
- l'**audio Muallim est importé** (21 295 formes, 100 % de couverture) mais **aucun
  composant de lecture n'existe** — le pont `word_audio → player → learning surface`
  n'a pas été construit ; `ayah_audio = 0` ;
- le **curriculum est une démo** : 3 leçons couvrant uniquement Al-Fatiha **1:1–1:3**
  (8 formes distinctes), pas une sourate complète ;
- les **gloses françaises validées couvrent 8 mots** (forme) + **18 lemmes** : pour
  Al-Fatiha, **9/26 formes** ont un français validé, les **17 autres replient sur
  l'anglais** de Quran.com.

**Réponse à la question centrale (Étape 19) : NON.** Aujourd'hui, un nouvel
utilisateur ne peut pas être amené progressivement à maîtriser Al-Fatiha. Il peut
apprendre à *reconnaître* 8 formes de 3 versets (en français), sans audio jouable,
sans production, et les versets 1:4–1:7 (18 formes) sont hors curriculum et sans
glose française. Les briques manquantes sont précisées en sections L et P.

---

## B. CURRENT PEDAGOGICAL ENGINE (code réel)

| Module | Rôle |
|---|---|
| `lib/learning/curriculum.ts` | arbre path → units → lessons, validation |
| `lib/learning/lesson.ts` | `buildWordBank`, `buildLessonPlan`, `DEFAULT_LESSON_EXERCISE_TYPES` (6 types) |
| `lib/learning/language.ts` | langue pédagogique `fr`, repli EN marqué (`isFallback`) |
| `lib/exercises/engine.ts` | `generateExercise`, `generateLessonExercises`, `validateAnswer`, `scoreAnswer` (0/1) |
| `lib/exercises/generators/*` | 8 générateurs (6 actifs, 2 audio = `null`) |
| `lib/learning/progress.ts` | `applyAnswer`/`nextStatus` (seuils corrects + précision + intervalle) |
| `lib/learning/mastery.ts` | `status` → `MasteryLevel` 0/25/50/75/100 |
| `lib/review/scheduler.ts` | `LeitnerScheduler` (intervalle double ou 1 jour, graduation 7 j) |
| `lib/review/engine.ts` | `getDueItems`, `recordAnswer` |
| `lib/learning/session.ts` | `replayWordResults`, `computeLessonStatuses` |
| `lib/learning/actions.ts` | persistance Server Actions (progression + SRS + activité) |
| `lib/learning/queries.ts` | lectures Supabase (curriculum, glosses FR, audio count, contexte, review due) |
| `components/learn/lesson-player.tsx` | boucle UI découverte → exercice → feedback → persistance |
| `components/learn/review-player.tsx` | boucle UI révision (MCQ translittération ou auto-évaluation) |

**Flux de données réellement tracés :**

```
DB (lessons/lesson_words/quran_words/word_translations/lemma_translations)
  → buildWordBank (résolution FR→EN) → generateLessonExercises
  → LessonPlayer → réponse → validateAnswer (moteur)
  → appendAttempt → submitLessonResults → replayWordResults
      (ReviewEngine.LeitnerScheduler + applyAnswer)
  → upsert user_word_progress + review_items
```

```
word_audio → getWordAudioCount (badge « audio indisponible »)
  — AUCUN flux word_audio → player (absent)
```

---

## C. CURRENT LEARNING FLOW (pour un mot, code réel)

| Question | Réponse |
|---|---|
| 1. Première présentation | Étape « Découverte » : carte arabe + translittération + sens (+ badge FR validé / repli anglais) |
| 2. Traduction affichée immédiatement ? | **Oui**, sans question |
| 3. Réfléchir avant de voir la réponse ? | Non pendant la Découverte ; oui pendant les exercices (l'option correcte est masquée mais listée parmi 4) |
| 4. Peut-il entendre l'audio ? | **Non** (aucun lecteur) |
| 5. Doit-il reconnaître le mot ? | **Oui** (QCM) |
| 6. Doit-il produire sa signification ? | **Non** |
| 7. Produire l'arabe à partir du français ? | **Non** (choix parmi options) |
| 8. Le système sait-il s'il connaît ? | Partiel : 4 statuts + mastery 0–100 issus d'un même compteur correct/incorrect |
| 9. Une erreur modifie-t-elle la maîtrise ? | **Oui** (compteur incorrect, `mastered`→`familiar`) |
| 10. Le mot revient-il ? | **Oui** via `review_items.next_review_at` |
| 11. À quel moment ? | Quand `next_review_at <= now` (page `/review`, dashboard) |
| 12. Selon quelle logique ? | Scheduler Leitner (doublement / reset à 1 jour) |
| 13. Le contexte coranique revient-il ? | Partiel : fiche mot = toutes occurrences ; leçon = « verset étudié » (co-occurrence ≥ 2 mots) |
| 14. Le lemme est-il exploité ? | Minimal : repli de glose ; **9/26 formes d'Al-Fatiha** ont un lemme résolu |
| 15. Formes fléchies reliées ? | **Non** (aucune surface pédagogique) |
| 16. Audio pédagogique ou technique ? | **Technique seulement** (importé, non jouable) |

---

## D. ACTIVE RECALL AUDIT

| Type d'exercice | Catégorie | Mécanisme |
|---|---|---|
| `WORD_TO_TRANSLATION` | RECOGNITION | arabe → choisir le sens parmi 4 |
| `TRANSLATION_TO_WORD` | RECOGNITION | sens + indice translittération → choisir l'arabe |
| `REVERSE_TRANSLATION` | RECOGNITION | sens seul → choisir l'arabe (le plus proche d'un rappel, mais reste un choix) |
| `MULTIPLE_CHOICE` | RECOGNITION | arabe → choisir la translittération |
| `COMPLETE_WORD` | RECONSTRUCTION (faible, cuée) | sens tronqué → choisir le complément |
| `WORD_RECOGNITION` | SELF_ASSESSMENT | « Oui / Pas encore », non notée, hors progression |
| `AUDIO_TO_WORD` | LISTENING (prévu, **inactif**) | générateur retourne `null` |
| `WORD_TO_AUDIO` | LISTENING (prévu, **inactif**) | générateur retourne `null` |

**Proportions réelles :** RECOGNITION 6/6 · PRODUCTION 0/6 · FREE_RECALL 0/6 ·
LISTENING 0/6 · RECONSTRUCTION 1/6 (cuée).

**Question centrale :** Hikma demande de **choisir** la bonne réponse parmi 4 options
(reconnaissance cuée). Il ne demande **jamais** de récupérer librement l'information
(pas de saisie du sens, pas de production de l'arabe, pas de rappel sans choix affiché).
En révision, l'exercice est `MULTIPLE_CHOICE` (translittération) ou l'auto-évaluation.

---

## E. AUDIO PEDAGOGICAL AUDIT

**Données :** `word_audio = 21 295` (une ligne par forme, récitation WBW Muallim HF),
`ayah_audio = 0`. Storage privé `word-audio` ≈ 142 Mo.

**UI :** aucun `<audio>`, aucune URL signée, aucun bouton de lecture. `getWordAudioCount`
sert uniquement à afficher/masquer le badge « Exercices audio : indisponibles ».

| Usage | Bénéfice | Risque | Moment optimal | Difficulté | Dépendance |
|---|---|---|---|---|---|
| 1ʳᵉ présentation | ancrage phonologique | surcharge si systématique | Découverte | faible | URL signée |
| rappel / erreur | renforcement post-erreur | aucun | feedback | faible | URL signée |
| fiche mot | réécoute | aucun | en-tête | faible | URL signée |
| écoute avant réponse | oreille (décodage) | réduit le rappel si sens affiché | AUDIO_TO_WORD sans texte | moyenne | word_audio |
| écoute après réponse | consolidation | aucun | feedback | faible | URL signée |
| audio → mot | rappel auditif | homophones rares | après découverte | moyenne (générateur déjà écrit) | word_audio |
| mot → audio | vérifier prononciation | faible | après réponse | moyenne (générateur déjà écrit) | word_audio |
| contexte verset | compréhension globale | aucun | après mots du verset | **bloquante** | **ayah_audio = 0** |

**Conclusion :** l'infrastructure `word_audio` est PRÊTE (100 % des formes) mais
**inerte**. `AUDIO_TO_WORD`/`WORD_TO_AUDIO` ont leur générateur écrit et retournent
`null` (désactivés de fait). L'audio de verset (`ayah_audio`) est absent.

---

## F. SPACED REPETITION AUDIT

- **Algorithme :** Leitner simplifié (`LeitnerScheduler`) — correct : intervalle double
  (1→2→4→8→16…) ; incorrect : retour à 1 jour ; statut `review` à intervalle ≥ 7 j ;
  erreur post-graduation → `relearning`. **Ce n'est pas SM-2/FSRS** (reconnu dans le code).
- **Données stockées :** `review_items(status, interval_days, last_review_at, next_review_at)`
  + `user_word_progress(status, mastery, correct_count, incorrect_count)`.
- **Historique des réponses :** **non conservé** (compteurs agrégés uniquement).
- **Difficulté par mot / ease factor :** absents.
- **Peut-il faire « nouveau → apprentissage → rappel → oubli → réactivation → consolidation » ?**
  Partiellement : l'oubli est modélisé grossièrement (erreur → intervalle 1 j ;
  `mastered`→`familiar`), mais sans facteur de difficulté, sans historique temporel
  complet, sans métrique de rétention.

---

## G. WORD MASTERY AUDIT

Structure existante : `new → learning → familiar → mastered`, mastery `0/25/50/75/100`.
Règles (code) : `familiar` ≥ 3 corrects + précision ≥ 0.5 ; `mastered` ≥ 8 corrects +
précision ≥ 0.8 + intervalle ≥ 14 j ; erreur à `mastered` → rétrograde `familiar`.

**Ce que ça mesure :** une seule dimension — nombre de bonnes réponses à des **QCM de
reconnaissance** + intervalle. **Ne distingue pas** : reconnaissance vs rappel libre vs
production vs compréhension contextuelle vs reconnaissance auditive.

La structure à 7 niveaux (inconnu/vu/reconnu/compris/rappelé/produit/reconnu-en-contexte/
maîtrisé) **N'EXISTE PAS**. L'équivalent est un continuum linéaire piloté par le compteur
de QCM corrects. Le manque est documenté, pas implémenté.

---

## H. SURAH LEARNING SIMULATION (conceptuelle, read-only)

Pipeline cible : sourate → versets → occurrences → formes → lemmes → significations →
audio → rappel actif → réutilisation → compréhension du verset → révision → maîtrise.

- **Existe :** sourate/versets/occurrences (données complètes), formes + sens EN
  (21 296), audio word_audio (21 295), review Leitner.
- **Manque :** glosses FR (8 mots/18 lemmes seulement), audio jouable, rappel
  libre/production, réintroduction structurée, exercice de compréhension de verset,
  agrégat « sourate ».
- **Simulation J1/J2/J3/J7/J14/J30 :** conceptuellement simulable, mais **aucune
  construction existante** ne produit ce séquençage (pas de dosage, pas de « jour »,
  pas de réintroduction de contexte).

---

## I. AL-FATIHA CASE STUDY (données réelles)

| Métrique | Valeur |
|---|---|
| Versets | 7 |
| Tokens (occurrences) | 29 |
| Formes distinctes | 26 |
| Lemmes distincts résolus | 9 |
| Formes répétées | 3 |
| Glose FR validée (forme) | **8/26** |
| Glose FR (forme ou lemme) | **9/26** |
| Sens EN disponible | 26/26 |
| Audio disponible | 26/26 |
| Lemme résolu | 9/26 |

- **Curriculum réel :** 3 leçons — Basmala (4 mots), Al-Hamd (4 mots), Ar-Rahman
  (2 mots) = 10 sélections, **8 formes distinctes**, versets **1:1–1:3** uniquement.
- **Écart :** les versets **1:4–1:7** (18 formes, dont tous les verbes
  إِيَّاكَ نَعْبُدُ نَسْتَعِينُ ٱهْدِنَا أَنْعَمْتَ…) sont **absents du curriculum**
  et **sans glose française validée** (repli anglais).
- **Verdict :** Al-Fatiha complète ne peut pas être enseignée aujourd'hui. Les
  3 premiers versets peuvent l'être en reconnaissance FR (8/8 formes couvertes),
  sans audio jouable ni production.

---

## J. MICHEL THOMAS PRINCIPLES — TRANSFERABILITY

| Principe | Statut Hikma | Note |
|---|---|---|
| A Compréhension avant mémorisation | PARTIEL | Découverte affiche le sens, mais repli anglais possible |
| B Active Recall | PARTIEL | QCM = rappel cué, pas de rappel libre |
| C Production active | **ABSENT** | aucune saisie/prononciation |
| D Petites unités | PRÉSENT | leçons 2–4 mots, séquence verrouillée |
| E Réutilisation constante | PARTIEL | distracteurs intra-leçon + review ; pas de réintroduction inter-leçons |
| F Généralisation | **ABSENT** | racines/motifs non enseignés ; 22 lemmes non exploités |
| G Correction immédiate | PRÉSENT | `FeedbackPanel` (bonne réponse + encouragement) |
| H Réactivation espacée | PRÉSENT (basique) | Leitner |
| I Réintroduction nouveaux contextes | PARTIEL | fiche mot = occurrences ; contexte passif |
| J Reconstruction vs reconnaissance | **ABSENT** | seul `COMPLETE_WORD` est une complétion cuée |
| K Audio comme outil actif | **ABSENT** | importé mais non jouable |
| L Progression mot→…→sourate | PARTIEL | mot→sens existe ; lemme/construction/sourate manquants |

**Mise en garde :** Michel Thomas vise des langues modernes **parlées** (production
orale immédiate). Hikma vise la **compréhension** du Coran : la production orale
libre n'est pas un objectif équivalent. Les principes réellement transférables sont
compréhension d'abord, rappel actif progressif, petites unités, réutilisation,
réactivation espacée, correction immédiate — **pas** la conversation.

---

## K. CURRENT CAPABILITIES

- présenter un mot (arabe + translittération + sens) avant l'exercice ;
- générer 6 types d'exercices de reconnaissance (QCM) par mot ;
- feedback immédiat correct/incorrect avec bonne réponse ;
- progression 4 statuts + mastery 0–100 par mot ;
- SRS Leitner (due / next_review_at / dashboard / révision) ;
- contexte de verset (arabe + Hamidullah FR) si ≥ 2 mots co-occurrents ;
- fiche mot avec toutes les occurrences + traduction FR du verset ;
- verrouillage séquentiel des leçons ;
- objectif quotidien + historique 30 jours + révisions à venir ;
- données complètes sous-jacentes (occurrences, sens EN, audio word_audio).

---

## L. MISSING CAPABILITIES

1. aucun exercice de **PRODUCTION** (saisir le sens FR, saisir/prononcer l'arabe) ;
2. aucun **RAPPEL LIBRE** (la réponse n'est jamais produite sans choix affiché) ;
3. aucun exercice d'**ÉCOUTE** (audio importé non jouable ; `ayah_audio = 0`) ;
4. aucun parcours **SOURATE COMPLÈTE** (curriculum = 3 versets) ;
5. aucune liaison pédagogique **FORME ↔ LEMME ↔ RACINE** ;
6. aucune mesure de maîtrise **par dimension** (reconnaissance/production/contexte) ;
7. aucun **historique détaillé** des réponses ;
8. aucune **réintroduction structurée** des mots en nouveaux contextes ;
9. aucun exercice de **compréhension de verset** (contexte affiché, jamais interrogé).

---

## M. DATA READINESS

| Donnée | État |
|---|---|
| `quran_words` (21 296, sens EN 100 %) | READY |
| `word_occurrences` (77 430) | READY |
| `ayahs`/`surahs`/`translations` FR verset (Hamidullah) | READY |
| `word_audio` (21 295) | READY en données / **MISSING en intégration** (pas de player) |
| `ayah_audio` | **MISSING** (0) |
| `lemmas` (22) | PARTIALLY_READY |
| `quran_words.lemma_id` (135/21 296) | PARTIALLY_READY |
| `word_lemma_mapping` (171 safe) | PARTIALLY_READY |
| `word_translations` FR validé (8) | PARTIALLY_READY |
| `lemma_translations` FR validé (18) | PARTIALLY_READY |
| `lessons`/curriculum (3 leçons, 1 unité) | PARTIALLY_READY (démo) |
| `user_word_progress`/`review_items` | READY (se remplissent à l'usage) |

---

## N. UX ANALYSIS

**Question :** Hikma donne-t-il l'impression d'étudier une liste de vocabulaire ou
d'apprendre à comprendre le Coran ?

**Verdict : aujourd'hui, liste de vocabulaire (QCM) avec habillage coranique.**

- Vers « liste de vocabulaire » : 6 QCM de reconnaissance par mot, mots présentés
  isolément avec sens affiché d'emblée, révision = QCM translittération, aucun audio,
  aucune progression vers le verset.
- Vers « comprendre le Coran » : étape Découverte contextualisée, verset étudié +
  traduction FR, fiche mot avec toutes les occurrences, parcours thématique Al-Fatiha.

---

## O. PERFORMANCE ANALYSIS (risques identifiés, non optimisés)

- **N+1 glosses** : ÉVITÉ (lectures batch `.in()` pour word/lemma translations).
- **N+1 review au rendu** : PARTIEL (`getDueReviewItems` en batch, mais
  `getUpcomingReviewCounts` fait des lectures dérivées).
- **Exercices par leçon** : linéaire (mots × 6) ; grandira avec la taille des leçons,
  sans pagination d'exercices.
- **Audio** : à venir — 21 295 objets + URL signées à générer ; prévoir signature à la
  volée + cache.
- **Grandes sourates** : à venir — Al-Baqara (286 versets) = milliers de formes.
- **Historique volumineux** : limité aujourd'hui (journaux insert-only) ; un historique
  par réponse ajouterait du volume.

---

## P. P0 / P1 / P2 / P3 PRIORITIES

**P0 — bloque l'apprentissage**
1. Aucune leçon ne couvre une sourate complète (preuve : `seed-curriculum.ts`, 3 versets).
2. Audio importé non jouable (preuve : 0 composant de lecture, badge seulement).
3. Aucun rappel libre ni production (preuve : 6/6 générateurs = options).

**P1 — impact pédagogique majeur**
4. Gloses FR : 8 mots / 18 lemmes (repli EN sur ~2/3 d'Al-Fatiha).
5. Pas de liaison forme ↔ lemme ↔ racine (22 lemmes, non exploités).

**P2 — amélioration importante**
6. Maîtrise mono-dimensionnelle (compteur de QCM).
7. SRS Leitner sans facteur de difficulté ni historique.
8. Pas d'exercice de compréhension de verset.

**P3 — amélioration secondaire**
9. Réintroduction structurée des mots en nouveaux contextes.
10. `ayah_audio` (audio de verset) absent.

---

## Q. FUTURE ARCHITECTURE PROPOSAL (conceptuelle, non implémentée)

**WORD MASTERY ENGINE** — étendre le modèle existant, **sans duplication** :
`user_word_progress` + `review_items` conservés, la chaîne
validate→score→progress→mastery→review étendue (pas réécrite).

Dimensions proposées (non imposées) : `exposure`, `recognition`, `recall`,
`production`, `contextual_understanding`, `audio_recognition`, `confidence`,
`mastery`, `retention`, `review_schedule`.

Principes :
- chaque type d'exercice alimente **sa** dimension (QCM→recognition, saisie→recall/
  production, écoute→audio_recognition, contexte→contextual_understanding) ;
- `mastery` = agrégation des dimensions ; `confidence` = stabilité dans le temps ;
- `review_schedule` reste piloté par un scheduler remplaçable (Leitner → SM-2/FSRS) ;
- delta minimal : nouveaux types d'exercice + colonnes dimensionnelles + historique
  des réponses + player audio.

---

## R. RECOMMENDED NEXT PHASE

**Phase 23B (à valider par le propriétaire, ne pas démarrer automatiquement) :**
1. activer le player `word_audio` (URL signée) et brancher `AUDIO_TO_WORD`/`WORD_TO_AUDIO` ;
2. ajouter un exercice de rappel libre/production (saisie du sens, puis de l'arabe) ;
3. générateur de parcours par sourate (Al-Fatiha complète, ordre canonique) ;
4. campagne d'édition FR priorisée Al-Fatiha (17 formes restantes).

---

## S. NON-REGRESSION

- `CODE_PRODUCTION_CHANGES = 0` · `DATABASE_WRITES = 0` · `MIGRATIONS = 0` · `STORAGE_WRITES = 0` ;
- **Tests : 242/242** (`npm test`) ;
- **Typecheck : `tsc --noEmit` → 0 erreur** (deux scripts d'audit temporaires créés puis
  supprimés pour restaurer un tsc propre ; leur sortie JSON est conservée) ;
- recommandations **séparées des faits** ; aucune donnée inventée ; toutes les
  métriques proviennent du code et de la base réels.

---

## QUESTION CENTRALE (réponse)

> Si un nouvel utilisateur commence aujourd'hui Al-Fatiha dans Hikma, peut-on
> l'amener à : reconnaître les mots, connaître leur signification, les retrouver
> sans aide, comprendre les formes fléchies, les mots en contexte, chaque verset,
> mémoriser la sourate, conserver ces connaissances ?

**Réponse basée sur le code et les données réels : NON, pas aujourd'hui.**

Hikma peut aujourd'hui :
- présenter et faire **reconnaître** 8 formes de **3 versets** (1:1–1:3) en français ;
- conserver une progression et des révisions (Leitner) sur ces mots.

Hikma ne peut **pas** aujourd'hui :
- couvrir les versets 1:4–1:7 (hors curriculum, 18 formes) ;
- faire **retrouver sans aide** la signification (aucun rappel libre) ;
- faire **produire** le sens ou l'arabe ;
- **exploiter les formes fléchies / lemmes** (9/26 résolus, jamais reliés pédagogiquement) ;
- faire **comprendre activement** chaque verset (contexte passif) ;
- **faire entendre** les mots (audio importé, non jouable) ;
- garantir la **rétention à long terme** (SRS Leitner basique, pas d'historique).

**Briques manquantes exactes :** parcours sourate complet · glosses FR pour les formes
manquantes · player audio (`word_audio` déjà prêt) · exercices de rappel libre et de
production · liaison forme↔lemme↔racine · maîtrise par dimension · SRS avec historique
et difficulté · exercice de compréhension de verset.

**STATUS FINAL : `AUDIT_COMPLETE`** — arrêt obligatoire, aucune implémentation.
