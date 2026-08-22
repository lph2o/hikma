# PHASE 7C — LANDING PREMIUM CONVERSION & UX AUDIT

## Statut

`PHASE_7C_LANDING_AUDIT_COMPLETE_READY_FOR_APPROVAL`

Mode : `READ_ONLY / AUDIT_ONLY`

## Périmètre et méthode

Audit de la landing actuelle après les Phases 7A et 7B. Aucun fichier source, composant, style, token, donnée, configuration, backend ou moteur pédagogique n’a été modifié pendant cette phase. Les seuls nouveaux fichiers sont ce rapport et les artefacts `tmp/phase7c/`.

L’audit combine lecture du code, inspection DOM runtime et validation navigateur réelle en build de production sur `1440×900`, `1280×720`, `390×844` et `375×812`. Les quatre viewports ne présentent pas d’overflow horizontal, le CTA hero est visible dans le premier viewport et aucune erreur console, erreur React ou alerte d’hydratation n’a été observée.

## Verdict exécutif

La landing est visuellement premium, cohérente et honnête. Elle explique réellement le produit : un mot arabe, son sens, son contexte, l’écoute, le rappel, le feedback et le parcours. Le fil rouge autour de `ٱلرَّحْمَـٰنِ` est présent dans les surfaces clés, et les éléments statiques sont explicitement présentés comme une démonstration.

Le principal frein n’est pas la qualité visuelle mais la conversion après la première impression : la page mesure environ `10 124–10 374 px` sur mobile, comporte 10 sections, 11 cartes et environ 4 803 caractères. Le CTA final arrive après une longue séquence. La scène de feedback contient aussi deux disclosures « Comprendre pourquoi », ce qui dilue la hiérarchie pédagogique. Enfin, la démonstration d’exercice est honnêtement statique mais ses contrôles désactivés peuvent être perçus comme une interface non fonctionnelle.

Score global : **4,02 / 5**.

Recommandation : **Approche B — premium conversion**, à faire approuver avant toute implémentation.

## Première visite et proposition de valeur

| Moment | Ce que comprend un nouveau visiteur |
|---|---|
| 5 secondes | Hikma aide à apprendre le Coran avec clarté, à partir d’un mot arabe, avec un CTA immédiat. |
| 15 secondes | Le produit relie mot, sens et rappel dans une leçon guidée. |
| 30 secondes | La méthode montre contexte, écoute, effort de rappel et feedback. |
| 60 secondes | Le visiteur voit l’erreur utile, l’explication et le parcours, mais la densité commence à peser. |
| Fin de page | L’action reste claire, mais elle arrive tard sur mobile. |

Réponses essentielles :

- Hikma est identifiable comme un produit d’apprentissage du vocabulaire coranique, pas comme un simple lecteur.
- Le public est explicité : débutant, lecteur arabe, personne souhaitant approfondir ou progresser régulièrement.
- La première action est sans ambiguïté : `/learn/basmala`.
- La différenciation par rapport à un lecteur, un dictionnaire ou une app généraliste est visible par la boucle de rappel et feedback, mais reste davantage démontrée qu’énoncée.

Score proposition de valeur : **4,17 / 5**.

## Fil rouge produit et qualité pédagogique

Le mot `ٱلرَّحْمَـٰنِ` est suivi de manière cohérente entre la preview hero, la forme arabe, le contexte coranique, l’écoute et l’exercice. La scène de contexte sépare correctement texte arabe, traduction et référence `Al-Fatiha · 1:1`. Aucun élément audio public inventé n’est utilisé : le lien « Écouter dans la leçon » mène vers la leçon réelle.

La boucle pédagogique est lisible : voir → comprendre → se rappeler → produire → recevoir du feedback. `ExerciseFeedback`, `HikmaExplanation`, `HikmaExerciseShell`, `AnswerOption` et `HikmaProgress` sont réutilisés. Le parcours de progression est marqué `DÉMONSTRATION · pas une progression personnelle`, sans métrique utilisateur fictive.

Point de vigilance : `ExerciseFeedback` rend déjà une explication repliée dans la scène d’erreur, puis une seconde `HikmaExplanation` est ajoutée juste après. Le runtime expose deux boutons « Comprendre pourquoi ». Cette duplication est le principal défaut de clarté pédagogique relevé.

