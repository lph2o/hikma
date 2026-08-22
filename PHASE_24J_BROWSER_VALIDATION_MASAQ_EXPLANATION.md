# PHASE 24J — Validation navigateur réelle de l'explication linguistique MASAQ

**Statut : READ_ONLY (DATABASE_WRITES = 0 — aucune migration, seed, import, donnée,
grading, SRS, mastery, progression ni curriculum modifiés).**

**Décision finale : `A — BROWSER_VALIDATION_PASS`**

---

## 1. Environnement

| Élément | Valeur |
|---|---|
| Navigateur | Headless Chrome **151** (channel système) |
| Pilotage | Playwright 1.62.1 (cache npx, aucun package ajouté au projet) |
| Serveur | `next start` (build de production) |
| Résolution mobile | **390 × 844** |
| Résolution desktop | **1280 × 720** |
| Locale | fr-FR |

Méthode : pilotage réel du DOM — navigation, clics sur les réponses, ouverture de
« Comprendre pourquoi », capture du texte rendu, de la console, du réseau et du DOM
(audio/RTL/overflow), plus captures d'écran.

## 2. Parcours utilisateur (8 leçons)

Les **8 leçons d'Al-Fātiḥah** chargent toutes en **HTTP 200** :

`basmala`, `al-hamd`, `ar-rahman`, `malik-yawm-ad-din`, `iyyaka-nabudu`,
`ihdina-sirat`, `sirat-alladhina`, `wa-la-d-dallin`.

Parcours exercice par exercice sur **4 leçons** (basmala, al-hamd, sirat-alladhina,
wa-la-d-dallin) ; les 4 autres ont été chargées (non-régression). Statuts observés :
**46 incorrectes**, **10 correctes**, **4 auto-évaluations** — soit largement plus de
5 erreurs provoquées.

**Comportement après réponse correcte (§9)** : aucune explication n'est affichée après
une réponse correcte (comportement 24I inchangé — le champ `linguistic` est calculé mais
`ExerciseFeedback` ne rend `HikmaExplanation` que si `!isCorrect`). Documenté, **non modifié**.

## 3. Blocs linguistiques observés (anti-répétition confirmée)

3 profils distincts, plafonnés à 2 blocs — jamais « Le mot signifie X » systématique :

| Profil | Effectif |
|---|---|
| Décomposition + Identification | 73 |
| Identification + Forme | 11 |
| Décomposition + Forme | 6 |

## 4. Exemples réels d'explications rendues

| Mot | Explication affichée (texte réel) |
|---|---|
| `بِسْمِ` | **Décomposition** : `ب` (préposition) + `اسم` (noyau) · **Identification** : « C'est un nom. » · Sens : « au nom de » |
| `ٱلرَّحْمَنِ` | **Décomposition** : `ال` (article défini) + `رحمن` (noyau) · **Identification** : « C'est un nom propre (nom divin). » |
| `صِرَٰطَ` | **Identification** : « C'est un nom. » · **Forme** : « Ici, le mot est à l'accusatif (complément). » |
| `عَلَيْهِمْ` | **Décomposition** : `علي` (préposition) + `هم` (suffixe pronominal) · **Forme** : « au génitif (complément du nom ou après préposition) » |
| `إِيَّاكَ` | **Identification** : « C'est un pronom. » · **Forme** : « à l'accusatif (complément). » |
| `ٱلَّذِينَ` | **Identification** : « C'est un pronom relatif. » · **Forme** : « au génitif. » |
| `غَيْرِ` | **Identification** : « C'est un nom. » · **Forme** : « au génitif. » |
| `قُلْ` (sourate 114) | **Aucun bloc MASAQ** — seulement « Sens » + « Contexte » classiques |

Aucun tag technique n'a jamais été affiché (`NOUN_*`, `GENITIVE`, `NOMINATIVE`,
`ACCUSATIVE`, `Morph_Tag`, `Case_Mood`, `segment_kind`, `syntactic_roles`, `Phrase`…).

## 5. Validations détaillées

