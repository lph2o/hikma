# PHASE_70C_REPORT — ÉVALUATION POST-PILOTE + PRÉPARATION DU LOT 2

## STATUT

```
MODE          : READ_ONLY
DATABASE_WRITES: 0
STATUS        : READY_FOR_LOT2_REVIEW
```

Aucune écriture DB. Aucune validation. Aucun INSERT/UPDATE/DELETE. Aucun commit/push.

---

## 1. AUDIT DU LOT 1 (décisions réellement appliquées)

Source : `tmp/phase70c/pilot-evaluation.json` (lecture live, READ-ONLY).

| Critère | Résultat |
|---|---|
| Décisions réexaminées | **16/16** (13 gloses + 3 mappings) |
| Gloses appliquées conformes au texte proposé | **13/13** (`gloss_match = true`) |
| Gloses marquées validées (`is_validated = true`) | **13/13** |
| Provenance « Hikma — lexique éditorial » | **13/13** |
| Mappings `word_lemma_mapping` en `safe` | **3/3** (كِتَاب ×2, كَان) |
| Gloses cohérentes avec la convergence 4 traductions | **16/16** (revue des justifications) |
| Distinction forme/lemme respectée (formes sœurs jamais fusionnées) | **OK** (لَيْسَ/لَّيْسَ, وَبِئْسَ/فَبِئْسَ, ٱلْكِتَـٰبَ/ٱلْكِتَـٰبِ) |
| MOVE_TO_LEMMA vers lemme avec lemma_translation FR **validée** | **3/3** (كِتَاب « livre / Écriture », كَان « être ») |
| Traitement des formes grammaticales (5) séparé | **OK** — décision humaine, fréquence ≠ justification lexicale |
| Formes dans sourates protégées / Fātiḥah / pilotes | **0 intrusion** (`intrusions_into_protected_surahs = []`) |
| Cohérence avec le runtime | **OK** — 16/16 résolues FR (13 forme / 3 lemme) après APPLY |
| Collisions | **0** |
| Régressions | **0** (compteurs stables, voir § 4) |

### Répartition qualitative du Lot 1
- Confiance : HIGH **10** / MEDIUM **6**
- Classification : DIRECT_EQUIVALENT **9** / GRAMMATICAL_FUNCTION **5** / CONTEXTUAL_EQUIVALENT **2**
- Formes multi-contextes : **10**
- Formes grammaticales : **5**

### Verdict Lot 1
**Lot 1 conforme au workflow Phase 22 / Fātiḥah.** Aucune anomalie, aucune écriture hors périmètre, aucune fusion abusive, provenance et validation correctes.

---

## 2. ENSEIGNEMENTS MÉTHODOLOGIQUES (risques identifiés)

Ne **rien corriger** — recommandations documentées pour l'industrialisation future.

1. **Classification POS MASAQ** : les verbes sont taggés `IV` (imparfait) / `PV` (parfait), pas `VERB`. La détection automatique initiale des verbes lexicaux (`VERBAL_LEXICAL = 0`) était trop stricte ; le classifieur doit intégrer les tags `IV`/`PV` (et `PVSUFF_SUBJ:*`, `IMPERF_PREF`, `SUBJ_PRON`).

2. **Correspondance stem ↔ lemme (lettres faibles)** : le stem MASAQ « كن » (كُنَّا) n'a pas été rapproché du lemme « كَان » (différence d'alif). Règle future : **normaliser les lettres faibles ا/و/ي** avant comparaison stem↔lemme. Override analyste documenté dans `lot2-proposals.json`.

3. **Participe actif vs verbe** : ٱلْكَـٰفِرِينَ (participe actif pluriel, valeur nominale « les mécréants ») vs lemme كَفَر (valeur verbale). Le mapping lemme n'est pas automatique : quand la valeur lexicale de la forme diffère de celle du lemme, **glose directe** (cas limite documenté, décision humaine).

4. **MOVE_TO_LEMMA conditionné** : mapping uniquement si le lemme cible possède une `lemma_translation` FR **validée**. رَّحِيمٌ → lemme الرَّحِيم existant mais **sans** traduction FR validée → glose directe (pas de mapping inutile, cohérent avec Fātiḥah).

5. **Formes sœurs** : كُلَّ / كُلُّ (variantes casuelles) — **jamais fusionnées**, même glose appliquée indépendamment.

