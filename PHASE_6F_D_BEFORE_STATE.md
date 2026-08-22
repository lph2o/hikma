# PHASE 6F-D — Before State / mini-audit

**Statut : READ_ONLY — aucune implémentation 6F-D démarrée**  
**Date : 2026-08-16**  
**Périmètre :** premium lesson polish, clarté pédagogique, contexte coranique,
mot courant, audio, prononciation guidée, feedback, responsive et micro-détails.

## Méthode

- Relecture des audits et rapports UI/UX globaux, 6F, 6F-B et 6F-C.
- Inspection des composants réels : `LessonPlayer`, `LessonDiscovery`,
  `HikmaLessonFocusHeader`, `HikmaContextDisclosure`,
  `HikmaExerciseShell`, `ExerciseFeedback`, `FeedbackPanel`,
  `HikmaExplanation`, `HikmaReveal`, `HikmaProgress`, `ArabicText` et
  `AudioPlayer`.
- Observation navigateur réelle de `/learn/basmala` et `/design-system` à
  `390×844` et `1280×720`.
- Vérification des contrats ArabicText, phonétique, audio et feedback.

## Verdict

La fondation est solide et la leçon est déjà concentrée : le header de focus,
le mot courant, le sens volontairement révélé, le contexte replié et le
feedback séparé sont présents. Le polish restant concerne surtout le rythme et
la hiérarchie : la découverte enchaîne encore le mot courant et le bloc de
prononciation dans une longue surface verticale ; le contexte secondaire est
présent après cette séquence mais ne possède pas encore une carte arabe et une
carte traduction aussi éditorialement distinctes que le demande la phase ; le
labo design system est très complet mais devient lui-même extrêmement long sur
mobile.

## Scores UX de l’état initial

| Axe | Score | Verdict |
|---|---:|---|
| Navigation | 4/5 | Sortie et étape visibles dans le focus header ; enchaînement de découverte clair. |
| Hiérarchie | 3/5 | Le mot est dominant, mais prononciation, contexte et détails s’empilent dans la même séquence. |
| Cognition | 3/5 | L’effort est protégé, mais la première découverte demande de traiter plusieurs repères à la suite. |
| Pédagogie | 4/5 | La boucle écouter → observer → répéter est correcte et sans diagnostic automatique. |
| Accessibilité | 4/5 | RTL local, labels audio, focus et feedback existent ; les états micro réels restent non observés. |
| Responsive | 3/5 | Aucun overflow observé sur la leçon ; la densité verticale et la longueur du laboratoire restent élevées à 390 px. |
| **Moyenne** | **3,5/5** | **Bonne base pédagogique, finition premium encore à consolider.** |

## Observations navigateur

### `/learn/basmala` à 390×844

Le rendu réel expose : `Quitter la leçon`, `La Basmala`, `Mot 1 sur 4`, le
header `Étape 1 · Découverte`, le mot `بِسْمِ`, sa translittération, les boutons
`Écouter le mot` et `Voir le sens`, puis le bloc `Écouter et produire` avec ses
étapes, avant le contexte coranique replié et `Mot suivant`.

Points positifs : largeur globale 390 px, aucune scrollbar horizontale,
diacritiques visibles, audio nommé, contexte secondaire fermé, sortie de leçon
accessible.

Friction : le mot courant et la prononciation guidée sont encore perçus comme
deux blocs successifs plutôt qu’une seule progression calme ; la hiérarchie
pourrait mieux distinguer `maintenant` de `ensuite`.

### `/learn/basmala` à 1280×720

Le focus header et l’étape de découverte restent identifiables, mais la colonne
de lecture doit rester limitée afin que le contenu ne s’étire pas et que les
cartes de contexte ne redeviennent pas concurrentes.

### `/design-system`

La section `Islamic UX & Pedagogical Feedback` couvre les nouveaux états de
feedback. À 390 px, la section atteint environ 1 521 px de hauteur ; la page
entière est un laboratoire long par nature. Cela ne constitue pas un problème
de la page de leçon, mais la nouvelle section 6F-D devra rester compacte et
réutiliser les primitives plutôt que multiplier les variantes décoratives.

