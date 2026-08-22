# PHASE 23F-A — AUDIT PÉDAGOGIQUE RÉEL POST-IMPLÉMENTATION

**STATUS : `PEDAGOGICAL_REVIEW_REQUIRED`** · Mode `READ_ONLY`

Garanties : `DATABASE_WRITES = 0` · `MIGRATIONS = 0` · `STORAGE_WRITES = 0` ·
`PRODUCTION_CODE_CHANGES = 0` · `UI_CHANGES = 0`.

L'audit a confronté le code réel (`lib/learning/skills.ts`, `skill-progress.ts`,
`sequencing.ts`, `lib/exercises/generators/*`, `components/learn/exercises/index.tsx`,
`app/(app)/learn/[slug]/page.tsx`) et la base réelle aux designs 23B–23F. Aucune
fonction n'a été jugée sur son seul nom : le comportement a été exécuté et mesuré.

---

## 1. RÉSUMÉ EXÉCUTIF

Le socle 23F **fonctionne réellement** : un débutant suit reconnaissance → rappel →
production → audio, la maîtrise est multi-dimensionnelle et persistée, l'audio Muallim
est signé et jouable (26/26 formes Al-Fatiha), et le curriculum est cumulatif (7 leçons).

Mais le verdict de maîtrise est **PARTIAL** : le rappel est **auto-évalué** (non vérifié
par saisie machine), **3 compétences sur 8 ne sont jamais alimentées** (contexte, lemme,
rétention), et les dernières leçons cumulent une **charge cognitive lourde** (jusqu'à
15 mots / ~75 exercices). Ces points sont des décisions à faire valider par le
propriétaire — d'où `PEDAGOGICAL_REVIEW_REQUIRED`, sans écriture.

## 2. PARCOURS USER_NEW (simulation READ-ONLY, fonctions réelles)

`selectNextStep` + `applySkillAttempt` (10 étapes) :

| Étape | Mot | Exercice | Compétence | Niveau avant |
|---|---|---|---|---|
| 1-4 | r1 | WORD_TO_TRANSLATION | meaning_recognition | 0→25→50→75 |
| 5-8 | r1 | TRANSLATION_TO_WORD | form_recognition | 0→25→50→75 |
| 9-10 | r1 | FORM_TO_MEANING | form_to_meaning | 0→25 |

Le sélecteur de « prochaine activité » est **greedy** (il perce une compétence d'un mot
à 100 avant de passer au mot suivant). ⚠️ Ce comportement n'est **pas** celui du parcours
réel : la page leçon utilise `buildCumulativeSequence` (rondes), pas `selectNextStep`.

## 3. AUDIT SÉQUENCE CUMULATIVE

`buildCumulativeSequence` (utilisé par la leçon) produit des **rondes par compétence** :
```
meaning_recognition (tous les mots)
→ form_recognition (tous les mots)
→ form_to_meaning (tous)
→ meaning_to_form (tous)
→ audio_recognition (tous)
```
Ordre vérifié : `r1..r4` en reconnaissance du sens, puis `r1..r4` en reconnaissance de
forme, puis rappel, puis production, puis audio. **Les compétences maîtrisées sont
sautées, les faibles réactivées, aucune fuite prématurée vers la production.**

## 4. AUDIT RAPPEL ACTIF

