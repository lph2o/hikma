# PHASE 21B — PART A — AUDIT + PRÉPARATION DES GLOSES PRIORITAIRES

## STATUT

**STATUS = GLOSS_PROPOSALS_READY** · **READ_ONLY** · **DATABASE_WRITES = 0**

**IMPORTS = 0 · VALIDATIONS = 0 · MIGRATIONS = 0 · SEEDS = 0**

Aucune glose importée, aucune glose validée, aucune donnée modifiée.

---

## 1. Baseline (identique à 21A, vérifié)

| Table | Valeur | vs 21A |
|---|---|---|
| quran_words | 21 296 | ✅ identique |
| word_occurrences | 77 430 | ✅ identique |
| ayahs | 6 236 | ✅ identique |
| translations | 24 944 | ✅ identique |
| word_translations | 8 | ✅ identique |
| lemmas | 22 | ✅ identique |
| sources | 4 | ✅ identique |
| lemma_translations | 18 | ✅ identique |

---

## 2. Vérification du modèle lexical — FORME → LEMME → OCCURRENCES

Le modèle est **correctement branché** (FORME > LEMME > EN, vérifié en 20B), mais le
**mapping lemma_id est PARTIEL** pour les priorités. Cause racine documentée :
la segmentation Quran.com **fusionne proclitiques** (و، ب، ف، ل، ت، ك) **et
enclitiques pronominaux** dans des unités « mot » distinctes. Le `lemma_id` ne
couvre donc que les formes **nues**.

### الله (nom propre divin)

| Champ | Valeur |
|---|---|
| lemma_id | `62b46eb1-9234-4bd3-88b0-0298c25ebe6b` |
| formes mappées | 16 (nom. ٱللَّهُ · acc. ٱللَّهَ · gén. ٱللَّهِ + variantes de ponctuation ۖ ۚ ۗ ۘ ۙ + rubʿ ۞) |
| occurrences mappées | 2 153 |
| ayahs | 1 566 |
| racine | ء-ل-ه (non renseignée en base) |
| meaning actuel | null (glose de lemme absente) |

**Formes NON mappées (~400 occ)** : وَٱللَّهُ (239), بِٱللَّهِ (128 + variantes),
تَٱللَّهِ (8, serment), فَٱللَّهُ (6), ٱللَّهُمَّ (5, vocatif « Ô Allah »), وَٱللَّهِ (1).
→ **STATUS = MAPPING_REVIEW_REQUIRED** (complétude proclitique). La glose reste non ambiguë.

### رَبّ (nom commun « seigneur/maître »)

| Champ | Valeur |
|---|---|
| lemma_id | `01021c14-2f6b-4ce7-b18b-0c21557c023b` |
| formes mappées | 7 (رَبِّ 80 · رَّبِّ 18 · رَبُّ 18 · رَبَّ 5 …) |
| occurrences mappées | 128 |
| ayahs | 124 |
| racine | ر-ب-ب (non renseignée en base) |

**Formes NON mappées (suffixes pronominaux, ~50-80 formes réelles, ~700-800 occ)** :
رَبِّكَ (70), رَبِّي (61), رَبَّكَ (52), رَبِّهِمْ (47), رَبَّنَا (40), رَبُّكَ (38),
رَبِّكُمَا (31)… Le regroupement technique par noyau normalisé « رب » surestime
légèrement (faux positifs des racines ر-ب-ص « épier », ق-ر-ب « proximité »,
ر-ب-و « usure »).
→ **STATUS = MAPPING_REVIEW_REQUIRED** (complétude enclitique). La glose reste non ambiguë.

### لِلَّه (construction prépositionnelle)

| Champ | Valeur |
|---|---|
| lemma_id | `190c14de-25f5-4d83-b680-c8cd258d4d19` |
| formes mappées | 7 (لِلَّهِ 86 · لِلَّهِ ۚ 12 …) |
| occurrences mappées | 116 |
| ayahs | 113 |

