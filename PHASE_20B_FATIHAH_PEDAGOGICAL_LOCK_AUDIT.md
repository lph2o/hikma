# PHASE 20B — AL-FĀTIḤAH PEDAGOGICAL LOCK AUDIT

**READ_ONLY · DATABASE_WRITES = 0 · IMPORTS = 0 · MIGRATIONS = 0 · SEEDS = 0 · CODE_MODIFICATIONS = 0 · COMMITS = 0**

## 1. Executive Summary

Al-Fātiḥah possède une chaîne technique complète et cohérente : 7 ayahs,
26 formes, 8 leçons, gloses françaises directes ou de lemme, 26 audios
Muʿallim, exercices génériques, grading, feedback, progression, SRS et
mastery.

Elle n'est pas encore `FATIHAH_REFERENCE_LOCKED`. Les blocages restants ne
sont pas l'intégrité Quran ni l'audio : ils concernent surtout la validation
pédagogique des 8 leçons et l'explication après erreur. Les racines et la
morphologie sont absentes, mais ne sont pas un blocker automatique du niveau
Core ou Lexical Explanation si l'explication reste conditionnelle.

**Décision : `G — MULTIPLE_WORKSTREAMS_REQUIRED`.**

## 2. État réel d'Al-Fātiḥah

| Élément | Valeur live | Statut |
|---|---:|---|
| Sourate | 1 | AVAILABLE |
| Ayahs | 7 | AVAILABLE |
| Occurrences | 29 | AVAILABLE |
| Formes distinctes | 26 | AVAILABLE |
| Formes avec lemme direct | 9 | PARTIAL |
| Lemm es utilisés | 9 | PARTIAL |
| Mappings de la sourate | disponibles globalement, 183 `safe` | PARTIAL |
| Traductions d'ayah | 28 lignes, 4 sources × 7 ayahs | AVAILABLE |
| Gloses de forme | 25/26 | PARTIAL |
| Gloses de lemme | disponibles pour les lemmes liés | PARTIAL |
| Audios Muʿallim | 26/26 | AVAILABLE |
| Leçons | 8 | AVAILABLE |
| Exercices | générés à l'exécution, non persistés | PARTIAL |

## 3. Les 26 formes

`root` et `morphology` sont `MISSING` pour les 26 formes. Audio = `AVAILABLE`
pour les 26. `Traduction` indique une glose de forme directe ; lorsque la
cellule est vide, le sens est fourni par le lemme ou par la gloss anglaise de
repli. `Explication` reste `PARTIAL` car `HikmaExplanation` ne possède pas
encore la chaîne lexicale riche complète.

