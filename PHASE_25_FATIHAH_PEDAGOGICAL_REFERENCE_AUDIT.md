# PHASE 25 — Al-Fātiḥah, référence pédagogique UX : audit final + verrouillage

**Statut : READ_ONLY (DATABASE_WRITES = 0). Aucune migration, seed, import, glose,
donnée MASAQ, grading, SRS, mastery, progression ni curriculum modifiés.**

**Décision finale : `A — FATIHAH_REFERENCE_LOCKED`**

---

## 1. Parcours testés

- **8/8 leçons** chargées en HTTP 200 : `basmala`, `al-hamd`, `ar-rahman`,
  `malik-yawm-ad-din`, `iyyaka-nabudu`, `ihdina-sirat`, `sirat-alladhina`, `wa-la-d-dallin`.
- Réponses observées : **14 correctes**, **59 incorrectes** ; l'**ambigu** n'est pas
  déclenchable en headless (nécessite une vocalisation libre précise) — couvert par tests unitaires.
- **L'explication n'est jamais obligatoire** : le bouton « Continuer » est toujours
  disponible, « Comprendre ce mot » est optionnel (replié/ouvert à la demande).
- **Audio** : le bouton « Écouter le mot » déclenche le chargement de l'URL signée
  (état `loading` en headless, sans sortie audio physique).

## 2. Exemples réels d'explications

| Mot | Explication affichée |
|---|---|
| `بِسْمِ` | Décomposition : `ب` (préposition) + `اسم` (noyau) · « C'est un nom. » · Sens : au nom de · Contexte 1:1 |
| `ٱلرَّحْمَٰنِ` | Décomposition : `ال` (article défini) + `رحمن` (noyau) · nom propre (nom divin) |
| `عَلَيْهِمْ` | Décomposition : `علي` (préposition) + `هم` (suffixe pronominal) · au génitif |
| `صِرَٰطَ` | « C'est un nom. » · à l'accusatif (complément) |
| `إِيَّاكَ` | « C'est un pronom. » · à l'accusatif (complément) |

Aucun tag brut (`NOUN_*`, `GENITIVE`, `Morph_Tag`, `segment_kind`, …) jamais affiché.

## 3. Comparaison correct / incorrect / ambigu

| Issue | Comportement vérifié |
|---|---|
| Correct | statut + **Bonne réponse** + audio + rappel varié + « Comprendre ce mot » **replié** (14/14) |
| Incorrect | **Ta réponse** + **Réponse attendue** + rappel/construction + « Comprendre ce mot » **ouvert** (59/59) |
| Ambigu | « À vérifier » + nuance + formulations acceptées (tests unitaires) |

## 4. Anti-répétition — PASS

- Correct : le rappel varie selon les données (« regarde la construction » / « s'éclaire
  par le contexte » / « Bien vu : sens »).
- Incorrect : pointe la décomposition si disponible, sinon **aucun doublon** de la
  « Réponse attendue ».
- 3 profils de blocs observés (Décomposition+Identification, Identification+Forme,
  Décomposition+Forme) — **pas** de « Le mot signifie X » systématique.

## 5. Audit MASAQ — PASS

Chaîne conservée : `getWordLinguisticEvidence → buildLinguisticExplanation → HikmaExplanation`.
**2 blocs max**, priorité décomposition > identité > morphologie > syntaxe, **aucun tag brut**,
racine/schème = `ABSENT_DATA` (jamais inventés). `AVAILABLE ≠ INFERABLE` respecté.

## 6. Audit décomposition — PASS

Libellés observés : **préposition** (8), **noyau (mot de base)** (38), **article défini** (30),
**suffixe pronominal** (`عَلَيْهِمْ`). Particule / article / stem / suffixe pronominal /
suffixe flexionnel sont distingués et **jamais présentés comme des mots autonomes** ; aucune
segmentation inventée.

## 7. Audit lemme — PASS

La relation « Repère de la même famille » provient **exclusivement** des données Hikma
validées (`lemma_translations`), jamais du mapping MASAQ. Un mapping documentaire
`PARTIAL`/`UNMAPPED` n'est jamais converti en affirmation certaine (le type
`LinguisticBlock` ne comporte pas de variante « lemma »).

## 8. Audit contexte — PASS

Le contexte de verset est étiqueté **« Contexte · sourate X, verset Y »**, distinct du bloc
**« Sens »** (glose). Aucun `translation_source_leak` : Hamidullah / Kazimirski / Sahih
International / Piccardo restent du **contexte**, jamais une « définition du mot ».

## 9–12. Mobile / Desktop / RTL / Accessibilité — PASS

- **Mobile 390×844** : aucun overflow (`scrollWidth == 390`).
- **Desktop 1280×720** : aucun overflow (`scrollWidth == 1280`).
- **RTL** : `dir="rtl"` + direction calculée `rtl` sur les segments arabes (`علي`, `هم`…).
- **Accessibilité** : « Comprendre ce mot » porte `aria-expanded` (bascule `true ↔ false`)
  + `aria-controls` ; le contenu est `role="region"` + `aria-label` ; les états sont
  **textuels** (À revoir / Bonne réponse / Ta réponse / Réponse attendue), pas couleur seule.

## 13. Audit performance — PASS

45 requêtes au chargement d'une leçon, **0 requête cliente** vers
`linguistic_occurrences`/`linguistic_segments` : les données MASAQ sont récupérées **côté
serveur en batch** à la génération, aucune requête supplémentaire ni duplication à la réponse.

