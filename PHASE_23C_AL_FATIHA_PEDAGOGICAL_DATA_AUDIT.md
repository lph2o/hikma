# PHASE 23C — AL-FATIHA PEDAGOGICAL DATA GAP AUDIT & PREPARATION

**STATUS : `PEDAGOGICAL_DATA_AUDIT_COMPLETE`** · Mode `READ_ONLY`

Garanties : `DATABASE_WRITES = 0` · `MIGRATIONS = 0` · `STORAGE_WRITES = 0` · `PRODUCTION_CODE_CHANGES = 0`

---

## 0. Synthèse

| Métrique | Valeur |
|---|---|
| Formes d'Al-Fatiha | 26 |
| **READY** (FR validé) | **9** |
| **DATA_GAP** | **17** (11 lexicales + 6 grammaticales) |
| Résolution FR | 9 (8 FORME + 1 LEMME DIRECT) |
| Repli EN | 17 |
| Lemme direct | 9 |
| Lemme via mapping | 0 |
| Sans lemme | 17 |
| Racine | 0/26 |
| Audio word_audio | 26/26 (DB↔Storage cohérent) |

**Décision finale : `BLOCKED_BY_DATA_GAPS` (partiel).** 9/26 formes sont prêtes ;
17 sont bloquées — 11 par l'absence de glose FR validée (P0), 6 par l'absence d'axe
de regroupement/décision éditoriale (P1/P2). L'audio (26/26) **n'est pas** un blocage.

---

## 1. Matrice des 26 formes

La matrice exhaustive (word_id, arabe, translittération, sens EN, lemme direct/mappé,
gloses FR forme/lemme, statut de résolution, statut forme→lemme, audio, occurrences
dans Al-Fatiha) est livrée dans **`tmp/phase23c-al-fatiha-matrix.json`**.

Résumé des 26 formes :

| Forme | Verset(s) | FR résolu | Statut |
|---|---|---|---|
| بِسْمِ | 1:1 | « au nom de » (FORME) | READY |
| ٱللَّهِ | 1:1 | « Allah » (FORME) | READY |
| ٱلرَّحْمَـٰنِ | 1:1, 1:3 | « le Tout Miséricordieux » (FORME) | READY |
| ٱلرَّحِيمِ | 1:1, 1:3 | « le Très Miséricordieux » (FORME) | READY |
| ٱلْحَمْدُ | 1:2 | « la louange » (FORME) | READY |
| لِلَّهِ | 1:2 | « à / pour Allah » (FORME) | READY |
| رَبِّ | 1:2 | « Seigneur » (FORME) | READY |
| ٱلْعَـٰلَمِينَ | 1:2 | « des mondes » (FORME) | READY |
| يَوْمِ | 1:4 | « jour » (LEMME DIRECT) | READY |
| مَـٰلِكِ | 1:4 | — (EN « Master ») | DATA_GAP (lexicale) |
| ٱلدِّينِ | 1:4 | — (EN « Judgment ») | DATA_GAP (lexicale) |
| إِيَّاكَ | 1:5 | — (EN « You Alone ») | DATA_GAP (grammaticale) |
| نَعْبُدُ | 1:5 | — (EN « we worship ») | DATA_GAP (lexicale) |
| وَإِيَّاكَ | 1:5 | — (EN « and You Alone ») | DATA_GAP (grammaticale) |
| نَسْتَعِينُ | 1:5 | — (EN « we ask for help ») | DATA_GAP (lexicale) |
| ٱهْدِنَا | 1:6 | — (EN « Guide us ») | DATA_GAP (lexicale) |
| ٱلصِّرَٰطَ | 1:6 | — (EN « the path ») | DATA_GAP (lexicale) |
| ٱلْمُسْتَقِيمَ | 1:6 | — (EN « the straight ») | DATA_GAP (lexicale) |
| صِرَٰطَ | 1:7 | — (EN « path ») | DATA_GAP (lexicale) |
| ٱلَّذِينَ | 1:7 | — (EN « those ») | DATA_GAP (grammaticale) |
| أَنْعَمْتَ | 1:7 | — (EN « You bestowed ») | DATA_GAP (lexicale) |
| عَلَيْهِمْ | 1:7 (×2) | — (EN « on them ») | DATA_GAP (grammaticale) |
| غَيْرِ | 1:7 | — (EN « not (of) ») | DATA_GAP (grammaticale) |
| ٱلْمَغْضُوبِ | 1:7 | — (EN « wrath ») | DATA_GAP (lexicale) |
| وَلَا | 1:7 | — (EN « and not ») | DATA_GAP (grammaticale) |
| ٱلضَّآلِّينَ | 1:7 | — (EN « astray ») | DATA_GAP (lexicale) |

---

## 2. Les 17 DATA_GAP détaillés (cause exacte)

