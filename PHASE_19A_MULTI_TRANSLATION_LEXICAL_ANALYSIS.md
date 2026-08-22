# PHASE 19A — ANALYSE LEXICALE MULTI-TRADUCTIONS DES 14 LEMMES

## STATUT

**READ_ONLY — COMPLETE** · **DATABASE_WRITES = 0** · **IMPORTS = 0** · **VALIDATIONS = 0** · **MIGRATIONS = 0**

Analyse réalisée à partir du **corpus réel** Hikma après l'import Kazimirski 1869 (Phase 18C) : 4 traductions complètes disponibles — Hamidullah (fr, rid 31), Kazimirski 1869 (fr, rid 9001), Sahih International (en, rid 20), Hamza Roberto Piccardo (it, rid 153).

---

## 1. Corpus analysé

| Mesure | Valeur |
|---|---|
| Lemmes analysés | **14** (exactement ceux demandés) |
| quran_words liés aux 14 lemmes | **91** (sur 135 mots avec lemma_id dans le corpus) |
| Occurrences couvertes | **3 275** |
| Ayahs distincts concernés | **2 206** |
| Traductions récupérées (4 sources, alignées sur ayah_id) | **8 824** (2 206 × 4) |

**Méthode** : pour chaque occurrence, les 4 traductions du **même ayah_id** ont été récupérées et comparées (jamais des versets différents). L'analyse distingue `DIRECT_EQUIVALENT`, `CONTEXTUAL_EQUIVALENT`, `GRAMMATICAL_FUNCTION` ; le français est la source principale, l'anglais et l'italien servent de contrôle.

## 2. Tableau final

| Lemme | Occurrences | Hamidullah | Kazimirski | Convergence FR | Sens/contextes | Glose | Confiance |
|-------|------------|------------|------------|---------------|----------------|-------|-----------|
| يَوْم | 217 | jour · Jour de la Rétribution · Jour de la Résurrection | jour · jour de la rétribution · jour de la résurrection | ✅ forte | jour (durée) · Jour eschatologique (Rétribution, Résurrection, Dernier) | « jour » | **HIGH** |
| رَسُول | 52 | Messager · Messagers · Messager d'Allah | envoyé · apôtres · envoyé de Dieu | ✅ forte | messager envoyé (prophètes, Muhammad) · « apôtre » archaïque chez Kazimirski | « messager / envoyé » | **HIGH** |
| رَحْمَة | 34 | miséricorde · miséricorde d'Allah | miséricorde · miséricorde de Dieu | ✅ forte | miséricorde divine (attribut) · bienfait accordé | « miséricorde » | **HIGH** |
| أَرْض | 291 | la terre · sur la terre | la terre · sur la terre | ✅ forte | terre-monde · surface/lieu d'action · demeure (firâsh) | « terre » | **HIGH** |
| كِتَاب | 47 | Livre · le Livre · Livre d'Allah · Thora | livre · Écritures · livres sacrés · Pentateuque | ✅ forte | révélation écrite · Coran · Torah/Évangile · loi/prescription | « livre / Écriture » | **HIGH** |
| قَوْم | 79 | gens · peuple · un groupe | hommes · tribu · quelques hommes | ⚠️ moyenne | collectif de personnes · communauté · groupe | « peuple / gens » | **MEDIUM** |
| نَاس | 182 | les gens · hommes · Ô hommes | hommes · Ô hommes | ✅ forte | humanité · gens (indéfini) · vocatif « Ô hommes » | « gens / hommes » | **HIGH** |
| عَذَاب | 150 | châtiment · grand · douloureux · humiliant | châtiment · cruel · douloureux | ✅ forte | punition divine · du Feu · qualifiée (alîm, azîm, muhîn) | « châtiment » | **HIGH** |
| نَبِيّ | 30 | Prophète · Prophète illettré | prophète · prophète illettré | ✅ forte | prophète (Muhammad, titre) · prophètes · ummî | « prophète » | **HIGH** |
| عَبْد | 5 | serviteur · Serviteur d'Allah | serviteur · serviteur de Dieu | ✅ forte | serviteur de Dieu (Jésus, Muhammad) · serviteur repentant | « serviteur (de Dieu) » | **HIGH** |
| لَا | 749 | ne…pas · aucun · non | ne…point · ne…pas · ni | ✅ forte | négation verbale, nominale, coordonnée, réponse | « non / ne…pas (particule de négation) » | **HIGH** |
| كَان | 323 | était · fut · est | était · n'était point · fut | ✅ forte | copule du passé · existence · aspect inaccompli (habitude) | « être » | **HIGH** |
| كَفَر | 18 | mécréant · n'a jamais été mécréant | infidèle · fut infidèle | ✅ forte | ne pas croire / renier · substantif « mécréant / infidèle » | « être incrédule / ne pas croire » | **HIGH** |
| فِي | 1 098 | dans · en · à · sur | dans · en · sur | ✅ forte | localisation concrète, figurée, spatiale | « dans / en (préposition) » | **HIGH** |

## 3. LEMMES PRÊTS POUR GLOSE