## Problèmes priorisés

### P1 — Hiérarchie et rythme de découverte

- **D-01** — `LessonDiscovery` — le mot courant et la prononciation guidée
  forment une longue séquence verticale ; l’apprenant peut moins facilement
  comprendre l’action immédiate — créer un hero du mot courant et présenter la
  prononciation comme l’étape suivante explicite.
- **D-02** — `LessonPlayer` / `HikmaExerciseShell` — le passage découverte →
  exercice doit garder un CTA primaire unique et une transition plus lisible —
  renforcer le libellé de phase sans modifier l’état métier.

### P1 — Contexte coranique

- **D-03** — `HikmaContextDisclosure` — séparer visuellement arabe, traduction
  et référence dans des surfaces éditoriales distinctes — conserver la donnée
  Quran exacte et le RTL local.

### P2 — Audio et prononciation

- **D-04** — `AudioPlayer` / découverte — les états audio existent mais la
  hiérarchie du libellé et de l’état reste à harmoniser avec le mot courant —
  utiliser exclusivement les états existants, sans simuler une source.
- **D-05** — `PronunciationGuided` — rendre les étapes écouter, observer,
  répéter, comparer plus progressives sans ajouter STT, score ou verdict.

### P2 — Micro-détails et feedback

- **D-06** — feedback / explication — conserver la hiérarchie 6F-C et vérifier
  l’espace entre réponse, disclosure et CTA sur mobile ; aucune duplication ni
  nouvelle explication morphologique.
- **D-07** — surfaces — privilégier des cartes moins imbriquées et des tokens
  existants ; ne pas ajouter de valeurs arbitraires ni d’ornements religieux.

### P3 — Laboratoire et documentation

- **D-08** — `/design-system` et documentation — ajouter les détails premium
  de la leçon comme références compactes, sans transformer le laboratoire en
  second parcours de production.

## Éléments à conserver

- `HikmaLessonFocusHeader` et la sortie explicite de leçon ;
- navigation globale masquée pendant la leçon mobile ;
- découverte mot par mot et sens révélé volontairement ;
- `ArabicText`, Amiri, RTL local et diacritiques intactes ;
- `AudioPlayer` comme unique lecteur ;
- contexte coranique replié et texte source non modifié ;
- `HikmaExerciseShell` et CTA `Continuer` unique ;
- séparation `Ta réponse` / `Réponse attendue` ;
- `HikmaExplanation` fermé par défaut ;
- absence de STT, score acoustique et gamification religieuse.

## Risques de régression

- rendre le contexte visible trop tôt et augmenter la surcharge observée en
  Phase 6F ;
- transformer la prononciation guidée en outil de diagnostic ;
- modifier ou normaliser un caractère coranique ;
- créer plusieurs CTA primaires dans un même état ;
- modifier indirectement `AnswerResult`, grading, scoring, SRS, mastery,
  scheduler, interleaving, curriculum, persistance, audio backend ou DB ;
- augmenter la hauteur mobile au point de repousser l’action essentielle ;
- ajouter des animations de taille/position ou des formulations religieuses
  mécaniques.

## Direction proposée pour le design détaillé

Le polish doit rester une couche de présentation :

1. `HikmaWordHero` ou une composition équivalente, centrée sur le mot actuel ;
2. `HikmaArabicVerseCard` et `HikmaTranslationCard` uniquement si la
   séparation peut être réalisée sans dupliquer le contexte ;
3. progression visuelle discrète de la prononciation guidée ;
4. états audio informatifs, sans nouvelle logique audio ;
5. audit d’espacement avec l’échelle existante `4/8/16/24/32/48` ;
6. section de laboratoire compacte `Premium Lesson Details` ;
7. tests ciblés et validation réelle, en déclarant les scénarios
   authentifiés/micro non observés s’ils restent inaccessibles.

**Aucun fichier métier, générateur, grading, scoring, persistance, DB ou
audio backend n’a été modifié pendant cet audit.**
