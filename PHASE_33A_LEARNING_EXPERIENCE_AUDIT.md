# PHASE 33A — AUDIT COMPLET DE L’EXPÉRIENCE D’APPRENTISSAGE

## Statut

`PHASE_33A_READ_ONLY_AUDIT_COMPLETE`

Audit réalisé en lecture seule à partir du code réel du dépôt, des tests existants et des contrats documentés. Aucun fichier produit, composant métier, moteur pédagogique, migration ou donnée Supabase n’a été modifié. Aucun commit n’a été créé.

## 1. Executive Summary

La promesse « Comprends le Coran, mot par mot » est réellement portée par l’architecture actuelle : l’utilisateur entre dans une leçon publiée, découvre les mots dans un ordre déterministe, révèle leur sens, peut écouter le mot, puis traverse une séquence de reconnaissance, rappel, audio, contexte et relation lexicale avant persistance de la progression et création des éléments de révision.

Le moteur est plus mature que l’expérience perçue à l’écran. Les principaux risques sont :

- une hiérarchie de progression répétée plusieurs fois dans les exercices ;
- le contexte coranique accessible mais séparé du mot et fermé par défaut ;
- un feedback incorrect potentiellement dense, avec plusieurs couches simultanées ;
- une fin de leçon fonctionnelle mais peu ritualisée ;
- une duplication de mascotte dans l’état d’erreur du lecteur de révision ;
- un modèle de grading volontairement binaire pour le français, sans état `PARTIALLY_CORRECT` distinct.

Aucun problème P0 bloquant n’a été identifié dans l’architecture ou les contrats de progression. Les priorités sont P1 pour la clarté pédagogique et P2 pour le polish.

## 2. Architecture actuelle

### Entrée et résolution

Après l’onboarding, la destination est dérivée de `selected.firstLessonSlug`, lui-même issu du catalogue réel. La route `/learn/[slug]` :

1. résout le slug avec `getLessonWithWords` ;
2. refuse une leçon non publiée ;
3. charge les traductions françaises validées et les replis explicitement signalés ;
4. construit le word bank dans l’ordre réel des `lesson_words` ;
5. charge les contextes d’ayah, relations de lemme, preuves linguistiques et URLs audio signées ;
6. génère la séquence d’exercices selon l’état utilisateur ;
7. applique l’interleaving ;
8. restaure une session persistante si elle existe ;
9. rend `LessonPlayer`.

### Leçon et état local

`LessonPlayer` orchestre les phases :

```text
discovery → playing → submitting → complete
                         ↘ error
```

État local observé : index, réponse courante, résultats par mot, tentatives de compétence, erreur, session de reprise, mots déjà persistés et activité déjà enregistrée.

### Persistance

- La session est sauvegardée après chaque exercice pour permettre la reprise.
- Les résultats pédagogiques sont persistés avant l’activité quotidienne.
- Les écritures de progression sont rejouées mot par mot avec protection contre les doubles soumissions.
- Les tentatives de compétence sont additives et best-effort.
- La session est nettoyée après une complétion réussie.
- La fin de leçon n’attend pas les écritures secondaires de compétence pour afficher la complétion.

## 3. Parcours utilisateur réel cartographié

```text
/learn/[slug]
  → LessonPage
  → LessonPlayer
  → LessonDiscovery, un mot à la fois
  → sens via HikmaReveal
  → écoute/audio réel si disponible
  → prononciation guidée du premier mot si générée
  → contexte coranique via disclosure
  → exercices générés et interleavés
  → réponse
  → validateAnswer
  → feedback
  → Continuer
  → soumission pédagogique
  → fin de leçon
  → leçon suivante, révision ou parcours
```

La première leçon n’est pas codée en dur dans `LessonPlayer`. Le slug et la prochaine leçon proviennent du curriculum et du catalogue chargés.

## 4. Audit du premier écran de leçon

Le premier écran identifie la leçon dans `HikmaLessonFocusHeader`, affiche le titre, un objectif éventuel, une progression « Mot X sur Y », puis un mot arabe centré dans une carte dédiée.

