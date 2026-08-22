# PHASE 24A — AUDIT COMPLET DES SOURCES LINGUISTIQUES EXTERNES POUR HIKMA

STATUS = READ_ONLY
DATABASE_WRITES = 0
CODE_WRITES = 0
IMPORTS = 0
MIGRATIONS = 0
SEEDS = 0
VALIDATIONS = 0

## 1. Executive Summary

Les données linguistiques profondes (racine, POS, stem, morphologie,
segmentation) **existent** dans des corpus académiques, mais **aucune** ne
peut être intégrée sans **revue juridique** :

- **QAMAR** (2026) : techniquement le meilleur (stem + lemme + **racine** +
  POS, vérifié), **licence non divulguée publiquement**.
- **Quranic Arabic Corpus** : morphologie + segmentation complètes, mais
  **GNU GPL** + « terms of use » — **pas simplement non-commercial** (correction
  importante par rapport aux phases précédentes).
- **QuranMorph** (2025) : **CC BY 4.0** (juridiquement clair), mais **sans
  racine**.

Décision : **C — DATA_AVAILABLE_BUT_LEGAL_REVIEW_REQUIRED**.

## 2. Problème

La base Hikma ne possède pas réellement : `root` (0), `POS`, `stem`,
`morphological_features`, `pattern`, `prefixes`, `suffixes`,
`attached_particles`, `segmentation`, `lexical_family`,
`contextual_sense_per_occurrence`. `HikmaExplanation` reste fondé sur
glose + lemme + contexte + audio → générique.

## 3. Matrice des sources (§3, §4)

### QAMAR (candidat principal)

| Champ | Valeur |
|---|---|
| Référence | Faqihi, Bouzoubaa, Tajmout, Namly — AbjadNLP/EACL 2026 |
| URL / DOI | aclanthology.org/2026.abjadnlp-1.38 · 10.18653/v1/2026.abjadnlp-1.38 |
| Données | MSA + **stem + lemma + root + POS**, chaque mot, vérifié manuellement |
| Couverture | chaque mot coranique (gold-standard) |
| Téléchargement | supplementary material ACL (zip) |
| Licence | **non divulguée** → `LEGAL_REVIEW_REQUIRED` |
| Commercial | UNKNOWN |
| Verdict | **techniquement la meilleure** ; bloquée par licence |

### QuranMorph (Quran Corpus, SinaLab)

| Champ | Valeur |
|---|---|
| Référence | Akra, Hammouda, Jarrar — Birzeit/SinaLab 2025 |
| URL | sina.birzeit.edu/quran |
| Données | lemma (Qabas, 4 616) + POS (40 tags SAMA/Qabas) |
| Couverture | 77 429 tokens / 6 235 versets / 19 009 formes uniques |
| Licence | **CC BY 4.0** (confirmer au téléchargement) |
| **Racine** | ❌ absente |
| Verdict | `SAFE_WITH_ATTRIBUTION` (juridiquement le plus sûr, incomplet) |

### Quranic Arabic Corpus

| Champ | Valeur |
|---|---|
| Référence | Kais Dukes 2009–2017, Leeds / quran.com |
| URL | corpus.quran.com |
| Données | morphologie complète (cas/genre/nombre/personne/temps/mode/voix) + segmentation clitiques (128 219 formes) + syntaxe + ontologie |
| Licence | **GNU GPL** + « terms of use » (footer officiel) |
| **Correction** | ⚠️ n'est **pas** « non-commercial » : c'est GPL (copyleft) + conditions d'usage séparées |
| Risque SaaS | copyleft si les annotations sont GPL → **incompatible avec un produit propriétaire** sans clarification |
| Verdict | `LEGAL_REVIEW_REQUIRED` |

### Autres sources

| Source | Données | Licence | Verdict |
|---|---|---|---|
| Qabas | lemmes (~60K) | CC-BY-ND-4.0 | NOT_SUITABLE (ND) |
| Buckwalter/SAMA (LDC) | stems+affixes+POS (MSA) | LDC (payant) | REQUIRES_REVIEW (pas Coran) |
| Lane's Lexicon (1863-93) | racines + définitions | domaine public | SAFE_FOR_COMMERCIAL |
| Hans Wehr | racines + définitions | copyright | NOT_SUITABLE |
| Kazimirski 1860/69 | racines + définitions FR | domaine public (édition originale) | SAFE_FOR_COMMERCIAL |

## 4. Audit juridique (§5, §8)

| Source | CAN_VIEW | CAN_DOWNLOAD | COMMERCIAL | DERIVE | STORE_DERIVED | REDISTRIBUTE | ATTR | SA | NC | ND | VERDICT |
|---|---|---|---|---|---|---|---|---|---|---|---|
| QAMAR | ✅ | à vérifier | ❓ | ❓ | ❓ | ❓ | probable | ? | ? | ? | LEGAL_REVIEW_REQUIRED |
| QuranMorph | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | SAFE_WITH_ATTRIBUTION |
| Quranic Arabic Corpus | ✅ | partiel | ⚠️ GPL | ⚠️ | ⚠️ copyleft | ⚠️ | ✅ | GPL | ? | ? | LEGAL_REVIEW_REQUIRED |
| Qabas | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ? | ❌ | ✅ | NOT_SUITABLE |
| Buckwalter/SAMA | ✅ | LDC | ❓ | ❓ | ❓ | ❓ | ? | ? | ? | ? | REQUIRES_REVIEW |
| Lane | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | SAFE |
| Hans Wehr | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | — | — | — | — | NOT_SUITABLE |
| Kazimirski | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | SAFE (édition originale) |

