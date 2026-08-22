# PHASE 24B — QAMAR LEGAL & DATA USAGE REVIEW

STATUS = READ_ONLY
DATABASE_WRITES = 0
CODE_WRITES = 0
IMPORTS = 0
MIGRATIONS = 0
SEEDS = 0
VALIDATIONS = 0

## 1. Executive Summary

La question posée : **« QAMAR peut-il légalement et contractuellement être
utilisé pour enrichir Hikma, y compris dans un produit
commercial/propriétaire ? »**

Réponse honnête : **on ne peut pas le dire aujourd'hui.** L'article
scientifique (ACL Anthology) est sous **CC BY 4.0** (texte papier), mais la
licence du **dataset** n'est **déclarée nulle part** dans les sources
publiques accessibles : aucun repository officiel, aucun fichier LICENSE,
aucune page projet, aucun dataset card trouvé malgré une recherche
approfondie.

Décision : **D — QAMAR_LEGAL_REVIEW_REQUIRED**.

## 2. Identité exacte (chaîne article/code/dataset)

| Élément | Valeur |
|---|---|
| Projet | QAMAR (morphological analysis resource) |
| Auteurs | Sara Faqihi, Karim Bouzoubaa, Rachida Tajmout, Driss Namly |
| Institution | Université Mohammed V de Rabat (LRIT) |
| Publication | AbjadNLP @ EACL 2026 (Rabat, mars 2026) |
| Anthology / DOI | 2026.abjadnlp-1.38 · 10.18653/v1/2026.abjadnlp-1.38 |
| Supplementary | `2026.abjadnlp-1.38.OptionalSupplementaryMaterial.zip` (existe) |
| Repository / URL de données | **aucun identifié** (pas de GitHub, pas de HuggingFace, pas de page projet) |
| Version | non précisée |

**Rappel** : article ≠ logiciel ≠ dataset ≠ interface. Chacun peut avoir une
licence différente. Seul l'article est vérifiable publiquement.

## 3. Licence — constat

- **Texte de l'article** : CC BY 4.0 (politique standard des papiers ACL ;
  cela couvre le *papier*, pas les données).
- **Données annotées (dataset)** : **AUCUNE licence déclarée** trouvée dans :
  métadonnées Anthology, résumé, page de l'évènement, réseaux de recherche,
  recherches GitHub/HuggingFace deep.
