# PHASE 23F — IMPLÉMENTATION DU SOCLE DU MOTEUR PÉDAGOGIQUE AL-FATIHA

**STATUS : `PEDAGOGICAL_ENGINE_FOUNDATION_COMPLETE`**

Première phase d'implémentation après les audits 23A → 23E. Le socle est construit :
maîtrise multi-dimensionnelle, progression cumulative, rappel actif, audio pédagogique,
curriculum Al-Fatiha complet. Aucun Mujawwad, aucun ayah_audio, aucune modification de
`quran_words` ni du resolver lexical.

---

## A. ÉTAT AVANT

- Maîtrise = **un score agrégé 0-100** (`user_word_progress`), piloté par statut + SRS.
- **100 % QCM de reconnaissance** ; 0 rappel libre, 0 production.
- Audio importé (21 295 word_audio) mais **aucun player** (générateurs audio inactifs).
- Curriculum = **3 leçons démo** (Al-Fatiha 1:1–1:3).
- Tests 242 · RLS 33/33.

## B. AUDIT DU SCHÉMA

Artifact : `tmp/phase23f-schema-decision.json`.

| Table | Rôle | Décision |
|---|---|---|
| `user_word_progress` | progression agrégée + SRS | **UNCHANGED** |
| `review_items` | planification Leitner | **UNCHANGED** |
| `learning_paths/units/lessons/lesson_words` | curriculum | **seed étendu** |
| `user_word_skill_progress` | maîtrise par compétence | **NOUVEAU (additif)** |

Aucune table existante modifiée, aucune duplication.

## C. DÉCISIONS D'ARCHITECTURE

1. **Maîtrise par compétence = table additive** `user_word_skill_progress` (une ligne par
   `(user_id, word_id, skill)`), la vue agrégée restant inchangée.
2. **8 compétences** portées par le code (`lib/learning/skills.ts`) ET par la base (contrainte CHECK).
3. **Séquenceur cumulatif pur** (`lib/learning/sequencing.ts`) : rondes par compétence, pas
   « mot 1 → tous ses exercices ».
4. **Rappel actif auto-évalué noté** : la réponse « Je l'avais / À revoir » est persistée
   (les erreurs influencent la maîtrise), contrairement à l'auto-évaluation non notée.
5. **Complétion de leçon = mots NOUVEAUX** (`is_new=true`) uniquement ; les mots de révision
   sont du renforcement, pas un critère de complétion.

## D. MIGRATIONS CRÉÉES

- `supabase/migrations/0023_user_word_skill_progress.sql` — appliquée (idempotente,
  suivie dans `hikma_migrations`).

## E. NOUVELLES TABLES / CHAMPS

`user_word_skill_progress` : `user_id`, `word_id`, `skill` (CHECK 8 valeurs),
`correct_count`, `incorrect_count`, `mastery` (0–100), `last_attempt_at`, timestamps.
UNIQUE `(user_id, word_id, skill)` · RLS `auth.uid() = user_id`.

## F. MOTEUR DE PROGRESSION

- `lib/learning/skills.ts` : `Skill`, `SKILL_ORDER`, `skillForExerciseType`.
- `lib/learning/skill-progress.ts` : `skillMasteryLevel` (corrects nets), `applySkillAttempt`,
  `aggregateSkillMastery`, `weakestSkills`.
- `lib/learning/sequencing.ts` : `buildCumulativeSequence`, `selectNextStep`, `isSequenceComplete`.
- Persistance : `submitSkillAttempts` (action) + `getUserSkillProgress` (query), branchés
  dans `LessonPlayer` (collecte par compétence → soumission en fin de leçon, best-effort).

## G. MOTEUR DE MAÎTRISE

8 dimensions : `form_recognition`, `meaning_recognition`, `form_to_meaning`,
`meaning_to_form`, `audio_recognition`, `context_recognition`, `lemma_relation`, `retention`.

Règle de score : `net = correct − incorrect` (plancher 0) → 0 / 25 / 50 / 75 / 100
(net ≥ 4). **Une erreur diminue le niveau** — la maîtrise n'est plus un compteur QCM.

## H. EXERCICES IMPLÉMENTÉS