Points positifs :

- entrée focalisée, sans chrome applicatif lourd ;
- mot arabe dominant et composant `ArabicText` dédié ;
- audio présenté avec un lecteur Hikma quand une URL réelle existe ;
- sens masqué volontairement derrière `Voir le sens` ;
- CTA sticky `Mot suivant` sur mobile ;
- sortie explicite avec sauvegarde de session pour un utilisateur connecté.

Point de vigilance : le même repère de position apparaît dans le header et dans `HikmaProgress`. Ce n’est pas bloquant, mais peut donner une impression de répétition dès le premier écran.

## 5. Audit de la découverte du mot

La hiérarchie réelle est :

```text
forme arabe → translittération → audio éventuel → sens révélé → prononciation guidée éventuelle
```

Le sens n’est pas divulgué automatiquement, ce qui protège l’effort de rappel ultérieur. L’utilisateur peut le révéler avant de passer au mot suivant. Un mot sans traduction française validée conserve un fallback explicitement signalé.

Le contexte coranique n’est pas dans la carte du mot : il est placé plus bas dans `HikmaContextDisclosure`, fermé par défaut, avec arabe de l’ayah puis traduction française. L’information existe, mais le lien pédagogique « ce mot → ce verset » est moins immédiat que le lien « ce mot → son sens ».

## 6. Audit du contexte coranique

Le contexte utilise les données réelles `LessonAyahContext` : sourate, numéro d’ayah, arabe et traduction française si disponible. La direction RTL est portée par `ArabicText` et la traduction reste séparée.

Constats :

- aucune donnée inventée ;
- séparation claire entre texte arabe et traduction ;
- disclosure volontaire pour ne pas surcharger la découverte ;
- pas de mise en évidence explicite du mot ciblé dans l’ayah ;
- le contexte est consultable mais ne constitue pas encore un moment narratif central de la découverte.

## 7. Matrice des exercices

| Exercice | Objectif | Donnée principale | Feedback | Grading | Progression / SRS |
|---|---|---|---|---|---|
| `WORD_TO_TRANSLATION` | reconnaître le sens depuis la forme | arabe + options françaises | QCM + bonne réponse | binaire | `meaning_recognition` |
| `TRANSLATION_TO_WORD` | reconnaître la forme depuis le sens | sens + options arabes | QCM + bonne réponse | binaire | `form_recognition` |
| `REVERSE_TRANSLATION` | retrouver la forme sans indice additionnel | sens + options arabes | QCM + bonne réponse | binaire | `form_recognition` |
| `MULTIPLE_CHOICE` | reconnaître la translittération/prononciation | forme + options | QCM + bonne réponse | binaire | `form_recognition` |
| `COMPLETE_WORD` | compléter le sens | forme + options | QCM + bonne réponse | binaire | `meaning_recognition` |
| `FORM_TO_MEANING` | rappeler librement le sens | forme + champ français | révélation + explication | tri-state libre | `form_to_meaning` |
| `MEANING_TO_FORM` | produire librement la forme arabe | sens + champ arabe | révélation + explication | tri-state libre | `meaning_to_form` |
| `AUDIO_TO_WORD` | identifier le mot à l’écoute | audio réel + options | QCM | binaire | `audio_recognition` |
| `WORD_TO_AUDIO` | lire puis comparer à l’écoute | arabe + audio + auto-évaluation | état d’auto-évaluation | auto-évaluation | `audio_recognition` |
| `CONTEXT_RECOGNITION` | comprendre le sens dans l’ayah | contexte arabe/FR + options | QCM + explication | binaire | `context_recognition` |
| `LEMMA_RELATION` | relier des formes d’un même lemme | relation réelle + options | feedback + explication | binaire | `lemma_relation` |
| `WORD_RECOGNITION` | auto-évaluer une reconnaissance | mot + sens + Oui/Pas encore | auto-évaluation non notée | non noté | aucune compétence directe |
| `PRONUNCIATION_GUIDED` | écouter, répéter, comparer | audio réel + repères phonétiques | auto-évaluation non notée | non noté | aucune compétence directe |
| `PHONETIC_DISCRIMINATION` | distinguer un trait phonétique à l’écoute | audio + options + alternative visuelle | QCM + repère phonétique | binaire | `audio_recognition` |