| Forme | Ayah | Lemme | Racine | Morphologie | Traduction/glose | Audio | Exercices | Explication |
|---|---:|---|---|---|---|---|---|---|
| إِيَّاكَ | 5 | MISSING | MISSING | MISSING | Toi seul / c'est Toi que | AVAILABLE | AVAILABLE | PARTIAL |
| ٱلْمُسْتَقِيمَ | 6 | MISSING | MISSING | MISSING | droit | AVAILABLE | AVAILABLE | PARTIAL |
| ٱلرَّحِيمِ | 3,1 | الرَّحِيم | MISSING | MISSING | le Très Miséricordieux | AVAILABLE | AVAILABLE | PARTIAL |
| ٱهْدِنَا | 6 | MISSING | MISSING | MISSING | guide-nous | AVAILABLE | AVAILABLE | PARTIAL |
| أَنْعَمْتَ | 7 | MISSING | MISSING | MISSING | Tu as comblé de bienfaits | AVAILABLE | AVAILABLE | PARTIAL |
| نَسْتَعِينُ | 5 | MISSING | MISSING | MISSING | nous implorons le secours | AVAILABLE | AVAILABLE | PARTIAL |
| غَيْرِ | 7 | MISSING | MISSING | MISSING | autre que / non pas de | AVAILABLE | AVAILABLE | PARTIAL |
| ٱلْحَمْدُ | 2 | الْحَمْد | MISSING | MISSING | la louange | AVAILABLE | AVAILABLE | PARTIAL |
| صِرَٰطَ | 7 | MISSING | MISSING | MISSING | chemin / voie | AVAILABLE | AVAILABLE | PARTIAL |
| ٱلْمَغْضُوبِ | 7 | MISSING | MISSING | MISSING | ceux qui encourent la colère | AVAILABLE | AVAILABLE | PARTIAL |
| يَوْمِ | 4 | يَوْم | MISSING | MISSING | glose de lemme « jour » | AVAILABLE | AVAILABLE | PARTIAL |
| وَلَا | 7 | MISSING | MISSING | MISSING | et non / ni | AVAILABLE | AVAILABLE | PARTIAL |
| رَبِّ | 2 | رَبّ | MISSING | MISSING | Seigneur | AVAILABLE | AVAILABLE | PARTIAL |
| ٱلدِّينِ | 4 | MISSING | MISSING | MISSING | rétribution / religion | AVAILABLE | AVAILABLE | PARTIAL |
| بِسْمِ | 1 | بِسْم | MISSING | MISSING | au nom de | AVAILABLE | AVAILABLE | PARTIAL |
| ٱلْعَـٰلَمِينَ | 2 | الْعَـٰلَمِين | MISSING | MISSING | des mondes | AVAILABLE | AVAILABLE | PARTIAL |
| ٱلرَّحْمَـٰنِ | 3,1 | الرَّحْمَـٰن | MISSING | MISSING | le Tout Miséricordieux | AVAILABLE | AVAILABLE | PARTIAL |
| نَعْبُدُ | 5 | MISSING | MISSING | MISSING | nous adorons | AVAILABLE | AVAILABLE | PARTIAL |
| ٱلضَّآلِّينَ | 7 | MISSING | MISSING | MISSING | les égarés | AVAILABLE | AVAILABLE | PARTIAL |
| ٱلَّذِينَ | 7 | MISSING | MISSING | MISSING | ceux qui / ceux que | AVAILABLE | AVAILABLE | PARTIAL |
| وَإِيَّاكَ | 5 | MISSING | MISSING | MISSING | et Toi seul / et c'est Toi que | AVAILABLE | AVAILABLE | PARTIAL |
| ٱللَّهِ | 1 | الله | MISSING | MISSING | Allah | AVAILABLE | AVAILABLE | PARTIAL |
| ٱلصِّرَٰطَ | 6 | MISSING | MISSING | MISSING | le chemin / la voie | AVAILABLE | AVAILABLE | PARTIAL |
| لِلَّهِ | 2 | لِلَّه | MISSING | MISSING | à / pour Allah | AVAILABLE | AVAILABLE | PARTIAL |
| عَلَيْهِمْ | 7 | MISSING | MISSING | MISSING | sur eux | AVAILABLE | AVAILABLE | PARTIAL |
| مَـٰلِكِ | 4 | MISSING | MISSING | MISSING | souverain / maître | AVAILABLE | AVAILABLE | PARTIAL |

## 4. Les lemmes

Les 9 lemmes réellement utilisés par les 26 formes sont : بِسْم, الله,
الرَّحْمَـٰن, الرَّحِيم, الْحَمْد, لِلَّه, رَبّ, يَوْم,
الْعَـٰلَمِين. Ils proviennent de `quran_words.lemma_id` et sont résolus par
`getValidatedFrenchLemmaMeaningsByWord`. Les 23 autres lemmes globaux ne sont
pas automatiquement pertinents pour Al-Fātiḥah.

La couverture des formes avec lemme direct est 9/26. Les 17 autres formes
restent utilisables grâce aux gloses de forme ou au fallback anglais ; cela ne
constitue pas une preuve de couverture lexicale française homogène.

## 5. Les traductions multi-sources

Les quatre sources sont accessibles pour les 7 ayahs d'Al-Fātiḥah :

- Hamidullah FR, resource 31 — source française principale ;
- Kazimirski 1869 FR, resource 9001 — source française principale ;
- Sahih International EN, resource 20 — contrôle ;
- Piccardo IT, resource 153 — contrôle.

Les traductions restent au niveau verset. Les gloses ne sont pas des
extractions automatiques de segments de phrase.

## 6. Les gloses

25 lignes `word_translations` françaises validées existent dans l'état live.
La glose `يَوْمِ` provient du lemme validé « jour ». Les autres sens peuvent
provenir d'une glose de forme, d'une glose de lemme ou du sens anglais de
`quran_words` selon la précédence documentée.

Statuts : `VALIDATED` pour les gloses éditoriales Hikma ; 4 gloses de
`lemma_translations` Kazimirski 1860 restent non validées et ne sont pas
exposées pédagogiquement. Aucune nouvelle glose n'a été créée.

## 7. Les racines

