# PHASE 23F-C — AUDIT PÉDAGOGIQUE END-TO-END RÉEL

**VERDICT GLOBAL : `PEDAGOGICAL_PARTIAL`**

Audit **100 % READ-ONLY** (0 écriture DB, 0 migration, 0 écriture Storage,
0 changement de code). Le comportement réel a été exécuté avec les **vraies
fonctions du moteur** (même chemin que `/learn/[slug]`), pas seulement vérifié
sur les noms.

---

## 1. Baseline live

| Compteur | Attendu | Réel | État |
|---|---|---|---|
| quran_words | 21 296 | **21 296** | ✓ |
| word_occurrences | 77 430 | **77 430** | ✓ |
| ayahs | — | 6 236 | ✓ |
| lemmas | 32 | **32** | ✓ |
| word_audio | 21 295 | **21 295** | ✓ |
| ayah_audio | 0 | **0** | ✓ |
| Mujawwad | 0 | **0** | ✓ |
| word_translations FR validées | 19 | **19** | ✓ |
| lemma_translations FR validées | 28 | **28** | ✓ |
| word_lemma_mapping safe | 182 | **182** | ✓ |
| recitations | — | 15 | ✓ |
| user_word_skill_progress (prod) | — | 0 ligne réelle | ✓ (aucune donnée de test) |

Aucune divergence : l'état correspond exactement à la fin de 23F-B.

## 2. Curriculum Al-Fatiha

8 leçons cumulatives : `basmala` → `al-hamd` → `ar-rahman` →
`malik-yawm-ad-din` → `iyyaka-nabudu` → `ihdina-sirat` →
`sirat-alladhina` → `wa-la-d-dallin` (1:1 → 1:7, ayah 7 scindée en 4+4).

**26 formes couvertes** (matrice complète dans
`tmp/phase23f-c-end-to-end-pedagogical-audit.json`) :

| Canal | Formes |
|---|---|
| FR via FORME (word_translations) | 19 |
| FR via LEMME | 1 (يَوْمِ) |
| **FR total** | **20/26** |
| EN fallback (grammaticales) | 6 |
| Audio Muallim | **26/26** |
| Relation de lemme disponible | 9/26 |

Les 6 EN fallback sont les formes **grammaticales/contextuelles** déjà classées
`REVIEW_REQUIRED` en 23C/D : `إِيَّاكَ`, `وَإِيَّاكَ`, `ٱلَّذِينَ`, `عَلَيْهِمْ`,
`غَيْرِ`, `وَلَا`. Ce sont des **DATA_GAP** assumés (jamais de glose lexicale
artificielle).

## 3. Simulation USER_NEW (progression réelle)

Séquence construite par `buildCumulativeSequence` (progression vide), exercices
générés par les vrais générateurs avec audio/context/lemme réels :

| Leçon | nouveaux | révision | exercices | audio | contexte | lemme |
|---|---|---|---|---|---|---|
| basmala | 4 | 0 | 27 | 4 | 4 | 3 |
| al-hamd | 4 | 4 | 54 | 8 | 8 | 6 |
| ar-rahman | 2 | 4 | 41 | 6 | 6 | 5 |
| malik-yawm-ad-din | 3 | 4 | 47 | 7 | 7 | 5 |
| iyyaka-nabudu | 4 | 4 | 50 | 8 | 8 | 2 |
| ihdina-sirat | 3 | 4 | 43 | 7 | 7 | 1 |
| sirat-alladhina | 4 | 4 | 50 | 8 | 8 | 2 |
| wa-la-d-dallin | 4 | 4 | 49 | 8 | 8 | 1 |

**Ordre des compétences, identique sur les 8 leçons** :
`meaning_recognition → form_recognition → form_to_meaning →
meaning_to_form → audio_recognition → context_recognition → lemma_relation`.

→ Aucune compétence avancée n'apparaît avant ses prérequis (pas de
`meaning_to_form` ni d'`AUDIO_TO_WORD` avant la reconnaissance/rappel).

## 4. Ordre pédagogique — **PASS**

Découverte (étape `discovery` du player) → reconnaissance → association
forme↔sens → rappel → production → audio → contexte → lemme. La production
(`meaning_to_form`) n'arrive qu'après le rappel, l'audio après la production,
le contexte après l'audio. Aucune fuite prématurée détectée.

## 5. Méthode Michel Thomas (principes transférables)

| Principe | Statut | Preuve |
|---|---|---|
| Progression contrôlée | **PASS** | rondes dans un ordre fixe |
| Découverte avant mémorisation | **PASS** | étape « Découverte » avant les exercices |
| Compréhension avant répétition | **PASS** | sens affiché à la découverte |
| Rappel actif | **PASS** | FORM_TO_MEANING saisie libre machine-notée |
| Réduction progressive des aides | **PARTIAL** | reconnaissance → rappel → production, mais sans étayage décroissant inter-leçons |
| Réutilisation cumulative | **PASS** | mots de révision réintroduits chaque leçon (plafonné 4) |
| Correction immédiate | **PASS** | feedback + révélation |
| Montée graduelle de difficulté | **PASS** | difficulté 1→3 + ordre de compétences |
| Réactivation des faibles | **PASS** | porte de rétention + saut des maîtrisées |
| Relations entre éléments connus | **PARTIAL** | LEMMA_RELATION limité à 9/26, siblings bruts |

