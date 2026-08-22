# PHASE 24H-Q1 — AUDIT (ÉTAPE 0)

**Mode : READ-ONLY** — aucun code modifié pendant l'audit. Détails complets dans `tmp/phase24hq1-audit.json`.

## Ce que l'audit a établi

### 1. Moteur pédagogique
- `validateAnswer()` est la **source unique de vérité** (verdict → feedback → progression → maîtrise → rétention). 12 types d'exercices, registre `GENERATORS` exhaustif.
- Types auto-évalués (non notés) : `WORD_RECOGNITION` — c'est le modèle à suivre pour la prononciation guidée.

### 2. LessonPlayer
- Boucle `discovery → playing → feedback → finish`, avec **session persistante 24E** (position + réponses en attente, séquence déterministe).
- **Choix d'intégration** : la prononciation guidée sera injectée dans l'étape **Découverte** (hors séquence notée) → **zéro impact** sur la session 24E, zéro décalage d'index, zéro pollution de maîtrise.

### 3. Générateurs
- `lib/exercises/generators/index.ts` : `Record<ExerciseType, ExerciseGenerator>` — ajouter un type exige un générateur (sinon erreur de type).

### 4. AudioPlayer (24F)
- Intact : états idle/loading/playing/paused/ended/error + réessai + coordination « un seul audio actif ». Réutilisé tel quel pour le modèle Muallim.

### 5. user_word_skill_progress
- Migration 0023 : **CHECK `skill in (8 valeurs)`** ; migration 0024 : récence/stabilité. RLS `auth.uid() = user_id`.
- **Décision Q1 : AUCUNE migration.** La production guidée est **auto-évaluée** (pas de verdict objectif), donc aucune compétence de maîtrise à alimenter. L'extension `pronunciation_recognition` / `pronunciation_production` est **conçue mais différée** à Q2/Q3 (exigera une migration additive du CHECK).

### 6. Curriculum Al-Fatiha
- 8 leçons · **26 formes uniques** · 56 entrées `lesson_words` (le curriculum cumulatif répète certains mots entre leçons).

### 7. Données disponibles
- `arabic` (diacritiques embarquées) 26/26 · `transliteration` 26/26 (aide secondaire) · audio 26/26 (Muallim) · glose FR 26/26 (25 word + 1 lemma).
- **phonèmes 0 · règles 0 · makhraj 0** — le conseil phonétique Q1 sera donc **dérivé du texte arabe réel en code pur** (aucun import, aucune table).

### 8. Microphone
- Avant Q1 : `getUserMedia`/`MediaRecorder`/`SpeechRecognition` = 0 occurrence.
- API navigateur `getUserMedia` + `MediaRecorder` (local), permission **uniquement au clic**, fallback sans micro.

## Conclusion

**Aucun problème architectural bloquant.** Le socle Q1 est réalisable **sans migration, sans nouvelle compétence, sans modification du séquenceur**, en réutilisant : moteur (nouveau type auto-évalué) + AudioPlayer 24F + dérivation phonétique en code pur + capture micro locale.
