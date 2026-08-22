# PHASE 40C — VALIDATION ÉDITORIALE DES 15 FORMES P1

**Statut : `PHASE_40C_IMPLEMENTATION_COMPLETE`**

> Reproduction du workflow éditorial d'Al-Fātiḥah (Phase 23E / 23F-D) : **forme arabe →
> occurrences → ayahs → 4 traductions alignées (2 FR puis EN+IT) → noyau sémantique →
> glose Hikma → décision éditoriale → écriture `word_translations`**.
> 15 gloses validées et écrites ; `0` migration ; `0` moteur modifié ; `0` curriculum modifié.

---

## A. Executive Summary

La Phase 40C a appliqué le workflow éditorial à chacune des 15 formes P1 identifiées en
Phase 40B. Les **15 formes** ont convergé proprement entre les 4 traductions de référence
(Hamidullah FR, Kazimirski FR, Sahih EN, Piccardo IT) sur les **mêmes ayahs**, avec la
référence lexicale **Kazimirski — Dictionnaire arabe-français (1860), domaine public**.

Résultat : **15 gloses FR validées et écrites** dans `word_translations`
(`is_validated = true`, `validated_at` horodaté, source « Hikma — lexique éditorial »),
idempotent (ré-exécution = 0 nouvelle écriture). Le **potentiel lexical** gagne
**2 439 occurrences ≈ +3,15 %** ; la **couverture utilisateur** et le **curriculum** sont
**inchangés**.

---

## B. Workflow Al-Fātiḥah Reproduced

Le processus réellement exécuté, identique au workflow de référence :

```
forme arabe exacte (quran_words.arabic)
  → toutes les occurrences (word_occurrences) → ayahs distincts
  → 4 traductions des MÊMES ayahs (translations, resource_id)
  → comparaison FR : Hamidullah ↔ Kazimirski (noyau français)
  → contrôle interlinguistique : Sahih EN + Piccardo IT
  → noyau sémantique (sens principal / secondaire / stabilité)
  → glose Hikma courte (conforme aux 263 glosses existantes)
  → décision VALIDATE / REVIEW_REQUIRED / REJECT
  → écriture word_translations (idempotente, source + provenance)
```

Aucun « vote automatique » : la convergence est un indicateur de confiance, pas une preuve.
Chaque glose est une **formulation éditoriale Hikma**, jamais une copie de traduction protégée.

---

## C. Data Model Used

| Table / colonne | Rôle | Constat réel |
|---|---|---|
| `quran_words.arabic` | forme arabe exacte (UNIQUE) | point de départ |
| `word_occurrences.ayah_id, word_id` | occurrences → ayahs | comptage réel |
| `ayahs.surah_id, ayah_number` | ayah → sourate / n° | alignement |
| `translations.ayah_id, resource_id, text` | traductions de verset | 4 ressources |
| `word_translations(word_id, language, text, source_id, is_validated, validated_at, editorial_notes)` | lexique FR | cible d'écriture |
| `word_translations_word_lang_source_key` | UNIQUE (word_id, language, source_id) | anti-doublon |
| `word_translations_validation_check` | `is_validated=true ⇔ validated_at NOT NULL` | invariant respecté |
| `sources` | provenance | 6 sources |

**Règle résolution** (`getValidatedFrenchMeanings`, `lib/learning/queries.ts:740`) : lit
`language='fr'` **et** `is_validated=true`, `ORDER BY updated_at DESC` — la première ligne
validée par mot est la glose active. Aucune nouvelle ligne PROPOSÉE n'est utilisée.

---

## D. Candidate Forms

Les 15 formes (formes strictes, **jamais fusionnées** ; `لِلَّه ≠ الله`, `قَالَ ≠ قَالُوا۟`),
avec occurrences réelles recomptées :

