# PHASE 70K — LOT 10 — PRÉPARATION READ-ONLY (batch 500)

**Verdict : `PHASE_70K_LOT10_READY_FOR_HUMAN_REVIEW`** · `DATABASE_WRITES = 0`

Phase strictement READ-ONLY : aucune écriture DB, aucun DRY-RUN, aucun script d'APPLY, aucun commit/push, aucun Lot 11.

---

## A. Ground truth live (recalculée depuis la DB — 0 divergence)

| Compteur | Attendu | Live |
|---|---:|---:|
| `word_translations` FR validées | 1 017 | **1 017** ✅ |
| `word_lemma_mapping` safe | 188 | **188** ✅ |
| `linguistic_occurrences` | 22 485 | **22 485** ✅ |
| `linguistic_segments` | 44 677 | **44 677** ✅ |
| `translations` | 24 944 | **24 944** ✅ |
| `quran_words` | 21 296 | **21 296** ✅ |
| `word_occurrences` | 77 430 | **77 430** ✅ |
| `lemmas` | 32 | **32** ✅ |
| `lemma_translations` | 32 | **32** ✅ (28 FR validées) |

- Lots 1–9 présents : 13+3 / 17+1 / 19 / 20 / 20 / 20 / 20 / 100 / 250.
- HOLDs historiques **أَعْلَمُ · كُنَّا · وَإِن** : 0 `word_translation` FR validée, 0 mapping, absents du lot (identifiés par `word_id` fixe).
- Sourate 64 = 0 · Fātiḥah et pilotes protégés intacts.
- Aucune divergence → sélection autorisée.

## B. Sélection — 500 candidats (pool 877 C+P1, exclusions 486 + garde-fous live → 627)

- Règle : `coverage C + P1 + non enseigné + MASAQ`, hors 486 formes des Lots 1–9 et 3 HOLDs ; garde-fous live : 0 glose FR validée, 0 mapping safe.
- Sélection stratifiée par familles (fréquence décroissante), priorité LOW/HIGH puis MEDIUM, complément HIGH-RISK isolés pour revue ciblée (jamais acceptés automatiquement).
- **`word_id` = clé d'identité unique** ; formes stockées `quran_words` conservées à l'identique.

| Famille | Nb | Exemples |
|---|---:|---|
| Verbes (dont passifs/faibles/à clitiques) | 89 | خَلَقَكُمْ · جَعَلْنَـٰهُ · أَتَىٰكَ · كَتَبَ · يُرْجَعُونَ (passif) · تُحْشَرُونَ (passif) |
| Noms nus (dont noms propres) | 53 | أَحَدًۭا · دَابَّةٍۢ · قَرْيَةٍۢ · رَجُلٌۭ · تُرَابٍۢ · طِينٍۢ |
| Noms définis | 28 | ٱلْجَنَّةُ · ٱلنَّارُ ۖ · ٱلْحَقُّ · ٱلْـَاخِرَةَ · ٱلْقَرْيَةِ · ٱلسَّاعَةِ |
| Participes | 20 | ظَـٰلِمُونَ · مُّجْرِمِينَ · فَـٰسِقِينَ · غَـٰفِلُونَ · ٱلْجَـٰهِلِينَ |
| Résolvables par lemme | 23 | أَنْهَـٰرُ · أُمُورُ · أَعْمَـٰلُهُمْ · سَيِّـَٔاتِهِمْ |
| Grammaticales (particules/conjonctions) | 148 | إِنَّ · أَنْ · مِّنْ · فِي · عَلَى · هَلْ · لَوْ · لَمْ · لَنْ · حَتَّىٰ · كَمَا · أَيْنَ |
| Clitiques composés | 105 | إِلَيْهِ · عَلَيْهِ · مِنْهُمْ · بَيْنَهُمْ · لَهُمْ · فِيهَا · بِهِ · قَبْلَ · بَعْدَ · عِندَ |
| Inclassés (mots outils, sigles) | 34 | الٓمٓ · حمٓ · إِيَّاهُ · هُمُ · نَحْنُ |

## C. Propositions — 500/500 gloses · 0 mapping · 0 sans glose

- **31 LOW · 87 HIGH · 33 MEDIUM · 349 HIGH-RISK** (dont 105 clitiques composés + 148 grammaticales + verbes à clitique).
- Glossaire éditorial Hikma par stem MASAQ (noyau vérifié sur les 4 traductions 31/9001/20/153) + overrides par forme exacte pour les composés (préfixes وَ/فَ/لِ/بِ/كَ, prépositions إِلَى/عَلَى/مِنْ/عَنْ/فِي/بَيْنَ/قَبْلَ/بَعْدَ/عِندَ, pronoms objet/possessifs, particules إِنَّ/أَنَّ/هَلْ/لَوْ/لَمْ/لَنْ/سَوْفَ/حَتَّىٰ/لَعَلَّ/كَأَنَّ).
- **FORM > LEMME respecté** : mapping refusé pour toute forme composée (information grammaticale conservée dans la glose — précédents Lots 3/5/6/7/8/9).

