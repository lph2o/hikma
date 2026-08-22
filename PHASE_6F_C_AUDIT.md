# PHASE 6F-C — Audit feedback premium, explications pédagogiques et langage UX islamique

**Statut : READ_ONLY — aucune implémentation démarrée**  
**Périmètre :** feedback post-réponse, rappel libre, explications, phonétique, arabe/RTL, copie UX islamique, accessibilité et responsive.

## Verdict exécutif

Hikma sépare déjà correctement la réponse brute (`Ta réponse`) de la réponse attendue (`Réponse attendue`) et protège contre la duplication de la bonne réponse dans le texte d’explication. Le moteur expose toutefois un seul champ `AnswerResult.explanation: string | null`, principalement utilisé pour des corrections courtes. Il n’existe pas encore de contrat structuré indiquant la source, le niveau de confiance, le type de fait ou l’état de disponibilité d’une explication.

La base fiable existe pour :

- afficher la forme arabe, la translittération et le sens réellement fournis ;
- rappeler une réponse attendue issue de `meaning`, `revealContent` ou `expectedArabic` ;
- expliquer les marques et sons détectés par `lib/learning/phonetics.ts` ;
- afficher un contexte de verset réel sans le transformer en tafsīr ou en analyse grammaticale.

Elle n’existe pas pour une analyse morphologique détaillée, une racine, une fonction grammaticale, une conjugaison ou un diagnostic automatique de prononciation. Ces contenus doivent rester `UNAVAILABLE` tant qu’une source vérifiée et un contrat éditorial explicite ne sont pas disponibles.

## Cartographie du flux actuel

`validateAnswer()` produit un `AnswerResult`. `LessonPlayer` transmet ce résultat à `FeedbackPanel`, qui le délègue à `ExerciseFeedback`.

Le rendu actuel suit :

1. statut et message ;
2. surface rouge douce `Ta réponse` pour une réponse incorrecte ou ambiguë ;
3. surface verte douce `Réponse attendue` ;
4. explication courte si elle existe ;
5. action `Continuer` portée par le shell de leçon.

Cette structure est saine pour la séparation visuelle et sémantique. Le manque principal est la progression pédagogique : l’explication est immédiatement visible quand elle existe, sans choix explicite `Comprendre pourquoi`, sans distinction entre explication courte, détaillée ou indisponible, et sans provenance exposable.

## Sources de connaissance et niveaux de confiance

### VERIFIED — affichable après approbation

- `metadata.meaning`, `revealContent`, `expectedArabic` : réponse attendue et rappel de sens, sans prétendre expliquer l’origine du sens.
- `metadata.arabic` et `metadata.transliteration` : forme arabe et aide secondaire de lecture.
- `metadata.phoneticMarks` et `metadata.phoneticHints` : conseils dérivés de la forme arabe réelle.
- `metadata.phoneticTrait` pour `PHONETIC_DISCRIMINATION` : définition issue de `allPhoneticMarks()`.

### PARTIAL — uniquement avec un libellé limité

- `WordContextData` permet d’afficher le verset réel et sa traduction française. Il ne fournit pas d’analyse de la valeur du mot dans le verset.
- `WordLemmaData` vérifie une relation forme → lemme et des formes sœurs. Il ne fournit pas de morphologie, racine, temps, cas ou dérivation sémantique.
- `AnswerResult.explanation` peut servir de note courte de correction, mais sa chaîne n’est ni typée ni accompagnée d’une provenance.

### UNAVAILABLE — ne pas générer

- analyse morphologique arabe détaillée ;
- racine ou étymologie déduite par ressemblance ;
- diagnostic de prononciation, score vocal ou mesure de justesse ;
- explication religieuse, exégétique ou grammaticale non portée par une source existante.

Le fallback requis est exactement : **« Cette explication détaillée n’est pas encore disponible pour ce mot. »**

## Recommandation UX après une erreur

Après validation, conserver l’effort visible puis proposer une progression en divulgation progressive :

`Ta réponse` → `Réponse attendue` → `À revoir` / feedback bref → `Comprendre pourquoi` → explication source-backed → audio ou arabe si utile → `Continuer`.

