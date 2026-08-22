# PHASE 18C — IMPORT CONTRÔLÉ DE LA TRADUCTION KAZIMIRSKI 1869

## STATUT

**STATUS = IMPORT_COMPLETE**

| Attendu | Réalisé |
|---|---|
| Kazimirski 1869 = 6 236 | ✅ **6 236** (resource_id 9001) |
| translations total = 24 944 | ✅ **24 944** (18 708 + 6 236) |
| sources = 4 | ✅ **4** |
| duplicates = 0 | ✅ **0** |
| missing = 0 | ✅ **0** |
| errors = 0 | ✅ **0** |

---

## A. Baseline (avant import, lecture seule)

| Compteur | Avant |
|---|---|
| quran_words | 21 296 |
| word_occurrences | 77 430 |
| ayahs | 6 236 |
| translations | 18 708 |
| word_translations | 8 |
| lemmas | 22 |
| sources | 3 |
| lemma_translations | 4 |

## B. Source créée

| Champ | Valeur |
|---|---|
| name | **Kazimirski — Le Koran (1869)** |
| type | `quran_translation` |
| version | édition Charpentier 1869 |
| url | `https://fr.wikisource.org/wiki/Le_Koran_(Traduction_de_Kazimirski)` |
| license | Domaine public — auteur décédé 1887, protection expirée (1957 au plus tard). `LEGAL_STATUS = DOCUMENTED_PUBLIC_DOMAIN` |
| metadata | langue `fr`, traducteur, édition, année 1869, provenance Wikisource FR / API MediaWiki, manifest + artefact d'alignement, normalisation documentée |
| **source_id** | `6f54a7ae-2ae0-4179-a85d-410a5b34df78` |

**Distinction stricte** : source de **traduction du Coran** — totalement distincte de « Kazimirski — Dictionnaire arabe-français (1860) » (`historical_dictionary`, `567c8b5d-…`, les 4 lignes `lemma_translations` qui lui sont rattachées restent intactes).

## C. Resource_id

**9001** — choisi hors de l'ensemble utilisé par Quran.com (`20` en, `31` fr, `153` it), stable et documenté dans les métadonnées de la source. Contrainte `UNIQUE (ayah_id, resource_id)` existante réutilisée (aucune migration).

## D. Dry-run (obligatoire, avant écriture)

`DRY_RUN=1 npx tsx tmp/phase18c-import.ts` →

- payload : **6 236 entrées** (attendu 6 236) ✅
- ayah_id uniques : 6 236 · **tous existants** dans `ayahs` ✅
- language = fr : 6 236/6 236 ✅ · textes non vides ✅
- doublons payload : **0** ✅
- resource_id 9001 : libre ✅ · source : à créer (aucun doublon existant) ✅
- Résultat attendu : 6 236 nouvelles lignes, 0 conflit.

Aucune écriture en dry-run.

## E. Nombre importé

Run 1 (réel) : **6 236 insérées · 0 déjà présente · 0 erreur**. Source créée puis 6 236 lignes insérées par lots de 500 avec `ON CONFLICT (ayah_id, resource_id) DO NOTHING`. Sécurité all-or-nothing : en cas d'échec d'un lot, suppression compensatoire des lignes de l'exécution puis arrêt (aucun import partiel silencieux).

## F. Couverture

`SELECT ayah_id FROM ayahs` vs `SELECT ayah_id FROM translations WHERE resource_id = 9001` :

- **missing = 0** · **extra = 0** (différence vide dans les deux directions)
- 114 sourates · 6 236 ayahs · aucun doublon · aucun manquant

## G. Doublons

**0.** `COUNT(*) = COUNT(DISTINCT ayah_id) = 6 236`.

## H. Erreurs

**0.** Aucune erreur d'insertion, aucun rejet de contrainte.

## I. Vérification post-import

| Vérification | Résultat |
|---|---|
| `COUNT(*)` resource_id 9001 | **6 236** ✅ |
| `COUNT(DISTINCT ayah_id)` | **6 236** ✅ |
| language = fr | 6 236/6 236 ✅ |
| source_id correct | 6 236/6 236 → `6f54a7ae-…` ✅ |
| textes vides | 0 ✅ |
| textes avec marqueurs `[n]` | **0** (normalized_text importé) ✅ |
| translations total | **24 944** ✅ |
| Hamidullah (31) inchangé | 6 236 ✅ |
| Sahih International (20) inchangé | 6 236 ✅ |
| Piccardo (153) inchangé | 6 236 ✅ |