Le schéma possède `root` dans `lemmas` et `quran_words`, mais l'audit live
observe 0 valeur non nulle. Aucun `root_id` ni table de racines n'est utilisé.
Infrastructure actuelle : colonnes nullable uniquement. Ajouter des racines
fiables nécessiterait une source, une provenance, un mapping et une revue
éditoriale séparés. Cette phase ne propose aucun import.

## 8. La morphologie

Aucune table, colonne, relation ou type de morphologie exploitable n'a été
démontré. Les informations phonétiques de `lib/learning/phonetics.ts` ne sont
pas une morphologie arabe. Statut : `MISSING`, mais **non blocker automatique**
pour les niveaux Core et Lexical Explanation.

## 9. Les 26 audios Muʿallim

`word_audio` relie chaque `word_id` à un chemin Storage `muallim/{uuid}.opus`,
une récitation et une source. Al-Fātiḥah est à 26/26, sans doublon de forme,
avec chemin valide. Le composant signe l'URL à la demande, TTL 1 h, puis les
exercices audio utilisent cette URL.

L'audio intervient dans la découverte, `AUDIO_TO_WORD`, `WORD_TO_AUDIO`, la
prononciation guidée et la réécoute possible du mot. La vérification binaire du
fichier audio lui-même n'est pas un test automatisé de qualité sonore : statut
qualitatif `UNKNOWN`.

## 10. Les 8 leçons

| Ordre | Slug | Objectif observé | Mots | Statut |
|---:|---|---|---:|---|
| 1 | basmala | reconnaître/comprendre le verset d'ouverture | 4 | AVAILABLE |
| 2 | al-hamd | comprendre la louange avec révision | 6 | AVAILABLE |
| 3 | ar-rahman | consolider les noms de miséricorde | 6 | AVAILABLE |
| 4 | malik-yawm-ad-din | comprendre souverain, jour, rétribution | 7 | AVAILABLE |
| 5 | iyyaka-nabudu | comprendre l'adoration et le secours | 6 | AVAILABLE |
| 6 | ihdina-sirat | comprendre guidance et chemin | 6 | AVAILABLE |
| 7 | sirat-alladhina | première moitié du verset 7 | 8 | AVAILABLE |
| 8 | wa-la-d-dallin | seconde moitié du verset 7 | 13 | AVAILABLE |

Les mots de révision ne sont pas un critère de complétion ; la complétion
repose sur les mots `is_new`. L'audit pédagogique humain des questions et de
la charge par leçon reste à faire.

## 11. Les exercices

Le moteur génère à l'exécution : reconnaissance de sens et de forme, rappel
forme→sens, rappel sens→forme, audio, contexte, relation de lemme et
auto-évaluation. Les générateurs renvoient `null` lorsque la donnée requise
manque. Les exercices ne sont pas une table de vérité persistée.

Pour Al-Fātiḥah, mots, gloses et audio sont disponibles ; contexte et relation
de lemme restent conditionnels. La parité exacte par leçon et par type doit
être verrouillée par un audit pédagogique dédié.

## 12. Grading

Le grading est centralisé et inchangé : normalisation arabe contrôlée,
variantes d'alef, réponse non vocalisée, statut `AMBIGUOUS` pour vocalisation
différente et ensembles de synonymes français ordonnables. Il n'y a pas de
fuzzy matching ni de correction automatique de réponse partielle.

Le cas « maître / souverain » est accepté lorsque les deux unités sont dans la
glose validée. Une réponse partielle doit rester un chantier explicite et ne
doit pas être inventée comme statut actuel.

## 13. Feedback

Les états correct, incorrect et ambigu sont affichés ; la bonne réponse et une
explication courte peuvent apparaître après soumission. L'accès à
`HikmaExplanation` existe pour les états incorrects qui disposent de données.
Les trous restants sont la distinction pédagogique fine entre erreur de
connaissance, erreur partielle et variante acceptable, ainsi que la validation
mobile de chaque leçon.

## 14. HikmaExplanation

Fichier : `components/ui/hikma-explanation.tsx`.

Le composant reçoit `HikmaExplanationData` avec disponibilité, type, arabe,
translittération, texte court, détail et indices phonétiques. Il affiche un
accordéon « Comprendre pourquoi » et distingue `verified`, `partial` et
`unavailable`.

Il peut être déclenché dans `components/ui/exercise.tsx` après une réponse
incorrecte. Il peut afficher forme, translittération, sens court, phonétique et
relation de lemme. Il ne peut pas actuellement afficher une racine ou une
morphologie absente, ni composer une analyse grammaticale vérifiée complète.

## 15. Explication après erreur

