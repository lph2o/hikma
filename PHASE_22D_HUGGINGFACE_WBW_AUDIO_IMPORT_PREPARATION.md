# PHASE 22D — HUGGING FACE WBW AUDIO — RISK ACCEPTANCE + IMPORT PREPARATION

**STATUS = `IMPORT_PLAN_READY`**
**DATABASE_WRITES = 0 · IMPORTS = 0 · STORAGE_WRITES = 0 · MIGRATIONS = 0**

Le propriétaire a pris connaissance du rapport 22C et décide explicitement de
poursuivre avec le dataset `zaibihassan/Quranic-Word-By-Word-Audio-Data`.

- **LEGAL_STATUS = `REVIEW_REQUIRED`** (inchangé — aucune reformulation en « sûr »)
- **OWNER_DECISION = `RISK_ACCEPTED`**

Cette décision autorise la poursuite **technique** uniquement. Elle ne garantit
rien juridiquement. Aucun fichier n'a été importé, aucun schéma modifié.

---

## 0. RÉSULTAT SYNTHÉTIQUE

| métrique | valeur |
|---|---|
| fichiers `.opus` listés | **154 858** (77 429 × 2 styles) |
| fichiers valides / invalides | 154 858 / **0** |
| doublons / fichiers corrompus (size<200) | **0 / 0** |
| fichiers mappés sur Hikma | **77 429 / 77 429 (100 %)** |
| formes distinctes couvertes | **21 295 / 21 296** |
| occurrence sans audio | **1** — l'artéfact de numéro de verset `١٨١` (2:181:14, non-mot) |
| lignes `word_audio` planifiées | **42 590** (21 295 × 2 styles) |

Le dataset couvre **tout le Coran mot-à-mot**, avec un unique « trou » qui n'est
**pas un vrai mot** : l'occurrence 2:181:14 est le numéro de verset en chiffres
arabes (`arabic = "١٨١"`, `meaning = "(181)"`, sans lemme), importé par Hikma comme
un `quran_word`. Ce n'est pas un manque du dataset.

---

## PART A — PROVENANCE (fiche)

| champ | valeur |
|---|---|
| dataset_name | Quranic Word By Word Audio Data |
| repository | `zaibihassan/Quranic-Word-By-Word-Audio-Data` |
| licence déclarée | Apache-2.0 (métadonnée HF + frontmatter README — **pas** de fichier LICENSE/DATA_LICENSE) |
| legal_status | **REVIEW_REQUIRED** |
| owner_decision | **RISK_ACCEPTED** |
| date de décision | 2026-08-15 |
| nombre de fichiers | 154 858 (`.opus`, 16 kHz) |
| styles | `muallim`, `mujawwad` |
| taille totale | ≈ 920 Mo (donnée mainteneur 22C) |
| source_id proposé | « Hugging Face — Quranic Word By Word Audio Data (zaibihassan) » (à créer) |

> La classification reste `REVIEW_REQUIRED` : la provenance sous-jacente des
> enregistrements (récitant(s), source des MP3 ré-encodés) n'est pas divulguée.
> Rien dans cette phase ne transforme ce statut en `SAFE`.

---

## PART B — ANALYSE DES FICHIERS

Réalisée en lisant l'arbre Git HF **complet** (pagination `Link: rel="next"`
suivie, retry 429 avec backoff) pour `muallim` et `mujawwad`, 114 dossiers chacun.

- fichiers `.opus` : **154 858** (77 429 muallim + 77 429 mujawwad)
- fichiers invalides (nommage non conforme) : **0**
- doublons (même `SURAH_AYAH_WORD` dans un style) : **0**
- fichiers suspects (taille < 200 octets, corruption probable) : **0**
- erreurs de listing : **0**
- fichiers `.pb` (hors périmètre audio) : ignorés par conception

Correction d'un chiffre de 22C : le « 154 858 lignes » annoncé correspond bien
aux **fichiers** réels (77 429 par style), confirmé ici par listing direct.

