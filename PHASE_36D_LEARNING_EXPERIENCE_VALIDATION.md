# PHASE 36D — LEARNING EXPERIENCE VALIDATION & ARABIC WRITING UX AUDIT

Statut final : `PHASE_36D_VALIDATION_COMPLETE_TARGETED_IMPROVEMENTS_REQUIRED`

---

## A. EXECUTIVE SUMMARY

La Phase 36C est **fonctionnellement correcte et non-régressive** : la
mini-révision est bien une couche de présentation (aucun re-grading, aucun
re-SRS, aucun re-mastery, aucune table), la signature Hikma n'apparaît que sur
une `ayahRef` réelle, et l'anticipation/fin de leçon/accessibilité sont en
place.

En revanche, l'audit révèle **une limite pédagogique réelle** pour le public
cible décrit (utilisateurs qui récitent le Coran mais peinent à **écrire**
l'arabe) : la mini-révision actuelle, en auto-évaluation
(« Je m'en souviens / Pas encore »), **re-montre** le mot mais ne permet pas de
**réécrire** la forme arabe ratée. Elle est donc peu efficace pour les erreurs
d'**écriture** (par opposition aux erreurs de **sens**).

Décisions produit (détail §O) :

- **A** — la mini-révision n'est pas assez utile pour l'écriture arabe →
  `NEEDS_ARABIC_RETRY`.
- **B** — le correcteur ne distingue que partiellement connaissance/écriture →
  `PARTIAL`.
- **C** — ne pas modifier le correcteur → `NO_CHANGE`.
- **D** — ajouter un re-taper arabe non noté à la mini-révision →
  `ARABIC_REWRITE_RETRY_RECOMMENDED`.

---

## B. ÉTAT ACTUEL

Fichiers introduits par 36C : `lib/learning/lesson-copy.ts`,
`lib/ui/radio-group-keyboard.ts`, `components/learn/mini-review.tsx`,
`tests/lesson-experience.test.ts` ; modifications ciblées de
`lesson-player.tsx`, `lesson-discovery.tsx`, `lesson-complete.tsx`,
`learn/[slug]/page.tsx`, `exercises/{index,options-exercise}.tsx`,
`ui/exercise.tsx`, `review-player.tsx`.

Validation technique : `tsc --noEmit` PASS, `eslint` PASS, **651/651 tests**
PASS, `npm run build` PASS. `BROWSER_VALIDATION_LIMITED`.

---

## C. MINI-RÉVISION (vérification précise)

### Sélection

`selectMiniReviewWords(results, max=4)` (`lib/learning/session.ts`) sélectionne
les `wordId` dont `attempts` contient **au moins un `false`**, dans l'ordre de
**première rencontre**, plafonnés à **4**.

### Ordre & plafond

- Ordre déterministe : ordre d'insertion des `WordAttempts` (l'ordre réel de la
  séquence d'exercices).
- 0 erreur → `[]` → `finish()` direct, **aucune mini-révision**.
- 1, 2, 3, 4 erreurs → autant de mots proposés.
- 5+ erreurs → **4 mots maximum** (`MAX_MINI_REVIEW_WORDS = 4`).

### Transmission des résultats à `finish()`

Le payload de fin (`nextResults`, `nextSkillAttempts`) est **gelé** dans
`pendingFinish.current` **avant** d'entrer en mini-révision. `MiniReview`
appelle `onComplete(reinforced)` puis `finish()` reçoit **exactement** ce
payload. La mini-révision n'ajoute **rien** à `results` : l'auto-évaluation
n'appelle ni `validateAnswer` ni `appendAttempt`.

### Doublons

`appendAttempt` déduplique par `wordId` ; `selectMiniReviewWords` itère une fois
sur `results` ; le mapping `.find()` ne renvoie qu'un `DiscoveryWord` par id.
**Aucun doublon possible.**

### Comportement au skip

`onComplete(0)` → `finish()` avec le payload conservé → fin normale, progression
conservée, **aucune donnée supplémentaire**, aucune boucle.

### Refresh / fermeture pendant la mini-révision (Cas 8)

La mini-révision est **client-only** et n'appelle pas `persistSession`. Au
rechargement, `getLessonSession` restaure `currentExerciseIndex` = dernier
exercice (dernier état persisté). L'utilisateur **rejoue une fois** le dernier
exercice, puis la mini-révision se re-déclenche, puis `finish()`.

- **Aucune perte de données** (la réponse du dernier exercice n'avait pas encore
  été persistée).
- **Aucun double comptage** (rien n'a été soumis deux fois : `savedWordIds` +
  `pendingWordAttempts`).
- Comportement **sûr et déterministe**, légèrement répétitif (rejouer le dernier
  exercice). Ce n'est pas un bug ; c'est un choix conservateur acceptable.

### Session active (Cas 9)

La mini-révision ne crée **aucune** nouvelle session pédagogique : elle est un
sous-état de la session de leçon en cours, sans écriture `lesson_sessions`
supplémentaire ni état concurrent.

---

## D. ERREURS ARABES — MATRICE « mot raté »

La définition exacte de « mot raté » = **une réponse `INCORRECT`** (pas
`AMBIGUOUS`, pas l'auto-évaluation, pas la réponse vide).

| Type d'erreur | Mini-révision ? | Pourquoi |
| ------------- | :-------------: | -------- |
| Erreur de sens (FORM_TO_MEANING, FR) | **Oui** | `INCORRECT` → `attempts.push(false)` |
| Erreur de rappel (MEANING_TO_FORM, AR) | **Oui** | `INCORRECT` → `false` |
| Erreur d'écriture arabe (typo) | **Oui** | `INCORRECT` (`different_lexeme`) → `false` |
| `AMBIGUOUS` (vocalisation différente) | Non | neutre : pas d'append |
| Réponse vide | Non | impossible à soumettre (`disabled` si vide) |
| Correct | Non | `attempts.push(true)` |
| Variante acceptable | Non | `CORRECT` |
| Auto-évaluation (WORD_RECOGNITION / PRONUNCIATION_GUIDED) | Non | non notée : pas d'append |

**Conclusion** : une erreur d'écriture arabe **entre bien** dans la
mini-révision, mais elle y est traitée par une auto-évaluation (« Je m'en
souviens / Pas encore ») qui **ne fait pas réécrire** le mot. C'est le point
central de l'audit.

---

## E. CORRECTEUR — DISTINCTION CONNAISSANCE / ÉCRITURE

Le correcteur (`lib/exercises/grading.ts`) est volontairement **conservateur** :

- `gradeArabicResponse` distingue : `exact_or_alef_variant` / `keyboard_unvocalized`
  → CORRECT ; `same_bare_different_vocalization` → AMBIGUOUS ;
  `different_lexeme` → INCORRECT.
- **Aucun fuzzy matching** : une faute d'une lettre (« ربب » pour « رَبّ ») est
  `INCORRECT`, au même titre qu'un mot entièrement faux. C'est le comportement
  sûr (pas de faux positifs), mais il **confond** l'erreur d'orthographe et
  l'ignorance du mot.

### Les 4 cas (§6)

| Cas | Signification | Distingué aujourd'hui ? |
| --- | ------------- | ----------------------- |
| A | je ne connais pas le sens | Distinguable de B/C au niveau **compétence** (form_to_meaning vs meaning_to_form) |
| B | je connais le sens mais je ne rappelle pas le mot | **Non** distinguable de C |
| C | je connais le mot mais je l'écris mal | **Non** distinguable de B |
| D | variante acceptable | **Oui** (CORRECT / AMBIGUOUS) |

### Verdict

`DISTINCTION_NOT_YET_RELIABLE` pour **B vs C** : les deux produisent `INCORRECT`
sur `MEANING_TO_FORM`. La distinction existe **au niveau compétence**
(`skillAttempts` contient `{ wordId, skill, correct }`), mais **pas au niveau de
la nature de l'erreur arabe**. Ce qu'il faudrait pour l'améliorer (sans changer
le verdict) : une **classification diagnostic** de l'erreur arabe (distance
d'édition, squelette consonantique partagé) — en lecture seule, sans jamais
l'utiliser pour modifier le verdict `CORRECT/INCORRECT`. Hors périmètre de cette
phase.

---

## F. FEEDBACK

Le feedback d'erreur (36C) est désormais « Pas encore » / « Ce mot n'est pas
encore fixé. Voici la bonne réponse. », avec la bonne réponse et l'explication
inchangées. Le verdict reste **véridique** (rouge = incorrect, bonne réponse
affichée). Aucune « récompense » sur erreur. Conforme au principe « ne jamais
punir deux fois » : l'erreur est présentée comme une étape, pas une sanction.

---

## G. UX MOBILE (audit statique)

Dimensions `390×844`, `375×812`, `1280×720` — **statique uniquement**
(`BROWSER_VALIDATION_LIMITED`).

- Mini-révision : cartes pleine largeur `max-w-lg`, boutons `min-h-12`,
  `grid sm:grid-cols-2` → 1 colonne mobile. Pas de tableau, pas de grille serrée.
- Champ arabe : `h-12`, `dir="rtl"`, clavier arabe dédié (`min-h`), pas
  d'overflow attendu.
- Fin de leçon : `max-w-lg`, CTA pleine largeur mobile.
- Risque résiduel non observé : superposition clavier natif + clavier arabe
  Hikma sur petit écran (à valider en navigateur).

---

## H. RTL

- Le texte Quran est rendu par `ArabicText` (Amiri, RTL) — **jamais modifié**.
- Le champ arabe utilise `lang="ar" dir="rtl"` ; le champ français `dir="ltr"`.
- La progression, les flèches et les CTA sont en LTR (interface FR) ; le
  contenu arabe reste isolé en RTL. Aucun mélange bidi destructeur constaté
  dans le code (les copies évitent d'insérer de l'arabe brut au milieu du
  français — convention respectée par `shortFeedbackCopy`).

---

## I. ACCESSIBILITÉ (audit statique)

- Radiogroups : `role="radiogroup"` + `role="radio"` + `aria-checked` +
  **navigation flèches/Home/End** (36C) sur tous les groupes concernés.
- Champ libre : `aria-label={exercise.prompt}` (36C).
- Feedback : `role="status" aria-live="polite"`.
- Audio : `role="status"` + libellés ; alternative visuelle pour la
  discrimination phonétique.
- Bouton skip / continuer : libellés explicites, `min-h-12`.
- `prefers-reduced-motion` respecté (célébration + global).
- Le doré n'est **jamais** utilisé seul pour une information critique (le
  verdict reste porté par texte + icône + couleur).

---

## J. RECHERCHE EXTERNE

`WEB_RESEARCH_LIMITED`

L'outil de recherche web (`web_search`/Serper) a de nouveau renvoyé « No search
results found » sur les requêtes tentées (« Arabic writing exercises language
learning app feedback spelling », « Duolingo Arabic course writing exercises how
it works »), et deux tentatives `read_url` ciblées sur le blog Duolingo ont
retourné 404. **Aucune recherche web nouvelle n'a donc pu être citée.**

Enseignements disponibles : le contenu **Quran Progress** recueilli en Phase 36B
reste la référence (répétition espacée, coach, « comprenez ce que vous récitez »,
5 min/jour). Pour l'écriture arabe, les principes stables appliqués (sans source
fraîche) sont : (1) ne jamais pénaliser l'orthographe comme de l'ignorance ;
(2) re-proposer la forme à réécrire plutôt qu'un simple QCM ; (3) révéler puis
comparer, sans re-noter. Ces principes sont présentés comme des **connaissances
UX stables**, pas comme une recherche validée.