→ Mapping quasi complet (1 faux positif hors champ). **Pas un lexème distinct** :
`لِلَّه = لِ + الله` (préposition de dédicace/appartenance).

---

## 3. Cas الله / رَبّ / لِلَّه — relations morphologiques

| Question | Réponse |
|---|---|
| Trois lemmes distincts ? | **Trois lignes `lemmas` distinctes**, mais **deux lexèmes** : الله (nom propre) et رَبّ (nom commun). لِلَّه est un **composé** de الله, pas un lexème indépendant. |
| Relation morphologique | لِلَّه = préposition لِ + الله. الله et رَبّ n'ont **aucune** relation morphologique (racines ء-ل-ه vs ر-ب-ب). |
| Formes rattachées | الله : 16 formes nues. رَبّ : 7 formes nues. لِلَّه : 7 formes. |
| Hamidullah | Allah · Seigneur · à Allah |
| Kazimirski 1869 | Dieu · maître/souverain · à Dieu |
| Sahih EN / Piccardo IT | Allāh/Allah · Lord/Signore · to Allāh/ad Allah |
| Convergence | Oui, forte sur les trois. Variation notable : Kazimirski lexicalise الله → « Dieu » et رَبّ → « maître/souverain » (tandis que Hamidullah conserve « Allah » et « Seigneur »). |
| Variations contextuelles | الله : aucune (nom propre). رَبّ : sens profane « maître » hors contexte divin. لِلَّه : aucune. |

**Aucune nouvelle relation lemma_id créée. Aucun corpus modifié.**

---

## 4. Analyse multi-traductions (extraits réels)

| Verset | Hamidullah FR | Kazimirski FR | Sahih EN | Piccardo IT |
|---|---|---|---|---|
| 1:1 | Au nom d'**Allah**, le Tout Miséricordieux… | Au nom du **Dieu** clément… | In the name of **Allāh**… | In nome di **Allah**… |
| 1:2 | Louange à **Allah**, **Seigneur** de l'Univers | Louange à **Dieu**, **maître** de l'univers | [All] praise… **Lord** of the worlds | La lode… **ad Allah**, **Signore** dei mondi |
| 1:3 | le **Tout Miséricordieux**, le **Très Miséricordieux** | le **clément**, le **miséricordieux** | the **Entirely Merciful**, the **Especially Merciful** | il **Compassionevole**, il **Misericordioso** |
| 2:255 | **Allah!** Point de divinité à part Lui… | **Dieu**, est le seul Dieu… | **Allāh** — there is no deity except Him… | **Allah!** Non c'è altro dio che Lui… |
| 13:16 | …Qui est le **Seigneur** des cieux… **Allah** | …Quel est le **souverain** des cieux… **Dieu** | …Who is **Lord**… **Allāh** | …il **Signore** dei cieli… **Allah!** |
| 6:162 | …appartiennent **à Allah**, Seigneur de l'Univers | …appartiennent **à Dieu**, maître de l'univers | …are **for Allāh**, Lord of the worlds | …appartengono **ad Allah** Signore dei mondi |

---

## 5 & 6. Propositions de gloses + contrôle anti-réduction

**8 lemmes FORM_ONLY** (import possible en phase ultérieure, `is_validated=false`) :

| Lemme | Glose proposée | Confiance | Anti-réduction |
|---|---|---|---|
| الله | **Allah** | HIGH | Nom propre, aucune polysémie |
| رَبّ | **Seigneur** | HIGH | Variante « maître/souverain » (Kazimirski) documentée |
| لِلَّه | **à Allah / pour Allah** | HIGH | Construction stable |
| الْعَـٰلَمِين | **les mondes / l'univers** | HIGH | Ne pas réduire à « univers » seul (pluralité des mondes) |
| الرَّحْمَـٰن | **le Tout Miséricordieux** | HIGH | Distinguer de الرَّحِيم |
| الرَّحِيم | **le Très Miséricordieux** | HIGH | Noter 9:128 (épithète appliquée au Prophète) |
| الْحَمْد | **la louange** | HIGH | « الحمد لله » = « louange à Allah » en note |
| بِسْم | **au nom de** | HIGH | Déjà couvert au niveau FORME → P4 |

