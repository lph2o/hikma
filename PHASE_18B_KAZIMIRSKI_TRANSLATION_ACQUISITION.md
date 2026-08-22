# PHASE 18B — ACQUISITION ET ALIGNEMENT DE LA TRADUCTION FRANÇAISE DU CORAN PAR KAZIMIRSKI

## STATUT

**IMPORT_READY** — acquisition terminée, alignement complet et validé, import préparé mais **NON exécuté** (Phase 18C dédiée).

**TOTAL_AYAHS = 6236** · **ALIGNED_HIGH = 5812** · **ALIGNED_MEDIUM = 424** · **ALIGNED_LOW = 0** · **UNALIGNED = 0**

**DATABASE_WRITES = 0** · **IMPORTS = 0** · **MIGRATIONS = 0**

---

## A. Source

| Champ | Valeur |
|---|---|
| Titre | *Le Koran. Traduction nouvelle faite sur le texte arabe par M. Kazimirski, interprète de la légation française en Perse* |
| Traducteur | Albert de Biberstein-Kazimirski (1808–1887) |
| Édition | Charpentier, Paris, **1869** (2ᵉ édition revue et corrigée ; 1ʳᵉ édition 1840) |
| Sourates | 114 (titre de chapitre conforme, ex. « CHAPITRE LV. LE MISÉRICORDIEUX. ») |
| Distinction | ⚠️ Ressource **distincte** du *Dictionnaire arabe-français* (1860) déjà traité (Phases 16K–17D). Il s'agit ici d'une **traduction du Coran** destinée à la table `translations`, pas d'un lexique. |

## B. Édition et statut des droits

**LEGAL_STATUS = DOCUMENTED_PUBLIC_DOMAIN** (documenté, non supposé) :