Pour un utilisateur connecté, la séquence cumulative ordonne les compétences : reconnaissance, rappel, audio, contexte, lemme, avec saut des compétences déjà maîtrisées et réactivation par rétention pour les compétences de rappel. La séquence est ensuite interleavée. Pour un visiteur, le chemin par défaut utilise `DEFAULT_LESSON_EXERCISE_TYPES`.

## 8. Audit du grading et des réponses libres

Le grading est une source unique de vérité via `validateAnswer` → `gradeFreeResponse` → progression, mastery et rétention.

### Français

La normalisation gère :

- casse ;
- accents ;
- espaces multiples ;
- ponctuation ;
- apostrophes ;
- séparateurs `/`, `·`, `|`, `,` ;
- ordre indépendant des unités synonymiques ;
- variantes éditoriales explicitement présentes.

Exemple confirmé par les tests : `maitre / souverain` et `souverain / maître` sont acceptés pour une glose validée correspondante.

Une réponse partielle comme `souverain` est actuellement classée `CORRECT` si cette forme figure dans les variantes acceptées. Le moteur ne produit pas un état distinct `PARTIALLY_CORRECT`.

Une réponse sémantiquement différente comme `roi` est `INCORRECT`. Le moteur ne fait pas de fuzzy matching et n’accepte pas un synonyme non validé.

### Arabe

La normalisation conserve les lettres et vocalisations utiles, accepte certaines variantes de wasla/alef suscrit, accepte la forme clavier non vocalisée et renvoie `AMBIGUOUS` lorsqu’une vocalisation différente peut désigner un homographe.

### Écart pédagogique documenté

Le tri-state actuel est :

```text
CORRECT / INCORRECT / AMBIGUOUS
```

Il n’existe pas de `PARTIALLY_CORRECT` indépendant. C’est un choix de contrat actuel, couvert par les tests, et non une anomalie à corriger dans cette phase.

## 9. Audit du feedback

Le feedback distingue :

- réussite ordinaire ;
- réussite significative ;
- réponse incorrecte ;
- réponse ambiguë.

Après une réponse, l’interface peut afficher simultanément : statut, réponse utilisateur, réponse attendue, explication courte, rappel pédagogique, audio et `HikmaExplanation`.

Points positifs :

- l’erreur n’est pas punitive ;
- la bonne réponse reste visible ;
- l’approfondissement est disponible après une réponse correcte ou incorrecte ;
- les explications utilisent les données réellement disponibles ;
- le langage islamique est contextualisé pour les moments significatifs.

Point P1/P2 : dans les réponses incorrectes riches, la combinaison « statut + deux cartes + explication + rappel + HikmaExplanation ouverte par défaut » peut dépasser la hiérarchie d’une lecture mobile confortable. La pédagogie est présente, mais la priorité visuelle entre correction immédiate et approfondissement n’est pas toujours assez nette.

## 10. Audit de la progression dans la leçon

La position est affichée sous plusieurs formes :

- header `Exercice X sur Y` ;
- `HikmaExerciseShell` avec le même compteur ;
- barre `HikmaProgress` ;
- étape pédagogique (`Ce que tu apprends`).

La donnée est utile, mais la répétition peut augmenter la charge cognitive et donner une impression de formulaire long. La progression est néanmoins réelle, déterministe et sauvegardée.

## 11. Audit de la charge cognitive

### Découverte

Densité modérée : mot, translittération, audio, sens révélable, prononciation guidée éventuelle, contexte séparé. Le CTA sticky aide le mobile, mais le premier mot peut devenir dense lorsque audio, révélation et prononciation sont tous disponibles.

### Exercices

Le shell ajoute une couche pédagogique au composant spécialisé. Cela clarifie l’objectif, mais ajoute parfois : header, compteur, progression, titre de compétence, interaction, feedback et CTA dans un même écran.

### Fin de leçon

