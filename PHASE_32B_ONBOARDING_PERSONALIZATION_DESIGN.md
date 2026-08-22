# PHASE 32B — ONBOARDING & PERSONALIZATION DESIGN

Statut : `DESIGN_ONLY / READ_ONLY / READY_FOR_IMPLEMENTATION_APPROVAL`

Date : 2026-08-18

## 1. Décision d’architecture

L’Approche A enrichie est retenue : `user_settings` reste la table de profil
utilisateur. Les champs pédagogiques sont ajoutés de manière additive,
nullable et strictement validée côté serveur.

Le profil décrit des préférences d’expérience. Il ne constitue ni un diagnostic
de niveau, ni une source de vérité pédagogique.

Les champs ne modifieront jamais le grading, le scoring, le SRS, la mastery, le
scheduler, l’interleaving, le curriculum, les données Quran, l’audio ou MASAQ.

## 2. Schéma proposé

Les colonnes existantes restent inchangées :

```text
user_id
daily_goal_type
daily_goal_value
onboarded
created_at
updated_at
```

Colonnes additives proposées, toutes nullable pour les utilisateurs existants :

| Colonne | Type proposé | Valeurs / règle |
|---|---|---|
| `display_name` | `text` | trim, 1–60 caractères, pseudonyme autorisé |
| `learning_goal` | `text` | enum ci-dessous, une valeur, nullable |
| `arabic_reading_level` | `text` | enum ci-dessous, nullable |
| `quran_familiarity` | `text` | enum ci-dessous, nullable |
| `daily_duration` | `integer` | `5, 10, 15, 20, 30` ou null |
| `learning_pace` | `text` | enum ci-dessous, nullable |
| `preferred_surah_number` | `integer` | sourate READY/REFERENCE uniquement au moment de l’usage |

`daily_goal_type` et `daily_goal_value` restent la seule source de vérité de
l’objectif quotidien existant. `daily_duration` exprime une préférence de
session et ne crée pas de second planificateur.

Le nombre de sourate est volontairement stocké plutôt qu’un `surah_id` : la
recommandation valide toujours cette préférence contre le catalogue READY
actuel avant tout CTA. Une sourate devenue indisponible ne peut donc pas être
démarrée par erreur.

## 3. Parcours UX définitif

Le parcours cible environ une minute. Les questions facultatives sont passables
individuellement. La progression est discrète et n’utilise pas de compteur
anxiogène du type « étape 4 sur 8 ».

### Écran 1 — Bienvenue

Titre : `Bienvenue sur Hikma 👋`

Texte : `Apprends les mots du Coran, comprends leur sens et retrouve-les progressivement dans les sourates que tu récites.`

Sous-texte : `Quelques questions vont nous aider à personnaliser ton expérience.`

Actions : `Commencer` et `Passer l’onboarding`.

Passer ce premier écran ouvre directement l’écran sourate de départ avec la
recommandation Al-Fātiḥah, puis le premier parcours.

### Écran 2 — Nom d’affichage

Question : `Comment veux-tu qu’on t’appelle ?`

Label : `Prénom ou nom d’affichage`

Placeholder : `Ton prénom`

Exemple discret : `Abdourahmane`

Aide : `Tu pourras modifier ce nom plus tard.`

Actions : `Continuer` et `Passer`.

Le nom n’est jamais public, n’est pas obligatoire et n’est utilisé que dans
l’interface personnelle.

### Écran 3 — Objectif

Question : `Pourquoi veux-tu apprendre le vocabulaire du Coran ?`

Choix unique retenu pour limiter la charge cognitive :

| Valeur | Libellé |
|---|---|
| `understand_recitation` | Mieux comprendre ce que je récite |
| `memorize_vocabulary` | Mémoriser les mots du Coran |
| `understand_surahs` | Comprendre progressivement les sourates |
| `build_vocabulary` | Enrichir mon vocabulaire arabe coranique |
| `start_gently` | Je veux simplement commencer |