## Conversion, densité et rythme

Le CTA hero est bien placé et visible sur les quatre dimensions. Les quatre liens vers `/learn/basmala` sont cohérents : premier parcours, passage audio, CTA final et pied de page. Le lien secondaire `Voir un mot en action` facilite l’exploration.

Le problème est le rythme global : le CTA final se situe vers `9 972–10 020 px` sur un viewport de largeur 375. Il n’existe pas de CTA principal après la démonstration feedback/path, alors que c’est le moment où la preuve produit est la plus forte. La landing gagne donc à proposer une conversion intermédiaire ou à condenser certains actes narratifs.

La densité est aussi un enjeu de perception premium : 10 sections, 11 cartes et un long scroll mobile rendent la conclusion moins découvrable. Il ne s’agit pas d’un défaut responsive technique : aucun overflow n’a été observé, mais d’un coût cognitif et commercial.

## Copywriting et langage islamique

Le ton est chaleureux, calme et pédagogique. Les expressions islamiques ne sont pas utilisées comme micro-récompenses mécaniques. `Bismillah` apparaît ici comme texte coranique contextualisé et référencé, ce qui respecte la règle de faible fréquence et de contexte significatif. Aucun « Mā shā’ Allāh » ou « Al-ḥamdulillāh » artificiel n’est injecté après les preuves ordinaires.

Quelques formulations reprennent le même motif « mot / sens / parcours ». Les labels de processus sont nombreux et la mention `retrouver le sens` dans le shell de démonstration est moins éditorialisée que le reste. Ce sont des opportunités de polish, pas des erreurs de fond.

## Responsive, accessibilité et performance perçue

Résultats runtime :

| Viewport | Overflow | CTA hero dans le viewport | Hauteur page | Console / hydratation |
|---|---:|---:|---:|---|
| 1440×900 | PASS | PASS | 7 073 px | aucune erreur / aucun warning |
| 1280×720 | PASS | PASS | 7 073 px | aucune erreur / aucun warning |
| 390×844 | PASS | PASS | 10 124 px | aucune erreur / aucun warning |
| 375×812 | PASS | PASS | 10 374 px | aucune erreur / aucun warning |

Le texte arabe ne présente aucun clipping observé. À 375 px, les blocs mesurés restent contenus, notamment le contexte arabe d’environ 235 px de large et 36 px de haut. Les landmarks sont présents : un `main`, un `h1`, et 10 sections avec des références `aria-labelledby` résolues.

Les contrôles désactivés sont accessibles techniquement mais peuvent envoyer un signal de panne dans une démonstration marketing. Les contrastes exacts n’ont pas été recalculés pixel par pixel dans cet audit ; l’usage des tokens texte Hikma est cohérent avec le système existant.

La performance perçue est bonne côté médias : aucune balise audio ni nouvelle ressource lourde n’est chargée. La longueur de la page est le principal facteur de lourdeur ressentie, pas un problème de build ou de runtime constaté.

## Comparaison de positionnement

| Alternative perçue | Promesse dominante | Ce que Hikma rend visible |
|---|---|---|
| Lecteur coranique | lire / écouter | mot, sens, contexte et rappel |
| App de mémorisation | répéter / retenir | effort de rappel et feedback explicatif |
| App généraliste gamifiée | exercices fréquents | apprentissage calme, contextualisé et coranique |
| Cours d’arabe général | langue large | vocabulaire et compréhension du Coran |
| Dictionnaire | consulter | progression active de la reconnaissance vers la production |
| Plateforme de cours | consommer du contenu | boucle courte et retour après réponse |

La promesse de révision durable, SRS et maîtrise n’est pas suffisamment visible sur la landing ; c’est acceptable pour le périmètre actuel, mais à considérer dans une future décision produit sans inventer de bénéfices non démontrés.

## Issues priorisées

Les détails structurés sont dans [issues.json](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase7c/issues.json).

| ID | Priorité | Sujet |
|---|---|---|
| 7C-CONV-01 | P1 | CTA final trop tardif et absence de conversion intermédiaire |
| 7C-DENS-01 | P1 | Longueur et densité élevées sur mobile |
| 7C-FB-01 | P1 | Deux disclosures d’explication dans la scène de feedback |
| 7C-EX-01 | P2 | Démonstration d’exercice avec contrôles désactivés |
| 7C-AUDIO-01 | P2 | Audio non jouable sur la landing, malgré un lien honnête vers la leçon |
| 7C-COPY-01 | P2 | Répétition de motifs éditoriaux |

