# PHASE 20C-C — LEMMA_RELATION FINAL FIX

**Statut : `IMPLEMENTATION_COMPLETE`**  
**Décision : `FATIHAH_REFERENCE_LOCKED`**

## 1. Problème

Dans `LEMMA_RELATION`, après une erreur, `Comprendre pourquoi` affichait la
relation de famille et l'audio mais omettait la glose et le contexte réel,
alors que ces données étaient déjà présentes dans `exercise.metadata`.

## 2. Cause racine

La fonction `pedagogicalExplanation()` possède une branche spécialisée
anticipée pour `LEMMA_RELATION`. Cette branche retournait directement une
structure limitée au lemme et à l'audio ; elle ne passait jamais par la
construction conditionnelle générique de `meaning` et `context`.

## 3. Fichiers concernés

- `components/learn/exercises/pedagogical-feedback.ts`
- `tests/pedagogical-integrity.test.ts`

## 4. Correction minimale

La branche `LEMMA_RELATION` transmet maintenant, conditionnellement, les
champs `meaning`, `meaningValidated` et `context` déjà disponibles. La
relation, le repère de famille et l'audio existants sont conservés. Aucun
composant parallèle ni nouvelle architecture n'a été créé.

## 5–9. Données réutilisées

- Glose : `exercise.metadata.meaning` issue du lexique existant.
- Lemme : relation réelle et repère de famille existants.
- Contexte : `exercise.metadata.context`, issu du verset réel.
- Audio : `exercise.metadata.audioUrl`, URL signée Muʿallim existante.
- Arabe et translittération : données déjà portées par l'exercice.

Aucune racine, morphologie, traduction, source ou donnée lexicale n'a été
ajoutée. Aucun libellé de lemme non validé n'est inventé.

## 10. Tests

Ajouts ciblés :

- `LEMMA_RELATION` incorrect → glose visible ;
- relation de lemme visible ;
- contexte visible ;
- audio visible ;
- feedback conservé ;
- réponse correcte → aucune explication d'erreur.

Résultats : `npm test` → **445 passed / 37 files** ; test ciblé → **12 passed**.

## 11. Non-régression

- TypeScript : **PASS**
- ESLint : **PASS**
- Build production : **PASS**
- Grading, SRS, mastery et progression : non modifiés.
- Aucun changement de données Supabase.
- Comptes vérifiés inchangés : `quran_words=21296`,
  `word_occurrences=77430`, `ayahs=6236`.

## 12. Validation navigateur

Cas réel : `al-hamd → exercice LEMMA_RELATION → réponse incorrecte →
Comprendre pourquoi`.

| Environnement | Glose | Lemme/relation | Contexte | Audio | Overflow | Console |
|---|---|---|---|---|---|---|
| Mobile `390×844` | PASS | PASS | PASS | PASS | PASS | PASS |
| Desktop `1280×720` | PASS | PASS | PASS | PASS | PASS | PASS |

Le rendu conserve l'arabe RTL et les diacritiques. L'ouverture de
l'explication ne déclenche aucune réussite ni progression artificielle.

## 13. Database writes

`DATABASE_WRITES = 0`.

Les commandes `verify:persistence` et `verify:rls` n'ont pas été exécutées,
car elles créent des utilisateurs temporaires et écrivent en base.

## 14. Décision finale

`FATIHAH_REFERENCE_LOCKED`

Le blocker identifié en Phase 20C-B est corrigé et confirmé dans le navigateur
réel. La référence Al-Fātiḥah peut être considérée comme verrouillée pour la
suite contrôlée du projet.
