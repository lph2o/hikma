# PHASE 36G — VALIDATION E2E AUTHENTIFIÉE DU RETRY ARABE

## Décision finale

`PHASE_36G_AUTHENTICATED_E2E_PASS`

La question centrale de la phase reçoit une réponse **OUI**, prouvée dans un
vrai navigateur (Playwright + Chrome headless, serveur local `localhost:3000`,
compte Supabase de test dédié) :

> Lorsqu'un utilisateur se trompe réellement en écrivant un mot arabe, Hikma
> lui permet réellement de le réécrire une fois, dans une expérience RTL
> claire, calme et utile, **sans toucher à son score ni à sa progression**.

---

## A. Ce qui a été réellement observé (VALIDATED)

### Environnement

- Navigateur réel : Chromium (channel `chrome`), headless, via Playwright
  (`/Users/alpha/.npm/_npx/e41f203b7505f1fb/node_modules/playwright`).
- Serveur local actif (`http://localhost:3000` → HTTP 200).
- Leçon de test : `surah-103-ayah-1` — « Verset 1 » d'Al-ʿAṣr (sourate 103,
  `READY`), **1 seul mot** `وَٱلْعَصْرِ` (« par le temps », sens FR validé).
  Séquence connectée observée : **7 exercices** (reconnaissance → rappel →
  audio/contexte/lemme selon disponibilité réelle).
