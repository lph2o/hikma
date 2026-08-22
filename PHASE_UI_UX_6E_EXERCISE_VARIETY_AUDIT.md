STATUS: AUDIT_COMPLETE_READY_FOR_APPROVAL

# PHASE UI/UX 6E — EXERCISE VARIETY & PEDAGOGICAL FLOW AUDIT

## 1. Résumé exécutif

La répétition observée est principalement causée par le séquenceur cumulatif, pas par un bug de génération ou de présentation. `buildCumulativeSequence` parcourt une compétence entière sur tous les mots avant de passer à la compétence suivante. Sur `iyyaka-nabudu`, cela produit huit exercices de chaque ronde, puis les relations de lemme disponibles et la discrimination phonétique bornée.

La diversité existe au niveau global — 8 types et 7 skills dans la configuration de référence — mais elle est distribuée en blocs trop longs pour la fenêtre d’attention immédiate. La monotonie est donc une vraie faiblesse UX/pédagogique locale, sans démontrer que le moteur produit des doublons exacts.

Aucune modification applicative, pédagogique ou backend n’a été effectuée.

## 2. Cause racine

Le pipeline est :

`lesson_words → buildWordBank → données audio/contexte/lemme → buildCumulativeSequence → generateExercise → append phonétique borné → LessonPlayer`.

La cause principale est `lib/learning/sequencing.ts` : la boucle est `skill → word`, avec `SKILL_ORDER` fixe et saut des compétences maîtrisées. `LessonPlayer` ne réordonne rien. Les générateurs filtrent seulement les types impossibles lorsque les données réelles manquent.

Facteurs secondaires :

- chaque compétence produit un geste homogène sur toute la ronde ;
- les exercices de rappel libre sont groupés en deux blocs successifs ;
- les discriminations phonétiques sont ajoutées en fin de séquence ;
- les relations de lemme sont rares et ne peuvent pas être inventées.

## 3. Données observées

Les données proviennent des audits runtime existants (`PHASE_23F_C_END_TO_END_PEDAGOGICAL_AUDIT.md`, `PHASE_23F_A_PEDAGOGICAL_RUNTIME_AUDIT.md`, `tmp/phase24h-discovery-ux/audio-matrix.json`, `tmp/phase24hq1-phonetic-matrix.json`) et du code actuel. Les distributions sont des reconstructions read-only du modèle connecté débutant, car aucun nouveau chargement de production ni changement de données n’a été effectué.

| Leçon | Mots | Core | Phonétique max actuelle | Total haut | Lemme |
|---|---:|---:|---:|---:|---:|
| basmala | 4 | 27 | 3 | 30 | 3 |
| ar-rahman | 6 | 41 | 0 | 41 | 5 |
| malik-yawm-ad-din | 7 | 47 | 3 | 50 | 5 |
| iyyaka-nabudu | 8 | 50 | 3 | 53 | 2 |
| wa-la-d-dallin | 8 | 49 | 3 | 52 | 1 |

Les autres leçons représentatives sont détaillées dans [`lesson-distribution.json`](</Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase6e-variety/lesson-distribution.json>).

## 4. Analyse du pipeline

### Curriculum

`scripts/seed-curriculum.ts` définit les leçons, l’ordre des unités et les mots ; il ne mélange pas les exercices.

### Génération

`lib/learning/lesson.ts` définit les types par défaut du mode visiteur. Les générateurs de `lib/exercises/generators/` construisent options et contenu, en renvoyant `null` quand le contexte réel manque.

### Skill mapping

`defaultSkillToType` mappe une compétence vers un type principal. Le séquenceur connecté suit `SKILL_ORDER` : reconnaissance du sens, reconnaissance de forme, rappel FR, production arabe, audio, contexte, lemme.

### Ordonnancement

