# PHASE 16M — DOSSIER DE REVUE HUMAINE + LOCALISATION FINALE KAZIMIRSKI 1860

## STATUT

**READ_ONLY** — localisation, vérification documentaire et préparation de revue humaine.

**DECISION: SCAN_VERIFICATION_PARTIAL**

---

## Résumé exécutif

Localisation affinée des 14 unités par **racine + section + tome**, avec références de page pour la revue humaine. **5 unités** ont leur entrée lexicographique localisée par OCR avec bloc français lisible (عَبْد · رَسُول · قَوْم · رَحْمَة · أَرْض) ; **4** ont leur section racine localisée (عَذَاب · نَبِيّ · كِتَاب · كَفَر) ; **5** restent à localiser visuellement (يَوْم · نَاس · فِي · لَا · كَان). **Aucune entrée n'est `SCAN_VERIFIED`** (l'agent n'a pas de vision) ; tous les blocs français sont conservés **bruts**, aucune glose produite, aucune écriture. Statut juridique inchangé : **LEGAL_REVIEW_REQUIRED**.

---

## A. Baseline initiale

quran_words **21 296** · word_occurrences **77 430** · ayahs **6 236** · translations **18 708** · word_translations **8** · lemmas **22** (validated **8** / proposed **14** / rejected **0**) · lemma_id **135** · root **0** · sources **2** · migration **0020** — mesurée, conforme, aucune divergence.

## B. Source utilisée

Kazimirski, *Dictionnaire arabe-français*, édition originale 1860 (Paris — Maisonneuve / Impr. W. Remquet). Canal : University of Toronto / Internet Archive (`dictionnairearab01bibeuoft`, `dictionnairearab02bibeuoft`).

## C. Statut juridique

`possible-copyright-status = NOT_IN_COPYRIGHT` (fait observé, métadonnée IA). **Le statut commercial reste `LEGAL_REVIEW_REQUIRED`** — `NOT_IN_COPYRIGHT` n'est pas interprété comme une licence commerciale confirmée. Aucune source enregistrée en base.

## D. Méthode de localisation

1. `_djvu.xml` découpé par page (`<OBJECT usemap=…_NNNN.djvu>`), texte extrait des `<WORD>` ;
2. `_page_numbers.json` → mapping feuillet → page imprimée ;
3. recherche par **racine/section** (formes sans diacritiques) dans le tome correct (racines أ–ر → tome 1 ; س–ي → tome 2) ;
4. statut documentaire attribué (jamais `SCAN_VERIFIED` : OCR = localisation, pas preuve).

## E. Résultat des 14 recherches

| Statut | Nb | Unités |
|---|---|---|
| **OCR_ONLY** (entrée + bloc FR lisibles) | **5** | عَبْد · رَسُول · قَوْم · رَحْمَة · أَرْض |
| **PARTIAL** (section racine/contexte trouvée) | **4** | عَذَاب · نَبِيّ · كِتَاب · كَفَر |
| **NOT_LOCATED** (vedette non isolée) | **5** | يَوْم · نَاس · فِي · لَا · كَان |
| **SCAN_VERIFIED** | **0** | — (lecture visuelle = humain) |

## F. Pages/scan retrouvés

- عَبْد → tome 2, **p.150-151** (leaf 160-161)
- رَسُول → tome 1, **p.861** (leaf 871)
- قَوْم → tome 2, **p.121** (leaf 131)
- رَحْمَة → tome 1, **p.838** (leaf 848)
- أَرْض → tome 1, **p.25** (leaf 35)
- عَذَاب → tome 2, p.198 (racine عذب) / p.768 / p.1593 (nom)
- نَبِيّ → tome 2, p.104 (contexte)
- كِتَاب → tome 2, **p.858-860** (leaf 868-870, racine ك-ت-ب)
- كَفَر → tome 2, p.914 (leaf 924)

## G. Vérifications visuelles

**0/14** par l'agent (aucune capacité de vision). La lecture de la vedette arabe et du rattachement du bloc français est **déléguée au réviseur humain** (grille jointe, pages référencées, URLs IIIF fournies).

## H. Faux positifs OCR (documentés)

- نَاس → « ناسيس » = **تأسيس** (fondation)
- نَبِيّ → **الكتيبة** (escadron)
- كَان → sous-chaînes **مكان** / **الآن** / **أصل**
- كَفَر → **مكفر** (valet)

## I. Entrées encore non localisées (vedette)

يَوْم · نَاس · فِي · لَا · كَان — à localiser par racine/section + lecture visuelle (sections yāʾ / nūn / fāʾ / lām / kāf du tome 2).

## J. Cas nécessitant un spécialiste