| Forme | Occ. | Ayahs distincts | Sourates |
|---|---:|---:|---:|
| قَالَ | 407 | 363 | 41 |
| ذَٰلِكَ | 267 | 258 | 69 |
| أَوْ | 263 | 201 | 56 |
| ٱلْأَرْضِ | 178 | 173 | 52 |
| ٱلسَّمَـٰوَٰتِ | 174 | 172 | 57 |
| قَالُوا۟ | 171 | 164 | 47 |
| كَفَرُوا۟ | 156 | 152 | 52 |
| أُو۟لَـٰٓئِكَ | 133 | 130 | 47 |
| يَوْمَ | 131 | 130 | 53 |
| كُلِّ | 123 | 119 | 53 |
| شَىْءٍۢ | 99 | 94 | 43 |
| ٱلدُّنْيَا | 87 | 84 | 36 |
| يُؤْمِنُونَ | 86 | 84 | 37 |
| تَعْمَلُونَ | 82 | 82 | 38 |
| بَعْدِ | 82 | 78 | 28 |

**Total : 2 439 occurrences.**

---

## E. Occurrence Analysis

Toutes les occurrences ont été récupérées (`word_occurrences.eq('word_id', id)`), dédupliquées
par ayah, triées par sourate/ayah. Un **échantillon réparti** (1er, 33 %, 66 %, dernier) a été
croisé avec les 4 traductions pour détecter un éventuel changement de sens. Aucun glissement
sémantique bloquant n'a été observé sur les 15 formes.

---

## F. Ayah Alignment

Les 4 traductions sont jointes sur **`ayah_id` strictement identique** (`translations_ayah_resource_key
UNIQUE (ayah_id, resource_id)`). Aucune comparaison entre ayahs différents.

---

## G. Hamidullah Analysis

Hamidullah FR (resource **31**) sert de contrôle d'usage coranique français. Ses rendus ont été
utilisés pour confirmer le noyau, jamais copiés textuellement. Exemples :

- قَالَ → « dit / dirent » ; ٱلْأَرْضِ → « la terre » ; ٱلسَّمَـٰوَٰتِ → « les cieux » ;
- كَفَرُوا۟ → « mécru / infidèles » ; تَعْمَلُونَ → « Œuvrez / ce que vous faisiez ».

---

## H. Kazimirski Analysis

Deux ressources Kazimirski distinctes, toutes deux domaine public :

| Ressource | resource_id / source_id | Rôle |
|---|---|---|
| Kazimirski — **Le Koran (1869)** | resource **9001** | 2e traduction FR de contrôle |
| Kazimirski — **Dictionnaire arabe-français (1860)** | source `567c8b5d-…` | **référence lexicale** des gloses |

Les rendus Kazimirski (Le Koran) convergent avec Hamidullah sur le champ sémantique de chaque
forme (ex. ٱلدُّنْيَا → « la vie de ce monde / ici-bas »). Le dictionnaire 1860 fournit
l'équivalent lexical stable (قَالَ = dire ; يَوْم = jour ; بَعْد = après ; أَرْض = terre…).

---

## I. Sahih International Analysis

Sahih International EN (resource **20**) = contrôle interlinguistique anglais :
- قَالَ → said/says ; أَوْ → or ; كُلِّ → every/all ; شَىْءٍۢ → thing ; بَعْدِ → after.

Convergence totale avec le noyau français. Jamais traduit mot-à-mot en français.

---

## J. Piccardo Analysis

Piccardo IT (resource **153**) = contrôle interlinguistique italien :
- قَالَ → disse/dice ; ٱلْأَرْضِ → la terra ; ٱلسَّمَـٰوَٰتِ → i cieli ; يُؤْمِنُونَ → credono.

Convergence totale. Jamais traduit mot-à-mot en français.

---

## K. Cross-Language Comparison

Les 4 ressources convergent sur un champ sémantique unique pour chacune des 15 formes.
Aucune forme n'a présenté de divergence forte ou de polysémie bloquante. Les seuls profils
non strictement monosémiques sont documentés comme sens secondaires, sans empêcher une glose
courte fidèle :

