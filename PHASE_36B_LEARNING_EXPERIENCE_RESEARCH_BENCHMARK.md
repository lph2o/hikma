# PHASE 36B — LEARNING EXPERIENCE RESEARCH, COMPETITIVE BENCHMARK & PRODUCT DESIGN

Statut : **READ_ONLY / RESEARCH_FIRST / NO_CODE / NO_DB_WRITE / NO_COMMIT**
Aucun fichier source modifié, aucune migration, aucune écriture Supabase, aucun commit.

---

## A. SOURCES (recherches réellement effectuées)

> **Note de méthode** : l'outil de recherche web (`web_search`, moteur Serper) a
> renvoyé systématiquement « No search results found » sur l'ensemble des
> requêtes tentées. La recherche a donc été effectuée **directement sur les
> pages officielles** via extraction de contenu (`read_url`). Chaque conclusion
> ci-dessous est rattachée à une page officielle réellement consultée. Khan
> Academy a été tentée mais bloquée (anti-bot « Client Challenge »).

| URL consultée | Produit | Sujet | Enseignement principal |
| ------------- | ------- | ----- | ---------------------- |
| https://www.quranprogress.com/ | Quran Progress | positionnement, promesse, progression, SRS, coach, parcours | « Comprenez enfin ce que vous récitez » ; 125 mots = 50 % du Coran ; répétition espacée 1/3/7 j ; coach virtuel ; 5 min/jour ; parcours « découvrir → ancrer → voir sa progression » |
| https://www.memrise.com/ | Memrise | apprentissage vs révision, espacement, sessions, progression | « Apprendre pour ce dont tu as réellement besoin » ; séparation LEARN / REVIEW ; 15 min/jour ; « progress you can feel » ; vidéos natives authentiques |
| https://brilliant.org/ | Brilliant | learn by doing, tutor, feedback, adaptation | « Learn by doing » ; « Concepts that click » (jouer jusqu'à ce que ça clique) ; feedback pas-à-pas + explication du « pourquoi » ; « adapts to where you are » (maîtrisé vs bloqué) |
| https://blog.duolingo.com/ | Duolingo | méthode, science de l'apprentissage, motivation | Ligne éditoriale « faire de l'éducation amusante et accessible » ; colonne « Dear Duolingo » sur la science du cerveau ; feedback immédiat ; cours courts ; gamification (streak/XP/ligues) assumée |
| https://apps.ankiweb.net/ | Anki | rappel actif, répétition espacée, auto-grading | « Spend more time on challenging material, and less on what you already know » ; auto-évaluation « Again/Hard/Good/Easy » ; programmation de la révision « au moment où l'oubli est le plus probable » |
| https://www.khanacademy.org/ | Khan Academy | mastery learning | **Bloquée** (anti-bot) — non exploitable dans cette session |

---

## B. BENCHMARK

| Dimension | Hikma (actuel) | Quran Progress | Duolingo | Memrise | Brilliant |
| --------- | -------------- | -------------- | -------- | ------- | --------- |
| Promesse | Comprendre le Coran mot par mot, sourate par sourate | « Comprenez ce que vous récitez » (fréquence + lecture) | Apprendre une langue en s'amusant | Parler la langue « réelle » | Comprendre par la pratique (maths/code) |
| Boucle cœur | Découverte → rappel actif → SRS | Découvrir → ancrer → progresser | Leçon courte → feedback → streak | LEARN (natif) → REVIEW (SRS) | Problème pas-à-pas → feedback → intuition |
| Progression | Réelle, par sourate (leçons/mots) | « Voyez votre progression » (mots appris) | XP + path + « % fluent » | « progress you can feel » | maîtrisé vs bloqué (adaptatif) |
| Erreur | Révèle la réponse + explication, **pas de re-queue** | — | **re-présente les items ratés dans la leçon** | SRS : intervalle raccourci → revient plus tôt | Correction immédiate + explication + re-tentative |
| Révision | SRS Leitner séparé (`/review`) | SRS 1/3/7 j | « Personalized Practice » | REVIEW séparé | n/a |
| Motivation | Sobre (célébration dorée, pas de XP) | Coach virtuel + régularité | Gamification lourde (streak/ligues) | Progrès ressenti + natif authentique | Streaks/levels/goals |
| Sessions | ~1 leçon (non annoncée) | 5 min/jour annoncé | ~5 min annoncé | 15 min/jour annoncé | ~20 min annoncé |
| Coach/tuteur | Mascotte (émotionnelle) | Coach virtuel organisateur | Mascotte Duo | — | Koji (tutor adaptatif) |

