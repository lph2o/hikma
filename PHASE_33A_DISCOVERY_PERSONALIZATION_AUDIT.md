# PHASE 33A — Discovery & Personalization Audit

## Statut

`PHASE_33A_AUDIT_COMPLETE_READY_FOR_DESIGN`

Mode : `READ_ONLY`. Aucun code source, donnée, migration ou base Supabase n’a été modifié. Les changements non commités ont été conservés.

## Résumé

La base de personnalisation de la Phase 32 est présente : préférences dans `user_settings`, garde serveur de `/onboarding`, catalogue de sourates déterministe, recommandation pure et préférences modifiables depuis `/profile`.

Le dashboard sépare correctement le prochain pas pédagogique réel de la recommandation de découverte. La progression réelle reste fondée sur les sessions, statuts de leçons, `user_word_progress` et révisions ; elle n’est jamais inférée depuis les réponses déclaratives de l’onboarding.

Le principal manque est la personnalisation ressentie : plusieurs champs sont collectés et affichés dans le profil/récapitulatif, mais n’ont pas encore de conséquence visible dans les microcopies du dashboard ou l’explication de la découverte.

## Données réellement disponibles

`user_settings` expose :

| Champ | Nature | Usage observé |
|---|---|---|
| `display_name` | affichage | salutation dashboard, profil, récapitulatif |
| `learning_goal` | objectif déclaré | onboarding/récapitulatif et profil |
| `arabic_reading_level` | auto-déclaration | recommandation de parcours court et profil |
| `quran_familiarity` | auto-déclaration | onboarding/récapitulatif et profil |
| `daily_duration` | durée souhaitée | recommandation de parcours court et préférences |
| `learning_pace` | rythme déclaré | onboarding/récapitulatif et profil |
| `preferred_surah_number` | choix explicite | recommandation onboarding, dashboard secondaire, `/surahs` |
| `onboarded`, `onboarding_version` | état d’accès | `isOnboardingComplete` |
| `daily_goal_type`, `daily_goal_value` | objectif quantifié | objectif quotidien réel du dashboard/profil |

Tous les champs de profil sont nullable. `getUserSettings` retourne `null` si la ligne est absente. Les utilisateurs historiques restent soumis à `CURRENT_ONBOARDING_VERSION = 2`, sans inférer les valeurs manquantes.

## Dashboard

### Faits établis

`app/(app)/dashboard/page.tsx` charge `getLearningContext`, les réglages, le catalogue, les objectifs quotidiens, les révisions et l’historique.

Le CTA principal suit cette priorité :

1. session active à reprendre (`activeSession`) ;
2. prochaine leçon dérivée des statuts réels ;
3. révision si le parcours est terminé ou sans prochaine leçon.

`firstVisit` repose sur l’absence de mots vus, de leçons terminées et de session active. Le nom personnalise la salutation, mais ne modifie aucun état pédagogique. La recommandation `recommendStartingSurah` n’apparaît qu’en première visite ou lorsqu’il n’existe pas de prochaine leçon ; elle reste donc secondaire par rapport à la progression réelle.

### Personnalisation déjà présente

- salutation avec `display_name` ;
- carte « Pour commencer » alimentée par durée, niveau de lecture et choix de sourate ;
- objectif quotidien et révisions calculés depuis les données réelles ;
- textes de parcours basés sur la leçon réellement disponible.

### Manques

- `learning_goal` n’influence pas la copy du prochain pas ;
- `quran_familiarity` n’influence pas la présentation de la découverte ;
- `learning_pace` n’est pas encore explicité dans le dashboard ;
- la raison d’une recommandation n’est pas expliquée à l’utilisateur.

## Catalogue `/surahs`

`getSurahCatalog` construit le catalogue depuis les parcours liés aux sourates et les leçons publiées. `classifySurahReadiness` applique :

- `REFERENCE` pour Al-Fātiḥah ;
- `READY` pour 100 % de couverture française validée ;
- `IN_PREPARATION` pour une couverture incomplète.

La classification n’utilise pas MASAQ et ne modifie aucune donnée pédagogique.

`app/(app)/surahs/page.tsx` :