- Comptes de test créés via l'API admin Supabase (`email_confirm: true`),
  `user_settings.onboarded = true, onboarding_version = 2` (aucun passage par
  l'onboarding), puis **supprimés** après chaque scénario.

### Scénario complet (reproduit sur les 3 viewports)

| Étape | Résultat observé |
| --- | --- |
| Connexion (`/login` → formulaire réel) | Redirection `/dashboard` (onboarded) ✅ |
| Découverte de la leçon | Anticipation « courte session » ✅ · Signature « ce mot, tu le récites peut-être déjà » ✅ |
| Exercice `MEANING_TO_FORM` atteint | Prompt réel : « « par le temps » — quel est le mot arabe ? » ✅ |
| Réponse arabe volontairement fausse (`كتاب`) | Verdict **officiel** non punitif : « Pas encore — Ce mot n'est pas encore fixé. Voici la bonne réponse. » + `Ta réponse / Réponse attendue` ✅ |
| Fin de la séquence principale | Retry arabe présenté (« Renforçons ton arabe ✨ ») ✅ |
| Étape retry | Titre « Réécris le mot arabe » ✅ |
| Champ arabe | `input[lang="ar"][dir="rtl"]` réel ✅ |
| Sens comme indice | « Le sens · par le temps » affiché ✅ |
| Forme canonique cachée avant tentative | **Absente** du DOM avant « Réessayer » ✅ |
| Réassurance | « Cette tentative ne change pas ton score. » présente **avant** la tentative ✅ |
| Cas **incorrect** (`كتاب`) | « Pas encore… » + forme canonique `وَٱلْعَصْرِ` révélée ✅ |
| Cas **exact** (`وَٱلْعَصْرِ`) | « Bien joué ✨ » + forme affichée ✅ |
| Fin du retry | « C'est bon 👏 » puis « Terminer la leçon » ✅ |
| Fin de leçon | « Leçon terminée » + « 1 mot renforcé en fin de session » ✅ |
| Célébration prématurée | **Aucune** (« Parcours terminé » non affiché) ✅ |
| Console | **0 erreur console / pageerror** sur les 3 viewports ✅ |
| Overflow horizontal | **Aucun** ✅ |

### Preuve d'absence de double comptabilisation (snapshots DB)

Pour un compte de test, comparaison de 6 tables (`user_word_progress`,
`user_activity_lessons`, `user_activity_words`, `review_items`,
`user_word_skill_progress`, `lesson_sessions`) à 3 instants :

| Instant | `user_word_progress` | `user_activity_lessons` | `user_activity_words` | `review_items` | `user_word_skill_progress` | `lesson_sessions` |
| --- | --- | --- | --- | --- | --- | --- |
| S1 — avant le retry | 0 | 0 | 0 | 0 | 0 | 1 (autosave séquence principale) |
| S2 — après le retry, avant `finish()` | 0 | 0 | 0 | 0 | 0 | 1 |
| S3 — après `finish()` | 1 | 1 | 1 | 1 | 7 | 0 (session nettoyée) |

**`S1 === S2` → le retry n'a écrit ABSOLUMENT RIEN.** `S3` montre que
`finish()` a écrit exactement **une** leçon (1 progression de mot, 1 activité
leçon, 1 activité mot, 1 item de révision, 7 tentatives de compétence — une par
exercice) et a nettoyé la session. Le retry n'appelle aucun Server Action
(aucun `validateAnswer`, aucun `submitLessonResults`, aucun
`submitSkillAttempts`) : c'est une interaction 100 % locale.

### Nettoyage

- 6 comptes de test créés puis supprimés (3 × scénario complet + 1 réassurance
  + 1 double-comptabilisation + 1 cas exact) : `cleanup: null` à chaque fois.
- Vérification finale `auth.admin.listUsers` : **0** utilisateur résiduel
  `phase36g-*`.

---

## B. Ce qui n'a PAS été observé (NOT VALIDATED)

- **Cas « vide »** (soumettre le champ arabe vide → « Pas de souci… ») :
  non rejoué en navigateur (1 mot = 1 tentative par run). **Couvert par les
  tests unitaires** (`getArabicRewriteEmptyCopy`, `isArabicRewriteExact`,
  `selectArabicRewriteRetryWords`, `selectReinforcementWords`).
- **Refresh pendant le retry** : non rejoué. Structurellement sûr : le retry
  n'écrit rien (S1 === S2) et la session est autosauvegardée AVANT le retry
  (ligne `lesson_sessions` présente en S1). Un refresh perdrait l'état local du
  retry mais ne corromprait ni la progression ni la session.
- **Comportement fin curseur / backspace / IME / diacritiques dans le champ
  RTL** : seule la saisie aller-retour (`كتاب`, `وَٱلْعَصْرِ`) a été vérifiée ;
  pas d'observation fine du curseur ni de l'IME mobile.
- **`prefers-reduced-motion`** : non émulé. Le retry n'utilise aucun confetti ;
  la célébration (confettis) ne concerne que la fin de sourate, hors de ce
  parcours.

---

## C. Limitations

- Le retry est validé sur une leçon **à 1 mot** (cas le plus court, déterministe).
  Les règles de sélection multi-mots (plafond 4, déduplication, ordre de
  première rencontre, exclusion du retry→self) restent couvertes par les tests
  unitaires `tests/lesson-experience.test.ts` (671 tests au total, dont 14 +
  5 + … dédiés au renforcement).
- Le cas « vide » et le refresh ne sont pas observés en navigateur (cf. §B).

---

## D. Invariants backend / produit confirmés

- `validateAnswer` : **inchangé** (le verdict officiel « Pas encore — Ce mot
  n'est pas encore fixé » est produit par le correcteur principal, pas par le retry).
- Grading / scoring : **inchangés**.
- SRS (`review_items`) : **inchangé** par le retry (0 écrit pendant S1→S2) ;
  l'unique `review_items` est créé par `finish()` à partir de la séquence
  principale.
- Mastery (`user_word_skill_progress`) : **inchangée** par le retry (0 pendant
  S1→S2) ; les 7 lignes viennent de `submitSkillAttempts` (séquence principale).
- `user_word_progress` : **inchangé** par le retry (0 pendant S1→S2).
- Session (`lesson_sessions`) : aucune session concurrente créée par le retry ;
  l'autosave (1 ligne) est celle de la séquence principale, nettoyée au `finish()`.
- Aucune migration, aucune donnée Quran modifiée, `FATIHAH_REFERENCE_LOCKED`
  intact, Al-Māʿūn 107 `IN_PREPARATION` intact (sourate 103 utilisée = READY).
- `LessonPlayer` : non modifié fonctionnellement (aucun code produit touché
  pendant cette phase — validation READ_ONLY).

---

## E. Matrice navigateur

`PASS` = réellement observé ; `—` = non testé en navigateur (couvert par tests unitaires).

| Scénario | 390×844 | 375×812 | 1280×720 |
| --- | --- | --- | --- |
| Leçon (découverte + anticipation + signature) | PASS | PASS | PASS |
| Erreur arabe `meaning_to_form` (verdict officiel) | PASS | PASS | PASS |
| Retry arabe (intro + étape) | PASS | PASS | PASS |
| Saisie RTL (`lang=ar`, `dir=rtl`) | PASS | PASS | PASS |
| Cas exact | PASS | — | — |
| Cas incorrect | PASS | PASS | PASS |
| Cas vide | — | — | — |
| Fin retry (« C'est bon ») | PASS | PASS | PASS |
| Fin leçon (« Leçon terminée » + mot renforcé) | PASS | PASS | PASS |
| Console (0 erreur) | PASS | PASS | PASS |
| Overflow horizontal (aucun) | PASS | PASS | PASS |

---

## F. Statut final

`PHASE_36G_AUTHENTICATED_E2E_PASS`

La fonctionnalité de retry d'écriture arabe est **validée** : réelle,
utilisable en RTL, non punitive, hors grading/SRS/mastery/score, sans nouvelle
session, sans écriture en base, avec une fin de leçon normale.

La Phase 36 peut être considérée comme **terminée**.

---

*Fichiers de test créés (jetables, `tmp/`) : `phase36g-e2e.cjs`,
`phase36g-reassurance.cjs`, `phase36g-nodouble.cjs`, `phase36g-exact.cjs`,
`phase36g-inspect.cjs`, `phase36g-words.cjs`, `phase36g-verify-cleanup.cjs`
(+ sorties JSON). Aucun fichier produit modifié, aucun commit créé.*