`buildCumulativeSequence` émet d’abord toutes les étapes d’une compétence pour les mots ordonnés, puis passe à la suivante. `generatePhoneticDiscriminationSet` ajoute ensuite au plus trois exercices pour les premiers mots éligibles. `LessonPlayer` consomme l’ordre reçu.

## 5. Analyse de la répétition

Pour `iyyaka-nabudu` :

- `WORD_TO_TRANSLATION × 8` ;
- `TRANSLATION_TO_WORD × 8` ;
- `FORM_TO_MEANING × 8` ;
- `MEANING_TO_FORM × 8` ;
- `AUDIO_TO_WORD × 8` ;
- `CONTEXT_RECOGNITION × 8` ;
- `LEMMA_RELATION × 2` ;
- `PHONETIC_DISCRIMINATION × 3`.

Métriques :

- streak maximale même type : 8 ;
- streak maximale même skill : 8 ;
- répétitions adjacentes : 45/52, soit 86,5 % ;
- types distincts : 8/8 dans cette configuration ;
- skills distinctes : 7 ;
- dans les 10 premiers exercices d’une leçon de 8 mots : seulement 2 types et 2 skills ;
- le rappel libre apparaît en bloc de 8 pour `FORM_TO_MEANING`, puis en bloc de 8 pour `MEANING_TO_FORM`.

Les métriques multi-leçons sont dans [`streak-analysis.json`](</Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase6e-variety/streak-analysis.json>) et [`transition-analysis.json`](</Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase6e-variety/transition-analysis.json>).

## 6. Analyse cognitive

La séquence respecte une logique cumulative : voir/comprendre, reconnaître, rappeler, produire, écouter, contextualiser, relier. La répétition par mot différent soutient la récupération, mais la répétition du même geste huit fois de suite peut devenir une répétition UX inutile.

| Fonction | Bénéfice de la répétition | Risque du bloc |
|---|---|---|
| reconnaissance | familiariser rapidement la forme et le sens | QCM mécanique |
| rappel | renforcer la récupération | fatigue de saisie, surtout deux blocs successifs |
| production | tester une direction plus exigeante | difficulté perçue brusque si bloc long |
| audio | lier son et forme | écoute monotone si objectif inchangé |
| contexte | transférer vers le verset | placement tardif, après charge élevée |
| lemme | consolider une relation réelle | faible volume, pas de problème de streak majeur |
| phonétique | discrimination ciblée | ajout groupé en fin de leçon |

La variété des mots n’équivaut pas à la variété des gestes cognitifs : huit mots différents peuvent représenter huit répétitions du même format.

## 7. Analyse spécifique du rappel libre

Le rappel libre est regroupé par compétence : `FORM_TO_MEANING × N`, puis `MEANING_TO_FORM × N`. Dans la leçon de référence, cela signifie huit saisies françaises consécutives puis huit saisies arabes consécutives. Les mots changent, mais la consigne, l’interaction et la charge motrice restent homogènes.

Ce n’est pas un doublon exact et c’est cohérent avec la progression actuelle. C’est néanmoins le meilleur candidat pour un interleaving prudent, par exemple en séparant deux blocs de rappel par une reconnaissance audio ou contextuelle déjà éligible.

## 8. Comparaison des stratégies

### A — Shuffle aléatoire

Rejetée : non-déterministe, casse les prérequis, rend les sessions et les tests instables.

### B — Limite stricte de streak

Utile comme garde-fou, mais un `MAX_SAME_TYPE_STREAK = 2` ou `3` serait arbitraire sans mesurer la rétention et les contraintes de petites leçons. Ne suffit pas à elle seule.

### C — Alternance fixe

Simple mais rigide. Elle peut forcer une transition vers l’audio ou la production avant une exposition suffisante.

### D — Scheduler pondéré

Expressif mais complexe. Il pourrait prendre en compte skill faible, récence, difficulté et répétition locale, au prix d’une instrumentation et de tests importantes.

### E — Interleaving pédagogique

Prometteur : alterner des gestes différents tout en conservant les prérequis. Risque d’interleaving trop agressif et de surcharge.

