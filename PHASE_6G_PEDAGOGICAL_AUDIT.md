# Phase 6G — Pedagogical Content & Exercise Intelligence Audit

**Statut : `READ_ONLY` · `AUDIT_ONLY` · `NO_IMPLEMENTATION`**

## Verdict exécutif

Le moteur d’exercices possède une base pédagogique réelle : 14 familles déclarées, une résolution par compétences, une interleaving explicite, du rappel libre français et de la production arabe, ainsi qu’une gestion audio prudente. L’audit ne permet toutefois pas une approbation pédagogique complète.

Les risques les plus importants sont l’exposition possible de la réponse dans `CONTEXT_RECOGNITION`, le décalage anglais/français du fallback de contenu en rappel libre, les distracteurs sélectionnés par ordre de banque, et les explications trop génériques après erreur. Le système est donc **prêt pour approbation de l’audit**, mais pas pour une validation “ready for production” du contenu pédagogique.

## Périmètre et méthode

- Cartographie des générateurs, types, skills, séquenceurs, composants d’exercice, grading et feedback.
- Exécution sur la fixture Al-Fatiha existante de quatre mots, sans données audio, contexte ou lemme facultatives.
- Vérification des contrats de rappel français/arabe, de la normalisation et des états `CORRECT` / `AMBIGUOUS` / `INCORRECT`.
- Audit de la présence de la translittération, du contexte coranique, des explications et du parcours audio/prononciation.
- Aucun fichier applicatif, générateur, ordonnanceur, scoring, SRS, mastery, curriculum ou donnée Quran n’a été modifié.

**Limite de confiance : `PARTIAL`.** Aucun export authentifié de leçon de production ni télémétrie de réponses n’était disponible. Les constats de données facultatives sont donc confirmés par les contrats et non par une cohorte réelle.

## Cartographie du système

Les 14 familles sont inventoriées dans [`exercise-inventory.json`](tmp/phase6g-pedagogical/exercise-inventory.json). La fixture produit 32 exercices : huit familles actives, quatre occurrences par mot. `AUDIO_TO_WORD`, `CONTEXT_RECOGNITION` et `LEMMA_RELATION` retournent `null` sans les données de production correspondantes. `PRONUNCIATION_GUIDED` est ajouté pour le premier mot et reste auto-évalué ; `PHONETIC_DISCRIMINATION` est ajouté au maximum trois fois lorsque les audio et traits phonétiques existent.

## Fuites de réponse et intégrité du rappel

Le point critique est `CONTEXT_RECOGNITION` : le composant affiche la traduction française du contexte avant les options. Si cette traduction contient le gloss de la cible, le choix ne mesure plus le rappel du sens. Le niveau est **P0 — total lorsque le gloss est verbatim**.

`TRANSLATION_TO_WORD` affiche également la translittération dans le prompt. Ce n’est pas une fuite totale, mais c’est une aide phonologique indirecte pour une tâche censée retrouver la forme arabe. `WORD_RECOGNITION` affiche volontairement arabe, translittération et sens avant une auto-évaluation non scorée ; cela reste acceptable uniquement comme exposition, jamais comme preuve de maîtrise.

Le détail complet figure dans [`answer-leakage.json`](tmp/phase6g-pedagogical/answer-leakage.json).

Le rappel libre est techniquement robuste sur les accents, espaces, apostrophes, séparateurs et variantes arabes. La distinction entre squelette arabe identique sans voyelles et vocalisation divergente est conservée. En revanche, le fallback anglais de la banque de mots peut être présenté avec `freeTextLang: "fr"` et la consigne “Écris ta réponse en français”. C’est un défaut d’alignement contenu/contrat, classé P1.

## Distracteurs

La sélection actuelle est déterministe et fondée sur l’ordre de la banque. Elle garantit une structure valide, mais ne vérifie ni distance sémantique, ni proximité morphologique, ni confusion phonétique, ni difficulté.

Dans la fixture, `the Most Gracious` / `the Most Merciful` et `l-raḥmāni` / `l-raḥīmi` sont de bonnes confusions. D’autres alternatives sont éloignées et deviennent éliminables sans compétence réelle. Le risque est particulièrement important pour `LEMMA_RELATION`, où la comparabilité morphologique des distracteurs n’est pas démontrée.

Voir [`distractor-audit.json`](tmp/phase6g-pedagogical/distractor-audit.json).

## Variété et progression cognitive

La fixture contient huit types distincts et quatre occurrences par mot. L’interleaving limite certains enchaînements, mais on observe un maximum de trois exercices du même type et une séquence de quatre `WORD_RECOGNITION` avant le bloc de rappel libre. Les prompts exacts sont également réutilisés : 13 répétitions dans une fenêtre de cinq et 13 dans une fenêtre de dix selon la mesure retenue.

