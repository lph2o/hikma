# PHASE 24I — Audit & conception du feedback pédagogique après chaque réponse

**Statut : READ_ONLY (DATABASE_WRITES = 0 — aucune table, migration, seed, grading,
scoring, SRS, mastery, progression ni curriculum modifiés).**

**Décision finale : `A — READY_FOR_IMPLEMENTATION`**

---

## 0. État actuel constaté (audit)

Le runtime actuel est :

```
buildWordBank → resolveWordMeanings (FORME → LEMME → EN fallback)
→ generateLessonExercises → exercise.metadata
→ pedagogicalExplanation → HikmaExplanation
```

Comportement observé dans le code :

| Issue | Comportement actuel |
|---|---|
| Réponse **correcte** | `ExerciseFeedback` ne rend `HikmaExplanation` que si `!isCorrect` → l'utilisateur ne voit que « Excellent ! / Bien joué. » **Aucune explication, aucun audio, aucun « Comprendre pourquoi ».** |
| Réponse **incorrecte** | « À revoir » + « Ta réponse » vs « Réponse attendue » + explication courte + bouton replié « Comprendre pourquoi » (explication riche). |
| Réponse **ambiguë** | Traitée comme incorrecte : « À vérifier » + réponse révélée + « Comprendre pourquoi ». |
| Réponse **partielle** | **N'existe pas comme statut distinct** : le rappel libre ne distingue que CORRECT / INCORRECT / AMBIGUOUS (`RecallGrade`). |

Deux constats structurels importants :

1. `explanationData = pedagogicalExplanation(exercise)` est **déjà calculé pour toute
   réponse** dans `FeedbackPanel`, mais `ExerciseFeedback` le **jette** sur une réponse
   correcte (`{!isCorrect && explanationData}`). La matière première est déjà là ; il
   manque la décision d'affichage.
2. `isExplanationRelevant(type)` existe (exclut `WORD_RECOGNITION` et
   `PRONUNCIATION_GUIDED`) mais n'est **branché nulle part** : l'intention existe, la
   règle n'est pas appliquée.

Les données disponibles (Al-Fātiḥah, 26 formes / 29 occurrences) : sens FR validé,
lemme + relation forme→lemme, contexte de verset + traduction FR, audio Muʿallim,
translittération, signes phonétiques, et **MASAQ** (segmentation, stem, POS, cas,
syntaxe) pour 26/26 mots. Absents : racine, schème, gloss FR lexicale mot-à-mot
(repli EN), colonnes MASAQ non importées (`Invariable_Declinable`, `Possessive_Construct`,
`Case_Mood_Marker`, `Phrase`, `Phrasal_Function`).

---

## Réponses aux 18 questions

### 1. Est-il pédagogiquement préférable d'expliquer après chaque réponse ?

**Oui, mais pas « une longue explication après chaque réponse ».** Il faut séparer deux
choses que l'explication actuelle confond :

- un **feedback court**, qui doit être présent après *toute* réponse (statut + bonne
  réponse + audio + sens) — c'est la correction de l'effort, peu coûteuse cognitivement ;
- un **approfondissement**, qui doit être *disponible* après toute réponse mais **jamais
  imposé**.

La recherche sur l'effet de test (« testing effect ») montre que le feedback après une
réponse correcte renforce aussi la mémorisation (confirmation + élaboration), mais qu'une
explication longue imposée augmente la charge cognitive, ralentit la progression, crée de
la fatigue et de la lassitude. **La bonne réponse est la divulgation progressive**
(progressive disclosure) : l'essentiel tout de suite, le détail à la demande.

### 2. Après une réponse correcte ?

Feedback court : statut « Excellent ! » + rappel **optionnel** d'une ligne (varié,
anti-répétition) + audio + « Comprendre ce mot » (replié). **Pas** de bloc long auto-ouvert.

### 3. Après une réponse incorrecte ?

« Ta réponse » vs « Réponse attendue » + **explication ciblée sur ce qui manquait**
(une à deux lignes) + « Comprendre ce mot » qui s'ouvre sur l'approfondissement riche.
Le bouton peut être **auto-ouvert** la première fois, puis replié.