6. **Formes grammaticales / clitiques** (لَهُۥ, وَهُوَ, فِيهِ) : fréquence élevée ≠ candidat lexical. Traitement séparé obligatoire ; décision humaine requise ; glose = fonction grammaticale stable, courte.

7. **Polysémie contextuelle** : أَعْلَمُ (élatif « plus savant / qui sait le mieux »), قَبْلُ (temporel) → glose double couvrant la variation, classification `CONTEXTUAL_EQUIVALENT`.

---

## 3. PRÉPARATION DU LOT 2

Source : `tmp/phase70c/lot2-candidates.json`, `lot2-evidence.json`, `analyst-view.json`, `lot2-proposals.json`.

### Sélection (déterministe, données réelles)
- Pool : **1 099** candidats catégorie C + P1 restants (hors Lot 1)
- Règle : catégorie C (évidence MASAQ, sans glose FR) + P1 + non enseigné + tri fréquence décroissante par famille
- Stratification (diversité méthodologique, pas le volume) : **5 verbes lexicaux / 4 adjectifs / 4 noms sans article / 3 noms définis / 2 grammaticalx / 2 lemma-résolvables** = **20 candidats**

### Propositions (`lot2-proposals.json`)

| # | Forme | Famille | Proposition | Action | Conf. |
|---|-------|---------|-------------|--------|-------|
| 1 | يَعْلَمُونَ | verbal | « ils savent » | GLOSE | HIGH |
| 2 | قَالُوٓا۟ | verbal | « ils dirent » | GLOSE | HIGH |
| 3 | كُنَّا | verbal | → lemme **كَان** « être » (override analyste, lettre faible) | MOVE_TO_LEMMA | HIGH |
| 4 | يَعْمَلُونَ | verbal | « ils font / ils œuvrent » | GLOSE | HIGH |
| 5 | يَشَآءُ | verbal | « Il veut » | GLOSE | HIGH |
| 6 | أَعْلَمُ | adjectif | « plus savant / qui sait le mieux » | GLOSE | MED |
| 7 | غَفُورٌۭ | adjectif | « Pardonneur » | GLOSE | HIGH |
| 8 | رَّحِيمٌۭ | adjectif | « Miséricordieux » (lemme sans FR validée → glose directe) | GLOSE | HIGH |
| 9 | عَلِيمٌۭ | adjectif | « Omniscient / qui sait tout » | GLOSE | HIGH |
| 10 | شَىْءٍ | nom nu | « chose » | GLOSE | HIGH |
| 11 | كُلَّ | nom nu | « tout / chaque » | GLOSE | MED |
| 12 | كُلُّ | nom nu | « tout / chaque » (sœur, jamais fusionnée) | GLOSE | MED |
| 13 | قَبْلُ | nom nu | « avant / auparavant » | GLOSE | MED |
| 14 | ٱلنَّارِ | nom défini | « le Feu » | GLOSE | HIGH |
| 15 | ٱلْكَـٰفِرِينَ | nom défini | « les mécréants » (participe vs lemme verbal) | GLOSE | HIGH |
| 16 | ٱلْقِيَـٰمَةِ | nom défini | « la Résurrection » | GLOSE | HIGH |
| 17 | لَهُۥ | grammatical | « à lui / pour lui » | GLOSE | MED |
| 18 | وَهُوَ | grammatical | « et Lui / et il » | GLOSE | MED |
| 19 | كَانُوا۟ | lemma-résolvable | → lemme **كَان** (existant, FR validée) | MOVE_TO_LEMMA | HIGH |
| 20 | فِيهِ | lemma-résolvable | → lemme **فِي** « dans / en / sur » (existant, FR validée) | MOVE_TO_LEMMA | HIGH |

**Totaux :** 20 propositions · 17 GLOSE · 3 MOVE_TO_LEMMA · 0 HOLD · 0 REJECT · confiance HIGH 15 / MED 5.

### Risques Lot 2
- **Grammaticaux** (17, 18) et **clitiques** (20) : sens grammatical stable mais fréquence élevée — décision humaine requise (respect de la règle Phase 70).
- **3, 19, 20** : mappings uniquement vers lemmes existants avec `lemma_translation` FR validée.
- **15** : cas limite participe actif vs lemme verbal — documenté, glose directe proposée.
- **6, 13** : gloses doubles (variation contextuelle).

