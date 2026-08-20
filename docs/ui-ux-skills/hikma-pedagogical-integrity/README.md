# Hikma — Pedagogical Integrity

Cette skill protège l’effort cognitif et l’honnêteté du contenu pédagogique.

## Principes

- Le contexte coranique aide à situer le mot, mais ne doit pas afficher la réponse avant l’effort.
- L’arabe du verset reste visible et intact ; la traduction peut être repliée par divulgation progressive.
- Une détection de fuite ne reconnaît que les formulations de réponse déjà connues. Elle ne fait ni synonymie, ni paraphrase, ni traduction automatique.
- Si la détection est incertaine, la traduction est repliée par défaut.
- La consigne de rappel libre doit correspondre à la langue réelle et validée de la réponse attendue.
- Aucune traduction anglaise n’est transformée automatiquement en français.
- Un distracteur sans relation documentée porte le niveau `UNKNOWN` ; il ne doit pas être présenté comme sémantiquement proche.
- Une explication `VERIFIED` utilise seulement des données présentes et validées. Une explication `PARTIAL` ne dépasse pas les faits disponibles. `UNAVAILABLE` est préférable à une analyse inventée.
- Après erreur, la réponse de l’apprenant et la réponse attendue restent deux surfaces distinctes, avec texte et icône en plus de la couleur.
- Les caractères Quranic Arabic (`ٱ`, shadda, sukun, voyelles, alif khanjariyah, tatweel) ne sont jamais remplacés dans le rendu utilisateur.

## États attendus

| Domaine | États |
|---|---|
| Exposition de traduction | `SAFE_CONTEXT`, `REVEAL_RISK`, `UNKNOWN` |
| Langue du rappel | `FR_VERIFIED`, `EN_VERIFIED`, `UNKNOWN` |
| Distracteur | `VERIFIED`, `PARTIAL`, `UNKNOWN` |
| Explication | `verified`, `partial`, `unavailable` |

## Garde-fous

- Ne pas modifier grading, scoring, SRS, mastery, scheduler, interleaving, curriculum, persistance, Supabase, migrations, données Quran ou audio backend pour résoudre un problème d’interface.
- Si une amélioration nécessite une nouvelle donnée ou une analyse morphologique non vérifiée, signaler `BLOCKED_BY_DATA`.
- Si elle nécessite un changement de contrat métier, signaler `BLOCKED_BY_SCOPE` et demander une approbation spécifique.
- Toujours tester le texte `ٱلرَّحْمَـٰنِ` dans un conteneur RTL avec une line-height adaptée.

## Anti-patterns

- Afficher la traduction du contexte avant une question dont elle contient le sens.
- Afficher « réponds en français » avec une glose anglaise.
- Appeler un distracteur « proche », « synonyme » ou « même racine » sans donnée vérifiée.
- Déduire une racine, un schème, une fonction grammaticale ou une règle de tajwid à partir de la seule forme.
- Normaliser le contenu visible en remplaçant `ٱ` par `ا`.
