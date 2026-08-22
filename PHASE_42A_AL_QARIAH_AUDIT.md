# PHASE 42A — AUDIT READ-ONLY — PRÉPARATION DU DÉBLOCAGE D'AL-QĀRIʿAH (101)

**Statut : `PHASE_42A_READY_FOR_EDITORIAL` (READ-ONLY — aucune écriture)**

> DB inchangée, aucune glose écrite, aucun curriculum créé, aucun moteur modifié,
> aucun commit/push. Le seul livrable est ce rapport (propositions éditoriales non écrites).

---

## A. Executive Summary

Al-Qāriʿah (101) est entièrement reconstruite depuis la DB actuelle : **11 versets,
29 formes distinctes**. La couverture FR actuelle est **8/29 (28 %)** — le chiffre historique
« ~21 formes manquantes » est **confirmé** : **21 formes à enrichir**.

Les 21 formes sont toutes **glosables** selon le workflow éditorial (4 traductions alignées +
Kazimirski 1860). **0 forme bloquée, 0 forme nécessitant un blocage.** 8 cas sensibles
(polysémie, nom propre, idiome, copule, pronom, clitiques) sont identifiés et arbitrés. Après
validation éditoriale, Al-Qāriʿah atteindra **100 % FR → `READY`** (11 leçons prévues).

**Non-régression vérifiée** : Al-Fātiḥah `REFERENCE`, 97/111 `READY`, catalogue = 17 (101 absente,
correct).

---

## B. DB / Schema Audit

Schéma réel confirmé (identique aux phases 40–41) : `quran_words` (arabic UNIQUE, lemma_id,
meaning EN), `word_occurrences` (ayah_id, word_id, position), `ayahs` (surah_id, ayah_number),
`word_translations` (word_id, language, text, source_id, is_validated, validated_at),
`lemma_translations` (lemma_id, language, text, is_validated), `lemmas`, `sources`,
`learning_paths`/`units`/`lessons`/`lesson_words`. Aucun écart avec les phases précédentes.

**Ressources 4 traductions** : Hamidullah FR = 31, Kazimirski FR (Le Koran 1869) = 9001,
Sahih EN = 20, Piccardo IT = 153. Référence lexicale : Kazimirski — Dictionnaire 1860
(`567c8b5d-…`).

---

## C. Al-Qāriʿah Reconstruction (11 versets, 29 formes distinctes)

| Forme | Occ. | Lemma | FR forme | FR lemme | EN | État |
|---|---:|---|---|---|---|---|
| ٱلْقَارِعَةُ | 3 | — | — | — | Striking Calamity | ❌ à éditer |
| مَا | 3 | — | « ce que / ce qui » | — | what | ✅ FR |
| وَمَآ | 2 | — | « et ce que » | — | and what | ✅ FR |
| أَدْرَىٰكَ | 2 | — | « t'a fait connaître » | — | will make you know | ✅ FR |
| يَوْمَ | 1 | يَوْم | « jour » (40C) | « jour » | (on the) Day | ✅ FR |
| يَكُونُ | 1 | — | — | — | can be | ❌ à éditer |
| ٱلنَّاسُ | 1 | نَاس | — | « gens / hommes » | the people | ✅ FR (lemme) |
| كَٱلْفَرَاشِ | 1 | — | — | — | like moths | ❌ à éditer |
| ٱلْمَبْثُوثِ | 1 | — | — | — | scattered | ❌ à éditer |
| وَتَكُونُ | 1 | — | — | — | And will be | ❌ à éditer |
| ٱلْجِبَالُ | 1 | — | — | — | the mountains | ❌ à éditer |
| كَٱلْعِهْنِ | 1 | — | — | — | like wool | ❌ à éditer |
| ٱلْمَنفُوشِ | 1 | — | — | — | fluffed up | ❌ à éditer |
| فَأَمَّا | 1 | — | « quant à » | — | Then as for | ✅ FR |
| مَن | 1 | — | — | — | (some) who | ❌ à éditer |
| ثَقُلَتْ | 1 | — | — | — | (will be) heavy | ❌ à éditer |
| مَوَٰزِينُهُۥ | 2 | — | — | — | his scales | ❌ à éditer |
| فَهُوَ | 1 | — | — | — | then he/it | ❌ à éditer |
| فِى | 1 | فِي | « dans » | « dans / en / sur » | In | ✅ FR |
| عِيشَةٍۢ | 1 | — | — | — | a life | ❌ à éditer |
| رَّاضِيَةٍۢ | 1 | — | — | — | pleasant | ❌ à éditer |
| وَأَمَّا | 1 | — | « et quant à » | — | And as for | ✅ FR |
| مَنْ | 1 | — | — | — | who | ❌ à éditer |
| خَفَّتْ | 1 | — | — | — | (will be) light | ❌ à éditer |
| فَأُمُّهُۥ | 1 | — | — | — | His abode | ❌ à éditer (idiome) |
| هَاوِيَةٌۭ | 1 | — | — | — | the Pit | ❌ à éditer (nom propre) |
| هِيَهْ | 1 | — | — | — | it is | ❌ à éditer (pronom) |
| نَارٌ | 1 | — | — | — | A Fire | ❌ à éditer |
| حَامِيَةٌۢ | 1 | — | — | — | intensely hot | ❌ à éditer |