- sépare `READY`/`REFERENCE` de `IN_PREPARATION` ;
- construit les CTA `Commencer` depuis `firstLessonSlug` pour les parcours disponibles ;
- affiche les parcours en préparation avec verrouillage et texte informatif, sans CTA de démarrage ;
- affiche en tête une recommandation basée sur `daily_duration`, `arabic_reading_level` et `preferred_surah_number`.

La page ne consomme pas `getLearningContext` par sourate : les cartes ne représentent donc pas actuellement une sourate « commencée » ou une progression par sourate. Il ne faut pas déduire cet état du profil.

## Profil et préférences

`app/(app)/profile/page.tsx` expose les statistiques dérivées de `getLearningContext`, l’objectif quotidien et `LearningPreferences`.

`components/app/learning-preferences.tsx` permet de modifier le nom, l’objectif, le niveau de lecture arabe, la familiarité avec le Coran, la durée, le rythme et la sourate de départ. Les champs vides deviennent `null` ou « Recommandation Hikma ».

`updateLearningPreferences` valide côté serveur les enums, la durée, le nom et la disponibilité de la sourate. `IN_PREPARATION` est refusée. L’action ne modifie pas la progression, les révisions ou les exercices. Le texte du profil l’explique explicitement.

## Recommandation auditée

`lib/learning/onboarding.ts` — `recommendStartingSurah(profile, catalog)` est une fonction pure qui reçoit uniquement le profil déclaratif et le catalogue. Elle applique :

1. filtrage des parcours `REFERENCE`/`READY` ;
2. priorité au choix explicite valide ;
3. en l’absence de choix exploitable, préférence pour le parcours le plus court si `dailyDuration` vaut 5 ou 10, ou si `arabicReadingLevel` vaut `beginner` ;
4. fallback Al-Fātiḥah (`surahNumber === 1`) ;
5. fallback au parcours démarrable le plus court si Al-Fātiḥah manque ;
6. `null` si aucun parcours n’est démarrable.

Les tests couvrent choix explicite, exclusion d’`IN_PREPARATION`, préférence courte, fallback Al-Fātiḥah et catalogue non démarrable.

### Point important

La progression réelle est prioritaire au niveau du dashboard, pas dans `recommendStartingSurah`, car cette fonction ne reçoit aucune progression. C’est acceptable si elle reste une recommandation de découverte. Il ne faut pas lui ajouter une inférence de maîtrise ou une pseudo-progression.

## Authentification et accès

- `/onboarding` vérifie `client.auth.getUser()` côté serveur et redirige les visiteurs vers `/login` ;
- un utilisateur dont `isOnboardingComplete(settings)` est vrai est redirigé vers `/dashboard` ;
- `app/(app)/layout.tsx` redirige les utilisateurs authentifiés dont l’onboarding est incomplet ou ancien vers `/onboarding` ;
- `proxy.ts` rafraîchit les claims/cookies Supabase lorsque la configuration est disponible ;
- après authentification, `redirectAfterAuthentication` choisit `/dashboard` ou `/onboarding` selon l’onboarding ;
- la déconnexion ne modifie ni préférences ni progression.

Observation : le layout applicatif ne redirige pas explicitement un visiteur non authentifié avant le rendu de chaque page enfant ; certaines pages savent afficher un état anonyme. La garde dédiée de `/onboarding` est néanmoins serveur et correcte.

## Matrice de personnalisation

| Surface | Progression réelle | Préférences | Verdict |
|---|---|---|---|
| Dashboard CTA principal | Oui | Non | Correct, prioritaire |
| Salutation dashboard | Non | `display_name` | Utile mais superficiel |
| Recommandation dashboard | Non | durée, lecture, sourate | Correct si découverte |
| Objectif/rythme | activité réelle | objectif quotidien | Correct, copy générique |
| Recommandation `/surahs` | Non | durée, lecture, sourate | Fonctionnelle, peu explicable |
| Cartes `/surahs` | Non | Non | Catalogue sans état commencé |
| Profil | statistiques réelles | tous les champs | Complet et réversible |
| Leçons/exercices | systèmes existants | Non | À préserver strictement |

## Verdict UX par axe

