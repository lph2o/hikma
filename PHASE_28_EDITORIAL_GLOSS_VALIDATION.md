# PHASE 28 — Validation éditoriale MASAQ + consolidation de la couche linguistique

**Décision finale : `MASAQ_LINGUISTIC_LAYER_CONSOLIDATED`**

Workflow respecté : `AUDIT READ_ONLY → VALIDATION HUMAINE → IMPORT CONTRÔLÉ →
NON-RÉGRESSION → TESTS → VALIDATION NAVIGATEUR → RAPPORT`.

---

## 1. Contexte

Phase 27 a importé MASAQ pour 4 sourates supplémentaires (108/112/113/114) et a
laissé **4 propositions de gloses FR** en attente de validation humaine. La
Phase 28 clôt cette boucle éditoriale et consolide la couche linguistique, sans
toucher au grading, SRS, mastery, progression, curriculum ni scoring.

---

## 2. État avant phase

| Compteur | Valeur |
|---|---|
| quran_words | 21 296 |
| word_occurrences | 77 430 |
| ayahs | 6 236 |
| translations | 24 944 |
| lemmas | 32 |
| word_translations | **70** |
| lemma_translations | 32 |
| word_lemma_mapping | 184 |
| linguistic_occurrences | 97 |
| linguistic_segments | 170 |

Al-Fātiḥah : **29 occurrences · 26 formes · 25 gloses FR · 26 audios** —
`FATIHAH_REFERENCE_LOCKED = TRUE`.

---

## 3. Inventaire des 5 sourates MASAQ

| Sourate | Occurrences MASAQ | Segments |
|---|---|---|
| 1 — Al-Fātiḥah (référence verrouillée) | 29 | 56 |
| 108 — Al-Kawthar | 10 | 21 |
| 112 — Al-Ikhlāṣ | 15 | 25 |
| 113 — Al-Falaq | 23 | 33 |
| 114 — An-Nās | 20 | 35 |
| **Total** | **97** | **170** |

---

## 4. Distinction Al-Fātiḥah / 4 nouvelles sourates

Il ne s'agit PAS de « 4 sourates MASAQ au total ». Il y a :
- **1 sourate de référence clôturée** : Al-Fātiḥah (Phase 24G) ;
- **4 sourates ajoutées** en Phase 27 : 108 / 112 / 113 / 114.
**TOTAL = 5 sourates couvertes** (97 occurrences, 170 segments).

---

## 5. Audit des 4 gloses (READ_ONLY)

Les formes réelles en base (source Quran.com, jamais la forme MASAQ) ont été
vérifiées par position `(surah, ayah, position)` :

| Proposition | Forme réelle | Occurrences | Glose EN (MASAQ/évidence) | Résolution AVANT import |
|---|---|---|---|---|
| ٱللَّهُ → « Allah » | ٱللَّهُ | 112:1, 112:2 | Allah | **« Allah »** (lemme 62b46eb1, validé) |
| فِى → « dans » | فِى | 113:4, 114:5 | In | **« dans / en / sur »** (lemme فِي, validé) |
| ٱلنَّاسِ → « les gens » | ٱلنَّاسِ | 114:1,2,3,5 | the people | **« gens / hommes »** (lemme نَاس, validé) |
| وَٱلنَّاسِ → « et les gens » | وَٱلنَّاسِ | 114:6 | and the mankind | **« gens / hommes »** (mapping نَاس, safe) |

**⚠️ Découverte majeure :** les 4 formes **résolvaient DÉJÀ en français validé**
via la couche LEMME/MAPPING (la chaîne `FORME > LEMME > MAPPING > EN`). La
prémisse Phase 26/27 « 4 formes en fallback EN » provenait d'une mesure au
**niveau FORME uniquement** (`word_translations`), sans la couche lemme. Preuve
par exécution réelle du resolver de production (`tmp/phase28-resolve.ts`).

Les traductions d'ayah (Hamidullah/Kazimirski) ont été consultées comme
**évidence contextuelle uniquement** (ex. 112:1 « Dis : Il est Allah, Unique »,
114:1 « …Seigneur des hommes », 113:4 « …sur les nœuds ») — jamais copiées en
glose lexicale.

---

## 6. Décisions humaines

