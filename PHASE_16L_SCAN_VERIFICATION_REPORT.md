# PHASE 16L — VÉRIFICATION VISUELLE DES 14 ENTRÉES KAZIMIRSKI 1860

## STATUT

**READ_ONLY** — vérification documentaire.

**DECISION: PHASE_16L_PARTIAL — SCAN_VERIFICATION_INCOMPLETE**

---

## Résumé exécutif

La baseline est intacte et le scan Kazimirski 1860 (University of Toronto / Internet Archive) est **accessible** (pages JPEG téléchargeables via IA IIIF — vérifié sur 2 pages test). L'OCR bilingue permet de **localiser** les entrées avec une précision de page (feuillet + page imprimée). En revanche, **la vérification visuelle elle-même ne peut pas être effectuée par l'agent** : celui-ci ne dispose d'aucune capacité de vision pour lire une vedette arabe dans une image de scan. En conséquence, **aucune entrée n'est marquée `SCAN_VERIFIED`** — la règle « l'OCR n'est pas une preuve » est appliquée intégralement. La lecture visuelle (vedette arabe + rattachement du bloc français) est **déléguée à un réviseur humain**, sur la base des pages référencées ci-dessous.

---

## A. Objectif

Vérifier visuellement, contre les scans originaux Kazimirski 1860, les 14 unités `proposed` — sans écrire, sans traduire, sans valider.

## B. Baseline avant (mesurée, lecture seule)

| Mesure | Valeur | Attendu |
|---|---|---|
| quran_words | 21 296 | 21 296 ✅ |
| word_occurrences | 77 430 | 77 430 ✅ |
| ayahs | 6 236 | 6 236 ✅ |
| translations | 18 708 | 18 708 ✅ |
| word_translations | 8 | 8 ✅ |
| lemmas | 22 | 22 ✅ |
| validated / proposed / rejected | 8 / 14 / 0 | 8 / 14 / 0 ✅ |
| lemma_id IS NOT NULL | 135 | 135 ✅ |
| root IS NOT NULL | 0 | 0 ✅ |
| sources | 2 | 2 ✅ |
| dernière migration | 0020 | 0020 ✅ |

Aucune divergence.

## C. Source documentaire utilisée

- **Titre** : *Dictionnaire arabe-français contenant toutes les racines de la langue arabe* (édition originale 1860, Paris — Maisonneuve / Impr. W. Remquet).
- **Canal** : University of Toronto / Robarts — Internet Archive (`dictionnairearab01bibeuoft`, `dictionnairearab02bibeuoft`).
- **Preuves d'édition** (page de titre OCR) : « DICTIONNAIRE ARABE-FRANCAIS … PAR A. DE BIBERSTEIN KAZIMIRSKI … TOME PREMIER … 1860 ».
- **Accès au scan** : `iiif.archive.org` → JPEG valides (test : tome 2 feuillet 160 = 274×457 JPEG ; tome 1 feuillet 35 = 396×658 JPEG).

## D. Méthode de localisation

1. `_djvu.xml` (59 Mo tome 1 / 68 Mo tome 2) découpé en 1 408 pages (tome 1), texte extrait des `<WORD>` ;
2. `_page_numbers.json` → mapping feuillet → page imprimée ;
3. recherche des 14 vedettes (formes sans diacritiques) par page ;
4. **statut documentaire attribué, jamais `SCAN_VERIFIED`** (l'agent ne peut pas lire l'image).

## E. Résultat des 14 unités

| Unité | Tome | Feuillet / Page | Statut | Confiance |
|---|---|---|---|---|
| يَوْم | 2 | 277 / p.267 (contexte) | SCAN_PARTIAL | LOW |
| عَبْد | 2 | 160-161 / p.150-151 | SCAN_PARTIAL | HIGH |
| رَسُول | 1 | 871 / p.861 | SCAN_PARTIAL | HIGH |
| نَاس | — | faux positif 41/p.31 (تأسيس) | OCR_FALSE_POSITIVE | LOW |
| قَوْم | 1 | 61 / p.51 (contexte « tribu ») | SCAN_PARTIAL | LOW |
| عَذَاب | 2 | 778/p.768, 1603/p.1593 (contexte) | SCAN_PARTIAL | LOW |
| رَحْمَة | 1 | 848 / p.838 | SCAN_PARTIAL | HIGH |
| نَبِيّ | 2 | 114 / p.104 (contexte) | SCAN_PARTIAL | LOW |
| فِي | — | — | SCAN_NOT_FOUND | LOW |
| لَا | — | — | SCAN_NOT_FOUND | LOW |
| أَرْض | 1 | 35 / p.25 | SCAN_PARTIAL | HIGH |
| كِتَاب | 1 | 61 / p.51 (contexte « أم الكتاب ») | SCAN_PARTIAL | LOW |
| كَان | — | faux positifs (أصل/الآن/مكان) | OCR_FALSE_POSITIVE | LOW |
| كَفَر | 2 | 924 / p.914 (bloc ك-ف-ر) | SCAN_PARTIAL | MEDIUM |

## F. Preuves visuelles disponibles

- Scan accessible (JPEG via IA IIIF) : **OUI**.
- Lecture visuelle par l'agent : **NON** (aucune capacité de vision). → **0/14 `SCAN_VERIFIED`**.
- Références de pages **fournies pour un réviseur humain**.