---

## PART C — MAPPING HIKMA

Mapping **déterministe et exclusivement positionnel** :

```
SURAH + AYAH + WORD_POSITION  →  word_occurrences  →  word_id
```

- **Aucun** fuzzy matching, aucun `normalized_text` comme clé, aucune déduction
  de lemma, aucune modification de `quran_words.lemma_id`.
- Clé : `occurrenceKey(surah, ayah, position)` = `SSS_AAA_MMM` (identique au
  nommage du dataset).
- **77 429 / 77 429 fichiers mappés** (100 %) — 0 fichier sans occurrence.
- **1 occurrence sans fichier** : `002_181_014` = artéfact de numéro de verset
  `١٨١` (non-mot). C'est le seul écart et il est légitime.
- **0 fichier sans occurrence** : la segmentation WBW du dataset est alignée
  1:1 avec la segmentation Quran.com importée dans Hikma.

---

## PART D — MODÈLE AUDIO (tables 0009 existantes, aucune migration)

Le dataset est **par-occurrence** ; `word_audio` est **par-forme**
(`word_id` + `recitation_id`, `UNIQUE(word_id, recitation_id)`). Représentation
proposée :

| colonne | valeur |
|---|---|
| `word_id` | `quran_words.id` (forme, **dédupliquée**) |
| `recitation_id` | 2 entrées `recitations` proposées : « WBW Muallim (Hugging Face zaibihassan) » et « WBW Mujawwad (Hugging Face zaibihassan) » (`quran_com_id` NULL, `style` Muallim/Mujawwad, `source_id` = source HF) |
| `source_id` | source HF dédiée (à créer — sinon STOP) |
| `audio_url` | chemin Storage `{style}/{word_id}.opus` |

Les 2 entrées `recitations` sont une **proposition** : elles rendent le style
explicite et font respecter l'unicité par `UNIQUE(word_id, recitation_id)`.
Elles ne doivent **pas** être confondues avec les récitants existants
(Al-Husary « Muallim », AbdulBaset « Mujawwad ») : la correspondance WBW→récitant
n'est pas prouvée (cf. 22C).

---

## PART E — STRATÉGIE DE STOCKAGE

**Recommandée : OPTION B — copie dans Supabase Storage** (bucket `word-audio`).

| option | verdict |
|---|---|
| A. référence directe Hugging Face | rejetée — dépendance externe, rate-limit, pas de contrôle |
| B. Supabase Storage | **retenue** — stabilité, contrôle, remplacement ultérieur, suppression complète |
| C. CDN intermédiaire | rejetée — complexité inutile au pilote |

Le bucket `word-audio` devra être créé (privé + URLs signées à la lecture).

---

## PART F — DÉDUPLICATION

**Clé logique primaire** : `surah + ayah + word_position + recitation/style`
(jamais la forme arabe seule).

**Dédup retenue** : par `(word_id, style)` → **une** ligne `word_audio` par forme
et par style, en conservant le chemin source représentatif (premier par ordre
lexicographique, déterministe).

- 77 429 fichiers → **21 295 lignes** par style (facteur ×3,64).
- **Sans perte de contenu** : l'audio WBW Muallim/Mujawwad est un enregistrement
  de **forme** réutilisé, identique d'une occurrence à l'autre. La dédup par forme
  est donc saine pour ce corpus.
- **Provenance conservée** : chaque ligne garde `source_path` + `occurrence_key`
  d'origine (traçabilité), en plus du `source_id` commun.

---

## PART G — DRY-RUN (aucune écriture)

Résultat complet (voir `tmp/phase22d-huggingface-wbw-dry-run.json`) :

- fichiers trouvés : **154 858** · valides : **154 858** · invalides : **0**
- doublons : **0** · suspects : **0**
- occurrences mappées : **77 429 / 77 429** · non mappées : **0**
- occurrences sans audio : **1** (`002_181_014`, artéfact `١٨١`)
- **lignes `word_audio` planifiées : 42 590** (21 295 muallim + 21 295 mujawwad)