| Niveau | État |
|---|---|
| Correction | AVAILABLE |
| Explication courte | PARTIAL à AVAILABLE selon l'exercice |
| Comprendre le mot | PARTIAL |

La plus petite extension future doit enrichir les données passées au composant
avec des champs optionnels et conditionnels (`lemma`, `context`, `root` si
présent, `morphology` si présent), sans inventer les absents. Aucun changement
au composant n'est réalisé ici.

## 16. Progression

`user_word_progress` est unique par `(user_id, word_id)`. Le parcours et les
leçons fournissent le contexte ; la progression réelle reste au niveau du mot.
Les sessions de leçon conservent position et résultats pour un utilisateur.
Statut : `AVAILABLE`, isolation par utilisateur démontrée historiquement.

## 17. SRS

`review_items` est unique par `(user_id, word_id)`, avec intervalle, état et
prochaine échéance. Une forme commune à plusieurs ayahs partage volontairement
la progression du mot. L'isolation par utilisateur est structurelle.

## 18. Mastery

| Compétence | Source | Calcul | Stockage | UI |
|---|---|---|---|---|
| form_recognition | tentatives | skill mastery | user_word_skill_progress | partielle |
| meaning_recognition | tentatives | skill mastery | user_word_skill_progress | partielle |
| form_to_meaning | rappel libre | skill mastery | user_word_skill_progress | partielle |
| meaning_to_form | rappel libre | skill mastery | user_word_skill_progress | partielle |
| audio_recognition | audio/QCM | skill mastery | user_word_skill_progress | partielle |
| context_recognition | contexte | skill mastery | user_word_skill_progress | partielle |
| lemma_relation | relation vérifiée | skill mastery | user_word_skill_progress | partielle |
| retention | récence/SRS | calcul de rétention | user_word_skill_progress | partielle |

La mastery par sourate est une projection dérivée, pas une nouvelle vérité
persistée. L'affichage utilisateur complet reste `PLANNED`.

## 19. Les 15 learning_paths

L'état live comprend `quran-vocabulary` pour Al-Fātiḥah et 14 parcours
`quran-surah-*` pour le corpus court. Tous sont rattachés à `surah_id`, avec
une unité et des leçons publiées. Ils sont réels, pas des comptes de test.

## 20. `limit(1)`

La limitation existe encore dans `getCurriculum`, mais elle est désormais
appliquée après une sélection explicite : parcours historique par slug ou
parcours ciblé par sourate/ID. `listLearningPaths` ne limite pas le catalogue.
La limitation est donc une compatibilité de l'écran par défaut, pas la preuve
que la base ne contient qu'un parcours.

## 21. `getWordAyahContexts`

L'état actuel ne possède plus de fallback silencieux `surahNumber = 1` : la
signature reçoit `number | null` et retourne une map vide si le contexte est
inconnu. La page de leçon transmet la sourate rattachée au parcours. La
dépendance historique était `HARD_CODED + LEGACY`; elle est documentée comme
supprimée du runtime actuel.

## 22. Dépendances à Al-Fātiḥah

Restent intentionnelles : slug `basmala`, parcours par défaut
`quran-vocabulary`, seed éditorial et textes de tests historiques. Elles ne
sont pas des dépendances du grading ou du moteur d'exercices.

## 23. Architecture actuelle

```text
Quran immutable
  → lesson_words réels
  → word bank résolu
  → exercices déterministes
  → grade unique
  → feedback / explanation conditionnelle
  → progression + SRS + skill mastery
```

## 24. MUST FIX

- Audit éditorial de chacune des 8 leçons avant déclaration de verrouillage.
- Matrice d'exercices réelle par leçon : objectif, réponse, distracteurs,
  feedback et fuite de réponse.
- Spécification testée du niveau 2 d'explication après erreur.

## 25. SHOULD FIX

- Enrichir l'explication avec le lemme et le contexte lorsque vérifiés.
- Rendre visible la mastery par compétence/sourate sans jargon.
- Auditer les réponses partielles et les états mobiles.

## 26. CAN WAIT

- Racines fiables et morphologie avancée.
- Morphologie détaillée et composition.
- Audio d'ayah, onboarding, évaluation initiale, recommandation.

## 27. Future

Après verrouillage : `PEDAGOGICAL_TEMPLATE_VALIDATED`, puis extension contrôlée
des autres sourates, onboarding, évaluation multidimensionnelle et
recommandation. Aucun ordre fixe de sourates ne doit être imposé.

## 28. Tests nécessaires

