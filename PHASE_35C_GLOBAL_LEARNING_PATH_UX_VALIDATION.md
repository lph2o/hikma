# PHASE 35C — GLOBAL LEARNING PATH UX VALIDATION & CROSS-SURFACE CONSISTENCY

Statut final : `PHASE_35C_VALIDATION_COMPLETE_WITH_BROWSER_LIMITATION`

---

## 1. BEFORE_STATE

La Phase 35B a harmonisé le concept de **parcours actif** :

- `selectActiveLearningPath` (pur) sélectionne le parcours selon la hiérarchie
  `session active → progression réelle → recommandation → fallback Al-Fātiḥah` ;
- le dashboard, `/learn`, `/learn/units/[slug]` et `/profile` sont devenus
  surah-aware ;
- `computeLessonStatuses` → `computeSurahProgress` reste la source de vérité
  unique de la progression ;
- Al-Fātiḥah reste le parcours de référence / fallback, mais ne remplace jamais
  une progression réelle ailleurs ;
- `preferred_surah_number` ne produit jamais « Continuer ».

Cette phase 35C a pour but de vérifier la cohérence réelle entre les surfaces
et de corriger toute divergence résiduelle.

---

## 2. SCÉNARIOS TESTÉS (audit statique + tests unitaires)

| # | Scénario | Résultat attendu |
| - | -------- | ---------------- |
| 1 | Aucune progression | `Découvrir Al-Fātiḥah` (recommandation) |
| 2 | Progression uniquement Al-Fātiḥah | `Continuer Al-Fātiḥah` |
| 3 | Progression uniquement Al-ʿAṣr (103) | `Continuer Al-ʿAṣr` (jamais Al-Fātiḥah) |
| 4 | Session active Al-ʿAṣr | `Reprendre Al-ʿAṣr` |
| 5 | Plusieurs sourates commencées | la plus avancée, déterministe |
| 6 | Sourate terminée | `✓ Terminée` + `Revoir` |
| 7 | Plusieurs sourates terminées | section `Parcours terminés` |
| 8 | Toutes les leçons terminées + révisions SRS dues | `Réviser`, `completed` inchangé |
| 9 | Préférence ≠ progression réelle | progression réelle gagne |
| 10 | Utilisateur historique (préférences NULL) | neutre, fallback si aucune progression |

---

## 3. RÉSULTATS

L'audit a confirmé que la règle produit fondamentale est respectée sur toutes
les surfaces :

- `Dashboard` — `selectActiveLearningPath` pilote le CTA principal ; session
  active → « Reprendre », progression → « Continuer X/Y », sinon « Découvrir ».
- `/learn` — résout le parcours actif via `selectActiveLearningPath` +
  `getLearningContext({ surahNumber })` ; ne force plus `quran-vocabulary`.
- `/learn/units/[slug]` — résout le path de l'unité globalement ; la navigation
  directe vers une unité reste prioritaire sur la sélection automatique.
- `/surahs` — `not_started`/`in_progress`/`completed` + compteurs réels ;
  `IN_PREPARATION` (Al-Māʿūn 107) hors progression/CTA/recommandation.
- `/profile` — statistiques désormais globales (mots appris/maîtrisés/moyenne
  sur toutes les sourates, plus « à réviser » global).
- Célébration — `isSurahCompletionTransition` exige la vraie transition
  `completed_before = total - 1 → completed_after = total` ; pas de célébration
  sur `nextLesson === null` seul, ni au rechargement, ni en révision.

---

## 4. DIVERGENCES TROUVÉES

Deux incohérences résiduelles ont été identifiées et corrigées :

### DIVERGENCE 1 — P1 — « Découvrir » une sourate déjà terminée

`selectActiveLearningPath` acceptait une recommandation pointant vers une
sourate déjà `completed`. Conséquence : un utilisateur ayant terminé **toutes**
les sourates disponibles recevait une carte « Pour toi / Découvrir » pointant
vers une sourate qu'il avait déjà finie, en contradiction avec le message
« Ton parcours est terminé ».

**Correction** : la branche « recommandation » n'est désormais retenue que si
la sourate visée est réellement `not_started`. Sinon la sélection retombe sur la
première sourate démarrable non commencée (`fallback`), ou sur `all_done` si
toutes les sourates démarrables sont terminées.

### DIVERGENCE 2 — P2 — Justification de recommandation incohérente