## 6. Rappel actif — **PASS**

Saisie libre **avant** révélation, notation machine tri-state, persistance.
Non-contamination vérifiée : `عَبَدَ`≠`عَبْد` et `دِين`≠`دَيْن` → **AMBIGUOUS** ;
`ضَالّ`≠`ظِلّ` → **INCORRECT** (tests dédiés, 278/278).

## 7. Maîtrise — **PASS**

| Profil | Résultat |
|---|---|
| A débutant (0/0) | 0 |
| B corrects répétés (4/0, 10/0) | 100 |
| C erreurs répétées (0/4, 1/4) | 0 |
| D alternance (3/3 ; 4/2) | 0 ; 50 |
| E longue période sans révision | mastery 100 (statique) · retention 100 (7 j) |
| F forte + faible | 100 / 25 |
| **100 corrects / 96 erreurs** | **50** (plus 100) |
| erreur récente après maîtrise | 75 (1 cran, symétrique) |

Seuils 0/25/50/75/100 atteints par : net (≥1/2/3/4) **plafonné** par la précision
(≥85 %→100, ≥70 %→75, ≥50 %→50) et par la récence (échec récent → ≤75).

## 8. Rétention — **PARTIAL** (proxy temporel)

`last_correct_at` dérive le niveau (25/50/75/100 à 0/1/3/7 jours) ;
`last_incorrect_at` postérieur → perte (25). `current_streak` persisté mais non
utilisé dans la formule. La **ré-activation** s'appuie sur ce proxy (rappel
réactivé tant que rétention < 75). **Ce n'est pas un SRS** : pas d'intervalles
par compétence, pas d'historique de difficulté — reste un proxy documenté.

## 9. Compétences — matrice

| Compétence | Générateur | Apparition | Réussite | Persistance | Réactivation |
|---|---|---|---|---|---|
| form_recognition | TRANSLATION_TO_WORD / REVERSE / MULTIPLE_CHOICE | ronde 2 | QCM | ✓ | rondes |
| meaning_recognition | WORD_TO_TRANSLATION / COMPLETE_WORD | ronde 1 | QCM | ✓ | rondes |
| form_to_meaning | FORM_TO_MEANING (saisie) | ronde 3 | machine | ✓ | + rétention |
| meaning_to_form | MEANING_TO_FORM (saisie) | ronde 4 | machine | ✓ | + rétention |
| audio_recognition | AUDIO_TO_WORD / WORD_TO_AUDIO | ronde 5 | QCM/auto | ✓ | rondes |
| context_recognition | CONTEXT_RECOGNITION | ronde 6 | QCM | ✓ | rondes |
| lemma_relation | LEMMA_RELATION | ronde 7 (si données) | QCM | ✓ | rondes |
| retention | dérivée | après rappel | temporel | ✓ | porte |

Seules `retention` (dérivée) et `lemma_relation` (9/26) ne peuvent pas toujours
atteindre 100 pour chaque mot — les 6 autres le peuvent.

## 10. Audio — **PASS**

26/26 URL signées Muallim. Échantillons début/milieu/fin : `audio/opus`,
accessibles (HTTP 206). `AUDIO_TO_WORD` (écoute → identifier) et `WORD_TO_AUDIO`
(forme → écouter) sont actifs, placés après le rappel. Pas décoratif. Aucun
ayah_audio, aucun Mujawwad.

## 11. Contexte — **PASS**

`CONTEXT_RECOGNITION` utilise l'ayah réelle + la traduction FR réelle
(Hamidullah) :
- 1:1 « Au nom du Dieu clément et miséricordieux » ✓
- 1:4 « Souverain au jour de la rétribution. » ✓
- 1:7 (texte complet + traduction) ✓

Aucun ayah/traduction inventé, aucune forme hors contexte.

## 12. Lemme — **PASS (avec réserve)**

`صِرَٰطَ ↔ ٱلصِّرَٰطَ` reliés au même lemme `صراط` ✓. `إِيَّاكَ`/`وَإِيَّاكَ`
**non** reliés (correct : `REVIEW_REQUIRED` éditorial). Aucun homographe
regroupé. **Réserve** (voir F4) : les « frères » proviennent de tout le Coran et
incluent des marques de pause coraniques + des formes fléchies jamais vues.

## 13. Charge cognitive — **PARTIAL** (point de friction)

Les mots sont plafonnés (max **8**/leçon), mais chaque mot traverse ~7
compétences : **27 à 54 exercices par leçon** (54 pour al-hamd). Pour un
débutant, 50+ exercices d'affilée est lourd — la réduction de mots n'a pas
réduit la longueur de session. Recommandation : découper en micro-sessions ou
plafonner les exercices/session (phase future, hors périmètre).

