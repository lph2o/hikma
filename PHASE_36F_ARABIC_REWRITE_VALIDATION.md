# PHASE 36F — VALIDATION RÉELLE DU RETRY ARABE & POLISH UX

Statut final : `PHASE_36F_VALIDATION_COMPLETE_WITH_POLISH_RECOMMENDATIONS`

---

## 1. STATUT FINAL

`PHASE_36F_VALIDATION_COMPLETE_WITH_POLISH_RECOMMENDATIONS`

Le retry arabe de Phase 36E est **fonctionnellement correct** (validation
statique + automatisée + validation navigateur **partielle mais réelle**). Un
polish de correction a été appliqué (sélection combinée sans chevauchement) et
des recommandations non bloquantes restent listées en §14.

---

## 2. FICHIERS INSPECTÉS

- `lib/learning/session.ts` — `selectMiniReviewWords`, `selectArabicRewriteRetryWords`, `selectReinforcementWords`
- `components/learn/lesson-player.tsx` — `pendingFinish`, `continueNext`, phase `miniReview`
- `components/learn/mini-review.tsx` — étapes `arabic` / `self`
- `lib/learning/lesson-copy.ts` — `isArabicRewriteExact` + copy retry
- `lib/exercises/grading.ts` — `normalizeArabicGrading` (réutilisée, non modifiée)
- `lib/ui/radio-group-keyboard.ts`, `lib/ui/arabic-input.ts`, `components/ui/arabic-keyboard.ts`
- `tests/lesson-experience.test.ts`
- `tmp/phase24j-*.cjs`, `tmp/phase25-browser-audit.cjs` (harness Playwright historiques)

---

## 3. FICHIERS MODIFIÉS (polish)

| Fichier | Modification | Raison |
| ------- | ------------ | ------ |
| `lib/learning/session.ts` | Ajout `selectReinforcementWords` + `ReinforcementSelection` | Corrige un cas limite : la 5e erreur `meaning_to_form` (hors plafond) **ne doit pas** fuiter vers l'auto-évaluation ; plafonds indépendants retry/self |
| `components/learn/lesson-player.tsx` | Utilise `selectReinforcementWords` | Centralise la sélection combinée (testable) |
| `lib/learning/lesson-copy.ts` | Ajout `getArabicRewriteReassuranceCopy` | Réassurance « Cette tentative ne change pas ton score. » |
| `components/learn/mini-review.tsx` | Affiche la réassurance sous le champ | Répond au « pourquoi je fais cet exercice ? » |
| `tests/lesson-experience.test.ts` | +5 tests `selectReinforcementWords` | Couvre le non-chevauchement |
| `tmp/phase36f-browser.cjs` / `.json` | Script + résultat de validation navigateur | Scratch gitignoré (convention du projet) |

---

## 4. TESTS RÉALISÉS & RÉSULTATS

- `npx tsc --noEmit` → ✅
- `npx eslint` (fichiers modifiés) → ✅
- `npx vitest run` → **671 / 671 tests** (51 fichiers ; +5 vs 666)
- `npm run build` → ✅

Nouveaux tests `selectReinforcementWords` : aucune erreur ; 1 arabe + 1 sens
séparés sans doublon ; 4 arabe + 4 sens → 4/4 (plafonds indépendants) ; 5+
arabe → retry plafonné à 4 **et la 5e ne fuit pas vers l'auto-éval** ; mot
correct exclu.

---

## 5. SCÉNARIOS NAVIGATEUR (RÉELS)

**Validation navigateur RÉELLE effectuée** via Playwright + Chrome headless
(`tmp/phase36f-browser.cjs`) contre `http://localhost:3000` (serveur actif,
code 36C/36E confirmé servi) :

| Contrôle | 390×844 | 375×812 | 1280×720 |
| -------- | ------- | ------- | -------- |
| Chargement `/learn/basmala` | 200 | 200 | 200 |
| Erreurs console | 0 | 0 | 0 |
| Anticipation de session | ✅ | ✅ | ✅ |
| Signature « tu le récites peut-être déjà » | ✅ | ✅ | ✅ |
| Navigation flèche du radiogroup | ✅ (focus déplacé) | ✅ | ✅ |
| Overflow horizontal | non | non | non |