`FORM_TO_MEANING` / `MEANING_TO_FORM` : la réponse est **masquée initialement** (état
`revealed=false`, bouton « Révéler la réponse »), puis l'utilisateur s'auto-évalue
(« Je l'avais » / « À revoir »). L'auto-évaluation EST persistée et décrémente la
compétence en cas d'erreur.

**Limite réelle** : la maîtrise du rappel repose sur l'**auto-évaluation**, pas sur une
saisie machine-gradée. L'utilisateur peut révéler sans avoir réellement tenté. C'est un
compromis assumé du socle (pas de clavier arabe ni de translittération) — à valider.

## 5. MATRICE DES 8 COMPÉTENCES

| Compétence | Exercices | Persistée | Influence séquence |
|---|---|---|---|
| form_recognition | TRANSLATION_TO_WORD, REVERSE_TRANSLATION, MULTIPLE_CHOICE | ✓ | ✓ |
| meaning_recognition | WORD_TO_TRANSLATION, COMPLETE_WORD | ✓ | ✓ |
| form_to_meaning | FORM_TO_MEANING | ✓ | ✓ |
| meaning_to_form | MEANING_TO_FORM | ✓ | ✓ |
| audio_recognition | AUDIO_TO_WORD, WORD_TO_AUDIO | ✓ | ✓ |
| **context_recognition** | **— aucun** | ✗ | ✗ |
| **lemma_relation** | **— aucun** | ✗ | ✗ |
| **retention** | **— aucun** (SRS par mot assure la rétention réelle) | ✗ | ✗ |

**3/8 compétences sont déclarées mais jamais alimentées.** Le séquenceur les ignore
proprement (`defaultSkillToType` → null), mais elles ne peuvent jamais être acquises.

## 6. AUDIT MASTERY

`skillMasteryLevel` = corrects nets (plancher 0) :

| correct/incorrect | niveau |
|---|---|
| 0/0 | 0 |
| 1/0 | 25 |
| 2/0 | 50 |
| 3/0 | 75 |
| 4/0 | 100 |
| 4/1 | 75 |
| 5/1 | 100 |
| 100/96 | **100** |

- **Une erreur ne détruit pas la maîtrise** : 100 → 75 (une marche), récupérable en un
  correct (symétrique). → **PAS** de `PEDAGOGICAL_REVIEW_REQUIRED` sur ce point.
- **Coarse** : le niveau ignore le taux d'erreur — `(100 corrects, 96 erreurs)` vaut 100
  comme `(4, 0)`. L'historique est bien stocké (compteurs), mais pas dans le niveau.

## 7. AUDIT AUDIO

- `AUDIO_TO_WORD` / `WORD_TO_AUDIO` lisent réellement `word_audio` (récitation Muallim).
- `getWordAudioUrls` signe les chemins Storage `word-audio` (TTL 1 h, batch).
- **26/26 URL signées OK** pour Al-Fatiha · **aucune simulation, aucun placeholder**.
- `ayah_audio = 0`, `Mujawwad = 0` (confirmés en base).

## 8. AUDIT AL-FATIHA

26 formes · **20/26 résolues FR** (19 par forme + 1 par lemme) · **6 en repli EN** (les
6 formes grammaticales non glosées par décision) · **26/26 audio** · 9 lemmes directs ·
11 mappings safe. Curriculum : 7 leçons cumulatives (nouveaux + révision).

## 9. AUDIT PRINCIPES MICHEL THOMAS (adapté au Coran)

| Principe | Verdict |
|---|---|
| Progression cumulative | SUPPORTED |
| Construction à partir du connu | SUPPORTED |
| Rappel actif | PARTIALLY_SUPPORTED (auto-évalué) |
| Réutilisation immédiate | SUPPORTED |
| Réduction mémorisation mécanique | SUPPORTED |
| Apprentissage par compréhension | SUPPORTED |
| Progression graduelle | PARTIALLY_SUPPORTED (charge des dernières leçons) |
| Réactivation des acquis | SUPPORTED |

## 10. CHARGE COGNITIVE

| Leçon | nouveaux | révision | total | exercices débutant |
|---|---|---|---|---|
| basmala | 4 | 0 | 4 | 20 |
| al-hamd | 4 | 4 | 8 | 40 |
| ar-rahman | 2 | 6 | 8 | 40 |
| malik-yawm-ad-din | 3 | 8 | 11 | 55 |
| iyyaka-nabudu | 4 | 7 | 11 | 55 |
| ihdina-sirat | 3 | 7 | 10 | 50 |
| sirat-alladhina | 8 | 7 | **15** | **75** |

**`COGNITIVE_OVERLOAD_RISK` (P2)** : les leçons 4-7 cumulent 10-15 mots ; la révision
cumulée gonfle le volume d'exercices (jusqu'à 75). La dernière leçon introduit 8 nouveaux
mots d'un coup.

