# PHASE_70C_LOT2_REPORT — PILOTE ÉDITORIAL LOT 2

## STATUT

```
PHASE_70C_LOT2_COMPLETE
STATUS: APPLIED_AND_VERIFIED
```

Premier lot d'import du pilote éditorial **Lot 2** appliqué et vérifié de bout en bout, après revue ciblée (70C) acceptée globalement et human gate APPLY explicite.

---

## 1. REVUE CIBLÉE (READ-ONLY) — acceptée globalement

- 14 cas examinés sur données live (POS MASAQ, 32 lemmes + lemma_translations, 4 traductions alignées 31/9001/20/153).
- **Décision humaine : ACCEPTATION GLOBALE** (11 ACCEPT · 2 MODIFY · 1 HOLD).
  - MODIFY : ٱلنَّارِ → « le Feu (de l'Enfer) » (glose lexicale, non copie de traduction) · فِيهِ → GLOSE directe « en lui / dans cela » (aucun mapping).
  - HOLD : أَعْلَمُ (homographie élatif/imparfait verbal attestée, 7:188 « لو كنتُ أعلمُ الغيب ») — exclu de l'import.
- **كُنَّا → كَان** : conservée en **HOLD** au human gate APPLY (périmètre décidé « seul mapping كَانُوا۟ → كَان »).

Artefacts : `tmp/phase70c/targeted-review.json` · `tmp/phase70c/lot2-review-decisions.json`.

## 2. DRY-RUN (aucune écriture)

Plan validé : **17 `word_translations`** (fr, `is_validated=true`) + **1 `word_lemma_mapping`** (كَانُوا۟ → كَان, safe/editorial).

Contrôles tous PASS :
- NFC 20/20 word_id ↔ forme réelle `quran_words` · unicité 0 doublon
- 0 collision (`unexpected_collisions = 0`) · 0 divergence
- source « Hikma — lexique éditorial » existante
- lemme كَان existant avec lemma_translation FR validée « être » (seul mapping)
- absence totale d'أَعْلَمُ / كُنَّا du plan · aucun mapping فِيهِ
- idempotence : 17 + 1 INSERT (0 existant)

## 3. HUMAN GATE APPLY

Autorisation explicite : « **Oui : 17+1, كُنَّا en HOLD, appliquer** » — périmètre 17 gloses + 1 mapping, أَعْلَمُ et كُنَّا en HOLD.

## 4. APPLY

| Table | Écritures | Détail |
|---|---|---|
| `word_translations` (fr, validated) | **+17** | 17 INSERT · 0 erreur · 0 collision · post-verified 17/17 |
| `word_lemma_mapping` (safe, editorial) | **+1** | كَانُوا۟ → كَان · 0 erreur · post-verified 1/1 |

### Les 17 gloses (texte exact)
يَعْلَمُونَ « ils savent » · قَالُوٓا۟ « ils dirent » · يَعْمَلُونَ « ils font / ils œuvrent » · يَشَآءُ « Il veut » · غَفُورٌۭ « Pardonneur » · رَّحِيمٌۭ « Miséricordieux » · عَلِيمٌۭ « Omniscient / qui sait tout » · شَىْءٍ « chose » · كُلَّ « tout / chaque » · كُلُّ « tout / chaque » · قَبْلُ « avant / auparavant » · **ٱلنَّارِ « le Feu (de l'Enfer) »** · ٱلْكَـٰفِرِينَ « les mécréants » · ٱلْقِيَـٰمَةِ « la Résurrection » · لَهُۥ « à lui / pour lui » · وَهُوَ « et Lui / et il » · **فِيهِ « en lui / dans cela »**

### Mapping
- **كَانُوا۟ → كَان** (`safe`, `editorial`) — lemme كَان réutilisé (existant, lemma_translation FR validée « être »), aucun lemme créé.

## 5. DIFF DB (post-APPLY, READ-ONLY)

| Compteur | Avant | Après | Δ |
|---|---|---|---|
| `word_translations` FR validées | 551 | **568** | +17 |
| `word_lemma_mapping` | 187 | **188** | +1 |
| `linguistic_occurrences` | 22 485 | 22 485 | 0 |
| `linguistic_segments` | 44 677 | 44 677 | 0 |
| `translations` | 24 944 | 24 944 | 0 |
| `quran_words` | 21 296 | 21 296 | 0 |
| `word_occurrences` | 77 430 | 77 430 | 0 |
| `lemmas` | 32 | 32 | 0 |
| `lemma_translations` (FR validées) | 28 | 28 | 0 |
| `sources` | 6 | 6 | 0 |

**`unexpected_table_changes = []`** — seules les 2 tables éditoriales changées. Aucune table MASAQ/métier modifiée.

## 6. PÉRIMÈTRE / PROPAGATION

- Écritures planifiées : **18** (17 gloses + 1 mapping) — conforme.
- Formes HOLD absentes de l'import : **أَعْلَمُ ✓ · كُنَّا ✓** (vérifié en base : 0 ligne).
- Mapping unique : كَانُوا۟ → كَان (safe/editorial) ✓ · **aucun mapping فِيهِ** ✓.
- Formes sœurs jamais fusionnées : كُلَّ/كُلُّ conservées distinctes, gloses identiques.

## 7. RUNTIME

- **18/18 formes résolues en FR** (100 %) : 17 via `word_translations` (forme directe) + 1 via lemme (كَانُوا۟ → « être »).
- Provenance vérifiée : « Hikma — lexique éditorial » sur 17/17 gloses.

## 8. IDEMPOTENCE (rerun)

Rerun contrôlé : **0 nouvelle insertion** — 17 gloses + 1 mapping reconnus comme doublons (`already_exists = 17 + 1`), 0 divergence, post-verified inchangé (17/17, 1/1).

## 9. NON-RÉGRESSION (réellement exécutée)

| Outil | Résultat |
|---|---|
| `tsc --noEmit` | **PASS** |
| `eslint .` | **PASS** |
| `vitest run` | **775/775 PASS** (baseline identique) |
| `npm run build` | **PASS** |

## 10. ÉTAT LEXICAL APRÈS LOT 2

- `word_translations` FR validées : **551 → 568** · mappings safe : **187 → 188**
- Formes résolues FR : **832 → 850** (+17 gloses directes + 1 résolution par lemme كَان)
- HOLD conservés : أَعْلَمُ, كُنَّا (analyse/mapping ultérieurs)

## 11. GARANTIES

- Écriture **UNIQUEMENT** dans `word_translations` et `word_lemma_mapping`.
- Aucun lemme créé · aucune `lemma_translation` · aucune traduction d'ayah · aucune table MASAQ/métier · aucun commit/push.
- Fātiḥah et pilotes (112/113/114/108) intacts.
- Aucun lot supplémentaire lancé : tout nouveau lot nécessitera un cycle complet (sélection → évidence → propositions → revue humaine → DRY-RUN → human gate APPLY).

## VERDICT

```
PHASE_70C_LOT2_COMPLETE — APPLIED_AND_VERIFIED
DATABASE_WRITES (phase de préparation) : 0
APPLY : word_translations +17 · word_lemma_mapping +1
```
