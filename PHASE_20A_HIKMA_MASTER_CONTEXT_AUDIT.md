# PHASE 20A — HIKMA MASTER CONTEXT AUDIT

**MODE : READ_ONLY**  
**DATABASE_WRITES : 0 · IMPORTS : 0 · MIGRATIONS : 0 · SEEDS : 0 · CODE_MODIFICATIONS : 0**

## 1. Executive Summary

Hikma possède aujourd'hui une vertical slice Al-Fātiḥah fonctionnelle : corpus
Quran, 8 leçons éditoriales, résolution forme → lemme → français/anglais,
audio Muʿallim mot-à-mot, exercices, grading, feedback, progression, SRS et
maîtrise par compétence.

L'état live n'est toutefois plus celui de plusieurs rapports historiques :
15 parcours existent en base, 32 lemmes, 32 traductions de lemmes et 25
traductions lexicales. Ces écarts sont documentés, pas corrigés.

**Décision : `G — MULTIPLE_WORKSTREAMS_REQUIRED`.**

Al-Fātiḥah est un bon template technique, mais ne peut pas encore être
déclarée `FATIHAH_REFERENCE_LOCKED` : racines et morphologie ne sont pas
disponibles dans les données, l'explication riche après erreur reste partielle,
et l'audit pédagogique humain de la vertical slice n'est pas démontré par les
tests automatisés.

## 2. État réel actuel

| Élément | État live | Classification |
|---|---:|---|
| `surahs` | 114 | DATA_EXISTS / DATA_USED |
| `ayahs` | 6 236 | DATA_EXISTS / DATA_USED |
| `quran_words` | 21 296 | DATA_EXISTS / DATA_USED |
| `word_occurrences` | 77 430 | DATA_EXISTS / DATA_USED |
| `translations` | 24 944 | DATA_EXISTS / DATA_USED |
| `word_translations` | 25, toutes FR validées | DATA_EXISTS / DATA_USED |
| `lemmas` | 32 | DATA_EXISTS / PARTIALLY_USED |
| `lemma_translations` | 32 : 28 validées Hikma, 4 non validées Kazimirski 1860 | DATA_EXISTS / PARTIALLY_USED |
| `word_lemma_mapping` | 183 mappings `safe` | DATA_EXISTS / DATA_USED |
| `word_audio` | 21 295, 21 295 mots distincts | DATA_EXISTS / DATA_USED |
| `ayah_audio` | 0 | DATA_EXISTS / NOT_USED |
| `learning_paths` | 15, tous rattachés à une sourate | DATA_EXISTS / PARTIALLY_USED |
| `lessons` | 90 publiées | DATA_EXISTS / PARTIALLY_USED |

## 3. Historique reconstruit

- **Phase 7/7D** : design et identité teal + doré ; gelées, hors périmètre.
- **Phases 16–18** : provenance, stratégie lexicale et acquisition de la
  traduction française Kazimirski 1869 ; le dictionnaire Kazimirski 1860 est
  séparé.
- **Phase 19A–19E** : analyse multi-traductions, propositions puis validation
  éditoriale de gloses de lemmes. Les anciens rapports annonçaient 18 lignes ;
  la base live en contient 32.
- **Phase 20A/20B historique** : audit de résolution puis correction du
  word-bank pour la précédence forme → lemme → anglais.
- **Phase 21B** : mapping additif forme → lemme ; 183 mappings `safe` sont
  présents en base.
- **Phase 22E/24F** : import et usage des audios Muʿallim mot-à-mot.
- **Phase 23F–24H** : moteur pédagogique, rappel, audio, feedback, grading
  sémantique, sessions et maîtrise par compétence.
- **Phase 6I multi-sourates précédente** : ajout de `learning_paths.surah_id`
  et génération des 14 parcours courts supplémentaires. Cette opération est
  antérieure au présent audit et n'est pas relancée.

## 4. Architecture actuelle

La chaîne démontrée par le code est :

```text
surahs → ayahs → word_occurrences → quran_words
                         ↓              ↓
                    contexte       lemma_id / mapping
                                        ↓
                                      lemmas
                         ↓              ↓
               translations       word/lemma translations
                         ↓              ↓
                      exercices → grading → feedback
                                      ↓
                         user_word_progress / review_items
                                      ↓
                         user_word_skill_progress
```

Le moteur d'exercices est générique par `WordBankEntry`. Les queries sont batch
et la page de leçon reste un Server Component ; les interactions sont portées
par `LessonPlayer` et les composants client.

## 5. Al-Fātiḥah — parcours de référence

