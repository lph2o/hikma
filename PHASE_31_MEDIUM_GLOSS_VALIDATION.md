# PHASE 31 — Validation éditoriale des 87 gloses FR MEDIUM & ouverture des sourates

> `FATIHAH_REFERENCE_LOCKED = TRUE` — conservé.
> MASAQ n'est **jamais** une condition de disponibilité : la readiness d'une sourate
> est pilotée par sa couverture **lexicale française** uniquement.

---

## 1. État avant phase

- `word_translations = 177` (103 gloses HIGH importées en Phase 30).
- 87 formes MEDIUM en fallback EN (`frResolved = 0`, `enFallback = 87`).
- Catalogue : 5 sourates READY + 10 « en préparation ».

## 2. Les 87 propositions MEDIUM

Dossier d'évidence : `tmp/phase30-medium-review.md` (forme, translittération,
`meaning_en`, référence `sourate:ayah`, traduction Hamidullah en contexte,
proposition FR). Chaque fiche a été revue contre les règles lexicales Phase 31
(R1 priorité données validées, R3 verbes, R4 particules, R5 polysémie, R6 hapax,
R7 clitiques, R9 pas de fallback silencieux, R10 pas de glose inventée).

## 3. Décisions

| Décision | Nombre | Import |
|---|---:|---|
| **ACCEPT** | 81 | oui |
| **REVISE** | 5 | oui (glose corrigée) |
| **REJECT** | 0 | — |
| **NEEDS_REVIEW** | 1 | **non** |

## 4. Gloses corrigées (REVISE)