## Trois approches proposées

### A — Polish ciblé

Supprimer la duplication d’explication, clarifier le caractère statique de l’exercice, alléger les répétitions et placer un CTA intermédiaire simple.

- Avantages : faible risque, effort réduit, corrections directement alignées sur les écarts observés.
- Inconvénients : la longueur structurelle resterait en partie présente.
- Risque : faible.
- Effort : faible.
- Impact attendu : moyen à élevé.

### B — Premium conversion — recommandée

Conserver le fil rouge et les composants existants, mais condenser les actes narratifs, déplacer une conversion après la preuve feedback/produit et réduire le temps nécessaire pour atteindre une action claire.

- Avantages : traite directement la densité et le CTA tardif tout en préservant la démonstration produit.
- Inconvénients : réorganisation visible nécessitant une nouvelle validation responsive et accessibilité.
- Risque : moyen.
- Effort : moyen.
- Impact attendu : élevé.

### C — Editorial signature

Transformer la page en séquence plus éditoriale : moins de cartes, davantage d’ancres arabes et de respirations, avec une expression de marque plus distinctive.

- Avantages : différenciation forte et potentiel de signature premium.
- Inconvénients : la preuve produit pourrait devenir moins explicite si l’éditorial prend le dessus ; effort important.
- Risque : moyen à élevé.
- Effort : élevé.
- Impact attendu : élevé pour la marque, plus incertain pour la conversion.

## Approche recommandée

Je recommande **B — premium conversion**. La landing n’a pas besoin d’une refonte de fond : elle a besoin d’un meilleur dosage entre preuve, respiration et action. Cette approche doit conserver les composants Hikma, le mot fil rouge, la contextualisation coranique et l’honnêteté sur l’audio, tout en traitant les trois écarts P1.

## Validations techniques et navigateur

- `npm test` : **PASS — 34 fichiers, 428 tests**.
- `npx tsc --noEmit` : **PASS**.
- `npm run lint` : **PASS**.
- `npm run build` : **PASS — Next 16.3.0, build production généré**.
- Navigateur production réel : **PASS** sur `1440×900`, `1280×720`, `390×844`, `375×812`.
- Console : aucune erreur JavaScript, React ou hydratation ; aucun warning observé.
- Navigation : liens inspectés (`/learn/basmala`, `/login`, `#word-story`) sans route inventée.
- Audio : aucune balise audio simulée ; lien réel vers la leçon confirmé.

## Non-modification explicite

```text
SOURCE_FILES_MODIFIED: 0
BACKEND_MODIFIED: 0
DATABASE_MODIFIED: 0
MIGRATIONS: 0
PEDAGOGICAL_ENGINE_MODIFIED: 0
GRADING_MODIFIED: 0
SCORING_MODIFIED: 0
SRS_MODIFIED: 0
MASTERY_MODIFIED: 0
CURRICULUM_MODIFIED: 0
PERSISTENCE_MODIFIED: 0
```

Le dépôt contenait déjà de nombreux changements non commités et artifacts historiques ; ils ont été préservés. Le statut `SOURCE_FILES_MODIFIED: 0` désigne spécifiquement le périmètre de cette Phase 7C.

## Artefacts

- [visual-audit.json](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase7c/visual-audit.json)
- [responsive-audit.json](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase7c/responsive-audit.json)
- [conversion-audit.json](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase7c/conversion-audit.json)
- [copy-audit.json](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase7c/copy-audit.json)
- [accessibility-audit.json](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase7c/accessibility-audit.json)
- [product-consistency.json](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase7c/product-consistency.json)
- [content-integrity.json](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase7c/content-integrity.json)
- [issues.json](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase7c/issues.json)
- [recommendations.json](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase7c/recommendations.json)
- [score.json](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase7c/score.json)

Les JSON ont été validés avec `jq empty`.

La Phase 7C est prête pour approbation. Aucune implémentation ne doit commencer avant cette approbation.
