# PHASE 22E — REPRISE SÉCURISÉE DE L'IMPORT WBW MUALLIM

**STATUS : `IMPORT_COMPLETE`**

Source : `zaibihassan/Quranic-Word-By-Word-Audio-Data` · Style : **Muallim uniquement**.
Reprise idempotente via `IMPORT=1 USE_CACHE=1 npm run import:wbw-audio`.

---

## 1. AUDIT LIVE AVANT REPRISE (lecture seule, aucune écriture)

| Contrôle | Résultat |
|---|---|
| Autre instance d'import en cours | ❌ aucune |
| `word_audio` (lignes) | **20 409** |
| `word_audio` distinct `word_id` | 20 409 |
| `word_audio` sans `recitation_id` | 0 |
| `word_audio` sans `source_id` | 0 |
| `word_audio` hors récitation Muallim | 0 |
| `recitations` | 15 (dont 1 `WBW Muallim (HF)` dédiée) |
| `sources` | 5 (dont 1 source HF dédiée) |
| `ayah_audio` | **0** ✓ |
| Buckets Storage | `word-audio` uniquement |
| Objets Storage **Muallim** | 20 410 |
| Objets Storage **Mujawwad** | **0** ✓ |
| Références DB → Storage incohérentes | **0** ✓ |
| Objets Storage orphelins | **1** (`f5f6ec47-…opus`, présent en Storage, absent en DB) |
| Fichiers Muallim manquants | 886 (885 absents + 1 orphelin à réconcilier) |
| Échecs du run précédent (11) | **11/11 résolus** (tous OK DB + Storage) |

**Décision : état cohérent → reprise autorisée.** Aucune anomalie critique.
L'orphelin unique (`f5f6ec47`, source `muallim/031/031_028_006.opus`) appartient au plan :
la reprise le retraite (upload upsert + insert) et le réconcilie naturellement.

## 2. STORAGE — CAPACITÉ

- Utilisé avant : **136,51 Mo**
- Estimation des fichiers restants : **~6 Mo**
- Projection totale : **~142,4 Mo**
- Quota (palier Free 1 Go) : marge **~881 Mo** → **SUFFISANT**, aucune limite franchie.

## 3. REPRISE (import réel, idempotent)

Commande : `IMPORT=1 USE_CACHE=1 npm run import:wbw-audio`

```
plan chargé depuis cache : 21295 lignes
déjà importés : 20409 · restants : 886 · à traiter ce run : 886
```

| Métrique | Valeur |
|---|---|
| Traités ce run | 886 |
| Uploadés | 886 |
| Insérés | 886 |
| Ignorés (déjà présents) | 20 409 |
| Retries | 0 |
| Échecs | 0 |
| Octets importés | 6 181 462 |

## 4. ÉTAT APRÈS REPRISE

| Élément | Avant | Après |
|---|---|---|
| `word_audio` | 20 409 | **21 295** |
| Objets Storage Muallim | 20 410 | **21 295** |
| Objets Storage Mujawwad | 0 | **0** |
| `ayah_audio` | 0 | **0** |
| Orphelins Storage | 1 | **0** |
| Incohérences DB↔Storage | 0 | **0** |
| Muallim manquants | 886 | **0** |
| Storage utilisé | 136,51 Mo | 142,4 Mo |

L'orphelin `f5f6ec47` a été réconcilié (fichier réécrit + ligne DB créée) : plus aucun orphelin.

## 5. IDEMPOTENCE

Second run `IMPORT=1 USE_CACHE=1` :

```
déjà importés : 21295 · restants : 0 · à traiter ce run : 0
uploaded: 0 · inserted: 0 · failed_count: 0
```

→ Aucun ré-upload, aucune ligne dupliquée, aucun effet de bord.

## 6. VÉRIFICATIONS FINALES

- **RLS** : 33/33 passées (`scripts/verify-rls.ts`).
- **Tests** : 242/242 passés (`vitest run`).
- **Invariants non modifiés** :
  - `quran_words` : 21 296 (inchangé) ;
  - `word_occurrences` : 77 430 (inchangé) ;
  - `lemma_id`, resolver, buildWordBank, UI, exercices, review, leçons : **inchangés** ;
  - aucune migration appliquée pendant 22E.
- **Style** : Muallim uniquement ; Mujawwad = 0 ; audio d'ayah = 0.
- **Mapping** : déterministe positionnel `SURAH + AYAH + WORD_POSITION → word_occurrences → word_id`
  (aucun fuzzy, aucun `normalized_text`, aucun changement de `lemma_id`).
  `002_181_014` reste exclu (artéfact de numéro de verset, non-mot).

## 7. CRITÈRES DE SUCCÈS

| Critère | État |
|---|---|
| Muallim uniquement | ✅ |
| Mujawwad = 0 | ✅ |
| ayah_audio = 0 | ✅ |
| Mapping déterministe | ✅ |
| Storage cohérent | ✅ |
| DB cohérente | ✅ |
| Aucun orphelin non résolu | ✅ |
| Quota respecté | ✅ |
| Idempotence vérifiée | ✅ |
| RLS vérifié | ✅ |
| Tests verts | ✅ |
| quran_words inchangé | ✅ |
| lemma_id inchangé | ✅ |
| resolver inchangé | ✅ |
| UI inchangée | ✅ |

**STATUS FINAL : `IMPORT_COMPLETE`**

Livrables :
- `PHASE_22E_WBW_MUALLIM_IMPORT_REPORT.md` (ce fichier)
- `tmp/phase22e-wbw-muallim-import-evidence.json`
- `tmp/phase22e-wbw-muallim-import-summary.json`

## 8. ARRÊT

Conformément à la règle finale : **arrêt ici**. Aucune poursuite automatique vers 22F,
aucun import Mujawwad, aucun audio d'ayah, aucune activation `AUDIO_TO_WORD` /
`WORD_TO_AUDIO`, aucune modification player/UI. En attente d'approbation explicite.