**عَبْد** (esclave/serviteur) · **كِتَاب** (livre/écrit/décret) · **كَان** (copule) · **كَفَر** (couvrir/mécroire). Aucun choix sémantique effectué : source brute conservée, `SPECIALIST_REVIEW_REQUIRED`.

## K. Blocs français bruts retrouvés (sans reformulation)

- عَبْد : « 1. Esclave, opp. à مملوك clave, serf … 2. Serviteur de Dieu, c.-à-d. homme »
- رَسُول : « 1. Envoyé, messager, messagère. — رسول L'envoyé de Dieu, Mahomet. »
- قَوْم : « 3. Peuple, peuplade ; nation … 4. Quelques hommes, quelques gens … »
- رَحْمَة : « 1. Clémence, miséricorde (de Dieu). 2. Pitié, compassion … 3. Grâce, faveur. »
- أَرْض : « 1. Terre, globe terrestre … terre ferme … 3. Terre, pays, contrée. »

## L. Aucune glose pédagogique créée

`pedagogical_gloss = null` pour les 14 unités. Aucune traduction, modernisation, résumé ou sélection de sens.

## M. Aucune écriture DB

Aucun INSERT/UPDATE/DELETE, aucune migration, aucun seed, aucune modification de `lemmas` / `word_translations` / `quran_words` / `sources`. Canal Kazimirski **non** enregistré en base.

## N. Tests (read-only)

| Commande | Résultat |
|---|---|
| npm test | 172/172 ✅ |
| npx tsc --noEmit | 0 erreur ✅ |
| npm run lint | 0 erreur ✅ |
| npm run build | 0 erreur ✅ |
| npm run verify:persistence | 13/13 ✅ |
| npm run verify:rls | 27/27 ✅ |

## O. Non-régression (remesurée en fin de phase)

quran_words **21 296** · word_occurrences **77 430** · ayahs **6 236** · translations **18 708** · word_translations **8** · lemmas **22** (8/14/0) · lemma_id **135** · root **0** · sources **2** · migration **0020** — **identiques à la baseline.** 8 gloses intactes (`is_validated=true`, horodatées).

## P. Limites

1. L'agent ne peut pas lire les images → aucune vérification visuelle effectuée (reportée à l'humain).
2. OCR arabe imparfait → 5 vedettes non isolées par sous-chaîne.
3. Statut juridique commercial non tranché (`LEGAL_REVIEW_REQUIRED`).

## Q. Recommandation Phase 16N

1. **Lecture visuelle humaine** des pages référencées (grille `PHASE_16M_HUMAN_REVIEW_GRID.md`) ;
2. **Revue linguistique spécialisée** pour عَبْد · كِتَاب · كَان · كَفَر ;
3. **Confirmation juridique** du canal (usage commercial d'une transcription du scan U Toronto) ;
4. **Aucun import / aucune validation** tant que 1–3 ne sont pas résolus.

---

## Tableau récapitulatif

| Unité | Localisation | Scan vérifié | Bloc FR | Statut |
|---|---|---|---|---|
| يَوْم | fin tome 2 (yāʾ) | non | — | NOT_LOCATED |
| عَبْد | p.150-151 | non | oui (esclave/serviteur) | OCR_ONLY + spécialiste |
| رَسُول | p.861 | non | oui (envoyé/messager) | OCR_ONLY |
| نَاس | non isolée | non | — | NOT_LOCATED |
| قَوْم | p.121 | non | oui (peuple/nation) | OCR_ONLY |
| عَذَاب | p.198/768/1593 | non | contexte | PARTIAL |
| رَحْمَة | p.838 | non | oui (clémence/miséricorde) | OCR_ONLY |
| نَبِيّ | p.104 (contexte) | non | — | PARTIAL |
| فِي | non isolée | non | — | NOT_LOCATED |
| لَا | non isolée | non | — | NOT_LOCATED |
| أَرْض | p.25 | non | oui (terre/pays) | OCR_ONLY |
| كِتَاب | p.858-860 | non | contexte | PARTIAL + spécialiste |
| كَان | non isolée | non | — | NOT_LOCATED + spécialiste |
| كَفَر | p.914 | non | contexte | PARTIAL + spécialiste |

---

## Livrables

- 📄 `PHASE_16M_HUMAN_REVIEW_DOSSIER_REPORT.md` (ce rapport)
- 📄 `PHASE_16M_HUMAN_REVIEW_GRID.md`
- 📄 `tmp/phase16m-kazimirski-human-review.json` (marqué « DOCUMENTARY ONLY · NOT VALIDATED · NOT IMPORTED · NO DATABASE WRITES »)

---

**SCAN_VERIFICATION_PARTIAL** · **PHASE 16M — ARRÊT OBLIGATOIRE.** Aucune écriture, aucune traduction, aucune glose, aucune validation, aucun import, aucune donnée inventée.
