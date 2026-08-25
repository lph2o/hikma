# PHASE 72 — AUDIT APPROFONDI QURAN PROGRESS → DÉCISION PRODUIT HIKMA

```text
PHASE_72_QURAN_PROGRESS_AUDIT

STATUS = COMPLETE
DATABASE_WRITES = 0
LEXICAL_WRITES = 0
CODE_WRITES = 0
MIGRATIONS = 0
SEEDS = 0
HOLDS_PROCESSED = false
LOT_16_STARTED = false
```

## 0. Nature de la phase

Phase `RESEARCH / AUDIT / COMPARISON / PRODUCT STRATEGY / PEDAGOGICAL ANALYSIS / DECISION SUPPORT`. Aucune implémentation. Pipeline lexical `FROZEN`, 3 HOLDs intacts, aucun commit, aucun push.

Méthode : étude des sources publiques officielles de Quran Progress (site, blog, CGU, fiches App Store / Google Play), recoupement avec l'état réel du code Hikma (lecture seule), puis décision produit. Chaque affirmation importante est étiquetée `SOURCE` + `CONFIDENCE` (HIGH / MEDIUM / LOW). Ce qui n'a pas pu être vérifié est marqué `NOT_VERIFIED` — jamais inventé.

---

## A. Executive Summary

Quran Progress (QP) est l'application mobile de référence du « vocabulaire coranique » : lancée en 2016, ~500K utilisateurs revendiqués, 4,9/5 sur les stores (site), 6 812 notes sur le store App Store France au moment de l'audit (HIGH — lookup iTunes API), freemium par abonnement. Sa promesse : « Comprenez enfin ce que vous récitez », 5 minutes par jour, répétition espacée, coach virtuel.