- **كَفَرُوا۟** : sens principal « mécroire / ne pas croire » ; sens secondaire « être ingrat ».
- **تَعْمَلُونَ** : « œuvrer / agir / faire » (racine ع م ل).
- **ذَٰلِكَ** : démonstratif « cela / celui-là » (déictique, rendu contextuel this/that).
- **كُلِّ** : « tout / chaque » (quantificateur).

---

## L. Semantic Core

| Forme | Noyau sémantique | Stabilité |
|---|---|---|
| قَالَ | dire (verbe, 3e sg parfait) | STABLE |
| ذَٰلِكَ | démonstratif « cela / celui-là » | STABLE (déictique) |
| أَوْ | conjonction « ou » | STABLE (monosémique) |
| ٱلْأَرْضِ | la terre | STABLE |
| ٱلسَّمَـٰوَٰتِ | les cieux | STABLE |
| قَالُوا۟ | ils ont dit | STABLE |
| كَفَرُوا۟ | ils ont mécru (sec. : ingrat) | STABLE_WITH_SECONDARY_SENSE |
| أُو۟لَـٰٓئِكَ | démonstratif pluriel « ceux-là » | STABLE |
| يَوْمَ | jour | STABLE |
| كُلِّ | tout / chaque | STABLE_WITH_SECONDARY_SENSE |
| شَىْءٍۢ | chose | STABLE |
| ٱلدُّنْيَا | la vie d'ici-bas (opposé à l'au-delà) | STABLE_WITH_SECONDARY_SENSE |
| يُؤْمِنُونَ | ils croient | STABLE |
| تَعْمَلُونَ | vous œuvrez / agissez | STABLE_WITH_SECONDARY_SENSE |
| بَعْدِ | après | STABLE |

---

## M. Hikma Gloss Proposal

Convention de conjugaison reprise des 263 glosses existantes (نَعْبُدُ → « nous adorons »,
أَنْعَمْتَ → « Tu as comblé de bienfaits ») : les verbes finis sont rendus **conjugués**, pas à
l'infinitif.

| Forme | Glose Hikma |
|---|---|
| قَالَ | il a dit |
| ذَٰلِكَ | cela / celui-là |
| أَوْ | ou |
| ٱلْأَرْضِ | la terre |
| ٱلسَّمَـٰوَٰتِ | les cieux |
| قَالُوا۟ | ils ont dit |
| كَفَرُوا۟ | ils ont mécru |
| أُو۟لَـٰٓئِكَ | ceux-là |
| يَوْمَ | jour |
| كُلِّ | tout / chaque |
| شَىْءٍۢ | chose |
| ٱلدُّنْيَا | la vie d'ici-bas |
| يُؤْمِنُونَ | ils croient |
| تَعْمَلُونَ | vous œuvrez |
| بَعْدِ | après |

---

## N. Editorial Decisions

| Décision | Nombre | Formes |
|---|---:|---|
| **VALIDATE** | **15** | toutes les P1 |
| REVIEW_REQUIRED | 0 | — |
| REJECT | 0 | — |

Justification : les 15 formes sont les candidats « fréquents + lexicalement stables + source
juridiquement exploitable » sélectionnés par 40A/40B ; la confrontation aux 4 traductions
alignées ne révèle **aucune** polysémie bloquante ni divergence forte. Aucune forme n'a été
validée « pour atteindre 15 » ; les sens secondaires sont documentés dans `editorial_notes`.

---

## O. Approved Entries

Les 15 formes, avec provenance :

- **Source d'écriture** : `Hikma — lexique éditorial` (`79e6412e-e349-4fe5-b29b-108237375a2d`),
  cohérent avec les 263 glosses FR existantes.
- **Référence lexicale** : Kazimirski — Dictionnaire arabe-français (1860), domaine public
  (`567c8b5d-ff97-432c-9cb1-8fa88e41f0f4`).