## 11. VERDICT DE MAÎTRISE (question centrale)

> « Un nouvel utilisateur pourrait-il terminer Al-Fatiha et retrouver la signification
> des mots importants sans QCM et sans indice ? »

| Dimension | Verdict |
|---|---|
| Reconnaissance | **YES** |
| Rappel FR (forme → sens) | **PARTIAL** (auto-évalué) |
| Rappel arabe (sens → forme) | **PARTIAL** (auto-évalué) |
| Audio | **PARTIAL** (audio → mot QCM machine-gradé ; audio → sens absent) |
| Contexte | **NO** |
| Rétention | **PARTIAL** (SRS par mot ; par compétence absent) |

**Verdict global : PARTIAL.**

## 12. PROBLÈMES DÉTECTÉS

1. **P1** — `context_recognition`, `lemma_relation`, `retention` déclarées mais jamais
   alimentées (aucun générateur).
2. **P1** — rappel actif auto-évalué (non machine-gradé) : mesure de maîtrise fragile.
3. **P2** — charge cognitive des leçons 4-7 (10-15 mots, 40-75 exercices).
4. **P2** — niveau de maîtrise coarse (ignore le taux d'erreur).
5. **P3** — `selectNextStep` greedy (non câblé en production).

## 13. PRIORITÉS

- **P0** : aucun blocage (le socle fonctionne de bout en bout).
- **P1** : 3 compétences non alimentées + fiabilité du rappel auto-évalué.
- **P2** : charge cognitive + finesse du modèle de maîtrise.
- **P3** : sélecteur de pas suivant greedy.

## 14. RECOMMANDATIONS (non implémentées)

1. **23G** : exercice CONTEXT (données `ayahContext` déjà chargées) → alimenter
   `context_recognition`.
2. Ajouter un exercice LEMMA_RELATION (regrouper formes d'un même lemme) → alimenter
   `lemma_relation`.
3. Évaluer un rappel **machine-gradé** (saisie translittérée) pour fiabiliser
   `form_to_meaning` / `meaning_to_form`.
4. Plafonner le volume par session (ex. sous-ensemble de révision) pour réduire la
   charge cognitive des dernières leçons.
5. Enrichir le niveau de maîtrise (taux d'erreur, décroissance temporelle) en phase
   SRS avancée.

## 15. NON-RÉGRESSION

| Vérification | Résultat |
|---|---|
| `npm test` | **259/259** ✓ |
| `npx tsc --noEmit` | **0 erreur** ✓ |
| `npm run lint` | clean ✓ |
| `npm run build` | OK ✓ |
| `npm run verify:persistence` | **13/13** ✓ |
| `npm run verify:rls` | **38/38** ✓ |

## 16. PREUVE READ-ONLY

Compteurs identiques avant/après audit : `quran_words` 21 296 · `word_occurrences`
77 430 · `lemmas` 32 · `word_translations` FR validées 19 · `lemma_translations` FR
validées 28 · `word_lemma_mapping` safe 182 · `word_audio` 21 295 · `ayah_audio` 0 ·
`recitations` 15 · `user_word_skill_progress` 0. **Aucune écriture.**

---

## DÉCISION : `PEDAGOGICAL_REVIEW_REQUIRED`

Le socle est fonctionnel et testé, mais plusieurs points pédagogiques (compétences non
alimentées, rappel auto-évalué, charge cognitive) doivent être examinés et tranchés par
le propriétaire avant de déclarer le parcours pédagogiquement prêt. **Aucune modification
effectuée, aucune recommandation implémentée.**

**ARRÊT OBLIGATOIRE** — pas de 23G, pas de SRS, pas de gamification, pas d'extension
aux 114 sourates, aucun import de données. En attente de la décision explicite.

**Livrables :**
- `PHASE_23F_A_PEDAGOGICAL_RUNTIME_AUDIT.md`
- `tmp/phase23f-a-runtime-audit.json`