Le choix unique permet une personnalisation de copy claire. L’utilisateur
pourra le modifier plus tard ; aucune hiérarchie pédagogique n’en dépend.

### Écran 4 — Lecture de l’arabe

Question : `Comment lis-tu l’arabe ?`

| Valeur | Libellé |
|---|---|
| `beginner` | Je commence tout juste |
| `letters` | Je reconnais les lettres |
| `slow` | Je peux lire lentement |
| `correct` | Je lis correctement |
| `fluent` | Je lis couramment le Coran |

Cette préférence peut moduler des textes d’aide ou la présence de conseils de
lecture. Elle ne modifie ni les exercices, ni les réponses acceptées, ni le
grading.

### Écran 5 — Familiarité avec le Coran

Question : `Quelle est ta relation avec le Coran ?`

| Valeur | Libellé |
|---|---|
| `beginner` | Je débute |
| `some_surahs` | Je connais quelques sourates |
| `regular_recitation` | Je récite régulièrement |
| `many_surahs` | Je connais beaucoup de sourates |
| `complete_reading` | Je lis/récite régulièrement l’ensemble du Coran |

Cette réponse est une préférence déclarative, jamais une mesure de maîtrise.

### Écran 6 — Temps et rythme

Question : `Combien de temps aimerais-tu consacrer à Hikma ?`

Choix : `5 min par jour`, `10 min par jour`, `15 min par jour`, `20 min par jour`,
`Plus de 20 min`, `Je préfère avancer librement`.

Valeurs : `5`, `10`, `15`, `20`, `30`, `null`.

Question suivante : `Quel rythme te convient le mieux ?`

| Valeur | Libellé |
|---|---|
| `daily_short` | Un peu chaque jour |
| `some_days` | Quelques fois par semaine |
| `flexible` | Quand j’ai le temps |
| `unknown` | Je ne sais pas encore |

`daily_duration` ne remplace jamais silencieusement `daily_goal`. Si l’utilisateur choisit 5, 10,
15 ou 20 minutes, l’onboarding peut proposer l’équivalent de l’objectif
quotidien existant dans une étape distincte ; seule une confirmation explicite
pourrait le modifier. `Plus de 20 min` et `librement` conservent l’objectif par
défaut ou celui déjà enregistré.

### Écran 7 — Sourate de départ

Titre : `Par quelle sourate veux-tu commencer ?`

Carte recommandée :

```text
Notre recommandation
Al-Fātiḥah
Une excellente première étape pour découvrir Hikma.
Commencer avec Al-Fātiḥah
```

Action secondaire : `Choisir une autre sourate`.

La liste alternative est construite uniquement à partir du catalogue
`REFERENCE`/`READY`. Al-Māʿūn 107, `IN_PREPARATION`, n’a jamais de CTA de départ.

## 4. Skip et interruption

- `Passer l’onboarding` enregistre `onboarded = true` avec les valeurs
  existantes ou les défauts sûrs, sans remplir artificiellement les champs
  pédagogiques.
- `Passer` sur une question laisse sa valeur `NULL`.
- Une fermeture ou interruption avant la confirmation finale ne marque pas
  l’onboarding comme terminé.
- Un utilisateur historique avec `onboarded = true` n’est jamais forcé à
  refaire le parcours.
- Le profil propose ensuite `Personnaliser ton expérience` pour compléter ou
  modifier les valeurs.
- Après confirmation, la navigation mène à la première leçon de la sourate
  choisie, sans contourner le moteur actuel.

## 5. Recommandation déterministe

Signature conceptuelle : `recommendStartingSurah(profile, catalog)`.

La fonction est pure, indépendante du runtime pédagogique, du SRS et de MASAQ.

Ordre exact :

1. Le dashboard respecte d’abord le prochain pas pédagogique réel : session ou
   leçon à reprendre, révision due, puis progression existante.
