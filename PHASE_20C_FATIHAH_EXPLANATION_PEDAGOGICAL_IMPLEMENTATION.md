# PHASE 20C — FINALISATION PÉDAGOGIQUE AL-FĀTIḤAH

**Statut technique : `IMPLEMENTATION_COMPLETE`**  
**Décision pédagogique : `FATIHAH_READY_PENDING_MANUAL_REVIEW`**

## 1. Résumé exécutif

L'explication après erreur utilise maintenant les données déjà résolues par
la leçon : glose, repère lexical, contexte réel et audio Muʿallim signé. Elle
reste fermée par défaut et ne se déclenche qu'après une réponse non correcte.
Les racines et la morphologie absentes ne sont ni déduites ni affichées.

L'audit live des huit leçons confirme la cohérence Al-Fātiḥah, la progression
de difficulté 1→3, la réutilisation des mots et la couverture audio. Un point
reste à valider manuellement : la charge du parcours visiteur varie de 43 à 86
exercices générés par leçon. Aucun changement de curriculum n'a été improvisé.

## 2. État initial

- 26 formes, 29 occurrences, 8 leçons, 26/26 audios.
- `HikmaExplanation` existait mais affichait principalement une explication
  indisponible ou des indices spécialisés.
- Le feedback ne lui transmettait pas systématiquement le contexte, le lemme,
  la glose validée et l'audio déjà disponibles.
- Racines : aucune valeur live exploitable.
- Morphologie : aucune infrastructure exploitable.

## 3. HikmaExplanation — audit

Ce qui fonctionnait : accordéon accessible, ouverture à la demande, arabe et
translittération, disponibilité `verified/partial/unavailable`, intégration au
feedback incorrect.

Ce qui était partiel : absence de champs conditionnels pour le sens, le
contexte, le repère lexical et l'audio ; le fallback indisponible intervenait
trop souvent.

Ce qui a été réutilisé : l'unique composant `HikmaExplanation`,
`ExerciseFeedback`, `AudioPlayer`, les queries batch et le metadata des
exercices.

## 4. Modifications réalisées

- Ajout de champs optionnels dans `HikmaExplanationData` et le metadata généré.
- Transmission code-only des données déjà chargées côté serveur après la
  génération des exercices.
- Affichage conditionnel : sens, repère de famille, contexte réel et écoute.
- Maintien d'une divulgation progressive : aucune donnée ajoutée avant la
  soumission, explication fermée par défaut.
- Aucun changement de grading, SRS, mastery, progression, persistance,
  curriculum, traductions, sources, audio ou base de données.

## 5. Données utilisées

Forme arabe, translittération existante, glose déjà résolue, contexte réel
`getWordAyahContexts`, relation de lemme existante, glose de lemme française
validée si elle existe, et URL signée existante de `getWordAudioState`.

## 6. Données volontairement non utilisées

Aucune nouvelle traduction, aucun mapping, aucune racine, aucune morphologie,
aucune composition grammaticale, aucun audio ou texte inventé. Les quatre
traductions de verset restent au niveau de leurs usages existants.

## 7. Explication après erreur

Flux : réponse → grading existant → feedback → réponse attendue →
`Comprendre pourquoi` → sens/contextualisation éventuelle → audio si présent →
continuer. Le composant n'est pas rendu pour une réussite correcte.

## 8. Audio après erreur

`AudioPlayer` réutilise l'URL Muʿallim signée existante, avec le libellé
`Écouter le mot`. Si aucune URL n'est présente, le bloc audio est omis.

## 9. Audit des 8 leçons

