# PHASE 34B — SURAH PROGRESS PRESENTATION & DISCOVERY UX

## Statut

`PHASE_34B_SURAH_PROGRESS_COMPLETE_READY_FOR_APPROVAL`

Statut initial : `PHASE_34B_READY_FOR_IMPLEMENTATION` (suite de `PHASE_34A_PROGRESS_BY_SURAH_AUDIT_COMPLETE_READY_FOR_DESIGN`).

## BEFORE_STATE

`/surahs` était un catalogue statique : `getSurahCatalog` (user-agnostic) classait les sourates en `REFERENCE` / `READY` / `IN_PREPARATION`, avec une carte « Pour commencer » de recommandation (Phase 33B) mais **aucune** progression utilisateur. La progression réelle n'était calculée que pour le parcours par défaut (Al-Fātiḥah) via `getLearningContext` sur le dashboard.

## DATA_FLOW

```
getSurahCatalog(client)               → catalogue statique (nom, state, lessonCount, firstLessonSlug)
getSurahProgressByUser(client, userId) → progression par sourate (status, completed/total, nextLessonSlug, activeLessonSlug)

réutilise :
  learning_paths → units → lessons (publiées) → lesson_words (is_new = true)
  user_word_progress (batch, via getUserWordProgress)
  lesson_sessions (status = 'in_progress', batch)

calcul pur :
  computeSurahProgress → computeLessonStatuses (lib/learning/session.ts)
```

Aucune nouvelle donnée n'est persistée. Aucune préférence (`preferred_surah_number`, etc.) n'entre dans le calcul.

## SURAH_PROGRESS_MODEL

`lib/learning/surah-progress.ts` (fonction pure, sans Supabase / React / Next / MASAQ / recommandation) :

```ts
type SurahProgressStatus = "not_started" | "in_progress" | "completed";

type SurahProgress = {
  surahNumber: number;
  status: SurahProgressStatus;
  completedLessons: number;
  totalLessons: number;
  nextLessonSlug: string | null;   // session active → IN_PROGRESS → 1re non terminée
  activeLessonSlug: string | null; // leçon avec session active
};
```

Définitions :

- `not_started` : aucune leçon démarrable avec session active, `IN_PROGRESS` ou `COMPLETED`.
- `in_progress` : au moins une leçon réellement commencée (session active ou mots commencés), mais pas toutes terminées.
- `completed` : toutes les leçons publiées/démarrables sont `COMPLETED` — « parcours de découverte terminé », **pas** « maîtrise complète » ni « aucune révision SRS due » (mêmes semantics que le dashboard).

## QUERY_STRATEGY

`getSurahProgressByUser` (dans `lib/learning/queries.ts`) — **aucun N+1** :

1. `learning_paths` rattachés à une sourate (1 requête) ;
2. `units` (1 requête batch) ;
3. `lessons` publiées (1 requête batch) ;
4. `lesson_words` `is_new = true` (1 requête batch) ;
5. `user_word_progress` (1 requête batch, `getUserWordProgress`) ;
6. `lesson_sessions` `in_progress` (1 requête batch).

Le regroupement par sourate et le tri sont faits **en mémoire**, puis chaque sourate passe dans `computeSurahProgress` (pure). Aucune requête par sourate ni par leçon.

## IMPLEMENTATION

- **Nouveau** : `lib/learning/surah-progress.ts` (`computeSurahProgress` + types).
- **Modifié** : `lib/learning/queries.ts` (ajout de `getSurahProgressByUser`).
- **Réécrit** : `app/(app)/surahs/page.tsx` (hiérarchie par progression).
- **Nouveau** : `tests/surah-progress.test.ts` (10 tests).

Aucune modification : `computeLessonStatuses`, `session.ts`, `LessonPlayer`, SRS, mastery, scheduler, curriculum, données Quran, `dashboard/page.tsx`, `profile/page.tsx`.

## UX_CHANGES

