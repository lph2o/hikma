# PHASE 40B — ENRICHISSEMENT LEXICAL FR (HIGH-YIELD FORMS)

**Statut : `PHASE_40B_READ_ONLY_ONLY`**

> Décision utilisateur explicite : **rester READ-ONLY**. Aucune écriture DB, aucune migration,
> aucun moteur modifié, aucun commit/push. Le rapport livre l'analyse, les gloses proposées et
> l'audit licence, pour validation humaine complète avant toute écriture.

---

## A. Executive Summary

La Phase 40A a établi que le goulot de couverture est **lexical** (les formes fréquentes manquantes sont `EN_ONLY`), pas structurel. La Phase 40B avait pour but de lever ce goulot.

**Analyse effectuée** : schéma réel (`word_translations`, `sources`, `quran_words`, `word_occurrences`), convention de validation existante, reconstruction des candidats depuis la DB actuelle, et audit des sources/licences.

**Résultat** : les candidats P1 (15 formes lexicales stables, ~2 439 occurrences ≈ **+3,15 %** de potentiel) sont identifiés avec leurs gloses et leur source (Kazimirski 1860, domaine public, déjà enregistré). **Mais** la règle de la phase interdit de marquer `is_validated = true` sur la seule plausibilité linguistique ; le resolver n'utilise que les lignes validées. Le propriétaire a donc choisi **READ-ONLY** : les gloses sont **proposées, non écrites, non validées**.

**Aucune donnée n'a été modifiée.** La levée du goulot reste à faire par un éditeur humain (ou une phase explicitement autorisée à valider).

---

## B. Before State

- `word_translations` : **263** lignes FR, **toutes** `is_validated = true`, toutes sous la source **« Hikma — lexique éditorial »** (workflow `proposed → validated`, « validation humaine obligatoire »).
- `quran_words` : 21 296 formes, `meaning` = glose **anglaise** (Quran.com), colonnes `root` / `lemma_id` / `source_id`.
- `lemma_translations` FR : **32** (dont 8 lemmes `validated`).
- Formes enseignées : **270**, dont **265** disposent d'un sens FR fiable et **5** d'un fallback EN.
- Formes manquantes avec FR déjà disponible : **165** (≈ +1,45 %).
- Formes manquantes `EN_ONLY` : **21 026**.

---

## C. Candidate Selection Method

1. Recalcul de la fréquence (`word_occurrences` → comptage par `word_id`).
2. Exclusion des formes déjà enseignées (`lesson_words`).
3. Tri des formes manquantes par fréquence décroissante (top 60 analysées).
4. Pour chaque candidat : glose EN (`quran_words.meaning`), translittération, statut FR (forme directe / lemme), profil sémantique (contenu vs fonctionnel vs clitique).
5. Classement :
   - **P1** : fréquent + lexicalement stable + traduction FR certaine + source exploitable.
   - **P2** : intéressant mais polysémique / fonctionnel / nécessite une décision éditoriale.
   - **BLOCKED** : particule grammaticale, clitique composé, ou ambiguïté forte.

---

## D. P1 Candidates (15 — à valider humainement, NON écrits)