## J. Échantillon (texte DB ≡ payload 18B, correspondance exacte)

| Réf | Texte DB | Conforme |
|---|---|---|
| 1:1 | « Au nom du Dieu clément et miséricordieux » | ✅ |
| 2:255 | « Dieu, est le seul Dieu; il n'y a point d'autre Dieu que lui, le Vivant, l'immuable… » | ✅ |
| 9:61 | « Il en est parmi eux qui déchirent le prophète; ils disent: Il est tout oreille… » | ✅ |
| 45:33 | « Alors leurs mauvaises actions se présenteront à leurs yeux… » | ✅ |
| 55:1 | « Le MISÉRICORDIEUX a enseigné le Koran. » | ✅ |
| 74:5 | « Et l'abomination, fuis-la. » | ✅ |
| 77:22 | « Jusqu'au terme fixé d'avance? » | ✅ |
| 114:6 | « Contre les génies et contre les hommes. » | ✅ |

**8/8 — chaque texte DB est strictement égal au `normalized_text` du payload.**

## K. Idempotence (2ᵉ exécution, obligatoire)

Run 2 : **0 insérée · 6 236 déjà présentes · 0 doublon créé · 0 erreur**. Source réutilisée (upsert `UNIQUE (name, version)`). Après run 2 : `translations = 24 944` (et non 31 180). ✅

## L. Entités non modifiées

- **lemma_translations** : 4 lignes (عَبْد · رَحْمَة · لَا · أَرْض), `is_validated = false`, `validated_at = NULL`, source `567c8b5d-…` — **inchangées**.
- **word_translations** : 8 lignes — **inchangées**.
- **quran_words / word_occurrences / ayahs / lemmas** : inchangés.
- **Resolver** : non modifié (la nouvelle source est simplement disponible dans `translations` ; aucune glose ni validation automatique).

## M. Tests

| Contrôle | Résultat |
|---|---|
| `npm test` | ✅ 184/184 (14 fichiers) |
| `npx tsc --noEmit` | ✅ 0 erreur |
| `npm run lint` | ✅ 0 erreur, 0 warning |
| `npm run build` | ✅ 0 erreur |
| `npm run verify:persistence` | ✅ 13/13 |
| `npm run verify:rls` | ✅ 27/27 |

## N. Non-régression (après import)

| Compteur | Avant | Après | Attendu |
|---|---|---|---|
| quran_words | 21 296 | **21 296** | ✅ |
| word_occurrences | 77 430 | **77 430** | ✅ |
| ayahs | 6 236 | **6 236** | ✅ |
| translations | 18 708 | **24 944** | ✅ |
| word_translations | 8 | **8** | ✅ |
| lemmas | 22 | **22** | ✅ |
| sources | 3 | **4** | ✅ |
| lemma_translations | 4 | **4** | ✅ |

## O. Décision finale

**STATUS = IMPORT_COMPLETE**

- ✅ 6 236 lignes Kazimirski 1869 (resource_id 9001, lang fr)
- ✅ 24 944 translations au total (18 708 existantes strictement inchangées)
- ✅ 4 sources (3 existantes + 1 nouvelle, sans doublon)
- ✅ 0 doublon · 0 manquant · 0 extra · 0 erreur
- ✅ texte ≡ payload 18B (échantillon 8/8)
- ✅ idempotence prouvée (2ᵉ run : 0 insérée)
- ✅ aucun test de non-régression en échec
- ✅ aucun autre objet de la base modifié

## Livrables

- 📄 `PHASE_18C_KAZIMIRSKI_TRANSLATION_IMPORT_REPORT.md` (ce rapport)
- 📄 `tmp/phase18c-kazimirski-import-evidence.json` (`IMPORT_COMPLETE`)
- 🔧 `tmp/phase18c-import.ts` (pipeline d'import idempotent, réexécutable : `npx tsx tmp/phase18c-import.ts` / `DRY_RUN=1 …`)
- 🔗 Références Phase 18B : `tmp/phase18b-kazimirski-translation-alignment.json`, `tmp/phase18b-kazimirski-manifest.json`, `tmp/phase18b-kazimirski-raw/`

---

**PHASE 18C — IMPORT_COMPLETE** · Kazimirski 1869 = **6 236** · translations = **24 944** · sources = **4** · 0 doublon · 0 manquant · 0 erreur · résolver **non modifié**.