13 lemmes sur 14 atteignent **HIGH** : convergence nette des deux traductions françaises, occurrences multiples, noyau sémantique stable et glose courte directement fondée sur le corpus :

- **يَوْم** → « jour »
- **رَسُول** → « messager / envoyé »
- **رَحْمَة** → « miséricorde »
- **أَرْض** → « terre »
- **كِتَاب** → « livre / Écriture »
- **نَاس** → « gens / hommes »
- **عَذَاب** → « châtiment »
- **نَبِيّ** → « prophète »
- **عَبْد** → « serviteur (de Dieu) »
- **لَا** → « non / ne…pas » *(fonction grammaticale)*
- **كَان** → « être » *(copule / verbe d'état)*
- **كَفَر** → « être incrédule / ne pas croire »
- **فِي** → « dans / en » *(préposition)*

> ⚠️ La glose de **لَا**, **كَان** et **فِي** est une **description de fonction grammaticale**, pas une traduction lexicale — conforme à l'objectif de la phase (section 8).

## 4. LEMMES NÉCESSITANT UNE REVUE

- **قَوْم** → **MEDIUM**. 79 occurrences, mais variations contextuelles marquées : « gens », « peuple », « groupe », « tribu », « hommes » selon le contexte. Le noyau « collectif de personnes » est clair ; une glose unique « peuple / gens » est possible mais mérite une formulation éditoriale validée par un réviseur, avec ses variations documentées.

## 5. Constats lexicographiques (corpus réel)

- **Divergence de registre 19ᵉ/20ᵉ siècle** : Kazimirski rend رَسُول par « apôtre »/« envoyé » là où Hamidullah dit « Messager » ; كَفَر par « infidèle » là où Hamidullah dit « mécréant ». Même **noyau sémantique**, vocabulaire différent — l'analyse distingue bien DIRECT_EQUIVALENT (convergence) et CONTEXTUAL_EQUIVALENT (registre), sans conclure à des sens différents.
- **فِي** : « dans » (cœurs, ténèbres), « en » (doute, figuré), « sur » (la terre). Fonction prépositionnelle classique.
- **كَان** : majoritairement copule du passé (« était », « fut ») ; valeurs aspectuelles observées (inaccompli d'habitude en 2:75). Aucun cas justifiant un sens lexical autonome.
- **لَا** : négation totale (2:2 « aucun doute »), verbale (« ne croiront pas »), coordonnée (« ni…ni »). Fonction de négation, jamais lexicale.
- **يَوْم** : fort poids eschatologique — « Jour de la Rétribution » (1:4), « Jour de la Résurrection » (2:113, 2:212), « Jour Dernier » (2:8). Contexte temporel simple aussi (2:259 « un jour »).

## 6. lemma_translations — inchangées

Les 4 entrées existantes (عَبْد · رَحْمَة · لَا · أَرْض) restent **strictement inchangées** : `is_validated = false`, `validated_at = NULL`, source `567c8b5d-…` (Kazimirski Dictionnaire 1860). **Aucune glose n'a été importée, validée ni modifiée.** Les 10 autres lemmes n'ont **pas** été ajoutés à `lemma_translations`.

## 7. Non-régression

| Compteur | Attendu | Constaté |
|---|---|---|
| quran_words | 21 296 | **21 296** ✅ |
| word_occurrences | 77 430 | **77 430** ✅ |
| ayahs | 6 236 | **6 236** ✅ |
| translations | 24 944 | **24 944** ✅ |
| word_translations | 8 | **8** ✅ |
| lemmas | 22 | **22** ✅ |
| sources | 4 | **4** ✅ |
| lemma_translations | 4 | **4** ✅ |

| Contrôle | Résultat |
|---|---|
| `npm test` | ✅ 184/184 |
| `npx tsc --noEmit` | ✅ 0 erreur |
| `npm run lint` | ✅ 0 erreur |
| `npm run build` | ✅ 0 erreur |
| `npm run verify:persistence` | ✅ 13/13 |
| `npm run verify:rls` | ✅ 27/27 |

## 8. Livrables

- 📄 `PHASE_19A_MULTI_TRANSLATION_LEXICAL_ANALYSIS.md` (ce rapport)
- 📄 `tmp/phase19a-multi-translation-analysis.json` (**14 objets**, un par lemme — schéma complet : lemma, lemma_id, quran_word_ids, forms, occurrence_count, ayah_count, sample_ayahs, french_evidence, control_evidence, semantic_core, contextual_variations, proposed_gloss, confidence)
- 📁 Données intermédiaires : `tmp/phase19a-words.json` (91 mots), `tmp/phase19a-occurrences.json` (3 275), `tmp/phase19a-ayahs.json` (2 206), `tmp/phase19a-translations.json` (8 824)

---

## ARRÊT OBLIGATOIRE

**DATABASE_WRITES = 0 · IMPORTS = 0 · VALIDATIONS = 0 · MIGRATIONS = 0.** Aucune glose importée, aucune validation. La phase suivante (décision éditoriale : sélection des gloses, validation humaine, import éventuel dans `lemma_translations`) ne sera engagée qu'après lecture de ce rapport.
