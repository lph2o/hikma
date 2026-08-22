# PHASE 23D — PRÉPARATION DES DONNÉES LEXICALES AL-FATIHA

Analyse des 17 DATA_GAPS · Propositions de gloses FR · Mapping de lemmes

**STATUS : `PEDAGOGICAL_GLOSS_PREPARATION_COMPLETE`** · Mode `READ_ONLY`

Garanties : `DATABASE_WRITES = 0` · `MIGRATIONS = 0` · `STORAGE_WRITES = 0` · `PRODUCTION_CODE_CHANGES = 0`

---

## A. État initial

| Donnée | Valeur |
|---|---|
| quran_words | 21 296 |
| word_occurrences | 77 430 |
| lemma_translations validées | 18 |
| word_translations validées | 8 |
| word_lemma_mapping SAFE | 171 |
| word_audio | 21 295 |
| Al-Fatiha : formes | 26 |
| — READY | 9 |
| — DATA_GAP | 17 (11 lexicales P0 + 6 grammaticales P1/P2) |
| — lemme direct | 9 · mapping 0 · sans lemme 17 |
| — racines | 0/26 |

---

## B. Les 26 formes analysées

La matrice exhaustive (word_id, forme, ayah, position, lemme proposé, glose FR
proposée, confiance, preuves, décision) est livrée dans
**`tmp/phase23d-al-fatiha-gloss-matrix.json`**.

---

## C. Les 11 P0 lexicales — propositions

| Forme | Lemme proposé | Glose FR proposée | Confiance |
|---|---|---|---|
| مَـٰلِكِ | مَالِك | souverain / maître | HIGH |
| ٱلدِّينِ | دِين | rétribution / religion | HIGH |
| نَعْبُدُ | عَبَدَ (adorer) | nous adorons | HIGH |
| نَسْتَعِينُ | اِسْتَعَانَ | nous implorons le secours | HIGH |
| ٱهْدِنَا | هَدَى | guide-nous | HIGH |
| ٱلصِّرَٰطَ | صِرَاط | le chemin / la voie | HIGH |
| صِرَٰطَ | صِرَاط (même lemme) | chemin / voie | HIGH |
| ٱلْمُسْتَقِيمَ | مُسْتَقِيم | droit | HIGH |
| أَنْعَمْتَ | أَنْعَمَ | Tu as comblé de bienfaits | HIGH |
| ٱلْمَغْضُوبِ | مَغْضُوب | ceux qui encourent la colère | HIGH |
| ٱلضَّآلِّينَ | ضَالّ | les égarés | HIGH |

Les 11 sont **HIGH** : chaque glose converge avec la **glose EN** (Quran.com WbW,
déjà dans Hikma) **et** la **traduction Hamidullah** du verset (déjà dans Hikma).

---

## D. Les 6 grammaticales P1/P2 — traitement

