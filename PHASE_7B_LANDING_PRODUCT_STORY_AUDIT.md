# Phase 7B — Hikma Landing Page · Product Storytelling & Conversion

## Statut

`PHASE_7B_LANDING_PRODUCT_STORY_AUDIT_COMPLETE_READY_FOR_APPROVAL`

Mode exécuté : `READ_ONLY AUDIT FIRST`.

Aucune implémentation Phase 7B n’a été commencée. Les changements existants du dépôt ont été préservés.

## Périmètre inspecté

- Landing publique : `app/page.tsx`, `components/app/landing.tsx`, `components/app/landing-product-preview.tsx`.
- Routes disponibles : `/`, `/login`, `/learn`, `/learn/basmala`, `/review`, `/design-system` et routes applicatives existantes.
- Primitives : `ArabicText`, `Card`, `Button`, `HikmaProgress`, `HikmaFeedback`, `HikmaExplanation`, `AudioPlayer`.
- Composants pédagogiques : `HikmaLessonCard`, `HikmaLessonFocus`, `HikmaExerciseShell`, `OptionsExercise`, `ExerciseFeedback`, `LessonPlayer`.
- Données et contrats : curriculum réel, leçon `basmala`, mots coraniques, contexte de verset, traductions françaises validées/fallback explicite, audio `word_audio` signé côté leçon.
- Runtime production local : `http://localhost:3010/`, DOM rendu et console inspectés en lecture seule.

## Résumé exécutif

La Phase 7A a établi une bonne première impression : hero product-first, ton warm, arabe vocalisé, CTA réel et preview de leçon. La faiblesse principale est désormais narrative : après le hero, la page décrit la boucle Hikma mais ne fait pas encore vivre une progression continue allant du mot à la compréhension, puis au rappel, au feedback et au parcours.

Le problème dominant est `P1 — storytelling produit incomplet`, pas un problème de route ou de stabilité. La landing contient des représentations fidèles, mais plusieurs fragments restent parallèles : les cartes de la boucle, le mot `ٱلْحَمْدُ`, la preview `ٱلرَّحْمَـٰنِ`, le parcours et les trois capacités ne se répondent pas assez.

## État runtime observé

| Signal | Observation |
|---|---|
| H1 | `Chaque mot compris ouvre un peu plus le verset.` |
| Sections principales | 7 sections sous `main`, dont hero et CTA final |
| CTA `/learn/basmala` | 3 liens rendus |
| Arabe | 3 éléments `lang="ar"` |
| Audio réellement rendu | Aucun `AudioPlayer` / aucun élément `<audio>` dans la landing actuelle |
| Feedback d’erreur | Non présenté dans le récit public actuel |
| Explication | `HikmaExplanation` non présent dans la landing actuelle |
| Console | Aucune erreur ni warning observé sur le runtime audité |
| Route d’entrée | `/learn/basmala` existe dans le code et le parcours |

## Audit section par section

| Section | Objectif | Contenu actuel | Produit réel visible | Problème | Priorité | Recommandation |
|---|---|---|---|---|---|---|
| Hero | Comprendre la promesse et commencer | H1, body, deux CTA, mascotte, preview | `ArabicText`, `HikmaProgress`, `HikmaFeedback`, preview statique | Très bon point d’entrée, mais la preview montre déjà plusieurs étapes sans expliquer leur continuité | P2 | Conserver ; donner à la preview un rôle de fil rouge et réduire les fragments concurrents |
| Boucle Hikma | Comprendre la méthode | 5 cartes `VOIR → FEEDBACK` | Copie fidèle, mais pas de fragments d’interface par étape | Ressemble encore à une grille SaaS ; ne montre pas la transformation d’une réponse | P1 | Remplacer par une composition éditoriale séquencée autour d’un même mot |
| Mot comme point de départ | Montrer la compréhension | `ٱلْحَمْدُ`, translittération, sens, `ٱلْحَمْدُ لِلَّهِ` | `ArabicText`, `Card` | Le mot change par rapport à la preview et s’arrête avant audio, référence et exercice | P1 | Unifier le récit autour de `ٱلرَّحْمَـٰنِ` ou d’un mot réellement disponible et révéler ses dimensions séparément |
| Parcours lisible | Montrer la continuité | 3 cartes marketing avec valeurs 18/0 | `HikmaProgress`, surfaces Hikma | Statuts et chiffres ne sont pas ceux d’un utilisateur réel ; le composant réel `HikmaLessonCard` n’est pas utilisé | P1 | Employer une fixture explicitement démonstrative ou une composition lab fidèle aux statuts `COMPLETED / IN_PROGRESS / AVAILABLE / LOCKED`, sans métrique présentée comme personnelle |
| Capacités | Rassurer sur l’expérience | 3 cartes `Écouter / Se rappeler / Avancer` | Icônes Lucide | Bloc générique et répétitif ; l’audio n’est pas réellement montrable ici sans URL signée | P2 | Intégrer audio et exercice dans le fil narratif ; ne garder qu’un rappel éditorial si nécessaire |
| Pour qui ? | Aider à se reconnaître | 4 profils | Copy honnête | Section correcte mais tardive et peu reliée à une action | P2 | Conserver plus courte ; utiliser les profils demandés sans parler de niveaux ni de placement automatique |
| CTA final / footer | Conclure et convertir | CTA Basmala, login, footer | Route réelle | Conclusion encore descriptive plutôt que narrative | P2 | Finir par `Commence par un mot` / `Construis ta compréhension, pas à pas`, avec une seule action primaire |

## Gaps produit à traiter

### P1 — Le fil du mot n’est pas continu