L’explication doit être fermée par défaut pour protéger le rappel actif et éviter de transformer chaque correction en bloc de lecture. Le bouton doit exposer `aria-expanded` et `aria-controls`, fonctionner au clavier et rester utilisable à 390 px. Une explication indisponible est un état honnête, pas une invitation à inventer du contenu.

Pour une réponse correcte, proposer une chaleur mesurée, par exemple **« Mā shā’ Allāh — réponse juste. »** dans les contextes où cela sert l’expérience. Ne pas ajouter mécaniquement une formule religieuse après chaque action et ne pas créer de gamification spirituelle, de points religieux ou de statut de piété.

## Composant recommandé pour l’implémentation ultérieure

Créer un composant de présentation réutilisable `HikmaPedagogicalExplanation` accompagné d’un adaptateur explicite. L’adaptateur devrait produire une charge avec :

- `availability: verified | partial | unavailable` ;
- `kind: meaning | phonetic | context | lemma | audio` ;
- `shortText` et éventuellement `detailText` ;
- contenu arabe optionnel, direction RTL et audio optionnel ;
- provenance ou justification interne ;
- aucun verdict automatique de prononciation.

Ce composant ne doit pas modifier `validateAnswer`, `scoreAnswer`, le scheduler, le SRS, la maîtrise ou la persistance. Le rendu du sens, du verset et de la phonétique doit rester strictement séparé d’une éventuelle explication morphologique future.

## Accessibilité, RTL, motion et responsive

- conserver les surfaces sémantiques success/error et leurs variantes de texte AA ;
- garder `ArabicText`, les directions RTL et l’ordre logique des contenus ;
- introduire `aria-expanded` / `aria-controls` uniquement sur la divulgation ;
- respecter le clavier, les zones tactiles et la lecture par lecteur d’écran ;
- conserver la motion limitée à transform/opacity et respecter `prefers-reduced-motion` ;
- vérifier les longues gloses et explications françaises à 390 px ;
- à 1280 px, maintenir l’explication dans la colonne de focus sans faire revenir la surcharge de contexte constatée en Phase 6F.

## Priorités

| Priorité | Sujet | Décision d’audit |
| --- | --- | --- |
| P0 | Fiabilité des explications | Ne jamais inventer de morphologie, de tafsīr ou de diagnostic audio. |
| P1 | Contrat explicatif | Introduire un payload structuré avec disponibilité et type de source. |
| P1 | Divulgation | Ajouter `Comprendre pourquoi`, fermé par défaut, accessible et sans duplication. |
| P1 | États | Couvrir correct, incorrect, vide, ambigu, ouvert, fermé et indisponible. |
| P2 | Copie islamique | Utiliser une chaleur contextualisée, sans automatisme ni gamification religieuse. |
| P2 | Design lab et tests | Documenter et tester les variantes mobile, RTL et reduced motion. |

## Frontière de non-régression

Cette phase ne doit toucher ni au backend, ni à la base de données, ni aux migrations, ni au grading, ni aux scores, ni au SRS, ni à la maîtrise, ni au curriculum, ni au scheduler, ni à l’interleaving, ni au backend audio, ni à la persistance ou à la complétion de leçon. L’implémentation future est limitée à la présentation, au contrat d’explication, à la copie, aux tests et à la documentation.

## Artefacts détaillés

- [feedback-contract.json](</Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase6f-c/feedback-contract.json>)
- [explanation-source-audit.json](</Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase6f-c/explanation-source-audit.json>)
- [exercise-type-matrix.json](</Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase6f-c/exercise-type-matrix.json>)
- [copy-audit.json](</Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase6f-c/copy-audit.json>)
- [accessibility-audit.json](</Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase6f-c/accessibility-audit.json>)
- [responsive-audit.json](</Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase6f-c/responsive-audit.json>)
- [non-regression-boundary.json](</Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase6f-c/non-regression-boundary.json>)

## État final

Audit terminé en READ_ONLY. Aucun composant, générateur, contrat moteur, backend ou schéma de données n’a été modifié. L’implémentation attend une approbation explicite séparée.

**PHASE_6F_C_AUDIT_COMPLETE_READY_FOR_APPROVAL**