---

## C. FORCES ACTUELLES DE HIKMA

1. **Rappel actif machine-noté** (`FORM_TO_MEANING`, `MEANING_TO_FORM`) — le
   mécanisme de rétention le plus robuste (Anki), déjà présent.
2. **SRS séparé et propre** (Leitner) — la révision est un flux distinct, pas
   mélangé à la découverte.
3. **Feedback pédagogique avec explication** (`HikmaExplanation`, MASAQ) — proche
   de Brilliant : le « pourquoi », pas seulement vrai/faux.
4. **Progression réelle et honnête** (Phases 34–35) : pas de « % fluent » inventé,
   pas de maîtrise simulée. C'est un différenciateur de confiance fort.
5. **Ancrage sourate/ayah réel** (`LessonAyahContext`, `CONTEXT_RECOGNITION`) —
   le mot est toujours relié au verset que l'utilisateur récite.
6. **Grading libre rigoureux** (synonymes validés, homographes arabes, pas de
   fuzzy matching) — la correction ne triche pas.
7. **Persistance soignée** (reprise exacte, anti-double-soumission, erreurs
   partielles ≠ perte) — la progression n'est jamais mise en doute.

---

## D. FAIBLESSES ACTUELLES

1. **Aucune re-présentation après erreur** (P1 de 36A) — l'utilisateur révèle la
   réponse puis avance sans jamais re-tenter. Faible rétention immédiate.
2. **Pas d'annonce de durée / d'étapes en entrée** — l'effort n'est pas cadré,
   l'anticipation est faible.
3. **Fin de leçon** sans « quand revenir » (prochaine révision due) et sans nom
   de sourate visible en leçon ordinaire.
4. **Accessibilité** : radiogroup sans flèches, champ libre sans `<label>`.
5. **Feedback d'erreur** plutôt « information » que « réessai » — il n'y a pas
   d'issue constructive au-delà du « Continuer ».
6. **Pas de signature émotionnelle forte en entrée de leçon** — la promesse
   « tu vas mieux comprendre ce que tu récites » n'est pas rappelée au moment
   de l'effort.

---

## E. OPPORTUNITÉS

1. **Ancrer chaque mot dans l'ayah** comme fil conducteur visible (« ce mot,
   tu le récites dans Al-Fātiḥah 1:3 ») — c'est le différenciateur que Quran
   Progress affirme en marketing mais que Hikma peut rendre **structurellement
   vrai dans l'exercice** (contexte déjà disponible).
2. **Cadrage d'entrée** (X mots · ~Y min · compétences) — lever la friction
   d'incertitude sans compteur anxiogène.
3. **Re-queue douce après erreur** en fin de session (voir §10) — sans toucher
   au grading/SRS.
4. **Fin de leçon à 3 choix hiérarchisés** (Continuer / Revoir / Mes sourates)
   + « prochaine révision dans X j ».
5. **Micro-célébrations hiérarchisées** (réponse → leçon → sourate → milestone)
   en restant sobre.

---

## F. RISQUES

1. **R1 (P0)** — Sur-gamifier : importer streaks/XP/ligues de Duolingo
   dénaturerait Hikma et créerait une pression culpabilisante. **À éviter.**
2. **R2 (P1)** — Un « % de maîtrise » ou « N mots appris » affiché sans base
   pédagogique honnête détruirait la confiance (le principal avantage actuel).
