# Hikma — Phase 5 — Lesson Experience Audit

**Statut : `PHASE_5_LESSON_AUDIT_COMPLETE_READY_FOR_APPROVAL`**  
**Mode : audit read-only**  
**Date : 2026-08-16**

## 1. Périmètre et protection

L’audit couvre :

- `app/(app)/learn/[slug]/page.tsx` ;
- `components/learn/lesson-player.tsx` ;
- découverte, exercices, feedback, prononciation, audio et fin de leçon ;
- `components/ui/exercise.tsx`, `audio-player.tsx`, `arabic-text.tsx` ;
- `lib/exercises`, `lib/learning`, `lib/pronunciation` ;
- phases UI/UX précédentes et skills existants.

Aucun fichier applicatif n’a été modifié pendant cet audit. Aucun backend, moteur pédagogique, grading, SRS, mastery, curriculum, audio, phonétique ou contrat de persistance n’est ciblé par une modification.

## 2. Verdict exécutif

La base métier et pédagogique est exceptionnellement riche et plutôt bien protégée. `LessonPlayer` orchestre déjà la boucle `découverte → exercice → réponse → validation → feedback → suivant → fin`, conserve la reprise de session, traite les erreurs partielles de persistance et distingue l’auto-évaluation des exercices notés.

Le problème principal est la **mise en scène de cette richesse** : la phase découverte, le header de session, le feedback et la fin de leçon partagent encore une composition de carte générique. L’utilisateur doit comprendre l’étape à partir de la structure technique au lieu de la lire immédiatement.

### Score d’audit

| Axe | Score | Constat |
|---|---:|---|
| Intention / orientation | 3/5 | La phase existe dans le code, mais n’est pas toujours exprimée comme un objectif humain. |
| Pédagogie | 4/5 | Bonne protection de l’effort de rappel et distinction auto-évaluation/noté. |
| Hiérarchie visuelle | 2.5/5 | Header, contenu, feedback et CTA sont proches dans le même poids visuel. |
| Audio / prononciation | 3.5/5 | Contrats solides et audio coordonné ; états à rendre plus centraux dans la découverte. |
| Responsive / mobile | 2.8/5 | Les cibles sont bonnes, mais le header et les cartes consomment beaucoup d’espace. |
| Accessibilité | 3.2/5 | ARIA et focus présents ; annonces, états et séparation des zones à renforcer. |
| Fin de leçon | 2.8/5 | Les chiffres sont réels, mais la synthèse reste une carte statistique standard. |
| **Global** | **3.3/5** | **Moteur solide, expérience à transformer en parcours pédagogique premium.** |

## 3. Architecture actuelle

```text
LessonPage (Server Component)
├── getLessonWithWords
├── buildWordBank + traductions validées
├── getWordAudioState
├── generate exercises / cumulative sequence / phonétique
├── contexte verset réel
├── nextLesson + pathProgress
├── getLessonSession
└── LessonPlayer (Client Component)
    ├── discovery
    │   ├── PronunciationGuided Q1
    │   ├── liste des mots
    │   └── CTA Commencer les exercices
    ├── playing
    │   ├── ExerciseCard
    │   ├── auto-évaluation éventuelle
    │   ├── FeedbackPanel après réponse
    │   └── CTA Continuer
    ├── submitting
    ├── error
    └── complete → LessonComplete
```

## 4. Contrats à préserver

| Contrat | Observation | Décision UX |
|---|---|---|
| Séquence d’exercices | Générée côté serveur selon maîtrise/données | Ne pas réordonner ni recalculer côté UI. |
| Validation | `validateAnswer` fournit correct, ambigu, réponse et explication | Réorganiser l’affichage seulement après soumission. |
| Auto-évaluation | `WORD_RECOGNITION` et `PRONUNCIATION_GUIDED` ne modifient pas la maîtrise | Affichage distinct, aucune note ajoutée. |
| Persistance | autosave après exercice, reprise déterministe | Conserver les transitions et textes de sauvegarde. |
| Soumission finale | résultats, activité, skills, nettoyage de session, retry partiel | Ne pas fusionner ni déplacer ces écritures. |
| Audio | AudioPlayer + audio coordinator, un actif à la fois | Améliorer la présentation sans remplacer le coordinator. |
| Prononciation | MediaRecorder local, mesures descriptives, auto-évaluation humaine | Ne pas créer STT, score ou upload. |
| Arabic | `ArabicText`, Amiri, diacritiques intactes | Centraliser les niveaux sans modifier le contenu. |