---

## K. BENCHMARK QURAN PROGRESS

| Dimension | Quran Progress | Hikma (36C) |
| --------- | -------------- | ----------- |
| Promesse | « Comprenez ce que vous récitez » (fréquence + lecture) | « Ce mot, tu le récites peut-être déjà » (ayah réel) |
| Unités | Mots fréquents (125 = 50 %) | Par sourate (ayah ancré) |
| Révision | SRS 1/3/7 j | Leitner séparé + mini-révision de fin |
| Écriture | exercices d'écriture (« devinettes ») | rappel libre `MEANING_TO_FORM` (pas de re-taper en mini-révision) |
| Motivation | coach + régularité | célébration sobre, pas de streak |

Différenciateur Hikma préservé : la correspondance mot↔ayah est **réelle**
(`getWordAyahContexts`/`word_occurrences`), jamais une phrase marketing.

---

## L. TESTS

### Existants (36C)

`tests/lesson-experience.test.ts` (14 tests) : sélection mini-révision (0/1/
plusieurs/plafond 4/déterminisme/vide) + copy pure. Total suite **651/651**.

### À envisager (phase suivante)

- Mini-review : skip, finish, doublons, ordre.
- Arabe : réponse exacte / variante / erreur d'une lettre / lettre manquante /
  lettre supplémentaire / réponse vide / diacritiques / Unicode — pour la
  **classification diagnostic** (si un jour introduite).
- UX : session courte/longue, erreur/réussite, dernière leçon, sourate terminée.

---

## M. RISQUES

- **R1 (P0)** — transformer l'auto-évaluation en second grading. Évité (aucune
  notation, aucun `validateAnswer` en mini-révision).
- **R2 (P1)** — re-taper arabe **noté** en mini-révision dénaturerait mastery/SRS.
  La recommandation ci-dessous est **strictement non notée**.
- **R3 (P2)** — sur-gamification (confettis sur chaque interaction). Évitée :
  hiérarchie conservée (micro → leçon → sourate), confettis réservés à la
  transition réelle vers `completed`.
- **R4 (P2)** — tolérance aux fautes dans le correcteur (faux positifs). Évitée :
  `NO_CHANGE` sur le grader.

---

## N. NON-RÉGRESSION

Vérification statique : Phase 36C n'a modifié **aucun** des éléments suivants :

- `validateAnswer`, `gradeFreeResponse`, `gradeArabicResponse` (correcteur) ;
- SRS (`ReviewEngine`, `recordAnswer`), mastery, scheduler, interleaving,
  curriculum, progression, `user_word_progress` ;
- `LessonPlayer` core grading (la validation/persistance reste inchangée — seule
  l'orchestration UI a gagné une phase) ;
- audio, Quran, traductions, MASAQ, corpus lexical ;
- onboarding (Phase 32), progression par sourate (Phase 34), active path
  (Phase 35), `FATIHAH_REFERENCE_LOCKED`, Al-Māʿūn 107 `IN_PREPARATION`.

---

## O. DÉCISIONS PRODUIT

### Question A — la mini-révision est-elle assez utile pour l'écriture arabe ?

`NEEDS_ARABIC_RETRY`

L'auto-évaluation re-montre la forme et le sens mais ne fait pas **réécrire**.
Pour un utilisateur qui connaît le mot mais l'orthographie mal, elle ne corrige
pas la compétence défaillante.

### Question B — le correcteur distingue-t-il connaissance / écriture ?

`PARTIAL`

Distinction au niveau **compétence** (form_to_meaning vs meaning_to_form)
disponible via `skillAttempts`, mais la **nature** de l'erreur arabe (typo vs
mauvais mot) n'est pas classée.

