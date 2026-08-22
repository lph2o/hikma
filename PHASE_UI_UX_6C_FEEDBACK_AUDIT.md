# PHASE UI/UX 6C — FEEDBACK AUDIT

**Statut : `PHASE_6C_FEEDBACK_AUDIT_COMPLETE_READY_FOR_APPROVAL`**  
**Mode : audit read-only — aucune implémentation 6C effectuée**  
**Date : 2026-08-16**

## 1. Périmètre et protection

Lecture de l’état Git, de `PHASE_UI_UX_5_LESSON_AUDIT.md`, de la matrice d’exercices Phase 5, de la skill `hikma-lesson-experience`, de `LessonPlayer`, `HikmaExerciseShell`, `ExerciseCard`, `ExerciseFeedback`, `OptionsExercise`, des exercices audio, rappel, phonétique et prononciation, de `AudioPlayer`, de `validateAnswer`/`scoreAnswer` et des acoustiques locales.

Le dépôt était déjà fortement modifié et contient de nombreux fichiers non suivis. Ces modifications ont été considérées comme appartenant au projet. Aucun reset, checkout, restauration destructive, fichier métier ou composant applicatif n’a été modifié pendant l’audit.

## 2. Résumé exécutif

La Phase 6B a installé une bonne enveloppe commune, mais le feedback reste réparti entre trois responsabilités :

1. `LessonPlayer` décide quand afficher le résultat et le CTA `Continuer` ;
2. `FeedbackPanel` traduit `AnswerResult` vers `ExerciseFeedback` ;
3. `ExerciseFeedback` porte le verdict, la mascotte, la bonne réponse et l’explication dans une même surface.

Le risque principal de la 6C est de recréer une logique de grading dans un nouveau composant. La bonne direction est un composant de présentation de feedback qui reçoit déjà un état normalisé par l’UI, sans toucher à `AnswerResult`, aux générateurs ou à la persistance.

## 3. Architecture actuelle

```text
LessonPlayer
├── answer / result dérivés de validateAnswer
├── HikmaExerciseShell
│   ├── ExerciseCard → composant spécialisé
│   ├── feedback → FeedbackPanel → ExerciseFeedback
│   └── primaryAction → continueNext
└── PronunciationGuided
    ├── AudioPlayer modèle / enregistrement local
    ├── classifyRecording → NO_SIGNAL | REVIEW_REQUIRED
    └── auto-évaluation humaine
```

`HikmaExerciseShell` est purement visuel et doit le rester. `LessonPlayer` est le seul endroit qui connaît la progression, les résultats, les Server Actions et le passage à l’exercice suivant.

## 4. Contrats à préserver

| Contrat | Constat | Décision 6C |
|---|---|---|
| `validateAnswer` | fournit `correct`, `status`, `correctOption`, `explanation` | afficher, ne jamais recalculer |
| `scoreAnswer` | score binaire dérivé du résultat | aucun affichage ou changement de score |
| `AMBIGUOUS` | verdict distinct du rappel libre | surface et copy distinctes, pas de conversion en incorrect |
| QCM | `option.isCorrect` existe pour le rendu post-réponse | ne modifier ni options ni ordre |
| Audio | `AudioPlayer` gère son cycle local | réutiliser ses états et son coordinator |
| Prononciation | mesures techniques locales | `NO_SIGNAL`/`REVIEW_REQUIRED` restent descriptifs |
| Persistance | `submitting`, `partial`, `failed` dans `LessonPlayer` | ne pas mélanger erreur technique et feedback pédagogique |

## 5. Audit par zone

### 5.1 `ExerciseFeedback`

Forces : `role="status"`, `aria-live="polite"`, trois états, réponse correcte et explication déjà disponibles, variantes textuelles AA.

Points à améliorer :

- la hiérarchie ne sépare pas assez le verdict, ce qu’il faut retenir et l’action suivante ;
- la mascotte prend une place sémantique alors que le feedback doit rester lisible sans elle ;
- `correctContent` et `explanation` sont présentés dans le même flux sans sous-structure explicite ;
- le titre actuel `Tu étais proche` est chaleureux mais ne nomme pas assez clairement l’incertitude.