La carte reste lisible et propose immédiatement plusieurs actions hiérarchisées.

## 12. Audit de la fin de leçon

`LessonComplete` affiche :

- mascotte ;
- message « Leçon terminée » ;
- titre de la leçon ;
- nombre d’exercices ;
- précision ;
- mots étudiés ;
- progression du parcours ;
- prochaine leçon si disponible ;
- révision ;
- retour au parcours.

La prochaine action est explicite. Il n’y a pas de dead-end.

Écart P2 : la fin de leçon ne dispose pas d’une célébration animée dédiée comparable à celle de l’onboarding. Elle est chaleureuse mais relativement statique. Le message islamique est présent à chaque fin de leçon, ce qui est cohérent avec un jalon pédagogique mais devra rester surveillé contre la répétition mécanique.

## 13. Dashboard après apprentissage

Le dashboard calcule réellement :

- leçon à reprendre ;
- prochaine étape curriculum ;
- progression du parcours ;
- révisions dues et prochaines révisions ;
- objectif quotidien dérivé de l’activité ;
- recommandation de sourate.

La hiérarchie observée privilégie une leçon à reprendre ou une prochaine étape avant la découverte. Les révisions dues disposent d’une carte et d’un CTA séparés. La personnalisation ne remplace pas la progression réelle.

## 14. SRS et mastery

Les concepts techniques restent derrière les moteurs. La soumission d’une leçon rejoue les tentatives vers :

```text
réponse → progression mot → ReviewEngine/SRS → mastery/skill progress → activité
```

Le dashboard expose des formulations utilisateur (« Réviser », « progression », « mots »), pas les termes scheduler, intervalle ou ease. La couche de maîtrise par compétence est additive et non bloquante pour l’achèvement d’une leçon.

## 15. Audio

L’audio de mot utilise des URLs signées réellement chargées côté serveur. Il est présent dans :

- découverte du mot ;
- exercices `AUDIO_TO_WORD` et `WORD_TO_AUDIO` ;
- prononciation guidée ;
- explications lorsque l’URL existe.

Si aucun audio n’est enregistré, l’interface l’indique et laisse les autres étapes accessibles. Aucun fichier audio public fictif n’est utilisé.

Limite actuelle : l’audit du code ne montre pas de lecteur audio dédié à l’ayah dans le contexte coranique. Recommandation future uniquement, sans implémentation dans 33A.

## 16. Responsive, RTL et accessibilité

### Points favorables observés dans le code

- CTA sticky mobile dans la découverte ;
- zones tactiles d’au moins 44–48 px dans les principaux boutons ;
- `ArabicText` dédié pour l’arabe ;
- champs de rappel avec `dir="rtl"` pour l’arabe ;
- clavier arabe existant ;
- radiogroup/`aria-checked` sur les choix ;
- focus visible fourni par les primitives Button ;
- alternative visuelle pour la discrimination phonétique audio ;
- `prefers-reduced-motion` global et pour les confettis.

### Limitation

Une validation navigateur réelle à `390×844`, `375×812` et `1280×720` n’a pas été possible dans l’environnement courant. Les risques à revalider sont le clavier arabe, le feedback long, le CTA sticky et l’affichage arabe/translittération/traduction.

## 17. Design System Hikma

L’expérience d’apprentissage utilise les primitives et tokens Hikma : cartes, boutons, Progress, `ArabicText`, mascottes, teal structurel, surfaces chaudes et accents dorés. Le feedback fonctionnel conserve des couleurs sémantiques distinctes du doré.

L’alignement avec l’onboarding est bon. La leçon est toutefois plus dense et plus technique visuellement : le shell d’exercice et les couches de feedback créent une impression plus « outil d’apprentissage » que l’entrée onboarding premium.

## 18. Mascotte et personnalité

La mascotte accompagne :

- la découverte guidée ;
- l’auto-évaluation ;
- les erreurs de persistance ;
- la fin de leçon ;
- la fin de révision.

