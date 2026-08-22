# PHASE UI/UX 6E-B — Exercise Variety & Pedagogical Interleaving

## Statut

`UI_UX_6E_B_EXERCISE_VARIETY_COMPLETE_READY_FOR_APPROVAL`

## 1. Objectif

Réduire les longues séries d’exercices identiques par un interleaving pédagogique déterministe, sans modifier les exercices générés, leur correction, le score, la maîtrise, le SRS, le curriculum, l’audio ou la persistance.

## 2. Décision UX

L’ordre respecte les priorités suivantes :

1. contraintes pédagogiques fortes ;
2. progression de la compétence ;
3. variété des types ;
4. espacement du mot cible ;
5. déterminisme.

Les phases sont conservées dans l’ordre `recognition → recall → listening → relation → other`. À l’intérieur d’une phase, les files par type alternent ; le prochain mot différent est préféré si cette option existe. Une file unique est consommée dans son ordre source.

## 3. Implémentation

- `lib/learning/sequencing.ts` : ajout de `buildInterleavedSequence` et de la classification pédagogique des types.
- `lib/learning/index.ts` : export public de l’interleaver.
- `app/(app)/learn/[slug]/page.tsx` : interleaving après génération complète et avant l’attachement des identités UI 6D-B.
- Aucun changement backend, schéma, migration, générateur, grading ou persistance.

## 4. Conservation 6D-B

L’interleaver manipule les objets générés sans les cloner ni les réécrire. Les identités UI restent attachées après l’ordre final ; le remount ciblé de l’interaction, le reset d’état et la séparation de la réponse brute restent donc préservés.

## 5. Résultats sur la fixture de référence

Fixture : séquence de 53 exercices, 8 mots, couvrant reconnaissance, rappel, audio, contexte, lemme et phonétique.

| Mesure | Avant | Après |
|---|---:|---:|
| Exercices | 53 | 53 |
| Série max même type | 8 | 2 |
| Série max même compétence | 8 | 2 |
| Adjacences même type | 45 / 52 (86,5 %) | 1 / 52 (1,9 %) |
| Doublons / pertes | 0 / 0 | 0 / 0 |

L’unique adjacence du même type appartient à la petite queue `LEMMA_RELATION`, pour laquelle aucune alternative de type n’est disponible.

## 6. Tests ajoutés

`tests/variety-sequencing.test.ts` couvre :

- déterminisme entre deux exécutions ;
- absence de tirage aléatoire dans l’ordre ;
- préférence `A → B → A` ;
- respect des phases pédagogiques ;
- conservation d’un ensemble mono-type ;
- conservation du nombre et des identités ;
- réduction des séries.

## 7. Artefacts

Les métriques et critères d’acceptation sont dans `tmp/phase6e-variety-b/` :

- `before-after.json`
- `sequence-analysis.json`
- `skill-transitions.json`
- `type-transitions.json`
- `streak-analysis.json`
- `determinism.json`
- `regression.json`
- `acceptance.json`

## 8. Documentation et laboratoire

Le contrat d’architecture et les patterns d’exercice documentent désormais l’interleaving. La page `/design-system` contient une section visuelle `Interleaved Exercise Sequence`, illustrative uniquement et non connectée au moteur.

## 9. Validation technique

- `npm test` : **410 tests passés**, 32 fichiers.
- `npx tsc --noEmit` : **OK**.
- `npm run lint` : **OK**.
- `npm run build` : **OK** avec Next.js 16.3.0 / Turbopack.
- Validation navigateur réelle : **à faire** sur `/learn/[slug]` avec une session de données accessible.

## 10. Périmètre explicitement non modifié

Pas de changement de données, de migrations, d’algorithme de grading, de score, de mastery, de SRS, de curriculum, d’audio ni de persistance. Aucun `Math.random()` ou `crypto.randomUUID()` n’est utilisé pour l’ordre.

## 11. Critères d’acceptation

Les critères fonctionnels de 6E-B sont couverts par les tests et les artefacts. Le résultat est prêt pour revue et approbation.

## 12. Suite

Aucune phase suivante n’est lancée. La seule étape restante est la validation visuelle navigateur, puis l’approbation de la phase.