Le parcours `quran-vocabulary` est rattaché à la sourate 1 et contient 8
leçons publiées : `basmala`, `al-hamd`, `ar-rahman`, `malik-yawm-ad-din`,
`iyyaka-nabudu`, `ihdina-sirat`, `sirat-alladhina`, `wa-la-d-dallin`.

Il contient 56 associations `lesson_words` et 26 formes distinctes. Les mots
sont réels et proviennent des occurrences Quran ; les leçons 7 et 8 découpent
le verset 7. Le parcours est donc une vertical slice pédagogique substantielle,
mais pas une preuve suffisante de qualité éditoriale complète.

## 6. Quran data

Le corpus live est cohérent avec la baseline : 114 sourates, 6 236 ayahs,
21 296 formes, 77 430 occurrences. Aucun import ni modification n'a été
effectué pendant cet audit.

## 7. Lemmas

`quran_words.lemma_id` relie 135 formes à 32 lemmes. La table additive
`word_lemma_mapping` contient 183 mappings `safe` et la résolution donne la
priorité aux liaisons directes avant les mappings. Le système respecte
`FORM ≠ LEMMA ≠ OCCURRENCE`.

## 8. Roots

La colonne `root` existe dans `lemmas` et `quran_words`, mais l'audit live
observe **0 valeur non nulle** dans les deux tables. Les racines ne sont donc
pas disponibles pour expliquer Al-Fātiḥah : `DATA_EXISTS` pour le schéma,
`DATA_MISSING` pour la couverture effective.

## 9. Morphology

Aucune colonne ou relation de morphologie exploitable n'a été démontrée dans le
schéma actuel. Le module `lib/learning/phonetics.ts` décrit des signes de
prononciation, pas une analyse morphologique. Statut : `DATA_MISSING` /
`NOT_IMPLEMENTED`.

## 10. Traductions

La table `translations` porte les traductions de versets et conserve
`resource_id`, `language` et `translator`. Les sources live identifiées sont :

- 31 — Muhammad Hamidullah, français ;
- 9001 — Albert de Biberstein-Kazimirski, français, 1869 ;
- 20 — Sahih International, anglais ;
- 153 — Hamza Roberto Piccardo, italien.

Les cinq sourates de parité auditées disposent des quatre ressources sur chaque
ayah. Une traduction de verset n'est pas utilisée comme glose mot-à-mot.

## 11. Analyse multi-traductions

La Phase 19A a comparé les quatre traductions sur le même `ayah_id` pour 14
lemmes, en séparant `DIRECT_EQUIVALENT`, `CONTEXTUAL_EQUIVALENT` et
`GRAMMATICAL_FUNCTION`. La méthode est cohérente et traçable. Le rapport
historique doit toutefois être lu avec l'état live : il annonçait 22 lemmes et
4 `lemma_translations`, alors que la base contient maintenant 32 et 32.

## 12. Word translations

`word_translations` est un canal lexical éditorial distinct, avec workflow
`PROPOSED → VALIDATED`. L'état live est de 25 lignes, toutes françaises et
validées, dont 25 lignes directement utiles à la verticale Al-Fātiḥah. La
glose de forme est prioritaire sur le lemme.

## 13. Lemma translations

L'état live est de 32 lignes : 28 gloses françaises validées provenant de
`Hikma — lexique éditorial`, et 4 lignes françaises non validées provenant du
dictionnaire Kazimirski 1860. Les 4 lignes historiques restent distinctes du
Kazimirski 1869 de traduction coranique.

## 14. Muʿallim audio

Le stockage réel est `word-audio`, table `word_audio`, chemin contrôlé
`muallim/{uuid}.opus`. Les 21 295 lignes ont 21 295 `word_id` distincts,
une récitation Muallim et une source audio. `ayah_audio = 0`.

Pour Al-Fātiḥah : 26 formes distinctes et 26 audios, soit **100 %**. Le même
audio est réutilisable pour une forme apparaissant dans plusieurs occurrences,
car la clé pédagogique est `word_id`, non `occurrence_id`.

Le code charge les lignes par batch, signe les chemins Storage pour 1 heure et
ne fabrique jamais d'URL publique. La couverture est `WORD_LEVEL`, pas
`OCCURRENCE_LEVEL` ni `AYAH_LEVEL`.

## 15. Exercises

Les types actuellement disponibles couvrent reconnaissance de forme et de sens,
rappel forme→sens, rappel sens→forme, audio, contexte, relation de lemme,
phonétique et auto-évaluation guidée. Le mapping des compétences est dans
`lib/learning/skills.ts` et conserve 8 dimensions.

Pour Al-Fātiḥah, les exercices sont générés depuis les mots de la leçon,
les gloses résolues, l'audio et le contexte. Pour les autres parcours, le code
est générique et les 14 curricula existent, mais aucun audit manuel complet de
chaque séquence n'est démontré ici.