Exemples : خَلَقَكُمْ « Il vous a créés / Il vous créa » · بِـَٔايَـٰتِنَا « par Nos signes / avec Nos versets » · لِّلنَّاسِ « pour les gens / aux gens » · إِلَيْهِ « à lui / vers lui » · عَلَيْكُم « sur vous / à votre charge » · تُحْشَرُونَ « vous serez rassemblés / vous serez réunis » (passif conservé).

## D. Cas sensibles — revue ciblée (obligatoire, taille non plafonnée)

**349 HIGH-RISK isolés** (`REVUE_CIBLEE` dans `lot10-proposals.json`) :
- Clitiques composés ×105 (préposition/conjonction + pronom/nom — mapping refusé) ;
- Particules grammaticales ×148 (إِنَّ/أَنْ/هَلْ/لَوْ/لَمْ/لَنْ/سَوْفَ/حَتَّىٰ/لَعَلَّ/كَأَنَّ — homographie et valeur exacte à confirmer occurrence-par-occurrence) ;
- Verbes à pronom objet / suffixes (خَلَقَكُمْ, جَعَلْنَـٰهُ, رَزَقْنَـٰهُمْ) ;
- Passifs (تُحْشَرُونَ, يُرْجَعُونَ, قُضِىَ, نُزِّلَ, أُوحِىَ) ;
- Formes faibles de كَان (كَانَتْ, كَانُوٓا۟, تَكُ, يَكُ — personnes à vérifier) ;
- Noms propres cliticisés (يَـٰمُوسَىٰٓ « ô Moïse », يَـٰبَنِىٓ « ô mon fils ») ;
- Locutions figées (كَذَٰلِكَ, كَأَنَّهُمْ, أَوَلَمْ).

**33 MEDIUM** : participes (ظَـٰلِمُونَ, مُّجْرِمِينَ…), attributs (ٱلْحَمِيدُ, ٱلْغَنِىُّ), passifs à confirmer.

**134 formes signalées < 2 sources sur l'échantillon** : à RE-CALCULER sur données live complètes lors de la revue (précédent 70I/70J : artefact d'échantillonnage, 4/4 sources en données complètes).

## E. HOLDs — OUT OF LOT 10 (inchangés)

أَعْلَمُ · كُنَّا · وَإِن — identifiés par `word_id` fixe (jamais uniquement par chaîne Unicode) : 0 wt FR, 0 mapping, aucun candidat du lot.

## F. Unicode