| Domaine | Résultat |
|---|---|
| **Décomposition** | PASS — `وَ`/`بِ`/`لِ`/`ال` et suffixes pronominaux distingués en « préposition », « article défini », « noyau », « suffixe pronominal » ; jamais appelés « préfixes » génériquement. |
| **Identité** | PASS — nom, nom propre (nom divin), pronom, pronom relatif. |
| **Morphologie** | PASS — accusatif/génitif convertis en français pédagogique ; genre/personne/voix absents jamais inventés. |
| **Syntaxe** | Non surfacée sur Al-Fātiḥah : la chaîne de priorité la relègue toujours derrière identité+morphologie, et le cas porte déjà la fonction (« au génitif (complément du nom…) »). Comportement voulu, aucune valeur inventée. |
| **Audio** | PASS — **47/47** explications avec lecteur (URL signée Mu'allim réelle). |
| **Contexte** | PASS — extrait du verset + traduction française présents. |
| **RTL** | PASS — `dir="rtl"` et direction calculée `rtl` sur les segments arabes (`عَلَيْهِمْ` → `علي` + `هم`). |
| **Responsive** | PASS — **0 overflow horizontal** : 8/8 leçons à 390 px (scrollWidth 390), desktop 1280 px (scrollWidth 1280). |
| **Console** | PASS — **0 erreur console**, 0 erreur de page, 0 exception React/hydratation. |
| **Réseau** | PASS — **0 requête navigateur directe** vers `linguistic_occurrences`/`linguistic_segments` (données récupérées côté serveur, aucune boucle ni N+1 client). |
| **Autre sourate** | PASS — sourate 114 : **aucune** explication MASAQ ; `linguistic_occurrences` n'existe que pour sourate 1 (29 lignes). |

## 6. Tableau récapitulatif des mots testés

| Mot | Erreur testée | Décomposition | Identité | Morphologie | Syntaxe | Audio | Contexte | Résultat |
|-----|---------------|---------------|----------|-------------|---------|-------|----------|----------|
| بِسْمِ | réponse fausse | ✓ ب+اسم | ✓ nom | — | — | ✓ | ✓ | PASS |
| ٱلرَّحْمَنِ | réponse fausse | ✓ ال+رحمن | ✓ nom propre | — | — | ✓ | ✓ | PASS |
| ٱلرَّحِيمِ | réponse fausse | ✓ ال+رحيم | ✓ nom propre | — | — | ✓ | ✓ | PASS |
| صِرَٰطَ | réponse fausse | — | ✓ nom | ✓ accusatif | — | ✓ | ✓ | PASS |
| عَلَيْهِمْ | réponse fausse | ✓ علي+هم | — | ✓ génitif | — | ✓ | ✓ | PASS |
| إِيَّاكَ | réponse fausse | — | ✓ pronom | ✓ accusatif | — | ✓ | ✓ | PASS |
| ٱلَّذِينَ | réponse fausse | — | ✓ pronom relatif | ✓ génitif | — | ✓ | ✓ | PASS |
| غَيْرِ | réponse fausse | — | ✓ nom | ✓ génitif | — | ✓ | ✓ | PASS |
| قُلْ (sourate 114) | réponse fausse | — | — | — | — | — | ✓ | PASS (aucun bloc MASAQ) |

## 7. Warnings (non bloquants)

- **20 requêtes `_rsc` en `ERR_ABORTED`** : préchargement de la fiche mot
  (`/mots/{id}?_rsc=…`) interrompu par la navigation suivante. Comportement Next.js
  bénin, **pas** une régression (la fiche elle-même se charge correctement).

## 8. Non-régression (vérifiée après validation)

| Compteur | Valeur (inchangée) |
|---|---|
| linguistic_occurrences / segments | 29 / 56 |
| quran_words / word_occurrences | 21 296 / 77 430 |
| translations / lemmas | 24 944 / 32 |
| Al-Fātiḥah | 8 leçons · 26 formes · 29 occurrences · 26 audios |

Validation strictement read-only : **0 écriture** DB, `FATIHAH_REFERENCE_LOCKED = TRUE`.

## 9. Limitations

- Le bloc **Fonction (syntaxe)** n'apparaît jamais sur Al-Fātiḥah : la chaîne de
  priorité le relègue derrière identité+morphologie (choix anti-surcharge).
- « Partiel » n'est pas un statut de grading distinct (CORRECT/INCORRECT/AMBIGUOUS) —
  comportement documenté, non modifié.
- Validation en headless : dimensions/overflow/DOM vérifiés, mais le rendu pixel exact
  n'a pas été inspecté sur écran physique.

## 10. Décision finale

**`A — BROWSER_VALIDATION_PASS`** : le moteur d'explication MASAQ fonctionne
correctement, sans tag brut, sans régression, isolé à Al-Fātiḥah, avec audio, RTL,
responsive et console propres.

---

## RECOMMANDATION POUR LA PHASE SUIVANTE

**Choix : `D` — intégrer l'affichage d'une explication courte après une réponse correcte.**

La validation confirme que MASAQ enrichit bien l'explication **après erreur**, mais une
**réponse correcte** ne montre ni explication, ni audio, ni rappel. C'est le principal
levier pédagogique restant, déjà conçu lors de l'audit 24I (variante **D** : feedback
court toujours présent + bouton « Comprendre ce mot » disponible après **chaque** réponse).
C'est une évolution **additive** du feedback, sans toucher au grading/SRS/mastery.