Elle est fonctionnelle dans les moments de transition et de réussite. Anomalie repérée : `ReviewPlayer` rend deux fois la mascotte `welcome` dans son état d’erreur. C’est un défaut visuel concret, classé P2, à corriger dans une phase d’implémentation ultérieure.

## 19. Microcopy

Le ton est généralement chaleureux et pédagogique : « À ton rythme », « Mot suivant », « Comprendre dans le verset », « Réviser mes mots ».

Points à surveiller :

- « Exercice X sur Y » apparaît plusieurs fois ;
- « À toi de jouer » est plus ludique que le reste du ton Hikma mais reste acceptable ;
- « Auto-évaluation enregistrée » est exact mais technique ;
- « Précision » sur la fin de leçon peut être utile, mais mérite une explication future si elle devient centrale ;
- le message « Leçon terminée » est répété avec la mascotte et le titre.

## 20. Aha Moment

L’architecture contient les éléments du moment de valeur : mot arabe, sens français, contexte réel et exercices de rappel. Le moment est donc possible.

Il n’est pas encore entièrement orchestré comme une scène unique : le sens est dans un reveal, le contexte est dans une disclosure séparée, et l’exercice de contexte arrive plus tard. L’utilisateur peut comprendre « ce mot signifie X », mais le lien immédiat « ce mot apparaît ici dans ce verset que je récite » demande une action supplémentaire.

## 21. Métriques disponibles

Les données existantes permettent d’identifier :

- leçon commencée via navigation et session ;
- position de session ;
- réponses par mot ;
- réussite/échec ;
- mots étudiés ;
- activité quotidienne leçon/mot ;
- progression par compétence ;
- progression de mastery ;
- review items et échéances ;
- leçon terminée via activité et progression persistée.

Aucune instrumentation supplémentaire n’a été créée.

## 22. Tests existants et couverture

La couverture est substantielle : grading sémantique, réponses arabes, exercices, feedback pédagogique, intégrité anti-leakage, completion, sessions, idempotence, SRS, mastery, curriculum, audio et séquençage.

Limites de couverture identifiées :

- peu de tests de rendu responsif réel ;
- peu de tests de parcours UI complet `discovery → feedback → completion` avec navigateur ;
- pas de preuve navigateur post-polish dans l’environnement actuel ;
- l’état de duplication visuelle du `ReviewPlayer` n’est pas couvert par un test de snapshot/DOM.

## 23. Matrice finale des problèmes

| ID | Catégorie | Zone | Problème | Gravité | Impact | Recommandation |
|---|---|---|---|---|---|---|
| UX-001 | UX / PROGRESSION | Shell exercice | Compteur présent dans header, shell et barre | P1 | Charge cognitive et impression de formulaire | Garder une hiérarchie principale et réduire les répétitions |
| PED-001 | PEDAGOGY / UX | Contexte | Contexte réel séparé et fermé par défaut | P1 | L’aha moment mot → ayah demande une action supplémentaire | Concevoir un enchaînement plus explicite sans révéler prématurément |
| UX-002 | UX / FEEDBACK | Feedback incorrect | Plusieurs couches ouvertes/présentes simultanément | P1 | Lecture mobile dense après une erreur | Prioriser correction, puis approfondissement progressif |
| UX-003 | UX / RESPONSIVE | Découverte | Audio + reveal + prononciation peuvent densifier le premier écran | P2 | Risque de CTA bas sur mobile | Valider visuellement et ajuster la hiérarchie si nécessaire |
| UI-001 | UI | ReviewPlayer erreur | Mascotte `welcome` rendue deux fois | P2 | Duplication visuelle évidente | Supprimer la duplication lors d’une phase corrective |
| PED-002 | PEDAGOGY / GRADING | Rappel libre | Pas d’état distinct `PARTIALLY_CORRECT` | P2 | Nuance pédagogique limitée, notamment pour réponses partielles | Décider d’abord le contrat pédagogique avant toute modification du grader |
| UX-004 | UX / FIN DE LEÇON | Completion | Célébration statique et peu ritualisée | P2 | Accomplissement moins mémorable | Concevoir une célébration légère et non infantilisante |
| AUDIO-001 | AUDIO | Contexte ayah | Pas de lecteur ayah identifié dans le flux audité | P3 | Moins de continuité audio mot → verset | Auditer la valeur et les sources audio avant implémentation |
| COPY-001 | COPY | Feedback/review | Quelques formulations techniques ou répétées | P3 | Ton légèrement moins premium | Revue microcopy ciblée |