---

## 4. NON-RÉGRESSION LIVE (READ-ONLY)

Compteurs réels lus en DB (aucune écriture) :

| Compteur | Attendu | Réel |
|---|---|---|
| `word_translations` FR validées | 551 | **551** ✅ |
| `word_lemma_mapping` safe | 187 | **187** ✅ |
| `linguistic_occurrences` | 22 485 | **22 485** ✅ |
| `linguistic_segments` | 44 677 | **44 677** ✅ |
| `translations` | inchangé | **24 944** ✅ |
| `quran_words` | 21 296 | **21 296** ✅ |
| `word_occurrences` | 77 430 | **77 430** ✅ |
| `lemmas` | 32 | **32** ✅ |
| `lemma_translations` FR validées | 28 | **28** ✅ |
| `sources` | — | **6** ✅ |
| Sourate 64 (MASAQ_BLOCKED) | 0 | **0** ✅ |
| Fātiḥah + pilotes 112/113/114/108 | intacts | **intacts** ✅ |

Aucune divergence. Aucune donnée MASAQ ou métier modifiée.

---

## 5. MÉTRIQUES DU PILOTE (Lot 1)

- Candidats examinés : **16** · acceptés : **16/16**
- Gloses directes : **13** · mappings vers lemme : **3**
- Catégories : nominales 8 · verbales 5 · grammaticales 2 · autre 1
- Cas nécessitant décision humaine : **5** (formes grammaticales)
- Cas potentiellement ambigus : **0**
- Formes multi-contextes : **10**
- Couverture FR avant/après : **816 → 832 formes** · taux de résolution FR : 100 % (16/16)
- Divergences : **0**

---

## 6. REVUE CIBLÉE (demandée par le décideur) — 14 cas examinés sur données live

Source : `tmp/phase70c/targeted-review.json` (READ-ONLY — lemmes live, POS MASAQ live, 4 traductions alignées).

### Vérifications live décisives
- **Lemmes (32)** : الرَّحِيم = `validated` mais **FR[0]** (aucune lemma_translation FR validée) → mapping impossible. كَفَر = FR validée « être incrédule / ne pas croire » (verbale). فِي et كَان = FR validées. Aucun lemme غفر/علم/شاء/قبل/كل/نار/قيام.
- **POS MASAQ live** : يَشَآءُ 18× IV · أَعْلَمُ 15× ADJ_COMP · غَفُورٌۭ 15× ADJ_INTENS · رَّحِيمٌۭ 12× ADJ_INTENS · عَلِيمٌۭ 6× ADJ_QUALIT · كُلَّ 16× / كُلُّ 19× NOUN_ABSTRACT · قَبْلُ 8× NOUN + 1× ADV · ٱلنَّارِ 16× DET,NOUN_CONCRETE · ٱلْكَـٰفِرِينَ 16× NOUN_ACTIVE_PART · لَهُۥ 42× PREP,POSS_PRON · وَهُوَ 44× CONJ,PRON · فِيهِ 23× PREP,PRON_3MS · كَانُوا۟ 68× PV,SUBJ_PRON.

### Décisions recommandées

