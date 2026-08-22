# PHASE 44B — EXPLICATIONS PÉDAGOGIQUES DE SENS : IMPLÉMENTATION

**Statut** : `PHASE_44B_PEDAGOGICAL_EXPLANATIONS_COMPLETE`

## A. Executive Summary

La couche « EXPLICATION DE SENS » de Hikma est implémentée de façon
**conservatrice et passive** : 13 explications françaises validées (formes
sensibles/polysémiques/idiotiques), 1 override contextuel (`فَأُمُّهُۥ` en 101:9),
dans deux nouvelles tables (`word_explanations` + `word_explanation_contexts`,
migration `0031`). Aucune donnée pédagogique existante n'a été modifiée,
aucun moteur (resolver, SRS, mastery, coverage, curriculum, exercices) n'a été
touché. L'explication s'affiche **après l'effort**, dans le conteneur
`HikmaExplanation` existant, uniquement lorsqu'elle existe (jamais de bloc vide).

- **13/13 explications validées** (`is_validated=true`, source « Hikma — lexique
  éditorial », une seule source, 0 doublon).
- **1 override contextuel validé** (`فَأُمُّهُۥ` → 101:9 : « sa mère » = sa demeure).
- **4 formes rejetées** (glose suffisante — pas d'explication artificielle).
- **0 NEEDS_REVIEW · 0 REJECTED · 0 blocage.**
- **Seuil anti-inflation respecté** : 13 formes expliquées sur 330 (bien sous
  la fourchette 50-80, qualité > quantité).
- **Tests** : tsc ✅ · eslint ✅ · **733/733** (726 + 7 nouveaux) ✅ · build ✅.

## B. Architecture retenue

Niveau **FORME** (aligné sur le resolver `FORME > LEMME > EN` existant — les
lemmes Hikma ne sont que 32, les formes peuvent avoir des usages contextuels
distincts) :

1. **`word_explanations`** — explication générique par forme (français),
   valable dans les usages couverts.
2. **`word_explanation_contexts`** — override contextuel par `(word_explanation,
   ayah)` pour les cas où le sens doit être précisé différemment (idiome,
   polysémie par verset). Le contexte **n'écrase pas** la glose ni
   l'explication générique : il la précise.

Résolution **pure** (`lib/learning/sense-explanation.ts`) :
`explication générique validée` → `override contextuel validé (surah:ayah du
verset réel)` → sinon `null` (absence = état valide, jamais d'explication
fabriquée).

## C. Migration

`supabase/migrations/0031_word_explanations.sql` — suit exactement les
conventions de `0019_word_translations.sql` et `0021_lemma_translations.sql` :

- `word_explanations` : `id`, `word_id` (FK quran_words), `language`, `text`,
  `source_id` (FK sources), `is_validated` (default false), `validated_at`,
  `editorial_notes`, `created_at`, `updated_at` + **`UNIQUE(word_id, language,
  source_id)`** (idempotence) + index `(word_id, language)`.
- `word_explanation_contexts` : `id`, `word_explanation_id` (FK, cascade),
  `ayah_id` (FK ayahs), `text`, `source_id`, `is_validated`, `validated_at`,
  `editorial_notes`, timestamps + **`UNIQUE(word_explanation_id, ayah_id)`**.
- RLS alignée : lecture publique, écriture authentifiée/administrateur
  (mêmes policies que les tables lexicales).
- Aucune table existante modifiée. Aucune migration antérieure touchée.
  Appliquée via `npm run db:migrate` (mécanisme existant, vérifié par requête
  réelle : tables créées, 0 ligne avant écriture).

## D. Formes sélectionnées (13)

Reconstruites depuis la DB (word_ids réels ; les formes à signes combinants
variables ne matchent pas l'égalité exacte de chaîne, d'où résolution par
identifiant). Priorités issues de 44A/44B :

| Forme | Occ. sourates | Type | Priorité | Glose actuelle (réf.) |
|---|---:|---|---|---|
| فَأُمُّهُۥ | 101:9 | IDIOMATIQUE | P1 | « sa mère (= sa demeure) » |
| هَاوِيَةٌۭ | 101:9 | NOM PROPRE / CONTEXTUEL | P1 | « l'abîme / le gouffre » |
| لَهَبٍۢ | 111:1,3 | NOM PROPRE + LEXICAL | P1 | « flamme » |
| يَدَآ | 111:1 | DUEL | P1 | « les deux mains » |
| مَّسَدٍۢ | 111:5 | TERME SPÉCIFIQUE | P1 | « corde de fibres » |
| ٱلْقَدْرِ | 97:1-3 | POLYSÉMIQUE | P2 | « le décret / le destin » |
| ٱلْقَارِعَةُ | 101:1-3 | POLYSÉMIQUE / NOM DU JOUR | P1 | « le fracas » |
| نَارٌ | 101:11 | CONTEXTUEL | P3 | « un feu » |
| كَٱلْفَرَاشِ | 101:4 | CLITIQUE (comparaison) | P2 | « comme les papillons » |
| أَنزَلْنَـٰهُ | 97:1 | VERBE CONTEXTUEL | P2 | « Nous l'avons fait descendre » |
| مَن | 101:6-7 | GRAMMATICAL (relatif) | P3 | « celui qui / quiconque » |
| مَنْ | 101:8-9 | GRAMMATICAL (relatif) | P3 | « celui qui / quiconque » |
| مَوَٰزِينُهُۥ | 101:6,8 | CLITIQUE + suffixe | P2 | « ses balances » |

`مَن` et `مَنْ` sont deux `word_id` distincts (modèle Hikma FORME), traités
séparément, même glose.

## E. Cas contextuels

**1 override** — `فَأُمُّهُۥ` (101:9) :
- Glose : « sa mère (= sa demeure) ».
- Explication générique : « Expression idiomatique : "sa mère" désigne ici le
  lieu où l'on retourne, la demeure finale ».
- Override contextuel (101:9) : « Dans ce verset, "sa mère" = sa demeure : le
  damné n'a pour refuge que le gouffre de l'Enfer. »

Le `word_explanation_contexts` est vérifié en DB (1 ligne, FK explication et
ayah valides, `is_validated=true`).

## F. Cas sensibles (arbitrés, documentés dans `editorial_notes`)

- **ٱلْقَدْرِ** : polysémie (destin / décret / puissance / valeur / mesure)
  arbitrée comme en 41B → « décret, destin » (nuit du décret), note explicite.
- **ٱلْقَارِعَةُ** : épithète/nom du Jour de la Résurrection, noyau « fracas /
  coup » — note sur la dimension contextuelle (les 4 traductions convergent).
- **فَأُمُّهُۥ** : idiome documenté (refuge/demeure), jamais réduit à « sa
  mère » littéral.
- **هَاوِيَةٌۭ** : Al-Hâwiya, nom de l'Enfer — note explicite (la fosse), pas
  un simple gouffre géographique.
- **لَهَبٍۢ** : double usage 111:1 (surnom Abū Lahab) / 111:3 (flamme) — les
  deux usages sont dans la sourate, explication couvre les deux.
- **يَدَآ** : duel explicite (111:1), « les deux mains » d'Abū Lahab = sa
  personne.
- **مَّسَدٍۢ** : « corde de fibres de palmier » (111:5), convergence EN/IT.
- **أَنزَلْنَـٰهُ** : « nous » de majesté (Dieu), objet = le Coran (97:1).
- **مَن / مَنْ** : relatif indéfini, stable — distinction des word_ids
  maintenue.

## G. Formes REJECTED (4) — pas d'explication artificielle

| Forme | Raison |
|---|---|
| يَكُونُ | Glose « sera » suffisante (copule) — 0 ambiguïté réelle |
| وَتَكُونُ | Idem — « et seront » suffit |
| سَلَـٰمٌ | « paix / salut » clair en 97:5 — 0 contresens possible |
| إِنَّآ | Particule + pronom : information grammaticale, la glose couvre |

## H. Sources

- **Source d'écriture** : « Hikma — lexique éditorial » (version 1),
  `79e6412e-e349-4fe5-b29b-108237375a2d` (source existante, **1 seule**, aucune
  nouvelle source créée).
- **Référence lexicale** : Kazimirski — Dictionnaire arabe-français (1860),
  `567c8b5d-ff97-432c-9cb1-8fa88e41f0f4`.
- **Traductions de contrôle** (mêmes ayahs, workflow Al-Fātiḥah) : Hamidullah
  FR, Kazimirski Le Koran FR, Sahih International EN, Piccardo IT.

## I. Licence / provenance

Formulations **originales et courtes de Hikma** (25-35 mots, style 44A §10).
Aucun passage de traduction protégée copié ; les 4 traductions servent de
contrôle interlinguistique, jamais de texte à reproduire. MASAQ utilisé
uniquement pour comprendre la segmentation (préfixe/stem/suffixe) — jamais
comme autorité sémantique.

## J. Tests

Nouveaux tests (isolés, couche d'explication uniquement) :

- `tests/sense-explanation.test.ts` (4) : résolution générique, override
  contextuel, absence → null, non-contradiction.
- `tests/pedagogical-feedback-after-answer.test.ts` (3 ajoutés) : rendu du bloc
  « Pourquoi ce sens », **aucun bloc vide en absence**, glose/contexte/audio/
  MASAQ intacts quand une explication existe.

Résultats réels :

| Check | Résultat |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npx eslint .` | PASS |
| `npx vitest run` | **733/733 PASS** (726 + 7) |
| `npm run build` | PASS |

## K. Idempotence

- Contrainte `UNIQUE(word_id, language, source_id)` (+ `UNIQUE(word_explanation_id,
  ayah_id)` pour les contextes).
- **RUN 1** : `inserted=13 skipped=0 contexts=1 errors=0`.
- **RUN 2** : `inserted=0 skipped=13 contexts=0 errors=0`.
- Totaux DB strictement identiques après RUN 2. Aucun doublon.

## L. Non-régression (vérifiée en DB réelle avant/après)

| Table | Compte | Changement |
|---|---:|---|
| quran_words | 21 296 | Δ=0 |
| word_occurrences | 77 430 | Δ=0 |
| ayahs | 6 236 | Δ=0 |
| translations | 24 944 | Δ=0 |
| word_translations (FR validées) | 335 | Δ=0 |
| lemma_translations | 32 | Δ=0 |
| lemmas | 32 | Δ=0 |
| word_lemma_mapping | 184 | Δ=0 |
| learning_paths / units | 18 / 18 | Δ=0 |
| lessons / lesson_words | 111 / 742 | Δ=0 |
| linguistic_occurrences / segments | 413 / 796 | Δ=0 |
| sources | 6 | Δ=0 |
| **word_explanations** | **13** | **+13** |
| **word_explanation_contexts** | **1** | **+1** |

Seules les deux nouvelles tables ont augmenté. Aucune glose, traduction, lemme,
donnée MASAQ, curriculum ni progression modifiés.

## M. DB verification

- 13 `word_explanations` FR, **13/13 validées**, 1 source, 0 doublon.
- 1 `word_explanation_contexts` validé, FK `word_explanation_id` + `ayah_id`
  valides, 0 dangling.
- 0 NEEDS_REVIEW · 0 REJECTED · 0 PROPOSED (tout est validé ou absent).
- Snapshot : `tmp/phase44b-db-verification.json`.

## N. UI integration

- `components/ui/hikma-explanation.tsx` : bloc « Pourquoi ce sens » ajouté
  dans le conteneur `HikmaExplanation` existant, **ordre** : Mot → Glose →
  **Explication de sens** → Décomposition MASAQ → Contexte du verset → Audio.
- `components/learn/exercises/pedagogical-feedback.ts` : passe `senseExplanation`
  en avant (branche LEMMA_RELATION incluse). Jamais de bloc vide en absence.
- `app/(app)/learn/[slug]/page.tsx` : résolution serveur par mot avec le MÊME
  contexte que l'exercice (`resolveSenseExplanation`), champ optionnel.
- `lib/exercises/types.ts` : `senseExplanation?: string | null` dans le
  metadata — aucun impact sur le grading/SRS/mastery.
- **Aucun changement de comportement pédagogique** : l'explication reste une
  couche secondaire affichée après l'effort, jamais obligatoire.

## O. Limitations

- 13 formes expliquées (sur 330 du catalogue) — couverture volontairement
  réduite : seules les formes à vraie valeur pédagogique (risque de contresens,
  polysémie, idiome, nom propre) sont expliquées.
- La couche est **passive** : aucune connexion au resolver de sens, aux
  exercices de rappel, au SRS, au mastery, au Daily Plan ni à l'onboarding.
- Aucune explication en EN/IT — français seul (cible pédagogique actuelle) ;
  le schéma `language` permet une extension future sans migration destructrice.

## P. Recommandations Phase 45 (non exécutées)

1. **Étendre progressivement** aux autres formes sensibles du catalogue
   (d'abord les 8 formes EN-only, puis les polysémies restantes de 107).
2. **Onboarding** : réutiliser la couche d'explication dans le parcours
   d'accueil (phase prioritaire suivante selon la stratégie produit §23).
3. Ne **jamais** connecter MASAQ au runtime sans décision explicite ;
   racines/schèmes restent `FUTURE_WORK`.
4. Étudier ensuite les fonctionnalités inspirées de Quran Progress
   (uniquement après l'onboarding).

## Q. Final Verdict

**`PHASE_44B_PEDAGOGICAL_EXPLANATIONS_COMPLETE`**

- Architecture validée (FORME + override contextuel, résolution pure).
- Migration appliquée (0031), idempotente.
- 13 explications réellement éditées + validées via le workflow des 4
  traductions ; 4 rejets documentés ; 0 explication artificielle.
- 1 override contextuel sensible documenté (`فَأُمُّهُۥ`).
- UI existante réutilisée, backward compatible, aucun bloc vide.
- tsc ✅ · eslint ✅ · 733/733 ✅ · build ✅.
- Non-régression totale des données pédagogiques (Δ=0 partout sauf les 2
  nouvelles tables).
- MASAQ strictement passif. Aucun moteur modifié. Aucun commit/push.

**STOP — aucune phase suivante lancée automatiquement.**

---

*Artefacts de preuve* : `tmp/phase44b-explanations.json`,
`tmp/phase44b-db-verification.json`, `tmp/phase44b-candidates.json`,
`tmp/phase44b-write.cjs`, `tmp/phase44a-*.json|csv` (audit 44A).
