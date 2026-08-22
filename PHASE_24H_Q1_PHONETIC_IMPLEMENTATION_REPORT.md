# PHASE 24H-Q1 — Lecture guidée + phonétique fondamentale + production guidée

**STATUS = `PHONETIC_GUIDED_PRODUCTION_COMPLETE`**

Hikma sait désormais guider un débutant sur un mot réel (voir → observer → écouter → comprendre → répéter → s'enregistrer localement → se réécouter → recommencer), **sans prétendre juger objectivement la prononciation** (pas de STT, pas de scoring acoustique, pas de tajwid).

---

## 1. Décisions d'architecture (justifiées par l'audit)

| Décision | Raison |
|---|---|
| **Aucune migration** | La production guidée est **auto-évaluée** → aucune compétence de maîtrise à alimenter. Le CHECK `skill in (8 valeurs)` reste intact ; l'extension `pronunciation_recognition/production` est conçue mais différée à Q2/Q3. |
| **Aucune donnée importée** | Les conseils phonétiques sont **dérivés du texte arabe réel** (diacritiques + lettres difficiles) en code pur `lib/learning/phonetics.ts` — jamais de table, jamais d'encyclopédie. |
| **Intégration dans la Découverte** (pas la séquence notée) | Zéro impact session 24E (pas de décalage d'index), zéro pollution de maîtrise, aucune augmentation de la charge cognitive des sessions 27–54 exercices. |
| **Micro 100 % local** | `getUserMedia` + `MediaRecorder` dans le navigateur, blob → URL objet, **aucun envoi**, permission au clic uniquement, fallback sans micro. |

## 2. Ce qui a été construit

### a) Phonétique minimale — `lib/learning/phonetics.ts` (pur, testé)
- Détection des **marques** : shadda, soukoun, madda (`آ` et `آ` U+0653), petit alif (dagger alef), wasla, hamza, tanwīn.
- Détection des **sons difficiles** pour un francophone : ع ح غ خ ص ض ط ظ ق ث ذ (chacun avec une explication simple, ex. « Le ◌ّ (shadda) double la consonne », « ع : son profond de la gorge, absent du français »).
- `phoneticHints()` : max 4 conseils en langage simple (jamais de terminologie brute).
- La **translittération reste une aide secondaire** (priorité : arabe → audio → explication).

### b) Nouveau type d'exercice `PRONUNCIATION_GUIDED`
- `lib/exercises/types.ts` + générateur `pronunciation-guided.ts` (nécessite `audioUrl`, sinon `null` — jamais d'audio simulé).
- Registre `GENERATORS` → 13 générateurs ; `skillForExerciseType` → **null** (auto-évalué).
- `validateAnswer` / `scoreAnswer` → **neutres** (score 0, jamais CORRECT/INCORRECT) ; validateur → auto-évalué (options facultatives).

### c) Composant `PronunciationGuided`
- `components/learn/exercises/pronunciation-exercise.tsx` : mot + translittération + **AudioPlayer 24F** (modèle) + badges de marques + conseils + **enregistrement local** (🎙 Enregistrer → ⏹ Arrêter → ▶ Réécouter → 🔄 Réessayer → ✓ C'est bon).
- Micro refusé / indisponible → message rassurant + répétition à voix haute (fonctionne sans micro).
- Confidentialité affichée : « Ton enregistrement reste sur ton appareil ».

### d) Intégration
- `app/(app)/learn/[slug]/page.tsx` : génère l'exercice guidé sur le **premier mot** de la leçon (déterministe).
- `components/learn/lesson-player.tsx` : carte « Prononciation guidée · commence par ce mot » dans l'étape **Découverte** ; `isSelfAssessment` étendu à `PRONUNCIATION_GUIDED`.

## 3. Vérifications

- **Tests** : 328 → **336** (`tests/phonetics.test.ts` 7 tests + 1 test `PRONUNCIATION_GUIDED`). Registre 12 → 13.
- `tsc` 0 erreur · lint clean · build OK · persistence **13/13** · RLS **44/44**.
- **Compteurs inchangés** : quran_words 21 296 · word_occurrences 77 430 · word_audio 21 295 · ayah_audio 0 · lemmas 32 · word_translations FR 25 · mappings 183.
- **Audio intact** : 26/26 formes signées sous ANON, HTTP 200 `audio/opus` (voir `tmp/phase24hq1-audio-validation.json`).
- **Grading FR/AR intact** : homographes `عَبَدَ≠عَبْد` / `دِين≠دَيْن` / `ضَالّ≠ظِلّ` et normalisation FR/AR inchangés (tests verts).
- **0 migration · 0 écriture Storage · 0 import.**

## 4. Parcours utilisateur atteint (critère de succès)

Pour `مَـٰلِكِ` : voir le mot → voir la translittération `māliki` → voir les marques (petit alif) → lire le conseil (« petit alif = ā allongé ») → écouter le modèle → répéter → s'enregistrer → se réécouter → réessayer — **sans sanction automatique**.

## 5. Limites restantes (honnêtes)

- **`BROWSER_VALIDATION_PENDING`** : la capture micro réelle et le rendu tactile/clavier/axe-core ne peuvent pas être validés sans navigateur automatisé (rendez-vous 24I/24J). Le code + tests + build sont validés.
- **Pas de verdict de prononciation** (volontaire, Q1) : l'utilisateur s'auto-évalue. Les compétences `pronunciation_recognition`/`pronunciation_production` et une éventuelle comparaison acoustique prudente sont **conçues pour Q2/Q3** (migration additive du CHECK `skill` requise).
- La détection phonétique est **formelle** (marques/lettres), pas une segmentation syllabique — délibérément conservatrice pour ne rien enseigner de faux.

## 6. Interdictions respectées

Aucune donnée lexicale modifiée · aucun resolver/grading/curriculum/séquenceur/mastery/SRS modifiés · bucket audio toujours privé · aucun STT · aucun scoring acoustique · aucun tajwid · aucun Mujawwad · aucun ayah_audio · 23G/SRS/gamification/114 sourates non démarrés.

---

## Livrables

- `PHASE_24H_Q1_AUDIT.md` + `tmp/phase24hq1-audit.json` (ÉTAPE 0)
- `PHASE_24H_Q1_PHONETIC_IMPLEMENTATION_REPORT.md` (ce rapport)
- `tmp/phase24hq1-evidence.json`
- `tmp/phase24hq1-phonetic-matrix.json` (26 formes, marques + sons + conseils)
- `tmp/phase24hq1-audio-validation.json` (26/26 signées ANON + HTTP 200)
- `tmp/phase24hq1-privacy-validation.json` (10/10 local)
- `tmp/phase24hq1-regression.json` (336/336, compteurs inchangés)

**ARRÊT OBLIGATOIRE** : 24H-Q2 non démarré — en attente d'approbation explicite du propriétaire.