| Forme | Traitement pédagogique | Décision |
|---|---|---|
| غَيْرِ | glose contextuelle « autre que / à l'exception de » | VALIDATE_CANDIDATE (HIGH) |
| ٱلَّذِينَ | glose simple « ceux qui » (pronom relatif) | VALIDATE_CANDIDATE (HIGH) |
| عَلَيْهِمْ | glose simple « sur eux » (préposition + suffixe) | VALIDATE_CANDIDATE (HIGH) |
| وَلَا | **réutiliser** le lemme لَا existant (« non / ne…pas ») + conjonction و | REUSE_EXISTING_LEMMA |
| إِيَّاكَ | enseignement contextuel (Hamidullah « C'est toi que… »), pas de glose forcée | REVIEW_REQUIRED |
| وَإِيَّاكَ | regrouper avec إِيَّاكَ (و = et) | REVIEW_REQUIRED |

**Aucune glose lexicale artificielle** n'est forcée sur une particule.

---

## E. Propositions de lemmes

10 lemmes distincts proposés : مَالِك، دِين، عَبَدَ، اِسْتَعَانَ، هَدَى، صِرَاط،
مُسْتَقِيم، أَنْعَمَ، مَغْضُوب، ضَالّ.

Analyse détaillée (existence en DB, homographes, gain) dans
**`tmp/phase23d-al-fatiha-lemma-analysis.json`**.

---

## F. Propositions de gloses FR

Toutes dans la matrice + **`tmp/phase23d-al-fatiha-evidence.json`**. Chaque glose
est **courte, pédagogique, lexicalement défendable, cohérente avec le contexte
coranique et réutilisable** pour les autres occurrences du même lemme.

---

## G. Preuves pour chaque proposition

Sources (priorité) :
1. données lexicales Hikma (glose EN Quran.com WbW) ;
2. traductions FR déjà utilisées (word_translations / lemma_translations) ;
3. **Hamidullah** (table `translations`, versets 1:4–1:7) :
   - 1:4 « Souverain au jour de la rétribution » ;
   - 1:5 « C'est toi que nous adorons, c'est toi dont nous implorons le secours » ;
   - 1:6 « Dirige-nous dans le sentier droit » ;
   - 1:7 « …ceux que tu as comblés de tes bienfaits, non pas de ceux qui ont
     encouru ta colère, ni de ceux qui s'égarent » ;
4. Kazimirski (consultée, aucune ajoutée) ;
5. lexicographie arabe standard (corroboration).

---

## H. Niveau de confiance

- **HIGH** : glose EN + Hamidullah FR + lemme clair convergent → les 11 P0 et 3 P1.
- **MEDIUM / LOW** : aucun cas.
- Règle respectée : **LOW n'est jamais transformé en VALIDATE_CANDIDATE**.

---

## I. Homographes détectés

| Cas | Risque | Décision |
|---|---|---|
| عَبَدَ (adorer) vs عَبْد (serviteur) | **fort** — عَبْد existe déjà (FR validé) | le lemme عَبْد NE doit PAS être réutilisé pour نَعْبُدُ ; créer عَبَدَ séparément |
| دِين (religion) vs دَيْن (dette) | moyen | split éditorial (دين vs دين) |
| هَدَى (guider) vs هَدِيَّة (cadeau) / شَهَدَ (témoigner) | moyen | split éditorial |
| مُسْتَقِيم (droit) vs قَوْم (peuple) | racine قوم partagée | lemmes distincts |
| مَالِك (souverain) vs مَلِك (roi) | lecture alternative | documenté, glose « souverain / maître » |
| ضَالّ vs ظِلّ (ombre) | lettres distinctes (ض/ظ) | aucun regroupement |

**Règle conservée** : `normalized_text` n'est **jamais** une clé de résolution
lexicale ; le mapping doit être linguistique et déterministe. Tout cas ambigu → REVIEW_REQUIRED.

---

## J. Gain potentiel — Al-Fatiha

Après validation des seules propositions P0 :
- **11 formes** obtiennent une glose FR ;
- **20/26 formes** d'Al-Fatiha auront une glose FR (9 existantes + 11 proposées) ;
- **10 lemmes** nouveaux couvriraient **11 formes** (صِرَاط regroupe 2 formes) ;
- restent **6 formes grammaticales** (traitées en contexte / réutilisation) ;
- **0 forme réellement bloquante** après P0.

---

## K. Gain potentiel — global (ESTIMATION)

| Lemme | Formes suppl. (estim.) | Occurrences (estim.) |
|---|---|---|
| صِرَاط | 11 | 45 |
| مُسْتَقِيم | 10 | 37 |
| مَغْضُوب (غضب) | 14 | 23 |
| ضَالّ (ضلل) | 12 | 32 |
| أَنْعَمَ (نعم) | ~30 | ~60 |
| دِين | ~25 | ~60 |
| عَبَدَ (adorer) | ~20 | ~45 |
| هَدَى | ~18 | ~40 |
| اِسْتَعَانَ | ~5 | ~12 |
| مَالِك | ~4 | ~8 |

**Total estimé : ~140–150 formes et ~360–380 occurrences** pourraient devenir
résolubles en FR — **POTENTIAL_GAIN**, jamais ACTUAL_GAIN (aucune écriture).

**Mise en garde** : ces estimations sont **approximatives** (matching par squelette
dédiacritisé) et contaminées par des homographes ; elles exigent une validation
éditoriale avant tout mapping. Les cas propres (صِرَاط, مُسْتَقِيم, غَضَب, ضَلَل)
sont fiables ; les cas عبد/دين/هدى/استعان nécessitent un split manuel.

---

## L. Recommandations de validation humaine

1. **Valider les 11 gloses FR P0** via le workflow éditorial `word_translations`
   (PROPOSED → validation humaine → VALIDATED) — aucune validation automatique ;
2. **Créer les 10 lemmes** (`lemmas`) puis les **mappings SAFE** (`word_lemma_mapping`)
   uniquement après vérification linguistique, avec `mapping_method` et `evidence` ;
3. **Ne PAS réutiliser** عَبْد (serviteur) pour نَعْبُدُ (adorer) — homographe ;
4. **REUSE** لَا pour وَلَا ;
5. Traiter إِيَّاكَ / وَإِيَّاكَ en contexte (REVIEW_REQUIRED) ;
6. Les **racines restent hors MVP** (P2, non bloquantes).

---

## M. Risques restants

- **Homographie عبد/عبد** : le plus grand risque de faux regroupement — traité par
  split éditorial, jamais automatique.
- **Repli EN par défaut** : tant que les P0 ne sont pas validés, l'UI afficherait la
  glose EN ; la règle « jamais enseigner l'anglais par défaut » impose de valider les
  P0 **avant** d'activer les exercices de production FR.
- **Dévier vers le flashcard** : la glose ne remplace jamais la forme réelle ni le
  contexte (design 23B conservé).

---

## N. Non-régression

`npm test` 242/242 · `tsc --noEmit` 0 erreur · `lint` clean · `build` OK ·
`verify:persistence` 13/13 · `verify:rls` 33/33. Compteurs DB identiques (aucune
écriture). Scripts d'analyse temporaires supprimés.

---

## O. Confirmation READ_ONLY

`database_writes = 0` · `storage_writes = 0` · `migrations = 0` ·
`production_code_changes = 0` · `resolver_changes = 0` · `UI_changes = 0` ·
`audio_changes = 0` · `curriculum_changes = 0`. Aucune glose importée, aucun lemme
créé, aucun mapping créé.

---

**STATUS FINAL : `PEDAGOGICAL_GLOSS_PREPARATION_COMPLETE`**

Livrables :
- `PHASE_23D_AL_FATIHA_GLOSS_PREPARATION.md`
- `tmp/phase23d-al-fatiha-gloss-matrix.json`
- `tmp/phase23d-al-fatiha-lemma-analysis.json`
- `tmp/phase23d-al-fatiha-evidence.json`

**Arrêt obligatoire.** Aucune écriture. Le propriétaire examinera les propositions ;
la phase suivante ne pourra commencer qu'après décision explicite.
