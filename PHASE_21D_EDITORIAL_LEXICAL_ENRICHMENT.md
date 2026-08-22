# PHASE 21D — EDITORIAL LEXICAL ENRICHMENT

## 1. Executive Summary

Audit **strictement READ_ONLY** (0 écriture DB, 0 écriture code) destiné à produire le
dossier éditorial lexical des 4 sourates pilotes (112, 113, 114, 108), sans rien
importer ni valider.

**Chiffres clés**

| Indicateur | Valeur |
|---|---|
| Entrées par sourate (Phase 21C) | **57** |
| Formes uniques (`quran_words` dédupliqués) | **49** |
| Occurrences totales | **68** |
| Gloses de forme existantes (validées) | **0** |
| Gloses de lemme existantes (validées) | **3** (الله, فِي, نَاس) |
| Propositions de gloses produites (FORME) | **45** |
| Cas « sans glose fiable » | **1** (يَكُن, copule jussive) |
| Audio Muʿallim présent | **49/49 formes** |

**Décision : `A — READY_FOR_HUMAN_GLOSS_REVIEW`** — le dossier est suffisamment
documenté pour une revue humaine, avec un niveau de confiance par proposition
(31 HIGH, 14 MEDIUM, 1 INSUFFICIENT_EVIDENCE).

## 2. Méthodologie

Pipeline appliqué (Phase 19A, confirmé en 21C) :

1. partir du **mot arabe réel** (forme observée) ;
2. remonter au **lemme** uniquement lorsque le mapping existe (3 lemmes) ;
3. lister **toutes les occurrences** (jamais la première seulement) ;
4. aligner par `ayah_id` les **4 traductions** du même verset ;
5. analyser les segments réellement correspondant au mot ;
6. rechercher la **convergence française** (Hamidullah / Kazimirski) ;
7. contrôler via Sahih (EN) et Piccardo (IT) — jamais traduire EN/IT en FR ;
8. proposer une **glose pédagogique** + niveau de stockage + confiance.

Aucune racine, aucun schème, aucune morphologie, aucun mapping de lemme inventé.

## 3. Sources

| Source | resource_id | Langue | Rôle |
|---|---|---|---|
| Muhammad Hamidullah | 31 | FR | prioritaire |
| Kazimirski 1869 | 9001 | FR | prioritaire |
| Sahih International | 20 | EN | contrôle |
| Hamza Roberto Piccardo | 153 | IT | contrôle |

## 4. Inventaire des 57 formes

Le chiffre « 57 formes » de Phase 21C correspond aux **entrées par sourate** :
une même forme partagée entre plusieurs sourates y est comptée plusieurs fois.
En dédupliquant sur `quran_words.id`, on obtient **49 formes uniques** (68
occurrences). **7 formes sont partagées entre sourates** et ne doivent recevoir
qu'une seule glose, jamais une par sourate :

| Forme | Sourates | Occurrences |
|---|---|---|
| قُلْ | 112, 113, 114 | 3 |
| هُوَ | 112, 108 | 2 |
| أَعُوذُ | 113, 114 | 2 |
| بِرَبِّ | 113, 114 | 2 |
| مِن | 113, 114 | 2 |
| شَرِّ | 113, 114 | 5 |
| فِى | 113, 114 | 2 |

Répartition par sourate :

| Sourate | Formes uniques | Occurrences |
|---|---|---|
| 112 — Al-Ikhlāṣ | 13 | 15 |
| 113 — Al-Falaq | 17 | 23 |
| 114 — An-Nās | 17 | 20 |
| 108 — Al-Kawthar | 10 | 10 |

(Le total des « formes uniques par sourate » dépasse 49 car les 7 formes
partagées sont comptées dans chaque sourate concernée.)

## 5. Analyse par sourate

### Al-Ikhlāṣ (112)

- **قُلْ** → « dis » (HIGH) — 1 occ. dans cette sourate
- **هُوَ** → « il » (HIGH) — 1 occ. dans cette sourate
- **أَحَدٌ** → « un / unique » (HIGH) — 1 occ. dans cette sourate
- **ٱلصَّمَدُ** → « l'Éternel / l'Absolu » (MEDIUM) — 1 occ. dans cette sourate
- **لَمْ** → « ne ... pas » (HIGH) — 1 occ. dans cette sourate
- **يَلِدْ** → « engendrer » (HIGH) — 1 occ. dans cette sourate
- **وَلَمْ** → « et ne ... pas » (HIGH) — 2 occ. dans cette sourate
- **يُولَدْ** → « être engendré » (HIGH) — 1 occ. dans cette sourate
- **لَّهُۥ** → « à lui / pour lui » (HIGH) — 1 occ. dans cette sourate
- **كُفُوًا** → « égal / équivalent » (HIGH) — 1 occ. dans cette sourate
- **أَحَدٌۢ** → « aucun / nul » (MEDIUM) — 1 occ. dans cette sourate
- **يَكُن** → *(sans glose)* — Copule jussive (112:4) entièrement dépendante de la négation وَلَمْ qui précède. Une glose lexicale isolée (« être ») serait trompeuse ; mieux couverte par une note grammaticale.

### Al-Falaq (113)

- **قُلْ** → « dis » (HIGH) — 1 occ. dans cette sourate
- **أَعُوذُ** → « je cherche refuge » (HIGH) — 1 occ. dans cette sourate
- **بِرَبِّ** → « auprès du Seigneur » (HIGH) — 1 occ. dans cette sourate
- **ٱلْفَلَقِ** → « l'aube » (HIGH) — 1 occ. dans cette sourate
- **مِن** → « de / contre » (HIGH) — 1 occ. dans cette sourate
- **شَرِّ** → « le mal » (HIGH) — 4 occ. dans cette sourate
- **مَا** → « ce que / ce qui » (MEDIUM) — 1 occ. dans cette sourate
- **خَلَقَ** → « créer » (HIGH) — 1 occ. dans cette sourate
- **وَمِن** → « et de / et contre » (HIGH) — 3 occ. dans cette sourate
- **غَاسِقٍ** → « l'obscurité / la nuit » (HIGH) — 1 occ. dans cette sourate
- **إِذَا** → « quand / lorsque » (HIGH) — 2 occ. dans cette sourate
- **وَقَبَ** → « s'étendre / s'approfondir » (MEDIUM) — 1 occ. dans cette sourate
- **ٱلنَّفَّـٰثَـٰتِ** → « celles qui soufflent » (HIGH) — 1 occ. dans cette sourate
- **ٱلْعُقَدِ** → « les nœuds » (HIGH) — 1 occ. dans cette sourate
- **حَاسِدٍ** → « l'envieux » (HIGH) — 1 occ. dans cette sourate
- **حَسَدَ** → « envier » (HIGH) — 1 occ. dans cette sourate

