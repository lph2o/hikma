# PHASE UI/UX 6D — EXERCISE STATE LIFECYCLE + PEDAGOGICAL VARIETY AUDIT

**Statut : `PHASE_UI_UX_6D_AUDIT_COMPLETE_READY_FOR_APPROVAL`**  
**Mode : audit read-only — aucune implémentation 6D effectuée**  
**Date : 2026-08-16**

## 1. Problème du state

`LessonPlayer` possède `answer` et le remet à `null` dans `continueNext()`. En revanche, le champ texte du rappel libre possède un state indépendant : `RecallExercise` initialise `const [value, setValue] = useState("")`, puis le conserve tant que le même composant React reste monté.

Quand deux exercices successifs sont du même composant `RecallExercise`, `ExerciseCard` reçoit de nouvelles props mais ne remonte pas le composant enfant. Le `value` précédent reste donc visible dans le champ du nouvel exercice.

## 2. Cause racine

Le state local n’est pas attaché à une identité d’exercice. Il est réinitialisé uniquement au montage initial du composant. `LessonPlayer` nettoie son state d’orchestration, mais ne peut pas nettoyer directement le `value` privé de `RecallExercise`.

Le même risque existe pour les states locaux suivants :

| Composant | State local | Risque au changement d’exercice |
|---|---|---|
| `RecallExercise` | `value`, `keyboardOpen` | fuite directe du texte et du clavier |
| `PhoneticDiscriminationExercise` | `showWord` | l’alternative visuelle peut rester ouverte |
| `PronunciationGuided` | `recState`, URL locale, verdict, comparaison | risque si deux exercices de ce type se suivent |
| `AudioPlayer` | status audio | protégé en partie par `key={audioUrl}` sur les usages audio |
| `OptionsExercise` | aucun state de réponse | contrôlé par `LessonPlayer`, reset correct |
| `ContextRecognitionExercise` | aucun state | reset correct via props |

Le feedback n’a pas de state indépendant : il est dérivé de `answer` et `result`, donc il disparaît lorsque `answer` est nettoyé.

## 3. Identité réelle des exercices

`GeneratedExercise` contient `type`, `prompt`, `difficulty`, `options` et `metadata`, mais aucun champ `id`. Les générateurs ne produisent pas d’identifiant stable et `LessonPlayer` utilise actuellement l’index comme position de parcours, pas comme identité.

Le brief demande un reset par `exercise.id`. Cette donnée n’existe donc pas encore dans le contrat UI actuel. Il s’agit d’un `DATA_GAP` de présentation, pas d’un manque de donnée pédagogique.

## 4. Architecture actuelle

```text
LessonPlayer
├── index / answer / result
├── continueNext → setAnswer(null) → index suivant
└── ExerciseCard(exercise=current, answer, result)
    ├── RecallExercise → value local non contrôlé par LessonPlayer
    ├── OptionsExercise → props answer contrôlée
    ├── Audio* → AudioPlayer local, remount par src sur audio
    ├── PhoneticDiscrimination → showWord local
    └── PronunciationGuided → enregistrement local
```

Il n’y a pas de `key` d’identité sur `ExerciseCard` ni de hook de synchronisation sur les composants possédant un state local.

## 5. Correction minimale proposée pour le state

Après approbation, créer une identité UI stable au point où la séquence finale est assemblée, sans modifier les générateurs ni les réponses :

1. ajouter un identifiant de présentation optionnel à chaque exercice final, dérivé de données stables déjà disponibles (`lessonId`, position déterministe, type, mot cible) ;
2. transmettre cette identité au composant d’exercice ;
3. réinitialiser localement `RecallExercise` sur changement d’identité (`value`, clavier, états d’aide) ;
4. réinitialiser `showWord` de la phonétique sur la même identité ;
5. protéger l’audio et la prononciation locale par la même frontière d’exercice, sans remonter `LessonPlayer`.

Alternative plus légère : faire porter une `key` uniquement au sous-arbre `ExerciseCard` avec cette identité. Elle remonterait le composant d’exercice, pas le shell, le player, la progression ou l’audio global. Cette option doit être validée car elle réinitialise automatiquement tous les states locaux et peut affecter le focus.

Recommandation : préférer un reset explicite dans les composants qui possèdent le state, car il rend le cycle de vie visible et limite les remounts ; utiliser une `key` locale seulement comme garde-fou si un state oublié est découvert.

## 6. Retour à un exercice précédent

Le parcours actuel ne permet pas de revenir à l’exercice précédent après `continueNext()` : l’index avance et la réponse est consommée. Le test « retour A » ne doit donc pas être inventé dans cette phase. Il pourra vérifier une future fonctionnalité uniquement si elle est explicitement ajoutée.

## 7. Problème de variété

Le séquenceur connecté `buildCumulativeSequence` parcourt `SKILL_ORDER` par rondes, puis tous les mots de la leçon pour chaque compétence. La page génère ensuite les exercices correspondants et ajoute une exposition phonétique bornée.

Pour `iyyaka-nabudu`, les artefacts de runtime indiquent 8 mots et 50 exercices avant l’ajout phonétique. Le code actuel ajoute jusqu’à 3 discriminations phonétiques réelles, ce qui donne une configuration observée de 53 exercices quand les données sont disponibles.

La séquence est donc organisée en blocs : huit exercices de reconnaissance, huit de forme, huit de rappel FR, huit de production arabe, huit d’audio, huit de contexte, deux de lemme, puis trois de phonétique.