| # | Forme | Proposition initiale | Décision recommandée | Justification clé |
|---|-------|----------------------|----------------------|-------------------|
| 1 | يَشَآءُ | GLOSE « Il veut » | **ACCEPT** | 18/18 IV, convergence 4/4 « veut » ; « souhaiter » affaiblirait la volonté divine ; convention des verbes conjugués du lot respectée |
| 2 | أَعْلَمُ | GLOSE « plus savant / qui sait le mieux » | **HOLD** | Ambiguïté homographique : 15/15 MASAQ ADJ_COMP (élatif) MAIS 7:188 « لو كنتُ أعلمُ الغيب » = imparfait verbal 1re pers. « je connaissais » ; MASAQ ne couvre que 15/35 occurrences → analyse complète requise |
| 3 | غَفُورٌۭ | GLOSE « Pardonneur » | **ACCEPT** | Aucun lemme غفر (live) ; 15/15 ADJ_INTENS ; convergence 4/4 |
| 4 | رَّحِيمٌۭ | GLOSE « Miséricordieux » | **ACCEPT** | Lemme الرَّحِيم validated mais FR[0] → mapping interdit par la règle ; glose directe requise ; forme indéfinie ≠ الرَّحِيم défini (Fātiḥah verrouillée intacte) |
| 5 | عَلِيمٌۭ | GLOSE « Omniscient / qui sait tout » | **ACCEPT** | La paire couvre déjà le théologique + le noyau lexical commun (EN « Knowing », IT « conosce ») ; pas de lemme علم |
| 6 | كُلَّ | GLOSE « tout / chaque » | **ACCEPT** | Variante casuelle (acc.) du lexème كُلّ ; glose identique à كُلُّ, formes jamais fusionnées |
| 7 | كُلُّ | GLOSE « tout / chaque » | **ACCEPT** | Idem cas 6 (nominatif) ; décision documentée pour le couple |
| 8 | قَبْلُ | GLOSE « avant / auparavant » | **ACCEPT** | « auparavant » = équivalent adverbial français (EN « before », IT « in precedenza »), pas une valeur contextuelle ; couple complet |
| 9 | ٱلنَّارِ | GLOSE « le Feu » | **MODIFY** → « le Feu (de l'Enfer) » | « le Feu » majuscule = formulation de Hamidullah (traductionnelle) ; noyau lexical « feu » ; défini = Enfer prédominant (46:20, 3:185) mais littéral en 85:5 |
| 10 | ٱلْكَـٰفِرِينَ | GLOSE « les mécréants » | **ACCEPT** | Lemme كَفَر FR validée MAIS verbale ; mapping imposerait une glose verbale à un participe nominal pluriel = fusion interdite ; glose directe préserve la valeur nominale |
| 11 | لَهُۥ | GLOSE « à lui / pour lui » | **ACCEPT** | Fonction grammaticale stable ; précédent accepté مِّنَ/بِمَا (Lot 1) ; 142 occ. — fréquence seule ne justifie pas, mais fonction stable + précédent oui |
| 12 | وَهُوَ | GLOSE « et Lui / et il » | **ACCEPT** | Référent contextuel (divin majoritaire, humain ailleurs) ; glose double stable couvrant les deux ; cohérent avec le Lot 1 |
| 13 | فِيهِ | MOVE_TO_LEMMA → فِي | **MODIFY** → GLOSE « en lui / dans cela » | Contrôle renforcé : فِي + هِ = construction composée, pas une flexion ; mapping vers فِي perdrait le pronom enclitique (3:97 « en lui », 45:26 « à ce sujet ») ; le modèle word_lemma_mapping n'est pas conçu pour la composition préposition+clitique → mapping conceptuellement incorrect ; GLOSE cohérente avec لَهُۥ/مِّنَ |
| 14 | كَانُوا۟ | MOVE_TO_LEMMA → كَان | **ACCEPT** | Contrôle renforcé : flexion (parfait 3MP) du verbe faible كَان, relation identique à كُنتُمْ → كَان (Lot 1 VERIFIED) ; stem « كان » = lemme sans normalisation ; lemme FR « être » validée ; aucune fusion |

**Bilan : 11 ACCEPT · 2 MODIFY (ٱلنَّارِ → glose enrichie, فِيهِ → GLOSE au lieu de mapping) · 1 HOLD (أَعْلَمُ) · 0 REJECT.**

Les 20 propositions du Lot 2 restent **CANDIDATE** — aucune modification en base. Le HOLD أَعْلَمُ sort du lot d'import proposé ; les 2 MODIFY seront intégrés à la proposition avant tout DRY-RUN futur.

---

## 7. DÉCISION

```
PHASE_70C_COMPLETE
STATUS: READY_FOR_LOT2_REVIEW
DATABASE_WRITES: 0
```

Le Lot 1 est jugé conforme et réutilisable comme référence méthodologique. Le Lot 2 (20 candidats) a fait l'objet de la revue ciblée : 11 ACCEPT, 2 MODIFY, 1 HOLD, 0 REJECT — décision finale en attente du HUMAN GATE.

**Aucune écriture DB n'a eu lieu pendant la Phase 70C.**

## HUMAN GATE

Le Lot 2 n'est **pas importé**. Les propositions de `lot2-proposals.json` sont soumises à la revue humaine : GLOSE (17) / MOVE_TO_LEMMA (3) / HOLD / REJECT.

Un nouveau HUMAN GATE explicite sera requis pour accepter/rejeter les propositions du Lot 2 avant tout APPLY.