### 4. Après une réponse partielle ?

Quand un statut « partiel » est dérivable (sinon, il est absorbé par « ambigu »), montrer
**uniquement ce qui manque** : « Le sens est juste, mais la formulation attendue est X. »
Jamais une explication comme si tout était faux.

### 5. Après une réponse ambiguë ?

Lister les **formulations acceptées** et expliquer la **nuance** entre elles (ou entre le
sens donné et le sens attendu). Objectif : faire comprendre la frontière, pas ré-enseigner
le mot entier.

### 6. Quelle quantité afficher automatiquement ?

**Niveau 1 seulement** (essentiel) : statut + bonne réponse + audio + sens validé.
Sur mobile, cela doit tenir en **3 à 4 lignes** au-dessus du bouton de continuation.
Rien de plus automatiquement.

### 7. Qu'est-ce qui doit être optionnel ?

Tout le reste : décomposition, identité/lemme, grammaire (POS/cas/syntaxe), contexte de
verset, usages coraniques, nuance, famille lexicale. Tout cela derrière
« Comprendre ce mot » / « En savoir plus ».

### 8. Comment éviter les explications répétitives ?

Faire varier la sélection selon : **type d'exercice**, **type d'erreur**, **niveau
utilisateur**, **mot**, **données linguistiques disponibles**, **contexte**, et
**nombre d'expositions au mot**. Concrètement :
- *1ʳᵉ rencontre* → sens + contexte ;
- *2ᵉ rencontre* → construction + rôle ;
- *erreur de sens* → sens au premier plan ;
- *erreur sur mot composé* → segmentation ;
- *réponse correcte* → simple rappel varié, jamais le même libellé.
La chaîne de priorité déjà construite en 24I (`décomposition → identité → morphologie →
syntaxe`, plafonnée à 2 blocs) garantit que deux mots différents ne produisent pas le même
texte.

### 9. Comment exploiter MASAQ sans surcharger ?

MASAQ ne doit **jamais** apparaître dans le feedback court. Il alimente uniquement
l'approfondissement, en **2 blocs maximum**, transformés en français pédagogique (jamais
les tags bruts), et seulement quand la donnée existe (`AVAILABLE ≠ INFERABLE`).

### 10. Comment adapter au niveau utilisateur ?

Trois paliers, en **réduisant la terminologie** aux niveaux bas :
- **Débutant** : sens + audio + contexte (aucun terme grammatical).
- **Intermédiaire** : segmentation, lemme, POS, contexte.
- **Avancé** : morphologie (cas), syntaxe, comparaison d'usages.
Le signal de niveau peut d'abord être un proxy (maîtrise du mot) avant un profil explicite.

### 11. Comment adapter au type d'erreur ?

- Erreur de **sens** → sens lexical au premier plan ;
- **mot composé** → segmentation ;
- **forme grammaticale** → morphologie disponible ;
- **relation de lemme** → famille, uniquement si la donnée est fiable ;
- **partiel** → seulement la nuance manquante ;
- **orthographe juste / sens juste** → pas d'explication inutile.

### 12. Comment conserver une UX rapide ?

Le feedback fait partie de la **même carte** que la réponse (aucune navigation), le
feedback court est immédiat, un seul bouton « Continuer », l'approfondissement est un
**panneau repliable inline** (aucun changement de page), et les données d'explication sont
**précalculées côté serveur** (aucune requête supplémentaire au moment de répondre).

### 13. Quelle architecture UI recommandes-tu ?

**Panneau repliable inline** (carte extensible), **pas** de modal ni de page séparée :
c'est cohérent avec le `HikmaExplanation` existant (bouton « Comprendre pourquoi » +
contenu replié), RTL-compatible, et adapté au mobile. Sur 390×844, une carte extensible
reste plus simple qu'un drawer. Structure :

```
✅ Correct / ❌ Incorrect
Bonne réponse : « miséricordieux »
Sens : « ... »        [🔊 Écouter]
[Comprendre ce mot ▾]   ← replié par défaut, présent après TOUTE réponse
```