2. Pour une découverte sans progression active, si `preferred_surah_number`
   désigne une sourate `REFERENCE` ou `READY`, la
   conserver.
3. Sinon, utiliser les préférences de profil pour ordonner les sourates
   `READY` ; une durée courte ou un profil débutant privilégie les parcours
   courts.
4. Sinon, sélectionner Al-Fātiḥah.
5. Si Al-Fātiḥah était exceptionnellement absente du catalogue, sélectionner la
   plus courte sourate `READY`.
6. Si aucune sourate `READY` n’existe, ne générer aucun CTA de leçon et afficher
   un état contrôlé.

Un choix explicite est toujours prioritaire, même si la durée est courte ou si
le profil indique un débutant. Une sélection `IN_PREPARATION` est refusée et
retombe sur la règle précédente.

MASAQ, racines, schèmes, fréquence et couverture technique ne participent pas à
ce calcul.

## 6. Dashboard

La progression existante reste la source de vérité : prochain cours réel,
leçons terminées, mastery, révisions et SRS continuent d’être calculés par les
couches actuelles.

Le profil peut modifier uniquement la présentation :

- avec nom : `Bonjour Abdourahmane 👋` ;
- sans nom : `Bienvenue sur Hikma 👋` ;
- objectif compréhension : `Aujourd’hui, découvre les mots qui donnent leur sens à cette sourate.` ;
- objectif mémorisation : `Aujourd’hui, consolide quelques mots que tu retrouveras dans le Coran.` ;
- profil débutant : `Commençons simplement. Découvre quelques mots de cette sourate.` ;
- profil expérimenté : `Continue ton exploration du vocabulaire de cette sourate.`

Une suggestion `Pour commencer` peut apparaître à côté du prochain pas, mais ne doit
jamais remplacer l’action réelle de reprise ou de révision.

## 7. `/surahs`

Ordre de page :

1. `Pour commencer` — une recommandation personnalisée avec justification courte et
   CTA `Commencer`.
2. `Toutes les sourates disponibles` — toutes les sourates `REFERENCE` et
   `READY`, sans en masquer aucune.
3. `Bientôt disponibles` — les parcours `IN_PREPARATION`, visibles mais sans
   CTA de démarrage.

Aucun badge MASAQ, morphologie, segmentation ou couverture technique n’est
affiché à l’utilisateur. La source de vérité reste le catalogue dynamique
`REFERENCE`/`READY` ; aucun nombre ou identifiant de sourate n’est codé en dur.

## 7A. Confirmation et aha moment

Après les préférences, un écran de confirmation présente la sourate choisie :

```text
Tout est prêt 👋
On va commencer doucement avec Al-Fātiḥah.
10 min · 8 leçons · vocabulaire coranique
Commencer
```

La durée et le nombre de leçons sont rendus depuis le catalogue existant. La
première leçon conserve ensuite le contexte de l’ayah avant le premier effort
de rappel : l’onboarding ne remplace pas `LessonPlayer` et ne crée aucune
donnée pédagogique.

## 8. Profil et modification

Ajouter une section `Préférences d’apprentissage` dans `/profile` avec les
mêmes contrôles accessibles que l’onboarding. La sauvegarde est indépendante
de la progression.

Une modification de préférence ne supprime ni progression, ni mastery, ni SRS,
ni leçons, et ne réinitialise aucune session existante.

## 9. Validation serveur et sécurité

- `display_name` est trimé, borné et nullable.
- Chaque enum est vérifié côté serveur ; toute valeur inconnue est rejetée.
- `daily_duration` accepte uniquement `null`, `5`, `10`, `15`, `20` ou `30`.
- `preferred_surah_number` est validé contre le catalogue disponible avant
  utilisation ; une valeur `IN_PREPARATION` est refusée.
