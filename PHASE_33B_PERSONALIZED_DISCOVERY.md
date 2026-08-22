# PHASE 33B — PERSONALIZED DISCOVERY & DASHBOARD UX

## Statut

`PHASE_33B_IMPLEMENTED`

Statut initial : `PHASE_33B_READY_FOR_IMPLEMENTATION` (suite de `PHASE_33A_AUDIT_COMPLETE_READY_FOR_DESIGN` et de la Phase 32 acceptée).

## BEFORE_STATE

La Phase 33A (audit read-only) a établi l'état suivant :

- les préférences existent dans `user_settings` (`display_name`, `learning_goal`, `arabic_reading_level`, `quran_familiarity`, `daily_duration`, `learning_pace`, `preferred_surah_number`) et sont modifiables depuis `/profile` ;
- `recommendStartingSurah(profile, catalog)` est une fonction pure qui respecte le choix explicite, la préférence courte, puis le fallback Al-Fātiḥah ;
- la progression réelle (session active → prochaine leçon → révision due) domine déjà le CTA principal du dashboard ;
- `IN_PREPARATION` (dont Al-Māʿūn 107) n'expose aucun CTA de démarrage ;
- **mais** `learning_goal`, `quran_familiarity` et `learning_pace` n'avaient aucune conséquence visible hors onboarding/récapitulatif, et la raison d'une recommandation n'était jamais expliquée (texte générique « Une bonne première étape pour découvrir Hikma. »).

## CHANGES

### 1. Nouveau module pur `lib/learning/personalization.ts`

Fonctions pures, déterministes, sans dépendance à Supabase, au navigateur ou au moteur pédagogique. Elles ne chargent aucune donnée Quran et ne modifient jamais le grading, le scoring, le SRS, la maîtrise, le scheduler, l'interleaving, le curriculum ni la progression.

### 2. Dashboard `app/(app)/dashboard/page.tsx`

- la salutation et la phrase d'ouverture proviennent désormais de `getPersonalizedLearningCopy(profile, { firstVisit, allDone })` ;
- la carte « Pour commencer » générique est remplacée par :
  - une carte **« Pour toi »** (dorée, secondaire) affichée uniquement sans action pédagogique prioritaire (session active, prochaine leçon, révision due) — titre, sourate réelle, justification via `getRecommendationReason`, durée via `getDailyDurationLabel`, CTA « Découvrir cette sourate » ;
  - une carte **« Pour plus tard »** (suggestion secondaire) affichée lorsqu'une progression réelle existe ET que l'utilisateur a explicitement choisi une sourate différente de celle en cours : « Ta sourate de départ préférée. » ;
- le prochain pas réel (session à reprendre / prochaine leçon / révision) reste strictement prioritaire : la recommandation ne le remplace jamais.

### 3. `/surahs` `app/(app)/surahs/page.tsx`

- la carte « Recommandée pour toi » affiche maintenant la **raison de la recommandation** (`getRecommendationReason`) et la **durée** (`getDailyDurationLabel`) ;
- la carte vedette passe en accent doré (`border-hikma-gold/40`), cohérent avec le rôle « recommandation » du doré ;
- les états `REFERENCE` / `READY` / `IN_PREPARATION` sont conservés strictement : aucun CTA, bouton ni lien pour `IN_PREPARATION` (Al-Māʿūn 107 protégée).

### 4. Profil `components/app/learning-preferences.tsx`

Chaque préférence reçoit une courte explication de confiance :

- « Pourquoi apprends-tu ? » → « Cela nous aide à adapter certains messages et recommandations. »
- « Comment lis-tu l'arabe ? » → « Ce choix ne modifie pas la correction de tes réponses. »
- « Rythme » → « Une préférence pour personnaliser ton expérience, pas une obligation. »
- plus des explications analogues pour le nom, la familiarité, le temps souhaité et la sourate de départ.

### 5. Harmonisation de la durée 30 (section 8)

Le libellé de la durée 30 devient **« Plus de 20 minutes »** (jamais « +20 min » / « Plus de 20 min ») dans le module de copy, la préférence de profil et le récapitulatif d'onboarding. La valeur 30 ne crée ni ne modifie aucun `daily_goal`.

## AFTER_STATE

- le dashboard « comprend » pourquoi l'utilisateur est là (objectif, familiarité, rythme, nom) via une phrase d'ouverture naturelle, sans jamais diagnostiquer de niveau ;
- chaque recommandation est **justifiée et vraie** (choix explicite, préférence courte, profil débutant, fallback Al-Fātiḥah, autre fallback) ;
- la découverte personnalisée reste secondaire et n'apparaît que sans action pédagogique prioritaire ;
- aucun affichage de progression par sourate (« 20 % terminé », « commencée », « 3/8 leçons », « en cours ») n'a été introduit ;
- les utilisateurs historiques (toutes préférences `null`) et les profils partiels restent parfaitement fonctionnels, sans valeur inventée.

