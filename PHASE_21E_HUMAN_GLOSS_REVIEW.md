# PHASE 21E — HUMAN GLOSS REVIEW

## 1. Executive Summary

Revue éditoriale **strictement READ_ONLY** des 46 propositions Phase 21D
(45 gloses de forme + 1 cas sans glose). Chaque proposition a été revérifiée
contre le **mot arabe** et les **4 traductions alignées par ayah**.

**Décision finale : `B — HUMAN_REVIEW_REMAINS`**

| Décision | Nombre |
|---|---|
| ACCEPT | **40** |
| MODIFY | **4** |
| REJECT | **0** |
| MOVE_TO_LEMMA | **1** |
| NEEDS_REVIEW | **1** |

- **45/46** propositions sont éditorialement décidées (ACCEPT / MODIFY /
  MOVE_TO_LEMMA) et candidates à l'import contrôlé de Phase 21F.
- **1** proposition (يَكُن, copule jussive) reste à trancher humainement.
- **3** gloses de lemme existantes (الله, فِي, نَاس) sont **PRESERVED** (auditées,
  non modifiées).
- **2 anomalies de données** sont **DEFERRED** (non corrigées).

Aucune écriture DB, aucun import, aucune validation, aucune migration, aucun seed.

## 2. Scope

- 57 entrées par sourate (21C) · 49 formes uniques · 68 occurrences.
- 45 propositions de glose de forme + 1 cas sans glose (يَكُن) = **46 entrées revues**.
- 3 gloses de lemme existantes auditées (PRESERVED).
- 2 anomalies de données documentées (DEFERRED).
- Al-Fātiḥah : FATIHAH_REFERENCE_LOCKED (non touchée).

## 3. Méthodologie

Pour chaque proposition : mot arabe → quran_word → lemme réel → toutes les
occurrences → ayah → 4 traductions alignées → vérification du semantic core, des
variations, de la glose, du niveau FORME/LEMME → décision éditoriale.

Les traductions sont des **évidences** ; la glose est une **synthèse pédagogique**
courte, lexicale, fidèle au mot arabe. Règles : sources FR prioritaires
(Hamidullah + Kazimirski), EN/IT en contrôle (jamais traduits automatiquement en FR).

## 4. Sources

| Source | resource_id | Langue | Rôle |
|---|---|---|---|
| Muhammad Hamidullah | 31 | FR | prioritaire |
| Kazimirski 1869 | 9001 | FR | prioritaire |
| Sahih International | 20 | EN | contrôle |
| Hamza Roberto Piccardo | 153 | IT | contrôle |

## 5. Inventaire des propositions

| Indicateur | Valeur |
|---|---|
| Entrées revues (propositions + cas sans glose) | 46 |
| Propositions de forme (21D) | 45 |
| Cas « sans glose » (21D) | 1 |
| Gloses de lemme existantes (auditées) | 3 |
| Audio Muʿallim | 49/49 |
| HIGH / MEDIUM / INSUFFICIENT (21D) | 31 / 14 / 1 |

## 6. Revue Al-Ikhlāṣ (112)

- **أَحَدٌ** → ACCEPT « un / unique »
- **أَحَدٌۢ** → MODIFY « un / quelqu'un (aucun dans la négation) »
- **قُلْ** → ACCEPT « dis »
- **كُفُوًا** → ACCEPT « égal / équivalent »
- **لَمْ** → ACCEPT « ne ... pas »
- **لَّهُۥ** → ACCEPT « à lui / pour lui »
- **هُوَ** → ACCEPT « il »
- **وَلَمْ** → ACCEPT « et ne ... pas »
- **يَكُن** → NEEDS_REVIEW
- **يَلِدْ** → ACCEPT « engendrer »
- **يُولَدْ** → ACCEPT « être engendré »
- **ٱلصَّمَدُ** → ACCEPT « l'Éternel / l'Absolu »

## 7. Revue Al-Falaq (113)

- **أَعُوذُ** → ACCEPT « je cherche refuge »
- **إِذَا** → ACCEPT « quand / lorsque »
- **بِرَبِّ** → ACCEPT « auprès du Seigneur »
- **حَاسِدٍ** → ACCEPT « l'envieux »
- **حَسَدَ** → ACCEPT « envier »
- **خَلَقَ** → ACCEPT « créer »
- **شَرِّ** → ACCEPT « le mal »
- **غَاسِقٍ** → ACCEPT « l'obscurité / la nuit »
- **قُلْ** → ACCEPT « dis »
- **مَا** → ACCEPT « ce que / ce qui »
- **مِن** → ACCEPT « de / contre »
- **وَقَبَ** → ACCEPT « s'étendre / s'approfondir »
- **وَمِن** → ACCEPT « et de / et contre »
- **ٱلنَّفَّـٰثَـٰتِ** → ACCEPT « celles qui soufflent »
- **ٱلْعُقَدِ** → ACCEPT « les nœuds »
- **ٱلْفَلَقِ** → ACCEPT « l'aube »

## 8. Revue An-Nās (114)

- **أَعُوذُ** → ACCEPT « je cherche refuge »
- **إِلَـٰهِ** → ACCEPT « le dieu / la divinité »
- **بِرَبِّ** → ACCEPT « auprès du Seigneur »
- **شَرِّ** → ACCEPT « le mal »
- **صُدُورِ** → ACCEPT « les poitrines / les cœurs »
- **قُلْ** → ACCEPT « dis »
- **مَلِكِ** → ACCEPT « le roi / le souverain »
- **مِن** → ACCEPT « de / contre »
- **مِنَ** → ACCEPT « de / parmi »
- **وَٱلنَّاسِ** → MOVE_TO_LEMMA « gens / hommes »
- **يُوَسْوِسُ** → MODIFY « insuffler / chuchoter (le mal) »
- **ٱلَّذِى** → ACCEPT « qui / celui qui »
- **ٱلْجِنَّةِ** → ACCEPT « les djinns »
- **ٱلْخَنَّاسِ** → ACCEPT « celui qui se retire »
- **ٱلْوَسْوَاسِ** → MODIFY « le chuchoteur (celui qui insuffle le mal) »

## 9. Revue Al-Kawthar (108)