**15 nouveaux candidats** (création de lemme + mapping REQUIS avant toute glose) :

| Lemme | Glose proposée | Confiance | Anti-réduction |
|---|---|---|---|
| قَالَ | dire | HIGH | Verbe le plus fréquent (932 occ) |
| ءَامَنَ | croire | HIGH | + participe مُؤْمِن « croyant » |
| سَمَاء | ciel / cieux | HIGH | singulier/pluriel سَمَاوَات |
| عَلِمَ | savoir / connaître | HIGH | distinguer de عَلِيم « omniscient » |
| حَقّ | vérité / droit | **MEDIUM** | polysémie vérité/droit → glose double |
| شَىْء | chose | HIGH | « كُلّ شَيْء » en note |
| عَمِلَ | agir / œuvrer | HIGH | « عَمِلُوا الصَّالِحَات » en note |
| خَلَقَ | créer | HIGH | acte divin |
| خَيْر | bien / meilleur | **MEDIUM** | substantif/comparatif |
| هُدًى | guidance / guider | **MEDIUM** | nom + verbe هَدَى |
| ظَلَمَ | être injuste / l'injustice | **MEDIUM** | racine ظ-ل-م ≠ ظُلُمَات « ténèbres » |
| سَبِيل | chemin / voie | HIGH | « في سبيل الله » en note |
| عَلِيم | omniscient | HIGH | épithète divine |
| نَار | feu / le Feu (l'Enfer) | **MEDIUM** | sens littéral vs eschatologique |
| دُنْيَا | vie d'ici-bas / ce bas monde | HIGH | opposition avec آخِرَة |

**Contrôle anti-réduction appliqué** : 5 gloses MEDIUM (حَقّ، خَيْر، هُدًى، ظَلَمَ، نَار)
portent une glose double + contextual_variations obligatoires. Aucune glose
« polysémique → traduction unique » sans limite documentée.

---

## 7. Priorisation — TOP 25

P1 (impact pédagogique très élevé) : الله, رَبّ, لِلَّه, قَالَ, ءَامَنَ, سَمَاء,
عَلِمَ, حَقّ, شَىْء — **+ مِن, مَا (grammaticales, P1 mais GRAMMATICAL_MAPPING_REQUIRED)**.

P2 (impact élevé) : عَمِلَ, خَلَقَ, خَيْر, هُدًى, ظَلَمَ, سَبِيل, عَلِيم, نَار,
دُنْيَا, الْعَـٰلَمِين, الرَّحْمَـٰن, الرَّحِيم, الْحَمْد.

P4 (faible) : بِسْم (forme déjà couverte).

> Le TOP 25 complet (rank, priorité, occurrences, glose) est dans
> `tmp/phase21b-priority-lemma-expansion.json` → `top_25`.

---

## 8. Croisement avec les leçons existantes

Les 3 leçons (basmala, al-hamd, ar-rahman — 10 mots) couvrent les **8 lemmes
FORM_ONLY** au niveau FORME (100 % FR forme validé, 0 fallback EN). Les gloses
de lemme étendraient la couverture FR aux **34 autres formes** de ces 8 lemmes
(dont les cas nom./acc. de الله et رَبّ) actuellement EN-only.

Les **15 nouveaux candidats** sont **invisibles** : 0 leçon ne les expose.

---

## 9. Extension du corpus de leçons (recommandation, pas d'action)

Après enrichissement lexical, créer en priorité :
1. **Al-Fatiha 1:4–1:7** — مَالِك (roi), يَوْم (couvert), دِين (religion), عَبَدَ (adorer), هُدًى/اهْدِنَا, صِرَاط (chemin).
2. **آية الكرسي (2:255)** — الله, حَىّ, قَيُّوم, عَلِيم, سَمَاء, أَرْض, شَىْء, شَاءَ, عَظِيم.
3. **Création** — خَلَقَ, سَمَاء, أَرْض, نُور, ظُلُمَات.
4. **La foi** — ءَامَنَ, كَفَرَ, حَقّ, هُدًى, صَالِحَات.
5. **Al-Ikhlas (112)** — قُلْ, هُوَ, الله, أَحَد, صَمَد (sourate courte, forte valeur débutant).

---

## 10. Mapping grammatical (مِن · مَا · إِنَّ)

| Forme | Occurrences | Problème | Glose proposée | Statut |
|---|---|---|---|---|
| مِن / مِنَ / مِّن / مِّنَ / مِنْ / مِّنْ / مِنۢ | 2 326 | 7+ formes de surface, **1 préposition**, lemma_id absent | de / à partir de | GRAMMATICAL_MAPPING_REQUIRED |
| مَا / مَآ / مَّا | 989 | multifonctionnel (relatif/interrogatif/négatif) | ce que / quoi (≈ ne…pas) | GRAMMATICAL_MAPPING_REQUIRED · **REVIEW_REQUIRED** |
| إِنَّ / إِنَّا / إِنَّهُم / إِنَّكُم… | 870 | particule assertive + pronom fusionné | certes / en vérité | GRAMMATICAL_MAPPING_REQUIRED |

**Solution technique recommandée (phase ultérieure, non exécutée)** : table de
mapping `normalized_text → lemma_id` (avec lemmes grammaticaux dédiés), **sans
modifier quran_words ni le resolver**.

---

## 11. Interdictions respectées

Aucune des opérations suivantes n'a été effectuée : modification de lemmas,
quran_words, lemma_translations ; création de gloses en base ; validation ;
modification du resolver, de buildWordBank ; migrations ; création de sources ;
import. **Tout est resté READ_ONLY (SELECT uniquement).**

---

## 12. Non-régression

| Commande | Résultat |
|---|---|
| `npm test` | **190/190** ✅ |
| `npx tsc --noEmit` | ✅ 0 erreur |
| `npm run lint` | ✅ 0 erreur |
| `npm run build` | ✅ (13 routes) |
| `npm run verify:persistence` | 13/13 ✅ |
| `npm run verify:rls` | 27/27 ✅ |

Compteurs DB strictement identiques à 21A (re-vérifiés après les scripts).

---

## 13. Livrables

- 📄 `PHASE_21B_PRIORITY_LEMMA_EXPANSION.md` (ce rapport)
- 📄 `tmp/phase21b-priority-lemma-expansion.json` (`GLOSS_PROPOSALS_READY`)
- 📄 `tmp/phase21b-extract.json` (extraction READ-ONLY brute)
- 📄 scripts READ-ONLY : `tmp/phase21b-extract.ts`, `phase21b-analyze.ts`, `phase21b-mapping.ts`, `phase21b-candidates.ts`, `phase21b-build.ts`

---

## 14. Arrêt obligatoire — synthèse

1. **Priorités confirmées** : 23 (8 FORM_ONLY + 15 nouveaux candidats).
2. **Priorités rejetées** : aucune (aucune glose écartée — toutes documentées).
3. **Mappings ambigus** : الله (proclitiques) et رَبّ (enclitiques) →
   MAPPING_REVIEW_REQUIRED ; لِلَّه = composé de الله.
4. **Propositions de gloses** : 23 (voir JSON `proposals`).
5. **Niveaux de confiance** : 18 HIGH · 5 MEDIUM · 0 REVIEW_REQUIRED (grammaticale مَا = REVIEW_REQUIRED).
6. **Impact pédagogique** : P1 × 11 (dont 2 grammaticales) · P2 × 13 · P4 × 1.
7. **Gloses prêtes pour une future phase d'import/validation** : les **8 lemmes
   FORM_ONLY** (import `is_validated=false` + revue éditoriale, chaîne 19A→19E).
   Les 15 nouveaux candidats exigent **d'abord** la création des lemmes (mapping).

**FIN PHASE 21B-A — aucune glose importée, aucune glose validée.**
