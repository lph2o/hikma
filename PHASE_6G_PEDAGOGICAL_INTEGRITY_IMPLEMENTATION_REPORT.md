# Phase 6G — Pedagogical Integrity & Anti-Leakage

**Statut :** implémentation terminée, prête pour approbation.

## 1. Résumé

La Phase 6G renforce l’intégrité pédagogique sans modifier le moteur métier. Le verset arabe reste visible, tandis que la traduction du contexte est repliée par défaut lorsqu’elle contient exactement le sens attendu ou lorsque la détection ne peut pas être fiable. Le rappel libre français n’est généré que lorsque le sens français est réellement validé. Les distracteurs sans relation documentée sont explicitement classés `UNKNOWN`, et les explications de sens non vérifiées sont honnêtement affichées comme indisponibles.

## 2. Problèmes corrigés

### Fuite du contexte

Cause : `context.french` était rendu directement avant les options.

Correction : ajout de `detectTranslationExposure()` avec comparaison prudente des formulations déjà connues. Les états sont `SAFE_CONTEXT`, `REVEAL_RISK` et `UNKNOWN`. `REVEAL_RISK` et `UNKNOWN` utilisent `HikmaReveal`; le verset arabe n’est jamais supprimé.

### Langue du rappel libre

Cause : `FORM_TO_MEANING` annonçait systématiquement le français alors que le fallback pouvait être anglais.

Correction : ajout de `answerLanguageForMeaning()`. Le rappel libre est généré pour `FR_VERIFIED`; un fallback anglais explicite ne produit pas un exercice qui mentirait sur sa langue, car le grading métier français est gelé par le périmètre de la phase. Aucune traduction automatique n’est ajoutée.

### Distracteurs

Cause : sélection déterministe par ordre de banque, sans relation sémantique disponible.

Correction : les distracteurs issus du fallback portent `confidence: "UNKNOWN"`. Aucun synonyme, antonyme, lemme, catégorie grammaticale ou proximité sémantique n’est inventé. La bonne réponse reste conservée et aucun doublon n’est introduit par la sélection existante.

### Explications

Cause : l’explication de sens générique pouvait donner l’impression d’expliquer l’erreur sans preuve linguistique.

Correction : les données phonétiques vérifiées et les relations de lemme existantes sont conservées. Les explications de sens sans données explicatives suffisantes passent à `unavailable` et indiquent honnêtement la limite du contenu.

### Arabe Quranic

Correction : ajout de tests explicites sur `ٱلرَّحْمَـٰنِ`. Le rendu continue d’utiliser `ArabicText`, RTL local, Amiri, line-height 1.9 et aucun remplacement destructif des caractères visibles.

## 3. Fichiers modifiés

- `lib/exercises/types.ts`
- `lib/exercises/context-integrity.ts`
- `lib/exercises/generators/context.ts`
- `lib/exercises/generators/recall.ts`
- `lib/exercises/generators/shared.ts`
- `lib/exercises/generators/complete-word.ts`
- `components/learn/exercises/index.tsx`
- `components/learn/exercises/pedagogical-feedback.ts`
- `components/learn/exercises/options-exercise.tsx`
- `app/design-system/page.tsx`

## 4. Fichiers créés

- `PHASE_6G_BEFORE_STATE.md`
- `PHASE_6G_PEDAGOGICAL_INTEGRITY_IMPLEMENTATION_REPORT.md`
- `tests/pedagogical-integrity.test.ts`
- `docs/ui-ux-skills/hikma-pedagogical-integrity/README.md`

Les artefacts de l’audit précédent restent dans `tmp/phase6g-pedagogical/` et sont valides JSON.

## 5. Matrice avant / après

| Problème | Avant | Après | Preuve | Risque restant |
|---|---|---|---|---|
| Contexte avec réponse | Traduction toujours visible | Traduction repliée pour `REVEAL_RISK`/`UNKNOWN` | tests ciblés | Les paraphrases non présentes dans les données restent `UNKNOWN` et sont repliées |
| Langue du rappel | Français forcé | Rappel français uniquement `FR_VERIFIED` | test fallback anglais | Aucun rappel libre généré pour une glose EN tant que le grading reste FR |
| Distracteurs | Banque déterministe non qualifiée | Fallback explicitement `UNKNOWN` | test `buildOptions` | Pas de graphe sémantique validé disponible |
| Explication de sens | Générique `partial` | `unavailable` si aucune preuve explicative | test feedback | Analyse morphologique non disponible |
| Réponse après erreur | Surfaces distinctes déjà présentes | Conservées et couvertes par le laboratoire | tests existants + labo | Aucun |
| Arabe Quranic | Rendu RTL existant | Test explicite de `ٱلرَّحْمَـٰنِ` | test + navigateur | Clavier arabe complet non testé sur route authentifiée |

## 6. Tests

- **Avant :** 418 tests.
- **Après :** 427 tests.
- **Résultat :** 34 fichiers de test passés, 427 tests passés.
- `npx tsc --noEmit` : OK.
- `npm run lint` : OK, sans warning.
- `npm run build` : OK avec Next.js 16.3.0.
- `jq empty tmp/phase6g-pedagogical/*.json` : OK.

## 7. Validation navigateur

Validation réellement effectuée sur `/design-system` :

- viewport desktop `1280 × 720` : chargé, section présente, caractères arabes présents, aucun overflow horizontal détecté ;
- viewport mobile `390 × 844` : chargé, section présente, caractères arabes présents, aucun overflow horizontal détecté ;
- disclosure `Afficher la traduction du verset` : bouton unique trouvé, traduction révélée après interaction ;
- état fermé vérifié via le DOM : la traduction à risque n’est pas rendue avant interaction ;
- rendu `ٱلرَّحْمَـٰنِ` vérifié.

`BROWSER_VALIDATION_PENDING` pour le parcours authentifié réel `CONTEXT_RECOGNITION`, le clavier arabe en situation de saisie, les données Supabase et les routes de leçon nécessitant une session utilisateur. Aucune validation non effectuée n’est déclarée.

## 8. Non-régression métier

```text
grading: unchanged
scoring: unchanged
SRS: unchanged
mastery: unchanged
scheduler: unchanged
interleaving: unchanged
curriculum: unchanged
persistence: unchanged
Supabase: unchanged
migrations: 0
Quran data: unchanged
audio backend: unchanged
```

Les changements sont limités aux métadonnées non métier, à la présentation progressive, aux garde-fous de génération, au laboratoire, à la documentation et aux tests.

## 9. Limitations restantes

- Les relations sémantiques vérifiées entre distracteurs ne sont pas disponibles ; le système les signale donc comme `UNKNOWN`.
- Les sens anglais fallback ne produisent pas de rappel libre de sens dans cette phase afin de ne pas mentir sur la langue avec le grading français gelé.
- Aucune analyse morphologique, racine, schème, fonction grammaticale ou règle de tajwid n’est ajoutée sans source vérifiée.
- La validation navigateur authentifiée et la capture microphone restent à effectuer dans un environnement disposant d’une session et des permissions nécessaires.

## 10. Arrêt de phase

La Phase 6H, toute nouvelle compétence, tout moteur morphologique, nouveau grading, SRS, mastery, import phonétique ou modification du curriculum n’a pas été démarré.

UI_UX_6G_PEDAGOGICAL_INTEGRITY_COMPLETE_READY_FOR_APPROVAL