1. Bonne réponse ; 2. erreur ; 3. synonymes ; 4. ordre différent ; 5. accents ;
6. typographie ; 7. réponse partielle ; 8. demande d'explication ; 9. mot sans
racine ; 10. mot sans morphologie ; 11. mot avec lemme ; 12. mot avec audio ;
13. audio inaccessible ; 14. SRS ; 15. mastery ; 16. progression ; 17. mot
répété dans plusieurs contextes ; 18. isolation utilisateur.

## 29. Critères `FATIHAH_REFERENCE_LOCKED`

Le niveau Core est presque atteint : données, mots, occurrences, sens, audio,
exercices, grading, feedback, progression, SRS et mastery existent.

Le niveau Lexical Explanation est partiel : forme, lemme, glose et contexte
existent par endroits ; racines/morphologie n'existent pas. Le niveau Advanced
Linguistic Explanation est non disponible. Les niveaux avancés ne bloquent pas
Core, mais le niveau Lexical doit être spécifié et validé pédagogiquement avant
le verrouillage.

## 30. Proposition de Phase 21

Phase 21 recommandée : **Al-Fātiḥah — explication après erreur et audit
pédagogique final**, sans importer racines/morphologie. Elle doit définir les
payloads conditionnels, vérifier le contexte post-erreur, auditer les 8 leçons
et ajouter les tests de verrouillage listés ci-dessus.

## 31. Non-régression

Exécuté en lecture seule : `npm test` = **442 pass**, TypeScript = **PASS**,
ESLint = **PASS**, build = **PASS**. `verify:persistence` et `verify:rls` n'ont
pas été exécutés, car leur comportement crée et supprime des utilisateurs ;
statut `NOT_RUN — SAFETY REASON`. Les derniers rapports disponibles les
documentent respectivement à 13/13 et 44/44.

## 32. Décision finale

`G — MULTIPLE_WORKSTREAMS_REQUIRED`

Le prochain chantier prioritaire est Al-Fātiḥah + explication après erreur +
lexique/contextualisation + feedback pédagogique. Il ne faut pas passer
directement à une industrialisation supplémentaire des autres sourates.

## HIKMA LONG-TERM PEDAGOGICAL MEMORY

- Al-Fātiḥah est la première référence pédagogique de Hikma.
- Le catalogue de contenu ne doit pas devenir un ordre utilisateur obligatoire.
- Les parcours utilisateur et le catalogue doivent rester séparés.
- Hamidullah et Kazimirski 1869 sont les sources FR principales.
- Sahih International et Piccardo sont des contrôles, pas des gloses FR.
- Les audios Muʿallim font partie de l'apprentissage du mot.
- Le grading doit tolérer les variations légitimes sans fuzzy matching.
- Une erreur doit devenir une opportunité d'apprentissage.
- Une explication n'utilise que forme, lemme, racine, morphologie, contexte,
  traduction ou glose réellement disponibles.
- Aucune donnée linguistique ne doit être inventée.
- La morphologie avancée ne doit pas être un blocker de V1.
- L'objectif principal reste comprendre et mémoriser les mots du Coran.
- Onboarding et personnalisation viennent après la validation pédagogique.

## Matrice MUST / SHOULD / CAN WAIT

| Élément | État actuel | MUST FIX | SHOULD FIX | CAN WAIT | Justification |
|---|---|---|---|---|---|
| Intégrité Quran | AVAILABLE |  |  |  | Aucun écart live détecté |
| 26 formes | AVAILABLE/PARTIAL lemma |  | ✓ |  | 17 formes sans lemme |
| Gloses FR | 25/26 directes + lemmes | ✓ audit |  |  | Cohérence éditoriale à verrouiller |
| Racines | MISSING |  |  | ✓ | Ne bloque pas Core |
| Morphologie | MISSING |  |  | ✓ | Ne bloque pas Core |
| Explication post-erreur | PARTIAL | ✓ |  |  | Chantier principal |
| Grading | AVAILABLE |  | ✓ |  | Réponses partielles à préciser |
| Feedback | PARTIAL | ✓ audit |  |  | Qualité pédagogique à vérifier |
| Audio | 26/26 |  | ✓ qualité sonore |  | Couverture technique complète |
| Exercices | AVAILABLE/PARTIAL audit | ✓ |  |  | Vérifier les 8 leçons |
| Progress/SRS/mastery | AVAILABLE |  | ✓ UI |  | Moteur existant |
| Learning paths | AVAILABLE |  |  |  | Séparation catalogue/parcours |