Le dashboard calculait `getRecommendationReason(profile, recommendation)` à
partir de la **recommandation brute**, sans tenir compte de la sourate
effectivement sélectionnée. Lorsque la sélection retombait sur un fallback
différent, la justification affichée pouvait décrire une sourate autre que
celle montrée.

**Correction** : la justification est désormais calculée à partir de la sourate
effectivement sélectionnée (`selection.surahNumber`), uniquement pour les kinds
`recommendation` et `fallback`. La raison est toujours vraie.

---

## 5. CORRECTIONS EFFECTUÉES

- `lib/learning/active-path.ts` : branche recommandation limitée aux sourates
  `not_started` ; fallback `all_done` quand tout est terminé.
- `app/(app)/dashboard/page.tsx` : `recommendationReason` dérivé du parcours
  sélectionné (jamais de la recommandation brute).
- `tests/active-path.test.ts` : 2 nouveaux tests (recommandation vers sourate
  terminée → fallback ; toutes terminées → all_done).

---

## 6. TESTS AJOUTÉS / VÉRIFIÉS

`tests/active-path.test.ts` couvre désormais 17 cas, dont :

- session active prioritaire ;
- progression réelle prioritaire ;
- recommandation seulement après progression ;
- fallback Al-Fātiḥah ;
- `IN_PREPARATION` refusée (session active et données de progression incluses) ;
- préférence seule ≠ progression (aucun paramètre « préférence » n'existe) ;
- **nouveau** : recommandation vers sourate terminée → fallback ;
- **nouveau** : toutes sourates terminées → `all_done` (pas de « Découvrir »).

La suite complète : **637 / 637 tests** (50 fichiers).

---

## 7. NON-RÉGRESSION

Aucune modification fonctionnelle apportée à :

- grading ; scoring ; réponses libres ; SRS ; mastery ; scheduler ;
- interleaving ; curriculum ; audio ; LessonPlayer ; données Quran ;
- traductions ; MASAQ ; corpus lexical ; `FATIHAH_REFERENCE_LOCKED`.

Invariants vérifiés inchangés :

- 114 sourates ; 90 leçons publiées ; 14 parcours exposables ;
- Al-Māʿūn 107 = `IN_PREPARATION` (aucun CTA, aucune progression) ;
- `word_translations = 263` ; MASAQ `97 / 170` ;
- progression utilisateur inchangée (couche pure de lecture uniquement) ;
- aucune migration créée, aucune écriture Supabase par les surfaces auditées.

---

## 8. BROWSER VALIDATION

`BROWSER_VALIDATION_LIMITED`

Aucun navigateur contrôlable n'a pu être attaché dans cet environnement. Les
scénarios suivants n'ont **pas** été validés visuellement et ne sont pas
déclarés PASS :

- viewports `390×844`, `375×812`, `1280×720` ;
- navigation clavier / focus / ordre de tabulation ;
- contraste réel teal/or ;
- responsive (aucun overflow horizontal, cartes au doigt) ;
- RTL arabe (progression, flèches, icônes, alignements) ;
- `prefers-reduced-motion` en conditions réelles ;
- console / erreurs d'hydratation.

---

## 9. LIMITATIONS

- La validation est **statique** (lecture du code) + **tests unitaires** ; elle
  ne remplace pas une validation navigateur.
- La célébration de fin de sourate est déclenchée côté client ; sa logique de
  transition a été vérifiée par tests unitaires, mais pas observée en
  conditions réelles.

---

## 10. AFTER_STATE

- Le concept de **parcours actif** est cohérent sur `dashboard`, `/learn`,
  `/learn/units/[slug]`, `/surahs` et `/profile`.
- Trois notions restent visuellement et techniquement distinctes :
  - **Session** → « Reprendre » ;
  - **Progression** → « Continuer X/Y » ;
  - **Recommandation** → « Découvrir / Pour toi ».
- Al-Fātiḥah = référence + fallback, jamais le parcours actif d'un utilisateur
  ayant une progression réelle ailleurs.
- `preferred_surah_number` ne fabrique jamais un `in_progress`.

---

## 11. DÉCISION FINALE

`PHASE_35C_VALIDATION_COMPLETE_WITH_BROWSER_LIMITATION`

La base est saine : les deux divergences résiduelles (P1 « Découvrir une sourate
terminée », P2 « justification incohérente ») ont été identifiées, corrigées et
couvertes par tests. La validation navigateur reste limitée par l'absence
d'environnement contrôlable et est honnêtement documentée comme telle.

Aucun commit n'a été créé.