| Type | Compétence | Statut |
|---|---|---|
| WORD_TO_TRANSLATION | meaning_recognition | existant |
| TRANSLATION_TO_WORD / REVERSE_TRANSLATION / MULTIPLE_CHOICE | form_recognition | existant |
| COMPLETE_WORD | meaning_recognition | existant |
| **FORM_TO_MEANING** | form_to_meaning | **NOUVEAU (rappel)** |
| **MEANING_TO_FORM** | meaning_to_form | **NOUVEAU (production)** |
| **AUDIO_TO_WORD / WORD_TO_AUDIO** | audio_recognition | **ACTIVÉS (URL signée)** |

Rappel : l'utilisateur doit retrouver la réponse AVANT de la révéler, puis s'auto-évaluer
(noté). 10 générateurs enregistrés.

## I. AUDIO UTILISÉ

- `getWordAudioUrls` : URL signées Storage `word-audio` (TTL 1 h), batch, sans N+1.
- `AUDIO_TO_WORD` (écouter → identifier) et `WORD_TO_AUDIO` (forme + écoute → confirmer)
  générés uniquement si l'URL existe — jamais d'audio simulé.
- `ayah_audio = 0`, `Mujawwad = 0` (inchangés).

## J. SCÉNARIO USER_NEW

Simulation testée (10 étapes) : `selectNextStep` → bonne réponse → `applySkillAttempt` →
étape suivante. Le moteur commence par la **reconnaissance du sens** du premier mot, monte
à 100 sur cette compétence, passe à la reconnaissance de la forme, puis au **rappel**
(`form_to_meaning`). Les compétences sont introduites dans l'ordre pédagogique, sans
repartir de zéro.

## K. SCÉNARIO USER_PARTIAL_MASTERY

Compétences maîtrisées (`meaning_recognition`, `form_recognition`) → **sautées** pour ce mot ;
les compétences faibles sont **réactivées** ; les mots nouveaux reçoivent la séquence
complète. Un utilisateur avancé ne recommence pas tout.

## L. TESTS

- `tests/pedagogical-engine.test.ts` (14 tests) : mapping compétences, score, agrégation,
  séquenceur, USER_NEW (10 étapes), USER_PARTIAL_MASTERY.
- `tests/exercises.test.ts` (+3) : audio signé, rappel auto-évalué, registre 10 générateurs.
- **259/259 tests** (19 fichiers).

## M. NON-RÉGRESSION

| Vérification | Résultat |
|---|---|
| `npm test` | **259/259** ✓ |
| `npx tsc --noEmit` | **0 erreur** ✓ |
| `npm run lint` | clean ✓ |
| `npm run build` | OK ✓ |
| `npm run verify:persistence` | **13/13** ✓ |
| `npm run verify:rls` | **38/38** ✓ (5 nouveaux contrôles `user_word_skill_progress`) |

## N. LIMITES RESTANTES

- **CONTEXT / LEMMA_RELATION / RETENTION** : compétences définies et mappées, mais sans
  générateur d'exercice dédié (séquenceur les ignore proprement). Contexte = phase suivante.
- **SRS par compétence** (Phase 23B Option B) : non implémenté — le SRS par mot existant
  reste l'autorité ; `user_word_skill_progress` est la couche additive.
- **Production saisie libre** (clavier arabe / translittération) : le rappel est auto-évalué,
  pas machine-gradé.
- **Re-séquençage adaptatif intra-session** : la séquence est calculée au chargement de la
  leçon (figée pour la session), pas re-calculée après chaque réponse.

## O. PROCHAINES PHASES RECOMMANDÉES

1. **23G** — exercice CONTEXT (mot dans le verset, données `ayahContext` déjà chargées).
2. **23H** — SRS par compétence (étendre `review_items` ou table dédiée par compétence).
3. **23I** — pilote Al-Fatiha de bout en bout (validation pédagogique utilisateur).
4. **23J** — production libre machine-gradée (translittération/OCR) et élargissement.

---

## ARRÊT OBLIGATOIRE

Conformément à la règle de phase : **aucune** suite automatique (23G, player complet,
SRS avancé, 114 sourates, gamification, Mujawwad, ayah audio). Le propriétaire examine le
rapport 23F avant toute phase suivante.

**Livrables :**
- `PHASE_23F_PEDAGOGICAL_ENGINE_FOUNDATION.md`
- `tmp/phase23f-pedagogical-engine-evidence.json`
- `tmp/phase23f-pedagogical-engine-summary.json`
- `tmp/phase23f-schema-decision.json` (audit de schéma)
