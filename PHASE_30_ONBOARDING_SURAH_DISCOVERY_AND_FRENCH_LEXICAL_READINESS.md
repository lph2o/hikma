# PHASE 30 — Onboarding, Découverte des sourates & Consolidation lexicale française

> **Principe produit non négociable (verrouillé cette phase)**
> « MASAQ enrichit Hikma, mais la qualité lexicale française constitue le socle de
> l'expérience d'apprentissage. »
>
> Une sourate **sans MASAQ** est parfaitement apprenable si son vocabulaire est
> couvert en français validé. Une sourate **sans glose FR validée** ne doit
> simplement pas être présentée comme un parcours français complet.
>
> `FATIHAH_REFERENCE_LOCKED = TRUE`

---

## 1. État avant phase

- 15 parcours d'apprentissage, 90 leçons publiées, 307 formes distinctes.
- **5 sourates** résolvaient déjà 100 % de leurs formes en français validé :
  Al-Fātiḥah (1), Al-Kawthar (108), Al-Ikhlāṣ (112), Al-Falaq (113), An-Nās (114).
- **10 sourates** (93, 94, 102–107, 109, 110) avaient une couverture FR effective
  de **0 à 33 %** → leurs formes enseignées retombaient en fallback anglais.
- **190 formes uniques** étaient en fallback EN, avec **`reuse_lemma_count = 0`**
  (aucune glose française de lemme réutilisable : il fallait un vrai travail éditorial).

## 2. Inventaire des 15 parcours (matrice finale)

| Sourate | Leçons | Formes | FR forme | FR effectif | EN | MASAQ | État |
|---|---:|---:|---:|---:|---:|---:|---|
| 1 Al-Fātiḥah | 8 | 26 | 25/96 % | **26/100 %** | 0 | ✅ (29 occ.) | REFERENCE |
| 108 Al-Kawthar | 3 | 10 | 100 % | **100 %** | 0 | ✅ (10) | READY |
| 112 Al-Ikhlāṣ | 4 | 13 | 100 % | **100 %** | 0 | ✅ (15) | READY |
| 113 Al-Falaq | 5 | 17 | 100 % | **100 %** | 0 | ✅ (23) | READY |
| 114 An-Nās | 6 | 17 | 100 % | **100 %** | 0 | ✅ (20) | READY |
| 93 Aḍ-Ḍuḥā | 11 | 36 | 39 % | **44 %** | 20 | ❌ | À CONSOLIDER |
| 94 Ash-Sharḥ | 8 | 24 | 54 % | **58 %** | 10 | ❌ | À CONSOLIDER |
| 102 At-Takāthur | 8 | 20 | 60 % | **60 %** | 8 | ❌ | À CONSOLIDER |
| 103 Al-ʿAṣr | 3 | 13 | 54 % | **54 %** | 6 | ❌ | À CONSOLIDER |
| 104 Al-Humazah | 9 | 32 | 63 % | **63 %** | 12 | ❌ | À CONSOLIDER |
| 105 Al-Fīl | 5 | 22 | 55 % | **59 %** | 9 | ❌ | À CONSOLIDER |
| 106 Quraysh | 4 | 17 | 65 % | **71 %** | 5 | ❌ | À CONSOLIDER |
| 107 Al-Māʿūn | 7 | 23 | 61 % | **61 %** | 9 | ❌ | À CONSOLIDER |
| 109 Al-Kāfirūn | 6 | 19 | 79 % | **79 %** | 4 | ❌ | À CONSOLIDER |
| 110 An-Naṣr | 3 | 18 | 50 % | **67 %** | 6 | ❌ | À CONSOLIDER |

## 3. Couverture FR effective vs couverture forme

- **Couverture forme** = `word_translations` FR validées (niveau surface).
- **Couverture effective** = chaîne réelle `FORME → LEMME → MAPPING → EN` (Phase 28
  a démontré que mesurer uniquement `word_translations` sous-estime la couverture).
- La métrique **effective** est la métrique principale de readiness.
- Écart visible quand une glose de lemme comble une forme sans glose propre
  (ex. Al-Fātiḥah 25 forme → 26 effective ; An-Naṣr 9 forme → 12 effective).