La preview hero met en scène `ٱلرَّحْمَـٰنِ`, tandis que la section suivante met en avant `ٱلْحَمْدُ`. Le visiteur voit deux démonstrations, mais pas un même objet qui passe de forme arabe à sens, audio, contexte puis rappel.

### P1 — La méthode est expliquée comme une liste

Les cinq cartes nomment correctement la boucle, mais aucune étape ne montre un fragment distinct de `HikmaExerciseShell`, `ExerciseFeedback` ou `HikmaExplanation`. La valeur pédagogique est donc déclarée plutôt que démontrée.

### P1 — L’erreur utile est absente

Les composants existants savent distinguer `correct`, `incorrect` et `ambiguous`, afficher `Ta réponse`, `Réponse attendue` et ouvrir `Comprendre pourquoi`. La landing n’expose pas cette différence, alors qu’elle constitue une preuve forte de la méthode Hikma.

### P1 — Le parcours est une fixture implicite

Les valeurs `18`, `0` et les statuts « Prochaine étape / Ensuite / Progressivement » peuvent être interprétés comme une progression réelle. Une scène de démonstration doit porter un libellé explicite et ne pas suggérer un compte utilisateur.

### P2 — Audio réel non montrable dans la landing actuelle

Le produit réel utilise `word_audio` et des URLs signées côté serveur dans `LessonPage`. La landing publique n’a pas de données signées disponibles dans son composant serveur actuel. Il ne faut donc pas inventer une URL ni faire passer un bouton décoratif pour un lecteur opérationnel. Deux options sûres sont proposées ci-dessous.

### P2 — Répétition de cartes

Hero preview, boucle en cinq cartes, mot/contexte, trois capacités et trois cartes de parcours créent plusieurs surfaces successives avec une densité similaire. Le récit gagnerait à alterner scène produit dense, espace éditorial et feedback détaillé.

## Forces à conserver

1. La direction warm `The Quranic Editorial Studio` est cohérente avec Hikma.
2. Le H1 est unique, clair et mémorisable.
3. Le CTA principal cible une route réelle : `/learn/basmala`.
4. `ArabicText` préserve le RTL local, Amiri et les diacritiques.
5. La preview actuelle réutilise des primitives existantes au lieu de dupliquer le moteur métier.
6. Aucun chiffre de preuve, témoignage ou mécanisme de gamification n’a été inventé.
7. Le runtime audité ne présente aucune erreur console.

## Architecture narrative proposée

```text
HERO — promesse + aperçu du mot
  ↓
LE PROBLÈME — reconnaître / réciter sans toujours comprendre
  ↓
LE MOT AU CENTRE — ٱلرَّحْمَـٰنِ : forme → sens → contexte
  ↓
LA MÉTHODE — voir → comprendre → se rappeler → produire
  ↓
L’AUDIO — écouter le modèle si une donnée réelle est exposée
  ↓
L’EXERCICE — choisir après un vrai effort de rappel
  ↓
L’ERREUR UTILE — réponse, attendu, explication vérifiable
  ↓
LE PARCOURS — états de leçons explicitement démonstratifs
  ↓
POUR QUI / MOMENT HIKMA
  ↓
COMMENCER — /learn/basmala
```

## Approches d’implémentation soumises à approbation

### Approche A — Fil rouge statique autour d’un mot (recommandée)

Créer une composition de landing composée de fragments statiques réutilisant les primitives existantes. Le même mot reste le fil rouge ; les étapes révèlent forme, sens, contexte, exercice, feedback et explication. L’audio est présenté comme expérience disponible dans la leçon uniquement si aucune URL publique réelle n’est injectée dans la landing.

Avantage : récit très clair, aucune nouvelle logique métier, aucune donnée utilisateur fictive, faible risque SSR et bon contrôle responsive.

### Approche B — Preview interactive locale

Ajouter un composant client de démonstration avec sélection d’option et ouverture d’explication, sans persistance ni appel métier.

Avantage : preuve plus immersive. Inconvénient : état client supplémentaire, risque de faire croire à une vraie session et surface de test plus large ; non nécessaire pour démontrer la valeur.

### Approche C — Compositions directement alimentées par le curriculum

Lire les données publiques réelles pour générer une partie de la landing.

Avantage : contenu toujours synchronisé. Inconvénient : dépendance DB/réseau sur la page publique, risque de données indisponibles ou de traductions fallback, et mélange entre marketing et contrats métier. À écarter pour 7B.

### Recommandation

Valider l’Approche A. Elle montre réellement les composants existants tout en gardant une landing déterministe et honnête. Les previews resteront explicitement démonstratives ; aucune progression personnelle ni audio signé ne sera prétendu.

## Périmètre proposé après approbation

- Modifier uniquement `components/app/landing.tsx` et les composants de preview dédiés à la landing.
- Réutiliser `ArabicText`, `HikmaProgress`, `HikmaFeedback`, `HikmaExplanation`, `HikmaExerciseShell` et `HikmaLessonCard` lorsque leur API convient.
- Ajouter/mettre à jour la section Design System Lab `Landing / Product Storytelling`.
- Mettre à jour `docs/ui-ux-skills/hikma-landing-page/README.md`.
- Ne toucher ni aux générateurs, grading, scoring, SRS, mastery, scheduler, interleaving, curriculum, Supabase, migrations, données Quran/audio backend, auth métier ou persistance.

## Validation prévue après approbation

- `npm test`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- Browser réel en `1440×900`, `1280×720`, `390×844`, `375×812`.
- Vérifications : hydration, console, overflow, headings, CTA, liens, arabe, disclosure, feedback, responsive et reduced motion.

## Décision demandée

Approuver ou réviser l’Approche A avant toute modification d’implémentation Phase 7B.