`DATABASE_WRITES = 0` · `STORAGE_WRITES = 0` · `MIGRATIONS = 0` confirmés.

---

## PART H — TESTS

Ajoutés (logique pure, aucune écriture) :

- `lib/quran/wbw-filename.ts` — parsing strict (style, dossier sourate cohérent,
  format 3+3+3, plages 1..114) + `occurrenceKey`.
- `lib/quran/wbw-plan.ts` — `buildOccurrenceIndex`, `parseWbwFiles`,
  `planWbwImport` (dédup par forme+style), `huggingfaceResolveUrl`.
- `tests/wbw-filename.test.ts` (9) + `tests/wbw-import-plan.test.ts` (12).

Couvrent : mapping exact `SURAH_AYAH_WORD`, absence de fuzzy, position de mot,
Muallim/Mujawwad, fichiers manquants (unmapped), fichiers invalides, idempotence
(déterminisme), absence de collision (dédup), **aucune modification de
`quran_words`** (fonctions pures), conservation de provenance.

`npm test` : **242/242** (18 fichiers) — aucune régression (221 → 242, +21).

---

## PART I — PROTECTION CONTRE LE REMPLACEMENT

- Toutes les lignes `word_audio` porteront `source_id` = source HF dédiée.
- Suppression complète : `DELETE FROM word_audio WHERE source_id = <source HF>`
  + purge du bucket `word-audio`. Aucune donnée d'une autre source n'y sera
  mélangée (source_id distinct + bucket dédié).
- Le script est **idempotent** : `UNIQUE(word_id, recitation_id)` +
  `onConflict ... ignoreDuplicates`.

---

## PART J — LIVRABLES

- 📄 `PHASE_22D_HUGGINGFACE_WBW_AUDIO_IMPORT_PREPARATION.md` (ce rapport)
- 📄 `tmp/phase22d-huggingface-wbw-import-plan.json`
- 📄 `tmp/phase22d-huggingface-wbw-dry-run.json`
- 📄 `scripts/import-huggingface-wbw-audio.ts` (dry-run par défaut ; `IMPORT=1` pour l'import réel)
- 📄 `lib/quran/wbw-filename.ts` · `lib/quran/wbw-plan.ts` (+ tests)
- 📄 `package.json` : script `import:wbw-audio`

---

## NON-RÉGRESSION (tout vert)

| commande | résultat |
|---|---|
| `npm test` | **242/242** (+21) |
| `npx tsc --noEmit` | 0 |
| `npm run lint` | 0 |
| `npm run build` | 0 |
| `npm run verify:persistence` | 13/13 |
| `npm run verify:rls` | 33/33 |

Compteurs DB **inchangés** : quran_words 21 296 · word_occurrences 77 430 ·
ayahs 6 236 · translations 24 944 · lemmas 22 · lemma_translations 22 ·
sources 4 · word_translations 8 · word_lemma_mapping 171 · recitations 14 ·
ayah_audio **0** · word_audio **0**.

---

## DÉCISIONS REQUISES AVANT IMPORT RÉEL (Phase 22E)

1. **Source** : créer la source HF dédiée (ou réutiliser une source existante par décision).
2. **Récitations WBW** : créer les 2 entrées `recitations` (Muallim / Mujawwad).
3. **Bucket** : créer Supabase Storage `word-audio` (privé + URLs signées).

---

## ARRÊT OBLIGATOIRE

**DATABASE_WRITES = 0 · IMPORTS = 0 · STORAGE_WRITES = 0 · MIGRATIONS = 0.**

Aucun fichier importé, aucun upload Storage, aucune table modifiée, aucun resolver
modifié, aucune UI modifiée, exercices audio non activés.

En attente d'une nouvelle décision avant tout import réel.