## G. Faux positifs OCR (documentés)

- نَاس → « ناسيس » = **تأسيس** (fondation).
- نَبِيّ → **الكتيبة** (escadron).
- كَان → sous-chaînes **أصل** (racine), **الآن** (maintenant), **مكان** (lieu).
- كَفَر → **مكفر** (valet) ; عَبْد → **عين** (œil) signalé en phase 16J.

## H. Entrées SCAN_VERIFIED

**0.** (Aucune — vérification visuelle impossible pour l'agent.)

## I. Entrées SCAN_PARTIAL

**10** : يَوْم · عَبْد · رَسُول · قَوْم · عَذَاب · رَحْمَة · نَبِيّ · أَرْض · كِتَاب · كَفَر. Blocs français OCRisés lisibles pour عَبْد, رَسُول, رَحْمَة, أَرْض.

## J. Entrées SCAN_NOT_FOUND

**2** : فِي · لَا (particules ultra-fréquentes, vedette non isolable par sous-chaîne).

## K. Entrées OCR_FALSE_POSITIVE

**2** : نَاس · كَان (les hits OCR sont d'autres mots : تأسيس / أصل / الآن / مكان).

## L. Entrées SPECIALIST_REVIEW_REQUIRED

**4** : عَبْد (esclave/serviteur) · كِتَاب (livre/écrit/décret) · كَان (copule) · كَفَر (couvrir/mécroire). Aucune décision sémantique prise ici.

## M. Texte français brut extrait (sans reformulation)

- عَبْد : « 1. Esclave, opp. à مملوك clave, serf … 2. Serviteur de Dieu, c.-à-d. homme »
- رَسُول : « 1. Envoyé, messager, messagère. — رسول L'envoyé de Dieu, Mahomet. »
- رَحْمَة : « 1. Clémence, miséricorde (de Dieu). 2. Pitié, compassion … 3. Grâce, faveur. »
- أَرْض : « 1. Terre, globe terrestre … terre ferme … 3. Terre, pays, contrée. »

`pedagogical_gloss` reste **null** pour les 14 unités.

## N. Ce qui reste à faire

1. **Lecture visuelle humaine** des pages référencées (vedette arabe + rattachement du bloc FR) ;
2. localisation ciblée (par racine) des vedettes non isolées : يَوْم · نَاس · قَوْم · عَذَاب · نَبِيّ · فِي · لَا · كِتَاب · كَان ;
3. confirmation juridique du canal (Phase 16J : `LEGAL_REVIEW_REQUIRED`) ;
4. revue linguistique spécialisée pour عَبْد · كِتَاب · كَان · كَفَر.

## O. Contrôle des 8 gloses protégées

8/8 **intactes** : « la louange · Allah · le Tout Miséricordieux · des mondes · au nom de · à/pour Allah · le Très Miséricordieux · Seigneur » — toutes `is_validated=true`, `validated_at` horodaté. **Aucune modification.**

## P. Contrôle root / POS / morphologie

- `quran_words.root IS NOT NULL = 0` ✅ (inchangé).
- Aucune colonne POS, aucune donnée morphologique, aucun QuranMorph, aucun Qabas.

## Q. Contrôle des sources

`sources = 2` ✅. Aucune source créée. Le canal Kazimirski **n'est pas** enregistré en base. Statut juridique : `LEGAL_REVIEW_REQUIRED` (inchangé).

## R. Tests

Aucun code produit modifié → pas de nouveau test artificiel. Non-régression constatée par remesure (section S) et exécution des suites existantes :

| Commande | Résultat |
|---|---|
| npm test | 172/172 ✅ |
| npx tsc --noEmit | 0 erreur ✅ |
| npm run lint | 0 erreur ✅ |
| npm run build | 0 erreur ✅ |
| npm run verify:persistence | 13/13 ✅ |
| npm run verify:rls | 27/27 ✅ |

## S. Non-régression (remesurée en fin de phase)

quran_words **21 296** · word_occurrences **77 430** · ayahs **6 236** · translations **18 708** · word_translations **8** · lemmas **22** (8/14/0) · lemma_id **135** · root **0** · sources **2** · migration **0020** — **identiques à la baseline.** 8 gloses et 14 `proposed` inchangées.

## T. Décision de phase suivante

**PHASE_16L_PARTIAL — SCAN_VERIFICATION_INCOMPLETE.** La vérification visuelle requiert un **réviseur humain** (l'agent ne peut pas lire les images). Prochaine étape proposée (décidée séparément) : fournir à l'humain les pages référencées pour la lecture visuelle, puis revue linguistique, sans import tant que le canal n'est pas juridiquement confirmé.

---

## Livrables

- 📄 `PHASE_16L_SCAN_VERIFICATION_REPORT.md` (ce rapport)
- 📄 `tmp/phase16l-kazimirski-scan-verification.json` (marqué « DOCUMENTARY ONLY · NOT VALIDATED · NOT IMPORTED · NO DATABASE WRITES »)

---

**PHASE_16L_PARTIAL — SCAN_VERIFICATION_INCOMPLETE** · **PHASE 16L — ARRÊT OBLIGATOIRE.** Aucune écriture, aucune traduction, aucune glose, aucune validation, aucun import, aucune donnée inventée.