- **أَعْطَيْنَـٰكَ** → ACCEPT « Nous t'avons donné »
- **إِنَّآ** → ACCEPT « certes Nous »
- **إِنَّ** → ACCEPT « certes / en vérité »
- **شَانِئَكَ** → ACCEPT « celui qui te hait »
- **فَصَلِّ** → ACCEPT « prie donc / accomplis la prière »
- **لِرَبِّكَ** → ACCEPT « à ton Seigneur »
- **هُوَ** → ACCEPT « il »
- **وَٱنْحَرْ** → ACCEPT « et sacrifie »
- **ٱلْأَبْتَرُ** → MODIFY « privé de postérité / sans descendance »
- **ٱلْكَوْثَرَ** → ACCEPT « al-Kawthar (l'abondance) »


## 10. Revue par lemme

Les 3 gloses de lemme existantes sont **PRESERVED** (cohérentes avec les évidences,
non modifiées, non supprimées, non réécrites) :

| Lemme | Glose | existing_status | review_note |
|---|---|---|---|
| الله | « Allah » | PRESERVED | Cohérent. Nom propre translittéré. |
| فِي | « dans / en / sur » | PRESERVED | Cohérent (113:4 « sur », 114:5 « dans »). |
| نَاس | « gens / hommes » | PRESERVED | Cohérent (114:1-3, 114:6). |

Note : **وَٱلنَّاسِ** (114:6) est la même racine que نَاس mais sans mapping →
décision **MOVE_TO_LEMMA** (cf. §14).

## 11. ACCEPT (40)

Glose validée telle quelle — correspond au mot arabe, évidences suffisantes,
convergence FR claire ou explicable, formulation pédagogiquement claire.

## 12. MODIFY (4)

| Forme | Glose 21D | Glose finale | Justification |
|---|---|---|---|
| أَحَدٌۢ | aucun / nul | un / quelqu'un (aucun dans la négation) | « aucun/nul » confondait la négation avec le mot (أَحَد = « un/quelqu'un »). |
| ٱلْوَسْوَاسِ | le chuchoteur / l'insufflateur | le chuchoteur (celui qui insuffle le mal) | Noyau « insuffler le mal » explicité. |
| يُوَسْوِسُ | insuffler / chuchoter | insuffler / chuchoter (le mal) | Complément d'objet « le mal » ajouté. |
| ٱلْأَبْتَرُ | privé de postérité | privé de postérité / sans descendance | Synonyme ajouté (Sahih « cut off », Piccardo « senza seguito »). |

## 13. REJECT (0)

Aucune proposition rejetée.

## 14. MOVE_TO_LEMMA (1)

| Forme | Lemme cible | Glose finale | Justification |
|---|---|---|---|
| وَٱلنَّاسِ | نَاس | gens / hommes | Même valeur lexicale que نَاس (lemme déjà glosé). En 21F : créer un word_lemma_mapping et réutiliser la glose existante au lieu d'une word_translation redondante. |

## 15. NEEDS_REVIEW (1)

| Forme | Situation | Candidat | Justification |
|---|---|---|---|
| يَكُن | copule jussive de كَانَ sous لَمْ (112:4) | « être (copule) » (non tranché) | Fonction grammaticale contextuelle ; une glose lexicale isolée peut être trompeuse. Décision humaine recommandée. |

## 16. Anomalies de données

| Forme | Type | Valeur actuelle | Action |
|---|---|---|---|
| أَحَدٌ | EXISTING_DATA_ANOMALY | `quran_words.meaning` = « anyone of you » (inadapté à 112:1) | DEFERRED |
| فِي / نَاس | VALIDATION_METADATA_INCONSISTENCY | `editorial_notes` contient « NON validée » alors que `is_validated = true` | DEFERRED |

Ces anomalies ne sont **pas corrigées** dans cette phase et ne servent pas de
justification aux gloses.

## 17. Gloses finales proposées

45 gloses finales sont prêtes (40 ACCEPT + 4 MODIFY + 1 MOVE_TO_LEMMA), détaillées
dans le tableau de revue et le tableau READY_FOR_IMPORT ci-dessous.

## 18. Résumé statistique

| Décision | Nombre | → Phase 21F |
|---|---|---|
| ACCEPT | 40 | word_translations |
| MODIFY | 4 | word_translations |
| MOVE_TO_LEMMA | 1 | word_lemma_mapping + lemma_translations (réutilisée) |
| NEEDS_REVIEW | 1 | bloqué (revue humaine) |
| REJECT | 0 | — |

## 19. État de préparation pour Phase 21F

**45/46** propositions sont **READY_FOR_IMPORT** (éditorialement approuvées dans ce
rapport). **1** proposition (يَكُن) est **BLOCKED_FOR_IMPORT**. **2** anomalies de
données sont **DEFERRED**.

La Phase 21F (import contrôlé) ne devra **rien importer** tant qu'un humain n'aura
pas validé explicitement ce dossier — et devra exclure يَكُن tant qu'il reste en
NEEDS_REVIEW.

---

## Tableau de revue (§30)