Direction : renforcer la composition visuelle interne uniquement, conserver l’API de résultat et garder le CTA dans le shell.

### 5.2 `FeedbackPanel`

Forces : adaptation centralisée de `AnswerResult`, aucune logique métier ajoutée.

Points à améliorer :

- `success` est une traduction de présentation acceptable, mais le futur composant ne doit pas dupliquer cette dérivation ailleurs ;
- la correction arabe doit continuer à passer par `ArabicText` plutôt que par un texte générique.

Direction : conserver ce point d’adaptation, éventuellement lui faire fournir un composant de présentation plus structuré.

### 5.3 `OptionsExercise`

Forces : options désactivées après réponse, bonne réponse visible seulement après résultat, cibles tactiles `min-h-12`, rôles radio.

Risques :

- après réponse, la bonne et la mauvaise option sont stylées dans la grille tandis que le feedback est sous la grille ; la relation visuelle peut être trop dense ;
- `result` est déjà calculé par `LessonPlayer`, donc aucune logique supplémentaire ne doit être ajoutée ici.

Direction : améliorer sélection/focus/lecture post-réponse en présentation uniquement.

### 5.4 Rappel libre

Forces : effort avant révélation, grading serveur/moteur inchangé, langue et direction adaptées, clavier arabe existant.

Risques : la correction locale dans la carte (`La réponse`) peut concurrencer le feedback séparé du shell ; le CTA de soumission et le CTA de continuation ont des rôles différents mais doivent être visuellement cohérents.

Direction : garder la révélation post-soumission, la rendre clairement identifiée comme correction, sans ajouter de validation client.

### 5.5 Audio

Forces : `AudioPlayer` fournit `idle`, `loading`, `playing`, `paused`, `ended`, `error`, rejoue/réessaie et coordonne un seul audio actif.

Risques : les exercices audio rendent parfois le prompt juste après le lecteur sans libellé explicite `Écoute`/`Choisis`; l’audio manquant est un cas de génération, pas un état à fabriquer dans le feedback.

Direction : composition audio plus centrale et statut proche du lecteur, sans nouveau système audio.

### 5.6 `PHONETIC_DISCRIMINATION`

Forces : audio réel, distracteurs inchangés, alternative visuelle `Afficher le mot`, explication du trait fournie par le moteur.

Risques : l’explication du trait arrive dans le feedback générique ; elle gagnerait à être typographiquement distinguée comme `À retenir`, sans inventer de règle.

Direction : mise en forme ciblée de l’explication existante et séparation `Ce que tu écoutes` / `Ce que tu identifies` si possible sans modifier le prompt moteur.

### 5.7 `PRONUNCIATION_GUIDED`

Forces : aucun STT, aucun upload, aucune note de prononciation, micro demandé au clic, audio local réécoutable, `NO_SIGNAL`/`REVIEW_REQUIRED` bornés.

Risques : `NO_SIGNAL` est aujourd’hui rendu via une note descriptive ; l’état pourrait être confondu avec un feedback d’exercice noté si on le branche dans `ExerciseFeedback`. Le refus micro et l’absence de support sont distincts dans le code mais proches visuellement.

Direction : conserver un feedback technique dédié à la production, avec copy neutre et CTA `Réessayer`, jamais `Correct`/`Incorrect`.

## 6. Matrice de feedback UX