## 8. Distribution et métriques

La matrice détaillée est dans [`tmp/phase6d-state-variety/iyyaka-nabudu-distribution.md`](tmp/phase6d-state-variety/iyyaka-nabudu-distribution.md).

| Indicateur | Résultat |
|---|---:|
| Total | 53 |
| Types distincts générés | 8 |
| Skills distinctes | 7 |
| Plus longue streak d’un type | 8 |
| Transitions identiques | 45/52 = 86,5 % |
| Diversité des types effectivement générés | 8/8 |
| Doublon exact démontré | aucun dans le séquenceur ; non mesurable sans payload runtime complet |

Cette distribution confirme une variété de compétences mais une faible variété locale. La répétition est une conséquence directe du scheduling par rondes, pas d’un tri accidentel dans `ExerciseCard`.

## 9. Pourquoi un type revient autant

- `SKILL_ORDER` impose une progression de reconnaissance vers rappel, production, audio, contexte et lemme ;
- chaque compétence couvre les mots dans leur ordre de leçon ;
- les compétences déjà maîtrisées sont sautées ;
- les générateurs peuvent renvoyer `null` si une donnée réelle manque ;
- les discriminations phonétiques sont bornées à trois et ajoutées séparément ;
- aucun randomiseur d’exercices n’existe et aucune sélection aléatoire n’est nécessaire pour expliquer la séquence.

La répétition est donc pédagogiquement intentionnelle, mais sa mise en scène peut sembler mécanique. Il n’est pas justifié de modifier le nombre total ou le grading sur la base de cet audit seul.

## 10. Audit des doublons

Le type de généré ne contient pas d’`id`, et le payload de séquence n’est pas conservé dans un artefact local complet permettant une comparaison exacte de chaque prompt réel. Le code montre toutefois que chaque ronde combine une compétence et un `wordId`, et que les types sont distincts par compétence ; aucun doublon exact n’est démontré.

Un détecteur de doublons pur pourrait être ajouté plus tard sur la séquence finale (`type + targetWordId + prompt + options`), mais ce n’est pas nécessaire pour corriger le state et ne doit pas devenir une logique de production sans décision.

## 11. Recommandations

### P0 — state lifecycle

- introduire une identité UI stable par exercice final ;
- réinitialiser le state local de rappel libre au changement d’identité ;
- réinitialiser les aides et états locaux de phonétique ;
- vérifier le focus et le statut audio sans remonter le `LessonPlayer`.

### P1 — variété perceptible

Ne pas réordonner immédiatement les exercices. Proposer d’abord une variante de présentation : afficher clairement la compétence/phase dans le shell et regrouper visuellement les rondes, afin que la répétition soit comprise comme une intention pédagogique.

Si l’équipe confirme une vraie fatigue utilisateur après observation navigateur, concevoir ensuite un scheduler déterministe minimal avec contraintes documentées, tests de conservation du nombre et validation pédagogique.

## 12. Impact métier

La correction de state proposée est UI-only. Elle ne change ni les réponses, ni la validation, ni les résultats, ni les Server Actions.

La variété est un sujet de séquençage pédagogique : aucune modification ne doit être appliquée avant une décision explicite, car elle pourrait changer l’ordre d’apprentissage et les timings de maîtrise.

## 13. Fichiers concernés après approbation

Probables :

- `components/learn/exercises/index.tsx` ;
- `components/learn/exercises/pronunciation-exercise.tsx` si l’identité doit être propagée ;
- `components/learn/lesson-player.tsx` ou un helper d’identité UI ;
- `lib/exercises/types.ts` uniquement si un champ d’identité de présentation est validé ;
- tests de cycle de vie et tests de séquence ;
- skill `docs/ui-ux-skills/hikma-lesson-experience/`.

À ne pas modifier sans nouvelle décision : `validateAnswer`, `scoreAnswer`, générateurs de réponses, SRS, mastery, persistance, schéma et données Quran.

## 14. Risques

- une `key` trop haute pourrait réinitialiser audio, focus ou transitions ;
- un identifiant dérivé de l’index seul serait fragile si la séquence change ;
- un scheduler de variété non justifié pourrait casser l’ordre des prérequis ;
- une mesure de variété fondée uniquement sur le type pourrait ignorer la variété réelle des mots et compétences.

## 15. Tests proposés

### State

- saisir une réponse dans l’exercice A, passer à B, vérifier que le champ est vide ;
- vérifier le reset du clavier arabe et de l’aide phonétique ;
- vérifier le reset des options audio et des états de lecture ;
- vérifier que la progression et la persistance restent intactes ;
- ne pas tester un retour A non supporté par le comportement actuel.

### Variété

- reconstruire la séquence de 53 exercices de référence ;
- vérifier le déterminisme, le nombre, les types et les skills ;
- mesurer streaks et transitions sans imposer arbitrairement un seuil ;
- ajouter un test de scheduling uniquement si une correction est approuvée.

## 16. Migration et browser validation

- migration DB : aucune ;
- migration de données : aucune ;
- browser validation : `BROWSER_VALIDATION_PENDING`.

## 17. Décision d’arrêt

L’audit est terminé. Aucune modification de code n’a été effectuée pour 6D. La prochaine étape nécessite l’approbation explicite de la stratégie d’identité UI et une décision séparée sur une éventuelle variété de scheduling.
