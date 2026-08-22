# PHASE 16C — RAPPORT FINAL (Extraction & préparation éditoriale Kazimirski)

> **PROPOSAL ONLY — aucune donnée écrite en base. Aucune signification validée.**
> Aucune racine/POS/morphologie, aucun QuranMorph/Qabas, aucune signification inventée.

## A. Baseline vérifiée (avant tout travail)

Mesure réelle (PostgREST, lecture seule) :

| Champ | Valeur | Attendu | Statut |
|---|---|---|---|
| lemmas | 22 | 22 | ✅ |
| validated | 8 | 8 | ✅ |
| proposed | 14 | 14 | ✅ |
| rejected | 0 | 0 | ✅ |
| quran_words.lemma_id renseigné | 135 | 135 | ✅ |
| quran_words.root renseigné | 0 | 0 | ✅ |
| word_translations | 8 | 8 | ✅ |
| sources | 2 | 2 | ✅ |

Aucune divergence → pas de STOP sur la baseline. Les 8 gloses Phase 7 sont intactes.

## B. Source exacte

| Élément | Valeur |
|---|---|
| Titre | *Dictionnaire arabe-français* |
| Auteur | A. de Biberstein Kazimirski |
| Année | 1860 (Paris, Maisonneuve et Cie) |
| Statut de l'œuvre | Domaine public (auteur décédé en 1887) |
| Copie numérique évaluée | Internet Archive `le-kazimirski-dictionnaire-arabe-francais-tome-1` |
| Fichiers | `..._djvu.txt` (Tome 1 & 2) + `..._hocr_searchtext.txt` |
| OCR | tesseract 4.1.1, paramètre `-l ara`, script détecté **Latin** (conf 0.9961) |
| Accès | 2026-08-14 |

## C. Licence / provenance