La séquence connectée par skills est plus lisible : reconnaissance du sens, reconnaissance de la forme, rappel de sens, production de forme, audio, contexte, lemme, rétention. Le parcours visiteur reste moins progressif car la reconnaissance non scorée précède directement le rappel. Aucun mécanisme de réactivation intra-leçon après erreur n’a été établi dans les contrats audités.

Les chiffres sont dans [`variety.json`](tmp/phase6g-pedagogical/variety.json) et l’analyse dans [`cognitive-progression.json`](tmp/phase6g-pedagogical/cognitive-progression.json).

## Difficulté et charge cognitive

La fixture expose une difficulté uniforme à 1. Sans temps de réponse, retries, abandons ou cohortes, la difficulté réelle ne peut pas être calibrée (`INSUFFICIENT_DATA`). Qualitativement, le choix de sens est une reconnaissance plus faible que `FORM_TO_MEANING`, et `MEANING_TO_FORM` est une production arabe plus exigeante. `COMPLETE_WORD` ne teste que le dernier token du sens affiché, ce qui réduit la demande cognitive.

Voir [`difficulty.json`](tmp/phase6g-pedagogical/difficulty.json).

## Contexte coranique et translittération

Le texte arabe contextuel est conservé dans un bloc RTL-aware et la référence de sourate est présente lorsque le contexte existe. Le défaut n’est pas l’affichage du texte sacré, mais l’isolation de la cible dans la traduction française avant une question de sens.

La translittération est utile pour l’exposition et la reconnaissance phonologique, mais sa présence dans `TRANSLATION_TO_WORD` doit être explicitement arbitrée selon l’objectif : reconnaître une prononciation ou rappeler une graphie arabe. Le détail est dans [`context-audit.json`](tmp/phase6g-pedagogical/context-audit.json) et [`transliteration-audit.json`](tmp/phase6g-pedagogical/transliteration-audit.json).

## Explications, erreurs et prononciation

Les explications phonétiques sont vérifiées lorsqu’un trait et des indices existent. Les explications de lemme restent partielles et les explications de sens/formes sont génériques. Le filtrage anti-duplication du feedback est sain, mais un QCM incorrect peut finir sans explication réellement liée à la confusion de l’utilisateur. Aucun mécanisme morphologique, racine ou grammaire n’a été inventé pendant l’audit.

Le parcours audio n’invente pas de source : les URL audio sont réelles lorsqu’elles existent, sinon les générateurs dépendants retournent `null`. L’analyse micro produit `NO_SIGNAL` ou `REVIEW_REQUIRED`, pas une fausse correction automatique. La prononciation guidée est auto-évaluée et non scorée ; la discrimination phonétique est objective uniquement lorsque ses données existent.

Voir [`explanation-audit.json`](tmp/phase6g-pedagogical/explanation-audit.json) et [`pronunciation-audit.json`](tmp/phase6g-pedagogical/pronunciation-audit.json).

## Scores d’audit

| Axe | Score / 5 | Confiance |
|---|---:|---|
| Clarté des skills | 3,5 | Partielle |
| Intégrité du rappel | 2,5 | Partielle |
| Qualité des distracteurs | 2,5 | Partielle |
| Variété | 3,0 | Partielle |
| Calibration de difficulté | 2,0 | Insuffisante |
| Progression cognitive | 3,0 | Partielle |
| Intégrité du contexte | 2,0 | Partielle |
| Politique de translittération | 3,0 | Partielle |
| Qualité des explications | 2,5 | Partielle |
| Intégrité audio/prononciation | 3,5 | Partielle |

## Registre des risques

Le registre priorisé est disponible dans [`risk-register.json`](tmp/phase6g-pedagogical/risk-register.json). Aucun risque n’a été corrigé pendant cette phase. Les suites proposées sont des candidats à validation : contrat d’isolation du contexte, alignement de locale, distracteurs sémantiques, et explications spécifiques à l’erreur.

## Validations prévues

Les validations de dépôt demandées par le brief sont lancées après la génération de ce rapport : `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, ainsi que la validation syntaxique de tous les JSON. Toute défaillance sera documentée telle quelle ; aucune correction applicative ne sera introduite.

## Décision

La décision formelle est dans [`final-decision.json`](tmp/phase6g-pedagogical/final-decision.json). L’implémentation de 6G-B, d’un nouveau scheduler, grading, SRS, mastery, curriculum ou migration de données n’a pas commencé.

PEDAGOGICAL_AUDIT_COMPLETE_READY_FOR_APPROVAL
