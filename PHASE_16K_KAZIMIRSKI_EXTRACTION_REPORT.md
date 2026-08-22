# PHASE 16K — EXTRACTION LEXICALE PILOTE KAZIMIRSKI 1860

## STATUT

**READ_ONLY** — extraction documentaire brute uniquement.

---

## A. Baseline (mesurée, identique début/fin)

| Mesure | Valeur | Attendu | Statut |
|---|---|---|---|
| quran_words | **21 296** | 21 296 | ✅ |
| word_occurrences | **77 430** | 77 430 | ✅ |
| ayahs | **6 236** | 6 236 | ✅ |
| translations | **18 708** | 18 708 | ✅ |
| word_translations | **8** | 8 | ✅ |
| lemmas | **22** | 22 | ✅ |
| validated | **8** | 8 | ✅ |
| proposed | **14** | 14 | ✅ |
| rejected | **0** | 0 | ✅ |
| lemma_id renseigné | **135** | 135 | ✅ |
| root renseigné | **0** | 0 | ✅ |
| sources | **2** | 2 | ✅ |
| dernière migration | **0020** | 0020 | ✅ |

Aucune divergence. Pas de `BASELINE_DRIFT`.

---

## B. Objectif

À partir du canal Kazimirski 1860 / University of Toronto (audité en Phase 16J), préparer les données lexicales **brutes** des 14 unités `proposed` — sans traduire, sans glose pédagogique, sans validation, sans écriture.

---

## C. Source unique

- **Titre** : *Dictionnaire arabe-français contenant toutes les racines de la langue arabe*
- **Auteur** : A. de Biberstein Kazimirski (1808–1887)
- **Édition** : originale, 1860 (Paris — Maisonneuve / Imprimerie de W. Remquet)
- **Canal** : University of Toronto / Internet Archive
  - Tome 1 : `dictionnairearab01bibeuoft`
  - Tome 2 : `dictionnairearab02bibeuoft`
- **OCR** : `_djvu.txt` (tesseract, bilingue `fra+ara`)

Aucune autre source n'a été utilisée (ni BnF 1960, ni kazimirski.online, ni Quran.com, ni Wikidata, ni Wiktionnaire, ni QuranMorph, ni Qabas, ni Hamidullah).

---

## D. Méthode de localisation

1. Recherche documentaire par **racine** (`search_root`, marquée `temporary_search_metadata: true`) — jamais par sous-chaîne OCR seule.
2. Extraction du **texte OCR brut** (`ocr_raw`) du bloc candidat.
3. Repérage du **bloc français** associé (`french_source_text`) lorsque lisible.
4. Statut de localisation par entrée : `IDENTIFIED_IN_OCR` / `PARTIAL` / `REVIEW_REQUIRED`.

**Règle respectée (§5, §9)** : aucune correction silencieuse de l'OCR, aucune traduction, aucune normalisation en glose.

---

## E. Résultats d'extraction (14 entrées)

Statut de localisation :

| Groupe | Nombre | Unités |
|---|---|---|
| **IDENTIFIED_IN_OCR** (bloc FR lisible) | **4** | عَبْد · رَحْمَة · أَرْض · لَا |
| **PARTIAL** (contexte attesté, entrée à isoler) | **5** | رَسُول · قَوْم · عَذَاب · نَبِيّ · فِي |
| **REVIEW_REQUIRED** (entrée non isolée / faux positifs) | **5** | يَوْم · نَاس · كِتَاب · كَان · كَفَر |

Détail des blocs français extraits **sans traduction** (documentaires uniquement) :

| Unité | Tome | Bloc français OCR (extrait, non corrigé) |
|---|---|---|
| عَبْد | 2 | « 1. Esclave, opp. à مملوك clave, serf … 2. Serviteur de Dieu, c.-à-d. homme » |
| رَسُول | 1 | « … Le successeur de l'envoyé de Dieu » (contexte ; entrée à isoler) |
| قَوْم | 2 | « Mère de la tribu … » (contexte « tribu » ; entrée à isoler) |
| عَذَاب | 2 | « … tourments … châtiment du feu » (contexte ; entrée à isoler) |
| رَحْمَة | 1 | « 1. Clémence, miséricorde (de Dieu). 2. Pitié, compassion … 3. Grâce, faveur. » |
| نَبِيّ | 2 | « Le prophète (Mahomet) … » (contexte ; entrée à isoler) |
| فِي | 2 | « Préposition de temps ou de lieu. » (note grammaticale ; entrée à isoler) |
| لَا | 2 | « Non, ne, particule négative, exige que le verbe … au futur apocopé. » |
| أَرْض | 1 | « 1. Terre, globe terrestre … 3. Terre, pays, contrée. » |