**Ce que QP fait mieux ou différemment (confirmé) :**
1. Un message de couverture extrêmement efficace : « 125 mots → 50 % du texte, 250 mots → 75 % » — simple, mémorable, partageable.
2. Un parcours `FREQUENCY-FIRST` assumé (les mots les plus répétés d'abord), complété par un cours d'alphabet et des « groupes de mots » (collocations de 2 à 5 mots).
3. Une promesse d'effort minimal et ritualisée : « 5 minutes par jour », plan de révision généré automatiquement, notifications de révision.
4. Un éventail d'exercices ludiques revendiqué (quiz, QCM, écriture, devinettes) et un contenu étendu (4 000+ mots, tomes de Médine).

**Ce que Hikma fait déjà mieux (confirmé par le code) :**
1. Ancrage dans le corpus réel : formes (`quran_words` 21 296), occurrences (77 430), traductions (24 944), gloses éditoriales validées (4 490 FR), données linguistiques MASAQ (22 485 occurrences, 44 677 segments), explications pédagogiques après chaque erreur.
2. Pédagogie plus structurée : compétences (reconnaissance → rappel → production → audio → contexte → lemme), maîtrise 0-100 par compétence, porte de rétention, séquenceur cumulatif.
3. Curriculum sourate-first aligné sur la règle « APPRENDRE CE QUE L'ON RÉCITE », leçon par verset réel.
4. Correction des réponses tolérante (variantes sémantiques « maître / souverain »), SRS Leitner borné et remplaçable, métriques rigoureuses (couverture pondérée par occurrences, affichée comme « ≈ estimation »).
5. Aucune pression commerciale : pas d'énergie, pas de quota, gratuit.

**Décisions clés :**
- **Curriculum** : conserver le socle sourate-first ; intégrer une couche fréquence (groupes de mots + mots les plus fréquents) comme **complément**, pas comme remplacement (Modèle C hybride, sourate-first prioritaire).
- **Énergie** : **pas de système d'énergie** (Option A). Le freemium Hikma, s'il vient, ne doit jamais bloquer la boucle d'apprentissage.
- **À adopter (ADAPT)** : rappels de révision (notifications web push), groupes de mots fréquents, module lecture/alphabet pour non-lecteurs, communication couverture calibrée, framing « 5 minutes ».
- **À ne pas copier (REJECT)** : les chiffres de couverture marketing non étayés, le remplacement du contexte par la fréquence pure, la gamification non prouvée, tout quota dur lié au Premium.
- **Gap n°1 de Hikma** : les mécanismes de retour/régularité (rappel de révision, signal de régularité doux). Gap n°2 : la couche fréquence. Gap n°3 : présence mobile (QP est mobile-first ; Hikma est web).
- **Prochaine phase recommandée** : PHASE 73 = « RÉGULARITÉ & RAPPELS » (infrastructure de notification + statistiques de régularité douces), puis PHASE 74 = couche fréquence (groupes de mots).

---

## B. Quran Progress — Product Map

| Dimension | Constat | Source / Confiance |
|---|---|---|
| Plateforme | App mobile iOS + Android (hybride Ionic — `com.ionicframework.qpionic711514`) | Play Store ID (HIGH) |
| Lancement | 2016 | about (HIGH) |
| Taille revendiquée | 500K+ utilisateurs actifs ; 4,9/5 ; 28 000+ avis | site/about (HIGH pour la revendication) ; App Store FR : 4,89/5, 6 812 notes (HIGH) |
| Langues | FR, EN, DE, TR, ID, MS (interface + traductions des mots) ; la fiche App Store FR ne déclare que `EN` | site (HIGH) / iTunes lookup (HIGH) |
| Promesse | « Comprenez enfin ce que vous récitez » ; comprendre ses prières ; 5 min/jour | homepage (HIGH) |
| Contenu | 4 000+ mots (site) vs « +1500 mots les plus répétés » (description App Store FR) — **incohérence marketing relevée** | site (HIGH) / App Store (HIGH) |
| Sources lexicales | Analyse de fréquence du Dr AbdulAzeez Abdurraheem (Understand Al-Qur'an Academy) ; vocabulaire coranique + tomes de Médine vol. 1-2 | about, blog (HIGH) |
| Structure du parcours | Alphabet (si besoin) → 125 mots les plus fréquents → groupes de mots (2-5 mots) → vocabulaire étendu ; chaque mot : arabe, translittération, audio, contexte coranique | blog guide (HIGH) |
| Méthode | Répétition espacée (intervalles documentés 1, 3, 7, 14, 30, 90 j), coach virtuel, plan de révision auto-généré | FAQ site (HIGH) |
| Exercices | Quiz, QCM, écriture, devinettes ; difficulté progressive | homepage/about (HIGH) |
| Monétisation | Freemium : téléchargement gratuit ; abonnement Premium récurrent (Apple/Google) : « apprentissage et révision des mots en illimités » | CGU + App Store (HIGH) |
| Modèle juridique | Société régie par le droit français ; contenu « éducatif », pas un avis religieux | CGU (HIGH) |
| Mise à jour | Fiche App Store mise à jour 2026-08-01 | iTunes (HIGH) |

**Proposition de valeur décodée** : « un mot appris = un mot que vous récitez déjà » (même insight que la signature Hikma « Ce mot, tu le récites peut-être déjà »), avec un argument de **fréquence** (« moins d'effort pour plus de résultat ») et un argument **religieux** (« vos prières prennent un autre sens »). La promesse est clairement la **compréhension de la prière/récitation**, pas la maîtrise de l'arabe.

---

## C. Pedagogical Audit

### La boucle revendiquée par QP (homepage « Votre parcours »)
```text
1. Découvrez un mot (arabe + audio + sens) — « un mot que vous avez déjà récité »
2. Ancrez-le (exercices ludiques et variés)
3. Voyez votre progression (jour après jour)
```
Complétée par le blog (guide complet) : alphabet → vocabulaire fréquent → groupes de mots ; « grammaire après 200-300 mots » ; « pas de thèmes avant la fréquence » ; « pas de bachotage » ; « ne pas s'arrêter à la traduction ».

### Comparaison avec la boucle Hikma
```text
Hikma PreLesson → LessonDiscovery → Exercises → HikmaExplanation (après chaque réponse) → SRS → Dashboard
```

| Maillon | QP | Hikma | Verdict |
|---|---|---|---|
| Introduction du mot | Liste fréquence, mot isolé avec contexte verset | Leçon par verset réel, mot dans son ayah, signature « tu le récites déjà » | Hikma plus contextuel |
| Révélation du sens | Traduction directe (traduction du mot) | Glose éditoriale Hikma validée (source tracée) + traduction du verset | Hikma plus rigoureux (FR réel vs auto-traduction) |
| Encodage | Exercices variés revendiqués | 14 types d'exercices réels, séquence cumulative par compétence | Hikma plus structuré (codé, testé) |
| Feedback erreur | Non documenté publiquement (`NOT_VERIFIED`) | HikmaExplanation pédagogique après chaque erreur, preuves linguistiques MASAQ | Hikma supérieur (documenté) |
| Révision | SRS Leitner documenté (1/3/7/14/30/90) | Leitner doublant 1→2→4→…→365, graduation 7 j, maîtrise ≥14 j | Comparable ; QP plus « gradué », Hikma plus simple mais borné |
| Mélange nouveau/ancien | « chaque session mélange nouveaux mots et révisions » (blog) | Rondes cumulatives + réintroduction max 4 mots vus par leçon | Comparable |
| Maîtrise | Notion non documentée (`NOT_VERIFIED`) | Maîtrise 0/25/50/75/100 par compétence + seuils d'intervalle | Hikma supérieur (explicite) |

**Verdict pédagogique** : la boucle de QP est une boucle de **vocabulaire isolé + fréquence**. La boucle de Hikma est une boucle de **compréhension contextuelle + compétence**. Elles poursuivent le même objectif utilisateur (comprendre ce qu'on récite) mais Hikma est structurellement plus proche du texte. Le point d'inspiration n'est pas la boucle elle-même mais **l'ordre d'entrée dans le vocabulaire** (fréquence) et **l'unité « groupe de mots »**.

---

## D. SRS Audit

**QP — public documenté** (FAQ homepage + article « Spaced Repetition ») :
- Intervalles Leitner publiés : 1, 3, 7, 14, 30, 90 jours ; erreur → retour à un intervalle court.
- « L'app calcule le moment optimal en fonction de vos réponses passées » ; adaptation au rythme.
- Plan de révision généré automatiquement ; notifications quand des mots sont à réviser (témoignage).
- 5 min/jour ≈ 15-20 mots révisés + 2-3 nouveaux ; ~10 mots/semaine ; 125 mots en ~3 mois (revendications marketing, MEDIUM).
- Arguments scientifiques cités : Ebbinghaus (oubli 70 % en 24 h), Leitner, « 2 à 3 fois plus efficace que la répétition massée » — **simplifications marketing de la littérature** (MEDIUM/LOW comme preuve).

**Hikma — état réel du code** (`lib/review/scheduler.ts`) :
- `LeitnerScheduler` déterministe : bonne réponse → intervalle × 2 (1 → 2 → 4 → 8 → 16…), mauvaise → 1 jour ; `MAX_REVIEW_INTERVAL_DAYS = 365` (borne anti-année aberrante, Phase 63A) ; graduation « review » à 7 j ; « mastered » à ≥ 14 j (`PROGRESS_RULES`) ; erreur après graduation → `relearning`.
- Interface `ReviewScheduler` remplaçable (SM-2/FSRS prévus), moteur `ReviewEngine` indépendant de React/Supabase, tests dédiés.
- Révisions dues : `getReviewDueCount`, aperçu 7 jours (`getUpcomingReviewCounts`), `review_items` en base.

**Question centrale — le SRS de QP apporte-t-il quelque chose de supérieur ?**
Non, pas en l'état : les deux sont des Leitner. QP publie des intervalles (1/3/7/14/30/90) légèrement plus gradués que le doublage Hikma (1/2/4/8/16), mais le doublage est un choix de simplicité déterministe assumé, borné, testé. **Preuve de supériorité : aucune donnée publique ne permet de l'établir** (`EVIDENCE_INSUFFICIENT`). Le vrai différentiel n'est pas l'algorithme mais **l'orchestration** : QP rend le SRS visible et ritualisé (plan auto, notifications, « 5 minutes »). C'est là que Hikma doit investir, pas dans un nouvel algorithme.

---

## E. Exercise Audit

**QP (revendiqué, HIGH mais peu détaillé)** : quiz, QCM, écriture, devinettes ; difficulté progressive ; audio + translittération pour chaque mot.

| Type (revendiqué QP) | Compétence | Input | Feedback | Pertinence Hikma |
|---|---|---|---|---|
| Quiz / QCM | Reconnaissance sens | Choix | Non documenté | Déjà couvert : `WORD_TO_TRANSLATION`, `TRANSLATION_TO_WORD`, `MULTIPLE_CHOICE`, `WORD_RECOGNITION` |
| Écriture | Production orthographique | Texte | Non documenté | Partiellement : `COMPLETE_WORD`, `MEANING_TO_FORM` (saisie arabe) |
| Devinettes | Rappel libre ludique | Texte | Non documenté | Proche : `FORM_TO_MEANING` (rappel libre avec variantes acceptées) |

**Hikma — 14 types réels** (`lib/exercises/types.ts`) : `WORD_TO_TRANSLATION`, `TRANSLATION_TO_WORD`, `MULTIPLE_CHOICE`, `WORD_RECOGNITION`, `AUDIO_TO_WORD`, `WORD_TO_AUDIO`, `COMPLETE_WORD`, `REVERSE_TRANSLATION`, `FORM_TO_MEANING`, `MEANING_TO_FORM`, `CONTEXT_RECOGNITION`, `LEMMA_RELATION`, `PRONUNCIATION_GUIDED`, `PHONETIC_DISCRIMINATION`.

**Compétences que Hikma teste déjà au moins aussi bien** : reconnaissance, rappel libre avec variantes sémantiques, audio, contexte de verset réel, relation lemme, phonétique guidée. **Compétences que ni l'un ni l'autre ne teste publiquement** : compréhension de phrase complète, production orale libre (QP : `NOT_VERIFIED` ; Hikma : guidée uniquement).

**Verdict** : aucun exercice QP n'est manquant de façon critique. L'« écriture » (dictée) est la seule compétence réellement absente côté Hikma (saisie arabe complète d'un mot entendu) — priorité P2, utile seulement si l'objectif « lecture/écriture » s'élargit.

---

## F. Correction / Feedback Audit

**QP** : aucune documentation publique sur la tolérance des réponses libres (synonymes, ordre, variantes), ni sur les explications après erreur → `NOT_VERIFIED`.

**Hikma — état réel** :
- Grading sémantique tolérant (Phase 24H-B) : `FORM_TO_MEANING` accepte des formulations variées ; le cas « maitre / souverain » vs « souverain / maître » (ordre des mots, synonymes) est explicitement traité par `acceptedAnswers` + normalisation (`normalizeArabicGrading`).
- `HikmaExplanation` pédagogique après chaque réponse (Phase 44A/B), preuves linguistiques MASAQ (`getWordLinguisticEvidence`, segments morphologiques), explication de sens (`resolveSenseExplanation`).
- Feedback après chaque réponse, pas seulement après erreur (Phase 24I/J).

**Verdict** : sur la correction et l'explication, Hikma est objectivement en avance sur ce que QP rend public. Rien à copier ici ; à défendre dans la communication produit.

---

## G. Curriculum & Frequency Audit

**QP** : ordre `FREQUENCY-FIRST` pur (les mots les plus répétés d'abord), puis groupes de mots fréquents, puis vocabulaire étendu (4 000+ mots, tomes de Médine). Chiffres publiés : 125 mots → ~50 % du texte ; 250 → ~75 % ; 500 → « majorité » ; curriculum complet → « plus de 80 % ». Source revendiquée : analyse de fréquence de Dr Abdurraheem (HIGH pour la source ; MEDIUM pour la méthode exacte — unité comptée non précisée : formes ? lemmas ? occurrences ?). Exemples publiés : مِنْ 3 215, رَبّ 971, يَوْم 405, كِتَاب 261 (HIGH).

**Hikma — état réel** : corpus complet (21 296 formes, 77 430 occurrences), curriculum `SOURATE-FIRST` (une leçon par verset réel, mots dédupliqués par ayah, réintroduction cumulative ≤ 4 mots vus), parcours éditorial verrouillé Al-Fātiḥah, 9 sourates C+P1 / 8 C+P2 / 4 308 formes C+P3. Couverture calculée par occurrences (Phase 37), jamais présentée comme mesure de compréhension.

**Analyse critique des chiffres QP** : l'ordre de grandeur « 125 mots → 50 % » est cohérent avec la littérature sur la concentration lexicale du Coran, mais la formulation « comprendre 50 % du texte » est **imprécise** : il s'agit d'une couverture de formes/occurrences, pas d'une compréhension de phrases (le blog le reconnaît implicitement : « suivre le sens général »). Hikma dispose des données pour **vérifier ces chiffres sur son propre corpus** (formes + occurrences réelles) — recommandation forte : produire la version Hikma honnête de cette métrique (ex. « les X mots que tu connais couvrent ≈ Y % des occurrences du Coran »), avec la même rigueur que la couverture Phase 37.

### Modèles explorés
- **Modèle A — Sourate-first** (Hikma actuel) : contexte maximal, aligné « apprendre ce que l'on récite », motivation émotionnelle forte (comprendre sa prière). Limite : la première sourate (ex. Al-Fātiḥah) n'est pas le chemin de fréquence optimal ; sentiment de progression global plus lent.
- **Modèle B — Frequency-first** (QP) : progression mesurable rapide, « chaque session paie » (les mots fréquents apparaissent partout). Limites : mots hors contexte immédiat (effet « liste »), risque de déconnexion de la récitation, nécessite des données de fréquence fiables (Hikma les a), moins différenciant.
- **Modèle C — Hybride (recommandé)** : socle sourate-first conservé **tel quel** ; ajout d'une **couche fréquence transversale** : (1) « groupes de mots » fréquents (collocations 2-5 mots, ex. يَا أَيُّهَا الَّذِينَ آمَنُوا) proposés comme unités d'apprentissage complémentaires ; (2) un « chemin fréquence » optionnel (top 125 formes du corpus Hikma) pour l'utilisateur qui veut la progression mesurable ; (3) signalétique de couverture par sourate. Le contexte reste le maître : chaque mot fréquent reste présenté dans son verset réel.

---

## H. Coach / Daily Plan Audit

**QP** : « coach virtuel » qui organise l'apprentissage selon le niveau et le rythme, génère automatiquement le planning de révision, « pas de pression, juste de la régularité » (HIGH). Choix du temps de révision journalier par l'utilisateur (témoignage, MEDIUM). Notifications de révision (témoignage, MEDIUM). Rien de plus précis n'est public (`NOT_VERIFIED` pour le reste).

**Hikma — état réel** : `composeDailyPlan` (orchestration pure, Phase 38B) : action dérivée de `selectActiveLearningPath` (session → progression → recommandation → fallback), objectif du jour (mots/leçons, `getDailyGoalProgress`), révisions dues, couverture ; `getCoachLine` contextualisée par le profil (objectif, rythme, durée) et `firstVisit` (Phase 71A) ; libellés adaptés (« Commencer ma première leçon »), pré-leçon `welcome=1` (Phase 71B/C) ; résumé hebdomadaire ; copie personnalisée + justification de recommandation.

**Gap identifié** : Hikma a le **coach statique** (page dashboard) mais pas le **rappel actif** (notification « des mots t'attendent ») ni la **ritualisation** (« 5 minutes après le fajr »). Le coach QP est un système de rappel + planification ; le coach Hikma est une couche de narration. Les deux sont complémentaires : Hikma doit ajouter l'activation, pas changer sa narration.

---

## I. Dashboard Audit

**QP** : progression « jour après jour », suivi personnalisé gratuit, suivi des mots appris (HIGH, peu détaillé). Après la première leçon, l'action immédiate de QP est la **révision du jour suivante** (plan auto + notification) → boucle D1 → D2 par le SRS. Pas de détail public sur les métriques (`NOT_VERIFIED`).

**Hikma — état réel** : action principale unique (Reprendre/Continuer/Découvrir/Réviser), objectif du jour avec progression, révisions des 7 prochains jours, historique 30 jours, mots vus/maîtrisés + maîtrise moyenne, progression par sourate, couverture ≈ %, résumé hebdomadaire, justification de recommandation. Le dashboard Hikma est **plus riche** que ce que QP rend public ; le risque est inverse : **surcharge**. 

**Ce que le dashboard Hikma devrait montrer (recommandation produit, non implémentée) :**
- Après 1 session : action unique + « demain, 2 mots reviendront » (le SRS visible crée le rappel).
- Après 7 jours : série de régularité douce (ex. « 5 jours cette semaine ») + couverture gagnée.
- Après 30 jours : tendance (mots vus vs maîtrisés, régularité), couverture ≈ %, prochaine sourate.
- À 100 mots / 1ʳᵉ sourate : célébration sobre (déjà le ton « micro-célébration » Hikma) + aperçu de la suite.
- Règle : **une seule action principale à tout moment** ; le reste est informationnel.

---

## J. Gamification Audit

**QP** : aucun mécanisme de gamification (streak, points, badges, niveaux) n'est documenté publiquement → `NOT_VERIFIED` pour la présence, absence sur les pages publiques. Le discours est explicitement **anti-pression** : « apprendre sans pression », « sans se fatiguer », hadith de la régularité. Les témoignages valorisent la **simplicité**, pas la compétition.

**Analyse** : l'absence de gamification dure est cohérente avec le positionnement religieux (ni compétition, ni culpabilité). La « gamification » efficace de QP est en réalité : **régularité visible + petits gains quotidiens** (2-3 mots/jour) + notifications.

**Hikma — état réel** : pas de streak, pas de points ; micro-célébrations textuelles (« C'est bon 👏 »), objectif du jour, historique. Cohérent.

| Mécanisme | Valeur pédagogique | Valeur engagement | Risque | Fit Hikma |
|---|---|---|---|---|
| Streak dur (série à ne pas casser) | Faible | Moyenne | Culpabilité, abandon après rupture | REJECT (phase actuelle) |
| Régularité douce (X jours cette semaine, sans rupture) | Moyenne | Moyenne | Faible | ADAPT (P2) |
| Points / badges | Faible | Faible | Bruit, dérive compétitive | REJECT |
| Objectif du jour personnalisé | Élevée | Élevée | Faible | ALREADY_PRESENT (à renforcer) |
| Notifications de révision | Élevée (SRS visible) | Élevée | Faible si non agressives | ADOPT (P1) |

---

## K. Energy / Limits Audit

**QP** : aucun système d'énergie, de vies ou de quota documenté publiquement → `NOT_VERIFIED` (absence sur les pages publiques uniquement). La **limite réelle** de QP est le **freemium** : le Premium débloque « l'apprentissage et la révision des mots en illimités » (App Store FR, HIGH) — ce qui implique une limite de mots/révisions côté gratuit (non quantifiée publiquement, LOW). L'énergie n'est donc pas un outil de monétisation chez QP ; c'est le **quota de contenu** qui l'est.

**Impact sur la réflexion Hikma** (comparaison des modèles, recommandation en T) : le modèle « quota de contenu » est plus éthique que le modèle « énergie » mais reste une friction. Aucune preuve publique ne montre que QP l'utilise comme levier de rétention (`EVIDENCE_INSUFFICIENT`).

---

## L. Monetization Audit

Faits vérifiés :
- Téléchargement gratuit ; abonnement **Premium récurrent** facturé via App Store / Google Play, renouvellement automatique, annulable (CGU, HIGH).
- Premium = « accès à l'apprentissage et à la révision des mots en illimités, ainsi qu'à toutes les autres fonctionnalités sans limite » (App Store FR, HIGH) → le gratuit est **limité en volume**, pas en fonctionnalités.
- Google Play : achats intégrés présents, paliers de prix observés sur la fiche ($3,49 ; $4,99 ; $19,99 ; $21,99 ; $29,99 ; $33,99 ; $34,99 ; $46,99 ; $399,99) — **mapping plan→prix impossible sans compte** (LOW, à ne pas citer comme prix officiels).
- Stratégie de conversion observable : la promesse « 5 minutes/jour → 50 % du texte » convertit l'intérêt religieux en habitude, puis l'habitude en abonnement quand le quota gratuit s'atteint (INFERENCE, étiquetée comme telle).

**Leçons pour Hikma** : (1) la monétisation par **volume** (quota de mots) est compatible avec une pédagogie éthique si le cœur de la boucle reste gratuit ; (2) l'argument de conversion doit être pédagogique (« débloquer la suite de ta sourate »), jamais une punition ; (3) Hikma n'a **aucune monétisation aujourd'hui** — ce n'est pas un gap pour la phase actuelle, mais l'architecture des données (parcours par sourate) rend un futur freemium naturel : sourates gratuites vs sourates Premium, jamais de blocage des révisions SRS dues.

---

## M. User Feedback Audit

Sources : avis publics stores (28 000+ revendiqués ; 6 812 notes App Store FR vérifiées, 4,89/5), témoignages du blog officiel (sélectionnés par l'éditeur — MEDIUM).

Motifs récurrents (qualitatifs, pas statistiques) :
- **PRAISE** : méthode efficace, « on apprend sans effort » ; prise de conscience en récitant/priant ; interface « simple, claire, soignée » ; suivi personnalisé gratuit ; notifications de révision utiles ; choix du temps journalier.
- **RETENTION_SIGNAL** : « je récite et je comprends le thème général » (l'effet recherché arrive vite) ; usage dans les transports/attentes.
- **MONETIZATION_SIGNAL** : service client réactif cité ; satisfaction globale élevée (4,89/5 FR).
- **COMPLAINT / FRUSTRATION** : peu visibles dans les sources accessibles ; la limite du gratuit est la plainte type des freemiums de ce type (INFERENCE, non vérifiée directement).

Aucune donnée publique ne permet de quantifier l'abandon (D1/D7/D30) → `EVIDENCE_INSUFFICIENT`. Le signal le plus actionnable : **le plaisir de reconnaître un mot en récitation est le moment « aha »** que Hikma crée déjà via la signature de leçon et le contexte de verset ; c'est ce moment qu'il faut rendre répétable quotidiennement (rappel + régularité).

---

## N. Hikma vs Quran Progress — comparaison directe

| Axe | Quran Progress | Hikma | Avantage |
|---|---|---|---|
| Plateforme | Mobile iOS/Android, 6 langues | Web (Next.js), FR d'abord | QP (portée) ; Hikma (accessibilité sans store) |
| Contenu | 4 000+ mots revendiqués, fréquence + Médine | Corpus complet réel (21 296 formes, 77 430 occ.), gloses éditoriales validées, MASAQ | Hikma (qualité traçable) |
| Ordre d'apprentissage | Fréquence-first + groupes de mots | Sourate-first, leçon par verset | QP (progression mesurable) / Hikma (contexte) |
| Boucle | Découvrir → ancrer → progresser | PreLesson → Discovery → Exercices → Explication → SRS → Dashboard | Hikma (complétude documentée) |
| Explication | Non documentée | Explication pédagogique après chaque réponse, preuves MASAQ | Hikma |
| Correction libre | Non documentée | Variantes sémantiques acceptées (« maître/souverain ») | Hikma |
| SRS | Leitner 1/3/7/14/30/90 (public) | Leitner 1→2→4→…→365 (borné, testé) | Égal (aucune preuve de supériorité) |
| Coach | Virtuel, plan auto, notifications | Daily Plan narratif + objectif + couverture | QP (activation) / Hikma (transparence) |
| Métriques | « 125 → 50 % » (marketing) | Couverture ≈ % pondérée par occurrences (rigoureuse) | Hikma (honnêteté) ; QP (pédagogie du message) |
| Gamification | Non documentée (anti-pression) | Micro-célébrations, objectif du jour | Égal (les deux sobres) |
| Énergie | Aucune trace publique | Aucune | Égal |
| Monétisation | Freemium quota + Premium | Gratuite intégralement | QP (business) / Hikma (éthique) |
| Confiance | 4,9/5, 500K+ | Jeune produit, sans masse critique | QP (traction) |

---

## O. Hikma Strengths (ce que Hikma possède déjà)

1. **Vérité du corpus** : chaque mot, occurrence, verset, traduction, glose et preuve linguistique est réel et traçable (contre l'« analyse » non vérifiable de QP).
2. **Explication pédagogique** : HikmaExplanation + preuves MASAQ après chaque erreur — différenciation majeure, absente du discours public de QP.
3. **Correction tolérante** : le grading sémantique (« maître / souverain ») évite la frustration des synonymes — un point que QP ne documente pas.
4. **Curriculum contextuel** : leçon par verset réel, « apprendre ce que l'on récite » — alignement parfait avec la motivation religieuse, impossible à dupliquer par une liste de fréquence seule.
5. **Métriques honnêtes** : couverture pondérée par occurrences, présentée comme estimation ; aucun chiffre marketing non étayé.
6. **Architecture pure et testée** : 789 tests, moteurs (SRS, séquenceur, maîtrise, plan) découplés de React/Supabase — capacité d'itération rapide (SM-2/FSRS, nouveaux exercices, nouvelles sourates) sans dette.
7. **Onboarding validé** (Phases 71A-C) : fast-track, pré-leçon, firstVisit — un parcours d'activation documenté et testé de bout en bout.

---

## P. Hikma Gaps (ce qui manque éventuellement)

| Gap | Nature | Impact estimé | Preuve |
|---|---|---|---|
| 1. Rappels actifs (notifications de révision) | Rétention D1-D7 | Élevé — c'est le mécanisme qui fait revenir | Témoignage QP (MEDIUM) ; principe SRS (HIGH) |
| 2. Couche fréquence (groupes de mots, top formes) | Progression mesurable | Moyen-élevé | Blog QP (HIGH) ; données Hikma disponibles (HIGH) |
| 3. Communication « X mots → Y % » calibrée | Activation/conversion | Moyen | Blog QP (HIGH) |
| 4. Module lecture/alphabet pour non-lecteurs | Élargissement cible | Moyen | Blog QP (HIGH) |
| 5. Présence mobile (PWA) | Portée/rituel quotidien | Moyen | QP mobile-first (HIGH) |
| 6. Écriture/dictée (production orthographique) | Complétude des compétences | Faible | App Store QP (MEDIUM) |
| 7. Monétisation | Business | Hors phase actuelle | CGU QP (HIGH) |

---

## Q. Adopt / Adapt / Inspire / Defer / Reject

### QURAN_PROGRESS_INSIGHTS_FOR_HIKMA (ce que QP peut inspirer)

**A — ADOPT** (pertinent, compatible, prêt) :
1. **Rappels de révision (notifications)** — Hikma a déjà `getUpcomingReviewCounts` (7 j) et `review_items` : une notification web push « 3 mots t'attendent » est la traduction directe du mécanisme QP.
2. **Framing « courte session quotidienne »** — la pré-leçon et le daily plan existent ; ajouter la durée qualitative (« une courte session » est déjà là — la prolonger au dashboard : « 5 minutes suffisent » sans inventer de durée).
3. **Le SRS visible** (« demain, 4 mots reviendront ») — crée l'attente et l'habitude, sans streak.

**B — ADAPT** (concept intéressant, à transformer pour Hikma) :
1. **Groupes de mots fréquents** → « segments fréquents » Hikma : collocations réelles extraites du corpus (2-5 mots) présentées **dans leur verset** ; unité pédagogique nouvelle, s'appuyant sur les données existantes (occurrences + positions). Pas de copie : ordre par fréquence **au sein du contexte sourate**.
2. **Chemin fréquence optionnel** → « Couche découverte fréquence » : top N formes du corpus Hikma (calculé sur nos données, pas les chiffres QP) comme **parcours secondaire**, jamais obligatoire, jamais substitué au parcours sourate.
3. **« 125 mots → 50 % »** → **métrique Hikma vérifiée** : calculer sur `quran_words` + `word_occurrences` le vrai « X formes → Y % d'occurrences », l'afficher avec le « ≈ » existant. La communication devient un fait vérifiable, pas un slogan.
4. **Alphabet/lecture pour débutants** → module d'entrée « je ne lis pas l'arabe » dans l'onboarding (phonétique Hikma existe déjà : `PRONUNCIATION_GUIDED`) — à concevoir après la couche fréquence.

**C — INSPIRE** (ne pas copier, faire mieux) :
1. Le coach QP (plan auto) → **Daily Plan actif** : transformer la narration passive en micro-actions (rappels, « demain », anticipation), sans assistant conversationnel.
2. La variété ludique → la variété **pédagogique** Hikma (14 types, séquencés par compétence) : c'est déjà la réponse structurelle ; la rendre visible (« tu vas pratiquer : reconnaître, écouter, écrire »).
3. L'anti-pression → le ton Hikma existant (« pas de pression » déjà présent dans le fast-track et le coach line) — le consolider comme **principe de marque** documenté.

**D — DEFER** (intéressant, prématuré) :
1. Multilingue (FR → EN/DE/…).
2. Contenu étendu type « tomes de Médine » (Hikma a 4 308 formes C+P3 à traiter d'abord).
3. Module écriture/dictée.
4. Mobile PWA complète.

### QURAN_PROGRESS_FEATURES_HIKMA_SHOULD_NOT_COPY (REJECT explicite)
1. **Les chiffres de couverture non étayés** (« 250 mots → 75 % de compréhension ») : Hikma ne doit jamais présenter une couverture lexicale comme une compréhension. Toujours « ≈ couverture des occurrences ».
2. **Le remplacement du contexte par la fréquence** : un parcours fréquence pur sans verset réel détruirait la différenciation Hikma (« apprendre ce que l'on récite »).
3. **Le quota dur gratuit** (mots bloqués sans Premium) tant que Hikma n'a pas de monétisation : friction sans retour, incompatible avec l'éthique actuelle. Si freemium un jour → sourates Premium, révisions toujours libres.
4. **La gamification non prouvée** (streaks punitifs, points, badges) : aucune preuve publique chez QP ; risque de dérive du positionnement religieux sobre.
5. **Les affirmations scientifiques simplifiées** (« Ebbinghaus : 70 % oubliés », « 2-3× plus efficace ») : Hikma garde un ton vérifiable ; les citations scientifiques doivent être exactes ou absentes.
6. **Le modèle hybride Ionic / architecture fermée** : l'architecture modulaire testée de Hikma est un avantage à préserver.
7. **Les témoignages marketing « 500K users »** : Hikma ne doit pas inventer de masse critique qu'elle n'a pas.

---

## R. Prioritized Roadmap

| Priorité | Idée | Valeur user | Valeur péda | Valeur rétention | Coût | Risque | Justification |
|---|---|---|---|---|---|---|---|
| **P0** | (Rien de bloquant — fondations saines) | — | — | — | — | — | La phase 71 a fermé l'onboarding ; le pipeline est gelé |
| **P1** | Rappels de révision (notifications web push, SRS visible « demain ») | Élevée | Élevée | Élevée | Moyen | Faible | Gap n°1 ; infra data déjà là (`upcoming_review_counts`) |
| **P1** | Couche fréquence : groupes de mots/segments fréquents par sourate | Élevée | Élevée | Moyenne | Moyen | Moyen (données) | Gap n°2 ; calculable sur corpus réel, sans migration lexicale |
| **P1** | Métrique Hikma « X formes → Y % d'occurrences » vérifiée + affichage | Moyenne | Moyenne | Moyenne | Faible | Faible | Active la communication sans slogan |
| **P2** | Régularité douce (X jours cette semaine) + aperçu « demain » | Moyenne | Faible | Élevée | Faible | Faible | Sans streak punitif |
| **P2** | Chemin fréquence optionnel (top formes) | Moyenne | Moyenne | Moyenne | Moyen | Moyen | Seulement après P1 couche fréquence |
| **P2** | Module lecture/alphabet (entrée non-lecteurs) | Moyenne | Élevée | Moyenne | Élevé | Moyen | Élargit la cible ; après onboarding stabilisé |
| **P3** | Dictée/écriture | Faible | Moyenne | Faible | Moyen | Faible | Compétence manquante mineure |
| **P3** | Architecture Premium (sourates gratuites/Premium) | — | — | — | — | — | Aucune monétisation avant traction |
| **REJECT** | Énergie, streaks punitifs, points/badges, quota dur gratuit, chiffres marketing | — | — | — | — | — | Incompatibles avec la philosophie Hikma |

---

## S. Strategic Differentiation (pourquoi Hikma doit exister face à QP)

1. **PÉDAGOGIE — la compréhension, pas la liste** : QP vend des mots ; Hikma vend des mots **dans les versets que l'on récite**, avec explication après chaque erreur. Le moment « je comprends ce verset » est le produit.
2. **CONTENU — la vérité lexicale** : gloses éditoriales validées et tracées, traductions réelles (24 944), preuves linguistiques MASAQ. QP s'appuie sur une analyse externe non publiée ; Hikma produit et documente ses données.
3. **CONTEXTE — le Coran comme curriculum** : une leçon = un verset réel ; la récitation quotidienne devient la révision naturelle (le « SRS naturel » que QP ne fait que mentionner).
4. **EXPLICATION — le feedback intelligent** : correction tolérante + explication pédagogique systématique. Aucun concurrent public ne documente cela.
5. **PROGRESS — l'honnêteté métrique** : couverture ≈ % pondérée par occurrences, jamais présentée comme compréhension. La confiance devient un avantage concurrentiel durable.
6. **UX/ÉTHIQUE — la sobriété** : pas d'énergie, pas de quota, pas de gamification culpabilisante, gratuité totale aujourd'hui. Face à un freemium à quota, c'est une position de marque.
7. **ARCHITECTURE — la vitesse** : moteurs purs, testés (789 tests), remplaçables (SRS, séquenceur, maîtrise) → Hikma peut itérer là où QP (Ionic, 2016) s'est figé.

Positionnement recommandé : **« Hikma ne t'apprend pas des mots, il te fait comprendre les versets que tu récites — avec des explications, pas des devinettes. »**

---

## T. Energy Recommendation

**Recommandation finale : Option A — PAS de système d'énergie.**

| Modèle | Avantage | Inconvénient | Risque péda | Risque business | Rétention | Frustration | Fit Hikma |
|---|---|---|---|---|---|---|---|
| A. Pas d'énergie | Éthique, sobre, cohérent | Aucun levier artificiel | Nul | Faible (monétisation par valeur) | Organique (SRS + rappels) | Nulle | **ADOPT** |
| B. Énergie douce (limite de session informative, jamais bloquante) | Protège de la surcharge | Inutile si non bloquante | Faible | Nul | Neutre | Faible | POSSIBLE plus tard (P3), non nécessaire |
| C. Énergie freemium (bloquante + recharge premium) | Levier de conversion | Friction quotidienne, culpabilité | Élevé (rupture d'apprentissage) | Moyen | Négatif D7 | Élevée | **REJECT** (contraire à l'éthique Hikma) |
| D. Limite quotidienne dure (session unique) | Ritualisation | Contre la liberté « 5 min » | Faible | Nul | Neutre | Moyenne | **REJECT** (le daily goal informatif suffit) |
| E. Quota de contenu (modèle QP : X mots/jour gratuits) | Conversion naturelle | Friction à l'usage | Moyen | Moyen | Négatif si mal calibré | Moyenne | DIFFÉRER : uniquement avec un futur Premium, jamais avant |

Le système Hikma existant (objectif du jour informatif, jamais plafonné — `completed`/`exceeded` sans blocage) est **déjà** la bonne réponse : une guidance, pas une contrainte. L'énergie est une réponse à un problème (rétention) que Hikma doit résoudre par les **rappels et la régularité douce**, pas par la pénurie.

---

## U. Curriculum Recommendation

**Recommandation : Modèle C hybride, sourate-first prioritaire.**

1. **Conserver tel quel** le curriculum sourate-first (leçon par verset réel, parcours éditorial Al-Fātiḥah verrouillé, réintroduction cumulative).
2. **Ajouter (P1)** : les **segments fréquents** — unités de 2-5 mots extraites du corpus (ex. يَا أَيُّهَا الَّذِينَ آمَنُوا), proposées dans la leçon du verset où elles apparaissent, puis révisées comme des mots (même SRS, mêmes tables de progression par compétence — architecture déjà capable : `lemma_relation` montre que des unités non-mot existent dans le moteur).
3. **Ajouter (P2)** : le **chemin fréquence optionnel** — top formes calculées sur `word_occurrences` Hikma, présentées avec leur verset le plus représentatif. Jamais obligatoire ; le dashboard le propose comme alternative (« tu préfères les mots les plus fréquents du Coran ? »).
4. **Vérifier et publier (P1)** : la courbe « X formes → Y % d'occurrences » Hikma (attendu proche des ordres de grandeur QP, mais calculé sur nos données) — c'est la version honnête du slogan.

La règle « APPRENDRE CE QUE L'ON RÉCITE » reste le principe : la fréquence devient un **accélérateur dans le contexte**, pas un substitut au contexte.

---

## V. Monetization Recommendation

Principes uniquement (aucune implémentation, phase postérieure) :

- **CORE_FREE (jamais payant)** : la boucle complète d'une sourate (découverte → exercices → explication → SRS), toutes les révisions dues, l'explication pédagogique, les métriques de base. La gratuité de la révision est **non négociable** : le SRS est un investissement utilisateur ; le bloquer détruirait la confiance.
- **PREMIUM_CANDIDATE (plus tard)** : sourates supplémentaires au-delà d'un socle gratuit (ex. Al-Fātiḥah + 2-3 sourates), couche fréquence avancée (segments fréquents complets), rapports de progression détaillés, module lecture/alphabet complet, multi-langue.
- **NEVER_PAYWALL** : l'explication après erreur, les révisions, la couverture ≈ %.
- **Conversion naturelle** : « débloquer la suite de ta sourate » est un motif de conversion pédagogique et positif — le même insight que QP (« mots illimités ») mais exprimé par la valeur, pas par le manque.
- **Ne jamais** : publicité, vente de données, gamification payante, énergie.

---

## W. Risks

| Risque | Description | Mitigation |
|---|---|---|
| Péda | Adopter la fréquence pure décontextualisée (copie QP) | Règle : tout mot fréquent reste présenté dans son verset |
| Péda | Dilution du parcours sourate par la couche fréquence | La couche fréquence est optionnelle et secondaire |
| UX | Surcharge du dashboard (déjà riche) | Une seule action principale ; le reste informationnel |
| Technique | Notifications web push : coûts d'infrastructure, consentement, désactivation | PWA + consentement explicite, rappels non agressifs |
| Data | Extraire les segments fréquents sans distorsion (frontières de mots, clitiques) | Réutilisation des données MASAQ (segments morphologiques existants) ; validation éditoriale |
| Data | Publier une courbe « X formes → Y % » fausse | Calcul sur corpus réel, affichage « ≈ », tests de non-régression |
| Juridique/IP | Copier textes, chiffres, design ou wording de QP | Analyse strictement conceptuelle (cette phase) ; tout contenu Hikma reste original ; les chiffres QP ne sont pas repris comme nôtres |
| Business | Monétisation prématurée qui casse la confiance | Aucune monétisation avant traction ; principes CORE_FREE documentés |
| Stratégique | Se positionner « contre QP » au lieu de « pour l'utilisateur » | Communication centrée sur le moment « je comprends mon verset » |
| Éthique | Gamification culpabilisante | Streak dur rejeté ; régularité douce uniquement |

Note : cette analyse n'est pas un avis juridique ; les points IP sont des précautions de bon sens.

---

## X. Final Product Decision

### 1. Les 5 meilleures idées de Quran Progress pour Hikma
1. **Le SRS visible et ritualisé** : rappels de révision + « 5 minutes » + plan auto → traduction Hikma : notifications web push + aperçu « demain » (P1).
2. **Les groupes de mots fréquents** → segments fréquents Hikma dans leur verset (P1).
3. **La communication de couverture** « X mots → Y % » → version Hikma calculée sur son corpus, honnête (P1).
4. **L'entrée par la fréquence** comme chemin optionnel (P2) — jamais obligatoire.
5. **La promesse « un mot que tu récites déjà »** → déjà présente chez Hikma (signature + PreLesson) : la **généraliser** à chaque leçon et la mettre en avant dans le marketing (P0 communication).

### 2. Les 5 idées à ne surtout pas copier
1. Les chiffres « 250 mots → 75 % de compréhension » présentés comme un fait.
2. Le curriculum frequency-first pur sans contexte de verset.
3. Le quota gratuit (mots limités sans Premium) tant qu'il n'y a pas de monétisation — et, le jour venu, jamais sur les révisions.
4. Les streaks/palmarès/gamification non prouvée.
5. Les simplifications scientifiques marketing (Ebbinghaus « 70 % », « 2-3× »).

### 3. Principal avantage compétitif actuel de Hikma
**La boucle « verset réel → explication pédagogique après chaque réponse » adossée à des données lexicales traçables** : aucun concurrent public ne combine contexte coranique réel, correction tolérante, explication et SRS. C'est le « pourquoi Hikma » à marteler.

### 4. Principal gap actuel de Hikma
**L'activation du retour** : le rappel (notification), la ritualisation (« 5 minutes »), la régularité visible. Hikma fait revenir par la qualité ; il doit aussi faire revenir par le mécanisme.

### 5. Hikma doit-il intégrer une approche frequency-first ?
**Oui, en couche, pas en remplacement** (Modèle C) : segments fréquents dans les leçons (P1), chemin fréquence optionnel (P2), métrique de couverture vérifiée (P1). Le socle reste sourate-first.

### 6. Hikma doit-il avoir un système d'énergie ?
**Non** (Option A). Guidance quotidienne existante (daily goal informatif) + rappels + régularité douce. L'énergie est rejetée ; le quota de contenu est différé à un éventuel Premium, hors révisions.

### 7. Fonctionnalités pertinentes pour une future offre Premium
Sourates supplémentaires (au-delà d'un socle gratuit), couche fréquence avancée (segments fréquents complets), rapports de progression détaillés, module lecture/alphabet, multi-langue. Jamais : révisions, explications, métriques de base.

### 8. Prochaine phase recommandée
**PHASE 73 — « RÉGULARITÉ & RAPPELS »** (research puis implémentation) : infrastructure de rappels de révision (web push / PWA), aperçu « demain » sur le dashboard, régularité douce (X jours cette semaine), et calcul de la métrique Hikma « X formes → Y % d'occurrences » sur le corpus réel. **PHASE 74** ensuite : couche fréquence (segments fréquents). Les deux phases doivent être validées humainement avant lancement.

---

```text
PHASE_72_QURAN_PROGRESS_AUDIT_COMPLETE

DATABASE_WRITES = 0
LEXICAL_WRITES = 0
CODE_WRITES = 0
MIGRATIONS = 0
SEEDS = 0

LOT_16_STARTED = false
HOLDS_PROCESSED = false

IMPLEMENTATION_STARTED = false
COMMIT = false
PUSH = false

PRODUCT_DECISION = HUMAN_REVIEW_REQUIRED

NEXT_PHASE_NOT_STARTED

STOP
```