| Forme | Occ. | Rang | Glose FR proposée | Source | Validée | Statut |
|---|---:|---:|---|---|---|---|
| قَالَ | 407 | 15 | dire | Kazimirski 1860 (PD) + Hamidullah | ❌ | PROPOSED |
| ذَٰلِكَ | 267 | 21 | cela / celui-là | Kazimirski 1860 (PD) | ❌ | PROPOSED |
| أَوْ | 263 | 22 | ou | Kazimirski 1860 (PD) | ❌ | PROPOSED |
| ٱلْأَرْضِ | 178 | 39 | la terre | Kazimirski 1860 (PD) + Hamidullah | ❌ | PROPOSED |
| ٱلسَّمَـٰوَٰتِ | 174 | 41 | les cieux | Kazimirski 1860 (PD) + Hamidullah | ❌ | PROPOSED |
| قَالُوا۟ | 171 | 42 | ils ont dit | Kazimirski 1860 (PD) | ❌ | PROPOSED |
| كَفَرُوا۟ | 156 | 47 | ils ont mécru | Kazimirski 1860 (PD) + Hamidullah | ❌ | PROPOSED |
| أُو۟لَـٰٓئِكَ | 133 | 59 | ceux-là | Kazimirski 1860 (PD) | ❌ | PROPOSED |
| يَوْمَ | 131 | 64 | jour | Kazimirski 1860 (PD) + Hamidullah | ❌ | PROPOSED |
| كُلِّ | 123 | 66 | tout / chaque | Kazimirski 1860 (PD) | ❌ | PROPOSED |
| شَىْءٍۢ | 99 | 79 | chose | Kazimirski 1860 (PD) + Hamidullah | ❌ | PROPOSED |
| ٱلدُّنْيَا | 87 | 87 | la vie d'ici-bas | Kazimirski 1860 (PD) + Hamidullah | ❌ | PROPOSED |
| يُؤْمِنُونَ | 86 | 88 | ils croient | Kazimirski 1860 (PD) + Hamidullah | ❌ | PROPOSED |
| تَعْمَلُونَ | 82 | 94 | vous œuvrez | Kazimirski 1860 (PD) + Hamidullah | ❌ | PROPOSED |
| بَعْدِ | 82 | 95 | après | Kazimirski 1860 (PD) | ❌ | PROPOSED |

**Occurrences cumulées P1 : 2 439 → ≈ +3,15 %** de couverture potentielle (si validées **et** enseignées).

> Note : قَالَ / قَالُوا۟ partagent le même verbe (qāla) ; ذَٰلِكَ / أُو۟لَـٰٓئِكَ sont des démonstratifs ; les gloses sont des équivalents lexicaux standard, jamais des traductions contextuelles d'un verset particulier.

---

## E. P2 Candidates (≤15 — revue éditoriale requise, NON écrits)

| Forme | Occ. | Raison du P2 |
|---|---:|---|
| مَن | 223 | relatif/interrogatif « qui / celui qui » — valeur contextuelle |
| كَانُوا۟ | 209 | copule kāna + pluriel — nuance temporelle |
| كُنتُمْ | 150 | copule kāna — « vous êtes/étiez » |
| إِذْ | 152 | particule temporelle « quand / lorsque » |
| إِلَىٰ / إِلَى | 211 / 140 | préposition « vers / à » — fonctionnelle mais stable |
| عِندَ | 98 | préposition « auprès de / chez » |
| دُونِ | 83 | préposition « en dehors de / sans » |
| لَهُمْ / لَهُۥ | 204 / 175 | ل + pronom — clitique |
| فِيهَا / فِيهِ | 181 / 97 | فِي + pronom — clitique |
| عَـلَيْهِ / عَـلَيْكُمْ | 131 / 107 | عَلَى + pronom — clitique |
| قَدْ | 118 | particule « déjà / certes » |
| إِلَّآ | 100 | « sauf / excepté » — stable mais fonctionnelle |
| أَمْ | 103 | « ou bien » interrogatif |
| بَلْ | 96 | « plutôt / mais » |
| وَكَانَ | 84 | clitique و + kāna |

---

## F. Blocked Candidates (grammaticales / clitiques composées — NON écrits)

- **Négation** : لَا (616), لَّا (131).
- **Complétive/particules** : أَن (461), إِن (253), إِنْ (91), إِنَّا (115), إِنَّمَا (82), قَدْ (118), بَلْ (96), أَمْ (103).
- **Prépositions variantes** : مِنْ (253), مّنَ (281), مِنۢ (131), فِىٓ (86).
- **Clitiques و + mot** : وَمَن, وَإِن, وَإِذَا, وَقَالَ, وَهُمْ, وَلَوْ, وَلَقَدْ, وَٱلَّذِينَ, وَهُوَ, وَكَانَ…
- **ٱللَّهَ (567)** : forme accusative de الله — lexème identique, forme distincte (Modèle A). Décision éditoriale requise : glose de forme « Allah » ou mapping lemme.
- **بِمَا (253)** : بِ + مَا — composé fonctionnel.