| Leçon | Objectif | Mots | Exercices | Audio | Feedback | Progression | Problème | Action |
|---|---|---:|---:|---|---|---|---|---|
| 1 · basmala | Basmala, reconnaissance/compréhension | 4 · 4 nouveaux | 43 | 4/4 | moteur commun | difficulté 1 | aucun observé | aucun changement |
| 2 · al-hamd | louange + réutilisation | 8 · 4 nouveaux | 86 | 8/8 | moteur commun | révision cumulative | charge visiteur à revoir | revue manuelle |
| 3 · ar-rahman | noms de miséricorde | 6 · 2 nouveaux | 65 | 6/6 | moteur commun | révision cumulative | charge visiteur à revoir | revue manuelle |
| 4 · malik-yawm-ad-din | souverain/jour/rétribution | 7 · 3 nouveaux | 75 | 7/7 | moteur commun | révision cumulative | charge visiteur à revoir | revue manuelle |
| 5 · iyyaka-nabudu | adoration/secours | 8 · 4 nouveaux | 82 | 8/8 | moteur commun | révision cumulative | charge visiteur à revoir | revue manuelle |
| 6 · ihdina-sirat | guidance/chemin | 7 · 3 nouveaux | 71 | 7/7 | moteur commun | difficulté 3 | charge visiteur à revoir | revue manuelle |
| 7 · sirat-alladhina | chemin/ceux qui/comblés | 8 · 4 nouveaux | 82 | 8/8 | moteur commun | difficulté 3 | charge visiteur à revoir | revue manuelle |
| 8 · wa-la-d-dallin | colère/égarés/négation | 8 · 4 nouveaux | 82 | 8/8 | moteur commun | difficulté 3 | charge visiteur à revoir | revue manuelle |

Les contextes contrôlés par le parcours pointent tous vers la sourate 1. Les
exercices sont générés à l'exécution ; les nombres ci-dessus correspondent à
la séquence visiteur par défaut avant le complément phonétique de la page.

## 10. Corrections pédagogiques

La correction objective de cette phase concerne l'explication post-erreur et
sa divulgation progressive. La charge de la séquence visiteur est documentée,
mais sa réduction serait une décision éditoriale de curriculum et reste
bloquée pour revue manuelle.

## 11–14. Grading, SRS, mastery, progression

Non modifiés. Ouvrir une explication ne crée aucune tentative, aucun score,
aucune révision, aucun changement de maîtrise et aucune progression.

## 15. Tests ajoutés

Tests des repères conditionnels, du contexte, du lemme, de l'audio disponible
et de l'absence honnête de racine/morphologie/audio.

## 16–18. Validation technique et non-régression

Résultats exacts :

- `npm test` → **443 passed / 37 files** ;
- `npx tsc --noEmit` → **PASS** ;
- `npm run lint` → **PASS** ;
- `npm run build` → **PASS** avec Next.js 16.3.0/Turbopack ;
- `jq empty tmp/phase20c-fatihah-explanation-pedagogical-implementation.json`
  → **PASS**.

`npm run verify:persistence` et `npm run verify:rls` ne sont pas exécutés dans
cette phase : ils créent des utilisateurs et écrivent des données temporaires.
Statut : **NOT RUN — WRITES TEMPORARY USERS**. Les derniers résultats
documentés restent 13/13 et 44/44 dans les audits précédents.

Les comptes de référence restent : `quran_words=21296`,
`word_occurrences=77430`, `ayahs=6236`. Aucune écriture Supabase, migration,
seed ou import n'a été réalisé.

## 19. Blockers restants

- Revue humaine de la charge du parcours visiteur et de l'expérience complète
  des 8 leçons.
- `ROOT = FUTURE WORK` : aucune valeur live fiable.
- `MORPHOLOGY = FUTURE WORK` : aucune infrastructure démontrée.

## 20. Critères `FATIHAH_REFERENCE_LOCKED`

Les critères techniques sont couverts ou préservés : formes, occurrences,
leçons, traductions, gloses, audio, grading, feedback, progression, SRS,
mastery, non-régression et absence de données inventées. Le verrouillage final
est volontairement différé : les 8 leçons n'ont pas encore reçu la validation
éditoriale humaine de leur charge visiteur.

## 21. Recommandation Phase 21

Ne pas généraliser avant l'approbation manuelle de cette matrice. Après cette
approbation, la référence Al-Fātiḥah pourra être verrouillée puis servir de
base au chantier multi-sourates contrôlé.

## 22. JSON

Voir [le JSON de validation](tmp/phase20c-fatihah-explanation-pedagogical-implementation.json).
