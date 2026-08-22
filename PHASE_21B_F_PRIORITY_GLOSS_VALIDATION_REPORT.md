# PHASE 21B-F — VALIDATION DES 4 GLOSES PRIORITAIRES

**STATUS FINAL : `PRIORITY_GLOSSES_VALIDATED`**
**VALIDATED = 4 · IMPORTED = 4 · REJECTED = 0 · MIGRATIONS = 0**
**DATABASE_WRITES = 8** (4 INSERT + 4 UPDATE — strictement nécessaires)

---

## 0. RÉSUMÉ

Les 4 gloses `VALIDATE_CANDIDATE` de la Phase 21B-E ont été importées puis
validées (`is_validated = true`) avec provenance éditoriale et double garde.
Le resolver les active désormais : **+198 formes / +2 801 occurrences** résolues
en français (99 → 297 formes).

| lemme | glose | statut |
|---|---|---|
| رَبّ | Seigneur / maître | ✅ validée |
| الله | Allah | ✅ validée |
| الرَّحْمَـٰن | le Tout-Miséricordieux | ✅ validée |
| الْحَمْد | louange | ✅ validée |
| لِلَّه | *(exclu)* | ⚠️ REVIEW_REQUIRED / NON TRAITÉ |

---

## 1. DRY-RUN (avant écriture)

```
[dry-run] رَبّ        → « Seigneur / maître »         (fr, source éditoriale, is_validated=false → true)
[dry-run] الله        → « Allah »                     (fr, source éditoriale, is_validated=false → true)
[dry-run] الرَّحْمَـٰن → « le Tout-Miséricordieux »    (fr, source éditoriale, is_validated=false → true)
[dry-run] الْحَمْد    → « louange »                   (fr, source éditoriale, is_validated=false → true)
```

Confirmé : **4 lemmes · 4 gloses · language=fr · source_id=éditoriale Hikma ·
0 conflit · 0 doublon · 0 autre ligne ciblée.**

---

## 2. LEMMA_ID RÉELS

| lemme | lemma_id |
|---|---|
| رَبّ | `01021c14-2f6b-4ce7-b18b-0c21557c023b` |
| الله | `62b46eb1-9234-4bd3-88b0-0298c25ebe6b` |
| الرَّحْمَـٰن | `6115a3ca-9e39-4cf9-a348-e47b97df5653` |
| الْحَمْد | `b878702b-25de-4ab7-94ef-d8572d6eb380` |

Source de provenance : `79e6412e-e349-4fe5-b29b-108237375a2d` (« Hikma — lexique éditorial »).

---

## 3. LIGNES IMPORTÉES / VALIDÉES

- **Importées** : 4 (aucune n'existait au préalable pour ces 4 lemmes —
  vérifié : 0 ligne `lemma_translations` préexistante).
- **Validées** : 4 (double garde `WHERE id = exact_id AND is_validated = false`,
  puis `is_validated = true` + `validated_at = now()`).
- **Avant** : 14 gloses validées + 4 historiques non validées (Kazimirski 1860).
- **Après** : **18 validées** + **4 historiques non validées** (inchangées).

Aucun autre champ modifié. Aucune glose historique touchée. Aucune des 14 gloses
précédentes modifiée.

---

## 4. COUVERTURE FR AVANT/APRÈS (mesurée sur la base réelle)

| métrique | avant | après | gain |
|---|---|---|---|
| lemmes avec glose FR validée | 14 | **18** | +4 |
| formes résolues FR (union) | 99 | **297** | **+198** |
| occurrences couvertes | 4 219 | **7 020** | **+2 801** |
| formes via `word_lemma_mapping` résolues FR | 0 | **169** | +169 |

- **169 des 171 mappings** SAFE résolvent désormais FR ; les **2 mappings لِلَّه**
  restent EN fallback (لِلَّه exclu, sans glose).
- **Écart honnête vs simulation 21B-E** (~202 formes / ~3 589 occ) : 4 formes
  (`ٱللَّهِ`, `ٱلرَّحْمَـٰنِ`, `ٱلْحَمْدُ`, `رَبِّ`) étaient **déjà** résolues FR via
  la voie FORME (`word_translations`) avant cette phase — elles font partie du
  baseline 99 (la FORME est prioritaire sur le LEMME). Le gain net réel est donc
  **+198 formes / +2 801 occurrences**, pas +202.