| Forme | Proposition Phase 30 | Glosse finale |
|---|---|---|
| قَلَىٰ (93:3) | a délaissé ❌ | **a détesté** |
| فَٱرْغَب (94:8) | désire (ton Seigneur) | **tourne-toi** |
| فَحَدِّثْ (93:11) | alors raconte | **proclame** |
| أَبَابِيلَ (105:3) | volées (d'oiseaux) | **volées d'oiseaux** |
| أَفْوَاجًۭا (110:2) | en foules | **en foule** |

Correction notable : `قَلَىٰ` = « a détesté » (verbe قَلَى « haïr/détester »),
à ne pas confondre avec `وَدَّعَ` « abandonner » — les deux sont distincts dans
le verset 93:3 (« ni abandonné, ni détesté »).

## 5. Gloses acceptées

81 gloses ACCEPT (verbes conjugués, particules, formes composées) — glosse
lexicale courte, cohérente avec `meaning_en` Quran.com et le contexte Hamidullah,
jamais copiée d'une traduction d'ayah.

## 6. Gloses rejetées

Aucune (0 REJECT).

## 7. Gloses restant à revoir

1 forme **NEEDS_REVIEW** : `ٱلْمَاعُونَ` (107:7) — terme débattu (interprétations
« aide secourable », « ustensile », « petits services »). RÈGLE 6 (forme rare) :
aucune glose unique forcée ; décision humaine requise.

## 8. Import réalisé

`scripts/import-phase31-medium-glosses.ts` (DRY-RUN puis APPLY, idempotent) :

- 86 `word_translations` FR validées, source « Hikma — lexique éditorial »,
  `is_validated = true`, `validated_at`, `editorial_notes` traçable.
- Défense anti-mauvaise-identification : 86/86 formes vérifiées par normalisation.
- **RUN 1** : 86 insertions, 0 divergence. **RUN 2** : 0 insertion, 86 doublons,
  0 erreur (idempotence confirmée).
- Traçabilité : `tmp/phase31-medium-validation.json` mis à jour avec
  `validated_by = "human"` + `validated_at`.

## 9. Compteurs avant/après

| Table | Avant | Après |
|---|---:|---:|
| quran_words | 21 296 | 21 296 ✓ |
| word_occurrences | 77 430 | 77 430 ✓ |
| ayahs | 6 236 | 6 236 ✓ |
| translations | 24 944 | 24 944 ✓ |
| lemmas | 32 | 32 ✓ |
| **word_translations** | **177** | **263** (+86) |
| lemma_translations | 32 | 32 ✓ |
| word_lemma_mapping | 184 | 184 ✓ |
| linguistic_occurrences | 97 | 97 ✓ |
| linguistic_segments | 170 | 170 ✓ |

## 10. Couverture FR par sourate (resolver réel FORME → LEMME → MAPPING → EN)

| Sourate | FR effectif | Statut |
|---|---:|---|
| 1 Al-Fātiḥah | 100 % | REFERENCE |
| 93, 94, 102–106, 108, 109, 110, 112, 113, 114 (13) | 100 % | READY |
| 107 Al-Māʿūn | **96 %** | IN_PREPARATION |

## 11. Nouveau statut du catalogue `/surahs`

- **14 sourates « Prêtes à apprendre »** (1 + 13), CTA « Commencer » actif.
- **1 sourate « En préparation »** : 107 Al-Māʿūn (bloquée par `ٱلْمَاعُونَ`).
- Aucun badge MASAQ. La bascule est **automatique** (état dérivé de la couverture
  FR, `classifySurahReadiness`), aucun code UI à modifier.

## 12. Tests

- `npm test` : **552/552 PASS** (44 fichiers), dont `tests/phase31-medium-validation.test.ts`
  (8 tests : résolution glose validée, glose REVISE finale, PROPOSED ignorée,
  NEEDS_REVIEW non validée, readiness sans/avec MASAQ, Fātiḥah verrouillée).
- `npx tsc --noEmit` : **0 erreur**.
- `npm run lint` : **PASS**.
- `npm run build` : **PASS**.

## 13. Validation navigateur

`tmp/phase31-browser.cjs` (desktop 1280×720 + mobile 390×844) :

- `/surahs` : **14 noms arabes READY + 1 « en préparation » trouvés**, 14 CTA
  « Commencer », 0 fuite MASAQ, RTL, 0 overflow.
- Leçons : `/learn/basmala` (référence), `/learn/surah-112-ayah-1` (MASAQ),
  `/learn/surah-93-ayah-1` (nouvellement ouverte, **sans MASAQ**),
  `/learn/surah-107-ayah-1` (encore en préparation, apprenable BASE) → toutes
  chargent, RTL, 0 overflow.
- **0 erreur console · 0 tag MASAQ brut · 0 overflow.**

## 14. Non-régression

Seule variation : `word_translations 177 → 263` (+86). Tous les autres compteurs
inchangés. Al-Fātiḥah : 8 leçons / 26 formes / 26 audios — **intacte**.
`grading` / `scoring` / `SRS` / `mastery` / `progression` / `curriculum` : **inchangés**.
MASAQ : 97 occurrences / 170 segments — **inchangé**.

## 15. Limites restantes

- `ٱلْمَاعُونَ` (107:7) reste en NEEDS_REVIEW → sourate 107 non exposée comme
  parcours français complet (96 %).
- 86 gloses MEDIUM importées ont une confiance éditoriale moindre que les HIGH ;
  une passe de relecture future reste possible (sans toucher au grading/SRS).

## 16. Décision finale

`MEDIUM_GLOSS_VALIDATION_COMPLETE — 86/87 importées, 14 sourates READY`

### Récapitulatif demandé

- **ACCEPT** : 81
- **REVISE** : 5
- **REJECT** : 0
- **NEEDS_REVIEW** : 1 (`ٱلْمَاعُونَ`)
- **Importées** : 86
- **Sourates READY** : 14 (1, 93, 94, 102, 103, 104, 105, 106, 108, 109, 110, 112, 113, 114)
- **Sourates PREPARATION** : 1 (107 Al-Māʿūn, 96 %)
- **Couverture FR** : 14 sourates à 100 % ; Al-Māʿūn à 96 % (22/23 formes)
- **Décision humaine restante** : le sens pédagogique de `ٱلْمَاعُونَ`
  (« l'aide secourable » vs « l'ustensile » vs « les petits services »).

**Fin de la Phase 31.** L'onboarding complet et les fonctionnalités inspirées de
Quran Progress ne sont **pas** commencés ici. La prochaine phase sera décidée
séparément.