## 5. Parcours actuel et problèmes

### Entrée de leçon

La page affiche titre, nombre de mots, difficulté technique, exercices, objectif, contexte du verset et état audio avant la session. C’est complet mais trop dense. La difficulté `/5` est une information de moteur, pas une intention pédagogique.

**P1 :** transformer l’entrée en introduction calme : objectif humain, contexte sacré, durée/charge seulement si fiable, puis entrée dans la découverte.

### Découverte

La découverte respecte l’ordre pédagogique et propose la prononciation guidée avant les exercices notés. En revanche, elle rend systématiquement visibles arabe, translittération et sens dans une pile de cartes ; le sens n’est donc pas une révélation volontaire. Le lecteur audio n’est pas présent directement sur chaque mot dans le rendu de `LessonPlayer`.

**P0 :** hiérarchie par mot `arabe → écouter → révéler le sens → fiche`, sans révéler prématurément le sens.  
**P1 :** liste compacte et navigation de découverte, avec état audio par mot.

### Exercices

`ExerciseCard` délègue correctement les layouts aux types : choix, audio, contexte, mot à compléter, texte libre, phonétique, prononciation. Le header affiche `Exercice X sur Y`, une barre et un bouton quitter. La carte contient ensuite question, réponse, éventuelle auto-évaluation et feedback.

**P0 :** séparer visuellement objectif, contenu, aide, feedback et navigation.  
**P1 :** ajouter un libellé humain de compétence sans exposer le nom technique du type d’exercice.  
**P1 :** rendre le footer d’action plus stable sur mobile.

### Feedback

`ExerciseFeedback` distingue `correct`, `incorrect`, `ambiguous`, fournit une réponse correcte et une explication. La mascotte et le message sont chaleureux, mais la réponse, l’explication et l’action sont encore assemblées dans une zone visuelle dense.

**P1 :** feedback en deux temps lisibles : verdict calme puis ce qu’il faut retenir ; CTA séparé.  
**P2 :** limiter la présence de la mascotte à un rôle de renforcement, pas de contenu principal.

### Prononciation

Le contrat Q1/Q3 est très bon : permission micro uniquement au clic, enregistrement local, audio modèle, réécoute, mesures acoustiques descriptives, verdict borné et auto-évaluation humaine. L’expérience est fonctionnelle mais dense : modèle, marques phonétiques, conseils, micro, mesures et checklist se succèdent dans une seule carte.

**P1 :** expliciter les étapes `Écoute → Observe → Répète → Compare → Décide`.  
**P1 :** rendre la confidentialité « Ton enregistrement reste sur ton appareil » plus visible.  
**P2 :** distinguer absence de micro, permission refusée et enregistrement terminé sans les confondre.

### Fin de leçon

`LessonComplete` utilise des chiffres réels : exercices, précision, mots étudiés, progression du parcours. Il propose prochaine leçon, révision et retour parcours. La hiérarchie reste toutefois celle d’une carte statistique, avec emoji décoratif et trois CTA quasi équivalents.

**P1 :** faire de la fin un moment de synthèse : ce qui a été travaillé, prochaine action primaire, révision secondaire.  
**P2 :** supprimer l’emoji décoratif et réduire la mascotte à une présence sobre.

## 6. Matrice des états

| Zone | États existants | Risque UX | Direction recommandée |
|---|---|---|---|
| Entrée | ready, not found, unpublished, audio registered/zero | trop d’informations préalables | introduction à intention unique |
| Découverte | mots, no words, guided pronunciation | sens visible trop tôt, audio peu local | WordCard/reveal/audio par mot |
| Session | playing, answer empty, answer selected | CTA désactivé peu informatif | consigne + action primaire claire |
| Réponse | correct, incorrect, ambiguous, self-assessment | feedback dans la même masse visuelle | feedback révélé après effort |
| Audio | idle, loading, playing, paused, ended, error | état pas toujours localisé au mot | état accessible et local |
| Micro | idle, requesting, recording, recorded, denied, unavailable | étapes nombreuses | séquence guidée et copy confidentialité |
| Persistance | submitting, success, partial, failed | perte perçue possible | conserver retry partiel et expliquer sans technique |
| Sortie | complete, next lesson, review, path | CTA concurrents | une prochaine action primaire |