**Totaux : 29 formes — 7 FR direct + 1 FR lemme = 8 FR (28 %) — 21 à éditer.**

---

## D. Existing FR Coverage (8 formes)

- **FR forme (7)** : مَا « ce que / ce qui » · وَمَآ « et ce que » · أَدْرَىٰكَ « t'a fait
  connaître » · يَوْمَ « jour » (**glose 40C**) · فَأَمَّا « quant à » · فِى « dans » ·
  وَأَمَّا « et quant à ».
- **FR lemme (1)** : ٱلنَّاسُ ← lemme نَاس « gens / hommes ».

---

## E. Missing Forms (21)

Voir section C (lignes ❌). Ce sont les 21 formes à enrichir.

---

## F. 4-Translation Editorial Analysis

| Forme | Ayah | Noyau (H/K + E/I) | Type |
|---|---|---|---|
| ٱلْقَارِعَةُ | 1–3 | H « le fracas », K « le coup », E « Striking Calamity », I « la Percotente » → épithète du Jour de la Résurrection | POLYSEMOUS / PROPER_NAME |
| يَكُونُ | 4 | H « seront », K « seront », E « will be », I « saranno » → copule « être » | GRAMMATICAL (copule) |
| كَٱلْفَرَاشِ | 4 | H/K « papillons », E « moths », I « falene » → ك + « papillons » | clitique ك + nom |
| ٱلْمَبْثُوثِ | 4 | H « éparpillés », K « dispersés », E « dispersed », I « disperse » | STANDARD |
| وَتَكُونُ | 5 | H « seront », K « voleront », E « will be », I « saranno » → و + copule | GRAMMATICAL (copule) |
| ٱلْجِبَالُ | 5 | H/K « montagnes », E « mountains », I « montagne » | STANDARD |
| كَٱلْعِهْنِ | 5 | H « laine cardée », K « laine teinte », E « wool », I « lana cardata » → ك + « laine » | clitique ك + nom |
| ٱلْمَنفُوشِ | 5 | H « cardée », K « teinte », E « fluffed up », I « cardata » | STANDARD |
| مَن | 6 | H « celui dont », K « celui dont », E « one whose », I « colui » | GRAMMATICAL (relatif) |
| ثَقُلَتْ | 6 | H « sera lourde », K « pèseront lourdement », E « heavy », I « pesanti » | STANDARD (verbe) |
| مَوَٰزِينُهُۥ | 6,8 | H « sa balance », K « ses œuvres… balance », E « his scales », I « sue bilance » | clitique (موازين + ـهُ) |
| فَهُوَ | 7 | H « il sera », K « aura », E « He will be », I « avrà » | clitique (فَ + هُوَ) |
| عِيشَةٍۢ | 7 | H/K « vie », E « life », I « vita » | STANDARD |
| رَّاضِيَةٍۢ | 7 | H/K « agréable », E « pleasant », I « felice » | STANDARD |
| مَنْ | 8 | H « celui dont », K « celui dont », E « one whose », I « colui » | GRAMMATICAL (relatif) |
| خَفَّتْ | 8 | H « sera légère », K « légères », E « light », I « leggere » | STANDARD (verbe) |
| فَأُمُّهُۥ | 9 | H « sa mère [destination] », K « sa demeure », E « his refuge », I « sua madre » → idiome « mère = demeure » | **SENSIBLE (idiome)** |
| هَاوِيَةٌۭ | 9 | H « un abîme », K « la fosse (El-hawiye) », E « an abyss », I « il Baratro » → nom de l'Enfer | PROPER_NAME |
| هِيَهْ | 10 | H « ce que c'est », E « what that is », I « cos'è » → pronom + ه de pause | GRAMMATICAL (pronom) |
| نَارٌ | 11 | H/K « feu », E « Fire », I « Fuoco » | STANDARD |
| حَامِيَةٌۢ | 11 | H/K « ardent », E « intensely hot », I « ardente » | STANDARD |

---

## G. Proposed Hikma Glosses (NON écrites)