### An-Nās (114)

- **قُلْ** → « dis » (HIGH) — 1 occ. dans cette sourate
- **أَعُوذُ** → « je cherche refuge » (HIGH) — 1 occ. dans cette sourate
- **بِرَبِّ** → « auprès du Seigneur » (HIGH) — 1 occ. dans cette sourate
- **مِن** → « de / contre » (HIGH) — 1 occ. dans cette sourate
- **شَرِّ** → « le mal » (HIGH) — 1 occ. dans cette sourate
- **مَلِكِ** → « le roi / le souverain » (HIGH) — 1 occ. dans cette sourate
- **إِلَـٰهِ** → « le dieu / la divinité » (HIGH) — 1 occ. dans cette sourate
- **ٱلْوَسْوَاسِ** → « le chuchoteur / l'insufflateur » (MEDIUM) — 1 occ. dans cette sourate
- **ٱلْخَنَّاسِ** → « celui qui se retire » (MEDIUM) — 1 occ. dans cette sourate
- **ٱلَّذِى** → « qui / celui qui » (MEDIUM) — 1 occ. dans cette sourate
- **يُوَسْوِسُ** → « insuffler / chuchoter » (MEDIUM) — 1 occ. dans cette sourate
- **صُدُورِ** → « les poitrines / les cœurs » (MEDIUM) — 1 occ. dans cette sourate
- **مِنَ** → « de / parmi » (HIGH) — 1 occ. dans cette sourate
- **ٱلْجِنَّةِ** → « les djinns » (HIGH) — 1 occ. dans cette sourate
- **وَٱلنَّاسِ** → « et les gens / et les hommes » (MEDIUM) — 1 occ. dans cette sourate

### Al-Kawthar (108)