`/surahs` affiche désormais, en sections conditionnelles (une section vide n'est pas rendue) :

1. **Continuer ton parcours** — si au moins une sourate est `in_progress`, met en avant la plus pertinente (session active → la plus avancée) avec progression réelle + CTA `Continuer`.
2. **Pour toi** — sinon, la recommandation personnalisée (Phase 33B), uniquement si la sourate recommandée est réellement `not_started`.
3. **Continuer** — les autres sourates `in_progress`.
4. **Prêtes à apprendre** — les sourates `not_started` (`REFERENCE`/`READY`), sans masquer les disponibles ; la recommandation mise en avant n'est pas dupliquée.
5. **Parcours terminés** — les sourates `completed` (badge « ✓ Terminée », `8 / 8 leçons`, CTA `Revoir` non destructif vers la 1re leçon du parcours).
6. **Bientôt disponibles** — `IN_PREPARATION` sans CTA ni progression (Al-Māʿūn 107 protégée).

CTA par statut : `Commencer` (not_started), `Continuer` (in_progress, vers la vraie leçon `nextLessonSlug`), `Revoir` (completed, vers la 1re leçon existante). La barre de progression est `completedLessons / totalLessons`, jamais une maîtrise. Accessibilité : `HikmaProgress` (role progressbar + aria) réutilisé, état `completed` transmis par **icône + texte** (pas uniquement par couleur), `IN_PREPARATION` avec verrou.

## TESTS

`tests/surah-progress.test.ts` (10 tests) : not_started / in_progress 1/8 / completed 8/8 / session active sans mot / session active prioritaire / état mixte / leçon en cours partielle / sourate sans leçon / déterminisme sans mutation / absence de préférence en entrée.

Résultat global : **602 tests passent (48 fichiers)**.

## PERFORMANCE

- `/surahs` : `getSurahCatalog` + `getSurahProgressByUser` = quelques requêtes batch (aucune boucle par carte/sourate/leçon).
- Aucun chargement de mots coraniques, d'exercices, d'audio ou de MASAQ pour la progression.
- La recommandation existante reste inchangée (pas de chargement lexical supplémentaire).

## NON_REGRESSION

Aucune donnée, migration, seed ni moteur modifiés. Invariants préservés par construction : 114 sourates, 90 leçons publiées, 14 parcours exposables, Al-Māʿūn 107 `IN_PREPARATION`, `word_translations = 263`, MASAQ `97 / 170`, `FATIHAH_REFERENCE_LOCKED`. Grading, scoring, SRS, mastery, scheduler, interleaving, curriculum, `LessonPlayer`, audio, progression utilisateur : inchangés (lecture seule uniquement).

`preferred_surah_number` reste une préférence : `Continuer` n'est produit que par une vraie session/activité, jamais par une préférence.

## BROWSER_VALIDATION

`BROWSER_VALIDATION_LIMITED`

Aucun navigateur automatisé n'a pu être attaché à cette session. Les scénarios responsive (390×844, 375×812, 1280×720), l'accessibilité clavier/focus/contraste, le RTL et `prefers-reduced-motion` n'ont **pas** été déclarés PASS. Aucune micro-célébration n'a été ajoutée (le déclenchement sûr d'une transition `completed` nécessiterait un contexte client approprié et une validation navigateur réelle — conservé pour une phase ultérieure).

## LIMITATIONS

- La détection `in_progress` d'une leçon commencée mais non persistée repose sur `lesson_sessions.status = 'in_progress'` ; une session abandonnée maintient donc la sourate en `in_progress` (comportement voulu : il y a une vraie session à reprendre).
- `Revoir` pointe vers la première leçon du parcours terminé (destination existante), pas vers une nouvelle route de révision par sourate.
- Pas de micro-célébration de transition `completed` (voir BROWSER_VALIDATION).

## AFTER_STATE

`/surahs` est une page de découverte **et** de progression : l'utilisateur voit instantanément ce qu'il a commencé, où il en est, ce qu'il peut commencer, continuer ou revoir — sans second moteur, sans migration et sans falsification (la progression provient exclusivement de l'activité réelle).

## DECISION

`PHASE_34B_SURAH_PROGRESS_COMPLETE_READY_FOR_APPROVAL`

Aucun commit créé.