Entrées **non isolées** (faux positifs démontrés en Phase 16J, confirmés ici) : يَوْم · نَاس · كِتَاب · كَان · كَفَر → `REVIEW_REQUIRED`.

---

## F. Contrôle OCR

- **Français** : lisible, exploitable pour les blocs identifiés.
- **Vedettes arabes** : imparfaites ; la localisation par sous-chaîne produit des faux positifs (نَاس→تأسيس, نَبِيّ→الكتيبة, كَان→sous-chaîne, كَفَر→مكفر, عَبْد→عين).
- **Conclusion** : la localisation doit se faire **par racine + vérification contre le scan (image de page)**. L'OCR seul est insuffisant pour 5/14 entrées.

---

## G. Vérification contre le scan

- **SCAN_VERIFIED** : **0 / 14**
- **SCAN_PARTIALLY_VERIFIED** : 0 / 14
- **SCAN_NOT_VERIFIED** : **14 / 14**

Aucune entrée n'est déclarée exploitable à ce stade : la vérification visuelle contre l'image de page n'a pas été réalisée (aucune confiance aveugle dans l'OCR).

---

## H. Traduction / gloses

**Aucune glose produite. Aucune traduction. Aucune adaptation éditoriale.**

- `pedagogical_gloss` : **null** pour les 14 entrées.
- `french_source_text` : texte Kazimirski brut uniquement (jamais reformulé).
- Aucun contenu IA/LLM/MT n'a été utilisé comme source.

---

## I. Provenance future (modèle documentaire — aucune écriture)

Pour chaque future fiche lexicale, conserver au minimum :

```
source_name          : Kazimirski
source_type          : historical_dictionary
source_reference     : Kazimirski 1860 — University of Toronto / Internet Archive
source_version       : édition 1860 / tome concerné
source_license_status: statut établi en Phase 16J (LEGAL_REVIEW_REQUIRED)
retrieved_at         : date de récupération
editorial_note       : renseignée lors de la revue linguistique
page_reference       : page imprimée / identifiant de page du scan
```

Le schéma actuel (`sources` + `word_translations.source_id` NOT NULL + `editorial_notes`) couvre déjà cette provenance ; aucune migration n'est requise.

---

## J. Risques

| Risque | Niveau | Conséquence |
|---|---|---|
| OCR arabe imparfait | ÉLEVÉ | 5/14 entrées non isolées ; risque de mauvaise association vedette↔définition |
| Vérification scan non faite | ÉLEVÉ | aucune entrée exploitable tant que non vérifiée visuellement |
| Statut commercial du scan U Toronto | JURIDIQUE | `LEGAL_REVIEW_REQUIRED` (Phase 16J) — aucun import avant confirmation |
| Polysémie (عَبْد, كِتَاب, كَان, كَفَر) | LINGUISTIQUE | revue spécialisée obligatoire, jamais le propriétaire |

---

## K. Décision / Conclusion

**EXTRACTION_PARTIAL — SCAN_REQUIRED**

- 4/14 entrées localisées avec bloc FR lisible, **mais aucune vérifiée contre le scan**.
- 5/14 en contexte partiel, 5/14 non localisées.
- **Aucune glose produite, aucune donnée écrite, aucun statut modifié.**

L'extraction documentaire de cette phase est **partielle par conception** : la localisation définitive exige la vérification visuelle contre les images de page (jamais l'OCR seul).

---

## L. Preuve de non-écriture / non-régression

- Aucune migration créée (dernière = **0020**).
- Aucun seed, aucun script d'import persistant (script de vérification supprimé après usage).
- Baseline identique début/fin (section A).
- Les 8 gloses validées et les 14 unités `proposed` **strictement inchangées**.
- Aucun root, aucun POS, aucune morphologie, aucun QuranMorph, aucun Qabas, aucune donnée inventée.

---

## Livrables

- 📄 `PHASE_16K_KAZIMIRSKI_EXTRACTION_REPORT.md` (ce rapport)
- 📄 `tmp/phase16k-kazimirski-extraction.json` (marqué « DOCUMENTARY ONLY · NOT VALIDATED · NOT IMPORTED · NO DATABASE WRITES »)

---

**PHASE 16K — ARRÊT OBLIGATOIRE.** Aucune écriture, aucune traduction, aucune glose, aucun import. La suite (revue linguistique puis éventuel import) reste conditionnée à la confirmation juridique du canal (Phase 16J) **et** à la vérification visuelle des entrées contre le scan.