| Situation | Source | Copy recommandée | Action | Interdit |
|---|---|---|---|---|
| correct | `result.correct` | `Correct` / `Bien retrouvé` + explication existante | Continuer | score ou récompense inventée |
| incorrect | `result.correct=false`, hors ambigu | `Pas encore` + correction + explication | Continuer | `FAUX !`, nouvelle note |
| ambiguous | `result.status=AMBIGUOUS` | `À vérifier` / `Réponse proche` + explication moteur | Continuer | le convertir en erreur |
| no signal | acoustique locale | `Aucun signal détecté` + message descriptif | Réessayer | verdict de prononciation |
| review required | acoustique locale | `Réécoute-toi et compare` | Réessayer / C’est bon | score automatique |
| micro denied | `micDenied` | `Le microphone n’est pas disponible` | Réessayer plus tard / continuer sans enregistrer | bloquer la leçon |
| audio loading | `AudioPlayer` | `Chargement…` | attendre | erreur rouge |
| audio error | `AudioPlayer` | `Impossible de lire l’audio` | Réessayer | simuler une réponse |
| saving | `LessonPlayer` | `Enregistrement de ta progression…` | attendre | perte annoncée |
| partial | Server Action | `Synchronisation en attente` | Réessayer | recommencer la leçon |

## 7. Architecture recommandée après approbation

### Option recommandée — renforcer les primitives existantes

- faire évoluer `ExerciseFeedback` vers une structure `verdict → correction → à retenir` ;
- conserver `FeedbackPanel` comme adaptateur unique de `AnswerResult` ;
- ajouter une petite primitive visuelle dédiée aux états acoustiques de prononciation uniquement si nécessaire ;
- garder `HikmaExerciseShell` propriétaire du CTA et de la zone feedback.

Avantage : peu de surface de régression, API métier intacte, cohérence avec 6B.

### Option alternative — créer `HikmaExerciseFeedback`

Créer une nouvelle primitive complète et déprécier `ExerciseFeedback`.

Trade-off : séparation plus nette, mais duplication et migration inutile pour une phase UI limitée.

### Option refusée — normaliser les états dans le moteur

Ajouter `NO_SIGNAL`, `REVIEW_REQUIRED`, `LOADING` ou `RETRY` à `AnswerResult`.

Refus : cela mélangerait feedback pédagogique, transport audio, acoustique et persistance ; ce serait une modification de contrat métier hors périmètre.

## 8. Points de décision

1. Valider l’option recommandée : renforcer `ExerciseFeedback` et garder `FeedbackPanel` comme unique adaptateur.
2. Confirmer que `NO_SIGNAL`/`REVIEW_REQUIRED` restent confinés à `PronunciationGuided` et ne deviennent pas des résultats d’exercice noté.
3. Confirmer qu’il n’y aura pas de bouton `Réessayer` pour une réponse incorrecte, puisque le contrat actuel avance avec `Continuer` et ne prévoit pas de re-soumission.

## 9. Laboratoire prévu

Ajouter dans `/design-system` une section `Exercise Feedback` montrant : correct, incorrect, ambiguous, no signal, review required, loading, disabled, correction arabe, correction audio et une variante mobile. Les données seront explicitement de démonstration visuelle, sans moteur ni persistance.

## 10. Skill à mettre à jour

Mettre à jour `docs/ui-ux-skills/hikma-lesson-experience/` avec : hiérarchie, microcopy, distinction feedback technique/pédagogique, `aria-live`, focus, responsive, arabe et anti-patterns. Aucun nouveau skill séparé n’est nécessaire à ce stade : le périmètre reste une extension directe de l’expérience de leçon.

## 11. Risques et DATA_GAP

- Aucun état `RETRY` n’existe comme contrat métier pour une réponse incorrecte ; ne pas inventer une seconde tentative dans cette phase.
- Aucun contenu supplémentaire d’explication phonétique ne doit être créé ; seul `metadata.phoneticTrait.explanation` peut être affiché.
- Le focus après réponse n’est pas actuellement géré par une ref dédiée ; une amélioration accessible nécessitera un focus sur la zone feedback ou le CTA, sans modifier la progression.
- Validation navigateur non réalisée pendant cet audit : `BROWSER_VALIDATION_PENDING`.

## 12. Décision d’arrêt

L’audit est terminé. Aucune implémentation 6C n’a commencé. La prochaine action nécessite l’approbation de l’architecture recommandée et des trois points de décision ci-dessus.