### F — Hybride recommandé

Conserver la priorité pédagogique actuelle, puis choisir déterministement parmi les étapes éligibles en pénalisant le même type, le même skill et le même mot récents. Revenir à l’ordre original lorsqu’aucune candidate sûre n’existe.

La comparaison complète est dans [`strategy-comparison.md`](</Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase6e-variety/strategy-comparison.md>).

## 9. Stratégie recommandée

Ne pas randomiser la liste complète. Construire un interleaving déterministe à contraintes souples :

1. conserver les étapes éligibles produites par le séquenceur ;
2. préserver les prérequis et la priorité des compétences faibles ;
3. choisir une étape d’un autre type/skill lorsque cela ne dégrade pas la progression ;
4. préférer un autre mot avant de répéter le même ;
5. utiliser un seed stable `lessonId + learnerStateFingerprint` ;
6. fallback vers l’ordre cumulatif actuel pour les petites leçons ou données rares ;
7. conserver exactement le multiensemble d’exercices.

Les seuils de streak doivent être calibrés après simulation sur toutes les leçons, pas choisis arbitrairement. Le modèle conceptuel est dans [`proposed-sequencing-model.md`](</Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase6e-variety/proposed-sequencing-model.md>).

## 10. Architecture proposée

### Modification probable si approuvée

- helper pur dans `lib/learning/sequencing.ts` ou module adjacent ;
- application après construction des étapes/génération et avant identité UI ;
- tests de déterminisme, conservation des exercices, contraintes et fallback ;
- artefact de métriques avant/après.

### À ne pas modifier

`validateAnswer`, `scoreAnswer`, grading, générateurs de contenu, distracteurs, SRS, mastery, persistance, Supabase, migrations, données Quran, traductions et `LessonPlayer` sauf adaptation minimale de consommation si nécessaire.

L’impact détaillé est dans [`architectural-impact.md`](</Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase6e-variety/architectural-impact.md>).

## 11. Risques

- interleaving trop agressif : difficulté ressentie et oubli des prérequis ;
- perte de répétition utile pour une compétence faible ;
- contexte ou audio placés avant exposition suffisante ;
- petites leçons artificiellement mélangées ;
- difficulté de debug si le seed est incomplet ;
- changement de l’ordre pouvant affecter la perception de maîtrise même si le scoring reste identique.

## 12. Critères d’acceptation futurs

- même leçon + même état apprenant + même seed = même séquence ;
- nombre total inchangé ;
- multiensemble `(wordId, type, skill)` inchangé ;
- aucune étape non éligible ;
- streak et taux adjacent réduits par rapport à la baseline 8 / 86,5 % ;
- prérequis et progression cognitive préservés ;
- fallback inchangé pour les petites leçons ;
- aucune modification du grading, SRS, mastery ou persistance.

Les seuils doivent être décidés après simulation. Voir [`acceptance-criteria.md`](</Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase6e-variety/acceptance-criteria.md>).

## 13. Plan d’implémentation futur

Si approuvé :

1. ajouter une simulation pure avant/après ;
2. calibrer les contraintes sur les huit leçons ;
3. implémenter le helper déterministe ;
4. vérifier conservation et prérequis ;
5. tester petites/moyennes/grandes leçons ;
6. valider navigateur et perception du flux ;
7. produire un rapport séparé avant toute phase suivante.

## 14. Non-régression

Cette phase n’a modifié aucun fichier applicatif, backend, DB, migration, curriculum, générateur, grading, scoring, SRS, mastery, persistance, audio ou UI. Aucun shuffle expérimental n’a été ajouté. Les JSON de `tmp/phase6e-variety/` sont des artefacts d’audit valides.

STATUS: AUDIT_COMPLETE_READY_FOR_APPROVAL  
NEXT_PHASE: 6E-B — EXERCISE VARIETY IMPLEMENTATION