Validation humaine explicite (ask_user) : **ACCEPT les 4 propositions en niveau
FORME** (`word_translations`), malgré la couverture lemme existante — raffinement
éditorial délibéré (la glose de forme prime désormais sur la glose de lemme pour
ces 4 formes).

| FORME | PROPOSITION | DÉCISION | GLOSE FINALE | JUSTIFICATION | CONFIANCE |
|---|---|---|---|---|---|
| ٱللَّهُ | Allah | **ACCEPT** | Allah | Nom divin, sens stable ; quasi-doublon ٱللَّهِ validé | HIGH |
| فِى | dans | **ACCEPT** | dans | Préposition, glose concise (§11) ; variantes « en/à » = contexte | HIGH |
| ٱلنَّاسِ | les gens | **ACCEPT** | les gens | ال + ناس ; cohérent avec وَٱلنَّاسِ | HIGH |
| وَٱلنَّاسِ | et les gens | **ACCEPT** | et les gens | و + ال + ناس, compositionnel | HIGH |

---

## 7. Imports effectués

- **Table** : `word_translations` (langue `fr`, `is_validated=true`, `validated_at`
  horodaté, `source_id` = « Hikma — lexique éditorial »).
- **4 insertions** · 0 divergence · idempotence vérifiée (RUN 2 → 0 insertion,
  4 doublons).
- Aucune suppression, aucun remplacement arbitraire, aucune autre table touchée.

---

## 8. Provenance

- Source linguistique MASAQ v2 (Sawalha / University of Jordan, Mendeley Data),
  DOI `10.17632/9yvrzxktmr.2`, checksum `777d0cc8…a900`, licence CC BY 3.0/4.0 —
  **conservée, inchangée**.
- Gloses FR : « Hikma — lexique éditorial » (jamais 31/9001/20/153, jamais copiées
  d'une traduction d'ayah).
- **Aucune nouvelle source linguistique ajoutée** (pas de QAMAR, Quranic Arabic
  Corpus, Qabas).

---

## 9. Compteurs avant / après

| Table | Avant | Après | Delta |
|---|---|---|---|
| quran_words | 21 296 | 21 296 | 0 |
| word_occurrences | 77 430 | 77 430 | 0 |
| ayahs | 6 236 | 6 236 | 0 |
| translations | 24 944 | 24 944 | 0 |
| lemmas | 32 | 32 | 0 |
| **word_translations** | 70 | **74** | **+4** |
| lemma_translations | 32 | 32 | 0 |
| word_lemma_mapping | 184 | 184 | 0 |
| linguistic_occurrences | 97 | 97 | 0 |
| linguistic_segments | 170 | 170 | 0 |
| linguistic_lemmas | 0 | 0 | 0 |
| linguistic_roots | 0 | 0 | 0 |