- **`editorial_notes`** : `Phase 40C — validation contrôlée : 4 traductions alignées (Hamidullah FR
  + Kazimirski FR + Sahih EN + Piccardo IT) + référence lexicale Kazimirski 1860 (domaine public).`
  + note sémantique par forme.

---

## P. Review Required

**Aucune.**

---

## Q. Rejected Entries

**Aucune.**

---

## R. DB Writes

`15` lignes insérées dans `word_translations` (service role, script `tmp/phase40c-write.cjs`) :
`language='fr'`, `is_validated=true`, `validated_at` horodaté, `source_id` = Hikma éditorial,
`editorial_notes` renseigné. **Aucun update, aucun delete, aucune autre table modifiée.**

---

## S. Before / After Metrics

| Métrique | Avant | Après | Delta |
|---|---:|---:|---:|
| Formes FR validées (`word_translations` FR) | 263 | **278** | **+15** |
| Formes EN_ONLY (parmi les 15 candidates) | 15 | 0 | −15 |
| Word translations (lignes FR) | 263 | **278** | **+15** |
| Occurrences lexicalement exploitables (potentiel) | 14 522 (enseignées) | 14 522 + 2 439 = 16 961 | **+2 439** |
| Potentiel lexical (si enseignées) | 18,76 % | ≈ **21,91 %** | **+3,15 %** |
| Doublons | 0 | **0** | 0 |
| Entrées invalides | 0 | **0** | 0 |

> Le « potentiel lexical » additionne les occurrences des formes ayant désormais un sens FR ;
> il ne devient de la couverture réelle que si ces formes sont un jour **enseignées**.

---

## T. Lexical Coverage Potential

- `LEXICAL_COVERAGE_POTENTIAL` (formes avec sens FR fiable, enseignées ou non) :
  - enseignées : 14 522 occ = **18,76 %** ;
  - + 15 formes P1 désormais FR : **+2 439 occ ≈ +3,15 %** ;
  - **potentiel cumulé ≈ 21,91 %** (16 961 / 77 430 occurrences).
- Ce gain est un **potentiel**, pas une progression utilisateur.

---

## U. User Comprehension Coverage

- `USER_COMPREHENSION_COVERAGE` : **inchangée (0 delta).**
- Aucun `user_word_progress`, `review_items`, `user_word_skill_progress`, session, SRS, mastery
  ni score n'a été modifié. Aucun utilisateur crédité automatiquement.
- Le resolver (`getValidatedFrenchMeanings`) rend désormais ces gloses **disponibles** pour les
  mots concernés ; il n'enseigne rien par lui-même.

---

## V. Curriculum Integrity

- Formes enseignées : **270** (vérifié `lesson_words` → 270 distincts, inchangé).
- Parcours / leçons / ordre : **inchangés** (aucune table `learning_paths`/`units`/`lessons`/
  `lesson_words` modifiée).
- `selectActiveLearningPath`, Daily Plan, SRS, mastery, onboarding : **aucun fichier modifié**.

---

## W. Resolver Integrity

- `getValidatedFrenchMeanings` (`lib/learning/queries.ts`) **non modifié**.
- Les 15 lignes satisfont exactement son filtre (`language='fr'`, `is_validated=true`) et seront
  donc actives, sans concurrence (aucune ligne FR antérieure sur ces mots).

---

## X. DB Integrity

Vérifié par `tmp/phase40c-postwrite.cjs` :
- 15 lignes, **0** violation (`is_validated=true`, `validated_at` non nul, source existante, arabe existant).
- **0** doublon (contrainte `word_translations_word_lang_source_key` respectée).
- **0** traduction orpheline, **0** source inexistante, **0** mapping invalide.
- Ré-exécution du script d'écriture : `toInsert: 0 | skipped: 15` → **idempotent**.

---

## Y. Tests