**Règle absolue** : « le site est accessible » ≠ « les données sont libres ».
Le scraping n'est **jamais** un moyen de contourner une licence. Si ambigu :
`LEGAL_REVIEW_REQUIRED`.

## 5. Kazimirski — distinction obligatoire (§9)

- **Œuvre historique (1860/1869)** : domaine public.
- **Transcription numérique / scan / base dérivée modernes** : droits séparés
  — ne pas supposer libres.
- Utilisable : l'édition **originale** (déjà partiellement scannée en 16M/16L),
  avec revue humaine, pas une transcription moderne quelconque.

## 6. Alignement technique (§10)

| Corpus | Tokens | Versets | Formes uniques |
|---|---|---|---|
| Hikma | 77 430 | 6 236 | 21 296 |
| QuranMorph | 77 429 | 6 235 | 19 009 |

- Δ +1/+1 (probable basmala 1:1).
- Écart formes uniques (21 296 vs 19 009) : segmentation Quran.com produit plus
  de variantes orthographiques.
- **Méthode** : aligner par **occurrence (`surah + ayah + position`)**, jamais
  par chaîne arabe (constaté : la recherche par chaîne exacte échoue selon la
  normalisation diacritique).

## 7. Test de couverture sur Al-Fātiḥah (§11) — conceptuel

Hikma-side (connu) : 26 formes, 25 gloses + 1 lemme, 9 lemmes directs,
26/26 audio, 29 occurrences.

| Champ | Statut |
|---|---|
| forme / occurrences / audio | AVAILABLE |
| glose / lemme | PARTIAL |
| root / POS / stem / features / segmentation / prefix / suffix / pattern / particules | **MISSING** |
| alignement source (QAMAR/QuranMorph) | **UNALIGNED** (téléchargement bloqué par licence) |

## 8. Scraping (§14)

| Source | Techniquement possible | Juridiquement clair | Recommandé |
|---|---|---|---|
| QAMAR | n/a (zip ACL) | non vérifié | non |
| QuranMorph | n/a (téléchargement officiel) | oui | téléchargement officiel |
| Quranic Arabic Corpus | oui | **non** (GPL + terms) | **non** |
| Qabas | oui | non (ND) | non |

Aucun contournement de robots.txt / auth / paywall / rate limit / protection
technique / restriction contractuelle n'est proposé.

## 9. Couche dérivée Hikma + provenance (§15, §16)

```
source externe → alignement → validation → données linguistiques Hikma
→ provenance → explication pédagogique
```

Champs de provenance proposés (conceptuels, non créés) : `source_id`,
`source_version`, `source_record_id`, `source_license`, `alignment_method`,
`confidence`, `verified_at`, `verification_status`.

Stockables si licence le permet : `root`, `lemma`, `stem`, `pos`,
`morphological_features`, `segmentation`, `pattern`.

## 10. Réponses aux 10 questions (§21)

1. **Racine + morphologie ?** OUI — QAMAR (racine+stem+POS) ou Quranic Corpus (morphologie complète).
2. **Quelles sources ?** QAMAR, Quranic Arabic Corpus, QuranMorph, Kazimirski/Lane.
3. **Légalement utilisable ?** QuranMorph (CC BY 4.0) et Kazimirski/Lane (domaine public) oui ; QAMAR et Quranic Corpus = revue juridique requise.
4. **Scraper ?** NON — téléchargements officiels / licence explicite uniquement.
5. **Stocker données dérivées ?** OUI si licence le permet ; NON pour Qabas (ND) ; RISQUE pour Quranic Corpus (GPL copyleft).
6. **Meilleure techniquement ?** QAMAR.
7. **Meilleure juridiquement ?** QuranMorph + Kazimirski/Lane.
8. **Combiner ?** OUI — QAMAR (morphologie) sinon QuranMorph (lemme+POS) + Kazimirski/Lane (racines).
9. **Recommandation ?** Revue juridique QAMAR en priorité ; fallback QuranMorph + Kazimirski.
10. **Prochaine phase ?** Revue juridique formelle + preuve d'alignement token.

## 11. Décision

**C — DATA_AVAILABLE_BUT_LEGAL_REVIEW_REQUIRED**

Les données nécessaires **existent** (QAMAR, Quranic Corpus), mais les deux
sources techniquement suffisantes exigent une **revue juridique** (licence
QAMAR inconnue ; GPL + terms of use pour Quranic Corpus). Aucun pilote ne
doit démarrer avant cette revue. Un repli juridiquement clair existe
(QuranMorph CC BY 4.0 + Kazimirski/Lane domaine public), mais il ne couvre
pas la racine à lui seul → le workflow multi-sources est à préparer en
parallèle.

Workflow obligatoire (aucune étape sautée) :
`AUDIT SOURCE → LICENCE → ALIGNEMENT → PILOTE READ_ONLY → VALIDATION → LEGAL APPROVAL → MIGRATION → IMPORT → INTÉGRATION`.

## 12. État final

- Décision : **C — DATA_AVAILABLE_BUT_LEGAL_REVIEW_REQUIRED**
- `FATIHAH_REFERENCE_LOCKED = PRESERVED` · aucune donnée/code/migration/import/seed modifiés.
- `quran_words 21 296` · `word_occurrences 77 430` · `ayahs 6 236` · `translations 24 944` — inchangées.
- Fichiers créés : `PHASE_24A_LINGUISTIC_SOURCE_DISCOVERY.md`, `tmp/phase24a-linguistic-source-discovery.json`.

---

DATABASE_WRITES = 0
CODE_WRITES = 0
IMPORTS = 0
MIGRATIONS = 0
SEEDS = 0
VALIDATIONS = 0

FIN PHASE 24A
