# PHASE 26 — Audit de généralisation linguistique + pédagogique multi-sourates

**Décision finale : `B — MULTI_SURAH_DATA_REFINEMENT_REQUIRED`**

**Statut : audit STRICTEMENT READ_ONLY** — `DATABASE_WRITES = 0`, aucun code, aucune
migration, aucun import, aucun seed, aucune glose, aucun mapping, aucune donnée modifiée.

---

## 1. Décision

MASAQ v2 couvre **intégralement** les 4 sourates pilotes (108, 112, 113, 114) :
**68/68 occurrences, 0 MISSING, 0 EXTRA**. L'architecture Fātiḥah est généralisable
**sans changement d'architecture**. Cependant, 6 occurrences sont classées
`AMBIGUOUS` (2×112, 2×113, 2×114). L'analyse codepoint par codepoint montre que
**les 6 sont des variantes orthographiques bénignes**, résolubles par une extension
de la normalisation + la correction d'**un bug latent** (`replace` sans flag `/g`).
S'y ajoutent **5 formes sans glose FR validée** (fallback EN) et **de nouveaux tags
POS/cas/syntaxe** nécessitant un mapping pédagogique.

Le workflow Hikma impose de ne **jamais forcer** un alignement `AMBIGUOUS`. La
décision honnête est donc **B** : quelques raffinements bornés sont requis avant
l'implémentation. Aucune anomalie n'est bloquante (ce n'est pas **C** : les données
s'alignent proprement une fois normalisées).

---

## 2. Inventaire comparatif

| Sourate | Leçons | Formes | Occ. | Ayahs | Audio | MASAQ occ. | Segments |
|---|---|---|---|---|---|---|---|
| 1 — Al-Fātiḥah (réf.) | 8 | 26 | 29 | 7 | 29 | 29 | 56 |
| 108 — Al-Kawthar | 3 | 10 | 10 | 3 | 10 | 10 | 23 |
| 112 — Al-Ikhlāṣ | 4 | 13 | 15 | 4 | 15 | 15 | 25 |
| 113 — Al-Falaq | 5 | 17 | 23 | 5 | 23 | 23 | 33 |
| 114 — An-Nās | 6 | 17 | 20 | 6 | 20 | 20 | 35 |

Les 4 sourates pilotes possèdent déjà un parcours dédié (`learning_paths.surah_id`
= 108/112/113/114) avec leçons, formes, occurrences, audio Muʿallim et 4 traductions
d'ayah chacune. **Aucune donnée Hikma manquante pour le runtime pédagogique actuel.**

---

## 3. Couverture MASAQ réelle

- **108** : 10/10 occurrences · 23 segments · 10/10 stem · 10/10 gloss EN.
- **112** : 15/15 · 25 segments · 15/15 stem · 15/15 gloss EN.
- **113** : 23/23 · 33 segments · 23/23 stem · 23/23 gloss EN.
- **114** : 20/20 · 35 segments · 20/20 stem · 20/20 gloss EN.

POS, cas (INVARIABLE/GENITIVE/NOMINATIVE/ACCUSATIVE, + JUSSIVE en 112) et syntaxe
sont disponibles sur **100 %** des occurrences. **Racine = ABSENT_DATA, schème =
ABSENT_DATA** (MASAQ n'en fournit pas — confirmé, rien à déduire).

### Provenance
- Source : **MASAQ v2** · DOI `10.17632/9yvrzxktmr.2`.
- Fichier : `tmp/MASAQ.csv`.
- Checksum vérifié : `777d0cc8f24f4c17d07ad83a522056fe7ebd5c83dbbae86161f1fdc95aaca900`.
- Licence : CC BY 3.0 (page) / CC BY 4.0 (DataCite) — `SAFE_WITH_ATTRIBUTION`.
- **Aucun changement de source, de version, de checksum ni de licence** requis.

---

## 4. Alignement (clé obligatoire `surah:ayah:position`)

| Sourate | EXACT | ORTHO | VARIANT | AMBIGUOUS | MISSING | EXTRA |
|---|---|---|---|---|---|---|
| 1 | 13 | 14 | 2 | 0 | 0 | 0 |
| 108 | 5 | 5 | 0 | 0 | 0 | 0 |
| 112 | 10 | 3 | 0 | **2** | 0 | 0 |
| 113 | 19 | 2 | 0 | **2** | 0 | 0 |
| 114 | 10 | 8 | 0 | **2** | 0 | 0 |

**Aucune MISSING, aucune EXTRA** sur les 4 sourates — la correspondance 1:1 est
totale. Les 6 `AMBIGUOUS` sont analysés ci-dessous.

### Les 6 cas AMBIGUOUS (analyse codepoint)

| Clé | Hikma | MASAQ | Cause | Résolution | Verdict |
|---|---|---|---|---|---|
| 114:5:1 | ٱلَّذِى | الَّذِي | `ى` (U+0649) vs `ي` (U+064A) final | normaliser ى→ي | BÉNIN |
| 112:4:3 | لَّهُۥ | لَهُ | petit wāw exposant U+06E5 | supprimer U+06E5 | BÉNIN |
| 113:4:3 | ٱلنَّفَّـٰثَـٰتِ | النَّفَّاثَاتِ | 2 tatweels + wasla — **bug latent** | flag `/g` sur replace | **BUG** |
| 113:4:4 | فِى | فِي | `ى` vs `ي` | normaliser ى→ي | BÉNIN |
| 114:5:3 | فِى | فِي | `ى` vs `ي` | normaliser ى→ي | BÉNIN |
| 112:4:5 | أَحَدٌۢ | أَحَدٌ | petit mīm exposant U+06E2 (iqlab) | supprimer U+06E2 | BÉNIN |

**Bug latent confirmé** : `normalizeOrthographic` fait `s.replace(TATWEEL, "")`
sans flag `/g`, donc ne retire que la **première** occurrence de tatweel (U+0640).
`النَّفَّاثَاتِ` (2 tatweels) laisse un tatweel résiduel → casse l'alignement de
113:4:3. Correctif minimal : `s.replace(/\u0640/g, "")`.

> **Conclusion** : aucune des 6 n'est un vrai échec d'alignement. Après extension de
> normalisation + correctif du bug, l'attendu est **0 AMBIGUOUS résiduel** sur les
> 4 sourates (comme sur Fātiḥah).

---

## 5. Segmentation

Les catégories de segments utilisées sur Fātiḥah restent valides sur les 4 sourates
(**aucun nouveau `segment_kind`** détecté) : PARTICLE / ARTICLE / STEM /
INFLECTIONAL_SUFFIX / PRONOMINAL_SUFFIX / OTHER. Exemples réels :
- `لِرَبِّكَ` (108:2:2) → ل (PREP) + رب (STEM, génitif) + ك (POSS_PRON) + segments i3rab `None` à filtrer.
- `وَلَمْ` (112:4:1) → و (CONJ) + لم (NEG_PART, jussif).
- `لَهُۥ` (112:4:3) → ل (PREP) + ه (POSS_PRON).

**Attention** : MASAQ émet des segments i3rab vides (`Morph_Tag="None"`, 108:2:2)
— artefacts de parse à **ignorer**, jamais afficher.

---

## 6. POS / morphologie / syntaxe — nouveaux tags

La plupart des tags sont déjà connus de Fātiḥah. Les tags **nouveaux** (à mapper
pédagogiquement, jamais exposés bruts) :

| Sourate | Nouveaux POS | Nouveaux cas/mode | Nouveaux rôles syntaxiques |
|---|---|---|---|
| 108 | ANNUL_PART, INF_ANNUL_PART, POSS_PRON, `None`, CV_PREF, ADJ_COMP | — | ANNUL_PART, SUBJ_COP_PART, EXPLET, PART_COP_PRED |
| 112 | JUSSIVE_PART, POSS_PRON, NOUN_NUM, CASE_INDEF_(ACC_GEN), IV_PASS | **JUSSIVE** | PART_JUSSIVE, IV_COP, PRED, V_COP_PRED, IV_PASS, SUBJ_COP_V |
| 113 | ADJ_INTENS, NSUFF_FEM_PL, ADV, PV_PASS | — | ADV_TIME |
| 114 | NSUFF_FEM_SG, ADJ_INTENS | — | — |

**Points critiques de mapping** :
- **JUSSIVE est un MODE** (verbe après لَمْ), pas un cas nominal — le mapping
  morphologique actuel (qui traite `Case_Mood` comme « cas ») doit distinguer cas
  vs mode avant la généralisation.
- **Rôles copulatifs** (`*_COP_*`, `EXPLET`, `PRED`, `PART_COP_PRED`) liés à
  `إِنَّ`/copule — formulation pédagogique « ce mot est l'élément annoncé / le
  prédicat de la phrase » (à valider).
- `CASE_INDEF_(ACC_GEN)` est un suffixe flexionnel indéfini acc/gen (112:4:4 كُفُوًا).

**Tous ces tags** sont documentés comme `NEW_TAG_REQUIRING_PEDAGOGICAL_MAPPING` —
à mapper dans la phase d'implémentation, pas dans cet audit.

---

## 7. Lemmes (point critique)

Le mapping lemme Hikma ↔ stem MASAQ reste **documentaire** (jamais créé ici).

| Sourate | EXACT | NORM. | PARTIAL | LEXICAL | UNMAPPED |
|---|---|---|---|---|---|
| 1 | 2 | 3 | 4 | 2 | 18 |
| 108 | 0 | 0 | 0 | 0 | 10 |
| 112 | 0 | 2 | 0 | 0 | 13 |
| 113 | 1 | 0 | 0 | 0 | 22 |
| 114 | 5 | 0 | 0 | 0 | 15 |

La couverture lemme Hikma est **très clairsemée hors Fātiḥah** :
- 108 : 1 mapping / 1 forme reliée (9 non reliées).
- 112 : 0 mapping / 2 reliées.
- 113 : 1 mapping / 2 reliées.
- 114 : 2 mappings / 7 reliées.

→ Le bloc « famille / repère de la même famille » apparaîtra **rarement** (absence
honnête, jamais fabriquée). Aucun mapping n'est créé ; `stem` ≠ `lemma` Hikma par
défaut.

---

## 8. Gloses FR

| Sourate | FR validée | Fallback EN | Sans glose |
|---|---|---|---|
| 1 | 25 | 1 | 0 |
| 108 | 10 | 0 | 0 |
| 112 | 12 | 1 | 0 |
| 113 | 16 | 1 | 0 |
| 114 | 14 | 3 | 0 |

**5 formes nécessitent une revue éditoriale FR** (fallback EN actuel) — réparties
sur 112, 113, 114. Le resolver FORME → LEMME → EN fallback reste inchangé ; la
traduction d'ayah n'est **jamais** une glose de mot.

---

## 9. Contexte (traductions d'ayah)

Les 4 traducteurs (Sahih International, Piccardo, Hamidullah, Kazimirski) sont
présents sur **les 5 sourates**. `translation_source_leak = false` : le contexte
d'ayah reste étiqueté « Contexte », jamais « définition du mot ».

---

## 10. Application du modèle pédagogique Fātiḥah (simulation READ_ONLY)

Le modèle Fātiḥah se transpose tel quel :
- **Correct** : Bonne réponse + audio + rappel varié + « Comprendre ce mot » replié.
- **Incorrect** : Ta réponse + Réponse attendue + rappel + « Comprendre ce mot » ouvert.
- **Ambigu** : nuance + formulations acceptées + « Comprendre ce mot ».

Aucun changement runtime nécessaire : seule la requête `getWordLinguisticEvidence`
doit être **paramétrée par sourate** (au lieu de `surah_number = 1`), toujours
filtrée, jamais croisée.

---

## 11. Qualité des explications (aperçu, niveaux réellement disponibles)

Exemples (niveaux affichés seulement si disponibles) :

- **وَالنَّاسِ** (114) : و (particule) + ال (article) + ناس (noyau) → « et les gens » → contexte.
- **لِرَبِّكَ** (108) : ل (préposition) + رب (noyau, génitif) + ك (suffixe possessif) → « à/vers ton Seigneur ».
- **لَمْ يَلِدْ** (112) : لم (négation) + يلد (verbe au jussif) → « Il n'engendre pas ».
- **أَحَدٌ** (112) : « un / unique » — identification (nom/indéfini), morphologie (nominatif).
- **شَانِئَكَ** (108) : شانئ (noyau) + ك (suffixe possessif) → « celui qui te déteste ».

---

## 12. Anti-répétition & valeur pédagogique

Le moteur à 2 blocs + priorité (décomposition → identité → morphologie → syntaxe)
reste efficace : les 4 sourates présentent des combinaisons variées (décomposition
fréquente via prépositions/articles/suffixes, identification, morphologie).
**Risque LOW/REDUNDANT** : les mots nus (ex. هُوَ, مِن) retomberont sur
« identification + contexte » — acceptable, mais à surveiller.

---

## 13. Nouveaux cas pédagogiques (non couverts par Fātiḥah)

1. Phrases copulatives (إِنَّ + prédicat) — 108, 112.
2. Mode jussif (لَمْ + verbe) — 112.
3. Suffixe possessif كَ — 108, 112.
4. Numéral/indéfini (أَحَدٌ) — 112.
5. Comparatif (أَبْتَرُ) — 108.
6. Adjectif intensif — 113, 114.
7. Verbe passif — 112, 113.
8. Adverbe de temps — 113.
9. Suffixes féminin singulier/pluriel — 113, 114.
10. Segments i3rab vides `None` de MASAQ — 108.

→ À documenter comme tests futurs.

---

## 14. Mots partagés entre sourates

Vérifié : les formes partagées résolvent vers **un seul `word_id` global** :
`قُلْ` (112/113/114), `أَعُوذُ`, `بِرَبِّ`, `مِن`, `شَرِّ`, `فِى` (113/114).
La glose de forme est donc **globale** — jamais « mot + sourate → glose différente ».
Aucun risque de fragmentation contextuelle.

---

## 15. Projection de mastery

Confirmé : l'extension linguistique n'exige **aucun** `surah_id` supplémentaire dans
mastery/SRS/progression. La maîtrise par sourate reste une **projection dérivée**
des formes/occurrences. Rien à modifier.

---

## 16. Isolation des sourates

La couche linguistique est indexée par `(surah, ayah, position)` et l'import 24G ne
contient que surah 1. La généralisation doit préserver l'isolation stricte : aucune
donnée d'une sourate récupérée pour une autre (occurrence, ayah, contexte, audio,
glose, segmentation, syntaxe).

---

## 17. Performance

Coût identique à Fātiḥah : la requête linguistique est **batchée côté serveur**
(une requête par leçon, pas par mot), 0 requête cliente directe vers les tables
linguistiques. Volume supplémentaire négligeable (68 occurrences / 116 segments au
total). Aucune optimisation nécessaire dans cette phase.

---

## 18. UX — risques (sans implémentation)

- Explications un peu plus longues sur les mots à double suffixe (لِرَبِّكَ) — le
  plafond de 2 blocs reste la protection.
- Décomposition parfois 3 segments (préfixe + stem + suffixe) — déjà géré par le
  format compact de Fātiḥah.
- 390×844 / 1280×720 / RTL : aucun risque structurel nouveau (même composant).

---

## 19. Sécurité pédagogique

Aucune explication ne prétendra fournir racine, schème, étymologie, évolution
historique ou morphologie absente. Toute donnée inconnue reste `ABSENT_DATA`.
`AVAILABLE ≠ INFERABLE` reste la règle absolue.

---

## 20. Architecture recommandée

**Aucune nouvelle architecture.** On conserve :
`getWordLinguisticEvidence` → `buildLinguisticExplanation` → `HikmaExplanation`.

Seules extensions :
1. Paramétrer `getWordLinguisticEvidence` par sourate (toujours filtrée).
2. Étendre les tables de correspondance tag→français (nouveaux tags §6).
3. Corriger le bug de normalisation + étendre la normalisation (§4).

---

## 21. Étapes d'implémentation (phase suivante)

1. Correctif `normalizeOrthographic` (tatweel global) + normalisation ى→ي et
   marques en exposant ۥ/ۢ/ۣ.
2. Re-vérifier l'alignement → attendu 0 AMBIGUOUS résiduel.
3. Mapper pédagogiquement les nouveaux tags (jussif=mode, rôles copulatifs,
   possessif, numéral, comparatif/intensif, passif, adverbe, suffixes féminins).
4. Revue éditoriale des 5 formes sans glose FR (ou fallback EN documenté).
5. Import MASAQ sourate par sourate (108→112→113→114), idempotent, transactionnel,
   dans la couche isolée, sans toucher Fātiḥah.
6. Paramétrer `getWordLinguisticEvidence` par sourate.
7. Tests + validation navigateur + non-régression (Fātiḥah verrouillée).

---

## 22. Tests nécessaires

- Normalisation ى↔ي et marques en exposant ; correction tatweel multi-occurrences.
- 0 AMBIGUOUS résiduel après extension (rejouer l'alignement complet).
- Mapping déterministe de chaque nouveau tag (français pédagogique, jamais brut).
- Isolation par sourate (aucune donnée croisée).
- Formes partagées → glose globale unique.
- Idempotence de l'import multi-sourates.
- Non-régression Fātiḥah + compteurs corpus.

---

## 23. Stratégie de non-régression

- Compteurs verrouillés : `quran_words=21296`, `word_occurrences=77430`,
  `ayahs=6236`, `translations=24944`, `lemmas=32`, `word_translations=70`,
  `lemma_translations=32`, `word_lemma_mapping=184`.
- Couche linguistique actuelle : `linguistic_occurrences=29`,
  `linguistic_segments=56` (Fātiḥah) — **inchangée**.
- `FATIHAH_REFERENCE_LOCKED = TRUE` préservé.
- `DATABASE_WRITES = 0` pendant cet audit (confirmé).

---

## 24. Anomalies & risques (récapitulatif)

1. **Bug latent** `replace` sans `/g` (tatweel) — correctif minimal requis.
2. **6 AMBIGUOUS bénins** — résolus par extension de normalisation.
3. **5 formes sans glose FR validée** — revue éditoriale.
4. **Nouveaux tags** (jussif=mode, copule, possessif, etc.) — mapping pédagogique.
5. **Couverture lemme clairsemée** — bloc « famille » rare (honnête).
6. **Segments `None` de MASAQ** — à filtrer.

Aucun de ces points n'est bloquant ; aucun ne remet en cause l'architecture Fātiḥah.

---

## 25. Éléments à ne surtout pas modifier

- Racine / schème (ABSENT_DATA) — ne rien déduire ni importer.
- Mapping lemmatique automatique — interdit.
- Gloses FR validées existantes.
- MASAQ déjà importé pour Fātiḥah.
- Grading / scoring / SRS / mastery / progression / curriculum.
- Traductions d'ayah (contexte) — jamais transformées en gloses.
- `FATIHAH_REFERENCE_LOCKED`.

---

## 26. Décision sur le verrouillage

`FATIHAH_REFERENCE_LOCKED = TRUE` **préservé**. Al-Fātiḥah reste la référence UX et
pédagogique ; sa généralisation exige d'abord les raffinements bornés de la §21,
sourate par sourate, avec validation navigateur et non-régression à chaque étape.

---

## PROMPT PHASE SUIVANTE

```
PHASE 27 — GENERALISATION LINGUISTIQUE + PEDAGOGIQUE MULTI-SOURATES (108, 112, 113, 114)

CONTEXTE
Phase 26 (audit READ_ONLY) terminée. Décision : B — MULTI_SURAH_DATA_REFINEMENT_REQUIRED.
FATIHAH_REFERENCE_LOCKED = TRUE (référence UX/pédagogique verrouillée).
MASAQ v2 couvre 100% des 4 sourates pilotes (0 MISSING, 0 EXTRA).
6 occurrences AMBIGUOUS, toutes des variantes orthographiques bénignes + 1 bug latent
de normalisation. 5 formes sans glose FR validée. Nouveaux tags POS/cas/syntaxe.

ORDRE STRICT DES TRAVAUX (ne jamais sauter d'étape)
1. AUDIT : relire lib/linguistic/masaq.ts (normalizeOrthographic, classifyAlignment,
   classifySegment) et lib/linguistic/explanation.ts (tables tag→français).
2. READ_ONLY : rejouer l'alignement des 4 sourates, confirmer 0 MISSING/0 EXTRA et
   identifier exactement les 6 AMBIGUOUS.
3. CORRECTIFS BORNÉS (pas de refactor global) :
   a. corriger le bug latent : remplacer s.replace(TATWEEL,"") par s.replace(/\u0640/g,"")
      dans normalizeOrthographic ;
   b. étendre la normalisation : ى→ي (U+0649→U+064A) et supprimer les marques coraniques
      en exposant ۥ (U+06E5), ۢ (U+06E2), ۣ (U+06E3) ;
   c. re-vérifier : attendu 0 AMBIGUOUS résiduel sur les 4 sourates (comme Fātiḥah).
4. MAPPING PÉDAGOGIQUE (déterministe, documenté, jamais tag brut affiché) :
   - JUSSIVE = MODE (verbe après لَمْ), à distinguer des CAS nominaux ;
   - rôles copulatifs (SUBJ_COP_PART, PART_COP_PRED, V_COP_PRED, IV_COP, SUBJ_COP_V,
     PRED, EXPLET) → formulations « prédicat / élément annoncé » ;
   - ANNUL_PART/INF_ANNUL_PART (إِنَّ) → particule d'insistance/accusative ;
   - POSS_PRON (suffixe possessif) → « suffixe possessif » ;
   - NOUN_NUM (أَحَدٌ), ADJ_COMP (comparatif), ADJ_INTENS (intensif), IV_PASS/PV_PASS
     (passif), ADV/ADV_TIME (adverbe), NSUFF_FEM_* (suffixe féminin) ;
   - filtrer les segments i3rab vides Morph_Tag="None" (jamais affichés).
5. IMPORT MASAQ sourate par sourate (108 → 112 → 113 → 114), UNIQUEMENT dans la couche
   isolée (linguistic_occurrences / linguistic_segments) :
   - idempotent (UNIQUE(source_id, source_record_id)) ;
   - transactionnel (ROLLBACK si erreur critique) ;
   - vérifier MIN/MAX surah = la sourate en cours, COUNT = attendu ;
   - ne JAMAIS toucher aux données Fātiḥah déjà importées (29/56).
6. RUNTIME : paramétrer getWordLinguisticEvidence par sourate (toujours filtrée,
   jamais croisée), sans modifier grading/SRS/mastery/progression/curriculum.
7. TESTS : normalisation ى↔ي + marques exposant + tatweel multiple ; 0 AMBIGUOUS
   résiduel ; mapping déterministe de chaque nouveau tag ; isolation par sourate ;
   formes partagées → glose globale ; idempotence import ; non-régression Fātiḥah.
8. VALIDATION : npm test, npx tsc --noEmit, npm run lint, npm run build.
9. VALIDATION NAVIGATEUR : parcourir 108/112/113/114, provoquer erreurs, vérifier
   « Comprendre ce mot », 390×844 et 1280×720, RTL, console 0 erreur, 0 overflow.
10. NON-RÉGRESSION : compteurs corpus (21296/77430/6236/24944/32/70/32/184) et
    Fātiḥah (8 leçons/26 formes/29 occ/26 audios) strictement identiques.

CONTRAINTES ABSOLUES
- Ne pas étendre au-delà de 108/112/113/114.
- Ne pas ajouter de racines ni de schèmes (ABSENT_DATA).
- Ne pas créer de mapping lemmatique automatique.
- Ne pas modifier les gloses FR validées ni les traductions d'ayah.
- Ne pas modifier grading/SRS/mastery/progression/curriculum.
- AVAILABLE ≠ INFERABLE : donnée absente = ABSENT_DATA.
- Si un AMBIGUOUS persiste après correctif : STOP, documenter, ne pas forcer.

DÉCISION FINALE ATTENDUE
A — MULTI_SURAH_IMPLEMENTATION_SUCCESSFUL
B — PARTIAL_REVIEW_REQUIRED
C — ALIGNMENT_BLOCKED
D — REGRESSION_DETECTED

LIVRABLES
PHASE_27_MULTI_SURAH_LINGUISTIC_PEDAGOGICAL_IMPLEMENTATION.md
tmp/phase27-multi-surah-linguistic-pedagogical.json

Arrêter la phase après la décision. Toujours terminer par le prompt de la phase suivante.
```

---

**Résumé des vérifications** : inventaire complet des 5 sourates · MASAQ 100% couvert ·
alignement 0 MISSING/0 EXTRA · 6 AMBIGUOUS bénins + 1 bug latent · 5 gloses FR à revoir ·
nouveaux tags à mapper · formes partagées globales · contexte sans fuite · non-régression
confirmée (0 écriture).

**Non-régressions** : tous les compteurs corpus et la couche linguistique Fātiḥah
(29/56) inchangés · `FATIHAH_REFERENCE_LOCKED = TRUE`.

**Prochaines étapes** : appliquer les raffinements bornés (normalisation + mappings +
revue éditoriale) puis import sourate par sourate, selon le prompt ci-dessus.