**Cause dominante A (aucun `lemma_id`) :** les 17 formes n'ont **ni** `quran_words.lemma_id`
**ni** mapping `word_lemma_mapping` SAFE. Les 171 mappings SAFE existants ne couvrent
**aucune** forme d'Al-Fatiha.

**11 formes lexicales (cause H : donnée éditoriale FR manquante) — P0 :**

| Forme | Nature | Cause | Action |
|---|---|---|---|
| مَـٰلِكِ | nom (« Souverain ») | A + H | C (glose FR) + D (lemme) |
| ٱلدِّينِ | nom (« jugement/religion ») | A + H | C + D |
| نَعْبُدُ | verbe (« nous adorons ») | A + H | C + D |
| نَسْتَعِينُ | verbe (« nous demandons aide ») | A + H | C + D |
| ٱهْدِنَا | verbe (« guide-nous ») | A + H | C + D |
| ٱلصِّرَٰطَ | nom (« le chemin ») | A + H (regrouper avec صِرَٰطَ) | C + D + B |
| صِرَٰطَ | nom (« chemin ») | A + H (regrouper avec ٱلصِّرَٰطَ) | C + D + B |
| ٱلْمُسْتَقِيمَ | adjectif (« le droit ») | A + H | C + D |
| أَنْعَمْتَ | verbe (« Tu as comblé ») | A + H | C + D |
| ٱلْمَغْضُوبِ | participe (« ceux qui encourent la colère ») | A + H | C + D |
| ٱلضَّآلِّينَ | participe (« les égarés ») | A + H | C + D |

**6 formes grammaticales (cause D : forme grammaticale) — P1/P2 :**

| Forme | Nature | Glose nécessaire ? | Action |
|---|---|---|---|
| إِيَّاكَ | particule d'exclusivité + suffixe | non (contexte) | E (décision éditoriale) |
| وَإِيَّاكَ | و + إِيَّاكَ | non (regrouper avec إِيَّاكَ) | A + E |
| غَيْرِ | nom d'exception (« autre que ») | glose simple possible | C ou contexte |
| وَلَا | و + لا | non (contexte) | F (aucune glose) |
| ٱلَّذِينَ | pronom relatif pluriel (« ceux qui ») | glose simple | C ou contexte |
| عَلَيْهِمْ | préposition على + ـهم (« sur eux ») | glose simple | C ou contexte |

**Aucun regroupement abusif** : chaque cause est documentée séparément ; on ne fusionne
pas « grammatical » et « éditorial » sous un même motif.

---

## 3. État forme → lemme

- `DIRECT_LEMMA` : **9** (les 9 formes READY ont un `lemma_id` direct).
- `MAPPED_LEMMA` : **0** (aucun mapping SAFE d'Al-Fatiha).
- `NO_LEMMA` : **17**.

Priorité de résolution **inchangée** : `quran_words.lemma_id` puis
`word_lemma_mapping` (surcouche additive, jamais un remplacement).

---

## 4. État des gloses FR

| Canal | Couverture Al-Fatiha |
|---|---|
| FORME (`word_translations` FR validé) | 8 |
| LEMME DIRECT (`lemma_translations` FR validé) | 1 (يَوْمِ) |
| LEMME VIA MAPPING | 0 |
| Repli EN (`quran_words.meaning`) | 17 |

Priorité **inchangée** : `FORME > LEMME DIRECT > LEMME VIA MAPPING > EN`.

**Règle respectée** : aucune traduction créée dans cette phase ; aucune proposition
non validée traitée comme donnée pédagogique. `PROPOSAL ≠ VALIDATED DATA`.

Classification des gloses manquantes :
- `GLOSS_REQUIRED` : les 11 formes lexicales (nécessaires pour la production FR).
- `GLOSS_REVIEW_REQUIRED` / contexte : les 6 formes grammaticales.
- `NO_GLOSS_REQUIRED` : وَلَا (enseigné en contexte, aucun glose artificielle).

---

## 5. État des mappings

`word_lemma_mapping` (171 SAFE) **ne couvre aucune forme d'Al-Fatiha**. Les 9 lemmes
présents sont des `lemma_id` directs. Aucune modification dans cette phase.

---

## 6. État audio

| Contrôle | Résultat |
|---|---|
| `word_audio` (ligne) | 26/26 |
| `recitation_id` | WBW Muallim (HF) — unique |
| Objet Storage | 26/26 présents |
| Cohérence DB → Storage | 26/26 |

Aucun `ayah_audio`, aucun import, aucun changement Storage.

---

## 7. Problèmes grammaticaux

- **6 formes grammaticales** (إِيَّاكَ, وَإِيَّاكَ, غَيْرِ, وَلَا, ٱلَّذِينَ, عَلَيْهِمْ).
- **Enseignement** : elles ne doivent **pas** recevoir de glose lexicale artificielle
  forcée. Trois d'entre elles (غَيْرِ, ٱلَّذِينَ, عَلَيْهِمْ) acceptent une glose simple ;
  les autres (إِيَّاكَ, وَإِيَّاكَ, وَلَا) se enseignent **en contexte** (traduction
  Hamidullah du verset, déjà présente).
- **Regroupement** : إِيَّاكَ / وَإِيَّاكَ partagent l'élément إياك (à relier, pas à
  apprendre séparément).