| Forme | Glose proposée | Justification |
|---|---|---|
| ٱلْقَارِعَةُ | le fracas / la calamité (foudroyante) | épithète du Jour de la Résurrection ; H « fracas », K « coup » |
| يَكُونُ | sera | copule كَانَ (3e sg inaccompli) |
| كَٱلْفَرَاشِ | comme les papillons | ك « comme » + الفَرَاش « papillons » |
| ٱلْمَبْثُوثِ | éparpillés / dispersés | dispersion |
| وَتَكُونُ | et seront | و + copule كَانَ |
| ٱلْجِبَالُ | les montagnes | — |
| كَٱلْعِهْنِ | comme la laine (cardée) | ك + العِهْن « laine » |
| ٱلْمَنفُوشِ | cardée / ébouriffée | laine cardée |
| مَن | celui qui / quiconque | relatif |
| ثَقُلَتْ | seront lourdes / pèseront | ثَقُل « être lourd » |
| مَوَٰزِينُهُۥ | ses balances | مَوَازِين + ـهُ |
| فَهُوَ | et lui / il sera donc | فَ + هُوَ |
| عِيشَةٍۢ | une vie | — |
| رَّاضِيَةٍۢ | agréable / satisfaisante | رَضِي « être satisfait » |
| مَنْ | celui qui / quiconque | relatif |
| خَفَّتْ | seront légères | خَفَّ « être léger » |
| فَأُمُّهُۥ | sa mère (= sa demeure) | idiome : أُم « mère » = refuge/demeure |
| هَاوِيَةٌۭ | l'abîme / le gouffre | nom de l'Enfer (al-Hâwiya) |
| هِيَهْ | c'est / elle | pronom + ه de pause |
| نَارٌ | un feu | même lexème que نَارًۭا (111) |
| حَامِيَةٌۢ | ardente / brûlante | chaleur intense |

---

## H. Sensitive Cases (8)

| Forme | Catégorie | Décision éditoriale |
|---|---|---|
| ٱلْقَارِعَةُ | POLYSEMOUS / PROPER_NAME | glose « le fracas / la calamité (foudroyante) » + note « nom du Jour de la Résurrection » |
| يَكُونُ / وَتَكُونُ | GRAMMATICAL | glose « sera / et seront » (copule, contexte Jour) |
| مَن / مَنْ | GRAMMATICAL | glose « celui qui / quiconque » (relatif) |
| فَأُمُّهُۥ | **SENSIBLE (idiome)** | « sa mère (= sa demeure) » — double formulation, jamais « sa mère » seul (trompeur) |
| هَاوِيَةٌۭ | PROPER_NAME | « l'abîme / le gouffre » + note « al-Hâwiya (Enfer) » |
| هِيَهْ | GRAMMATICAL | « c'est / elle » (pronom + ه de pause) |
| كَٱلْفَرَاشِ / كَٱلْعِهْنِ | clitique ك + nom | « comme les papillons / comme la laine » (précédent Al-Fātiḥah) |

**Confiance globale : élevée.** Aucune de ces formes n'est bloquée — toutes suivent les
précédents établis (40C, 41B).

---

## I. Category A / B / C / D

| Catégorie | Nombre | Formes |
|---|---:|---|
| **A — Already Covered** | **8** | مَا, وَمَآ, أَدْرَىٰكَ, يَوْمَ, ٱلنَّاسُ, فَأَمَّا, فِى, وَأَمَّا |
| **B — Editorially Required** | **21** | les 21 formes ❌ (section C/E) |
| **C — Needs Review** | **0** | — |
| **D — Blocked** | **0** | — |

---

## J. Kazimirski Traceability

La référence lexicale reste Kazimirski — Dictionnaire arabe-français (1860), domaine public
(équivalents : قَارِعَة « coup/fracas », يَوْم « jour », جَبَل « montagne », نَار « feu »,
عِيشَة « vie », مِيزَان « balance », هَاوِيَة « abîme/fosse »…). Les gloses finales restent
des formulations éditoriales courtes de Hikma, jamais des reproductions longues.

---

## K. Reuse from Previous Phases

| Source | Réutilisation dans 101 |
|---|---|
| Al-Fātiḥah | مَا, وَمَآ, أَدْرَىٰكَ, فِى, فَأَمَّا, وَأَمَّا (6 gloses réutilisées) |
| 40C (15 P1) | يَوْمَ « jour » (1 glose réutilisée) |
| 41B Al-Masad | pattern نَار « feu » (نَارًۭا 111 → نَارٌ 101, lexème commun, forme distincte) |
| 41B Al-Qadr | aucun |

---

## L. READY Simulation

`classifySurahReadiness(101, pct)` → `READY` ssi 100 %.

| État | FR / total | % |
|---|---:|---:|
| Avant | 8 / 29 | 28 % |
| Après validation des 21 propositions | 29 / 29 | **100 % → READY** |

---

## M. Curriculum Dry-Run