## 16. Grading

Le grading est centralisé dans `lib/exercises/grading.ts`. Il normalise
présentation arabe, voyelles et variantes d'alef selon des règles explicites,
et accepte l'ordre indépendant des unités d'une glose française séparée par
`/`. Il distingue `CORRECT`, `INCORRECT` et `AMBIGUOUS` pour l'arabe.

Le grading n'a pas été modifié pendant cet audit. Le cas « maitre / souverain »
est couvert seulement lorsque les unités acceptées sont présentes dans la
glose éditoriale ; il n'existe pas de fuzzy matching global.

## 17. Feedback

Le feedback correct/incorrect et la réponse attendue sont implémentés dans les
composants d'exercice. Le ton non humiliant et la distinction des états sont
présents. Les tests couvrent le moteur, mais une validation humaine de toute la
progression pédagogique reste `UNKNOWN`.

## 18. Explication après erreur

`HikmaExplanation` existe et peut afficher une donnée de disponibilité,
forme arabe, translittération, sens court et indices phonétiques/contextuels.
Le composant sait aussi afficher « Explication indisponible ».

La chaîne riche `mot → lemme → racine → morphologie → contexte → explication`
n'est pas complète : racines et morphologie manquent, et l'explication est
principalement une couche UI alimentée par les données disponibles. Statut :
`PARTIALLY_IMPLEMENTED`.

## 19. Progress

`user_word_progress` est unique par `(user_id, word_id)` et conserve statut,
maîtrise agrégée, compteurs et récence. `lesson_sessions` persiste la position
de leçon et les résultats en cours. Le modèle est compatible avec plusieurs
sourates si les mots restent les identifiants globaux du corpus.

## 20. SRS

`review_items` est unique par `(user_id, word_id)` et le scheduler Leitner
existant est réutilisé. Il n'existe pas de SRS par occurrence ni de SRS par
sourate persisté. La séparation par sourate est dérivée des `word_id` liés aux
leçons, pas une nouvelle vérité en base.

## 21. Mastery

`user_word_skill_progress` porte les 8 compétences existantes :
`form_recognition`, `meaning_recognition`, `form_to_meaning`,
`meaning_to_form`, `audio_recognition`, `context_recognition`,
`lemma_relation`, `retention`. La maîtrise globale par mot est agrégée ; une
vue par sourate existe maintenant comme projection technique, mais n'est pas
encore une expérience utilisateur complète ni un moteur de recommandation.

## 22. Curriculum

Le catalogue live contient 15 parcours, 15 unités et 90 leçons. Al-Fātiḥah
reste le parcours éditorial détaillé ; les 14 autres ont été générés à partir
des ayahs et occurrences réels, une leçon par ayah. Le catalogue ne doit pas
être confondu avec un ordre obligatoire utilisateur.

## 23. Learning paths

`learning_paths.surah_id` existe, référence `surahs(id)`, est indexé et est
nullable pour l'historique. L'état live montre 15 parcours et 0 parcours sans
rattachement. Le chargement par défaut reste explicitement ancré sur
`quran-vocabulary` pour les écrans historiques ; le catalogue complet est
exposé par `listLearningPaths`.

## 24. Dépendances à Al-Fātiḥah

Dépendances conservées et documentées : slug `basmala`, parcours par défaut
`quran-vocabulary`, seed éditorial détaillé et tests de persistance historiques.
La dépendance implicite de `getWordAyahContexts` à `surahNumber = 1` a été
remplacée dans l'état actuel par un paramètre explicite nullable ; un contexte
inconnu ne bascule plus silencieusement vers Al-Fātiḥah.

## 25. État des autres sourates

Les parcours 112, 113, 114 et 108 disposent de Quran data, traductions des
ayahs, mots, occurrences et audio Muʿallim. Le moteur générique peut les
charger. Leur qualité pédagogique détaillée, leurs explications et leur
progression utilisateur réelle sont `UNKNOWN` jusqu'à un audit dédié.

## 26. Réutilisabilité

Réutilisable immédiatement : corpus, queries batch, resolver, générateurs,
grading, audio word-level, progression par mot et SRS par mot.

À verrouiller avant industrialisation : couverture lemma/morphologie, audit des
objectifs par leçon, contexte et feedback par sourate, validation humaine des
gloses et navigation catalogue vs parcours utilisateur.

## 27. Données manquantes

- racines effectives : aucune valeur live non nulle ;
- morphologie : aucune représentation démontrée ;
- explications éditoriales riches par mot ;
- audit humain systématique des 90 leçons ;
- profil de compétence et recommandation utilisateur : `PLANNED`, non implémentés.