---

## 5. EXEMPLES RÉELS (forme mappée → lemme → glose)

| forme | lemma | résolution |
|---|---|---|
| رَّبِّهِمْ | رَبّ | « Seigneur / maître » [fr] ✅ |
| أَبِٱللَّهِ | الله | « Allah » [fr] ✅ |
| بِٱلرَّحْمَـٰنِ ۚ | الرَّحْمَـٰن | « le Tout-Miséricordieux » [fr] ✅ |
| وَٱلْحَمْدُ | الْحَمْد | « louange » [fr] ✅ |
| وَلِلَّهِ | لِلَّه | « And for Allah » [en, fallback] ✅ (exclu, correct) |

---

## 6. VÉRIFICATION DE PRÉCÉDENCE

`FORME > LEMME DIRECT > LEMME VIA MAPPING > EN` confirmée :

- **FORME prioritaire** : `ٱللَّهِ` / `رَبِّ` / `ٱلْحَمْدُ` / `ٱلرَّحْمَـٰنِ` ont
  une `word_translation` (forme) qui reste prioritaire sur la glose de lemme.
- **LEMME DIRECT prioritaire sur MAPPING** : couvert par les tests B (21B-D).
- **MAPPING quand lemma_id NULL** : les 169 formes mappées (lemma_id NULL)
  résolvent via `word_lemma_mapping`.
- **Fallback EN** : intact (لِلَّه et toute forme sans glose).
- **Aucune duplication** : `resolveWordMeanings` retourne une valeur unique.

---

## 7. RLS

`npm run verify:rls` → **33/33** ✅. Aucune politique modifiée. La lecture
publique de `lemma_translations` reste opérante ; les écritures restent réservées
au service role.

---

## 8. IDEMPOTENCE

Seconde exécution du script :
`importées=0, déjà présentes=4, validées=0, déjà validées=4` → **0 insertion,
0 validation, 0 doublon, 0 modification supplémentaire.** ✅

---

## 9. NON-RÉGRESSION

| commande | résultat |
|---|---|
| `npm test` | 221/221 ✅ |
| `npx tsc --noEmit` | 0 ✅ |
| `npm run lint` | 0 ✅ |
| `npm run build` | 0 ✅ |
| `npm run verify:persistence` | 13/13 ✅ |
| `npm run verify:rls` | 33/33 ✅ |

**Compteurs** : quran_words 21 296 (lemma_id **non modifié**) · word_occurrences
77 430 · ayahs 6 236 · translations 24 944 · lemmas 22 · lemma_translations **22**
(18 validées + 4 historiques) · word_translations 8 · word_lemma_mapping **171**
(inchangé, aucun mapping créé/modifié).

---

## 10. ÉTATS NON MODIFIÉS

- **لِلَّه** : `REVIEW_REQUIRED` / **NON TRAITÉ** — 0 ligne `lemma_translations`,
  2 mappings SAFE restent EN fallback.
- **Mappings REVIEW_REQUIRED / REJECTED** : inchangés (0 ligne en base, jamais importés).
- **4 historiques Kazimirski 1860** : `is_validated = false`, intactes.
- **14 gloses déjà validées** : intactes.

---

## 11. ARRÊT OBLIGATOIRE

- ✅ Aucune glose inventée (textes exacts de 21B-E/21B-F).
- ✅ لِلَّه non traité.
- ✅ Aucun mapping modifié.
- ✅ Aucune migration.
- ✅ Aucun élargissement aux 15 autres candidats.
- ⏸️ Pas de poursuite automatique vers 21B-G.

---

## 12. LIVRABLES

- 📄 `PHASE_21B_F_PRIORITY_GLOSS_VALIDATION_REPORT.md` (ce rapport)
- 📄 `tmp/phase21b-f-validation-evidence.json` (`PRIORITY_GLOSSES_VALIDATED`)
- 📄 `scripts/seed-priority-lemma-glosses.ts` (import + validation idempotent, `DRY_RUN=1`)
- 📄 `tmp/phase21b-f-evidence.ts` (mesure AVANT/APRÈS lecture seule)