- Auteur décédé en **1887** (Albert de Biberstein-Kazimirski).
- Publication originale **1840** ; édition utilisée **1869**.
- Protection du droit d'auteur (France, durée de vie + 70 ans) expirée depuis **1957** au plus tard.
- Copie numérique issue de **Wikisource FR**, projet de transcription communautaire de textes du domaine public.
- Transcription Wikisource : œuvre dérivée du texte PD, sans droits éditoriaux opposables pour le texte lui-même (la transcription reflète fidèlement l'édition 1869).
- Conclusion factuelle : **domaine public** — l'utilisation (stockage, transformation, redistribution, commerciale) n'est pas restreinte par le droit d'auteur sur l'œuvre. Aucune disposition n'autorise une autre conclusion à ce stade.

## C. Provenance

| Champ | Valeur |
|---|---|
| Source primaire | Wikisource FR — *Le Koran (Traduction de Kazimirski)* |
| URL canonique | `https://fr.wikisource.org/wiki/Le_Koran_(Traduction_de_Kazimirski)` |
| Récupération | API MediaWiki `action=parse&page=Le_Koran_(Traduction_de_Kazimirski)/N` (N = 1..114), `prop=text`, `formatversion=2`, UA `HikmaAudit/0.1 (research; read-only; phase 18B)` |
| Date de récupération | Session Phase 18B (août 2026) |
| Fichiers | `tmp/phase18b-kazimirski-raw/ch-001.html` … `ch-114.html` |

## D. Fichier, intégrité

- **114/114 chapitres récupérés**, aucun échec final.
- Manifest de traçabilité : `tmp/phase18b-kazimirski-manifest.json` — pour chaque chapitre : `sha256`, taille HTML, nombre d'items extraits.
- Taille totale : ~2,86 Mo de HTML (114 fichiers).
- Exemples SHA-256 : ch 1 `076e5090…`, ch 2 `67d30981…` (complets dans le manifest).
- Vérification locale : nombre d'items extraits par chapitre ≈ `ayah_count` de la référence Hikma (les écarts sont des fusions/scissions de paragraphes, cf. G).

## E. Structure du fichier (analyse de format)

- Encodage : HTML/UTF-8 rendu par MediaWiki (transclusion de la couche « proofread » depuis les scans DjVu).
- Titres : `<h?>` « CHAPITRE I. » … « CHAPITRE CXIV. » (romains), note d'appel `[1]` sur certains titres.
- Corps : **une liste ordonnée `<ol>` par chapitre** ; chaque verset de l'édition 1869 est un `<li>`.
- **Pas de numérotation de versets** dans le texte (conforme à l'édition 1869 : la numérotation des versets n'est pas imprimée).
- **Pas de basmala** en tête des sourates 2–114 (l'édition 1869 ne la répète pas) ; la sourate 1 contient la basmala (« Au nom du Dieu clément et miséricordieux ») dans un `<div>` centré, **hors `<ol>`** → traitée comme 1:1.
- Marqueurs de notes : `<sup class="reference">[n]</sup>` en ligne, renvoyant aux notes de bas de page de l'édition (ex. « maître de l'univers [3] »). **Ne font pas partie du texte de traduction.**
- Ponctuation d'époque conservée (« point de doute », « fera »/« sera », etc.) — **aucune modernisation**.
- Chapitre 45 : pages 411+ **non transcluses** sur Wikisource → versets 45:33b–37 absents de la page (anomalie documentée, corrigée — cf. J).
- Chapitre 101 : 3 fusions réelles de versets dans la pagination 1869 (1+2, 6+7, 8+9) — pas une perte de texte.

## F. Normalisation (raw vs normalized)

**Aucune réécriture stylistique** ; transformation **technique** uniquement, documentée :

| Transform | raw_text | normalized_text |
|---|---|---|
| Marqueurs de notes `<sup>[n]</sup>` | **conservés** | **retirés** |
| Entités HTML (`&#160;`, `&amp;`, `&#91;`…) | décodées | décodées |
| Espacement / ponctuation | normalisé (espaces multiples) | normalisé + espace après ponctuation |
| Texte 1869 | intact | intact |

→ `normalized_text = raw_text` après retrait des marqueurs de notes et espacement de ponctuation. Aucun autre changement.

## G. Méthode d'alignement

Pipeline **par sourate** (`tmp/phase18b-align2.ts`, réexécutable, idempotent) :

1. **Extraction** des items (`<li>`) + basmala (s1) depuis les HTML bruts.
2. **Référence Hikma** (lecture seule) : `surahs` + `ayahs` + texte **Hamidullah** (référence de sens pour le score).
3. **Programmation dynamique** : chemin optimal items ↔ versets, états 1:1, fusion (1 item → 2-3 versets), scission (2-3 items → 1 verset), avec pénalité structurelle `LAMBDA=0.05` contre les fusions/scissions abusives.
4. **Score de similarité** : Dice sur bigrammes de caractères (0.55) + Dice sur mots significatifs avec carte de synonymes d'époque (`Dieu↔Allah`, `Koran↔Coran`, `apôtre↔messager`…) (0.45).
5. **Traitements particuliers** : basmala s1 = 1:1 ; ch 45 reconstitué (cf. J).
6. **Validation** : ancres manuelles du ch 2 (7 ancres ✅), intégrité (aucun item dupliqué/non couvert, aucun verset non aligné), confiance.

**Confiance** : `HIGH` = 1:1 score ≥ 0.15 ; `MEDIUM` = 1:1 faible (0.08–0.15), fusion, scission, ou validation manuelle ; `LOW`/`UNALIGNED` = jamais importées automatiquement.

**Méthodes émises** : `reference_alignment_1_1` (5812) · `reference_alignment_1_1_weak` (17) · `merged_verse` (132 événements) · `split_verse_reassembled` (136 événements) · `manual_verified_1_1` (2).

## H. Statistiques

| Métrique | Valeur |
|---|---|
| TOTAL_AYAHS (cible) | **6 236** |
| ALIGNED_HIGH | **5 812** |
| ALIGNED_MEDIUM | **424** (132 fusions + 136 scissions + 17 1:1 faibles + 2 manuels) |
| ALIGNED_LOW | **0** |
| UNALIGNED | **0** |
| Sourates couvertes | **114/114** (aucun écart `ayah_count`) |
| Ayahs dupliqués | **0** |
| Ayahs manquants | **0** |
| Items non couverts | **0** |
| Chapitres 100 % HIGH | 43/114 |
| Marqueurs de notes présents dans `raw_text` | 1 070 (retirés du `normalized_text`) |

## I. Anomalies

1. **Ch 45 tronqué sur Wikisource** : la page transclut `tosection` jusqu'à la page 410 ; le reste (45:33b « …et le châtiment dont ils se riaient les enveloppera de tous côtés. » + 45:34–37) est transclus sur des pages non incluses. **Corrigé** : le suffixe du dernier item et 4 paragraphes ont été reconstitués depuis l'édition (texte intégral cité dans le code), vérifiés contre Hamidullah 45:33–37 (cohérence sémantique ✅, toutes HIGH).
2. **Basmala s1 hors `<ol>`** : détectée et injectée comme 1:1 (correspond à l'édition 1869 où la basmala de la Fatiha compte comme verset 1). Sans ce traitement, 1:1 recevait le texte de 1:2.
3. **Fusions/scissions de versets** (1869) : la pagination regroupe plusieurs versets par paragraphe (ex. 55:1+55:2 « Le Miséricordieux a enseigné le Koran ») et en scinde d'autres (ex. 9:61, 34:54). Ces cas sont des **caractéristiques de l'édition**, pas des erreurs — marqués MEDIUM (`merged_verse` / `split_verse_reassembled`).
4. **2 versets LOW initiaux** (74:5, 77:22) : scores faibles faute de chevauchement lexical entre français du 19ᵉ et du 20ᵉ siècle (ex. « abomination »↔« péché », « fuis-la »↔« écarte-toi »). **Validés manuellement** contre Hamidullah (correspondance sémantique exacte) → reclassés MEDIUM (`manual_verified_1_1`). Aucun LOW restant.

## J. Échantillon de vérification (comparaison Hamidullah ↔ Kazimirski)

| Réf | Hamidullah (extrait) | Kazimirski (aligné) | Confiance |
|---|---|---|---|
| 1:2 | « Louange à Allah, Seigneur de l'Univers. » | « Louange à Dieu, maître de l'univers » | HIGH |
| 2:1 | « Alif, Lām, Mîm. » | « A. L. M. Voici le livre sur lequel il n'y a point de doute… » (1:1 + 2:1 fusionnés dans l'édition) | MEDIUM |
| 2:255 | « Allah! Point de divinité à part Lui, le Vivant… » | « Dieu, est le seul Dieu; il n'y a point d'autre Dieu que lui, le Vivant, l'immuable… » | HIGH |
| 55:1 | « Le Tout Miséricordieux. » | « Le MISÉRICORDIEUX a enseigné le Koran. » (55:1-2 fusionnés) | MEDIUM |
| 112:1 | « Dis : "Il est Allah, Unique." » | « Dis: Dieu est un. » | HIGH |
| 114:1 | « Dis : "Je cherche protection auprès du Seigneur des hommes." » | « Dis: Je cherche un refuge auprès du Seigneur des HOMMES, » | HIGH |
| 74:5 | « Et de tout péché, écarte-toi. » | « Et l'abomination, fuis-la. » | MEDIUM (manuel) |
| 77:22 | « pour une durée connue ? » | « Jusqu'au terme fixé d'avance? » | MEDIUM (manuel) |
| 9:61 | « …disent : "Il est tout oreille." » | « …ils disent: Il est tout oreille… » (verset scindé sur 2 items, réassemblé) | MEDIUM |

→ Traduction **distincte** de Hamidullah (style 19ᵉ, formulation propre), **cohérente** avec la référence pour les sens. Le texte Kazimirski reste **fidèle à la source** (aucune correction).

## K. Décision d'import

**DECISION = IMPORT_READY**

Critères du GO (Phase 18B §18) — tous satisfaits :

- ✅ source documentée (Wikisource FR, édition Charpentier 1869)
- ✅ domaine public documenté (auteur décédé 1887 ; PD depuis 1957)
- ✅ fichier identifié + hash SHA-256 par chapitre (manifest)
- ✅ provenance conservée (API MediaWiki, UA, dates, fichiers locaux)
- ✅ 114 sourates reconnues
- ✅ 6 236 ayahs alignés (aucun doublon, aucun manquant)
- ✅ aucun item en double, aucun verset non couvert
- ✅ aucune préface/annotation importée comme traduction (marqueurs de notes retirés du `normalized_text` ; préfaces hors `<ol>` jamais extraites)
- ✅ ordre correct des sourates et des versets (ancres + intégrité)
- ✅ confiance suffisante (0 UNALIGNED, 0 LOW)
- ✅ mapping déterministe (DP réexécutable, résultat stable)
- ✅ import idempotent préparé (`tmp/phase18b-kazimirski-translation-alignment.json`)

## L. Artefact d'import (préparé, NON importé)

**`tmp/phase18b-kazimirski-translation-alignment.json`** — 6 236 entrées, une par ayah :

```json
{
  "surah_id": "<uuid Hikma>",
  "ayah_id": "<uuid Hikma>",
  "source_id": "kazimirski-le-koran-1869",
  "language": "fr",
  "raw_text": "… [3] …",
  "normalized_text": "…",
  "alignment_method": "reference_alignment_1_1 | merged_verse (…) | split_verse_reassembled (…) | manual_verified_1_1",
  "confidence": "HIGH | MEDIUM"
}
```

- **`source_id` est un placeholder** : la vraie source (« Kazimirski — Le Koran », `type='quran_translation'`, `license='public_domain'`, provenance Wikisource) devra être **créée dans la table `sources` en Phase 18C**, puis son UUID substitué au placeholder dans l'artefact.
- Vérification d'intégrité de l'artefact : 6 236 lignes · 6 236 ayahs uniques · 114 sourates · champs requis présents · aucun `normalized_text` vide.
- Le schéma `translations` (ayah_id, language, translator, resource_id, text, source_id + contrainte `UNIQUE (ayah_id, resource_id)`) est respecté ; un `resource_id` stable devra être choisi en Phase 18C (aucun conflit avec 31/20/153 existants). **Les 18 708 lignes existantes ne seront pas modifiées.**

## M. Non-régression

| Contrôle | Résultat |
|---|---|
| `npm test` | ✅ 184/184 (14 fichiers) |
| `npx tsc --noEmit` | ✅ 0 erreur |
| `npm run lint` | ✅ 0 erreur, 0 warning |
| `npm run build` | ✅ 0 erreur |
| `npm run verify:persistence` | ✅ 13/13 |
| `npm run verify:rls` | ✅ 27/27 |

| Compteur DB (lecture seule) | Attendu | Constaté |
|---|---|---|
| quran_words | 21 296 | **21 296** ✅ |
| word_occurrences | 77 430 | **77 430** ✅ |
| ayahs | 6 236 | **6 236** ✅ |
| translations | 18 708 | **18 708** ✅ |
| word_translations | 8 | **8** ✅ |
| lemmas | 22 | **22** ✅ |
| sources | 3 | **3** ✅ |
| lemma_translations | 4 | **4** ✅ |

## N. Fichiers produits

- 📄 `PHASE_18B_KAZIMIRSKI_TRANSLATION_ACQUISITION.md` (ce rapport)
- 📦 `tmp/phase18b-kazimirski-translation-alignment.json` (artefact d'import, 6 236 entrées)
- 📊 `tmp/phase18b-alignment2.json` (stats + rapport détaillé par chapitre)
- 📁 `tmp/phase18b-kazimirski-raw/ch-001.html`…`ch-114.html` (HTML source)
- 📋 `tmp/phase18b-kazimirski-manifest.json` (traçabilité + SHA-256)
- 🔧 `tmp/phase18b-align2.ts` (pipeline d'alignement, réexécutable)
- 🔧 `tmp/phase18b-fetch-kazimirski.ts` / `fetch-hikma-ref.ts` / `fetch-hamidullah.ts` (acquisition, lecture seule)

---

**PHASE 18B — IMPORT_READY** · 6 236/6 236 alignés (HIGH 5 812 · MEDIUM 424 · LOW 0 · UNALIGNED 0) · **DATABASE_WRITES = 0** · Prochaine étape : **PHASE 18C — IMPORT CONTRÔLÉ** (création de la source + insertion des 6 236 lignes, uniquement sur décision du propriétaire).