## 28. Risques

1. Confondre les chiffres historiques des rapports avec l'état live.
2. Exposer une glose de lemme comme traduction exacte d'un verset.
3. Déduire une racine ou une morphologie absente.
4. Faire du catalogue multi-sourates un parcours séquentiel obligatoire.
5. Considérer la présence technique d'un exercice comme preuve de qualité
   pédagogique.

## 29. Ce qui doit être verrouillé

- vertical slice Al-Fātiḥah auditable de bout en bout ;
- provenance et statut de chaque glose ;
- limites explicites de l'explication après erreur ;
- couverture et comportement audio Muʿallim ;
- isolation user/word/sourate ;
- critères d'acceptation éditoriaux par leçon.

## 30. Ce qui peut attendre

Onboarding, test de niveau, recommandation, personnalisation, morphologie
avancée et audio d'ayah peuvent attendre. Aucun n'est nécessaire pour constater
la généricité technique de la boucle actuelle.

## 31. Architecture recommandée

Conserver la séparation : **catalogue de contenu** → **parcours choisi** →
**état utilisateur**. Garder `word_id` comme unité de progression et exposer
la sourate par `learning_path.surah_id` et les relations Quran. Ajouter les
explications seulement à partir de données disponibles et validées.

## 32. Plan de travail proposé

1. Revue éditoriale complète d'Al-Fātiḥah : mots, leçons, objectifs, feedback.
2. Dossier lexical séparé pour racines/morphologie, sans inférence automatique.
3. Audit de parité détaillé des quatre traductions et de l'audio.
4. Spécification de l'explication après erreur à trois niveaux.
5. Validation humaine d'un parcours court supplémentaire avant extension.
6. Seulement ensuite, onboarding et recommandation.

## 33. Non-régression

Validé en lecture seule dans l'état courant :

- `npm test` : **442 tests / 37 fichiers PASS** ;
- `npx tsc --noEmit` : **PASS** ;
- `npm run lint` : **PASS** ;
- `npm run build` : **PASS** ;
- `npm run verify:persistence` et `npm run verify:rls` : **non exécutés dans
  cette phase**, car ils créent/suppriment des utilisateurs et violeraient
  `DATABASE_WRITES = 0`. Les derniers rapports existants les documentent à
  13/13 et 44/44.

## 34. Décision finale

`G — MULTIPLE_WORKSTREAMS_REQUIRED`

Al-Fātiḥah est **techniquement exploitable comme référence**, mais pas encore
verrouillée comme référence pédagogique complète. Les priorités sont lexicales
(racines/morphologie disponibles ou explicitement absentes), explicatives et
éditoriales, pas une nouvelle migration ou un nouvel import Quran.

## Matrice de parité

| Couche | Al-Fātiḥah | Ikhlāṣ | Falaq | Nās | Kawthar |
|---|---|---|---|---|---|
| Quran data | AVAILABLE | AVAILABLE | AVAILABLE | AVAILABLE | AVAILABLE |
| Words | AVAILABLE | AVAILABLE | AVAILABLE | AVAILABLE | AVAILABLE |
| Occurrences | AVAILABLE | AVAILABLE | AVAILABLE | AVAILABLE | AVAILABLE |
| Lemmas | PARTIAL | PARTIAL | PARTIAL | PARTIAL | MISSING |
| Roots | MISSING | MISSING | MISSING | MISSING | MISSING |
| Morphology | MISSING | MISSING | MISSING | MISSING | MISSING |
| Hamidullah | AVAILABLE | AVAILABLE | AVAILABLE | AVAILABLE | AVAILABLE |
| Kazimirski | AVAILABLE | AVAILABLE | AVAILABLE | AVAILABLE | AVAILABLE |
| Sahih | AVAILABLE | AVAILABLE | AVAILABLE | AVAILABLE | AVAILABLE |
| Piccardo | AVAILABLE | AVAILABLE | AVAILABLE | AVAILABLE | AVAILABLE |
| Word translations | PARTIAL | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| Muʿallim audio | AVAILABLE | AVAILABLE | AVAILABLE | AVAILABLE | AVAILABLE |
| Exercises | AVAILABLE | PARTIAL | PARTIAL | PARTIAL | PARTIAL |
| Grading | AVAILABLE | PARTIAL | PARTIAL | PARTIAL | PARTIAL |
| Explanation | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL |
| Progress | AVAILABLE | AVAILABLE | AVAILABLE | AVAILABLE | AVAILABLE |
| SRS | AVAILABLE | AVAILABLE | AVAILABLE | AVAILABLE | AVAILABLE |
| Mastery | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL |
