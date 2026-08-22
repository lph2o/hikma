# PHASE 36A — LEARNING EXPERIENCE & LESSON UX DISCOVERY AUDIT

Statut : **READ_ONLY / DISCOVERY** — aucun code modifié, aucune migration, aucune écriture Supabase, aucun commit.

---

## 1. EXECUTIVE SUMMARY

Hikma possède une **boucle d'apprentissage complète et fonctionnelle**, architecturée
en deux temps :

1. **Découverte passive** (`LessonDiscovery`) — un mot à la fois : arabe dominant,
   translittération, écoute, sens révélé volontairement, contexte coranique.
2. **Effort actif** (`LessonPlayer` + `ExerciseCard`) — séquence cumulative
   ordonnée par compétence (reconnaissance → rappel → audio → contexte → lemme),
   feedback immédiat, fin de leçon avec statistiques réelles + CTA « Continuer ».

La source de vérité pédagogique est unique et déjà consolidée :
`validateAnswer` (moteur) → `applyAnswer` / `ReviewEngine` (progression + SRS) →
`computeLessonStatuses` → `computeSurahProgress`.

**Verdict** : la base est saine. **Aucun P0** n'a été identifié. Les
améliorations les plus impactantes relèvent du **P2** (cadrage des attentes,
accessibilité du radiogroup/des champs libres, re-présentation après erreur).
La question « pourquoi faire une deuxième leçon ? » a déjà une réponse partielle
forte (le CTA « Continuer — Leçon suivante » + progression réelle visible), mais
elle peut être renforcée par un meilleur cadrage d'entrée et un feedback de
maîtrise plus tangible en fin de session.

---

## 2. RECHERCHES UX EXTERNES

> **Limitation honnête** : l'outil `web_search` a renvoyé « No search results
> found » pour toutes les requêtes tentées (Quran Progress, Duolingo,
> Brilliant, Memrise, Anki). Aucune source web **actuelle** n'a donc pu être
> citée. Les principes ci-dessous reposent sur des connaissances UX stables et
> largement établies, présentées comme telles — **pas** comme une recherche
> fraîche validée. Cette limitation doit être levée (ou confirmée) avant toute
> décision de design qui dépendrait d'une tendance récente.

### Référence par référence

| Référence | Ce qui fonctionne | Pourquoi | Pertinent pour Hikma | Inadapté à Hikma |
| --------- | ----------------- | -------- | -------------------- | ---------------- |
| **Duolingo** | Sessions courtes à objectif unique ; feedback immédiat ; progression visible ; retour quotidien | Boucle dopamine discrète + attente claire de durée | Session courte satisfaisante ; CTA de retour clair | Streaks punitifs, XP/ligues, compétition, « leçons » gamifiées |
| **Brilliant** | Progression « comprendre, pas mémoriser » ; explication après réponse ; révélation guidée | Le feedback éclaire le *pourquoi*, pas seulement vrai/faux | Explication post-réponse (déjà présente via `pedagogicalExplanation`) | Parcours narratif linéaire trop long |
| **Memrise** | Répétition espacée mêlée à du sens ; micro-sessions ; « j'oublie/vient de retenir » auto-évalué | Honnêteté de l'auto-évaluation + espacement | Auto-évaluation (déjà présente : WORD_RECOGNITION) | Vidéos de locuteurs, gamification sociale |
| **Anki** | Rappel actif strict ; « encore / bon / facile » ; espacement algorithmique | L'effort de rappel + l'espacement sont la rétention | Rappel libre machine-noté (déjà présent) + SRS Leitner | Interface austère ; absence de contexte/pédagogie narrative |
| **Quran Progress** | Sentiment de chemin parcouru ; continuité ; prochain objectif visible | Le progrès visible motive sans score | Déjà largement intégré (Phases 34–35 : progression par sourate) | Interface de « tracker », branding, stats brutes |

### Synthèse pour Hikma

Les mécanismes réellement transférables **sans dénaturer Hikma** sont déjà
majoritairement en place :

1. **Rappel actif** (Anki/Memrise) → présent (`FORM_TO_MEANING`, `MEANING_TO_FORM`).
2. **Feedback avec explication** (Brilliant) → présent (`HikmaExplanation`).
3. **Progression visible par unité de sens** (Quran Progress) → présent (Phases 34–35).
4. **Session courte à objectif clair** (Duolingo) → **partiellement présent** :
   l'objectif de leçon est affiché si disponible, mais **la durée estimée et le
   « ce que tu vas pratiquer » ne sont pas annoncés en entrée**.

Ce qui doit rester **hors de portée** : XP, ligues, badges, classements, streaks
culpabilisants, pourcentages de « maîtrise » inventés, compétition. Le système
actuel respecte déjà cette ligne (aucun XP n'existe, célébration dorée sobre).

---

## 3. BOUCLE D'APPRENTISSAGE RÉELLE

Parcours constaté dans le code (pas théorique) :

```
Dashboard (/dashboard)
  → CTA « Reprendre / Continuer / Découvrir » → /learn/{slug}
↓
LessonPage (serveur) assemble : mots + lexique FR validé + audio signé +
  contexte ayah + relations lemme + evidence linguistique → séquence cumulative
  (connecté) ou par défaut (visiteur) → interleaving → identités d'exercices
↓
LessonPlayer (client) — phases : discovery → playing → submitting → complete
   │
   ├─ LessonDiscovery : mot arabe dominant → translittération → audio manuel
   │    → « Voir le sens » (reveal) → contexte coranique (disclosure) →
   │    prononciation guidée (1er mot) → « Commencer les exercices »
   │
   └─ HikmaExerciseShell × N :
        prompt → interaction (QCM / rappel libre / audio / auto-éval) →
        validateAnswer (moteur) → FeedbackPanel (correct/incorrect/ambiguous
        + explication) → « Continuer » → mot suivant
↓
finish() → submitLessonResults (progression) + activité + skills (best-effort)
  → clearLessonSession → LessonComplete
↓
LessonComplete : stats réelles (exercices, précision, mots) + progression du
  parcours + CTA « Continuer — leçon suivante » / « Réviser mes mots »
  / « Retour au parcours » (+ célébration si fin de sourate)
```

### Étape par étape (composant / donnée / action / état / source / feedback / sortie)

| Étape | Composant | Donnée | Action | État modifié | Source de vérité | Feedback | Sortie |
| ----- | --------- | ------ | ------ | ------------ | ---------------- | -------- | ------ |
| Présentation mot | `LessonDiscovery` | `DiscoveryWord` (arabe, translitt., sens, audio) | lire / écouter / révéler | aucun (local) | `buildWordBank` + audio | sens révélé + badge validé | mot suivant |
| QCM | `OptionsExercise` | `GeneratedExercise` | choisir option | `answer` local | `validateAnswer` | `FeedbackPanel` | « Continuer » |
| Rappel libre | `RecallExercise` | `metadata.expectedArabic` / `acceptedAnswers` | saisir texte | `answer` local | `gradeFreeResponse` | verdict + réponse attendue | « Continuer » |
| Audio | `AudioToWord` / `WordToAudio` / `PhoneticDiscrimination` | `metadata.audioUrl` | écouter puis choisir | `answer` local | `validateAnswer` | `FeedbackPanel` | « Continuer » |
| Auto-éval non notée | `WordRecognition` / `PronunciationGuided` | mot / audio | juger soi-même | `answer` local (non noté) | — | « cette étape n'est pas notée » | « Continuer » |
| Progression | `continueNext` → `finish` | `WordAttempts[]` | — | `user_word_progress` + SRS + skills | `submitLessonResults` | écran complet | leçon suivante |
| Fin | `LessonComplete` | `SessionStats` | lire / choisir | — | `computeSessionStats` | stats + progression | CTA |

---

## 4. AUDIT LESSPLAYER

`components/learn/lesson-player.tsx`

**Points forts (confirmés) :**

- **Séparation nette** UI / moteur : la validation, le scoring, la progression
  et le SRS ne sont jamais réimplémentés côté client ; tout passe par
  `validateAnswer` puis les Server Actions.
- **Reprise persistante robuste** : `saveLessonSession` après chaque exercice,
  `clampSessionIndex` borne la position, `hasSessionProgress` distingue
  découverte / exercices. La séquence étant déterministe, on ne persiste que la
  position, pas les questions.
- **Anti-double-soumission** : `savedWordIds` + `pendingWordAttempts` empêchent
  un double avancement lors d'un « Réessayer » après erreur partielle.
- **Erreur partielle ≠ perte** : `status === "partial"` affiche « synchronisation
  en attente » au lieu de « non enregistrée » — la progression persistée n'est
  jamais présentée comme perdue.
- **Non-bloquant** : l'activité du jour et les `skillAttempts` sont
  best-effort ; la pédagogie est déjà sauvegardée avant.

**Limites (à traiter en Phase 36B) :**

- **P1 — Aucune re-présentation du mot après une erreur** : la séquence est
  construite **une fois** au chargement (`buildCumulativeSequence`) à partir de
  la maîtrise au moment du chargement. Une erreur en cours de session ne
  re-queue pas le mot ; l'utilisateur révèle la réponse puis passe au suivant
  sans jamais re-tenter. C'est le point qui dégrade le plus la rétention
  immédiate. (Note : c'est une décision du *séquenceur* — à auditer sans
  toucher au grading/SRS ; une re-queue intra-session serait une évolution du
  séquençage, pas du moteur de score.)
- **P2 — `isMilestone = index === exercises.length - 1`** : le feedback
  « Mā shā' Allāh, tu viens de franchir une étape importante » se déclenche sur
  le **dernier exercice de la leçon**, même en milieu de sourate. Le qualificatif
  « étape importante » est légèrement surdimensionné pour une leçon ordinaire.

---

## 5. AUDIT EXERCICES

14 types répertoriés dans `EXERCISE_COMPONENTS` (lib/exercises + components/learn/exercises).

| Type | Objectif | Input | Difficulté | Feedback | Correction | Récompense | Accessibilité |
| ---- | -------- | ----- | ---------- | -------- | ---------- | ---------- | ------------- |
| WORD_TO_TRANSLATION | reconnaître le sens | QCM | progressive (difficulty) | immédiat | oui (bonne réponse surlignée) | « Très bien / Mā shā' Allāh » | radiogroup |
| TRANSLATION_TO_WORD | reconnaître la forme | QCM | progressive | immédiat | oui | idem | radiogroup |
| REVERSE_TRANSLATION | retrouver forme sans indice | QCM | progressive | immédiat | oui | idem | radiogroup |
| MULTIPLE_CHOICE | translittération | QCM | progressive | immédiat | oui | idem | radiogroup |
| COMPLETE_WORD | compléter le sens | QCM | progressive | immédiat | oui | idem | radiogroup |
| WORD_RECOGNITION | auto-éval non notée | Oui / Pas encore | — | immédiat (non noté) | n/a | « Bonne réflexion » | radiogroup |
| FORM_TO_MEANING | rappeler le sens | saisie libre FR | progressive | immédiat | oui (révélée) | verdict | input sans `<label>` |
| MEANING_TO_FORM | retrouver la forme arabe | saisie libre AR | progressive | immédiat | oui (révélée) | verdict | input RTL + clavier arabe |
| AUDIO_TO_WORD | écouter → identifier | QCM | progressive | immédiat | oui | verdict | bouton audio + alternative |
| WORD_TO_AUDIO | forme → vérifier à l'écoute | auto-éval **notée** | progressive | immédiat | oui | verdict | libellé « Auto-évaluation » trompeur |
| CONTEXT_RECOGNITION | sens dans le verset | QCM | progressive | immédiat | oui | verdict | traduction révélable si risqué |
| LEMMA_RELATION | relier formes d'un lemme | QCM | progressive | immédiat | oui | verdict | — |
| PRONUNCIATION_GUIDED | écouter + produire (auto-éval) | non noté | — | immédiat | n/a | aucune | — |
| PHONETIC_DISCRIMINATION | écouter un trait arabe | QCM | progressive | immédiat | oui | verdict | alternative visuelle « Afficher le mot » |

**Constats :**

- **Bonne progressivité** : le séquenceur cumulatif introduit reconnaissance →
  rappel → production, en sautant les compétences maîtrisées et en réactivant le
  rappel si la rétention < 75 (3 jours).
- **`WORD_TO_AUDIO` (P2 wording)** : le générateur le définit comme
  « auto-évaluation **notée** » (options `isCorrect: true/false`), mais son UI
  porte `aria-label="Auto-évaluation"` — le même libellé que `WORD_RECOGNITION`
  qui, lui, n'est **pas** noté. Deux réalités différentes, un même libellé.
- **Pas de sentiment d'échec bloquant** : incorrect révèle la réponse + explication,
  jamais de sanction.
- **Pas de répétition inutile constatée** : le saut des compétences maîtrisées
  évite la re-refonte systématique (sauf la limite P1 ci-dessus sur l'erreur).

---

## 6. AUDIT RÉPONSES LIBRES

`lib/exercises/grading.ts` + `generators/recall.ts` — source unique `gradeFreeResponse`.

### Comportement réel (vérifié dans le code)

| Cas | Attendu | Réponse | Verdict réel | Commentaire |
| --- | ------- | ------- | ------------ | ----------- |
| Erreur réelle | souverain / maître | fenêtre | **INCORRECT** | aucun fuzzy matching : seuls les synonymes validés passent |
| Variation acceptable | souverain / maître | maître / souverain | **CORRECT** | égalité d'ENSEMBLE, ordre indépendant (`sameUnitSet`) |
| Variation typographique | maître / souverain | maitre/souverain | **CORRECT** | `normalizeFrench` : casse, accents, ponctuation, séparateurs |
| Réponse partielle (1 synonyme) | souverain / maître | maître | **CORRECT** | `glossVariants` découpe la glose : « maître » seul est une variante acceptée |
| Arabe non vocalisé | مَالِكِ | مالك | **CORRECT** | `keyboard_unvocalized` |
| Arabe vocalisé différemment | مَالِكِ | مَلِكِ | **AMBIGUOUS** | même squelette, vocalisation différente (homographe) |
| Arabe lexème différent | مَالِكِ | مَلِكُ (autre lettre/consonne) | **INCORRECT** | protège عَبَدَ ≠ عَبْد, دِين ≠ دَيْن |

**Points forts :**

- Normalisation française **contrôlée** (jamais de matching flou qui accepterait
  « roi » pour « souverain »).
- AMBIGUOUS **réservé à l'arabe** (homographes) — le français n'a pas cette issue.
- La comparaison se fait toujours contre la forme du `word_id` ciblé, jamais
  contre un dictionnaire global (non-contamination).

**Décision pédagogique à documenter (sans changer maintenant) :**

- **Réponse partielle = CORRECT (plein crédit)** : « maître » seul vaut la même
  progression que « souverain / maître ». C'est défendable (un synonyme correct
  = compréhension), mais cela signifie qu'un rappel partiel produit la même
  avancée de mastery qu'un rappel complet. La Phase 36B devra **décider
  explicitement** si un verdict `PARTIAL` est souhaitable — sans l'implémenter
  ici (le type `AnswerOutcome` documente déjà `PARTIAL` comme `FUTURE_WORK`).

---

## 7. AUDIT AUDIO

`components/ui/audio-player.tsx` + placement dans les exercices/découverte.

- **Manuel uniquement** : aucun autoplay nulle part. Correct (accessibilité,
  pas de distraction de l'effort).
- **Réécoute possible** : états idle/loading/playing/paused/ended/error +
  bouton « Rejouer ».
- **Un seul audio actif** : `audio-coordinator` stoppe les autres lecteurs.
- **Placement** :
  - Découverte : audio **avant** le sens (écoute d'abord) — favorable.
  - `AUDIO_TO_WORD` : l'audio est l'**entrée** (le texte est masqué) — correct.
  - `WORD_TO_AUDIO` / `PHONETIC_DISCRIMINATION` : écoute + vérification.
  - Feedback : audio ré-affiché après erreur (`explanationData.audioUrl`).
- **Alternative visuelle** pour la discrimination phonétique — ne dépend jamais
  du son seul.

**Conclusion** : l'audio soutient l'apprentissage sans le parasiter. **Aucun
changement fonctionnel requis.** Seule amélioration possible (P3) : un libellé
de réécoute contextuel plus explicite après erreur (« Réécouter pour ancrer »).

---

## 8. AUDIT PROGRESSION

- **Dans la leçon** : `HikmaExerciseShell` affiche « Exercice X sur N » +
  `HikmaProgress` + libellé de compétence. Le dénominateur est le nombre
  d'**exercices**.
- **Découverte** : « Mot X sur N » + `HikmaProgress`. Le dénominateur est le
  nombre de **mots**. → **P3** : deux dénominateurs différents (« Mot » vs
  « Exercice ») peuvent brouiller le sentiment de progression dans la même leçon.
- **Fin de leçon** : progression du **parcours** (`pathProgress.completed/total`).
- **Parcours/sourate/global** : Phases 34–35 (`computeSurahProgress`).

**Constats :**

- L'utilisateur ressent « je progresse » **dans** la leçon et **entre** les
  leçons (progression de sourate visible). C'est satisfaisant.
- Ce qui manque pour transformer « je clique sur suivant » en « je progresse » :
  aucun retour **intra-session** sur l'évolution de la maîtrise d'un mot
  (ex. « ce mot passe de nouveau → familiarisé »). L'écran de fin résume la
  précision mais pas le **gain de maîtrise** par compétence.

---

## 9. AUDIT CÉLÉBRATION

`components/learn/lesson-complete.tsx` + `surah-progress-copy.ts`.

- **Transition réelle uniquement** : `isSurahCompletionTransition` exige la
  dernière leçon **et** toutes les autres terminées (`completed === total - 1`
  avant). Pas de célébration sur `nextLesson === null` seul, ni au rechargement,
  ni en révision. ✓ (corrigé en Phase 35B).
- **Confettis** : CSS uniquement, courts, `prefers-reduced-motion` respecté.
- **Feedback de réussite ordinaire** : variation islamique sobre
  (« Très bien » / « Mā shā' Allāh » selon difficulté/milestone).
- **Pas de points/XP/badges** : cohérent avec la philosophie produit.

**Conclusion** : la célébration est déjà sobre et correctement déclenchée.
**Aucun ajout lourd nécessaire.**

---

## 10. AUDIT FIN DE LEÇON

`LessonComplete` répond aux 5 questions :

1. **Qu'ai-je accompli ?** — stats réelles : exercices, précision, mots étudiés. ✓
2. **Quelle sourate ?** — titre de leçon + progression du parcours. ✓ (le nom de
   sourate n'est affiché explicitement que lors d'une fin de sourate ; en fin de
   leçon ordinaire, la sourate apparaît via le titre d'unité → `surahName`, mais
   le composant ne l'affiche **que** dans la copie de célébration. → **P3** :
   le nom de la sourate gagnerait à être visible aussi en fin de leçon ordinaire.)
3. **Que faire maintenant ?** — « Continuer — leçon suivante » (ou « Voir mes
   sourates » si fin). ✓
4. **Quand revenir ?** — partiellement : le CTA « Réviser mes mots » existe, mais
   aucune indication de **quand** la prochaine révision SRS est due. → **P2**.
5. **Puis-je continuer immédiatement ?** — oui, CTA « Continuer ». ✓

**Distinction fin de leçon / fin de sourate / révision SRS** : bien séparée
(le `LessonComplete` ≠ `ReviewPlayer` qui a son propre écran « Révision terminée »).

---

## 11. AUDIT MOBILE (statique)

Ciblé `390×844`, `375×812`, `1280×720` — **analyse du code uniquement**, non
observé en navigateur (voir §16).

- **Zones tactiles** : boutons `min-h-12` (48px) partout. ✓
- **Barre d'action de découverte** : `sticky bottom-0` + `safe-area-inset-bottom`
  + backdrop blur — adaptée mobile. ✓
- **Arabe** : `ArabicText max-w-full` — pas de débordement horizontal attendu. ✓
- **Champ libre** : `h-12` + clavier arabe dédié (bouton 48px). ✓
- **Grilles** : `sm:grid-cols-2` → 1 colonne mobile. ✓
- **Risque résiduel** : le clavier arabe superposé sur petit écran n'est pas
  vérifié ; la saisie libre arabe + clavier natif + clavier arabe Hikma peuvent
  se chevaucher visuellement. → à valider en navigateur.

---

## 12. AUDIT ACCESSIBILITÉ (statique)

**Présent et correct :**

- Feedback annoncé : `role="status" aria-live="polite"` sur `ExerciseFeedback`
  et sur le statut de l'`AudioPlayer`. ✓
- Options : `role="radiogroup"` + `role="radio"` + `aria-checked`. ✓
- Alternative visuelle pour la discrimination phonétique. ✓
- `aria-label` sur les boutons d'action (quitter, rejouer, réécouter). ✓
- `prefers-reduced-motion` (célébration + global). ✓
- Focus visible (`focus-visible:ring`).

**Lacunes (à traiter en Phase 36B) :**

- **P2 — Pas de navigation fléchée dans le radiogroup** : les options sont des
  `Button role="radio"` sans gestion des flèches (les radios natifs naviguent
  aux flèches). Les utilisateurs clavier doivent Tab à travers chaque option.
- **P2 — Champ libre sans `<label>`** : le champ de rappel repose sur le
  placeholder + le prompt situé au-dessus ; pas d'`aria-describedby` liant le
  champ à la question, ni de `label` explicite. Les lecteurs d'écran perdent le
  libellé une fois le placeholder remplacé.
- **P2 — Verdict non annoncé comme « erreur »** : le feedback est en
  `aria-live="polite"`, donc annoncé, mais sans `aria-invalid` sur le champ ni
  d'association erreur↔champ.
- **P3 — « Auto-évaluation » ambigu** (WORD_TO_AUDIO noté vs WORD_RECOGNITION non
  noté), déjà noté §5.

---

## 13. MATRICE P0 / P1 / P2 / P3

### P0 — blocage / risque critique
**Aucun.** La progression n'est jamais perdue (persistance idempotente, erreurs
partielles distinctes, anti-double-soumission), et aucun chemin ne réinitialise
ou falsifie l'état utilisateur.

### P1 — dégrade directement l'apprentissage

| # | Problème | Impact | Preuve | Cause | Recommandation | Risque |
| - | -------- | ------ | ------ | ----- | -------------- | ------ |
| P1-1 | Une erreur ne re-queue pas le mot dans la session | La rétention immédiate est affaiblie : on révèle puis on passe, sans re-tenter | `buildCumulativeSequence` figé au chargement ; `continueNext` avance `index` sans re-file | Séquence déterministe construite une fois | Étudier une re-présentation intra-session du mot raté (évolution du **séquenceur**, pas du scoring/SRS) | Modifier le séquenceur sans toucher le moteur de score |

### P2 — amélioration UX importante, non bloquante

| # | Problème | Impact | Preuve | Recommandation | Risque |
| - | -------- | ------ | ------ | -------------- | ------ |
| P2-1 | Pas d'annonce de durée / de « ce que tu vas pratiquer » en entrée de leçon | L'utilisateur n'anticipe pas l'effort → motivation d'entrée plus faible | `LessonDiscovery` n'affiche que « Mot X/N » et l'objectif (si présent) | Afficher une ligne « ~N exercices · environ X min » + les compétences ciblées | Aucun (présentation pure) |
| P2-2 | Fin de leçon sans indication de « quand revenir » (prochaine révision due) | L'utilisateur ne sait pas quand ses révisions arrivent | `LessonComplete` propose « Réviser mes mots » sans date | Ajouter « prochaine révision : {jour} » si une donnée SRS existe déjà | Aucun (lecture) |
| P2-3 | Radiogroup sans navigation fléchée | Clavier : Tab obligatoire entre options | `OptionsExercise` / `AnswerGrid` | Implémenter les flèches sur le radiogroup | Aucun (UI) |
| P2-4 | Champ libre sans `<label>` / `aria-describedby` | Lecteurs d'écran perdent le libellé | `RecallExercise` input sans label | Lier le champ au prompt + `aria-invalid` | Aucun (a11y) |
| P2-5 | `isMilestone` sur le dernier exercice, pas sur un vrai jalon | « étape importante » surdimensionné en milieu de sourate | `index === exercises.length - 1` | Réserver le milestone à la fin de sourate ou à un seuil réel | Aucun (copy) |

### P3 — polish

| # | Problème | Preuve | Recommandation |
| - | -------- | ------ | -------------- |
| P3-1 | Deux dénominateurs « Mot X/N » (découverte) vs « Exercice X/N » (exercices) | `LessonDiscovery` vs `HikmaExerciseShell` | Harmoniser l'affichage de progression |
| P3-2 | Nom de sourate absent en fin de leçon ordinaire | `LessonComplete` n'affiche `surahName` que pour la célébration | Afficher discrètement la sourate dans les stats |
| P3-3 | Libellé « Auto-évaluation » ambigu (WORD_TO_AUDIO noté) | `WordToAudioExercise` `aria-label="Auto-évaluation"` | « Vérifier à l'écoute » |
| P3-4 | Réécoute après erreur peu incitative | `AudioPlayer label="Écouter le mot"` | « Réécouter pour ancrer » après erreur |

---

## 14. PROPOSITIONS PHASE 36B

Sans rien modifier ici, la Phase 36B (design) devrait prioriser :

1. **Cadrage d'entrée** (P2-1) : « N exercices · ~X min · compétences : … » en
   tête de découverte — sans inventer de durée (dériver du nombre d'exercices
   et de la préférence `daily_duration`, ou rester générique).
2. **Re-présentation après erreur** (P1-1) : concevoir une re-queue intra-session
   **au niveau du séquenceur** (pas du grading/SRS), avec test de non-régression.
3. **Fin de leçon** (P2-2, P3-2) : sourate visible + prochaine révision due.
4. **Accessibilité** (P2-3, P2-4) : flèches sur radiogroup, label/aria sur champ libre.
5. **Copy** (P2-5, P3-1, P3-3, P3-4) : milestone réel, dénominateurs cohérents,
   libellés audio.

Aucune de ces propositions ne touche : grading, scoring, SRS, mastery,
scheduler, curriculum, Quran, MASAQ, corpus lexical.

---

## 15. NON-RÉGRESSION

Cette phase est READ_ONLY : **aucun fichier modifié**. Les invariants restent
intacts :

- 114 sourates ; 90 leçons publiées ; 14 parcours exposables ;
- Al-Māʿūn 107 `IN_PREPARATION` (aucun CTA) ;
- `word_translations = 263` ; MASAQ `97 / 170` ; `FATIHAH_REFERENCE_LOCKED` ;
- grading, scoring, réponses libres, SRS, mastery, scheduler, interleaving,
  curriculum, progression, LessonPlayer, audio, traductions, corpus lexical :
  **non modifiés**.

---

## 16. LIMITATIONS DE VALIDATION

- **`web_search` indisponible** : toutes les recherches web ont renvoyé « No
  search results found ». Les références externes (§2) reposent donc sur des
  principes UX stables, **pas** sur une recherche fraîche. À lever avant de
  dépendre d'une tendance récente.
- **`BROWSER_VALIDATION_LIMITED`** : aucun navigateur contrôlable. Les audits
  mobile (§11) et accessibilité (§12) sont **statiques** (lecture du code),
  jamais déclarés PASS en conditions réelles.

---

## 17. DÉCISION FINALE

`PHASE_36A_AUDIT_COMPLETE_READY_FOR_DESIGN`

La boucle d'apprentissage est **complète, cohérente et non-régressive** : la
progression réelle est protégée, le feedback est pédagogique, le rappel actif
et le SRS sont en place, et la célébration est sobre. Il n'existe **aucun P0**.
Les améliorations identifiées (1 P1 de séquencement, 5 P2, 4 P3) relèvent du
design d'expérience et peuvent être planifiées en Phase 36B **sans** toucher au
moteur pédagogique ni aux données.