- **Œuvre originale** : domaine public (établi).
- **Copie numérique archive.org** : upload utilisateur (pas d'éditeur institutionnel), **aucun champ `licenseurl`/`rights`/Public Domain Mark** dans les métadonnées → **LICENSE_UNKNOWN**.
- **`kazimirski.online`** (J. Sypiański) : édition numérique **nouvelle** établie par un auteur vivant, extraite « au moyen de modèles de langue » ; aucune licence de données ouverte publiée → **LICENSE_UNKNOWN**, non réutilisable sans autorisation (et contournée par §2 : pas de source générée par modèle de langue comme autorité).
- **`opendata.uni-halle.de`** (record 1981185920/100210) : conversion PDF/A d'un scan, pas de transcription structurée ouverte.
- **`dictionnairearab02bibeuoft`** (Univ. Toronto) : `possible-copyright-status = NOT_IN_COPYRIGHT`, mais scan sans transcription texte propre vérifiée.

→ **Aucune copie numérique à la fois (a) explicitement licenciée/PD et (b) dotée d'un texte machine exploitable n'est accessible dans cet environnement.**

## D. Méthode d'extraction

1. Téléchargement des `_djvu.txt` Tome 1 & 2 (et `_hocr_searchtext.txt` Tome 1) dans `/tmp/hikma-kazimirski`.
2. Calcul des empreintes SHA-256 :
   - Tome 1 : `3ad6fba21ae04c1358ee4d02ce19749b1204dd2f335e20431e2233a90fa9da4d`
   - Tome 2 : `8ba069302ed5eb50af4338afb9dc8c57f4f1cd3f495a17d9839c140d1ff576b6`
3. Recherche des 14 entrées par racine/forme.

## E. Contrôle OCR — ÉCHEC (STOP_DATA_QUALITY)

L'OCR est **inutilisable** pour extraire les gloses françaises :

- Le texte arabe et le texte français sont corrompus (mélange de chiffres, inversion RTL/LTR, caractères parasites).
- Exemple concret (entrée `يَوْم`) : `يوم : 0 :1 01 .(نعسم 0 11110111116` — aucune glose FR lisible.
- Le mot français « jour » n'est récupérable nulle part dans le texte OCR.
- Cause : modèle OCR arabe (`-l ara`) appliqué à un dictionnaire bilingue majoritairement en caractères latins.

Conformément à §5 (« aucune confiance aveugle dans l'OCR ») et §19.3 (« OCR trop incertain ») → **STOP**.

## F. 14 fiches (toutes REVIEW_REQUIRED)

**0 entrée retrouvée. 14 fiches marquées `REVIEW_REQUIRED`** (aucune glose FR n'a pu être établie depuis Kazimirski ; aucune glose inventée en remplacement).

| # | Unité | Lemma (id tronqué) | Décision |
|---|---|---|---|
| 1 | يَوْم | aadb9c24… | REVIEW_REQUIRED |
| 2 | عَبْد | 77747cb5… | REVIEW_REQUIRED |
| 3 | رَسُول | 6449da99… | REVIEW_REQUIRED |
| 4 | نَاس | d8d52703… | REVIEW_REQUIRED |
| 5 | قَوْم | f706fd3c… | REVIEW_REQUIRED |
| 6 | عَذَاب | 04ef3735… | REVIEW_REQUIRED |
| 7 | رَحْمَة | bfa97e6e… | REVIEW_REQUIRED |
| 8 | نَبِيّ | aa87a728… | REVIEW_REQUIRED |
| 9 | فِي | e34c8427… | REVIEW_REQUIRED |
| 10 | لَا | 1c991295… | REVIEW_REQUIRED |
| 11 | أَرْض | 2ccaa3d6… | REVIEW_REQUIRED |
| 12 | كِتَاب | 7a4f0fe4… | REVIEW_REQUIRED |
| 13 | كَان | 903ca0ff… | REVIEW_REQUIRED |
| 14 | كَفَر | 20ad9d00… | REVIEW_REQUIRED |

Détail complet : `tmp/phase16c-kazimirski-proposals.json` (marqué « PROPOSAL ONLY — NOT VALIDATED — NOT IMPORTED »).

## G. Ambiguïtés

1. Licence de la copie numérique non établie (archive.org upload utilisateur sans PD Mark).
2. OCR bilingue inutilisable.
3. Cas déjà connus à conserver séparés : عَبْد (serviteur/esclave), كِتَاب (livre/écrit/prescription), كَان (copule), كَفَر (mécroire/renier).

## H. Risques

- Toute glose produite depuis cet OCR serait **fausse ou invérifiable** → interdite.
- `kazimirski.online` est une édition nouvelle (auteur vivant + modèles de langue), licence inconnue → non utilisable.

## I. Décisions recommandées

1. **STOP_DATA_QUALITY** (primaire) : aucune source machine exploitable n'a pu être obtenue.
2. **STOP_SOURCE** (co-déclencheur) : aucune copie numérique à licence suffisamment claire n'est accessible.
3. Prochaine action (hors périmètre de cette phase) : obtenir une copie Kazimirski **explicitement PD/licenciée avec texte propre** (ex. transcription TEI institutionnelle ou scan Gallica/BnF à re-OCRiser et relire entrée par entrée), ou une licence écrite.

## J. Résumé final

- **0 / 14** entrée Kazimirski extraite avec confiance suffisante.
- **14 / 14** fiches `REVIEW_REQUIRED`, glose FR = `null`, aucune donnée inventée.
- **Aucune écriture en base** (lemmas, word_translations, quran_words, sources inchangés).
- Baseline finale identique à la baseline initiale (22/8/14/0 · lemma_id 135 · root 0 · word_translations 8 · sources 2).

## Conclusion (§21)

**STOP_DATA_QUALITY** — (co-déclencheur **STOP_SOURCE**).

⏸️ **PHASE 16C — ARRÊT OBLIGATOIRE.** Aucune signification validée, aucun `proposed → validated`, aucune migration, aucune modification de lemmas/word_translations/quran_words, aucune racine/POS/morphologie, aucun QuranMorph/Qabas, aucune donnée inventée. Les 8 gloses existantes restent strictement intactes.