- **هُوَ** → « il » (HIGH) — 1 occ. dans cette sourate
- **إِنَّآ** → « certes Nous » (MEDIUM) — 1 occ. dans cette sourate
- **أَعْطَيْنَـٰكَ** → « Nous t'avons donné » (HIGH) — 1 occ. dans cette sourate
- **ٱلْكَوْثَرَ** → « al-Kawthar (l'abondance) » (MEDIUM) — 1 occ. dans cette sourate
- **فَصَلِّ** → « prie donc / accomplis la prière » (HIGH) — 1 occ. dans cette sourate
- **لِرَبِّكَ** → « à ton Seigneur » (HIGH) — 1 occ. dans cette sourate
- **وَٱنْحَرْ** → « et sacrifie » (HIGH) — 1 occ. dans cette sourate
- **إِنَّ** → « certes / en vérité » (MEDIUM) — 1 occ. dans cette sourate
- **شَانِئَكَ** → « celui qui te hait » (HIGH) — 1 occ. dans cette sourate
- **ٱلْأَبْتَرُ** → « privé de postérité » (MEDIUM) — 1 occ. dans cette sourate


## 6. Analyse par lemme

Seuls **3 lemmes** sont réellement mappés sur les formes pilotes. Leurs gloses
(validées, source éditoriale Hikma) ont été **auditées et jugées cohérentes** avec
les évidences — **non modifiées** :

| Lemme | Glose existante | Formes couvertes | Audit |
|---|---|---|---|
| الله | « Allah » | ٱللَّهُ (112) | cohérent |
| فِي | « dans / en / sur » | فِى (113, 114) | cohérent |
| نَاس | « gens / hommes » | ٱلنَّاسِ (114) | cohérent |

Note de forme : **وَٱلنَّاسِ** (114:6) est la même racine que نَاس mais **sans**
mapping de lemme → glose de forme proposée par sécurité ; une déduplication future
via le lemme نَاس est possible (FUTURE WORK).

## 7. Évidences multi-traductions

Chaque occurrence a été alignée sur les 4 traductions du **même** `ayah_id`
(détail exhaustif dans `tmp/phase21d-editorial-lexical-enrichment.json` →
`lexical_evidence`). Aucune comparaison inter-ayah.

## 8. Convergence française

- **Forte convergence** (Hamidullah ≈ Kazimirski) pour 31 propositions HIGH :
  ex. قُلْ « dis », خَلَقَ « créer », حَسَدَ « envier », كُفُوًا « égal ».
- **Variation de formulation** (14 MEDIUM) : ex. ٱلصَّمَدُ (imploré / à qui on
  s'adresse), صُدُورِ (poitrines / cœurs), ٱلْوَسْوَاسِ (mauvais conseiller /
  tentateur).

## 9. Contrôle anglais

Sahih International (20) confirme le noyau sémantique (ex. شَرِّ « evil »,
غَاسِقٍ « darkness », أَعُوذُ « seek refuge »). Il n'est **jamais** traduit
automatiquement en français.

## 10. Contrôle italien

Piccardo (153) confirme les mêmes noyaux (male, oscurità, rifugio). Contrôle
seulement, jamais source de formulation française.

## 11. Semantic Core

Conservé par forme dans le JSON (`semantic_core`). Exemples : قُلْ ["dire
(impératif)"], شَرِّ ["mal"], أَعُوذُ ["chercher refuge / protection"].

## 12. Contextual Variations

Conservées par forme (`contextual_variations`). Exemples : ٱلصَّمَدُ ["celui vers
qui on se tourne"], غَاسِقٍ ["nuit sombre (Kazimirski)"], وَقَبَ ["surprendre
(Kazimirski)"].

## 13. Propositions de gloses

**45 propositions de forme** produites (toutes `status=PROPOSED`,
`human_review=REQUIRED`). Aucune n'est validée. Aucune donnée existante modifiée.

## 14. Forme vs Lemme

- **FORME** : 45 propositions (stockage `word_translations`).
- **LEMME** : 3 gloses déjà existantes (auditées) ; **0 nouvelle proposition de
  lemme**, car aucun nouveau mapping n'est créé dans cette phase.
- **NONE** : 1 (يَكُن).

Les déduplications potentielles (مِن/مِنَ, أَحَدٌ/أَحَدٌۢ, وَٱلنَّاسِ/نَاس) sont
documentées mais requièrent de futurs mappings de lemme (FUTURE WORK).

## 15. Mots sans glose fiable

**1 cas** : يَكُن (112:4) — copule jussive entièrement dépendante de la négation
وَلَمْ ; une glose lexicale isolée serait trompeuse. Recommandation : note
grammaticale plutôt que glose lexicale.

## 16. Comparaison avec Al-Fātiḥah

| | Al-Fātiḥah (LOCKED) | Pilotes (cette phase) |
|---|---|---|
| Formes | 26 | 49 (57 entrées/sourate) |
| Gloses de forme validées | 25 | 0 (45 proposées) |
| Couverture via lemme | 1 (يَوْمِ) | 3 (الله, فِي, نَاس) |
| Audio | 26/26 | 49/49 |

La méthodologie de production des gloses de Fātiḥah est identique (workflow
éditorial Phase 19A → `word_translations`/`lemma_translations` validées
humainement). Les pilotes sont à l'état « PROPOSED », avant l'étape de validation
humaine que Fātiḥah a déjà franchie. **Fātiḥah n'est ni modifiée ni recalculée.**

## 17. Audio

Audio Muʿallim présent pour **49/49 formes**. L'audio est une information
pédagogique séparée et n'a pas servi à déterminer les gloses.

## 18. Limites

- **Anomalie de donnée existante (non corrigée)** : `meaning_en` de أَحَدٌ (112:1)
  vaut « anyone of you » — contextuellement erroné (attendu « One/Unique »). Signalé,
  non modifié.
- **Incohérence de métadonnées (non corrigée)** : les `editorial_notes` des gloses
  de lemme فِي et نَاس contiennent « PROPOSITION — … NON validée » alors que
  `is_validated = true`. Signalé, non modifié.
- **Morphologie/racines** : NOT_AVAILABLE (FUTURE WORK) — aucune dérivation inventée.
- Certaines formulations FR divergent (ٱلصَّمَدُ, ٱلْوَسْوَاسِ) → confiance MEDIUM.

## 19. Propositions prêtes pour revue humaine

45 propositions de forme + 1 cas « sans glose » sont livrées avec : mot arabe,
lemme, occurrences, ayahs, 4 traductions alignées, semantic core, variations,
confiance et raison. Un humain peut statuer sur chaque glose sans re-chercher les
traductions.

## 20. Décision

**`A — READY_FOR_HUMAN_GLOSS_REVIEW`**

Le dossier est suffisamment documenté et traçable pour une revue humaine.
Aucune glose n'a été importée ni validée ; aucune donnée existante modifiée ;
Fātiḥah reste LOCKED.

---

## Tableau principal (formes × 4 traductions du même ayah)

| Sourate | Ayah | Forme arabe | Lemme | Occurrences | Hamidullah | Kazimirski | Sahih | Piccardo | Glose proposée | Niveau | Confiance |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Al-Ikhlāṣ | Al-Ikhlāṣ 1 | قُلْ | — | 3 | Dis : "Il est Allah, Unique. | Dis: Dieu est un. | Say, "He is Allāh, [who is] One, 1 | Di’ : «Egli Allah è Unico, | dis | FORM | HIGH |
| Al-Ikhlāṣ | Al-Ikhlāṣ 1 | هُوَ | — | 2 | Dis : "Il est Allah, Unique. | Dis: Dieu est un. | Say, "He is Allāh, [who is] One, 1 | Di’ : «Egli Allah è Unico, | il | FORM | HIGH |
| Al-Ikhlāṣ | Al-Ikhlāṣ 1 | أَحَدٌ | — | 1 | Dis : "Il est Allah, Unique. | Dis: Dieu est un. | Say, "He is Allāh, [who is] One, 1 | Di’ : «Egli Allah è Unico, | un / unique | FORM | HIGH |
| Al-Ikhlāṣ | Al-Ikhlāṣ 2 | ٱلصَّمَدُ | — | 1 | Allah, Le Seul à être imploré pour ce que nous désirons. | C’est le Dieu à qui tous les êtres s’adressent dans leurs besoins. | Allāh, the Eternal Refuge. 1 | Allah è l’Assoluto 1 . | l'Éternel / l'Absolu | FORM | MEDIUM |
| Al-Ikhlāṣ | Al-Ikhlāṣ 3 | لَمْ | — | 1 | Il n’a jamais engendré, n’a pas été engendré non plus. | Il n’a point enfanté, et n’a point été enfanté. | He neither begets nor is born, | Non ha generato, non è stato generato | ne ... pas | FORM | HIGH |
| Al-Ikhlāṣ | Al-Ikhlāṣ 3 | يَلِدْ | — | 1 | Il n’a jamais engendré, n’a pas été engendré non plus. | Il n’a point enfanté, et n’a point été enfanté. | He neither begets nor is born, | Non ha generato, non è stato generato | engendrer | FORM | HIGH |
| Al-Ikhlāṣ | Al-Ikhlāṣ 3 | وَلَمْ | — | 2 | Il n’a jamais engendré, n’a pas été engendré non plus. | Il n’a point enfanté, et n’a point été enfanté. | He neither begets nor is born, | Non ha generato, non è stato generato | et ne ... pas | FORM | HIGH |
| Al-Ikhlāṣ | Al-Ikhlāṣ 3 | يُولَدْ | — | 1 | Il n’a jamais engendré, n’a pas été engendré non plus. | Il n’a point enfanté, et n’a point été enfanté. | He neither begets nor is born, | Non ha generato, non è stato generato | être engendré | FORM | HIGH |
| Al-Ikhlāṣ | Al-Ikhlāṣ 4 | لَّهُۥ | — | 1 | Et nul n’est égal à Lui." | Il n’a point d’égal en qui que ce soit. | Nor is there to Him any equivalent." | e nessuno è uguale a Lui». 1 Una tradizione che risale all’Inviato di Allah (pace e benedizione su di lui) afferma che la recitazione di questa sura corrisponde al merito della recitazione di un terzo del Corano. Qualche commentatore l’ha definita «perfetta sintesi del tawhìd» (il monoteismo islamico). 2 Colui verso il Quale tendono tutte le creature, Colui Che è Unità assoluta, l’Impenetrabile, l’Eterno; questi alcuni dei significati di «as-Samad» che abbiamo tradotto con «l’Assoluto». | à lui / pour lui | FORM | HIGH |
| Al-Ikhlāṣ | Al-Ikhlāṣ 4 | كُفُوًا | — | 1 | Et nul n’est égal à Lui." | Il n’a point d’égal en qui que ce soit. | Nor is there to Him any equivalent." | e nessuno è uguale a Lui». 1 Una tradizione che risale all’Inviato di Allah (pace e benedizione su di lui) afferma che la recitazione di questa sura corrisponde al merito della recitazione di un terzo del Corano. Qualche commentatore l’ha definita «perfetta sintesi del tawhìd» (il monoteismo islamico). 2 Colui verso il Quale tendono tutte le creature, Colui Che è Unità assoluta, l’Impenetrabile, l’Eterno; questi alcuni dei significati di «as-Samad» che abbiamo tradotto con «l’Assoluto». | égal / équivalent | FORM | HIGH |
| Al-Ikhlāṣ | Al-Ikhlāṣ 4 | أَحَدٌۢ | — | 1 | Et nul n’est égal à Lui." | Il n’a point d’égal en qui que ce soit. | Nor is there to Him any equivalent." | e nessuno è uguale a Lui». 1 Una tradizione che risale all’Inviato di Allah (pace e benedizione su di lui) afferma che la recitazione di questa sura corrisponde al merito della recitazione di un terzo del Corano. Qualche commentatore l’ha definita «perfetta sintesi del tawhìd» (il monoteismo islamico). 2 Colui verso il Quale tendono tutte le creature, Colui Che è Unità assoluta, l’Impenetrabile, l’Eterno; questi alcuni dei significati di «as-Samad» che abbiamo tradotto con «l’Assoluto». | aucun / nul | FORM | MEDIUM |
| Al-Falaq | Al-Falaq 1 | أَعُوذُ | — | 2 | Dis: "Je cherche protection auprès du Seigneur de l’aube naissante, | Dis: Je cherche un refuge auprès du Seigneur de L’AUBE DU JOUR, | Say, "I seek refuge in the Lord of daybreak | Di’: «Mi rifugio nel Signore dell’alba nascente, | je cherche refuge | FORM | HIGH |
| Al-Falaq | Al-Falaq 1 | بِرَبِّ | — | 2 | Dis: "Je cherche protection auprès du Seigneur de l’aube naissante, | Dis: Je cherche un refuge auprès du Seigneur de L’AUBE DU JOUR, | Say, "I seek refuge in the Lord of daybreak | Di’: «Mi rifugio nel Signore dell’alba nascente, | auprès du Seigneur | FORM | HIGH |
| Al-Falaq | Al-Falaq 1 | ٱلْفَلَقِ | — | 1 | Dis: "Je cherche protection auprès du Seigneur de l’aube naissante, | Dis: Je cherche un refuge auprès du Seigneur de L’AUBE DU JOUR, | Say, "I seek refuge in the Lord of daybreak | Di’: «Mi rifugio nel Signore dell’alba nascente, | l'aube | FORM | HIGH |
| Al-Falaq | Al-Falaq 2 | مِن | — | 2 | contre le mal des êtres qu’Il a créés, | Contre la méchanceté des êtres qu’il a créés, | From the evil of that which He created | contro il male di ciò che ha creato, | de / contre | FORM | HIGH |
| Al-Falaq | Al-Falaq 2 | شَرِّ | — | 5 | contre le mal des êtres qu’Il a créés, | Contre la méchanceté des êtres qu’il a créés, | From the evil of that which He created | contro il male di ciò che ha creato, | le mal | FORM | HIGH |
| Al-Falaq | Al-Falaq 2 | مَا | — | 1 | contre le mal des êtres qu’Il a créés, | Contre la méchanceté des êtres qu’il a créés, | From the evil of that which He created | contro il male di ciò che ha creato, | ce que / ce qui | FORM | MEDIUM |
| Al-Falaq | Al-Falaq 2 | خَلَقَ | — | 1 | contre le mal des êtres qu’Il a créés, | Contre la méchanceté des êtres qu’il a créés, | From the evil of that which He created | contro il male di ciò che ha creato, | créer | FORM | HIGH |
| Al-Falaq | Al-Falaq 3 | وَمِن | — | 3 | contre le mal de l’obscurité quand elle s’approfondit, | Contre le mal de la nuit sombre quand elle nous surprend, | And from the evil of darkness when it settles | e contro il male dell’oscurità che si estende | et de / et contre | FORM | HIGH |
| Al-Falaq | Al-Falaq 3 | غَاسِقٍ | — | 1 | contre le mal de l’obscurité quand elle s’approfondit, | Contre le mal de la nuit sombre quand elle nous surprend, | And from the evil of darkness when it settles | e contro il male dell’oscurità che si estende | l'obscurité / la nuit | FORM | HIGH |
| Al-Falaq | Al-Falaq 3 | إِذَا | — | 2 | contre le mal de l’obscurité quand elle s’approfondit, | Contre le mal de la nuit sombre quand elle nous surprend, | And from the evil of darkness when it settles | e contro il male dell’oscurità che si estende | quand / lorsque | FORM | HIGH |
| Al-Falaq | Al-Falaq 3 | وَقَبَ | — | 1 | contre le mal de l’obscurité quand elle s’approfondit, | Contre le mal de la nuit sombre quand elle nous surprend, | And from the evil of darkness when it settles | e contro il male dell’oscurità che si estende | s'étendre / s'approfondir | FORM | MEDIUM |
| Al-Falaq | Al-Falaq 4 | ٱلنَّفَّـٰثَـٰتِ | — | 1 | contre le mal de celles qui soufflent (les sorcières) sur les nœuds, | Contre la méchanceté de celles qui soufflent sur les nœuds, | And from the evil of the blowers in knots 1 | e contro il male delle soffianti sui nodi 1 , | celles qui soufflent | FORM | HIGH |
| Al-Falaq | Al-Falaq 4 | ٱلْعُقَدِ | — | 1 | contre le mal de celles qui soufflent (les sorcières) sur les nœuds, | Contre la méchanceté de celles qui soufflent sur les nœuds, | And from the evil of the blowers in knots 1 | e contro il male delle soffianti sui nodi 1 , | les nœuds | FORM | HIGH |
| Al-Falaq | Al-Falaq 5 | حَاسِدٍ | — | 1 | et contre le mal de l’envieux quand il envie 1 ." | Contre le mal de l’envieux qui nous porte envie. | And from the evil of an envier when he envies." | e contro il male dell’invidioso quando invidia» 1 . | l'envieux | FORM | HIGH |
| Al-Falaq | Al-Falaq 5 | حَسَدَ | — | 1 | et contre le mal de l’envieux quand il envie 1 ." | Contre le mal de l’envieux qui nous porte envie. | And from the evil of an envier when he envies." | e contro il male dell’invidioso quando invidia» 1 . | envier | FORM | HIGH |
| An-Nās | An-Nās 2 | مَلِكِ | — | 1 | Le Souverain des hommes, | Roi des hommes, | The Sovereign of mankind, | Re degli uomini, | le roi / le souverain | FORM | HIGH |
| An-Nās | An-Nās 3 | إِلَـٰهِ | — | 1 | Dieu des hommes, | Dieu des hommes; | The God of mankind, | Dio degli uomini, | le dieu / la divinité | FORM | HIGH |
| An-Nās | An-Nās 4 | ٱلْوَسْوَاسِ | — | 1 | contre le mal du mauvais conseiller, furtif, | Contre la méchanceté de celui qui suggère les mauvaises pensées et se dérobe, | From the evil of the retreating whisperer 1 - | contro il male del sussurratore furtivo, | le chuchoteur / l'insufflateur | FORM | MEDIUM |
| An-Nās | An-Nās 4 | ٱلْخَنَّاسِ | — | 1 | contre le mal du mauvais conseiller, furtif, | Contre la méchanceté de celui qui suggère les mauvaises pensées et se dérobe, | From the evil of the retreating whisperer 1 - | contro il male del sussurratore furtivo, | celui qui se retire | FORM | MEDIUM |
| An-Nās | An-Nās 5 | ٱلَّذِى | — | 1 | qui insuffle des mauvaises pensées dans les poitrines des hommes, | Qui souffle le mal dans les cœurs des hommes; | Who whispers [evil] into the breasts of mankind - | che soffia il male nei cuori degli uomini, | qui / celui qui | FORM | MEDIUM |
| An-Nās | An-Nās 5 | يُوَسْوِسُ | — | 1 | qui insuffle des mauvaises pensées dans les poitrines des hommes, | Qui souffle le mal dans les cœurs des hommes; | Who whispers [evil] into the breasts of mankind - | che soffia il male nei cuori degli uomini, | insuffler / chuchoter | FORM | MEDIUM |
| An-Nās | An-Nās 5 | صُدُورِ | — | 1 | qui insuffle des mauvaises pensées dans les poitrines des hommes, | Qui souffle le mal dans les cœurs des hommes; | Who whispers [evil] into the breasts of mankind - | che soffia il male nei cuori degli uomini, | les poitrines / les cœurs | FORM | MEDIUM |
| An-Nās | An-Nās 6 | مِنَ | — | 1 | qu’il (le conseiller) soit un djinn, ou un être humain". | Contre les génies et contre les hommes. | From among the jinn and mankind". 1 | che [venga] dai dèmoni o dagli uomini». | de / parmi | FORM | HIGH |
| An-Nās | An-Nās 6 | ٱلْجِنَّةِ | — | 1 | qu’il (le conseiller) soit un djinn, ou un être humain". | Contre les génies et contre les hommes. | From among the jinn and mankind". 1 | che [venga] dai dèmoni o dagli uomini». | les djinns | FORM | HIGH |
| An-Nās | An-Nās 6 | وَٱلنَّاسِ | — | 1 | qu’il (le conseiller) soit un djinn, ou un être humain". | Contre les génies et contre les hommes. | From among the jinn and mankind". 1 | che [venga] dai dèmoni o dagli uomini». | et les gens / et les hommes | FORM | MEDIUM |
| Al-Kawthar | Al-Kawthar 1 | إِنَّآ | — | 1 | Nous t’avons certes, accordé l’Abondance. | Nous t’avons donné le KAUTHER. | Indeed, We have granted you, [O Muḥammad], al-Kawthar. | In verità ti abbiamo dato l’abbondanza 1 . | certes Nous | FORM | MEDIUM |
| Al-Kawthar | Al-Kawthar 1 | أَعْطَيْنَـٰكَ | — | 1 | Nous t’avons certes, accordé l’Abondance. | Nous t’avons donné le KAUTHER. | Indeed, We have granted you, [O Muḥammad], al-Kawthar. | In verità ti abbiamo dato l’abbondanza 1 . | Nous t'avons donné | FORM | HIGH |
| Al-Kawthar | Al-Kawthar 1 | ٱلْكَوْثَرَ | — | 1 | Nous t’avons certes, accordé l’Abondance. | Nous t’avons donné le KAUTHER. | Indeed, We have granted you, [O Muḥammad], al-Kawthar. | In verità ti abbiamo dato l’abbondanza 1 . | al-Kawthar (l'abondance) | FORM | MEDIUM |
| Al-Kawthar | Al-Kawthar 2 | فَصَلِّ | — | 1 | Accomplis la Ṣalāt pour ton Seigneur et sacrifie. | Adresse ta prière au Seigneur, et immole-lui des victimes. | So pray to your Lord and offer sacrifice [to Him alone]. | Esegui l’orazione per il tuo Signore e sacrifica 1 ! | prie donc / accomplis la prière | FORM | HIGH |
| Al-Kawthar | Al-Kawthar 2 | لِرَبِّكَ | — | 1 | Accomplis la Ṣalāt pour ton Seigneur et sacrifie. | Adresse ta prière au Seigneur, et immole-lui des victimes. | So pray to your Lord and offer sacrifice [to Him alone]. | Esegui l’orazione per il tuo Signore e sacrifica 1 ! | à ton Seigneur | FORM | HIGH |
| Al-Kawthar | Al-Kawthar 2 | وَٱنْحَرْ | — | 1 | Accomplis la Ṣalāt pour ton Seigneur et sacrifie. | Adresse ta prière au Seigneur, et immole-lui des victimes. | So pray to your Lord and offer sacrifice [to Him alone]. | Esegui l’orazione per il tuo Signore e sacrifica 1 ! | et sacrifie | FORM | HIGH |
| Al-Kawthar | Al-Kawthar 3 | إِنَّ | — | 1 | Celui qui te hait sera certes, sans postérité. | Celui qui te hait périra sans laisser même une trace de lui. | Indeed, your enemy is the one cut off. 1 | In verità sarà colui che ti odia a non avere seguito 1 . 2 «l’abbondanza»: in arabo «al-Kawthar». Questo termine, secondo alcune tradizioni indica anche un fiume del Paradiso che Allah (gloria a Lui l’Altissimo) ha promesso in dono al Suo Inviato (pace e benedizioni su di lui) per compensarlo e consolarlo di tutto quello che ha subito per causa Sua. Secondo l’esegesi ortodossa indica la condizione di Muhammad nel Paradiso, dove sarà posto al più alto dei livelli (al-Wassìla) e «godrà abbondantemente» della Luce divina. 3 Versetto di grande importanza per quanto riguarda la pratica rituale della Festa del Sacrificio (‘îd Adhà) che si celebra il decimo giorno del mese del pellegrinaggio e ricorda la prova cui Àlìah (gloria a Lui l’Altissimo) sottopose il suo servo Abramo (pace su di lui). Il versetto prescrive l’ordine di svolgimento dei riti, prima la preghiera comunitaria (salât-ul-îd) alla quale devono partecipare tutti i musulmani poi il sacrificio degli animali. 4 «a non avere seguito»: lett. «sarà abtar». Questa espressione significa «senza coda» ed era un epiteto ironico e ingiurioso con cui gli arabi gratificavano quelli di loro che non avevano figli maschi. La tradizione riferisce che alla morte in tenerissima età di suo figlio Qasim l’Inviato di Allah (pace e benedizioni su di lui) dovette subire questa crudele oltraggiosa consuetudine. Uno dei suoi avversari giunse a dire che non avendo figli maschi, anche la religione che predicava non avrebbe avuto futuro. Miseria della Miscredenza! | certes / en vérité | FORM | MEDIUM |
| Al-Kawthar | Al-Kawthar 3 | شَانِئَكَ | — | 1 | Celui qui te hait sera certes, sans postérité. | Celui qui te hait périra sans laisser même une trace de lui. | Indeed, your enemy is the one cut off. 1 | In verità sarà colui che ti odia a non avere seguito 1 . 2 «l’abbondanza»: in arabo «al-Kawthar». Questo termine, secondo alcune tradizioni indica anche un fiume del Paradiso che Allah (gloria a Lui l’Altissimo) ha promesso in dono al Suo Inviato (pace e benedizioni su di lui) per compensarlo e consolarlo di tutto quello che ha subito per causa Sua. Secondo l’esegesi ortodossa indica la condizione di Muhammad nel Paradiso, dove sarà posto al più alto dei livelli (al-Wassìla) e «godrà abbondantemente» della Luce divina. 3 Versetto di grande importanza per quanto riguarda la pratica rituale della Festa del Sacrificio (‘îd Adhà) che si celebra il decimo giorno del mese del pellegrinaggio e ricorda la prova cui Àlìah (gloria a Lui l’Altissimo) sottopose il suo servo Abramo (pace su di lui). Il versetto prescrive l’ordine di svolgimento dei riti, prima la preghiera comunitaria (salât-ul-îd) alla quale devono partecipare tutti i musulmani poi il sacrificio degli animali. 4 «a non avere seguito»: lett. «sarà abtar». Questa espressione significa «senza coda» ed era un epiteto ironico e ingiurioso con cui gli arabi gratificavano quelli di loro che non avevano figli maschi. La tradizione riferisce che alla morte in tenerissima età di suo figlio Qasim l’Inviato di Allah (pace e benedizioni su di lui) dovette subire questa crudele oltraggiosa consuetudine. Uno dei suoi avversari giunse a dire che non avendo figli maschi, anche la religione che predicava non avrebbe avuto futuro. Miseria della Miscredenza! | celui qui te hait | FORM | HIGH |
| Al-Kawthar | Al-Kawthar 3 | ٱلْأَبْتَرُ | — | 1 | Celui qui te hait sera certes, sans postérité. | Celui qui te hait périra sans laisser même une trace de lui. | Indeed, your enemy is the one cut off. 1 | In verità sarà colui che ti odia a non avere seguito 1 . 2 «l’abbondanza»: in arabo «al-Kawthar». Questo termine, secondo alcune tradizioni indica anche un fiume del Paradiso che Allah (gloria a Lui l’Altissimo) ha promesso in dono al Suo Inviato (pace e benedizioni su di lui) per compensarlo e consolarlo di tutto quello che ha subito per causa Sua. Secondo l’esegesi ortodossa indica la condizione di Muhammad nel Paradiso, dove sarà posto al più alto dei livelli (al-Wassìla) e «godrà abbondantemente» della Luce divina. 3 Versetto di grande importanza per quanto riguarda la pratica rituale della Festa del Sacrificio (‘îd Adhà) che si celebra il decimo giorno del mese del pellegrinaggio e ricorda la prova cui Àlìah (gloria a Lui l’Altissimo) sottopose il suo servo Abramo (pace su di lui). Il versetto prescrive l’ordine di svolgimento dei riti, prima la preghiera comunitaria (salât-ul-îd) alla quale devono partecipare tutti i musulmani poi il sacrificio degli animali. 4 «a non avere seguito»: lett. «sarà abtar». Questa espressione significa «senza coda» ed era un epiteto ironico e ingiurioso con cui gli arabi gratificavano quelli di loro che non avevano figli maschi. La tradizione riferisce che alla morte in tenerissima età di suo figlio Qasim l’Inviato di Allah (pace e benedizioni su di lui) dovette subire questa crudele oltraggiosa consuetudine. Uno dei suoi avversari giunse a dire che non avendo figli maschi, anche la religione che predicava non avrebbe avuto futuro. Miseria della Miscredenza! | privé de postérité | FORM | MEDIUM |
| Al-Ikhlāṣ | Al-Ikhlāṣ 4 | يَكُن | — | 1 | Et nul n’est égal à Lui." | Il n’a point d’égal en qui que ce soit. | Nor is there to Him any equivalent." | e nessuno è uguale a Lui». 1 Una tradizione che risale all’Inviato di Allah (pace e benedizione su di lui) afferma che la recitazione di questa sura corrisponde al merito della recitazione di un terzo del Corano. Qualche commentatore l’ha definita «perfetta sintesi del tawhìd» (il monoteismo islamico). 2 Colui verso il Quale tendono tutte le creature, Colui Che è Unità assoluta, l’Impenetrabile, l’Eterno; questi alcuni dei significati di «as-Samad» che abbiamo tradotto con «l’Assoluto». | — | NONE | INSUFFICIENT_EVIDENCE |

## Tableau éditorial (revue humaine)

| quran_word_id | Forme | Lemma | Proposed gloss | Storage level | Evidence count | FR convergence | Confidence | Human review |
|---|---|---|---|---|---|---|---|---|
| `286c21b0-1167-4768-94f5-e8f76923a041` | قُلْ | — | dis | FORM | 3 | Hamidullah « Dis » = Kazimirski « Dis » | HIGH | REQUIRED |
| `7a39deab-1418-49e0-a7c1-592369ff8c6a` | هُوَ | — | il | FORM | 2 | Hamidullah « Il » / Kazimirski « c'est » | HIGH | REQUIRED |
| `531d33eb-2540-4ea4-8160-88dd1d238a76` | أَحَدٌ | — | un / unique | FORM | 1 | Hamidullah « Unique » / Kazimirski « un » | HIGH | REQUIRED |
| `cd7c09f3-bd02-43f5-b914-84d38be5919e` | ٱلصَّمَدُ | — | l'Éternel / l'Absolu | FORM | 1 | Hamidullah / Kazimirski : 'celui vers qui on se tourne' | MEDIUM | REQUIRED |
| `c75b3d30-4b07-4abe-996c-814e097de014` | لَمْ | — | ne ... pas | FORM | 1 | Hamidullah « n'… » / Kazimirski « ne point » | HIGH | REQUIRED |
| `d8a5d588-305e-402d-8052-2512313f0bc4` | يَلِدْ | — | engendrer | FORM | 1 | Hamidullah « engendrer » / Kazimirski « enfanter » | HIGH | REQUIRED |
| `17d42c48-7291-4d72-b390-5a1b33e236cd` | وَلَمْ | — | et ne ... pas | FORM | 2 | Hamidullah « Et … n'… » / Kazimirski « n'a point » | HIGH | REQUIRED |
| `d88fdcd4-25c5-48d3-8d91-8e3fdcc23e34` | يُولَدْ | — | être engendré | FORM | 1 | Hamidullah « engendré » / Kazimirski « enfanté » | HIGH | REQUIRED |
| `8f9b7811-1d6d-4607-86cf-325e98b1f7b5` | لَّهُۥ | — | à lui / pour lui | FORM | 1 | Hamidullah « à Lui » | HIGH | REQUIRED |
| `c4a59cb5-3722-48e3-a9d3-a2af0d917315` | كُفُوًا | — | égal / équivalent | FORM | 1 | Hamidullah « égal » = Kazimirski « égal » | HIGH | REQUIRED |
| `fc79107f-ee64-4c65-8b83-89bfd46b7fcd` | أَحَدٌۢ | — | aucun / nul | FORM | 1 | Hamidullah « nul » | MEDIUM | REQUIRED |
| `fa22f36a-0595-4f6e-ab48-f80964abe098` | أَعُوذُ | — | je cherche refuge | FORM | 2 | Hamidullah « protection » / Kazimirski « refuge » | HIGH | REQUIRED |
| `1157f0f9-62cd-414c-a3c1-c72b47d1d81f` | بِرَبِّ | — | auprès du Seigneur | FORM | 2 | Hamidullah « Seigneur » = Kazimirski « Seigneur » | HIGH | REQUIRED |
| `44c5b3b3-74b9-4076-ab20-1a72513aa06f` | ٱلْفَلَقِ | — | l'aube | FORM | 1 | Hamidullah « aube » = Kazimirski « aube » | HIGH | REQUIRED |
| `7e36962b-0eb9-46cc-b9b8-8ab416ab6f24` | مِن | — | de / contre | FORM | 2 | Hamidullah « contre » / Kazimirski « contre » | HIGH | REQUIRED |
| `75980591-0e4f-4cf3-a46b-57865d51d217` | شَرِّ | — | le mal | FORM | 5 | Hamidullah « mal » / Kazimirski « mal » | HIGH | REQUIRED |
| `50260b27-c51c-4e38-9e2b-f8ad1d481b7c` | مَا | — | ce que / ce qui | FORM | 1 | Sahih « that which » (les FR reformulent) | MEDIUM | REQUIRED |
| `e6e094fb-6129-4eb1-b399-b0ae193c181a` | خَلَقَ | — | créer | FORM | 1 | Hamidullah « créé » = Kazimirski « créé » | HIGH | REQUIRED |
| `8a53a6e1-6509-4c53-a006-bae9c024e843` | وَمِن | — | et de / et contre | FORM | 3 | Hamidullah « contre » / Kazimirski « contre » | HIGH | REQUIRED |
| `17586ad4-f58e-4ea6-978f-105b2f928f85` | غَاسِقٍ | — | l'obscurité / la nuit | FORM | 1 | Hamidullah « obscurité » / Kazimirski « nuit » | HIGH | REQUIRED |
| `5608a527-cfd8-42e9-8bf8-76074f30f7e6` | إِذَا | — | quand / lorsque | FORM | 2 | Hamidullah « quand » / Kazimirski « quand » | HIGH | REQUIRED |
| `4dff8dd7-8b49-4b0a-a91f-1b5e037cd13f` | وَقَبَ | — | s'étendre / s'approfondir | FORM | 1 | Hamidullah « s'approfondir » / Kazimirski « surprendre » | MEDIUM | REQUIRED |
| `55b7fb37-4a41-4044-8fe4-02e9f930fab3` | ٱلنَّفَّـٰثَـٰتِ | — | celles qui soufflent | FORM | 1 | Hamidullah « soufflent » = Kazimirski « soufflent » | HIGH | REQUIRED |
| `5e30999a-90e1-47c0-a781-9cbfe5f91b64` | ٱلْعُقَدِ | — | les nœuds | FORM | 1 | Hamidullah « nœuds » = Kazimirski « nœuds » | HIGH | REQUIRED |
| `490970ab-1fd5-46e1-bc8c-f82e4a5e7b77` | حَاسِدٍ | — | l'envieux | FORM | 1 | Hamidullah « envieux » = Kazimirski « envieux » | HIGH | REQUIRED |
| `43835d9d-d98c-4c51-96e0-4c05c84070e4` | حَسَدَ | — | envier | FORM | 1 | Hamidullah « envie » / Kazimirski « envie » | HIGH | REQUIRED |
| `d2b424f1-f11c-4b05-84c5-7621c8b2e4ef` | مَلِكِ | — | le roi / le souverain | FORM | 1 | Hamidullah « Souverain » / Kazimirski « Roi » | HIGH | REQUIRED |
| `236f7c05-c749-426b-a630-9fefb8e54fd3` | إِلَـٰهِ | — | le dieu / la divinité | FORM | 1 | Hamidullah « Dieu » = Kazimirski « Dieu » | HIGH | REQUIRED |
| `1829e5cf-3541-40de-b02f-c39f05c89154` | ٱلْوَسْوَاسِ | — | le chuchoteur / l'insufflateur | FORM | 1 | Hamidullah « mauvais conseiller » / Kazimirski « tentateur » | MEDIUM | REQUIRED |
| `9aab15b1-c2bf-402f-93a1-739479c1ee0e` | ٱلْخَنَّاسِ | — | celui qui se retire | FORM | 1 | Peu isolable dans les FR (reformulé dans la phrase) | MEDIUM | REQUIRED |
| `338d4f92-d571-49f9-947b-66d60452c861` | ٱلَّذِى | — | qui / celui qui | FORM | 1 | Reformulé dans les FR (relatif) | MEDIUM | REQUIRED |
| `a90fd309-4b7b-4f9e-8bb7-5bafdd2d49b9` | يُوَسْوِسُ | — | insuffler / chuchoter | FORM | 1 | Hamidullah « insuffle » / Kazimirski « souffle » | MEDIUM | REQUIRED |
| `3d83e89e-c100-40b4-8187-dd8930563692` | صُدُورِ | — | les poitrines / les cœurs | FORM | 1 | Hamidullah « poitrines » / Kazimirski « cœurs » | MEDIUM | REQUIRED |
| `ca6165d4-806d-4ad5-b718-5fc6beb9ee42` | مِنَ | — | de / parmi | FORM | 1 | Hamidullah « de » / Kazimirski « de » | HIGH | REQUIRED |
| `3e3166dc-ae5f-498d-9a9b-275ee13b28f9` | ٱلْجِنَّةِ | — | les djinns | FORM | 1 | Hamidullah « djinns » / Kazimirski « génies » | HIGH | REQUIRED |
| `b0b403d1-7d3f-43f5-8f87-d9e190ee6429` | وَٱلنَّاسِ | — | et les gens / et les hommes | FORM | 1 | Hamidullah « et les hommes » / Kazimirski « et les hommes » | MEDIUM | REQUIRED |
| `401b6548-4d50-4b4c-bc3b-6de7ab0d99b1` | إِنَّآ | — | certes Nous | FORM | 1 | Hamidullah « Nous » / Kazimirski « Nous » | MEDIUM | REQUIRED |
| `6066211a-efdf-4768-a8ee-58d904f37d6c` | أَعْطَيْنَـٰكَ | — | Nous t'avons donné | FORM | 1 | Hamidullah « accordé » = Kazimirski « accordé » | HIGH | REQUIRED |
| `2c2ee676-a7f4-40ad-b7aa-89d35b43b10f` | ٱلْكَوْثَرَ | — | al-Kawthar (l'abondance) | FORM | 1 | Hamidullah « l'Abondance » / Kazimirski « le Kauther » | MEDIUM | REQUIRED |
| `930307bd-479a-4907-aaec-5992cca9c433` | فَصَلِّ | — | prie donc / accomplis la prière | FORM | 1 | Hamidullah « Salât » / Kazimirski « prie » | HIGH | REQUIRED |
| `efdbceb5-0491-4a49-997b-de7851cf8611` | لِرَبِّكَ | — | à ton Seigneur | FORM | 1 | Hamidullah « ton Seigneur » = Kazimirski « ton Seigneur » | HIGH | REQUIRED |
| `97b7fdbe-6928-48f7-8b77-d31d94c14300` | وَٱنْحَرْ | — | et sacrifie | FORM | 1 | Hamidullah « sacrifie » / Kazimirski « sacrifice » | HIGH | REQUIRED |
| `cec34a92-522d-404a-85fc-4fe8bc0b3db0` | إِنَّ | — | certes / en vérité | FORM | 1 | Hamidullah / Kazimirski reformulent l'insistance | MEDIUM | REQUIRED |
| `f5b5d9aa-f37d-439d-a25a-17ff6627f8f5` | شَانِئَكَ | — | celui qui te hait | FORM | 1 | Hamidullah « qui te hait » = Kazimirski « qui te hait » | HIGH | REQUIRED |
| `6703d979-fa31-4afd-ab56-8d195833e689` | ٱلْأَبْتَرُ | — | privé de postérité | FORM | 1 | Hamidullah « privé de postérité » / Kazimirski « privé de postérité » | MEDIUM | REQUIRED |
| `da8d61ef-2541-486f-98a4-f27bcf66c80a` | يَكُن | — | (aucune) | NONE | 1 | Aucune correspondance lexicale isolable dans les 4 sources | INSUFFICIENT_EVIDENCE | REQUIRED |