**Observations réelles** :
- Le radiogroup répond à `ArrowRight` (focus : « le Tout Miséricordieux » →
  « au nom de ») — la correction accessibilité 36C est **vérifiée en vrai**.
- L'anticipation et la signature (36C) sont bien rendues : le serveur exécute le
  code le plus récent.

---

## 6. DIMENSIONS TESTÉES

`390×844`, `375×812`, `1280×720` — chargement, erreurs console, anticipation,
signature, radiogroup clavier, overflow. **Aucun overflow horizontal** observé.

---

## 7. ACCESSIBILITÉ

- **Radiogroup flèches** : validé en navigateur réel (voir §5).
- **Champ arabe** : `dir="rtl"`, `lang="ar"`, `inputMode="text"`,
  `aria-label` explicite, focus visible, `h-14` (statique — le champ n'a pas été
  atteint en navigateur, cf. §13).
- **Feedback** : `role="status" aria-live="polite"` (audio), textes non punitifs.
- **Reduced motion** : `prefers-reduced-motion` global inchangé ; le retry ne
  dépend d'aucune animation (aucune transition animée ajoutée).

---

## 8. RTL

- Champ `dir="rtl"`, `lang="ar"` ; clavier arabe Hikma (`ArabicKeyboard`) ;
  insertion/backspace au curseur (`lib/ui/arabic-input`) ; forme canonique
  rendue par `ArabicText` (Amiri, RTL), jamais modifiée.
- Non observé en navigateur (le champ RTL apparaît dans un exercice
  `MEANING_TO_FORM`, non atteint dans le smoke test).

---

## 9. REDUCED-MOTION

Aucune animation n'est requise pour le retry ; `prefers-reduced-motion` reste
respecté. Aucune régression introduite.

---

## 10. RECHERCHE UX EXTERNE

`WEB_RESEARCH_LIMITED` (inchangé) — l'outil de recherche web reste indisponible
dans cet environnement. Aucune source fraîche nouvelle citée.

---

## 11. INVARIANTS VÉRIFIÉS (non-régression)

Le retry arabe **ne déclenche pas** `validateAnswer`, ne modifie pas
`user_word_progress`, SRS, mastery, score, `skillAttempts`, ni aucune session.
`normalizeArabicGrading` est réutilisée en lecture seule. Invariants intacts :
onboarding (32), progression par sourate (34), active path (35),
`FATIHAH_REFERENCE_LOCKED`, Al-Māʿūn 107 `IN_PREPARATION`, 114 sourates, 90
leçons, 14 parcours, `word_translations = 263`, MASAQ `97 / 170`. Aucune
migration, aucune table, aucun commit.

---

## 12. LIMITATIONS RÉELLES

- **`BROWSER_VALIDATION_LIMITED` pour le flux complet du retry** : déclencher une
  erreur `meaning_to_form`, terminer la séquence principale et observer le retry
  (champ RTL, feedback exact/différent/vide, une seule occurrence, fin de leçon)
  exige un **compte de test authentifié** et l'exécution complète d'une leçon.
  Non réalisé ici — non déclaré PASS.
- La partie **atteignable sans compte** a été validée en vrai (voir §5).

---

## 13. AMÉLIORATIONS RESTANTES (non bloquantes)

1. **P2** — Valider le flux complet du retry en navigateur avec un compte de test
   (scénarios §4 de la phase 36F : exact / différent / vide / skip / une seule
   occurrence / pas de boucle / fin normale).
2. **P3** — Décider d'un éventuel `autoFocus` sur le champ arabe desktop (le
   `autoFocus` mobile ouvrirait le clavier natif de façon intrusive — à éviter
   par défaut).
3. **P3** — Tester la superposition clavier natif vs clavier Hikma sur petit
   écran (risque résiduel connu).

---

## 14. DÉCISION FINALE

`PHASE_36F_VALIDATION_COMPLETE_WITH_POLISH_RECOMMENDATIONS`

- Aucun problème fonctionnel du retry arabe identifié.
- Un polish de correction a été appliqué (`selectReinforcementWords` — plafonds
  indépendants + non-fuite de la 5e erreur arabe) et couvert par tests.
- Une **validation navigateur réelle mais partielle** a été réalisée (chargement,
  console, anticipation, signature, radiogroup clavier, overflow) ; le flux
  complet du retry reste `BROWSER_VALIDATION_LIMITED` faute de compte de test.

Aucun commit n'a été créé.