## 4. Traductions d'ayah (socle contextuel)

Les **4 traducteurs** sont complets sur **les 15 sourates** (Hamidullah FR, Kazimirski
FR, Sahih International EN, Piccardo IT — `H=K=S=P = nombre d'ayahs` partout). Le
contexte de verset est donc disponible pour **toutes** les sourates, comme pour la
référence Al-Fātiḥah. Aucune traduction d'ayah n'a été copiée en glose lexicale.

## 5. Audio

Couverture audio complète sur les 15 sourates (`audio = formes distinctes` partout).
Aucune sourate n'est bloquée par un manque d'audio.

## 6. MASAQ

- Couche MASAQ : 97 occurrences · 170 segments, provenance MASAQ v2 conservée,
  racines/schèmes = `ABSENT_DATA`.
- Disponible sur 5 sourates (1, 108, 112, 113, 114) ; absente sur les 10 autres.
- **MASAQ n'a jamais conditionné la disponibilité d'une sourate** : le critère de
  readiness du catalogue est uniquement la couverture lexicale française.

## 7. Formes nécessitant des gloses FR

190 formes uniques en fallback EN sur les 10 sourates, réparties en :

- **103 HIGH** — glosse univoque (noms, pronoms, particules simples) ;
- **87 MEDIUM** — revue requise (verbes conjugués, particules composées,
  polysémie, ḥapax, serments).

## 8. Propositions éditoriales

Dossier complet : `tmp/phase30-gloss-review.json` (190 formes, chacune avec
`word_id`, forme arabe, translittération, `meaning_en`, référence `sourate:ayah`,
traduction Hamidullah en évidence, `proposed_fr`, `confidence`, `classification`).

Dossier des 87 MEDIUM : `tmp/phase30-medium-review.md` (tableau de revue humaine).

## 9. Décisions humaines

- **Validation humaine obtenue (ask_user)** : « Valider 103 HIGH, revoir 87 MEDIUM ».
- Décision 1 (périmètre catalogue) : exposer les sourates prêtes en français,
  conserver les autres « en préparation » — **approuvée par le prompt produit**.
- Décision 2 (traitement des 190) : propositions structurées → validation humaine
  → import contrôlé — **appliquée : 103 importées, 87 en revue**.

## 10. Imports effectués

`scripts/import-phase30-high-glosses.ts` (idempotent, DRY-RUN puis APPLY) :

- 103 `word_translations` FR validées, source « Hikma — lexique éditorial »,
  `is_validated = true`, `validated_at` horodaté, `editorial_notes` traçable.
- Défense anti-mauvaise-identification : `word_id → forme arabe réelle` vérifiée
  par normalisation orthographique (103/103 ✓).
- **RUN 1** : 103 insertions, 0 divergence. **RUN 2** : 0 insertion, 103 doublons,
  0 erreur (idempotence confirmée).
- **Aucune autre écriture** : corpus, MASAQ, lemmes, mappings, curriculum, grading,
  SRS, mastery, progression, scoring inchangés.

## 11. Catalogue `/surahs`

- Nouvelle route `app/(app)/surahs/page.tsx` + requête `getSurahCatalog()`.
- **5 sourates « Prêtes à apprendre »** (CTA « Commencer » → première leçon).
- **10 sourates « En préparation »** (non cliquables, message explicite : vocabulaire
  français en cours de consolidation).
- **Aucun badge MASAQ** visible (information technique interne uniquement).
- La classification est pilotée par `classifySurahReadiness(surahNumber, frPct)` —
  une fonction **pure** qui ne reçoit **jamais** de donnée MASAQ.

## 12. Dashboard

Le « prochain pas » pédagogique reste l'action principale. Ajout d'une action
secondaire « Découvrir les sourates » (carte → `/surahs`). Le dashboard n'est pas
devenu un catalogue.

## 13. Onboarding