Règle respectée : une forme très fréquente n'est pas automatiquement un bon candidat pédagogique.

---

## G. Source & License Audit

| Source (table `sources`) | Type | Licence / statut | Utilisable pour les gloses FR ? |
|---|---|---|---|
| Hikma — lexique éditorial | editorial | Production interne ; « validation humaine obligatoire » | OUI (après validation humaine) |
| **Kazimirski — Dictionnaire arabe-français (1860)** | historical_dictionary | **Domaine public** (auteur †1887) ; `PROJECT_AUTHORIZATION (LEGAL_GO)` — décision opérationnelle du propriétaire, non un avis juridique | **OUI (source de référence)** |
| Kazimirski — Le Koran (1869) | quran_translation | **Domaine public** (`DOCUMENTED_PUBLIC_DOMAIN`) | OUI (croisement de contexte) |
| Quran.com API v4 | api | Texte uthmani : Tanzil (libre). **Traductions : droits des traducteurs** | ❌ pour les gloses (droit d'auteur) — utilisé uniquement comme signal de croisement |
| Hugging Face audio / MASAQ | word_audio / linguistic | Apache-2.0 / CC BY | hors périmètre lexical |

**Conclusion licence** : la source licite et documentée pour les gloses FR est **Kazimirski (dictionnaire 1860, domaine public)**, croisée avec **Kazimirski (Le Koran 1869, domaine public)** et la glose EN comme signal. Aucun contenu protégé (Quran.com traductions) n'est copié.

> Rappel ÉTAPE 9 : « les anciennes recherches juridiques sur Kazimirski restent distinctes ». Elles sont **documentées** dans la table `sources` (metadata `legal_status`) — non re-vérifiées ici (pas de recherche web disponible : `WEB_RESEARCH_LIMITED`).

---

## H. Inserted / Updated Entries

**Aucune** (décision READ-ONLY). `0` insert, `0` update, `0` source créée, `0` doublon.

---

## I. Validation Status

- **Aucune** glose écrite, donc **aucune** marquée `is_validated = true`.
- Les 15 gloses P1 sont au statut **PROPOSED** (dans ce rapport uniquement), en attente d'un éditeur humain.
- La convention de validation existante (« Phase 23E — validation contrôlée (glose EN + Hamidullah) ») reste la référence pour une future écriture validée.

---

## J. Before / After Metrics

Aucune écriture → **Avant == Après** pour tous les compteurs DB.

| Métrique | Avant | Après | Delta |
|---|---:|---:|---:|
| Formes FR fiables (validées) | 263 (+165 par lemme) | 263 (+165 par lemme) | **0** |
| Formes EN_ONLY (manquantes) | 21 026 | 21 026 | **0** |
| Occurrences lexicalement exploitables | 14 522 (+1 126 potentiel) | identique | **0** |
| Sources | 6 | 6 | **0** |
| Doublons | 0 | 0 | 0 |
| Formes invalides | 0 | 0 | 0 |

---

## K. Lexical Coverage Potential

- **`LEXICAL_COVERAGE_POTENTIAL`** (formes ayant déjà un sens FR fiable, qu'elles soient enseignées ou non) :
  - enseignées : 14 522 occ = 18,76 % ;
  - manquantes déjà-FR : +1 126 occ ≈ +1,45 % ;
  - **P1 proposées (non validées)** : +2 439 occ ≈ **+3,15 %** si un jour validées et enseignées.
- Plafond potentiel si les 15 P1 étaient validées puis intégrées : ≈ **23,3 %**.

---

## L. User Coverage Impact

- **`USER_COMPREHENSION_COVERAGE` : inchangée (0).**
- Aucune glose écrite → aucun effet sur le resolver → aucun changement de `user_word_progress`, SRS, mastery ou score.
- Distinction obligatoire respectée : **potentiel lexical ≠ compréhension utilisateur**.

---

## M. Curriculum Integrity Check

- Nombre de leçons : **inchangé** (aucune lecture/écriture de `lessons`).
- Ordre : **inchangé**.
- Formes enseignées : **270, inchangé**.
- `selectActiveLearningPath` / Daily Plan / SRS / mastery : **inchangés** (aucun fichier moteur modifié).

---

## N. Resolver Integrity Check

- `resolveWordMeanings` et la couche `language.ts` **non modifiés**.
- Aucune glose écrite → comportement du resolver **strictement identique**.

---

## O. Test Results

- **Aucun code modifié** → aucun nouveau test nécessaire, aucun test existant modifié.
- Les **725 tests** restent verts (état non rejoué faute de changement ; aucun risque introduit).

---

## P. DB Integrity

- Aucune écriture, aucun upserter, aucun `sources` ajouté.
- Les scripts d'audit (`tmp/phase40b-*.cjs`) sont en lecture seule (service role, `select` uniquement).

---

## Q. Remaining EN_ONLY

- **21 026** formes restent `EN_ONLY` (dont les 15 P1 et les P2 proposées).
- Le goulot de couverture identifié par 40A **demeure** jusqu'à validation humaine.

---

## R. Remaining Lexical Gaps

- Particules grammaticales (لَا, أَن, إِنْ, مِن/variantes, clitiques و+…) : **BLOCKED** (stratégie contextuelle requise).
- Flexions de الله / رَبّ déjà-FR mais non enseignées : **165 formes** disponibles (+1,45 %), à intégrer quand une sourate les contient naturellement.
- Les 5 formes enseignées en fallback EN (dont كَانَ) : **REVIEW_REQUIRED** (glose FR à fournir).

---

## S. Risks

1. **Auto-validation** (évité) : marquer `is_validated=true` sans éditeur humain violerait la convention « validation humaine obligatoire ».
2. **Polysémie** des particules (لَا, أَن, إِنْ) : risque de « un mot = un sens » trompeur si intégrées isolément.
3. **Provenance Quran.com** : ses traductions sont sous droits → ne jamais copier la glose EN comme glose FR.
4. **Clitiques (و + mot)** : enseignés comme formes distinctes, risque de redondance pédagogique.
5. **`WEB_RESEARCH_LIMITED`** : l'audit licence repose sur les métadonnées déjà documentées dans `sources` (Kazimirski PD), non re-vérifiées en ligne.

---

## T. Recommended Phase 40C

**« Validation humaine puis écriture PROPOSED→VALIDATED des gloses P1 »** (toujours 0 migration, 0 moteur) :

1. Un éditeur humain revoit les **15 gloses P1** (tableau D) contre Kazimirski 1860 + Hamidullah.
2. Une fois approuvées, les insérer (idempotent, `upsert` sur `UNIQUE(word_id, language, source_id)`) sous la source **Kazimirski (1860)** ou **Hikma éditorial**, selon la décision de provenance.
3. Les marquer `is_validated = true` + `validated_at` **uniquement après** la revue humaine.
4. **Ne pas** les ajouter au curriculum automatiquement : elles deviennent simplement exploitables pour de futures sourates/leçons.
5. Recalculer le `LEXICAL_COVERAGE_POTENTIAL` avant/après.

**Stop** — ne pas écrire tant qu'un éditeur humain n'a pas validé les gloses.

---

## Verdict final

| Élément | État |
|---|---|
| Schéma inspecté | ✅ `word_translations` / `sources` / `quran_words` / `word_occurrences` |
| Convention de validation identifiée | ✅ « Hikma éditorial » + `proposed → validated` |
| Candidats reconstruits (DB) | ✅ top 60 formes manquantes |
| P1 / P2 / BLOCKED | ✅ 15 / 15 / ~30 |
| Source & licence | ✅ Kazimirski 1860 domaine public (documenté) |
| Écritures DB | **0** (décision utilisateur : READ-ONLY) |
| Curriculume / resolver / moteur | **inchangés** |
| Tests | 725 verts (inchangés) |

**Décision : `PHASE_40B_READ_ONLY_ONLY`** — le goulot lexical est cartographié et les gloses P1 sont prêtes pour validation humaine ; aucune donnée n'a été écrite.