- `seed-multisurah-curriculum --surahs=101 --dry-run` → **11 leçons potentielles** (11 versets).
- Leçons : `surah-101-ayah-1` … `surah-101-ayah-11`, mots cumulés + revue ≤4, `is_new` (via
  `planSurahCurriculum`, non modifié). Aucun parcours créé (dry-run).

---

## N. Cross-Surah Reuse

Nouvelles gloses réutilisables ailleurs (sourates courtes futures) :

| Nouvelle glose | Réutilisation |
|---|---|
| مَن / مَنْ « celui qui » | **forte** (relatif omniprésent) |
| يَكُون « sera » | **forte** (copule omniprésente) |
| جِبَال « montagnes » | **forte** |
| نَار « feu » | **forte** (déjà 111, 92, 101) |
| مَوَازِين « balances » | moyenne (101, 7, 23) |
| فَرَاش / عِهْن / مَنفُوش / قَارِعَة / هَاوِيَة / حَامِيَة | faible (vocabulaire propre à 101) |

→ Al-Qāriʿah mélange **vocabulaire rare** (coût faible en réutilisation) et **formes
fonctionnelles très réutilisables** (مَن, يَكُون). Réutilisation globale **moyenne**, inférieure
à Al-Qadr (qui avait nuit/mois/anges/aube/paix).

---

## O. Editorial Cost

| Catégorie | Nombre |
|---|---:|
| Formes totales | 29 |
| Déjà FR direct | 7 |
| FR via lemme | 1 |
| **À éditer** | **21** |
| Needs Review | 0 |
| Bloquées | 0 |

**Écart avec l'estimation (~21) : aucun.** Le chiffre est confirmé.

---

## P. Pedagogical Priority

- **Longueur** : 11 versets (plus long que 97/111, mais court).
- **Récitation** : très récité (dernières sourates).
- **Difficulté** : vocabulaire thématique rare (قارعة, فراش, عهن, هاوية) + copule/relatif —
  difficulté **moyenne**, légèrement supérieure à Al-Masad.
- **Coût** : 21 gloses (supérieur aux 18 de 97/111).
- **Réutilisation** : moyenne (fonctionnels forts, thématiques faibles).

**Priorité recommandée : après Al-Qadr + Al-Masad** (déjà faites en 41B), Al-Qāriʿah est la
prochaine cible logique malgré un coût légèrement supérieur, car elle est très récitée.

---

## Q. Risks

1. **`فَأُمُّهُۥ`** : idiome « mère = demeure » — risque de contresens si glosé « sa mère »
   seul. Parade : double formulation « sa mère (= sa demeure) ».
2. **`ٱلْقَارِعَةُ`** : épithète théologique — glose « fracas/calamité » à valider soigneusement.
3. **Copule يَكُون / وَتَكُونُ** : glose « sera / et seront » dépend du contexte futur du Jour.
4. **مَن / مَنْ** : deux word_id distincts pour le même relatif — deux gloses identiques, à ne
   pas confondre (formes distinctes, Modèle A).
5. **Réutilisation faible** du vocabulaire thématique : l'effort de 21 gloses est moins amorti
   que 97/111.

---

## R. No-Write Verification

Aucune écriture : `0 INSERT/UPDATE/DELETE/UPSERT`, `0` migration, `0` seed (dry-run seul),
`0` `word_translations`/`lemma_translations` modifiée, `0` path/unit/lesson/lesson_word.
Scripts `tmp/phase42a-*.cjs|.ts` en lecture seule. Catalogue inchangé (17 ; 101 absente).

---

## S. Recommendation

**Phase 42B = « Validation éditoriale + écriture des 21 gloses d'Al-Qāriʿah + seed idempotent »**
(reproduction stricte du workflow 40C/41B : 4 traductions alignées + Kazimirski 1860 → 21 gloses
`is_validated=true` → vérification 100 % FR → `seed-multisurah-curriculum --surahs=101`).
Aucun moteur modifié. À valider explicitement avant exécution.

---

## T. Final Verdict

**`PHASE_42A_READY_FOR_EDITORIAL`**

- **Nombre exact de gloses nécessaires** : **21** (7 FR direct + 1 FR lemme déjà présents).
- **Cas sensibles** : **8** (1 idiom, 2 noms propres/épithètes, 2 copules, 2 relatifs, 1 pronom).
- **Formes bloquées** : **0**.
- **Potentiel 100 % FR** : **oui** (29/29 après validation).
- **Al-Qāriʿah peut devenir `READY`** : **oui**, après écriture + seed.
- **Phase 42B recommandée** : **oui**.
- **Ordre d'exécution recommandé** : audit final → validation → écriture idempotente des 21
  gloses → vérif 100 % FR/READY → dry-run → seed → audit post-seed.

**STOP** — aucune écriture, aucune Phase 42B automatique avant validation explicite.
