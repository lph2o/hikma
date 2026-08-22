# PHASE 23E — VALIDATION CONTRÔLÉE DES GLOSES FR AL-FATIHA

**STATUS : `PRIORITY_GLOSSES_VALIDATED`**

Écritures DB **strictement limitées** au périmètre autorisé : `lemmas`, `lemma_translations`,
`word_lemma_mapping`, `word_translations`. Aucune autre table ni aucun code modifié.

Garanties : `MIGRATIONS = 0` · `STORAGE_WRITES = 0` · `PRODUCTION_CODE_CHANGES = 0` ·
`RESOLVER_CHANGES = 0` · `UI_CHANGES = 0` · `AUDIO_CHANGES = 0` · `CURRICULUM_CHANGES = 0`.

---

## A. DRY-RUN INITIAL

Avant toute écriture, le script (lecture seule) a vérifié chaque candidat contre la DB **live** :

| Élément | Valeur |
|---|---|
| Nouveaux lemmes | **10** |
| Lemmes existants réutilisés | **0** |
| Nouvelles `lemma_translations` | **10** (10 lemmes uniques) |
| Nouvelles `word_translations` | **11** (gloses de FORME) |
| Nouveaux `word_lemma_mapping` (safe) | **11** |
| Doublons détectés | **0** |
| Conflits | **0** |
| `REVIEW_REQUIRED` | **0** |

Le dry-run a démontré qu'**aucune donnée validée existante ne serait écrasée** et qu'**aucun
doublon de lemme ne serait créé**.

---

## B. PROPOSITIONS VALIDÉES (11/11)

| Forme | Ayah | Lemme (créé) | Glose FR (FORME) | Confiance |
|---|---|---|---|---|
| مَـٰلِكِ | 1:4 | مَالِك | souverain / maître | HIGH |
| ٱلدِّينِ | 1:4 | دِين | rétribution / religion | HIGH |
| نَعْبُدُ | 1:5 | عَبَدَ | nous adorons | HIGH |
| نَسْتَعِينُ | 1:5 | اِسْتَعَانَ | nous implorons le secours | HIGH |
| ٱهْدِنَا | 1:6 | هَدَى | guide-nous | HIGH |
| ٱلصِّرَٰطَ | 1:6 | صِرَاط | le chemin / la voie | HIGH |
| صِرَٰطَ | 1:7 | صِرَاط (partagé) | chemin / voie | HIGH |
| ٱلْمُسْتَقِيمَ | 1:6 | مُسْتَقِيم | droit | HIGH |
| أَنْعَمْتَ | 1:7 | أَنْعَمَ | Tu as comblé de bienfaits | HIGH |
| ٱلْمَغْضُوبِ | 1:7 | مَغْضُوب | ceux qui encourent la colère | HIGH |
| ٱلضَّآلِّينَ | 1:7 | ضَالّ | les égarés | HIGH |

Chaque glose converge : glose EN Quran.com word-by-word + traduction Hamidullah FR du verset
(données déjà présentes dans Hikma). Détail ligne par ligne : `tmp/phase23e-al-fatiha-validation-evidence.json`.

---

## C. PROPOSITIONS REFUSÉES

**Aucune** (0).

## D. ÉLÉMENTS REVIEW_REQUIRED

**Aucun** parmi les 11 P0 lexicales. Les 6 formes grammaticales (`إِيَّاكَ`, `وَإِيَّاكَ`,
`ٱلَّذِينَ`, `عَلَيْهِمْ`, `غَيْرِ`, `وَلَا`) **n'ont pas été importées** (règle de phase) ;
`إِيَّاكَ` / `وَإِيَّاكَ` demeurent `REVIEW_REQUIRED`, à traiter dans une phase dédiée.

---

## E. NOUVEAUX LEMMES (10)

`مَالِك` · `دِين` · `عَبَدَ` · `اِسْتَعَانَ` · `هَدَى` · `صِرَاط` · `مُسْتَقِيم` · `أَنْعَمَ` · `مَغْضُوب` · `ضَالّ`

## F. LEMMES RÉUTILISÉS