### Question C — faut-il modifier le correcteur ?

`NO_CHANGE`

Le correcteur actuel est sûr (pas de faux positifs). Introduire une tolérance
orthographique modifierait le verdict et risquerait d'accepter un mot faux.
Toute future « classification d'erreur arabe » doit être **diagnostic et
lecture seule**, sans effet sur `CORRECT/INCORRECT`.

### Question D — la mini-révision doit-elle devenir interactive ?

`ARABIC_REWRITE_RETRY_RECOMMENDED`

Ajouter, pour les mots ratés sur la compétence `meaning_to_form` (écriture
arabe), un **re-taper non noté** : l'utilisateur réécrit la forme puis la compare
à la forme correcte révélée — sans `validateAnswer`, sans persistance, sans SRS.
Conserver l'auto-évaluation pour les erreurs de **sens**.

---

## P. RECOMMANDATIONS (phase suivante, hors périmètre ici)

1. **P1** — Re-taper arabe non noté dans la mini-révision, ciblé sur les mots
   ratés en `meaning_to_form` (utiliser `skillAttempts` pour cibler la
   compétence), tout en gardant l'auto-évaluation pour les erreurs de sens.
2. **P2** — Personnaliser l'intitulé de la mini-révision selon la compétence
   ratée (« Retrouve le sens » vs « Réécris le mot ») via `skillAttempts`.
3. **P3** — Documenter/atténuer le rejeu du dernier exercice après un refresh
   pendant la mini-révision (persistance d'un sentier « séquence principale
   terminée » si on veut l'éviter).
4. **P3** — Classificateur diagnostic d'erreur arabe (distance d'édition /
   squelette partagé) en **lecture seule**, pour un futur feedback différencié —
   sans jamais modifier le verdict.

---

## Q. LIMITATIONS

- **`WEB_RESEARCH_LIMITED`** : recherche web indisponible (Serper vide + 404 sur
  les pages blog tentées). Aucune source fraîche citée ; principes stables
  signalés comme tels.
- **`BROWSER_VALIDATION_LIMITED`** : aucune observation navigateur. Mobile, RTL,
  clavier/focus réels, `prefers-reduced-motion`, célébrations non déclarés PASS.
- Aucune modification de code n'a été effectuée dans cette phase (validation +
  audit uniquement).

---

## STATUT FINAL

`PHASE_36D_VALIDATION_COMPLETE_TARGETED_IMPROVEMENTS_REQUIRED`

La base 36C est correcte et non-régressive, mais une amélioration ciblée
(**re-taper arabe non noté** dans la mini-révision, pour la compétence
d'écriture) est nécessaire pour que la mini-révision serve réellement le public
qui peine à écrire l'arabe. Cette amélioration relève d'une phase suivante
(36E), sans toucher au correcteur, au SRS ni à la mastery.