| # | Forme | Lemme | Sourate | Occurrences | Glose proposée | Confiance | Décision | Glose finale | Justification |
|---|---|---|---|---|---|---|---|---|---|
| 1 | أَحَدٌ | — | Al-Ikhlāṣ | 1 | un / unique | HIGH | ACCEPT | un / unique | 112:1. Hamidullah « Unique » = Kazimirski « un » = Sahih « One » = Piccardo « Unico ». |
| 2 | أَحَدٌۢ | — | Al-Ikhlāṣ | 1 | aucun / nul | MEDIUM | MODIFY | un / quelqu'un (aucun dans la négation) | 112:4 en négation وَلَمْ يَكُن. Même mot que أَحَدٌ ; « aucun / nul » (21D) confondait la négation avec le mot. Glose du mot « un / quelqu'un » + note négative. |
| 3 | أَعُوذُ | — | Al-Falaq, An-Nās | 2 | je cherche refuge | HIGH | ACCEPT | je cherche refuge | 113:1, 114:1. Hamidullah « Je cherche protection » / Kazimirski « Je cherche un refuge » / Sahih « I seek refuge ». |
| 4 | أَعْطَيْنَـٰكَ | — | Al-Kawthar | 1 | Nous t'avons donné | HIGH | ACCEPT | Nous t'avons donné | 108:1. Hamidullah/Kazimirski « accordé », Sahih « granted », Piccardo « dato ». |
| 5 | إِذَا | — | Al-Falaq | 2 | quand / lorsque | HIGH | ACCEPT | quand / lorsque | 113:3, 113:5. Fonction grammaticale stable. |
| 6 | إِلَـٰهِ | — | An-Nās | 1 | le dieu / la divinité | HIGH | ACCEPT | le dieu / la divinité | 114:3. Hamidullah « Dieu » = Kazimirski « Dieu ». |
| 7 | إِنَّآ | — | Al-Kawthar | 1 | certes Nous | MEDIUM | ACCEPT | certes Nous | إِنَّ + ـنَا (108:1). Particule d'insistance + pronom « Nous ». |
| 8 | إِنَّ | — | Al-Kawthar | 1 | certes / en vérité | MEDIUM | ACCEPT | certes / en vérité | 108:3 particule d'insistance. Fonction stable. |
| 9 | بِرَبِّ | — | Al-Falaq, An-Nās | 2 | auprès du Seigneur | HIGH | ACCEPT | auprès du Seigneur | بِ + رَبّ. Hamidullah « auprès du Seigneur » = Kazimirski « auprès du Seigneur ». |
| 10 | حَاسِدٍ | — | Al-Falaq | 1 | l'envieux | HIGH | ACCEPT | l'envieux | 113:5. Hamidullah « l'envieux » = Kazimirski « l'envieux ». |
| 11 | حَسَدَ | — | Al-Falaq | 1 | envier | HIGH | ACCEPT | envier | 113:5 verbe. Hamidullah « il envie » / Kazimirski « porte envie ». |
| 12 | خَلَقَ | — | Al-Falaq | 1 | créer | HIGH | ACCEPT | créer | 113:2. Hamidullah « a créés » = Kazimirski « a créés ». |
| 13 | شَانِئَكَ | — | Al-Kawthar | 1 | celui qui te hait | HIGH | ACCEPT | celui qui te hait | 108:3. Hamidullah « celui qui te hait » = Kazimirski « celui qui te hait » = Piccardo « colui che ti odia ». |
| 14 | شَرِّ | — | Al-Falaq, An-Nās | 5 | le mal | HIGH | ACCEPT | le mal | 5 occ. Hamidullah « mal » / Kazimirski « mal/méchanceté » / Sahih « evil » / Piccardo « male ». |
| 15 | صُدُورِ | — | An-Nās | 1 | les poitrines / les cœurs | MEDIUM | ACCEPT | les poitrines / les cœurs | 114:5. Hamidullah « poitrines » / Kazimirski « cœurs » — les deux rendus valides, conservés. |
| 16 | غَاسِقٍ | — | Al-Falaq | 1 | l'obscurité / la nuit | HIGH | ACCEPT | l'obscurité / la nuit | 113:3. Hamidullah « l'obscurité » / Kazimirski « la nuit sombre » / Sahih « darkness ». |
| 17 | فَصَلِّ | — | Al-Kawthar | 1 | prie donc / accomplis la prière | HIGH | ACCEPT | prie donc / accomplis la prière | فَ + صَلِّ (108:2). Hamidullah « accomplis la Salât », Kazimirski « prie », Sahih « pray ». |
| 18 | قُلْ | — | Al-Ikhlāṣ, Al-Falaq, An-Nās | 3 | dis | HIGH | ACCEPT | dis | Impératif. Convergence parfaite 4 sources (112:1, 113:1, 114:1). |
| 19 | كُفُوًا | — | Al-Ikhlāṣ | 1 | égal / équivalent | HIGH | ACCEPT | égal / équivalent | 112:4. Hamidullah « égal » = Kazimirski « égal » = Sahih « equivalent ». |
| 20 | لَمْ | — | Al-Ikhlāṣ | 1 | ne ... pas | HIGH | ACCEPT | ne ... pas | Particule de négation (jussif). Fonction stable. |
| 21 | لِرَبِّكَ | — | Al-Kawthar | 1 | à ton Seigneur | HIGH | ACCEPT | à ton Seigneur | لِ + رَبّ + كَ (108:2). Hamidullah « à ton Seigneur » = Kazimirski « à ton Seigneur ». |
| 22 | لَّهُۥ | — | Al-Ikhlāṣ | 1 | à lui / pour lui | HIGH | ACCEPT | à lui / pour lui | لَ + هُ. Hamidullah « à Lui » / Sahih « to Him ». |
| 23 | مَا | — | Al-Falaq | 1 | ce que / ce qui | MEDIUM | ACCEPT | ce que / ce qui | 113:2 relatif. Sahih « that which » / Piccardo « ciò che ». |
| 24 | مَلِكِ | — | An-Nās | 1 | le roi / le souverain | HIGH | ACCEPT | le roi / le souverain | 114:2. Hamidullah « Souverain » / Kazimirski « Roi » / Sahih « King ». |
| 25 | مِن | — | Al-Falaq, An-Nās | 2 | de / contre | HIGH | ACCEPT | de / contre | Préposition (113:2, 114:4). Rendu « contre » en contexte protecteur « contre le mal ». |
| 26 | مِنَ | — | An-Nās | 1 | de / parmi | HIGH | ACCEPT | de / parmi | 114:6. Variante vocalique de مِن (même préposition). Déduplication future possible. |
| 27 | هُوَ | — | Al-Ikhlāṣ, Al-Kawthar | 2 | il | HIGH | ACCEPT | il | Pronom 3e pers. Hamidullah « Il » / Sahih « He » / Piccardo « Egli ». |
| 28 | وَقَبَ | — | Al-Falaq | 1 | s'étendre / s'approfondir | MEDIUM | ACCEPT | s'étendre / s'approfondir | 113:3 verbe rare. Hamidullah « s'approfondit » / Sahih « settles » / Piccardo « si estende ». Kazimirski « surprend » = paraphrase. |
| 29 | وَلَمْ | — | Al-Ikhlāṣ | 2 | et ne ... pas | HIGH | ACCEPT | et ne ... pas | و + لَمْ. Fonction grammaticale stable (112:3, 112:4). |
| 30 | وَمِن | — | Al-Falaq | 3 | et de / et contre | HIGH | ACCEPT | et de / et contre | و + مِن (113:3, 113:4, 113:5). |
| 31 | وَٱلنَّاسِ | — | An-Nās | 1 | et les gens / et les hommes | MEDIUM | MOVE_TO_LEMMA | gens / hommes | و + ال + ناس (114:6). Même racine que نَاس (lemme déjà glosé « gens / hommes »). Au lieu d'une word_translation redondante, créer un word_lemma_mapping vers نَاس en 21F et réutiliser la glose existante. |
| 32 | وَٱنْحَرْ | — | Al-Kawthar | 1 | et sacrifie | HIGH | ACCEPT | et sacrifie | و + ٱنْحَرْ (108:2). Hamidullah « et sacrifie », Kazimirski « et offre le sacrifice ». |
| 33 | يَكُن | — | Al-Ikhlāṣ | 1 | — | INSUFFICIENT_EVIDENCE | NEEDS_REVIEW | — | Copule jussive de كَانَ sous لَمْ (112:4). Candidat « être (copule) » plausible mais fonction grammaticale contextuelle → revue humaine recommandée. |
| 34 | يَلِدْ | — | Al-Ikhlāṣ | 1 | engendrer | HIGH | ACCEPT | engendrer | 112:3. Hamidullah « engendré » / Kazimirski « enfanté » / Sahih « begets ». |
| 35 | يُولَدْ | — | Al-Ikhlāṣ | 1 | être engendré | HIGH | ACCEPT | être engendré | 112:3 passif. Hamidullah « a été engendré » / Kazimirski « a été enfanté ». |
| 36 | يُوَسْوِسُ | — | An-Nās | 1 | insuffler / chuchoter | MEDIUM | MODIFY | insuffler / chuchoter (le mal) | 114:5 verbe. Hamidullah « insuffle des mauvaises pensées », Kazimirski « souffle le mal », Sahih « whispers ». Complément « le mal » ajouté. |
| 37 | ٱلصَّمَدُ | — | Al-Ikhlāṣ | 1 | l'Éternel / l'Absolu | MEDIUM | ACCEPT | l'Éternel / l'Absolu | Hapax. Hamidullah « Le Seul à être imploré », Kazimirski « à qui on s'adresse », Sahih « Eternal Refuge », Piccardo « l'Assoluto ». Glose standard courte ; note « refuge » conservée. |
| 38 | ٱلنَّفَّـٰثَـٰتِ | — | Al-Falaq | 1 | celles qui soufflent | HIGH | ACCEPT | celles qui soufflent | 113:4. Hamidullah « celles qui soufflent (sorcières) » = Kazimirski « celles qui soufflent ». |
| 39 | ٱلَّذِى | — | An-Nās | 1 | qui / celui qui | MEDIUM | ACCEPT | qui / celui qui | 114:5 relatif. Fonction grammaticale stable. |
| 40 | ٱلْأَبْتَرُ | — | Al-Kawthar | 1 | privé de postérité | MEDIUM | MODIFY | privé de postérité / sans descendance | 108:3. Hamidullah « privé de postérité », Kazimirski « sans postérité », Sahih « cut off », Piccardo « senza seguito ». Synonyme « sans descendance » ajouté. |
| 41 | ٱلْجِنَّةِ | — | An-Nās | 1 | les djinns | HIGH | ACCEPT | les djinns | 114:6. Hamidullah « djinn » / Kazimirski « génies » / Sahih « jinn ». |
| 42 | ٱلْخَنَّاسِ | — | An-Nās | 1 | celui qui se retire | MEDIUM | ACCEPT | celui qui se retire | 114:4 épithète. Sahih « the one who withdraws », Piccardo « che si nasconde ». |
| 43 | ٱلْعُقَدِ | — | Al-Falaq | 1 | les nœuds | HIGH | ACCEPT | les nœuds | 113:4. Convergence 4 sources : « nœuds » / « knots » / « nodi ». |
| 44 | ٱلْفَلَقِ | — | Al-Falaq | 1 | l'aube | HIGH | ACCEPT | l'aube | 113:1. Hamidullah « l'aube naissante » = Kazimirski « l'aube du jour » = Sahih « daybreak ». |
| 45 | ٱلْكَوْثَرَ | — | Al-Kawthar | 1 | al-Kawthar (l'abondance) | MEDIUM | ACCEPT | al-Kawthar (l'abondance) | 108:1 nom propre translittéré. Conserver translittération + sens. |
| 46 | ٱلْوَسْوَاسِ | — | An-Nās | 1 | le chuchoteur / l'insufflateur | MEDIUM | MODIFY | le chuchoteur (celui qui insuffle le mal) | 114:4. Hamidullah « le mauvais conseiller », Kazimirski « celui qui suggère le mal », Sahih « whisperer ». Noyau « insuffler le mal » clarifié dans la glose. |