**0** (les 10 lemmes étaient tous absents de la DB → aucune réutilisation, aucun risque d'homographe).

Contrôle homographique (Phase 23D confirmé en DB) : `عَبَدَ` (adorer) **n'a pas** été relié à
`عَبْد` (serviteur, lemme existant) — vocalisation distincte ; `دِين` ≠ `دَيْن` (dette) ;
`هَدَى` ≠ `هَدِيَّة` ; `ضَالّ` (ض) ≠ `ظِلّ` (ظ).

---

## G. NOUVELLES GLOSES FR

- **10 gloses de LEMME** (`lemma_translations`, `language=fr`, `is_validated=true`, source `Hikma — lexique éditorial`).
- **11 gloses de FORME** (`word_translations`, `language=fr`, `is_validated=true`, même source).

Le lemme porte la glose réutilisable (« adorer »), la forme porte la glose fléchie
(« nous adorons ») — conformément au modèle `FORME ≠ LEMME` de Phase 23B.

## H. MAPPINGS SAFE CRÉÉS (11)

`word_lemma_mapping` — `mapping_method = editorial`, `confidence = safe`, `source_id` éditorial,
preuve « glose EN + Hamidullah FR convergents ». Additifs : **`quran_words.lemma_id` n'a jamais
été modifié** (les 11 `word_id` gardent `lemma_id = NULL`).

---

## I. ANCIENNES DONNÉES INTACTES

- `quran_words` : **21 296** (inchangé), `lemma_id` des 11 formes toujours `NULL`.
- `word_occurrences` : inchangé.
- Données historiques **Kazimirski** : 4 `lemma_translations` intactes (aucune touchée).
- `word_audio` : **21 295** (inchangé) · `ayah_audio` : **0** (inchangé).
- `recitations`, `translations`, `sources` : inchangés.

---

## J. COUVERTURE AVANT / APRÈS

| Compteur | Avant | Après | Δ |
|---|---|---|---|
| `lemmas` | 22 | 32 | +10 |
| `word_translations` FR validées | 8 | 19 | +11 |
| `lemma_translations` FR validées | 18 | 28 | +10 |
| `word_lemma_mapping` safe | 171 | 182 | +11 |

## K. GAIN RÉEL (mesuré live dans la DB)

- +10 lemmes, +11 gloses de forme, +10 gloses de lemme, +11 mappings safe.
- **Occurrences couvertes par les 11 formes : 48** (gain mesuré, pas estimé).

## L. AL-FATIHA AVANT / APRÈS

| | Avant | Après |
|---|---|---|
| Formes résolues FR | 9 / 26 | **20 / 26** |
| Formes restant DATA_GAP | 17 | 6 (grammaticales P1/P2) |

**20/26 formes d'Al-Fatiha sont désormais enseignables en français.** Les 6 restantes sont
les formes grammaticales/contextuelles, à traiter séparément (non bloquantes pour le pilote).

---

## M. VÉRIFICATION RESOLVER

La chaîne de résolution existante (inchangée) atteint désormais les nouvelles gloses :

```
FORME  → word_translations (prioritaire)     → 11/11 ✓
FORME  → word_lemma_mapping → LEMME → lemma_translations → 11/11 ✓
Précédence vérifiée : FORME > LEMME DIRECT > LEMME VIA MAPPING > EN
```

Aucune fonction du resolver n'a été modifiée ; les nouvelles lignes sont lues par les requêtes
existantes (`getWordLemmaMappingsByWordIds` filtre `confidence='safe'`, `getValidatedFrenchLemmaMeanings`
filtre `is_validated=true`).

## N. TESTS / NON-RÉGRESSION

| Vérification | Résultat |
|---|---|
| `npm test` | **242/242** ✓ |
| `npx tsc --noEmit` | **0 erreur** ✓ |
| `npm run lint` | clean ✓ |
| `npm run build` | OK ✓ |
| `npm run verify:persistence` | **13/13** ✓ |
| `npm run verify:rls` | **33/33** ✓ |

## O. IDEMPOTENCE

Deuxième exécution (`APPLY=1`) → **0 nouvelle écriture** : les 11 formes détectées comme déjà
présentes (glose FORME identique, mapping existant, glose LEMME identique) → skip intégral.
**0 doublon, 0 glose inutile, 0 modification destructive.**

## P. ÉTAT FINAL DB

| Table | État |
|---|---|
| `lemmas` | 32 |
| `word_translations` FR validées | 19 |
| `lemma_translations` FR validées | 28 |
| `word_lemma_mapping` safe | 182 |
| `quran_words` | 21 296 (inchangé) |
| `word_audio` / `ayah_audio` | 21 295 / 0 (inchangé) |

---

## ARRÊT OBLIGATOIRE

Conformément à la règle de phase : **aucune** modification de curriculum, de leçons,
d'exercices, de mastery, de SRS, de player, du resolver ou de l'UI ; **aucun** import audio ;
**aucune** activation `AUDIO_TO_WORD` / `WORD_TO_AUDIO`. La prochaine phase (implémentation
pédagogique) n'attend que la décision explicite du propriétaire.

**Livrables :**
- `PHASE_23E_AL_FATIHA_GLOSS_VALIDATION_REPORT.md`
- `tmp/phase23e-al-fatiha-validation-evidence.json`
- `tmp/phase23e-al-fatiha-validation-summary.json`