## 14. Cumulativité — **PASS**

Les mots introduits reviennent dans les leçons suivantes (révision plafonnée à
4, des plus récents d'abord) : `al-hamd` révise les 4 mots de `basmala`,
`wa-la-d-dallin` révise les 4 mots de `sirat-alladhina`, etc. Pas de répétition
arbitraire (ordre déterministe).

## 15. Cas d'erreur — **PASS**

- erreur de sens / forme / audio / contexte → feedback + `incorrect++` → niveau
  baisse → le mot revient (rondes + porte de rétention) ;
- réponse **AMBIGUOUS** → neutre (révélée, non pénalisée) ;
- aucune punition disproportionnée (100 → 75 max par erreur récente).

## 16. USER_PARTIAL_MASTERY — **PASS**

Compétences maîtrisées **sautées**, faibles **réactivées** (porte de rétention),
nouvelles **introduites** — vérifié par les tests unitaires (rondes + `selectNextStep`).

## 17. Fin d'Al-Fatiha — verdict par objectif

| Objectif | Verdict | Preuve |
|---|---|---|
| Reconnaître les 26 formes | **YES** | QCM forme |
| Associer forme → sens FR | **PARTIAL** | 20/26 FR (6 EN) |
| Rappeler le sens sans aide | **PARTIAL** | machine-noté mais 6 EN |
| Produire les formes arabes | **PARTIAL** | MEANING_TO_FORM machine (AMBIGUOUS géré) |
| Reconnaître à l'audio | **YES** | 26/26 |
| Associer mot → contexte | **YES** | CONTEXT_RECOGNITION |
| Relations de lemme | **PARTIAL** | 9/26 |
| Conserver dans le temps | **PARTIAL** | proxy temporel, pas SRS |

## 18. Données manquantes — classification stricte

| # | Type | Élément | Priorité |
|---|---|---|---|
| F1 | **DATA GAP** | 6 formes grammaticales sans glose FR (EN fallback) | P0 données (décision éditoriale) |
| F2 | **UX GAP** | 27–54 exercices par leçon | P2 |
| F3 | **ENGINE GAP** | rétention = proxy (pas de SRS réel) | P1 |
| F4 | **DATA qualité** | siblings LEMMA_RELATION bruts (marques de pause, formes inédites) | P3 |

## 19. UX (lecture du LessonPlayer, sans modification)

Points forts : consigne claire, forme arabe en Amiri, feedback explicite, audio
natif, progression visible. Frictions : (a) longueur de session (§13) ;
(b) saisie libre arabe exigeante pour un débutant (normalisation tolérante mais
clavier arabe requis) ; (c) aucune indication de maîtrise par compétence dans le
player (la maîtrise n'est pas affichée).

## 20. Tests techniques — **tous verts**

`npm test` **278/278** · `npx tsc --noEmit` **0 erreur** · `npm run lint` clean ·
`npm run build` OK · `verify:persistence` **13/13** · `verify:rls` **38/38**.

## 21. Livrables

- `PHASE_23F_C_END_TO_END_PEDAGOGICAL_AUDIT.md`
- `tmp/phase23f-c-end-to-end-pedagogical-audit.json`
- `tmp/phase23f-c-user-new-simulation.json`
- `tmp/phase23f-c-mastery-matrix.json`
- `tmp/phase23f-c-competency-matrix.json`

## 22. Problèmes détectés (à documenter, PAS à corriger)

| # | Priorité | Impact | Cause | Preuve | Phase recommandée |
|---|---|---|---|---|---|
| F1 | P0 | 6 formes sans sens FR | grammaticales `REVIEW_REQUIRED`, pas de glose validée | matrice EN_FALLBACK | 23x gloses |
| F2 | P2 | sessions trop longues (54 ex.) | mots plafonnés mais ~7 compétences/mot | user_new_simulation | micro-sessions |
| F3 | P1 | rétention approximative | proxy `last_correct_at`, pas de SRS | retentionLevel | 23G SRS |
| F4 | P3 | options lemme bruitées | `quran_words.arabic` brut (marques ۗ ۚ ۞) | lemma_samples | nettoyage affichage |

## 23. Conclusion

**`PEDAGOGICAL_PARTIAL`** — le socle est **réel et correct** : un débutant suit
un parcours cumulatif ordonné (reconnaissance → rappel machine → production →
audio → contexte → lemme), persisté par compétence, avec maîtrise précision/
récence corrigée et audio Muallim réel. Les verrous restants sont **connus et
circonscrits** : 6 gloses grammaticales (DATA), la longueur de session (UX), la
rétention proxy (ENGINE) et la qualité d'affichage des « frères » de lemme (DATA).

**ARRÊT OBLIGATOIRE** — aucun correctif appliqué, pas de phase 23G démarrée.
Le propriétaire décide de la suite.