### 14. Quelle architecture de données serait nécessaire ?

Séparer (sans casser le contrat existant) :
- un **`FeedbackTier`** court (statut, bonne réponse, audio, sens) — 1 champ de plus ;
- un **`ExplanationTier`** riche = réutiliser/étendre `HikmaExplanationData` (déjà présent) ;
- un type **`AnswerOutcome`** `correct | incorrect | partial | ambiguous` (dérivé de
  `RecallGrade`, sans toucher au grading) ;
- une fonction pure **`buildShortFeedback(outcome, exercise, exposure)`** (anti-répétition) ;
- une fonction pure **`selectExplanationLevels(evidence, level)`** (déjà esquissée en 24I) ;
- un signal **`userLevel`** et **`exposureCount`** (nouveaux, facultatifs au départ).

### 15. Quelles données sont déjà disponibles ?

Sens FR validé, lemme + relation forme→lemme, contexte de verset + traduction FR réelle,
audio Muʿallim, translittération, signes phonétiques, et MASAQ (segmentation, stem, POS,
cas, syntaxe) pour les 26 mots d'Al-Fātiḥah. Rien de bloquant pour implémenter.

### 16. Quelles données sont encore absentes ?

Racine, schème (`FUTURE_WORK`), gloss FR lexicale **mot-à-mot** (repli EN actuel),
colonnes MASAQ non importées (`Invariable_Declinable`, `Possessive_Construct`,
`Case_Mood_Marker`, `Phrase`, `Phrasal_Function`), un **niveau utilisateur explicite**, et
un **historique d'exposition** au mot (nombre de rencontres).

### 17. Quelles données supplémentaires pourraient être ajoutées plus tard ?

Racine/schème (source auditée), lexique FR mot-à-mot éditorial, MASAQ pour d'autres
sourates, statistiques d'usage (« ce mot apparaît dans X versets / Y sourates »), profil
de niveau et historique d'exposition par mot.

### 18. Quelles fonctionnalités doivent rester hors scope ?

Modifier le grading/scoring/SRS/mastery/progression/curriculum ; générer une glose FR
automatique depuis la gloss EN MASAQ ; inventer racine/schème ; importer MASAQ pour
d'autres sourates ; créer automatiquement des mappings lexicaux depuis MASAQ ; ajouter
XP/récompenses ; exposer les tags MASAQ bruts à l'utilisateur.

---

## Recommandation finale pour Hikma

