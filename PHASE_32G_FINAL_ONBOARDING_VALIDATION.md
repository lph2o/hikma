# PHASE 32G — FINAL ONBOARDING VALIDATION & PRODUCTION READINESS

## Statut final

`PHASE_32G_VALIDATION_BLOCKED`

La validation automatisée et la vérification serveur sont positives. La validation navigateur authentifiée post-Phase 32F n’a pas pu être exécutée dans l’environnement disponible ; la phase ne peut donc pas être déclarée complète.

## BEFORE

- Phase 32F avait implémenté le polish UX : récapitulatif contextuel, session expirée actionnable, carte recommandée renforcée, mascottes secondaires et microcopy revue.
- Les validations automatisées Phase 32F étaient vertes.
- La validation navigateur post-polish restait explicitement `BROWSER_VALIDATION_PENDING`.
- Aucun commit n’a été créé et les changements non commités ont été conservés.

## TEST ENVIRONMENT

- Projet : `/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma`
- Build testé : Next.js 16.3.0, build production local
- Serveur : `next start` déjà actif sur `http://localhost:3000`
- Vérification serveur visiteur : requête HTTP directe
- Navigateur : tentative via le navigateur contrôlable de l’environnement ; aucune session authentifiée exploitable n’a pu être ouverte dans cette exécution
- Aucun nouveau compte Supabase n’a été créé pour éviter une mutation de données sans possibilité de parcourir et nettoyer réellement le flux navigateur

## AUTHENTICATION

### Visiteur

Vérifié par HTTP :

```text
GET /onboarding
→ 307 Temporary Redirect
→ Location: /login
```

Le rendu serveur de `/onboarding` vérifie `auth.getUser()` avant de charger le catalogue ou de rendre `OnboardingForm`.

### Utilisateur authentifié, historique et terminé

Les invariants du code restent présents et sont couverts par les tests existants :

- `CURRENT_ONBOARDING_VERSION = 2` ;
- `isOnboardingComplete()` exige `onboarded` et une version au moins égale à 2 ;
- un onboarding incomplet est redirigé vers `/onboarding` par le flux d’authentification ;
- un onboarding terminé est redirigé vers `/dashboard` ;
- aucun reset de progression n’est exécuté par `completeOnboarding`.

Le parcours navigateur réel de ces scénarios n’a pas pu être rejoué dans cette phase.

## ONBOARDING ET PERSONALIZATION

Les contrôles statiques et tests ciblés confirment :

- les choix sont conservés dans l’état local jusqu’à la sauvegarde ;
- la recommandation reste issue du catalogue dynamique ;
- une sélection explicite est prioritaire dans le récapitulatif et la persistance ;
- le récapitulatif distingue recommandation, choix explicite et fallback ;
- le nombre de leçons affiché vient de `SurahCatalogItem.lessonCount` ;
- aucune valeur de sourate ou de slug n’est codée en dur dans la transition finale.

La persistance réelle et la destination réelle n’ont pas été rejouées dans un navigateur post-32F pendant cette phase.

## AL-MĀʿŪN ET SÉCURITÉ CATALOGUE

Les garde-fous de code restent en place :

- `IN_PREPARATION` n’est pas inclus dans les choix démarrables côté client ;
- `completeOnboarding` revalide côté serveur la sourate choisie ;
- une préférence `IN_PREPARATION` ou inexistante est rejetée ;
- aucun CTA de démarrage n’est généré pour cette catégorie.

Le test navigateur spécifique de l’interface `107 Al-Māʿūn` reste à exécuter avec une session réelle.

## CELEBRATION

Le code conserve l’ordre attendu :

```text
réponses → completeOnboarding ok → célébration → router.replace(firstLessonSlug)
```

- la célébration n’est pas rendue après un résultat d’erreur ;
- la durée reste courte ;
- les accents teal/dorés sont conservés ;
- `prefers-reduced-motion` désactive les mouvements des confettis tout en conservant le feedback visuel.

La présence visuelle réelle et la variante reduced-motion n’ont pas été observées dans le navigateur post-32F.

## RESPONSIVE / RTL

Les dimensions suivantes avaient été validées réellement avant le polish : `390×844`, `375×812`, `1280×720`. Une nouvelle validation est obligatoire après les changements 32F et n’a pas pu être exécutée dans cette phase.

Statut : `BROWSER_VALIDATION_PENDING`

À revalider : overflow, CTA, mascottes secondaires, récapitulatif, confettis, cartes sourates, arabe/RTL et première leçon aux trois dimensions.

## SESSION EXPIRÉE

Le code 32F distingue désormais le message serveur connu `Connecte-toi pour continuer.` et rend :

```text
Ta session a expiré
Reconnecte-toi pour terminer ton parcours.
Se reconnecter → /login
```

Les tests unitaires couvrent cette distinction. La simulation navigateur réelle d’une expiration pendant la sauvegarde reste non exécutée.

## DASHBOARD, /SURAHS ET /PROFILE

La validation fonctionnelle réelle post-32F de ces routes n’a pas pu être effectuée sans session navigateur authentifiée. Elle reste à faire :

- dashboard personnalisé et hiérarchie progression/révision ;
- catalogue `/surahs`, dont Al-Māʿūn visible mais non démarrable ;
- préférences `/profile` et persistance sans modification de progression.

## CONSOLE ET PERFORMANCE

- Le build production compile sans erreur.
- Aucun nouveau chargement global de mots, exercices, MASAQ ou scheduler n’a été introduit dans les fichiers 32F.
- La console navigateur authentifiée post-32F n’a pas pu être collectée ; aucune conclusion `0 erreur` ne doit être déclarée pour cette phase.

## TESTS AUTOMATISÉS

| Commande | Résultat |
|---|---|
| `npm test` | PASS — 46 fichiers, 565 tests |
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS — Next.js 16.3.0 production |

## NON-RÉGRESSION

Aucun fichier de grading, scoring, SRS, mastery, scheduler, interleaving, curriculum, progression pédagogique, Quran, traduction, audio, MASAQ, LessonPlayer ou migration n’a été modifié pour cette validation.

Les compteurs de données et invariants métier n’ont pas été recalculés dans cette phase, car cela aurait nécessité une procédure de vérification externe supplémentaire. Ils ne sont pas déclarés revalidés ici.

## LIMITATIONS ET SUITE REQUISE

Blocage précis : le navigateur contrôlable disponible dans cette exécution ne permettait pas d’ouvrir une nouvelle session authentifiée exploitable ; les tentatives d’ouverture sont restées sur `about:blank`. La validation HTTP visiteur est possible et a passé, mais elle ne remplace pas la QA navigateur demandée.

Pour débloquer la phase, il faut exécuter dans un navigateur réel :

1. un compte nouveau authentifié ;
2. un scénario historique `onboarding_version < 2` ;
3. le parcours complet avec une sourate `READY` autre qu’Al-Fātiḥah ;
4. Al-Māʿūn visible et non démarrable ;
5. célébration et reduced-motion ;
6. dashboard, `/surahs`, `/profile`, logout ;
7. les trois viewports `390×844`, `375×812`, `1280×720` ;
8. console sans erreur ni warning React/hydratation.

`PHASE_32G_VALIDATION_BLOCKED`