---

## 8. Problèmes morphologiques

- Racine : **0/26** ; lemmes avec racine : **0/9**.
- **Réponse à la question clé : OUI, on peut construire le parcours d'Al-Fatiha sans
  introduire les racines.** Les racines sont un enrichissement (généralisation), **pas
  une condition du MVP**. Aucun P0 artificiel autour des racines.
- Ce qui est **réellement nécessaire** : le **lemme** (pour regrouper FORME→LEMME et
  éviter d'enseigner صِرَٰطَ/ٱلصِّرَٰطَ comme deux concepts indépendants), pas la racine.

---

## 9. Risques d'homographes

- **Aucun homographe réel** dans Al-Fatiha (aucune forme unique à sens multiples).
- **Quasi-doublons** à relier par LEMME (jamais fusionner) :
  - صِرَٰطَ / ٱلصِّرَٰطَ (même lexème, avec/sans article défini) ;
  - ٱللَّهِ / لِلَّهِ (même lexème, deux attaches) ;
  - إِيَّاكَ / وَإِيَّاكَ (même élément, avec/sans و).
- **Règle conservée** : `normalized_text` n'est **jamais** utilisé comme clé lexicale ;
  l'identité = `word_id` exact (règles Phase 21B).

---

## 10. Minimum viable dataset

**Question : quelles données minimales sont absolument nécessaires pour commencer
l'implémentation pédagogique ?**

1. **11 gloses FR validées** pour les formes lexicales des versets 1:4–1:7
   (`word_translations`, workflow PROPOSED → VALIDATED humain) — **P0** ;
2. **un axe lemme** pour regrouper صِرَٰطَ/ٱلصِّرَٰطَ (et optionnellement
   إِيَّاكَ/وَإِيَّاكَ) — **P1** ;
3. **déjà disponible** : 9 formes READY, audio 26/26, traduction Hamidullah des versets,
   curriculum/leçons, moteur d'exercices, progression, SRS.

**Non requis pour le MVP :** racines (P2), ayah_audio (P3), morphologie grammaticale fine.

---

## 11. Plan de résolution

| Priorité | Action | Donnée | Cible |
|---|---|---|---|
| **P0** | C (glose FR) + D (lemme) | 11 formes lexicales | word_translations + lemmas + word_lemma_mapping |
| **P1** | E (décision éditoriale) / C (glose simple) | 6 formes grammaticales | contexte Hamidullah ou glose simple validée |
| **P1** | B (regroupement lemme) | صراط/الصراط, إياك/وإياك | word_lemma_mapping |
| **P2** | D (racine) | formes/lemmes | racines (optionnel, hors MVP) |
| **P3** | — | ayah_audio | optionnel |

**Aucune exécution dans cette phase.** Chaque glose devra passer par le workflow
éditorial existant (`is_validated=false` → validation humaine → `is_validated=true`) ;
aucune validation automatique.

---

## 12. Priorités (récapitulatif)

- **P0** : 11 gloses FR validées (formes lexicales) + lemmes associés.
- **P1** : regroupement lemme des quasi-doublons + gloses simples des formes grammaticales.
- **P2** : racines (généralisation) — **non requis pour le MVP**.
- **P3** : ayah_audio — optionnel.

---

## 13. Décision finale

**`BLOCKED_BY_DATA_GAPS` (partiel).** Le pilote pédagogique Al-Fatiha peut démarrer
immédiatement sur **9/26 formes** (versets 1:1–1:3 + يَوْمِ) ; il est bloqué pour les
**17 autres** tant que les **11 gloses FR validées** (P0) ne sont pas fournies. L'audio
n'est **pas** un blocage. La résolution des P0 débloque l'implémentation pédagogique
complète (23F production, 23I pilote).

---

## Non-régression

- `npm test` : **242/242** · `tsc --noEmit` : **0 erreur** · `npm run lint` : **clean** ·
  `npm run build` : **OK** · `verify:persistence` : **13/13** · `verify:rls` : **33/33** ;
- compteurs DB identiques (aucune écriture) ;
- resolver, word bank, LessonPlayer, exercices, ReviewEngine, LeitnerScheduler, audio,
  UI : **inchangés** ;
- script d'audit temporaire supprimé ; seuls les JSON livrables sont conservés.

**STATUS FINAL : `PEDAGOGICAL_DATA_AUDIT_COMPLETE`** — arrêt obligatoire. Aucune
glosse importée, aucun mapping créé, aucun lemme/racine ajouté, aucun code modifié.
En attente de l'approbation du propriétaire avant toute phase suivante.