- **Code** : aucune déclaration.
- **Contradiction** : pas de contradiction formelle (sources concordantes sur
  l'absence de déclaration), mais **absence grave de preuve de permission**.

> `« Le site/zip est accessible » ≠ « les données sont libres »`.
> `« Academic dataset » ≠ autorisation commerciale ».

## 4. Utilisation commerciale

**`COMMERCIAL_USE_UNCLEAR`** — SaaS, mobile, web, abonnement, premium,
publicité, produit propriétaire : **non autorisé à ce stade** (ni interdit
prouvé, ni permis). "Open source"/"academic" ne valent pas autorisation.

## 5. Données dérivées

La chaîne `QAMAR → alignement → validation → dataset linguistique Hikma` est
**pas autorisable sans confirmation** : modification, transformation,
extraction de sous-ensemble, agrégation, dérivation, stockage des dérivés,
usage propriétaire — tout est `UNKNOWN`.

## 6. Stockage Supabase

| Type | Statut |
|---|---|
| A. copie exacte | UNKNOWN (pas autorisée à ce stade) |
| B. données transformées | UNKNOWN |
| C. faits linguistiques dérivés | UNKNOWN |
| D. annotations enrichies Hikma | UNKNOWN |
| E. statistiques | UNKNOWN |
| F. mappings d'alignement | UNKNOWN |

> Une permission de **consulter** ne vaut pas permission de **stocker**.

## 7. Redistribution (display / storage / API / download / bundle)

Toutes les modalités sont **UNKNOWN** — aucune n'est autorisable sans licence.

## 8. Attribution

- Obligatoire : probable pour l'article (CC BY), **non démontrée pour les données**.
- Forme/emplacement/notice : non établies.
- Citation proposée (valable pour créditer l'article, pas pour autoriser les
  données) : *Faqihi, S., Bouzoubaa, K., Tajmout, R., & Namly, D. (2026),
  QAMAR…, AbjadNLP/EACL 2026*.
- Un texte d'attribution ne sera proposé **que si** la source officielle
  l'exige et le précise.

## 9. Alignement technique — faisabilité (READ_ONLY)

- Hikma : 21 296 `quran_words` · 77 430 occurrences · 6 236 ayahs.
- QAMAR : comptage token **non confirmé** (probablement ≈ 77 429 si la
  tokenisation suit Quranic Corpus/QuranMorph).
- Δ à expliquer (le cas échéant) : tokenisation clitiques, normalisation
  Unicode/diacritiques, variantes orthographiques, fusion/split vs Quran.com,
  basmala.
- **Ne pas supposer une erreur** : analyser puis conclure.
- Alignement : `surah + ayah + token_position` ; jamais chaîne arabe seule.
  Classement : EXACT_MATCH · AMBIGUOUS · MISSING_SOURCE_TOKEN ·
  MISSING_HIKMA_TOKEN · SEGMENTATION_MISMATCH.

## 10. Test Al-Fātiḥah (README, conceptuel)

| Champ | Statut théorique |
|---|---|
| FORM · STEM · LEMMA · ROOT · POS | AVAILABLE (annoncé pour chaque mot) |
| MORPHOLOGICAL_FEATURES · SEGMENTATION · PREFIX · SUFFIX · PARTICLES | **NOT_VERIFIED** (pas de données téléchargées) |
| PATTERN | NOT_VERIFIED |

Aucune écriture dans `quran_words` / `lemmas` : **AUCUNE**, comme exigé.

## 11. Matrice Hikma vs QAMAR

| Champ | Hikma actuel | QAMAR | Compatibilité |
|---|---|---|---|
| form | AVAILABLE | AVAILABLE | ok |
| transliterancation / meaning EN | AVAILABLE | n/a | ok |
| glose FR éditoriale | 70 + 28 | n/a (hors périmètre) | glose = Hikma |
| lemma | PARTIAL (135 + 184) | AVAILABLE | source à valider |
| **root** | **MISSING (0)** | AVAILABLE | **valeur ajoutée** |
| **stem** | MISSING | AVAILABLE | **valeur ajoutée** |
| **POS** | MISSING | AVAILABLE | **valeur ajoutée** |
| morphology / segmentation / prefix / suffix / particles / pattern | MISSING | à vérifier | — |
| occurrence / ayah / surah | AVAILABLE | n/a (source token) | alignement par position |

## 12. Provenance (conceptuelle, non créée)

`source_id` · `source_version` · `source_record_id` · `license` ·
`alignment_method` · `confidence` · `verified_at` — si QAMAR devenait
utilisable (pas de table, pas de migration, pas de code).

## 13. Scraping / téléchargement officiel

- Mécanisme officiel : **supplementary material ACL (zip)**.
- **Aucun** repository / API / page de téléchargement dédié trouvé.
- **Aucun contournement** : robots.txt, auth, rate limits, paywall,
  protections, conditions contractuelles interdits.
- **Scraping : NON recommandé** (aucun) — uniquement téléchargement officiel
  **après clarification légale**, avec décision humaine.

## 14. Décision

**D — QAMAR_LEGAL_REVIEW_REQUIRED**

Fondée sur : l'information sur la licence du dataset est **absente** des
sources publiques vérifiables (recherche approfondie : Anthology, page projet,
GitHub, HuggingFace, réseaux). L'ambiguïté impose `LEGAL_REVIEW_REQUIRED`
(règle §15). Ne pas conclure A/B/C (pas de preuve), ne pas conclure E (rien ne
démontre l'inadaptation technique ni un blocage définitif).

Rappel : `open source` ou `academic dataset` ≠ autorisation commerciale ;
l'accessibilité ≠ liberté.

## 15. Recommandation

**Chemin QAMAR (si la licence est confirmée par les auteurs / le zip
adhérent)** :
`PILOTE READ_ONLY → ALIGNEMENT → QUALITY AUDIT → HUMAN VALIDATION → MIGRATION
→ CONTROLLED IMPORT → HikmaExplanation v2`.

**Fallback légal si QAMAR reste bloqué** (sans implémenter) :

- **QuranMorph** — CC BY 4.0 (lemma + POS, attribution) ;
- **Kazimirski / Lane** — domaine public (racines, extraction + revue) ;
- **données éditoriales Hikma** (gloses FORME > LEMME > EN).

**Prochaine phase (décision humaine)** : écrire aux auteurs QAMAR pour
obtenir licence/conditions écrites OU lire le `LICENSE`/README du zip
supplementaire après autorisation, OU activer le fallback légal.

## 16. Non-régression & état final

`FATIHAH_REFERENCE_LOCKED = PRESERVED` · aucun code, aucune table, aucun
`quran_words`/`lemmas`/gloses/mod mappings modifiés · `DATABASE_WRITES = 0` ·
tests inchangés (456 passerelles hérités de 21G).

**Documents créés** : `PHASE_24B_QAMAR_LEGAL_DATA_REVIEW.md` ·
`tmp/phase24b-qamar-legal-data-review.json`.

---

DATABASE_WRITES = 0
CODE_WRITES = 0
IMPORTS = 0
MIGRATIONS = 0
SEEDS = 0
VALIDATIONS = 0

FIN PHASE 24B