Seule variation : `word_translations +4` (exactement les 4 décisions approuvées).
Al-Fātiḥah strictement inchangée (aucune des 4 formes n'appartient à ses 26 formes).

---

## 10. Tests

- `npm test` : **539 tests / 42 fichiers — PASS**.
- `npx tsc --noEmit` : **0 erreur**.
- `npm run lint` : **PASS**.
- `npm run build` : **PASS** (Next.js 16.3.0, Turbopack).

---

## 11. Validation navigateur (headless Chrome)

4 formes testées sur la fiche mot (`/mots/[id]`), mobile 390×844 + desktop 1280×720 :

| Forme | Glose affichée | Badge « Sens français validé » | Fallback EN |
|---|---|---|---|
| ٱللَّهُ | « Allah » ✅ | ✅ | ❌ |
| فِى | « dans » ✅ | ✅ | ❌ |
| ٱلنَّاسِ | « les gens » ✅ | ✅ | ❌ |
| وَٱلنَّاسِ | « et les gens » ✅ | ✅ | ❌ |

- **RTL** présent (`dir="rtl"`) · **0 overflow** (mobile + desktop) ·
  **0 erreur console** · **aucun tag MASAQ brut** affiché.

---

## 12. Anomalies

1. La prémisse Phase 26/27 « 4 formes en fallback EN » était fondée sur une
   mesure FORME uniquement ; les 4 formes résolvaient déjà en FR validé via la
   couche lemme/mapping. Documenté, non bloquant, corrigé par le raffinement de
   forme de cette phase.

---

## 13. Limites restantes

1. **Racine / schème** : `ABSENT_DATA` / `FUTURE_WORK` — `linguistic_roots` vide,
   jamais déduits.
2. **Bloc syntaxe MASAQ** rare en pratique (priorité basse + plafond 2 blocs) —
   comportement voulu.
3. **Couverture lemme** hors Fātiḥah clairsemée → bloc « famille » rare (absence
   honnête).

---

## 14. Décision finale

**`MASAQ_LINGUISTIC_LAYER_CONSOLIDATED`** — avec :

- Al-Fātiḥah = référence verrouillée (`FATIHAH_REFERENCE_LOCKED = TRUE`) ;
- 108 / 112 / 113 / 114 = extensions validées ;
- **5 sourates couvertes** · **97 occurrences** · **170 segments** ;
- provenance conservée · aucune régression · runtime stable.

À partir de cette décision, **plus aucun ajout spontané de données MASAQ**. Toute
extension future suivra : `AUDIT SOURCE → LICENCE → ALIGNEMENT → PILOTE READ_ONLY
→ VALIDATION → APPROVAL → MIGRATION → IMPORT → INTÉGRATION → NON-RÉGRESSION`.

---

## 15. Recommandation Phase 29

Passer à **PHASE 29 — ONBOARDING & DISCOVERY EXPERIENCE**, en commençant par un
**AUDIT READ_ONLY** (architecture, authentification, profil utilisateur, données
utilisateur, progression, curriculum, SRS, mastery, préférences, objectifs,
historique). Ne pas coder d'écran avant l'audit.

---

## PROMPT PHASE SUIVANTE (copiable)

```
PHASE 29 — ONBOARDING & DISCOVERY EXPERIENCE (AUDIT READ_ONLY)

CONTEXTE
Phase 28 clôturée : MASAQ_LINGUISTIC_LAYER_CONSOLIDATED. 5 sourates couvertes
(1/108/112/113/114), 97 linguistic_occurrences, 170 linguistic_segments,
FATIHAH_REFERENCE_LOCKED = TRUE, provenance MASAQ v2 conservée. 4 gloses FR
éditoriales validées humainement et importées (word_translations 70 → 74).
539 tests PASS, tsc/lint/build PASS, validation navigateur PASS. grading/SRS/
mastery/progression/curriculum/scoring inchangés.

OBJECTIF
Commencer l'onboarding. NE PAS coder d'écran : commencer par un AUDIT READ_ONLY.
Analyser l'existant :
- architecture (routes app/, groupes (app)/(onboarding), layouts) ;
- authentification (Supabase auth, lib/supabase/server, middleware) ;
- profil utilisateur (user_settings, onboarded, daily_goal_type/value) ;
- données utilisateur (user_word_progress, review_items, user_activity_*) ;
- progression / curriculum / SRS / mastery (lib/learning/*) ;
- préférences / objectifs / historique existants.
Déterminer ce qui existe déjà et ce qui manque pour comprendre le profil
pédagogique de l'utilisateur.

QUESTIONS D'ONBOARDING À ÉTUDIER (utilité pédagogique réelle uniquement)
- lit l'arabe ? récite le Coran ? comprend l'arabe ? niveau de vocabulaire ?
- objectif principal (comprendre les mots / comprendre les sourates) ?
- temps disponible par jour / fréquence souhaitée ?
- sourates déjà connues ? objectifs ? rythme (progressif / intensif) ?
Chaque question doit avoir une utilité pédagogique réelle (aucune question inutile).

CONTRAINTES
- Audit READ_ONLY : aucune écriture DB, aucune migration, aucun écran codé.
- Ne pas importer de source, ne pas modifier grading/SRS/mastery/curriculum.
- Ne pas ajouter de données MASAQ (couche consolidée).
- Hikma ne doit pas devenir une app de points/streaks : la progression reste
  reliée à un objectif pédagogique réel.

DÉCISION FINALE ATTENDUE
A — ONBOARDING_READY (spécification validée, prête pour design/implémentation)
B — AUDIT_COMPLETED_DESIGN_REQUIRED
C — BLOCKER_DETECTED

LIVRABLES
PHASE_29_ONBOARDING_AUDIT.md
tmp/phase29-onboarding-audit.json

Toujours terminer par le prompt de la phase suivante (Phase 30).
```
