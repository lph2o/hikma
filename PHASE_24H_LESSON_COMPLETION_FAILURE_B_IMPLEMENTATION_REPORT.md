# PHASE 24H-LESSON-COMPLETION-FAILURE — ÉTAPE B
## CORRECTION DE LA FIABILITÉ ET DE L'UX DE FIN DE LEÇON

**STATUS = `LESSON_COMPLETION_RELIABILITY_COMPLETE`**

---

## 1. Cause corrigée

L'Étape A a établi : le chemin de progression est désormais idempotent (aucun échec
déterministe), mais le `catch` **générique, non atomique et non classifié** de
`submitLessonResults()` transformait toute erreur transitoire — ou tout succès
**partiel** — en « Progression non enregistrée », et jetait l'information
`savedWordIds`. L'Étape B corrige cette gestion d'erreur sans toucher au moteur
pédagogique, au SRS, à la maîtrise ni aux données.

## 2. Fichiers modifiés

| Fichier | Changement |
|---|---|
| `lib/learning/lesson-submit.ts` (nouveau) | `runLessonSubmission()` (orchestration pure testable) + `classifyLessonSubmitError()` + contrat `LessonResultsResult` |
| `lib/learning/actions.ts` | `submitLessonResults()` refactoré → délègue à `runLessonSubmission` (persistance injectée) |
| `components/learn/lesson-player.tsx` | gestion `success`/`partial`/`failed` ; écran d'erreur distinct ; `submitSkillAttempts` non bloquant |
| `tests/lesson-completion.test.ts` (nouveau) | 14 tests du contrat + classification |

## 3. Comportement avant / après

| Situation | Avant | Après |
|---|---|---|
| Erreur après 3 mots sur 5 | « Progression non enregistrée » (tout semble perdu) | **« Synchronisation en attente — Ta progression est en partie enregistrée. Réessaie pour terminer la synchronisation. »** |
| Aucun mot persisté | même message générique | **« Impossible d'enregistrer ta progression pour le moment. Vérifie ta connexion puis réessaie. »** (erreur réelle) |
| Activité statistique seule en échec | — | leçon **sauvegardée** (`success`, `activitySaved:false`), aucun écran bloquant |
| Session expirée (RLS) | message générique | « Ta session a peut-être expiré. Reconnecte-toi puis réessaie. » |

## 4. Nouveau contrat de retour

```ts
type LessonResultsResult = {
  ok: boolean;
  status: "success" | "partial" | "failed";
  savedWordIds: string[];     // mots réellement persistés
  pendingWordIds: string[];   // mots restants (retry ciblé)
  activitySaved: boolean;     // activité statistique (non bloquante)
  errorCode?: "RETRYABLE" | "AUTH" | "VALIDATION" | "UNKNOWN";
  retryable?: boolean;
  error?: string;             // message humain adapté
};
```

## 5. Classification des erreurs

`classifyLessonSubmitError(message)` → `RETRYABLE` (timeout, réseau, rate-limit, 429/502/503), `AUTH` (RLS/JWT/session), `VALIDATION` (contrainte unique/FK/check), `UNKNOWN`. Minimal et déterministe (basé sur le message, sans introspection excessive).

## 6. Gestion du succès partiel

`runLessonSubmission` retourne `status:"partial"` dès que `savedWordIds.length > 0` à l'échec ; `pendingWordIds` = mots non encore persistés ; l'UI ne dit **jamais** « non enregistrée » dans ce cas.

## 7. Comportement du retry

Le bouton « Réessayer » relance `finish()`, qui re-soumet **uniquement** `pendingWordAttempts(finalResults, savedWordIds.current)` — idempotent, sans régénérer d'exercices, sans double avancement.

## 8. Traitement de `submitSkillAttempts`

- **Non bloquant** : `await` → `void` (fire-and-forget avec `.catch`) — la fin de leçon n'attend plus les ~15-20 s d'écritures N+1.
- **Séquentiel conservé côté serveur** : pas de parallélisme (évite les courses read-modify-write sur la rétention recalculée). Le calcul de maîtrise/score/SRS est **inchangé**.

## 9. Tests ajoutés (`tests/lesson-completion.test.ts` — 14)

Contrat : succès complet ; échec avant 1ʳᵉ sauvegarde ; échec après quelques mots (partial + pending) ; erreur statistique seule ; retry après partiel (ne re-persiste que le reste) ; double soumission (un persist/mot/passe, pas de doublon) ; recomplétion ; session reprise (mots vides ignorés) ; activité idempotente. Classification : timeout/réseau → RETRYABLE ; RLS → AUTH ; contrainte → VALIDATION ; inconnu → UNKNOWN.

## 10. Non-régression

| Vérification | Résultat |
|---|---|
| `npm test` | **366/366** (352 + 14) ✓ |
| `npx tsc --noEmit` | **0 erreur** ✓ |
| `npm run lint` | clean ✓ |
| `npm run build` | OK ✓ |
| `npm run verify:persistence` | **13/13** ✓ |
| `npm run verify:rls` | **44/44** ✓ |

(grading FR/AR, homographes, audio, phonétique guidée, mastery, SRS, session, activité : couverts par la suite complète, tous verts.)

## 11. Données vérifiées (inchangées)

`quran_words` 21 296 · `word_occurrences` 77 430 · `word_audio` 21 295 · `ayah_audio` 0 · `lemmas` 32 · `word_translations FR` 25 · `word_lemma_mapping` 183. **Aucune migration créée.**

## 12. Risques résiduels

- `submitSkillAttempts` continue en arrière-plan après l'écran de fin (fire-and-forget) : si l'utilisateur ferme immédiatement l'onglet, la requête déjà émise continue côté serveur ; en cas d'interruption, la maîtrise peut être légèrement retardée (best-effort, jamais bloquante).
- La classification repose sur le **message** d'erreur : suffisante pour retry/erreur réelle, mais moins précise qu'une introspection du code Postgrest (non nécessaire ici).

## 13. Limites

- `BROWSER_VALIDATION_PENDING` : pas de navigateur automatisé — le rendu tactile/clavier de l'écran d'erreur reste à confirmer (24I/24J).
- Aucun changement du moteur pédagogique/SRS/curriculum/grading/phonétique/audio/données.

---

**Livrables** : `PHASE_24H_LESSON_COMPLETION_FAILURE_B_IMPLEMENTATION_REPORT.md` · `tmp/phase24h-lesson-completion/phase24h-lesson-completion-b-evidence.json` (+ Étape A : 9 JSON + `repro.ts`).

**ARRÊT OBLIGATOIRE** : 24H-Q2, 24I, 24J, 24K, 23G non démarrés — en attente de l'approbation du propriétaire.