## Tableau des évidences (§31 — traductions du même ayah)

| Forme arabe | Hamidullah | Kazimirski | Sahih | Piccardo | Semantic core | Variations | Décision |
|---|---|---|---|---|---|---|---|
| أَحَدٌ | Dis : "Il est Allah, Unique. | Dis: Dieu est un. | Say, "He is Allāh, [who is] One, 1 | Di’ : «Egli Allah è Unico, | un, unique | — | ACCEPT |
| أَحَدٌۢ | Et nul n’est égal à Lui." | Il n’a point d’égal en qui que ce soit. | Nor is there to Him any equivalent." | e nessuno è uguale a Lui». 1 Una tradizione che risale all’Inviato di Allah (pace e benedizione su di lui) afferma che la recitazione di questa sura corrisponde al merito della recitazione di un terzo del Corano. Qualche commentatore l’ha definita «perfetta sintesi del tawhìd» (il monoteismo islamico). 2 Colui verso il Quale tendono tutte le creature, Colui Che è Unità assoluta, l’Impenetrabile, l’Eterno; questi alcuni dei significati di «as-Samad» che abbiamo tradotto con «l’Assoluto». | aucun (dans la négation) | — | MODIFY |
| أَعُوذُ | Dis: "Je cherche protection auprès du Seigneur de l’aube naissante, | Dis: Je cherche un refuge auprès du Seigneur de L’AUBE DU JOUR, | Say, "I seek refuge in the Lord of daybreak | Di’: «Mi rifugio nel Signore dell’alba nascente, | chercher refuge / protection | — | ACCEPT |
| أَعْطَيْنَـٰكَ | Nous t’avons certes, accordé l’Abondance. | Nous t’avons donné le KAUTHER. | Indeed, We have granted you, [O Muḥammad], al-Kawthar. | In verità ti abbiamo dato l’abbondanza 1 . | donner (accompli, 'Nous... à toi') | accorder (Hamidullah/Kazimirski) | ACCEPT |
| إِذَا | contre le mal de l’obscurité quand elle s’approfondit, | Contre le mal de la nuit sombre quand elle nous surprend, | And from the evil of darkness when it settles | e contro il male dell’oscurità che si estende | quand / lorsque | — | ACCEPT |
| إِلَـٰهِ | Dieu des hommes, | Dieu des hommes; | The God of mankind, | Dio degli uomini, | dieu, divinité | — | ACCEPT |
| إِنَّآ | Nous t’avons certes, accordé l’Abondance. | Nous t’avons donné le KAUTHER. | Indeed, We have granted you, [O Muḥammad], al-Kawthar. | In verità ti abbiamo dato l’abbondanza 1 . | certes Nous (إِنَّ + نَا) | — | ACCEPT |
| إِنَّ | Celui qui te hait sera certes, sans postérité. | Celui qui te hait périra sans laisser même une trace de lui. | Indeed, your enemy is the one cut off. 1 | In verità sarà colui che ti odia a non avere seguito 1 . 2 «l’abbondanza»: in arabo «al-Kawthar». Questo termine, secondo alcune tradizioni indica anche un fiume del Paradiso che Allah (gloria a Lui l’Altissimo) ha promesso in dono al Suo Inviato (pace e benedizioni su di lui) per compensarlo e consolarlo di tutto quello che ha subito per causa Sua. Secondo l’esegesi ortodossa indica la condizione di Muhammad nel Paradiso, dove sarà posto al più alto dei livelli (al-Wassìla) e «godrà abbondantemente» della Luce divina. 3 Versetto di grande importanza per quanto riguarda la pratica rituale della Festa del Sacrificio (‘îd Adhà) che si celebra il decimo giorno del mese del pellegrinaggio e ricorda la prova cui Àlìah (gloria a Lui l’Altissimo) sottopose il suo servo Abramo (pace su di lui). Il versetto prescrive l’ordine di svolgimento dei riti, prima la preghiera comunitaria (salât-ul-îd) alla quale devono partecipare tutti i musulmani poi il sacrificio degli animali. 4 «a non avere seguito»: lett. «sarà abtar». Questa espressione significa «senza coda» ed era un epiteto ironico e ingiurioso con cui gli arabi gratificavano quelli di loro che non avevano figli maschi. La tradizione riferisce che alla morte in tenerissima età di suo figlio Qasim l’Inviato di Allah (pace e benedizioni su di lui) dovette subire questa crudele oltraggiosa consuetudine. Uno dei suoi avversari giunse a dire che non avendo figli maschi, anche la religione che predicava non avrebbe avuto futuro. Miseria della Miscredenza! | certes / en vérité (particule) | — | ACCEPT |
| بِرَبِّ | Dis: "Je cherche protection auprès du Seigneur de l’aube naissante, | Dis: Je cherche un refuge auprès du Seigneur de L’AUBE DU JOUR, | Say, "I seek refuge in the Lord of daybreak | Di’: «Mi rifugio nel Signore dell’alba nascente, | seigneur (avec بِ) | — | ACCEPT |
| حَاسِدٍ | et contre le mal de l’envieux quand il envie 1 ." | Contre le mal de l’envieux qui nous porte envie. | And from the evil of an envier when he envies." | e contro il male dell’invidioso quando invidia» 1 . | envieux | — | ACCEPT |
| حَسَدَ | et contre le mal de l’envieux quand il envie 1 ." | Contre le mal de l’envieux qui nous porte envie. | And from the evil of an envier when he envies." | e contro il male dell’invidioso quando invidia» 1 . | envier | — | ACCEPT |
| خَلَقَ | contre le mal des êtres qu’Il a créés, | Contre la méchanceté des êtres qu’il a créés, | From the evil of that which He created | contro il male di ciò che ha creato, | créer | — | ACCEPT |
| شَانِئَكَ | Celui qui te hait sera certes, sans postérité. | Celui qui te hait périra sans laisser même une trace de lui. | Indeed, your enemy is the one cut off. 1 | In verità sarà colui che ti odia a non avere seguito 1 . 2 «l’abbondanza»: in arabo «al-Kawthar». Questo termine, secondo alcune tradizioni indica anche un fiume del Paradiso che Allah (gloria a Lui l’Altissimo) ha promesso in dono al Suo Inviato (pace e benedizioni su di lui) per compensarlo e consolarlo di tutto quello che ha subito per causa Sua. Secondo l’esegesi ortodossa indica la condizione di Muhammad nel Paradiso, dove sarà posto al più alto dei livelli (al-Wassìla) e «godrà abbondantemente» della Luce divina. 3 Versetto di grande importanza per quanto riguarda la pratica rituale della Festa del Sacrificio (‘îd Adhà) che si celebra il decimo giorno del mese del pellegrinaggio e ricorda la prova cui Àlìah (gloria a Lui l’Altissimo) sottopose il suo servo Abramo (pace su di lui). Il versetto prescrive l’ordine di svolgimento dei riti, prima la preghiera comunitaria (salât-ul-îd) alla quale devono partecipare tutti i musulmani poi il sacrificio degli animali. 4 «a non avere seguito»: lett. «sarà abtar». Questa espressione significa «senza coda» ed era un epiteto ironico e ingiurioso con cui gli arabi gratificavano quelli di loro che non avevano figli maschi. La tradizione riferisce che alla morte in tenerissima età di suo figlio Qasim l’Inviato di Allah (pace e benedizioni su di lui) dovette subire questa crudele oltraggiosa consuetudine. Uno dei suoi avversari giunse a dire che non avendo figli maschi, anche la religione che predicava non avrebbe avuto futuro. Miseria della Miscredenza! | celui qui te hait | — | ACCEPT |
| شَرِّ | contre le mal des êtres qu’Il a créés, | Contre la méchanceté des êtres qu’il a créés, | From the evil of that which He created | contro il male di ciò che ha creato, | mal | méchanceté (Kazimirski) | ACCEPT |
| صُدُورِ | qui insuffle des mauvaises pensées dans les poitrines des hommes, | Qui souffle le mal dans les cœurs des hommes; | Who whispers [evil] into the breasts of mankind - | che soffia il male nei cuori degli uomini, | poitrines, cœurs | — | ACCEPT |
| غَاسِقٍ | contre le mal de l’obscurité quand elle s’approfondit, | Contre le mal de la nuit sombre quand elle nous surprend, | And from the evil of darkness when it settles | e contro il male dell’oscurità che si estende | obscurité, nuit | nuit sombre (Kazimirski) | ACCEPT |
| فَصَلِّ | Accomplis la Ṣalāt pour ton Seigneur et sacrifie. | Adresse ta prière au Seigneur, et immole-lui des victimes. | So pray to your Lord and offer sacrifice [to Him alone]. | Esegui l’orazione per il tuo Signore e sacrifica 1 ! | prier / accomplir la prière | — | ACCEPT |
| قُلْ | Dis : "Il est Allah, Unique. | Dis: Dieu est un. | Say, "He is Allāh, [who is] One, 1 | Di’ : «Egli Allah è Unico, | dire (impératif) | — | ACCEPT |
| كُفُوًا | Et nul n’est égal à Lui." | Il n’a point d’égal en qui que ce soit. | Nor is there to Him any equivalent." | e nessuno è uguale a Lui». 1 Una tradizione che risale all’Inviato di Allah (pace e benedizione su di lui) afferma che la recitazione di questa sura corrisponde al merito della recitazione di un terzo del Corano. Qualche commentatore l’ha definita «perfetta sintesi del tawhìd» (il monoteismo islamico). 2 Colui verso il Quale tendono tutte le creature, Colui Che è Unità assoluta, l’Impenetrabile, l’Eterno; questi alcuni dei significati di «as-Samad» che abbiamo tradotto con «l’Assoluto». | égal, équivalent | — | ACCEPT |
| لَمْ | Il n’a jamais engendré, n’a pas été engendré non plus. | Il n’a point enfanté, et n’a point été enfanté. | He neither begets nor is born, | Non ha generato, non è stato generato | négation (jussif) | — | ACCEPT |
| لِرَبِّكَ | Accomplis la Ṣalāt pour ton Seigneur et sacrifie. | Adresse ta prière au Seigneur, et immole-lui des victimes. | So pray to your Lord and offer sacrifice [to Him alone]. | Esegui l’orazione per il tuo Signore e sacrifica 1 ! | à ton Seigneur | — | ACCEPT |
| لَّهُۥ | Et nul n’est égal à Lui." | Il n’a point d’égal en qui que ce soit. | Nor is there to Him any equivalent." | e nessuno è uguale a Lui». 1 Una tradizione che risale all’Inviato di Allah (pace e benedizione su di lui) afferma che la recitazione di questa sura corrisponde al merito della recitazione di un terzo del Corano. Qualche commentatore l’ha definita «perfetta sintesi del tawhìd» (il monoteismo islamico). 2 Colui verso il Quale tendono tutte le creature, Colui Che è Unità assoluta, l’Impenetrabile, l’Eterno; questi alcuni dei significati di «as-Samad» che abbiamo tradotto con «l’Assoluto». | à lui (préposition + suffixe) | — | ACCEPT |
| مَا | contre le mal des êtres qu’Il a créés, | Contre la méchanceté des êtres qu’il a créés, | From the evil of that which He created | contro il male di ciò che ha creato, | ce que (relatif) | — | ACCEPT |
| مَلِكِ | Le Souverain des hommes, | Roi des hommes, | The Sovereign of mankind, | Re degli uomini, | roi, souverain | — | ACCEPT |
| مِن | contre le mal des êtres qu’Il a créés, | Contre la méchanceté des êtres qu’il a créés, | From the evil of that which He created | contro il male di ciò che ha creato, | de / contre (préposition) | contre (le mal) | ACCEPT |
| مِنَ | qu’il (le conseiller) soit un djinn, ou un être humain". | Contre les génies et contre les hommes. | From among the jinn and mankind". 1 | che [venga] dai dèmoni o dagli uomini». | de / parmi (préposition) | — | ACCEPT |
| هُوَ | Dis : "Il est Allah, Unique. | Dis: Dieu est un. | Say, "He is Allāh, [who is] One, 1 | Di’ : «Egli Allah è Unico, | il (pronom 3e pers.) | — | ACCEPT |
| وَقَبَ | contre le mal de l’obscurité quand elle s’approfondit, | Contre le mal de la nuit sombre quand elle nous surprend, | And from the evil of darkness when it settles | e contro il male dell’oscurità che si estende | s'étendre / s'approfondir (obscurité) | surprendre (Kazimirski) | ACCEPT |
| وَلَمْ | Il n’a jamais engendré, n’a pas été engendré non plus. | Il n’a point enfanté, et n’a point été enfanté. | He neither begets nor is born, | Non ha generato, non è stato generato | et + négation | — | ACCEPT |
| وَمِن | contre le mal de l’obscurité quand elle s’approfondit, | Contre le mal de la nuit sombre quand elle nous surprend, | And from the evil of darkness when it settles | e contro il male dell’oscurità che si estende | et + de/contre | — | ACCEPT |
| وَٱلنَّاسِ | qu’il (le conseiller) soit un djinn, ou un être humain". | Contre les génies et contre les hommes. | From among the jinn and mankind". 1 | che [venga] dai dèmoni o dagli uomini». | et les gens / et les hommes | — | MOVE_TO_LEMMA |
| وَٱنْحَرْ | Accomplis la Ṣalāt pour ton Seigneur et sacrifie. | Adresse ta prière au Seigneur, et immole-lui des victimes. | So pray to your Lord and offer sacrifice [to Him alone]. | Esegui l’orazione per il tuo Signore e sacrifica 1 ! | sacrifier | — | ACCEPT |
| يَكُن | Et nul n’est égal à Lui." | Il n’a point d’égal en qui que ce soit. | Nor is there to Him any equivalent." | e nessuno è uguale a Lui». 1 Una tradizione che risale all’Inviato di Allah (pace e benedizione su di lui) afferma che la recitazione di questa sura corrisponde al merito della recitazione di un terzo del Corano. Qualche commentatore l’ha definita «perfetta sintesi del tawhìd» (il monoteismo islamico). 2 Colui verso il Quale tendono tutte le creature, Colui Che è Unità assoluta, l’Impenetrabile, l’Eterno; questi alcuni dei significati di «as-Samad» che abbiamo tradotto con «l’Assoluto». | être (copule jussive) | — | NEEDS_REVIEW |
| يَلِدْ | Il n’a jamais engendré, n’a pas été engendré non plus. | Il n’a point enfanté, et n’a point été enfanté. | He neither begets nor is born, | Non ha generato, non è stato generato | engendrer | — | ACCEPT |
| يُولَدْ | Il n’a jamais engendré, n’a pas été engendré non plus. | Il n’a point enfanté, et n’a point été enfanté. | He neither begets nor is born, | Non ha generato, non è stato generato | être engendré (passif) | — | ACCEPT |
| يُوَسْوِسُ | qui insuffle des mauvaises pensées dans les poitrines des hommes, | Qui souffle le mal dans les cœurs des hommes; | Who whispers [evil] into the breasts of mankind - | che soffia il male nei cuori degli uomini, | insuffler / chuchoter (le mal) | — | MODIFY |
| ٱلصَّمَدُ | Allah, Le Seul à être imploré pour ce que nous désirons. | C’est le Dieu à qui tous les êtres s’adressent dans leurs besoins. | Allāh, the Eternal Refuge. 1 | Allah è l’Assoluto 1 . | absolu, éternel, refuge | celui vers qui on se tourne (Hamidullah/Kazimirski) | ACCEPT |
| ٱلنَّفَّـٰثَـٰتِ | contre le mal de celles qui soufflent (les sorcières) sur les nœuds, | Contre la méchanceté de celles qui soufflent sur les nœuds, | And from the evil of the blowers in knots 1 | e contro il male delle soffianti sui nodi 1 , | celles qui soufflent | sorcières (Hamidullah) | ACCEPT |
| ٱلَّذِى | qui insuffle des mauvaises pensées dans les poitrines des hommes, | Qui souffle le mal dans les cœurs des hommes; | Who whispers [evil] into the breasts of mankind - | che soffia il male nei cuori degli uomini, | qui / celui qui (relatif) | — | ACCEPT |
| ٱلْأَبْتَرُ | Celui qui te hait sera certes, sans postérité. | Celui qui te hait périra sans laisser même une trace de lui. | Indeed, your enemy is the one cut off. 1 | In verità sarà colui che ti odia a non avere seguito 1 . 2 «l’abbondanza»: in arabo «al-Kawthar». Questo termine, secondo alcune tradizioni indica anche un fiume del Paradiso che Allah (gloria a Lui l’Altissimo) ha promesso in dono al Suo Inviato (pace e benedizioni su di lui) per compensarlo e consolarlo di tutto quello che ha subito per causa Sua. Secondo l’esegesi ortodossa indica la condizione di Muhammad nel Paradiso, dove sarà posto al più alto dei livelli (al-Wassìla) e «godrà abbondantemente» della Luce divina. 3 Versetto di grande importanza per quanto riguarda la pratica rituale della Festa del Sacrificio (‘îd Adhà) che si celebra il decimo giorno del mese del pellegrinaggio e ricorda la prova cui Àlìah (gloria a Lui l’Altissimo) sottopose il suo servo Abramo (pace su di lui). Il versetto prescrive l’ordine di svolgimento dei riti, prima la preghiera comunitaria (salât-ul-îd) alla quale devono partecipare tutti i musulmani poi il sacrificio degli animali. 4 «a non avere seguito»: lett. «sarà abtar». Questa espressione significa «senza coda» ed era un epiteto ironico e ingiurioso con cui gli arabi gratificavano quelli di loro che non avevano figli maschi. La tradizione riferisce che alla morte in tenerissima età di suo figlio Qasim l’Inviato di Allah (pace e benedizioni su di lui) dovette subire questa crudele oltraggiosa consuetudine. Uno dei suoi avversari giunse a dire che non avendo figli maschi, anche la religione che predicava non avrebbe avuto futuro. Miseria della Miscredenza! | privé de postérité | coupé (Sahih) | MODIFY |
| ٱلْجِنَّةِ | qu’il (le conseiller) soit un djinn, ou un être humain". | Contre les génies et contre les hommes. | From among the jinn and mankind". 1 | che [venga] dai dèmoni o dagli uomini». | djinns | — | ACCEPT |
| ٱلْخَنَّاسِ | contre le mal du mauvais conseiller, furtif, | Contre la méchanceté de celui qui suggère les mauvaises pensées et se dérobe, | From the evil of the retreating whisperer 1 - | contro il male del sussurratore furtivo, | celui qui se retire | — | ACCEPT |
| ٱلْعُقَدِ | contre le mal de celles qui soufflent (les sorcières) sur les nœuds, | Contre la méchanceté de celles qui soufflent sur les nœuds, | And from the evil of the blowers in knots 1 | e contro il male delle soffianti sui nodi 1 , | nœuds | — | ACCEPT |
| ٱلْفَلَقِ | Dis: "Je cherche protection auprès du Seigneur de l’aube naissante, | Dis: Je cherche un refuge auprès du Seigneur de L’AUBE DU JOUR, | Say, "I seek refuge in the Lord of daybreak | Di’: «Mi rifugio nel Signore dell’alba nascente, | aube | jour naissant (Kazimirski) | ACCEPT |
| ٱلْكَوْثَرَ | Nous t’avons certes, accordé l’Abondance. | Nous t’avons donné le KAUTHER. | Indeed, We have granted you, [O Muḥammad], al-Kawthar. | In verità ti abbiamo dato l’abbondanza 1 . | al-Kawthar (abondance) | — | ACCEPT |
| ٱلْوَسْوَاسِ | contre le mal du mauvais conseiller, furtif, | Contre la méchanceté de celui qui suggère les mauvaises pensées et se dérobe, | From the evil of the retreating whisperer 1 - | contro il male del sussurratore furtivo, | chuchoteur, insufflateur (du mal) | tentateur (Kazimirski) | MODIFY |