## 24. Priorisation

### P0 — Bloquant

Aucun P0 identifié.

### P1 — Important

1. Réduire la redondance de progression dans le shell d’exercice.
2. Rendre le lien mot → contexte coranique plus évident.
3. Alléger la hiérarchie du feedback incorrect sur mobile.

### P2 — Amélioration

1. Corriger la double mascotte du `ReviewPlayer`.
2. Revoir la densité de la découverte quand plusieurs aides sont disponibles.
3. Décider si une célébration de fin de leçon est nécessaire.
4. Décider du traitement des réponses partiellement correctes.

### P3 — Future

1. Audio d’ayah si une source réelle et autorisée est disponible.
2. Microcopy et métriques de compréhension utilisateur.

## 25. Roadmap proposée

- **Phase 33B — Première leçon** : hiérarchie découverte, mot, sens et contexte.
- **Phase 34 — Boucle de progression** : simplification de la progression et fin de leçon.
- **Phase 35 — Dashboard et révision** : lisibilité des prochaines actions sans exposer le moteur.
- **Phase 36 — Motivation douce** : jalons et encouragements sans XP/streak parallèle.
- **Phase 37 — Audio pédagogique** : audio du mot, de l’ayah et continuité d’écoute selon disponibilité réelle.
- **Phase 38 — Ouverture progressive** : qualité éditoriale et disponibilité de nouvelles sourates.

## 26. Quran Progress : comparaison prudente

### Existe déjà dans Hikma

- progression de curriculum réelle ;
- objectif quotidien ;
- leçon à reprendre ;
- révisions dues ;
- progression par compétences ;
- recommandation de sourate ;
- célébration d’onboarding ;
- statistiques de session.

### Manque ou reste discret

- jalons émotionnels de fin de leçon ;
- résumé plus directement orienté « ce que tu sais maintenant » ;
- continuité explicite entre mot et ayah ;
- visualisation utilisateur de la maîtrise sans jargon.

### À envisager plus tard

- jalons pédagogiques compréhensibles ;
- encouragements contextuels ;
- statistiques légères et utiles ;
- aucun système parallèle de XP, streak ou curriculum sans décision pédagogique explicite.

## 27. Non-régression

Cet audit n’a effectué aucune écriture Supabase, aucune migration et aucune modification de données. Les contrats existants de grading, scoring, SRS, mastery, scheduler, curriculum, interleaving, audio, Quran et MASAQ sont restés hors modification.

Les valeurs de référence du projet restent celles fournies par le contexte Phase 33A : 21 296 mots Quran, 77 430 occurrences, 6 236 ayahs, 24 944 traductions, 263 traductions de mots, 32 traductions de lemmes, 97 occurrences linguistiques, 170 segments linguistiques, 90 leçons publiées et Al-Māʿūn 107 en `IN_PREPARATION`.

## 28. Limitations de l’audit

- Audit basé sur le code et les tests ; aucune modification effectuée.
- Validation navigateur réelle non disponible dans l’environnement actuel, notamment aux dimensions `390×844`, `375×812` et `1280×720`.
- Aucun nouveau compte authentifié ni aucune donnée de test créée.
- Les observations visuelles fines doivent être confirmées dans un navigateur contrôlable avant implémentation d’une correction.

## Conclusion

Hikma possède une vraie boucle d’apprentissage, avec une base pédagogique et technique solide. La promesse est présente dans le moteur et dans le parcours, mais l’expérience peut mieux relier découverte, contexte et rappel, et réduire la densité de l’interface d’exercice. La suite recommandée est une Phase 33B ciblée sur la première leçon, sans toucher aux moteurs ni aux données.

`PHASE_33A_READ_ONLY_AUDIT_COMPLETE`