3. **R3 (P1)** — Une re-queue après erreur qui réactive le **grading** (re-noter
   le mot) au lieu du **séquenceur** risquerait de fausser mastery/SRS.
4. **R4 (P2)** — Une annonce de durée trop précise et fausse (ex. « 3 min 12 s »)
   créerait une attente déçue.
5. **R5 (P2)** — Un feedback d'erreur trop « célébrant » (confettis sur erreur)
   banaliserait la célébration.

---

## G. RECOMMANDATIONS PRIORISÉES

### P0 — aucune (aucun risque critique)

### P1

| # | Recommandation | Justification | Risque |
| - | -------------- | ------------- | ------ |
| P1-1 | **Re-queue douce du mot raté en fin de session** (mini-révision de fin, sans re-grading ni re-SRS — voir §10) | Corrige la plus grande faille de rétention ; aligné sur Duolingo (re-présentation) et Anki (revenir sur le difficile) | Réintroduire le mot sans re-noter ; ne pas toucher mastery |
| P1-2 | **Signature « ce mot, tu le récites déjà »** : rappeler le verset d'origine du mot pendant l'exercice (lien discret vers l'ayah) | Renforce le différenciateur central et le sentiment de sens | Aucun (contexte déjà chargé) |

### P2

| # | Recommandation | Justification |
| - | -------------- | ------------- |
| P2-1 | **Cadrage d'entrée** : « N mots · ~X min · ce que tu vas pratiquer » en tête de découverte | Anticipation + effort perçu réduit |
| P2-2 | **Fin de leçon** : nom de sourate + « prochaine révision dans X j » | Clôture claire + continuité |
| P2-3 | **Accessibilité** : flèches sur radiogroup + `<label>`/`aria-describedby` sur champ libre | Conformité + clavier + lecteurs d'écran |
| P2-4 | **Feedback d'erreur constructif** : wording « à fixer » plutôt que « échec » + réécoute proposée | Transforme l'erreur en information |

### P3

| # | Recommandation | Justification |
| - | -------------- | ------------- |
| P3-1 | Harmoniser les dénominateurs de progression (mot vs exercice) | Lisibilité |
| P3-2 | Libellé audio « Réécouter pour ancrer » après erreur | Ré-écoute incitative |
| P3-3 | Corriger « Auto-évaluation » ambigu (WORD_TO_AUDIO noté) | Clarté |

---

## H. PROPOSITION DE PARCOURS IDÉAL

```
DÉCOUVERTE
  « Dans cette leçon : N mots que tu récites déjà · ~X min »
  mot arabe dominant → translittération → écoute → sens révélé
        ↓  (rappel de l'ayah : « ce mot apparaît dans Al-Fātiḥah 1:3 »)
COMPRÉHENSION
  contexte coranique en français (disclosure) + prononciation guidée
        ↓
EFFORT (séquence cumulative, inchangée)
  reconnaissance → rappel → production → audio → contexte → lemme
        ↓
FEEDBACK
  correct → micro-feedback sobre
  incorrect → « pas encore fixé » + bonne réponse + explication + réécoute
        ↓
RENFORCEMENT (NOUVEAU, P1-1)
  les mots ratés reviennent UNE fois en fin de session, sans re-grading
        ↓
PROGRESSION
  fin de leçon : stats réelles + progression de la sourate
        ↓
PROCHAINE ACTION
  [Continuer — leçon suivante] / [Réviser mes mots (X dus)] / [Mes sourates]
```

Ce parcours est une **couche de présentation/séquencement**, pas un nouveau
moteur : grading, scoring, SRS, mastery et curriculum restent intacts.

---

## 10. ANALYSE — RE-QUEUE APRÈS ERREUR (P1 de 36A)

### Comment les références gèrent la situation

- **Duolingo** : une réponse fausse **re-présente l'item plus tard dans la même
  leçon** (et le recycle dans la « Personalized Practice »). L'erreur ne clôt
  jamais l'apprentissage du mot.
- **Memrise / Anki (SRS)** : l'erreur **raccourcit l'intervalle** ; le mot
  revient **plus tôt à la prochaine session**, pas forcément dans la session
  courante. La logique est temporelle, pas immédiate.
- **Brilliant** : correction immédiate + explication, puis **possibilité de
  re-tenter** l'étape jusqu'à ce que ça « clique ».

### Options pour Hikma (séquenceur uniquement — jamais le grading/SRS)

| Option | Avantage | Risque | Verdict |
| ------ | -------- | ------ | ------- |
| Revenir **immédiatement** | Renforcement instantané | Casse le flux, peut frustrer | ❌ |
| **Mini-révision en fin de session** | Renforce sans casser le flux ; sentiment de clôture | Légère complexité du séquenceur | ✅ **recommandé** |
| Repousser à la **prochaine session** | Simple (SRS s'en charge déjà) | Perd la rétention immédiate ; ne résout pas le P1 | ⚠️ insuffisant seul |
| Re-grader le mot | — | **Modifierait mastery/SRS** (interdit) | ❌ |

### Recommandation

**Mini-révision de fin de session** : après le dernier exercice noté, re-présenter
une fois (QCM de reconnaissance, sans re-grading) chaque mot ayant eu au moins une
réponse incorrecte dans la session. Ce bloc est **présenté comme un renforcement**
(« Revoyons les mots qui t'ont résisté »), ne touche ni la progression, ni le
mastery, ni le SRS, et respecte l'invariant absolu.

---

## 11. ANALYSE — CORRECTEUR DE RÉPONSE LIBRE (partiel vs complet)

**Comportement actuel vérifié** : `« maître »` face à `« souverain / maître »`
→ `CORRECT` (car `glossVariants` découpe la glose et accepte chaque synonyme seul).

### Évaluation pédagogique

- **Exactitude** : le sens produit est vrai — « maître » est un des sens acceptés.
- **Compréhension réelle** : un seul synonyme correct atteste d'une compréhension
  **partielle** mais réelle, pas d'une erreur.
- **Faux positifs** : quasi nuls (pas de fuzzy matching ; un synonyme hors-liste
  reste refusé).
- **Réponse partielle ≠ réponse erronée** : la distinction est déjà correctement
  établie (erronée = hors-liste = INCORRECT).

### Politique proposée (documentée, **sans changement maintenant**)

| Verdict | Définition | Usage Hikma |
| ------- | ---------- | ----------- |
| `EXACT` | tous les synonymes/la forme attendue | — |
| `ACCEPTED_VARIANT` | un synonyme validé (sous-ensemble) | **c'est le cas « maître » aujourd'hui → CORRECT** |
| `PARTIAL` | sous-ensemble sémantique **significatif** (ex. une phrase tronquée) | **FUTURE_WORK uniquement** — n'existe pas, ne pas inventer |
| `AMBIGUOUS` | homographe arabe (vocalisation différente) | déjà en place |
| `INCORRECT` | hors liste / lexème différent | déjà en place |

**Conclusion** : les recherches ne justifient **pas** un changement immédiat du
grading. Accepter « maître » seul comme `CORRECT` est pédagogiquement défendable
et sûr. La seule évolution envisageable à terme serait un `PARTIAL` **seulement
si** on souhaite nuancer la progression (moins de crédit pour un rappel partiel) —
mais cela toucherait la mastery et sort du périmètre de cette phase. **Status quo
recommandé.**

---

## 12. CÉLÉBRATIONS — HIÉRARCHIE PROPOSÉE

### Éviter les deux extrêmes

- Trop peu : « Leçon terminée. » (froid, abandon).
- Trop : confettis permanents, gamification artificielle (Duolingo sur-dosé).

### Hiérarchie pour Hikma (sobre, doré réservé à l'émotion)

| Niveau | Déclencheur | Traitement |
| ------ | ----------- | ---------- |
| **Micro** (réponse juste) | bonne réponse | feedback texte bref + icône, **pas de confettis** |
| **Leçon** | fin de leçon ordinaire | mascotte + stats + CTA, léger accent doré |
| **Sourate** | vraie transition vers `completed` | confettis dorés/teal courts + « Parcours terminé » (déjà en place) |
| **Milestone** | seuil réel (ex. première sourate terminée, 10e leçon) | célébration spéciale discrète |

Contraintes : `prefers-reduced-motion`, teal structurel, doré émotionnel, aucune
couleur arbitraire. **Le déclenchement doit toujours être une transition réelle,
jamais un état persistant.**

---

## 13–14. SIGNATURE HIKMA & MATRICE QURAN PROGRESS

### Matrice

| Idée | Quran Progress | Hikma actuel | Adaptation possible |
| ---- | -------------- | ------------ | ------------------- |
| Vocabulaire progressif | 125 mots = 50 % du Coran (fréquence) | Par sourate (sourate 1 d'abord) | Garder la progression **par sourate** (plus fidèle au parcours de récitation) |
| Répétition espacée | SRS 1/3/7 j | Leitner SRS séparé | Identique ; Hikma peut afficher « prochaine révision dans X j » |
| Exercices | Quiz/QCM/écriture/devinettes | 14 types, rappel libre machine-noté | Hikma a l'avantage du **rappel libre** (plus exigeant) |
| Progression | « Voyez votre progression » | Progression réelle par sourate | Déjà meilleur (honnête, par sourate) |
| Coach | Coach virtuel organisateur | Mascotte émotionnelle + parcours auto | Garder la mascotte (émotion), pas de faux « coach IA » |
| Recommandations | — | `selectActiveLearningPath` déterministe | Déjà en place |
| Sessions courtes | 5 min/jour annoncé | non annoncé | **Ajouter un cadrage de durée** (P2-1) |
| Motivation | Régularité, sans pression | Célébration sobre, pas de streak | **Ne pas** importer le streak culpabilisant |

### La signature UX de Hikma (ce que Quran Progress n'a pas)

> **Hikma ne fait pas « apprendre des mots fréquents » : elle fait « retrouver,
> dans la sourate que tu récites, le mot que tu viens de comprendre ».**

La boucle mentale différenciante (validée comme fil conducteur) :

```
Je récite une sourate → je reconnais un mot → je découvre son sens
→ je m'entraîne à le rappeler → je le retrouve dans l'ayah
→ je comprends mieux ce que je récite.
```

Concrètement : **chaque exercice peut porter un lien discret vers l'ayah réel
d'origine** (« Ce mot apparaît dans Al-Fātiḥah 1:3 »), utilisant le
`LessonAyahContext` **déjà chargé**. C'est l'opportunité P1-2, sans donnée
nouvelle, sans nouveau moteur.

---

## 15–16. DURÉE DES SESSIONS

- **Duolingo** : ~5 min, annoncé (« short lessons »).
- **Memrise** : 15 min/jour.
- **Brilliant** : ~20 min.
- **Quran Progress** : « 5 minutes par jour suffisent ».

### Proposition Hikma

En tête de découverte, une ligne **non anxiogène** et **dérivée de données réelles** :

> « Dans cette leçon : {N} mots · {~X} exercices · une courte session. »

Règles :
- Ne **jamais** afficher un temps précis inventé (« 3 min 12 s »).
- Déduire `~X` du nombre d'exercices réels + de la préférence `daily_duration`
  si présente ; sinon rester générique (« quelques minutes »).
- Afficher « Exercice 4 / 12 » (déjà en place) pour la position, sans compteur
  de temps restant.

---

## 17. ERREURS ET FRUSTRATION

Une mauvaise réponse doit dire **« pas encore fixé »**, jamais **« échec »**.

| Élément | Actuel | Recommandé |
| ------- | ------ | ---------- |
| Wording | « Ce n'est pas la réponse attendue. » | « Pas encore fixé — la bonne réponse était X. » |
| Couleur | destructive/rouge (correct, signale l'écart) | conserver (cohérence) |
| Feedback | bonne réponse + explication | + **réécoute proposée** (« Réécouter pour ancrer ») |
| Continuité | « Continuer » | conserver + **mini-révision de fin** (P1-1) |

**Principe** : l'erreur est une information pédagogique, pas une sanction. Aucune
animation négative, aucun son d'échec, aucun streak brisé.

---

## 18. FIN DE LEÇON — STRUCTURE PROPOSÉE

```
Bravo 👏
Tu viens de travailler {N} mots dans {sourate}.

[Progression de la sourate : 3/8]

[ Continuer — {leçon suivante} ]   ← action principale
[ Réviser mes mots ({X} dus) ]      ← secondaire, si SRS due
[ Retourner à mes sourates ]        ← tertiaire
```

Hiérarchie : la **continuité de parcours** prime (aligné sur la priorité
« progression réelle > recommandation »). La révision SRS reste disponible mais
secondaire. Le nom de sourate est affiché (P3-2 corrigé).

---

## 19. APRÈS UNE ABSENCE

Données réelles uniquement (progression, sessions, révisions, SRS) — jamais de
progression inventée.

| Absence | Expérience au retour |
| ------- | -------------------- |
| 1 jour | « Reprends où tu t'es arrêté » + révisions dues (si SRS) |
| 3 jours | idem + accent sur les révisions dues (« X mots t'attendent ») |
| 1 semaine | accueil neutre + reprise exacte (session conservée) + révisions dues |
| 1 mois | accueil neutre + reprise exacte, **pas de culpabilisation**, pas de streak brisé |

**Règle** : Hikma ne punit jamais l'absence. Le retour se fait sur la **progression
réelle** (session active → prochaine leçon → révisions dues → recommandation).
Aucun message du type « Tu as perdu ta série ».

---

## 20. DASHBOARD — TEST DES 3 SECONDES

**Question** : en 3 secondes, comprend-on quoi faire maintenant ?

**Verdict** : **oui, en grande partie** — le CTA principal (« Reprendre /
Continuer / Découvrir / Réviser ») est la première carte, en haut, avec la sourate
et la progression. C'est déjà aligné sur la meilleure pratique.

**Ajustement recommandé (P3)** : l'en-tête actuel est verbeux (« Ton prochain
pas » + salutation + phrase d'ouverture). Un utilisateur pressé devrait voir
**l'action + la sourate** en premier. Réduire la copie d'ouverture pour laisser
respirer le CTA.

Hiérarchie conservée : action immédiate → progression → révision → découverte →
exploration.

---

## 21. /SURAHS — ÉVALUATION

La structure actuelle est **optimale** et cohérente avec les phases 34–35 :

1. `Continuer ton parcours` (progression réelle) ✓
2. `Pour toi` (recommandation, secondaire) ✓
3. `Continuer` (autres en cours) ✓
4. `Prêtes à apprendre` (not_started) ✓
5. `Parcours terminés` ✓
6. `Bientôt disponibles` (IN_PREPARATION, sans CTA) ✓

Aucune progression fictive, aucune préférence transformée en progression, aucun
CTA vers `IN_PREPARATION`. **Aucun changement structurel requis.** Seul un
polissage visuel de la carte « Continuer ton parcours » (P2) pourrait renforcer
la hiérarchie (doré discret, non surchargé).

---

## 22. ACCESSIBILITÉ (recommandations ciblées)

Déjà bon : `aria-live` sur feedback et audio, `role=radio/radiogroup`,
alternative visuelle pour l'audio, focus visible, `prefers-reduced-motion`.

À corriger (P2) :
1. **Flèches** dans les radiogroups (comportement radio natif).
2. **`<label>` / `aria-describedby`** sur le champ libre de rappel.
3. **`aria-invalid`** sur le champ en cas d'erreur (associé au feedback).

Aucune validation navigateur déclarée PASS (aucun navigateur contrôlable) :
`BROWSER_VALIDATION_LIMITED`.

---

## I. MICROCOPY PROPOSÉE (exemples, voix Hikma — sobre, chaleureuse, coranique)

| Contexte | Proposition |
| -------- | ----------- |
| Bonne réponse | « Très bien. » / « Mā shā' Allāh — tu as retrouvé ce mot. » |
| Mauvaise réponse | « Pas encore fixé. La bonne réponse était « {sens} ». Réécoute pour l'ancrer. » |
| Réponse partielle | « C'est un des sens possibles. » (status quo, sans verdict PARTIAL) |
| Début de leçon | « Dans cette leçon : {N} mots que tu récites déjà · une courte session. » |
| Progression | « Exercice {X} / {N} · {compétence} » |
| Fin de leçon | « Bravo 👏 — {N} mots travaillés dans {sourate}. » |
| Fin de sourate | « Parcours terminé — tu as parcouru {sourate} et découvert ses mots. » |
| Révision | « {X} mots t'attendent aujourd'hui pour les ancrer durablement. » |
| Retour après absence | « Content de te revoir. Reprends où tu t'es arrêté. » (jamais de culpabilisation) |

---

## J. CÉLÉBRATIONS (synthèse finale)

| Niveau | Déclencheur | Rendu |
| ------ | ----------- | ----- |
| Micro | bonne réponse | feedback texte + icône (aucun confetti) |
| Leçon | fin de leçon | mascotte + stats + CTA (accent doré discret) |
| Sourate | vraie transition `completed` | confettis dorés/teal courts (déjà en place) |
| Milestone | seuil réel (1re sourate, 10e leçon) | célébration spéciale discrète |

Toujours : transition réelle, `prefers-reduced-motion`, teal structurel, doré émotionnel.

---

## K. DÉCISION PRODUIT — LES 3 À 5 AMÉLIORATIONS À PLUS FORT IMPACT

1. **Mini-révision de fin de session** (P1-1) — re-présenter une fois les mots
   ratés, sans re-grading. *Impact : rétention immédiate.*
2. **Signature « ce mot, tu le récites déjà »** (P1-2) — lien discret vers l'ayah
   d'origine pendant l'exercice. *Impact : différenciation + sens.*
3. **Cadrage d'entrée de leçon** (P2-1) — « N mots · ~X min · compétences ».
   *Impact : anticipation + effort perçu réduit.*
4. **Fin de leçon enrichie** (P2-2) — sourate + prochaine révision due + CTA
   hiérarchisés. *Impact : clôture + continuité.*
5. **Accessibilité + microcopy d'erreur** (P2-3, P2-4) — flèches, labels, wording
   « pas encore fixé ». *Impact : confiance + conformité.*

---

## DÉCISION FINALE

`PHASE_36B_RESEARCH_COMPLETE_READY_FOR_IMPLEMENTATION`

La recherche confirme que Hikma possède déjà les mécanismes pédagogiques
essentiels (rappel actif, SRS, feedback avec explication, progression honnête).
Les améliorations à plus fort impact sont **présentationnelles et de séquencement**
— aucune ne touche le grading, le scoring, le SRS, la mastery, le scheduler, le
curriculum, le Quran, les traductions, MASAQ ou le corpus lexical.

**Deux décisions produit à confirmer avant implémentation** (recommandations
par défaut fournies) :
1. **Timing de la re-queue après erreur** → recommandé : mini-révision en fin de
   session (pas immédiat, pas de re-grading).
2. **Politique de rappel partiel** → recommandé : **status quo** (un synonyme
   validé reste `CORRECT`), pas de verdict `PARTIAL` pour l'instant.

Aucune implémentation n'a été effectuée dans cette phase. Aucun commit.

---

## LIMITATIONS

- `web_search` (Serper) **indisponible** dans cet environnement : recherche faite
  sur les pages officielles via extraction directe (URLs listées §A).
- Khan Academy **bloquée** (anti-bot) : exclue du benchmark.
- **`BROWSER_VALIDATION_LIMITED`** : aucune validation visuelle/navigateur
  effectuée ; les analyses responsive/accessibilité sont statiques.