## READY_FOR_IMPORT (§32)

| Forme/Lemme | Arabic | final_gloss | Target table | Reason | Confidence |
|---|---|---|---|---|---|
| FORME | قُلْ | dis | word_translations | ACCEPT | HIGH |
| FORME | هُوَ | il | word_translations | ACCEPT | HIGH |
| FORME | أَحَدٌ | un / unique | word_translations | ACCEPT | HIGH |
| FORME | ٱلصَّمَدُ | l'Éternel / l'Absolu | word_translations | ACCEPT | MEDIUM |
| FORME | لَمْ | ne ... pas | word_translations | ACCEPT | HIGH |
| FORME | يَلِدْ | engendrer | word_translations | ACCEPT | HIGH |
| FORME | وَلَمْ | et ne ... pas | word_translations | ACCEPT | HIGH |
| FORME | يُولَدْ | être engendré | word_translations | ACCEPT | HIGH |
| FORME | لَّهُۥ | à lui / pour lui | word_translations | ACCEPT | HIGH |
| FORME | كُفُوًا | égal / équivalent | word_translations | ACCEPT | HIGH |
| FORME | أَحَدٌۢ | un / quelqu'un (aucun dans la négation) | word_translations | MODIFY | MEDIUM |
| FORME | أَعُوذُ | je cherche refuge | word_translations | ACCEPT | HIGH |
| FORME | بِرَبِّ | auprès du Seigneur | word_translations | ACCEPT | HIGH |
| FORME | ٱلْفَلَقِ | l'aube | word_translations | ACCEPT | HIGH |
| FORME | مِن | de / contre | word_translations | ACCEPT | HIGH |
| FORME | شَرِّ | le mal | word_translations | ACCEPT | HIGH |
| FORME | مَا | ce que / ce qui | word_translations | ACCEPT | MEDIUM |
| FORME | خَلَقَ | créer | word_translations | ACCEPT | HIGH |
| FORME | وَمِن | et de / et contre | word_translations | ACCEPT | HIGH |
| FORME | غَاسِقٍ | l'obscurité / la nuit | word_translations | ACCEPT | HIGH |
| FORME | إِذَا | quand / lorsque | word_translations | ACCEPT | HIGH |
| FORME | وَقَبَ | s'étendre / s'approfondir | word_translations | ACCEPT | MEDIUM |
| FORME | ٱلنَّفَّـٰثَـٰتِ | celles qui soufflent | word_translations | ACCEPT | HIGH |
| FORME | ٱلْعُقَدِ | les nœuds | word_translations | ACCEPT | HIGH |
| FORME | حَاسِدٍ | l'envieux | word_translations | ACCEPT | HIGH |
| FORME | حَسَدَ | envier | word_translations | ACCEPT | HIGH |
| FORME | مَلِكِ | le roi / le souverain | word_translations | ACCEPT | HIGH |
| FORME | إِلَـٰهِ | le dieu / la divinité | word_translations | ACCEPT | HIGH |
| FORME | ٱلْوَسْوَاسِ | le chuchoteur (celui qui insuffle le mal) | word_translations | MODIFY | MEDIUM |
| FORME | ٱلْخَنَّاسِ | celui qui se retire | word_translations | ACCEPT | MEDIUM |
| FORME | ٱلَّذِى | qui / celui qui | word_translations | ACCEPT | MEDIUM |
| FORME | يُوَسْوِسُ | insuffler / chuchoter (le mal) | word_translations | MODIFY | MEDIUM |
| FORME | صُدُورِ | les poitrines / les cœurs | word_translations | ACCEPT | MEDIUM |
| FORME | مِنَ | de / parmi | word_translations | ACCEPT | HIGH |
| FORME | ٱلْجِنَّةِ | les djinns | word_translations | ACCEPT | HIGH |
| LEMME | وَٱلنَّاسِ | gens / hommes | word_lemma_mapping (+ réutiliser lemma_translations نَاس) | MOVE_TO_LEMMA | MEDIUM |
| FORME | إِنَّآ | certes Nous | word_translations | ACCEPT | MEDIUM |
| FORME | أَعْطَيْنَـٰكَ | Nous t'avons donné | word_translations | ACCEPT | HIGH |
| FORME | ٱلْكَوْثَرَ | al-Kawthar (l'abondance) | word_translations | ACCEPT | MEDIUM |
| FORME | فَصَلِّ | prie donc / accomplis la prière | word_translations | ACCEPT | HIGH |
| FORME | لِرَبِّكَ | à ton Seigneur | word_translations | ACCEPT | HIGH |
| FORME | وَٱنْحَرْ | et sacrifie | word_translations | ACCEPT | HIGH |
| FORME | إِنَّ | certes / en vérité | word_translations | ACCEPT | MEDIUM |
| FORME | شَانِئَكَ | celui qui te hait | word_translations | ACCEPT | HIGH |
| FORME | ٱلْأَبْتَرُ | privé de postérité / sans descendance | word_translations | MODIFY | MEDIUM |

## BLOCKED_FOR_IMPORT (§33)

| Élément | Type | Raison |
|---|---|---|
| يَكُن | NEEDS_REVIEW | NEEDS_REVIEW |
| أَحَدٌ | EXISTING_DATA_ANOMALY | Ne pas modifier les données existantes pendant la revue de gloses. La glose FR « un / unique » est validée indépendamment de ce meaning_en. |
| فِي / نَاس | VALIDATION_METADATA_INCONSISTENCY | Contradiction de métadonnées à traiter dans une phase de nettoyage séparée. |

---

**DATABASE_WRITES = 0** · **IMPORTS = 0** · **VALIDATIONS = 0** · **MIGRATIONS = 0** · **SEEDS = 0**

**FATIHAH_REFERENCE_LOCKED = PRESERVED**

**FIN PHASE 21E**