- **151 formes non-NFC documentées** (clé = word_id, aucune normalisation destructive ; comparaison NFC informative uniquement).
- Recherche des overrides par forme **normalisée NFC** (l'ordre shadda/voyelle varie entre formes stockées et littéraux) — la forme stockée n'est jamais modifiée.

## G. Tests & non-régression

Tests helpers **12 PASS / 0 FAIL / 1 INFO** : 500 candidats · word_id réels 500/500 · unicité · 0 glose/mapping existant · HOLDs absents · 0 candidat Lots 1–9 · déterminisme · 8 familles · HIGH-RISK isolés (349) · propositions 500/500 · gloses 500/500 · 151 non-NFC documentées.

`tsc` PASS · `eslint` PASS · `vitest` **775/775** PASS · `build` PASS.

## H. Baseline DB (inchangée)

`1017` FR validées · `188` mappings safe · MASAQ `22 485/44 677` · `24 944` translations · `21 296` quran_words · `77 430` occurrences · `32` lemmas · `32` lemma_translations (28 FR) · sourate 64 = 0 · HOLDs absents.

## I. Garanties

Aucune écriture DB · aucun DRY-RUN · aucun script d'APPLY · aucun commit/push · aucun Lot 11 · HOLDs non traités · sourate 64 et pilotes intacts · MASAQ intact.

## Artefacts

`tmp/phase70k/ground-truth.json` · `lot10-candidates.json` · `lot10-evidence.json` (500 dossiers) · `lot10-proposals.json` · `analyst-view.json` · `tests.json` · `stems-draft.json` · scripts READ-ONLY `tmp/phase70k-*.ts` · `PHASE_70K_REPORT.md`

---

---

# REVUE CIBLÉE — PHASE 70K / LOT 10 (décision humaine : REVUE CIBLÉE autorisée)

Analyse occurrence-par-occurrence sur données live complètes de **382 dossiers ciblés** (349 HIGH-RISK + 33 MEDIUM) — `tmp/phase70k/targeted-data.json` : toutes occurrences, POS MASAQ par occurrence, 4 traductions alignées.

## Verdict — **364 ACCEPT · 18 MODIFY · 0 HOLD · 0 REJECT · 0 MOVE_TO_LEMMA**

## Recalcul des sources — **134/134 ARTEFACTS, 0 vrai manque**
Les 134 formes signalées « < 2 sources » ont toutes **4/4 sources** en données live complètes. La cause du signalement était un artefact technique : le plafond PostgREST de 1000 lignes par réponse tronquait les occurrences (Phase 68B) — corrigé par pagination `.range()` dans les scripts d'extraction (select + targeted). Aucun problème lexical.

## Les 18 gloses MODIFY (intégrées par override word_id dans `lot10-proposals.json`)
| Forme | Avant → Après | Raison |
|---|---|---|
| كَتَبَ | « Il a prescrit / fut écrit » → **« Il a prescrit / Il a décrété »** | actif seulement (58:21-22 « Allah a prescrit ») — le passif « fut écrit » était une lecture erronée (tags MASAQ PV_PASS minoritaires) |
| وَيَقُولُ | « une parole / un propos » → **« et il dit / et il dira »** | verbe (3e pers. sg.) — glose nominale par stem قول erronée |
| لِّلْمُؤْمِنِينَ | « les croyants » → **« pour les croyants / aux croyants »** | لِ préservé — précédent لِلنَّاسِ (Lot 5) |
| لِلْمُؤْمِنِينَ | « les croyants » → **« pour les croyants / aux croyants »** | idem |
| لِّلْكَـٰفِرِينَ | « les mécréants » → **« pour les mécréants / aux mécréants »** | idem (précédent Lot 8) |
| لِّلْمُتَّقِينَ | « les pieux » → **« pour les pieux / aux pieux »** | idem |
| إِيَّاهُ | « Lui / c'est Lui » → **« Lui / c'est Lui que »** | 6:41 « C'est plutôt à Lui que vous feriez appel » |
| وَبَنِينَ | « des enfants » → **« et des enfants / et des fils »** | وَ préservé |
| وَٱلْقَمَرَ | « la lune » → **« et la lune »** | وَ préservé (36:39) |
| وَٱلشَّهَـٰدَةِ | « l'attesté / l'occulte et le visible » → **« et l'attesté / et le visible »** | وَ préservé |
| وَٱلْمُؤْمِنَـٰتِ | « les croyants » → **« et les croyantes / et les femmes croyantes »** | وَ + féminin pluriel (48:5) |
| وَلَمَّا | « lorsque / quand » → **« et lorsque / et quand »** | وَ préservé |
| وَلَن | « ne... jamais » → **« et ne... jamais »** | وَ préservé |
| وَعَلَىٰ | « sur / au-dessus de » → **« et sur / et au-dessus de »** | وَ préservé |
| وَهِىَ | « elle / tandis qu'elle » → **« et elle / tandis qu'elle »** | وَ préservé |
| بَعْضُكُمْ | « certains / une partie » → **« certains d'entre vous / une partie d'entre vous »** | clitique كُمْ préservé |
| قُلُوبُهُمْ | « les cœurs » → **« leurs cœurs »** | clitique هُمْ préservé |
| ءَامِنِينَ | « en sécurité / croyants » → **« en sécurité / en sûreté »** | faux-ami corrigé : آمِن « en sécurité » (15:46, 44:55) ≠ مؤمن « croyants » |

## Points clés des 364 ACCEPT
- **0 conflit IV/PV réel** sur les 82 verbes ciblés (les « POS multiples » = tags MASAQ constitutifs d'un même token cliticisé, ex. PV+SUBJ_PRON+OBJ_PRON).
- **22 passifs vérifiés** (voix conservée) : يُرْجَعُونَ, قُضِىَ, نُزِّلَ, أُوحِىَ, تُحْشَرُونَ, يُتْلَىٰ, أُوتِىَ…
- **Formes faibles de كَان vérifiées individuellement** : كَانَتْ « elle était » (23 occ, PV+FEM_TA), كَانُوٓا۟ « ils étaient » (19), وَكَانُوا۟ « et ils étaient » (30), وَكُنَّا « et nous étions » (15, 1re pl.), تَكُ « que tu sois » (2e sg.), يَكُ « qu'il soit » (3e sg.), كُن « sois » — personne/nombre/mode corrects, aucun HOLD.
- **Particules vérifiées** : أَمِ interrogatif « ou / est-ce que » (12/12, POS CONJ = artefact), هَلْ « est-ce que » (62), إِنَّ/أَنْ subjonctif « que » (56), لَوْلَا « pourquoi pas / si seulement » (20), حَتَّىٰ « jusqu'à » (47).
- **Mappings refusés ×105+** (clitiques composés — règles FORM > LEMME, précédents Lots 3/5/6/7/8/9).
- **Noms propres** : يَـٰمُوسَىٰٓ « ô Moïse » (VOC_PART+NOUN_PROP_FOREIGN), يَـٰبَنِىٓ « ô mon fils » — identité propre conservée.
- **Sigles coraniques** : الٓمٓ « Alif, Lâm, Mîm », حمٓ « Hâ, Mîm » — translittération directe.

## Périmètre final recommandé
**500 candidats · 500 GLOSE · 0 MOVE_TO_LEMMA · 0 HOLD · 0 REJECT** · 18 MODIFY intégrés · 349 HIGH-RISK (tous ACCEPT après revue) · 87 HIGH · 33 MEDIUM · 31 LOW

## Non-régression
`tsc` PASS · `eslint` PASS · `vitest` **775/775** PASS · `build` PASS · tests helpers **12 PASS / 0 FAIL / 1 INFO**

## Baseline DB (inchangée)
`1017` FR validées · `188` mappings · MASAQ `22 485/44 677` · `24 944` translations · `21 296` quran_words · `77 430` occurrences · `32` lemmas · `32` lemma_translations (28 FR) · HOLDs absents · sourate 64 = 0

**`DATABASE_WRITES = 0`** · Verdict : `PHASE_70K_LOT10_TARGETED_REVIEW_COMPLETE`

**Décision demandée (Gate 2)** : ACCEPT global du périmètre révisé (500 gloses, 18 modifications intégrées) / MODIFIER certaines gloses / HOLD certains cas / REJETER certains candidats / seconde revue ciblée. **Le DRY-RUN et l'APPLY ne pourront commencer qu'après votre décision explicite.**

---

# DRY-RUN — PHASE 70K / LOT 10 (Gate 1 ACCEPT GLOBAL + revue ciblée intégrée)

Script `tmp/phase70k-lot10-import.ts` (verrouillé : `APPLY=1` requis pour toute écriture) — exécuté en **DRY-RUN strictement READ-ONLY**.

## Résultats DRY-RUN
| Critère | Résultat |
|---|---|
| Candidats | **500** |
| INSERT | **500** |
| ALREADY_EXISTS | **0** |
| Divergence | **0** |
| Collision | **0** |
| Écrasement | aucun risque (0 ligne existante) |
| Mapping / lemmas / lemma_translations | **0 / 0 / 0** |
| HOLDs (hors périmètre) | 3 : أَعْلَمُ · كُنَّا · وَإِن (vérifiés par word_id fixe, 0 wt, 0 mapping) |
| Unicode | **500/500 NFC match** · **151 formes non-NFC documentées** (clé = word_id, aucune normalisation destructive) |
| Provenance | « Hikma — lexique éditorial » existante · fr · `is_validated=true` + `validated_at` horodaté (invariant base) |
| Idempotence | `UNIQUE(word_id, language, source_id)` — 500 INSERT attendus au 1er APPLY, 0 doublon |
| Diff DB attendu | uniquement `word_translations` **+500** |
| MODIFY intégrés | **18/18 présents dans le plan** (كَتَبَ actif · وَيَقُولُ verbe · لِّلْـ prépositions · وَ/conjonctions · clitiques كُمْ/هُمْ · ءَامِنِينَ faux-ami · إِيَّاهُ) |
| Écriture future | strictement limitée à `word_translations` (toutes autres tables = 0) |

## Baseline DB (live, avant import)
`1017` FR validées · `188` mappings safe · MASAQ `22 485`/`44 677` · `24 944` translations · `21 296` quran_words · `77 430` occurrences · `32` lemmas · `32` lemma_translations (28 FR) · sourate 64 = 0 · Fātiḥah et pilotes protégés.

## Non-régression
Tests helpers **12 PASS / 0 FAIL / 1 INFO** · `tsc` PASS · `eslint` PASS · `vitest` **775/775** PASS · `build` PASS

## Garanties
Écriture future strictement limitée à `word_translations` · tables MASAQ/métier intactes · sourate 64 = 0 · Fātiḥah et pilotes protégés · aucun commit/push · aucun Lot 11 · HOLDs non traités.

### Artefacts
`tmp/phase70k/lot10-review-decisions.json` · `lot10-targeted-review.json` · `lot10-import-summary.json` · script `tmp/phase70k-lot10-import.ts` (APPLY verrouillé par `APPLY=1`) · `PHASE_70K_REPORT.md`

**Aucune écriture DB n'a eu lieu.** Verdict : `PHASE_70K_LOT10_DRY_RUN_READY` avec `DATABASE_WRITES = 0`.

**Autorisez-vous l'APPLY réel des 500 `word_translations` du Lot 10 ?** L'APPLY n'aura lieu qu'après cette autorisation humaine séparée et explicite.
