# PHASE 34C — SURAH PROGRESS UX & QURANPROGRESS-INSPIRED EXPERIENCE

## Statut

`PHASE_34C_COMPLETE_WITH_BROWSER_VALIDATION_LIMITATION`

Statut initial : `PHASE_34C_READY_FOR_IMPLEMENTATION`.

## BEFORE_STATE

`/surahs` (Phase 34B) affichait déjà la progression réelle par sourate (`not_started` / `in_progress` / `completed`, `completedLessons`, `totalLessons`, `nextLessonSlug`, `activeLessonSlug`) avec les sections `Continuer ton parcours`, `Pour toi`, `Continuer`, `Prêtes à apprendre`, `Parcours terminés`, `Bientôt disponibles`. Le header était un simple titre, sans hero, sans compteurs ni encouragement, et aucune micro-célébration de fin de sourate n'existait.

## DESIGN_DECISIONS

Inspiration conceptuelle de QuranProgress (sentiment de parcours personnel, visibilité de l'avancement, distinction commencé/terminé, accès rapide au prochain point) — **sans copier son interface**, sans gamification, badges artificiels, scores de maîtrise, compétition ni streak.

- **Teal** reste la couleur structurante (CTA, navigation, structure).
- **Doré Hikma** (`hikma-gold` / `-muted` / `-bright`) utilisé avec parcimonie pour progression, réussite, recommandation et célébration.
- La progression reste fondée exclusivement sur `computeSurahProgress` (données réelles) ; les préférences ne fabriquent jamais une progression.
- Textes déterministes et testables dans une couche pure (`surah-progress-copy.ts`).

## IMPLEMENTATION

### Nouveau module pur `lib/learning/surah-progress-copy.ts`

- `getSurahHeroCopy(stats)` → `{ title, subtitle, footnote }` (accueil, progression, « tout terminé », catalogue vide) ;
- `getSurahContinueEncouragement(completedLessons, totalLessons)` → encouragement doux, jamais culpabilisant ;
- `getSurahCompletionCopy(surahName?)` → wording de célébration (`Parcours terminé !`).

Aucune dépendance Supabase / React / Next / navigateur / MASAQ / moteur.

### Hero `/surahs` (nouveau)

Hero personnalisé (halo doré subtil + mascotte, aucun gradient agressif) :

- titre « Mes sourates » ;
- sous-titre selon la progression réelle (« Commence ton parcours… » / « Continue ton apprentissage… » / « Bravo, tu as parcouru toutes les sourates… ») ;
- note de compteurs **réels** (`X sourates commencées · Y terminées`) ou « Une première sourate t'attend. » ;
- aucun chiffre pour les sourates `IN_PREPARATION`, les préférences ou les recommandations.

### Cartes

- **`Continuer ton parcours` / `Reprendre ton apprentissage`** : la carte principale met en avant la sourate la plus pertinente (session active d'abord, puis progression la plus avancée), avec barre de progression accessible, encouragement et CTA `Continuer` / `Reprendre` vers `nextLessonSlug` réel.
- **`Continuer`** : autres sourates `in_progress`.
- **`Parcours terminés`** : badge « ✓ Terminée » (icône + texte), `N / N leçons`, CTA `Revoir` (non destructif, vers la 1re leçon du parcours).
- **`Pour toi`** : recommandation distincte, avec `getRecommendationReason` et durée, uniquement si la sourate recommandée est réellement `not_started`.
- **`Bientôt disponibles`** : `IN_PREPARATION` sans barre, sans progression, sans CTA (Al-Māʿūn 107 protégée).

### Célébration (fin de sourate)

Dans `components/learn/lesson-complete.tsx` : lorsqu'une leçon est la **dernière** du parcours (`nextLesson === null` et `pathProgress.total > 0`), une micro-célébration légère s'affiche — confettis dorés/teal (CSS uniquement, classes existantes), titre « Parcours terminé ! », message et CTA « Voir mes sourates ». Déclenchement **uniquement** à la transition réelle vers `completed`, jamais à chaque ouverture. `prefers-reduced-motion` est respecté (les confettis sont neutralisés par le CSS existant).

## DATA_FLOW

```
getSurahCatalog + getSurahProgressByUser (batch, Phase 34B)
  → groupBy surah (mémoire)
  → computeSurahProgress (pure)
  → getSurahHeroCopy / getSurahContinueEncouragement (pure, présentation)
  → render
```

Aucune nouvelle donnée persistée, aucun second moteur, aucune préférence dans le calcul.

## UX_CHANGES

- `/surahs` donne une sensation immédiate de « voici où j'en suis » (hero + compteurs + carte principale + états par section).
- `Continuer`/`Reprendre` pointent toujours vers une vraie leçon (`nextLessonSlug`), jamais une destination inventée.
- `completed` reste « parcours de découverte terminé » (pas maîtrise/mémorisation/SRS).
- États vides explicites : aucun parcours commencé (message positif), catalogue vide (contrôlé), tout terminé (« Bravo… »), sans culpabilisation.

## CELEBRATION

Confettis CSS courts (1,8 s), dorés/teal, réutilisant `onboarding-confetti` existant ; respect `prefers-reduced-motion` ; déclenchement borné à la vraie transition `completed` sur l'écran de fin de leçon.

## ACCESSIBILITY

- barre de progression via `HikmaProgress` (`role="progressbar"` + `aria-valuenow/min/max` + libellé texte `X / Y leçons`) ;
- état `completed` transmis par **icône + texte** (pas uniquement la couleur) ;
- CTA boutons accessibles, focus visible conservé par le design system ;
- `prefers-reduced-motion` respecté pour la célébration.

## RTL

Aucun contenu Quran inversé ; la barre de progression utilise `transformOrigin: left` existant. Validation RTL réelle non exécutée (voir BROWSER_VALIDATION).

## PERFORMANCE

Aucun N+1 : la progression reste calculée en batch puis groupée en mémoire (inchangé depuis Phase 34B). Aucun fetch client par carte, aucun chargement de mots/MASAQ.

## TESTS

- `tests/surah-progress-copy.test.ts` (12 tests) : hero sans progression / avec progression / tout terminé / catalogue vide / compteurs sans `IN_PREPARATION` ; encouragements (début, milieu, avancé, total nul) ; copy de complétion (nom fourni, null, vide).
- Phase 34B conservée : `tests/surah-progress.test.ts` (10 tests).

Résultat global : **614 tests passent (49 fichiers)**.

## BROWSER_VALIDATION

`BROWSER_VALIDATION_LIMITED`

Aucun navigateur automatisé n'a pu être attaché à cette session. Les scénarios visuels (hero, carte principale, progression, sections, CTA, responsive 390×844 / 375×812 / 1280×720, RTL, clavier, contraste, animation, `prefers-reduced-motion`) n'ont **pas** été déclarés PASS.

## NON_REGRESSION

Aucune modification : grading, scoring, réponses libres, SRS, mastery, scheduler, interleaving, curriculum, `LessonPlayer`, audio, données Quran, traductions, MASAQ, corpus lexical, onboarding, préférences, authentification, RLS. Les utilisateurs historiques conservent intégralement leur progression. Aucune écriture Supabase n'est introduite par `/surahs`.

Invariants préservés : 114 sourates, 90 leçons publiées, 14 parcours exposables, Al-Māʿūn 107 `IN_PREPARATION`, `word_translations = 263`, MASAQ `97 / 170`, `FATIHAH_REFERENCE_LOCKED`.

## LIMITATIONS

- La célébration utilise un message générique (« cette sourate ») plutôt que le nom de la sourate, pour ne pas ajouter une requête de nom à l'écran de fin de leçon.
- Validation navigateur non exécutée (voir ci-dessus) : l'esthétique finale (halo doré, densité mobile, animation) reste à confirmer visuellement.
- Pas de nouveau composant partagé pour la barre de progression : `HikmaProgress` existant est réutilisé.

## AFTER_STATE

`/surahs` est devenu un espace personnel de progression : hero avec compteurs réels, carte principale de reprise, encouragement doux, sections claires commencé/terminé/disponible/en préparation, et une micro-célébration discrète au passage d'une sourate à `completed` — le tout sans nouveau moteur, sans migration et sans falsification.

## NEXT_RECOMMENDATION

1. Valider visuellement la phase en navigateur réel (3 viewports + RTL + reduced-motion) et ajuster le hero/cartes.
2. Passer le nom de la sourate à l'écran de fin pour une célébration nominative (léger ajout de prop, sans nouvelle requête si le nom est déjà disponible côté page).
3. Envisager une vue « détails de la sourate » (progression par leçon) si une navigation dédiée est souhaitée.

---

`PHASE_34C_COMPLETE_WITH_BROWSER_VALIDATION_LIMITATION`

Aucun commit créé.
