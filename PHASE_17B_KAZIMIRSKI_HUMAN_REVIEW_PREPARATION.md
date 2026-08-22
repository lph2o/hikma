# PHASE 17B — PRÉPARATION FINALE DES 14 ENTRÉES KAZIMIRSKI AVANT IMPORT

## STATUT

**PHASE 17B** · **PREPARATION_ONLY**

**DECISION : LEGAL_GO (décision opérationnelle du propriétaire du projet — non un avis juridique)**
**DATABASE_WRITES : 0** · **IMPORTS : 0** · **MIGRATIONS : 0**

---

## A. Décision opérationnelle

| Champ | Valeur |
|---|---|
| DECISION | `LEGAL_GO` |
| DECISION_SOURCE | `PROJECT_OWNER` |
| DATE | 2026-08-14 |
| SCOPE | utilisation commerciale prévue de la transcription Kazimirski 1860 |
| STATUS | `PROJECT_AUTHORIZATION` |

> « Décision opérationnelle du propriétaire du projet. » Elle **n'est pas** présentée comme provenant de U Toronto, Internet Archive, Maisonneuve, Kazimirski ou d'un professionnel du droit. Elle ne modifie **pas** les preuves historiques des phases 16P/16Q/16R (qui restent `LEGAL_REVIEW_REQUIRED` au niveau documentaire). Elle autorise la poursuite du pipeline technique.

---

## B. Mapping word_id (déterminé automatiquement, lecture seule)

**Résultat décisif** : `word_translations` est indexée sur **`quran_words.id`** (`word_id`), **PAS** sur `lemma`. Le schéma n'a **pas** de colonne `lemma_id` sur `word_translations`. Une glose Kazimirski décrit un **lemme**, qui correspond à **plusieurs formes fléchies** dans `quran_words`.

| Statut de mapping | Nombre | Unités |
|---|---|---|
| **UNIQUE** (1 seule forme liée) | 2 | فِي → `فِى` · كَان → `كَانَ` |
| **MULTIPLE** (plusieurs formes liées) | 12 | يَوْم(10) · عَبْد(3) · رَسُول(13) · نَاس(7) · قَوْم(8) · عَذَاب(7) · رَحْمَة(11) · نَبِيّ(4) · لَا(3) · أَرْض(10) · كِتَاب(10) · كَفَر(3) |
| **ABSENT** | 0 | — |

**Constat déterministe** : **0 word_id sélectionné automatiquement.** Aucun choix canonique n'est possible sans décision humaine, pour deux raisons indépendantes :

1. **12/14 lemmes** ont plusieurs formes liées (le lemme regroupe les flexions) → aucun `word_id` « canonique » unique.
2. Même les 2 cas « UNIQUE » sont trompeurs : la forme liée (`فِى`, `كَانَ`) **diffère** de la vedette du lemme (`فِي`, `كَان`), et le chaînage `lemma_id` est **sous-renseigné** (فِي et كَان apparaissent des centaines de fois dans le corpus mais n'ont qu'1 seule forme liée). Seule **لَا** possède une forme liée strictement identique au lemme (parmi 3 formes).

→ **`lemma_id ≠ quran_words.id`** : le rattachement d'une glose de lemme à un `word_id` est un **choix produit** (quel forme = forme de citation ?), pas une donnée extractible.

### Deux options de conception (à trancher par le propriétaire, pas par l'agent)

- **Option 1** : ajouter une colonne `word_translations.lemma_id` (migration) pour attacher la glose au **lemme** — aligné sur la nature de Kazimirski (glose de lemme). *Nécessite une migration, donc décision explicite.*
- **Option 2** : rester sur `word_id` et choisir, par lemme, **une forme de citation** (ex. nominatif indéfini `يَوْمٌ`, `كِتَابٌ`, `رَسُولٌ`) comme cible. *Nécessite une décision linguistique par lemme.*

Aucune des deux n'est appliquée ici (aucune migration, aucun choix arbitraire).

---

## C. Localisation des pages (candidates, non vérifiées)

| Groupe | Nombre | Unités |
|---|---|---|
| **Page épinglée** (candidate OCR/racine) | 9 | عَبْد (t2 p.150-151) · رَسُول (t1 p.861) · قَوْم (t2 p.121) · عَذَاب (t2 p.198/768/1593) · رَحْمَة (t1 p.838) · نَبِيّ (t2 p.104) · أَرْض (t1 p.25) · كِتَاب (t2 p.858-860) · كَفَر (t2 p.914) |
| **Section seulement** (page non épinglée) | 5 | يَوْم (section ي) · نَاس (section ن) · فِي (section ف) · لَا (section ل) · كَان (section ك) |

Confiance : **LOW** partout — localisation par racine/OCR, **jamais vérifiée contre l'image de page**. `PAGE_STATUS = NOT_LOCATED` pour les 5 « section only ».

---

## D. État OCR

