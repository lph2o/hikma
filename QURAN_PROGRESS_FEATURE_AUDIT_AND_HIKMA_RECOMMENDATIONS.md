# QURAN PROGRESS — FEATURE AUDIT & RECOMMANDATIONS HIKMA

## Statut

`READ_ONLY / RESEARCH / GAP_ANALYSIS` — aucune migration, aucun changement DB,
aucune modification UI, aucun commit. Sources consultées : site officiel
`quranprogress.com` (page d'accueil + index de blog), extraites en lecture seule.
`web_search` (Serper) est resté indisponible (`WEB_RESEARCH_LIMITED`) ; les
observations proviennent donc des pages officielles réellement lues.

---

## 1. Executive summary

Le cœur pédagogique de Quran Progress — **comprendre un mot qu'on récite déjà,
l'ancrer par répétition espacée, voir sa progression** — est **déjà implémenté
dans Hikma** (et souvent plus finement : maîtrise par compétence, porte de
rétention, 14 types d'exercices, contexte de verset réel, retry d'écriture
arabe). Il ne faut **rien recréer** de cette base.

Deux idées de Quran Progress méritent une étude réelle pour Hikma :

1. **(P1) Le signal « tu comprends déjà X % du Coran »** fondé sur la
   **fréquence** des mots — le levier motivationnel le plus puissant de Quran
   Progress (« 125 mots = 50 % »). Hikma possède déjà les données
   (`word_occurrences`, 77 430 lignes) pour calculer **sa propre** couverture,
   sans migration et sans copier la liste de Quran Progress.
2. **(P2) Un « coach » / plan quotidien léger** sur le dashboard (reformulation
   de données déjà calculées : prochaine leçon, révisions dues, recommandation).

Tout le reste (cours d'alphabet, multilingue, gamification lourde) est **hors
cible** pour Hikma. Aucun P0.

---

## 2. Fonctionnalités observées (inventaire factuel)

Depuis `quranprogress.com` (accueil + blog) :

| # | Fonctionnalité observée | Détail |
| --- | --- | --- |
| 1 | Positionnement « comprends ce que tu récites » | chaque mot appris = un mot déjà récité ; salat/lecture prennent sens |
| 2 | Statistique de fréquence | « 125 mots = 50 % du texte », « 250 mots = 75 % », 4 000+ mots |
| 3 | Répétition espacée | plan de révision auto, intervalles 1 j / 3 j / 7 j |
| 4 | Coach virtuel | organise l'apprentissage selon le rythme (débutant → avancé) |
| 5 | Micro-sessions | « 5 minutes par jour suffisent » |
| 6 | Exercices variés | Quiz, QCM, écriture, devinettes |
| 7 | Parcours en 3 étapes | Découvrir un mot (arabe+audio+sens) → Ancrer (exercices) → Voir sa progression |
| 8 | Progression visible | suivi jour après jour |
| 9 | Multi-langues | interface + traductions en 6 langues (fr, en, de, tr, id, ms) |
| 10 | Accessible débutant | translittération + audio + traduction, difficulté progressive |
| 11 | Gamification | « apprendre en s'amusant », devinettes, ton ludique |
| 12 | Objectif journalier | l'utilisateur choisit son temps de révision quotidien |
| 13 | Apprendre à lire l'arabe | guides alphabet → lecture (blog) |
| 14 | Angle prière/salat | « comprendre sa prière » (Al-Fātiḥah + sourates courtes) |

---

## 3. Comparaison avec Hikma (déjà présent / manquant / différent)

| Fonctionnalité | Hikma actuel | Écart |
| --- | --- | --- |
| Comprendre ce qu'on récite | **Déjà présent** (signature 36C, `LessonAyahContext`) | égal / supérieur |
| Répétition espacée | **Déjà présent** (review_items + Leitner + rétention) | supérieur |
| Parcours découvrir→ancrer→progresser | **Déjà présent** (discovery → exercices → progression sourate) | égal |
| Exercices variés | **Déjà présent** (14 types : QCM, rappel libre, audio, contexte, lemme, phonétique) | supérieur |
| Progression visible | **Déjà présent** (dashboard goal ring, historique F4, progression/sourate 34B) | égal |
| Translittération + audio + traduction | **Déjà présent** | égal |
| Objectif/rythme | **Déjà présent** (daily_duration + daily_goal + onboarding) | égal |
| Angle salat/prière | **Déjà présent** (Al-Fātiḥah référence + sourates courtes) | égal |
| **Fréquence / couverture du Coran** | **Manquant** (aucun « % du Coran compris ») | à étudier |
| **Coach virtuel / plan quotidien** | **Partiel** (recommandation + progression déterministes, sans narration « coach ») | à étudier |
| Apprendre à lire l'arabe (alphabet) | **Absent** (cible = déjà récite) | hors cible |
| Multi-langues | **Absent** (FR d'abord, documenté Phase 5) | hors cible |
| Gamification lourde | **Absent** (philosophie sobre, documentée 36B/C) | hors cible |

---

## 4. Fonctionnalités recommandées (priorisées)

### P0 — indispensable

**Aucune.** Le moteur et la boucle d'apprentissage sont déjà complets et
validés.

### P1 — forte valeur

1. **Couverture de compréhension du Coran** (signal de fréquence).
   - « Tu comprends déjà **X %** du texte coranique (N mots distincts
     maîtrisés parmi les plus fréquents). »
   - **Données** : entièrement dérivables de `word_occurrences` (77 430) ×
     `user_word_progress` / maîtrise — **aucune migration**, calcul en lecture
     seule. Hikma calcule **sa propre** fréquence, jamais la liste de Quran
     Progress.
   - **Impact pédagogique** : motivation fondée sur du réel (« chaque mot me
     rapproche de la compréhension »), cohérente avec la signature Hikma.
   - **Complexité** : moyenne (agrégat SQL + projection UI). Priorité : stat
     d'abord, explorateur ensuite.

2. **(Complément possible)** Explorateur « mots les plus fréquents » — vue de
   découverte ordonnée par fréquence, **complémentaire** au parcours par
   sourate (jamais un remplacement). À découpler de (1).

### P2 — intéressant

3. **Plan quotidien léger / « coach » narratif** sur le dashboard : une phrase
   récapitulative réutilisant les données déjà calculées (session active,
   prochaine leçon, révisions dues, recommandation) sans nouvelle logique.
   Faible coût, renforce le sentiment d'accompagnement.

### P3 — faible priorité

4. **Régularité douce** : « X jours actifs » dérivé de l'historique d'activité
   (déjà calculé), présenté sans culpabilisation. Frontière avec la
   gamification — à n'aborder que si un vrai besoin produit émerge.

### REJECT — ne pas intégrer

- **Cours d'alphabet / lecture arabe** : cible Hikma = utilisateurs qui savent
  déjà réciter ; hors positionnement.
- **Multi-langues (6)** : Hikma est FR-d'abord (limitation documentée Phase 5) ;
  coût énorme, hors priorité.
- **Gamification lourde** (XP/streak/pièces/devinettes) : contraire à la
  philosophie documentée (36B/C) « sobre, éducatif, motivant ».
- **Copie des listes « 125 mots », contenus, audio, traductions, UI** : contenu
  protégé — interdit (cf. §7).

---

## 5. Fonctionnalités déjà présentes dans Hikma (ne pas recréer)

Répétition espacée (SRS + rétention) · maîtrise par compétence · 14 types
d'exercices · contexte de verset réel + traduction Hamidullah · signature
« ce mot que tu récites déjà » · retry d'écriture arabe · progression par
sourate + globale + activité quotidienne · objectif quotidien · onboarding
personnalisé · recommandation déterministe · clavier arabe · RTL / mobile-first
/ accessibilité · célébrations sobres.

---

## 6. Risques techniques

- **(1) Couverture de fréquence** : agréger 77 430 occurrences par mot distinct
  doit être une **requête batch unique** (aucun N+1) ; la couverture doit
  s'appuyer sur la maîtrise **réelle** (`user_word_progress` / mastery), jamais
  sur les préférences ni les recommandations. Attention à la distinction
  forme/lemme : un mot « compris » doit être dédupliqué par lemme/forme pour
  éviter un gonflage artificiel du %.
- **(3) Plan quotidien** : pure couche de présentation — ne doit jamais
  réintroduire de sélection non déterministe (réutiliser `selectActiveLearningPath`
  et les révisions dues existantes).
- Aucun risque P0/P1 sur le moteur existant tant que ces ajouts restent en
  lecture seule.

## 7. Risques licence / IP

- **Idée/concept** (fréquence = couverture, SRS, plan quotidien) : non
  protégeable, étudiable librement.
- **Contenu protégé de Quran Progress** (liste « 125 mots », traductions, audio,
  illustrations, mascotte, textes UI) : **ne jamais réutiliser**. Hikma possède
  ses propres données (`quran_words` 21 296, `word_occurrences` 77 430,
  traductions Hamidullah, gloses FR Hikma) : toute statistique de fréquence doit
  être calculée **sur ces données propres**.
- Aucune dépendance de code tiers, aucun dataset externe nécessaire pour (1)/(3).

## 8. Impact pédagogique

- **(1)** Renforce la motivation **sans gamification** : le % vient de mots
  réellement maîtrisés, et relie directement l'effort (« j'apprends des mots »)
  à la compréhension (« je couvre X % du Coran »). C'est l'extension naturelle
  de la signature Hikma.
- **(3)** Réduit la charge de décision quotidienne (« que faire maintenant ? »)
  et humanise le retour à l'apprentissage.
- **(4)** Utile seulement si non culpabilisant ; sinon, rejeter.

## 9. Proposition de roadmap

1. **Étape 1 (P1)** — Stat de couverture du Coran : requête batch de fréquence
   + projection dans `/surahs` ou `/profile` (aucune migration).
2. **Étape 2 (P2)** — Plan quotidien léger sur le dashboard (couche de copy).
3. **Étape 3 (P1, optionnel)** — Explorateur « mots les plus fréquents »
   (après validation produit du stat de l'étape 1).
4. **Backlog** — Régularité douce (P3), à n'ouvrir que sur besoin réel.

## 10. Décision finale

**À intégrer**
- Couverture de compréhension du Coran (fréquence, données propres) — P1.
- Plan quotidien léger / coach narratif — P2.

**À étudier plus tard**
- Explorateur « mots les plus fréquents » — P1 optionnel.
- Régularité douce — P3.

**À ne pas intégrer**
- Cours d'alphabet/lecture · Multi-langues · Gamification lourde · tout contenu
  protégé de Quran Progress.