- `npx tsc --noEmit` ✅
- `npx eslint .` ✅
- `npx vitest run` → **725/725** ✅ (aucun code modifié, aucun test ajouté/modifié)
- `npm run build` ✅

---

## Z. Remaining Lexical Gaps

- Particules grammaticales (لَا, أَن, إِنْ, مِن/variantes, clitiques و+…) : **BLOCKED** (stratégie contextuelle).
- Flexions de الله / رَبّ déjà-FR non enseignées : **165 formes** (~+1,45 %), à intégrer quand une sourate les contient.
- **5 formes enseignées en fallback EN** : `REVIEW_REQUIRED` (glose FR à fournir ultérieurement).
- Les 15 P2 de 40B (polysémiques/fonctionnels) : non traitées.

---

## AA. Risks / Limitations

1. **`WEB_RESEARCH_LIMITED`** : la licence Kazimirski (1860) repose sur les métadonnées déjà
   documentées dans `sources` (décision projet `LEGAL_GO` / `DOCUMENTED_PUBLIC_DOMAIN`), non
   re-vérifiées en ligne.
2. **Convergence ≠ vérité** : les 4 traductions peuvent partager des choix de traduction
   conventionnels ; le dictionnaire Kazimirski sert de référence lexicale stabilisante.
3. **Sens secondaires** (كَفَرُوا۟, تَعْمَلُونَ, ذَٰلِكَ, كُلِّ) : glose courte retenue = noyau ;
   les nuances restent contextuelles.
4. **Pas d'ajout au curriculum** : ces 15 formes ne deviennent enseignées que si une future phase
   les intègre à une leçon/sourate — hors du présent scope.

---

## AB. Recommended Phase 40D

**Option 1 (recommandée) — intégration pédagogique ciblée** : décider comment/ quand ces 15 formes
(et les 165 déjà-FR non enseignées) entrent dans le parcours, sans toucher au moteur — ex. les
rendre exploitables par les futures sourates ou par un « explorateur de mots fréquents » (rejeté
précédemment, à revalider).

**Option 2 — compléter les 5 fallback EN** des formes enseignées (dont كَانَ) via le même workflow 40C.

**Option 3 — traiter les 15 P2** (revue éditoriale dédiée).

---

## Tableau final

| Élément | État | Justification |
|---|---|---|
| 15 formes P1 analysées depuis l'arabe | ✅ | occurrences réelles → ayahs → 4 traductions alignées |
| 4 ressources identifiées | ✅ | Hamidullah FR=31, Kazimirski FR=9001, Sahih EN=20, Piccardo IT=153 |
| Noyau sémantique | ✅ | 15/15 stable ou stable+sens secondaire |
| Glose Hikma | ✅ | courte, formulée éditorialement |
| Décision éditoriale | ✅ | 15 VALIDATE, 0 REVIEW_REQUIRED, 0 REJECT |
| Écriture DB | ✅ | 15 insert, `is_validated=true`, provenance + notes |
| Idempotence | ✅ | ré-exécution = 0 insertion, 0 doublon |
| Aucune traduction protégée copiée | ✅ | gloses = équivalents lexicaux Kazimirski PD, jamais copie de verset |
| Curriculum / SRS / mastery / resolver | ✅ | inchangés (0 fichier code modifié) |
| Couverture utilisateur | ✅ | inchangée (0 delta) |
| Potentiel lexical | ✅ | +2 439 occ ≈ +3,15 % |
| Tests | ✅ | tsc / eslint / 725 tests / build verts |

---

## Décision finale

**`PHASE_40C_IMPLEMENTATION_COMPLETE`** — 15/15 gloses validées par le workflow éditorial
(4 traductions alignées + Kazimirski 1860), écrites de façon idempotente et validées dans
`word_translations`, sans aucun changement du moteur pédagogique, du SRS, du mastery, du
curriculum ni de la couverture utilisateur. Aucun commit, aucun push.