| Statut | Nombre | Unités |
|---|---|---|
| OCR_ONLY (bloc FR lisible) | 4 | عَبْد · رَحْمَة · أَرْض · لَا |
| PARTIAL (contexte FR attesté, vedette à isoler) | 5 | رَسُول · قَوْم · عَذَاب · نَبِيّ · فِي |
| NOT_LOCATED (vedette non isolée / faux positifs) | 5 | يَوْم · نَاس · كِتَاب · كَان · كَفَر |

Faux positifs documentés (jamais promus en correspondance) : نَاس→تأسيس · نَبِيّ→الكتيبة · كَان→مكان/الآن/أصل · كَفَر→مكفر · عَبْد→عين.

---

## E. État scan

**SCAN_VERIFIED : 0/14.** La lecture visuelle est une opération humaine (l'agent n'a pas de vision). `OCR ≠ preuve`. Toutes les entrées restent `PENDING`.

---

## F. État des gloses

**0 glose produite.** `pedagogical_gloss = null` pour les 14 unités. **Aucune suggestion IA fournie** : le projet n'autorise pas les gloses générées comme autorité (règle maintenue des phases 16A→16P). La formulation de la glose est **à saisir par un humain**, à partir du texte source brut Kazimirski (disponible dans `tmp/phase16k-kazimirski-extraction.json`).

---

## G. État revue linguistique

**0 revue effectuée.** `linguistic_review = PENDING` pour les 14. **SPECIALIST_REVIEW_REQUIRED** pour : عَبْد · كِتَاب · كَان · كَفَر (polysémie) + فِي · لَا · كَان (unités grammaticales — pas de « glose canonique »). Le propriétaire **ne certifie pas** la correction linguistique.

---

## H. Éléments nécessitant intervention humaine (liste exacte)

Par entrée (×14) :
1. **Vérifier visuellement** la page du scan (image IIIF/JP2).
2. **Confirmer la vedette** arabe (lecture, pas l'OCR).
3. **Formuler la glose** française courte (depuis le texte source brut).
4. **Vérifier linguistiquement** la glose (REVIEWER/LINGUISTE QUALIFIÉ).
5. **Confirmer le `word_id`** (ou valider l'Option 1/2 de conception).
6. **Autoriser l'import**.

Globalement :
7. **Décision de conception** : attacher la glose au **lemme** (migration `lemma_id`) ou à une **forme de citation** (choix par lemme).
8. **Confirmation juridique documentée** (si le propriétaire souhaite une trace formelle au-delà de sa décision opérationnelle).

---

## I. Éléments entièrement automatisables (déjà faits)

- Mapping `lemma → lemma_id` : **14/14 résolus**.
- Énumération des `candidate_word_ids` : **14/14** (96 formes candidates listées).
- Statut UNIQUE/MULTIPLE/ABSENT : **déterminé** (2 UNIQUE, 12 MULTIPLE, 0 ABSENT).
- Pages candidates (racine/OCR) : **9 épinglées, 5 section-only**.
- Génération des dossiers humains (JSON + MD) : **faite**.
- Tests de non-régression : **verts**.

---

## J. État du seed existant

`scripts/seed-word-translations.ts` est **partiellement réutilisable** :
- ✅ **Réutilisable** : mécanisme idempotent (`INSERT … ON CONFLICT (word_id, language, source_id) DO NOTHING`), insertion `is_validated = false`, résolution de la source.
- ❌ **Non réutilisable tel quel** : il résout les `word_id` via **`lesson_words`** (curriculum), qui **ne couvre pas** les 14 lemmes `proposed`. Un nouveau module de résolution **`lemma → word_id canonique`** est requis (dépend de la décision H.7).

---

## K. Tests

`npm test` **172/172** · `tsc --noEmit` **0** · `lint` **0** · `build` **0** · `verify:persistence` **13/13** · `verify:rls` **27/27**.

## L. Non-régression

Baseline inchangée (aucune écriture) : quran_words **21 296** · occurrences **77 430** · ayahs **6 236** · translations **18 708** · word_translations **8** · lemmas **22** (8/14/0) · lemma_id **135** · root **0** · sources **2** · migration **0020** · 8 gloses intactes.

## M. Prochaine action exacte

1. Le propriétaire tranche la **conception** (H.7) : glose attachée au lemme (migration) ou à une forme de citation.
2. Un **réviseur humain** remplit le dossier `tmp/phase17b-kazimirski-human-review.md` (14 dossiers + cases).
3. Une fois gloses + `word_id` + revue + scan fournis : exécuter l'import idempotent (dry-run puis écriture) dans une **phase 17C distincte**.

---

## Livrables

- 📄 `PHASE_17B_KAZIMIRSKI_HUMAN_REVIEW_PREPARATION.md` (ce rapport)
- 📄 `tmp/phase17b-kazimirski-human-review.md` (14 dossiers humains, cases **PENDING**)
- 📄 `tmp/phase17b-kazimirski-human-review.json` (structure adaptée au schéma réel, marquée « DOCUMENTARY ONLY · NOT VALIDATED · NOT IMPORTED · NO DATABASE WRITES »)

---

**PHASE 17B — PREPARATION_ONLY** · **DATABASE_WRITES: 0** · **IMPORTS: 0** · **MIGRATIONS: 0** · **ARRÊT OBLIGATOIRE.**