| Axe | Score | Verdict |
|---|---:|---|
| Navigation | 4/5 | Le prochain pas et les destinations principales sont accessibles ; la distinction découverte/progression doit rester explicite. |
| Hiérarchie | 4/5 | Le CTA réel domine ; la recommandation secondaire est correctement reléguée. |
| Cognition | 3/5 | Les choix sont déterministes, mais la raison d’une recommandation reste peu lisible. |
| Pédagogie | 4/5 | Aucune préférence déclarative ne simule une maîtrise ou une révision. |
| Accessibilité | 4/5 | Composants sémantiques et CTA présents ; audit navigateur détaillé à faire après design. |
| Responsive | 3/5 | Les layouts sont responsive par classes ; aucune validation navigateur Phase 33A n’a été exécutée. |

Score global : **3,7/5**. Base solide et sûre, avec un déficit surtout dans la personnalisation visible et son explication.

## Risques priorisés

### P0

Aucun blocage P0 identifié.

### P1

1. Ne jamais remplacer le CTA de progression réelle par la sourate choisie dans le profil.
2. Rendre perceptible l’utilité de `learning_goal`, `quran_familiarity` et `learning_pace` sans fabriquer d’état pédagogique.
3. Ne pas afficher une sourate comme « commencée » sans données de progression calculées séparément par sourate.

### P2

1. Expliquer si une recommandation vient du choix explicite, de la durée courte ou du fallback.
2. Contextualiser les microcopies génériques du dashboard sans toucher au moteur.
3. Ajouter des tests de présentation pour profil nul, choix indisponible, utilisateur historique, progression réelle et session active.

### P3

1. Clarifier dans le profil la portée de chaque préférence.
2. Harmoniser les explications des états `REFERENCE`, `READY` et `IN_PREPARATION`.

## Recommandations pour une éventuelle Phase 33B

1. Conserver le pipeline du dashboard et ajouter uniquement une aide pure de copy personnalisée.
2. Rendre la raison de recommandation compréhensible sans la présenter comme une preuve de maîtrise.
3. Donner une conséquence visible mais non intrusive aux objectifs déclarés et au rythme.
4. Décider séparément si `/surahs` doit afficher une progression par sourate, calculée uniquement depuis les données réelles.
5. Ajouter les tests des cas null, historique, préférence indisponible et progression existante.
6. Maintenir `IN_PREPARATION` informatif uniquement : aucun CTA, recommandation active, sélection ou accès direct inventé.

## Fichiers et fonctions inspectés

- `lib/learning/onboarding.ts` : `isOnboardingComplete`, `isStartableSurah`, `recommendStartingSurah` ;
- `lib/learning/queries.ts` : `getSurahCatalog`, `classifySurahReadiness`, `getLearningContext`, `getActiveLessonSession` ;
- `lib/learning/activity.ts` : `getUserSettings`, `insertUserSettings`, `updateUserSettings` ;
- `lib/learning/actions.ts` : `completeOnboarding`, `updateLearningPreferences`, `redirectAfterAuthentication` ;
- `app/(app)/dashboard/page.tsx`, `app/(app)/surahs/page.tsx`, `app/(app)/profile/page.tsx`, `app/(app)/layout.tsx` ;
- `app/(onboarding)/onboarding/page.tsx`, `components/app/learning-preferences.tsx`, `proxy.ts` ;
- `tests/onboarding-recommendation.test.ts`, `tests/activity.test.ts`.

## Hors périmètre et validation

Les invariants suivants n’ont pas été modifiés et ne font l’objet d’aucune recommandation de changement : grading, scoring, SRS, mastery, scheduler, interleaving, curriculum, progression, `LessonPlayer`, exercices, réponses libres, audio, données Quran, traductions, MASAQ, corpus lexical et `FATIHAH_REFERENCE_LOCKED`.

- lecture des sources et tests : effectuée ;
- écriture base/Supabase : non effectuée ;
- modification source/migration : non effectuée ;
- validation navigateur interactive Phase 33A : non exécutée ; aucun `PASS` navigateur n’est déclaré ;
- validations techniques antérieures : inchangées, non relancées dans cet audit read-only.

## Conclusion

La personnalisation est réelle mais principalement concentrée dans l’onboarding, le profil et la découverte. Le dashboard protège correctement la priorité de la progression réelle. La suite pertinente est une amélioration de présentation et d’explicabilité, sans modification du moteur d’apprentissage.

`PHASE_33A_AUDIT_COMPLETE_READY_FOR_DESIGN`