## 14. Audit technique — PASS

| Vérification | Résultat |
|---|---|
| `npm test` | **525 / 42 fichiers** |
| `npx tsc --noEmit` | 0 erreur |
| `npm run lint` | PASS |
| `npm run build` | PASS |
| Console navigateur | **0 erreur** |

## 15. Valeur pédagogique (critère central)

- **HIGH_VALUE** : décomposition `ب`+stem, article défini `ال`+stem, suffixe pronominal — l'apprenant apprend quelque chose qu'il ne savait pas.
- **MEDIUM_VALUE** : identification (nom/pronom), cas en français pédagogique, contexte du verset.
- **LOW_VALUE** : identification générique « C'est un nom » seul.
- **REDUNDANT** (mineur) : le bloc « Sens » de l'approfondissement répète le sens déjà affiché dans « Bonne réponse » / « Réponse attendue » (accepté : vue auto-portante ; masquable lors d'un raffinement UX ultérieur).

## 16. Non-régression — PASS

8 leçons · 26 formes · 26 audios · couche linguistique 29/56 · corpus
21 296 / 77 430 / 24 944 / 32 / 70 / 32 / 184 — **strictement identiques**.
Grading / scoring / SRS / mastery / progression / curriculum **inchangés**.

## 17. Problèmes observés (documentés, non corrigés)

1. `AMBIGUOUS` non déclenchable en headless (couvert par tests unitaires).
2. Bloc « Sens » légèrement redondant dans l'approfondissement (mineur).
3. Audio en headless reste en `loading` (pas de sortie physique) — le déclenchement est confirmé.

## 18. Éléments à ne surtout pas modifier

Grading / scoring / SRS / mastery / progression / curriculum · `resolveWordMeanings` /
`buildWordBank` / génération des exercices · gloses FR éditoriales · traductions d'ayah ·
couche MASAQ importée · `FATIHAH_REFERENCE_LOCKED`.

---

## Décision sur le verrouillage de Fātiḥah

**`A — FATIHAH_REFERENCE_LOCKED`** : Al-Fātiḥah peut devenir la **référence pédagogique
et UX officielle de Hikma** avant toute généralisation. Tous les critères sont conformes.

### Résumé des vérifications
Parcours cohérents · explications réellement pédagogiques (3 profils, jamais génériques) ·
feedback court non redondant · MASAQ à valeur visible (2 blocs max, aucun tag brut) ·
aucune donnée absente inventée · contexte jamais confondu avec la glose ·
correct/incorrect/ambigu différenciés · mobile PASS · desktop PASS · RTL PASS · console PASS ·
aucun overflow · tests 525/42 · TypeScript PASS · lint PASS · build PASS · **0 donnée/code modifié**.

### Prochaines étapes
1. Généralisation multi-sourates : **audit READ_ONLY** préalable (périmètre, source,
   alignement, idempotence, non-régression) avant toute implémentation.
2. Racines/schèmes : `FUTURE_WORK` (source auditée requise).
3. Raffinement UX optionnel : masquer le bloc « Sens » redondant dans l'approfondissement.

---

## PROMPT PHASE SUIVANTE

> **PHASE 26 — Audit READ_ONLY de la généralisation multi-sourates de la couche
> linguistique MASAQ.**
>
> Contexte : Al-Fātiḥah est verrouillée comme référence UX/pédagogique
> (`FATIHAH_REFERENCE_LOCKED = TRUE`). Il s'agit d'étudier — sans rien implémenter —
> l'extension de la couche linguistique MASAQ à d'autres sourates.
>
> **Ne rien modifier** : aucune migration, aucun seed, aucun import, aucune donnée,
> aucune glose, aucun grading/SRS/mastery/progression/curriculum. `DATABASE_WRITES = 0`.
>
> Auditer et documenter :
> 1. **Périmètre** : sourates candidates (112, 113, 114, 108, 103, 110, 109, 106, 107,
>    105, 104…) et leurs leçons/occurrences.
> 2. **Source** : MASAQ v2 (checksum `777d0cc8…a900`, DOI 10.17632/9yvrzxktmr.2, licence CC BY,
>    provenance conservée dans `sources`).
> 3. **Alignement** : strictement `(surah, ayah, position)` ; refuser MISSING / EXTRA / AMBIGUOUS.
> 4. **Idempotence** : `UNIQUE(source_id, source_record_id)`.
> 5. **Isolation** : ne pas toucher à `quran_words`, `word_occurrences`, `lemmas`,
>    `word_translations`, `lemma_translations`, `word_lemma_mapping`, `translations`.
> 6. **Non-régression** : les 8 compteurs corpus et Al-Fātiḥah (8 leçons/26 formes/29 occ/26
>    audio) doivent rester strictement identiques.
> 7. **Honesty** : `AVAILABLE ≠ INFERABLE` ; racine/schème = ABSENT_DATA.
> 8. **Décision GO/NO-GO** documentée, avec livrables
>    `PHASE_26_*.md` + `tmp/phase26-*.json`.
>
> Workflow strict : AUDIT → DESIGN → READ_ONLY → VALIDATION → APPROBATION →
> IMPLÉMENTATION CONTRÔLÉE → TESTS → VALIDATION NAVIGATEUR → NON-RÉGRESSION. Décision
> finale unique A/B/C/D/E. Arrêt obligatoire après la phase — aucune phase suivante ne
> doit être exécutée automatiquement.