- Les Server Actions utilisent l’utilisateur Supabase courant.
- Le RLS existant reste le garde-fou d’isolation inter-utilisateurs.
- Aucun champ sensible n’est collecté.

## 10. Matrice des scénarios

| Scénario | Résultat attendu |
|---|---|
| Nouveau profil sans réponse | Al-Fātiḥah |
| Nom fourni | Nom affiché dans l’espace personnel |
| Nom passé | Nom `NULL`, interface fonctionnelle |
| Objectif passé | Aucun objectif pédagogique forcé |
| Lecture arabe passée | Valeur `NULL`, moteur inchangé |
| Durée 5 minutes | Copy courte ; choix explicite de sourate prioritaire |
| Sourate READY choisie | Première leçon de cette sourate |
| Al-Māʿūn choisie | Refus, aucun CTA vers le parcours |
| Sourate préférée devenue indisponible | Fallback READY, Al-Fātiḥah en dernier recours |
| Utilisateur historique | Pas de nouvel onboarding obligatoire |
| Onboarding interrompu | `onboarded` reste inchangé |
| Profil modifié | Progression et SRS inchangés |
| Catalogue sans MASAQ | Recommandation inchangée |

## 11. Tests prévus

### Unitaire

- validation des enums et du nom ;
- valeurs nulles ;
- durée invalide ;
- sourate absente ;
- sourate `IN_PREPARATION` ;
- recommandation sans profil → Al-Fātiḥah ;
- choix explicite READY prioritaire ;
- choix explicite Al-Māʿūn refusé ;
- fallback après indisponibilité ;
- préférence pour les sourates courtes sans écraser un choix explicite.

### Intégration

- création et mise à jour du profil ;
- RLS utilisateur courant ;
- onboarding complet ;
- onboarding passé ;
- interruption ;
- utilisateur historique ;
- onboarding → dashboard → `/surahs` → `/learn/[slug]` ;
- profil → préférences → dashboard sans perte de progression.

### Navigateur et accessibilité

- `390×844` et `1280×720` ;
- labels, focus clavier, radios, boutons et états de chargement ;
- aucune erreur d’hydratation ;
- aucune dépendance navigateur dans le rendu serveur ;
- RTL arabe isolé et contenu Quranic intact ;
- aucun overflow horizontal.

## 12. Performance

La recommandation charge uniquement le profil et le catalogue déjà agrégé.
Elle ne charge ni mots, ni exercices, ni occurrences, ni MASAQ, et ne crée
aucun N+1.

## 13. Plan de migration et d’implémentation

La migration future sera additive, nullable, protégée par des contraintes
d’enum compatibles avec les utilisateurs existants, puis reflétée dans les
types générés et applicatifs.

Ordre prévu après approbation :

1. migration additive et types ;
2. validation/persistance serveur ;
3. fonction pure de recommandation et tests ;
4. onboarding mobile-first ;
5. première sourate et navigation ;
6. dashboard et `/surahs` ;
7. préférences du profil ;
8. tests complets ;
9. TypeScript, lint, build ;
10. validation navigateur et rapport final.

## 14. Non-régression

Avant et après implémentation, vérifier les compteurs Quran, les 90 leçons, les
14 sourates exposables, Al-Māʿūn `IN_PREPARATION`, `word_translations=263`,
MASAQ `97/170`, ainsi que le verrou `FATIHAH_REFERENCE_LOCKED`.

Les couches grading, scoring, SRS, mastery, scheduler, curriculum,
persistance de progression, audio et explications existantes doivent rester
inchangées fonctionnellement.

## Conclusion

Le design est complet et prêt à validation d’implémentation. Il conserve
l’onboarding humain et court, expose les parcours réellement disponibles,
personnalise l’accueil sans créer de second moteur pédagogique, et protège les
utilisateurs historiques comme les invariants Quran.

Statut : `PHASE_32B_DESIGN_COMPLETE_READY_FOR_IMPLEMENTATION_APPROVAL`