## 7. Matrice des types d’exercices

| Type | Layout actuel | Données principales | Risque / recommandation |
|---|---|---|---|
| Multiple choice | question + options | arabe/sens/options | garder options tactiles, séparer prompt et feedback |
| Translation / reverse | options | arabe ou traduction | hiérarchie arabe/français explicite |
| Recall | texte libre | `freeText`, langue | effort avant réponse, indice gradué |
| Complete word | input/option | forme arabe | préserver diacritiques et clavier |
| Audio to word | AudioPlayer + options | audio réel | rendre écoute et replay primaires |
| Word to audio | mot + audio | audio réel | expliquer ce qui est reconnu |
| Context recognition | verset/contexte | ayah réel | contexte sous question, pas réponse gratuite |
| Lemma relation | options/frères | relation réelle | copy humaine, aucun jargon lemme |
| Phonetic discrimination | audio + marque | caractéristique réelle | feedback après effort, pas d’indice prématuré |
| Word recognition | auto-évaluation | mot | distinct du noté, aucune maîtrise modifiée |
| Pronunciation guided | Q1/Q3 local | audio, marks, hints | séquencer écoute/observe/répète/compare |

## 8. Priorités

### P0

- Découverte : cacher le sens derrière une révélation volontaire et rendre l’audio local au mot.
- LessonPlayer : établir une hiérarchie stable objectif → contenu → aide → feedback → navigation.
- Mobile : garantir que l’action principale reste atteignable sans remonter après chaque réponse.

### P1

- Header de leçon et phases explicites.
- Compétence expliquée en verbe humain.
- Audio et prononciation guidée premium sans changer leurs contrats.
- Fin de leçon avec action primaire unique.
- États saving/partial/error lisibles et non techniques.

### P2

- Réduction de la densité des mascottes et badges.
- Harmonisation des textes et tailles avec Phase 1.
- Suppression des valeurs en dur restantes dans les composants de leçon.

### P3

- Micro-interactions de transition et polish visuel.
- Captures de référence et QA de toutes les largeurs.

## 9. Plan d’implémentation recommandé après approbation

1. Lesson shell : header de focus, phases, progression et sortie.
2. Discovery : WordCard, audio local, reveal volontaire, verset contextuel.
3. Exercise frame : objectif, consigne, contenu, aide, action.
4. Layouts par type sans changer les générateurs.
5. Audio : états et accessibilité.
6. Prononciation : étapes, confidentialité, micro states.
7. Feedback : verdict, réponse, explication, continuer.
8. Completion : synthèse, prochaine action, révision.
9. Responsive/accessibility.
10. Browser validation et polish.

## 10. DATA / PERFORMANCE GAP

- Les exercices disponibles sont connus via la séquence générée, mais aucune durée estimée fiable n’est fournie : ne pas l’afficher.
- L’audio enregistré et l’audio signé sont distingués côté serveur ; l’UI ne doit pas confondre échec de signature et absence de donnée.
- La progression d’une session en cours n’est pas fournie comme pourcentage métier : utiliser l’index d’exercice existant uniquement pour la progression de session.
- Les prérequis pédagogiques détaillés et les dates de maîtrise ne sont pas nécessaires à cette phase et ne doivent pas être ajoutés.

## Conclusion

Le moteur de leçon ne doit pas être remplacé. La Phase 5 doit révéler visuellement la logique déjà existante : une étape à la fois, l’arabe au centre, l’écoute comme action réelle, l’effort avant la réponse, le feedback après l’effort et une sortie qui donne envie de continuer calmement.

**Statut : `PHASE_5_LESSON_AUDIT_COMPLETE_READY_FOR_APPROVAL`**