Non modifié dans cette phase (l'onboarding ultra-court existant reste valide).
Préparé pour la suite : l'onboarding pourra recommander une sourate parmi les 5
READY puis conduire à la première leçon.

## 14. Validation navigateur

`tmp/phase30-browser.cjs` (desktop 1280×720 + mobile 390×844, locale fr-FR) :

- `/surahs` : titre + 2 sections présentes, **5 noms arabes prêts + 10 en préparation
  trouvés**, 5 CTA « Commencer », RTL présent, **0 fuite MASAQ**, 0 overflow.
- Leçons : `/learn/basmala` (référence), `/learn/surah-112-ayah-1` (avec MASAQ),
  `/learn/surah-109-ayah-1` (sans MASAQ) → toutes chargent, RTL, 0 overflow, 0 fuite MASAQ.
- **0 erreur console · 0 tag MASAQ brut · 0 overflow.**

## 15. Tests

- `npm test` : **544/544 PASS** (43 fichiers).
- `npx tsc --noEmit` : **0 erreur**.
- `npm run lint` : **PASS**.
- `npm run build` : **PASS** (route `/surahs` présente).

## 16. Non-régression

Compteurs (avant → après) :

| Table | Avant | Après |
|---|---:|---:|
| quran_words | 21 296 | 21 296 ✓ |
| word_occurrences | 77 430 | 77 430 ✓ |
| ayahs | 6 236 | 6 236 ✓ |
| translations | 24 944 | 24 944 ✓ |
| lemmas | 32 | 32 ✓ |
| **word_translations** | **74** | **177** (+103) |
| lemma_translations | 32 | 32 ✓ |
| word_lemma_mapping | 184 | 184 ✓ |
| linguistic_occurrences | 97 | 97 ✓ |
| linguistic_segments | 170 | 170 ✓ |

Al-Fātiḥah : 8 leçons · 26 formes · 26 audios · 29 occurrences linguistiques ·
56 segments — **inchangée**.

`grading` / `scoring` / `SRS` / `mastery` / `progression` / `curriculum` :
**aucune modification**.

## 17. Fichiers modifiés

- `lib/learning/queries.ts` — `getSurahCatalog()` + `classifySurahReadiness()`.
- `lib/navigation.ts` — item « Sourates » (`/surahs`).
- `app/(app)/surahs/page.tsx` — **nouveau** (catalogue).
- `app/(app)/dashboard/page.tsx` — action secondaire « Découvrir les sourates ».
- `tests/navigation.test.ts` — routes attendues mises à jour.
- `tests/surah-catalog.test.ts` — **nouveau** (readiness = lexicale FR, pas MASAQ).
- `scripts/import-phase30-high-glosses.ts` — **nouveau** (import idempotent 103 HIGH).

## 18. Réponses explicites

**« Quelles sourates sont réellement prêtes pour un utilisateur francophone
aujourd'hui ? »**

→ **5** : Al-Fātiḥah (1), Al-Kawthar (108), Al-Ikhlāṣ (112), Al-Falaq (113), An-Nās (114).
Toutes ont 100 % de gloses FR validées + audio + 4 traductions d'ayah ; MASAQ est
présent sur les 5 mais n'est qu'un enrichissement.

**« Quelles sourates doivent être enrichies avant d'être proposées comme parcours
complets ? »**

→ **10** : 93, 94, 102, 103, 104, 105, 106, 107, 109, 110 (couverture FR effective
44–79 % après l'import des 103 HIGH). Il reste **87 formes MEDIUM** à valider.

## 19. Risques restants

- **87 gloses MEDIUM** non importées (verbes conjugués, particules, polysémie,
  ḥapax, serments) → confiance éditoriale moindre, revue humaine requise.
- Les 10 sourates « en préparation » ne sont **pas** cliquables depuis le catalogue
  (volontaire : ne pas présenter une expérience française incomplète).

## 20. Décision finale

**`FRENCH_LEXICAL_HIGH_CONSOLIDATED` + `SURAH_CATALOG_5_READY`**

- La couche lexicale française est consolidée à **103 gloses HIGH validées**.
- Le catalogue `/surahs` expose **5 sourates prêtes** et **10 en préparation**.
- Aucune nouvelle source linguistique ajoutée. Aucune régression.
- `FATIHAH_REFERENCE_LOCKED = TRUE` préservé.

---

## PROMPT PHASE SUIVANTE (Phase 31) — copiable

```
# PHASE 31 — VALIDATION DES 87 GLOSES MEDIUM & OUVERTURE DES 10 SOURATES

## CONTEXTE
Phase 30 terminée : 103 gloses FR HIGH importées (word_translations 74→177),
catalogue /surahs exposant 5 sourates READY (1, 108, 112, 113, 114) et 10 sourates
« en préparation » (93, 94, 102–107, 109, 110). Il reste 87 formes MEDIUM à valider
pour que les 10 sourates atteignent 100 % de couverture lexicale française.

FATIHAH_REFERENCE_LOCKED = TRUE.

## INVARIANTS ABSOLUS
- Ne pas modifier grading / scoring / SRS / mastery / progression / curriculum.
- Ne pas modifier Al-Fātiḥah.
- Ne pas importer de nouvelle source linguistique (pas de QAMAR, Quranic Arabic
  Corpus, Qabas, etc.).
- AVAILABLE ≠ INFERABLE. Aucune racine/schème/étymologie inventée.
- Ne jamais copier une traduction d'ayah comme glose lexicale.
- MASAQ ne conditionne jamais l'accès à une sourate.

## ÉTAPE 1 — AUDIT READ_ONLY DES 87 MEDIUM
Lire tmp/phase30-medium-review.md (dossier de revue des 87 formes : forme arabe,
translittération, meaning_en, proposition FR, référence, contexte Hamidullah).
Vérifier pour chacune : forme exacte, sourate(s), ayah(s), sens lexical, contexte,
polysémie éventuelle, glose proposée.

## ÉTAPE 2 — VALIDATION SÉMANTIQUE
Pour chacune des 87, produire : FORME | PROPOSITION | DÉCISION | GLOSE FINALE |
JUSTIFICATION | CONFIANCE. Décisions : ACCEPT / MODIFY / REJECT / NEEDS_REVIEW.
Séparer GLOSE (courte, pour les exercices) ≠ EXPLICATION (nuance contextuelle) ≠
TRADUCTION D'AYAH (contexte). Respecter la règle des formes partagées (une même
forme = une identité lexicale globale ; pas de glose différente par sourate sans
nécessité sémantique démontrée).

## ÉTAPE 3 — VALIDATION HUMAINE
Présenter la matrice de décision. Ne rien importer sans validation humaine explicite.
S'arrêter si une décision produit est nécessaire.

## ÉTAPE 4 — IMPORT CONTRÔLÉ
Importer UNIQUEMENT les gloses ACCEPT (source « Hikma — lexique éditorial »,
is_validated=true, idempotent, traçable, réversible). Aucune écriture sur
quran_words / word_occurrences / lemmas / mappings / MASAQ / translations.

## ÉTAPE 5 — NON-RÉGRESSION
Vérifier les compteurs : quran_words=21296, word_occurrences=77430, ayahs=6236,
translations=24944, lemmas=32, word_translations=177 (+N), lemma_translations=32,
word_lemma_mapping=184, linguistic_occurrences=97, linguistic_segments=170.
Vérifier Al-Fātiḥah (8 leçons / 26 formes / 26 audios / 29 occ. / 56 segments).
Rejouer npm test, npx tsc --noEmit, npm run lint, npm run build.

## ÉTAPE 6 — OUVERTURE AUTOMATIQUE DU CATALOGUE
Après import, re-exécuter getSurahCatalog : les sourates passées à 100 % FR
basculent automatiquement de « En préparation » à « Prêtes à apprendre »
(aucun code UI à modifier : la classification est dérivée de la couverture FR).

## ÉTAPE 7 — VALIDATION NAVIGATEUR
/surahs (desktop 1280×720 + mobile 390×844, RTL) : les sourates nouvellement
prêtes sont cliquables, « Commencer » mène à la première leçon, aucun badge MASAQ,
0 overflow, 0 erreur console, 0 tag MASAQ brut. Tester une leçon d'une sourate
nouvellement ouverte (BASE + MASAQ si présent).

## LIVRABLES
PHASE_31_MEDIUM_GLOSS_VALIDATION.md + tmp/phase31-medium-gloss-validation.json,
avec état avant/après, décisions, imports, compteurs, tests, validation navigateur,
risques restants. Fournir un PROMPT PHASE SUIVANTE complet à la fin.
```