---

## PROMPT PHASE SUIVANTE

> **PHASE 24K — Feedback pédagogique après CHAQUE réponse (Al-Fātiḥah).**
>
> Contexte : la Phase 24J a validé l'explication MASAQ après erreur ; il reste à appliquer
> la variante **D** validée en 24I/24J. Ne toucher ni au grading, ni au scoring, ni au SRS,
> ni au mastery, ni à la progression, ni au curriculum, ni au resolver lexical, ni au word
> bank, ni à la génération des exercices. `FATIHAH_REFERENCE_LOCKED = TRUE`.
>
> Workflow à respecter : AUDIT → DESIGN → READ_ONLY → VALIDATION → APPROBATION →
> IMPLÉMENTATION CONTRÔLÉE → TESTS → VALIDATION NAVIGATEUR → NON-RÉGRESSION. Pas de
> modification de masse directe.
>
> Tâches :
> 1. **Feedback court après toute réponse** : statut + bonne réponse + sens FR validé +
>    audio (niveau 1), 3–4 lignes max sur mobile.
> 2. **« Comprendre ce mot » après une réponse correcte** : rendre `HikmaExplanation`
>    disponible après réussite aussi (aujourd'hui `ExerciseFeedback` ne le rend que si
>    `!isCorrect`), replié par défaut.
> 3. **AnswerOutcome** : introduire `correct | incorrect | partial | ambiguous` dérivé de
>    `RecallGrade`, sans modifier le grading ; « partial » → uniquement la nuance manquante.
> 4. **Anti-répétition** : fonction pure `buildShortFeedback(outcome, exercise, exposure)`
>    qui varie le rappel (1ʳᵉ rencontre → sens ; ensuite → construction/rôle).
> 5. **MASAQ** : uniquement l'approfondissement, 2 blocs max, jamais de tags bruts,
>    `AVAILABLE ≠ INFERABLE`.
> 6. **Niveau utilisateur** : proxy initial = maîtrise du mot (débutant/intermédiaire/avancé).
> 7. **UX** : carte extensible inline, RTL, responsive 390×844 et 1280×720, accessible,
>    un seul bouton « Continuer ».
> 8. **Tests unitaires** : correct/incorrect/partial/ambiguous ; réponse correcte →
>    « Comprendre ce mot » présent ; anti-répétition ; MASAQ 2 blocs ; fallback classique ;
>    non-régression grading (réponses acceptées identiques).
> 9. **Non-régression** : 8 compteurs corpus + Al-Fātiḥah (8 leçons/26 formes/29 occ/26
>    audio) identiques ; `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`
>    passants.
> 10. **Livrables** : `PHASE_24K_*.md`, `tmp/phase24k-*.json`, tests, rapport avant/après,
>     stratégie anti-répétition, limitations.
>
> Décision unique : `A — IMPLEMENTATION_SUCCESSFUL_READY_FOR_REVIEW` /
> `B — IMPLEMENTATION_PARTIAL_REVIEW_REQUIRED` / `C — DATA_LIMITED_IMPLEMENTATION` /
> `D — REGRESSION_DETECTED`.
>
> Arrêt obligatoire après cette phase : pas d'extension multi-sourates, pas de
> racines/schèmes, pas de modification du modèle lexical.