## Fonctions ajoutées

| Fonction | Rôle |
|---|---|
| `getPersonalizedLearningCopy(profile, context)` | salutation + phrase d'ouverture composée (objectif, familiarité, rythme, nom) |
| `getRecommendationReason(profile, recommendation)` | raison courte et vraie d'une recommandation |
| `getLearningGoalCopy(goal)` | copy par `learning_goal` (section 5) |
| `getQuranFamiliarityCopy(familiarity)` | copy par `quran_familiarity` (section 6) |
| `getLearningPaceCopy(pace)` | copy par `learning_pace` (section 7) |
| `getDailyDurationLabel(duration)` | présentation de `daily_duration` (section 8) |

## Tests

Nouveau fichier : `tests/personalized-learning-copy.test.ts` (27 tests).

Couverture :

- chaque valeur de `learning_goal`, `quran_familiarity`, `learning_pace`, `daily_duration` ;
- valeurs `null` (aucune valeur inventée) ;
- combinaisons (ex. `understand_recitation` + `daily_short` → « Un peu chaque jour pour mieux comprendre les mots que tu récites. ») ;
- choix explicite prioritaire sur la durée courte ;
- profil débutant, durée courte, fallback Al-Fātiḥah, autre fallback ;
- choix `IN_PREPARATION` refusé (jamais présenté comme « choisi ») ;
- recommandation `null` ;
- pureté (aucune mutation du profil, sortie déterministe).

Résultat global : **592 tests passent (47 fichiers)**.

## Validations

- `npx tsc --noEmit` : sans erreur ;
- `npx eslint` (fichiers modifiés) : sans erreur ;
- `npx vitest run` : 592/592 ;
- `npm run build` (Next.js 16.3.0, Turbopack) : compilation, typecheck et génération de routes réussis (`/dashboard`, `/surahs`, `/profile` inclus) ;
- validation navigateur : **non exécutée** — voir limitations ci-dessous.

## Limitations navigateur

`BROWSER_VALIDATION_LIMITED`

Aucun navigateur automatisé n'a pu être attaché à cette session (aucun runner Playwright/Puppeteer exposé, pas de serveur interactif dédié). Les scénarios de la section 27 (dashboard première visite / avec nom / sans nom / progression active / révision / préférences NULL, `/surahs` READY / REFERENCE / IN_PREPARATION / Al-Māʿūn sans CTA, `/profile` sauvegarde, auth visiteur / session expirée, clavier / focus / contraste / RTL / `prefers-reduced-motion`) **n'ont pas été déclarés PASS**. Ils restent à valider en navigateur réel aux viewports 390×844, 375×812 et 1280×720.

## Non-régression

Aucun fichier de données, de migration, de seed ou de corpus n'a été modifié. La présente phase ne touche que la couche de présentation :

- `lib/learning/personalization.ts` (nouveau) ;
- `tests/personalized-learning-copy.test.ts` (nouveau) ;
- `app/(app)/dashboard/page.tsx`, `app/(app)/surahs/page.tsx` ;
- `components/app/learning-preferences.tsx`, `components/app/onboarding-form.tsx` (libellé durée uniquement).

Invariants préservés par construction (aucun changement dans les couches concernées) :

- grading, scoring, SRS, mastery, scheduler, interleaving, curriculum, progression, `LessonPlayer`, exercices, réponses libres, audio, données Quran, traductions, MASAQ, corpus lexical, `FATIHAH_REFERENCE_LOCKED` ;
- 114 sourates, 90 leçons publiées, 14 parcours exposables ;
- Al-Māʿūn 107 `IN_PREPARATION` (sans CTA) ;
- `word_translations = 263`, MASAQ `97 / 170` ;
- aucune nouvelle requête par sourate, aucun N+1, aucun chargement de mots/exercices/MASAQ : la personnalisation réutilise uniquement le catalogue et les réglages déjà chargés.

La vérification base de données des compteurs (114 / 90 / 14 / 263 / 97) n'a pas été relancée : elle est hors périmètre de cette phase de présentation et inchangée par le diff.

## Décision finale

`PHASE_33B_IMPLEMENTED`

La personnalisation ressentie est ajoutée sous forme d'une couche d'expérience pure et testée, sans rendre Hikma plus complexe. Le prochain pas réel reste roi : la progression réelle demeure la vérité, et la personnalisation n'en est que la présentation.

Aucun commit n'a été créé, conformément à la section 31.