**Variante retenue : D** (résumé différent selon correct/incorrect + approfondissement
optionnel), affinée. C'est le meilleur compromis entre compréhension, mémorisation,
curiosité et absence de surcharge — ni A (explication complète imposée, fatigante), ni C
(pas d'explication après réussite, occasion manquée).

- **Après réponse correcte** : « Excellent ! » + bonne réponse + audio + **une** ligne de
  rappel variée (anti-répétition) + « Comprendre ce mot » (replié).
- **Après réponse incorrecte** : « Ta réponse » vs « Réponse attendue » + explication
  ciblée (1–2 lignes) + « Comprendre ce mot » (auto-ouvert à la 1ʳᵉ fois, replié ensuite).
- **Après réponse partielle** : uniquement la nuance manquante + audio + « Comprendre ce mot ».
- **Après réponse ambiguë** : formulations acceptées + explication de la nuance + « Comprendre ce mot ».
- **Structure du feedback** : `[statut] → [bonne réponse] → [sens validé] → [audio] → [Comprendre ce mot]`.
- **Structure de l'explication** (repliée, progressive) : essentiel → identité → décomposition → grammaire → contexte → usages → nuance → approfondissement, en ne montrant **que** les niveaux dont la donnée existe.
- **Stratégie anti-répétition** : sélection par chaîne de priorité, 2 blocs max, variation selon type d'exercice, type d'erreur, niveau et nombre d'expositions.
- **Utilisation de MASAQ** : uniquement dans l'approfondissement, 2 blocs max, français pédagogique, `AVAILABLE ≠ INFERABLE`.
- **Prochaines étapes** : implémenter après validation humaine (voir prompt ci-dessous).

---

## PROMPT PHASE SUIVANTE

> **PHASE 24J — Implémentation du feedback pédagogique après chaque réponse (Al-Fātiḥah).**
>
> Contexte : la Phase 24I (audit) a validé la variante **D** — feedback court toujours
> présent + approfondissement optionnel « Comprendre ce mot » après **toute** réponse
> (correcte, incorrecte, partielle, ambiguë). Ne toucher ni au grading, ni au scoring, ni
> au SRS, ni au mastery, ni à la progression, ni au curriculum, ni au resolver lexical, ni
> au word bank, ni à la génération des exercices. `FATIHAH_REFERENCE_LOCKED = TRUE`.
> Périmètre strict : Al-Fātiḥah uniquement.
>
> Tâches :
> 1. **Feedback court toujours présent** : après toute réponse, afficher statut + bonne
>    réponse + sens FR validé + audio Muʿallim (niveau 1), en 3–4 lignes max sur mobile.
> 2. **« Comprendre ce mot » après toute réponse** : rendre le `HikmaExplanation` existant
>    disponible après une réponse **correcte** (aujourd'hui `ExerciseFeedback` ne le rend
>    que si `!isCorrect`), replié par défaut.
> 3. **Statut partiel** : introduire un type `AnswerOutcome = correct | incorrect | partial
>    | ambiguous` dérivé de `RecallGrade`, sans modifier le grading ; afficher pour
>    « partial » uniquement la nuance manquante.
> 4. **Réponse ambiguë** : afficher les formulations acceptées et la nuance entre elles.
> 5. **Anti-répétition** : fonction pure `buildShortFeedback(outcome, exercise, exposure)`
>    qui varie le rappel selon le type d'exercice, le type d'erreur, le mot et le nombre
>    d'expositions (1ʳᵉ rencontre → sens ; ensuite → construction/rôle). Ne jamais répéter
>    mécaniquement « Le mot signifie X ».
> 6. **MASAQ** : utiliser uniquement la normalisation pédagogique existante
>    (`buildLinguisticExplanation`, 2 blocs max, jamais de tags bruts, `AVAILABLE ≠
>    INFERABLE`). Aucune glose FR automatique depuis la gloss EN.
> 7. **Niveau utilisateur** : adopter un proxy initial (maîtrise du mot) pour graduer
>    débutant/intermédiaire/avancé ; prévoir l'extension à un profil explicite.
> 8. **UX** : carte extensible inline (pas de modal ni de page), RTL-compatible, responsive
>    390×844 et 1280×720, accessible (aria-expanded, focus, reduced-motion), un seul
>    bouton « Continuer ».
> 9. **Tests unitaires** (au minimum) : correct/incorrect/partial/ambiguous ; réponse
>    correcte → « Comprendre ce mot » présent ; feedback court sans surcharge ; variante
>    anti-répétition ; adaptation au type d'erreur ; MASAQ 2 blocs max ; données
>    absentes/ambiguës/non vérifiées ; LEMMA_RELATION ; audio présent/absent ; fallback
>    classique ; non-régression grading (les réponses acceptées restent identiques).
> 10. **Non-régression** : les 8 compteurs corpus et Al-Fātiḥah (8 leçons, 26 formes,
>     29 occurrences, 26 audios, 25+1 gloses, 28 traductions, 4 traducteurs) doivent rester
>     strictement identiques ; `npm test`, `npx tsc --noEmit`, `npm run lint`,
>     `npm run build` passants.
> 11. **Livrables** : `PHASE_24J_...md`, `tmp/phase24j-....json`, tests, rapport
>     avant/après, stratégie anti-répétition, limitations.
>
> Décision finale unique : `A — IMPLEMENTATION_SUCCESSFUL_READY_FOR_REVIEW` /
> `B — IMPLEMENTATION_PARTIAL_REVIEW_REQUIRED` / `C — DATA_LIMITED_IMPLEMENTATION` /
> `D — REGRESSION_DETECTED`.
>
> Arrêt obligatoire après cette phase : pas d'extension multi-sourates, pas de
> racines/schèmes, pas de modification du modèle lexical.
