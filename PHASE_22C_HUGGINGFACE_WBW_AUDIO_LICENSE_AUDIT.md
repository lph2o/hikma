# PHASE 22C — HUGGING FACE WBW AUDIO — LICENCE + PROVENANCE + COMPATIBILITÉ COMMERCIALE

**STATUS FINAL : `HUGGINGFACE_WBW_AUDIT_COMPLETE`**
**DATABASE_WRITES = 0 · IMPORTS = 0 · MIGRATIONS = 0 · CODE_PRODUCTION_CHANGES = 0 · STORAGE_WRITES = 0**

> Audit strictement READ_ONLY. Aucun fichier importé, aucun schéma modifié, aucune
> écriture. Ce rapport répond : **peut-on abandonner QF et utiliser ce dataset HF
> pour le WBW de Hikma (SaaS commercial) ?**

---

## 0. RÉSUMÉ EXÉCUTIF

**Classification finale : `REVIEW_REQUIRED`** — **PAS** `COMMERCIAL_SAFE`.

Le dataset déclare **Apache-2.0**, mais :
1. il n'y a **aucun fichier LICENSE / DATA_LICENSE** dans le repo ;
2. la **provenance des enregistrements audio est non divulguée** (récitant(s),
   source originale et détenteur des droits inconnus) ;
3. le rapport du mainteneur avoue « the original source material was converted
   from traditional MP3 encoding » → **ré-encodage d'enregistrements tiers** ;
4. la terminologie **Muallim / Mujawwad** correspond aux modes de récitation
   mot-à-mot de **Quran.com/QF** — forte suspicion de dérivation de l'audio QF.

**Apache-2.0 ne peut pas transférer des droits sur des fichiers audio que le
mainteneur ne détient pas.** C'est le risque classique de « licence laundering ».
→ **Recommandation : C. DEMANDER UNE CLARIFICATION/LICENCE** au mainteneur.

---

## 1. PARTIE A — AUDIT JURIDIQUE DU DATASET

Inspection directe du repo (`zaibihassan/Quranic-Word-By-Word-Audio-Data`) :

| vérification | résultat |
|---|---|
| LICENSE (fichier) | ❌ absent |
| README | ✅ présent — frontmatter `license: apache-2.0` |
| DATA_LICENSE.md | ❌ absent |
| card / metadata HF | ✅ — champ licence Apache-2.0 |
| fichier NOTICE | ❌ absent |
| provenance des audios | ❌ non divulguée |
| identité des récitateurs | ❌ non identifiés |
| source externe des fichiers | ❌ non mentionnée |

**Arborescence racine** : `muallim/ · mujawwad/ · .gitattributes · README.md ·
dataset_optimization_report.md · hf_dataset_banner.png · xet`. **Aucun LICENSE.**

→ `license = apache-2.0` est une **déclaration de métadonnée**, pas une preuve
que les fichiers audio sont couverts.

---

## 2. PARTIE B — PROVENANCE DES ENREGISTREMENTS

- **Muallim** (style pédagogique, lent) et **Mujawwad** (style tajweed) sont des
  **styles de récitation**, pas des noms de récitants.
- Le mainteneur **n'identifie** ni le récitant, ni l'organisation/studio détenteur,
  ni la source d'origine des MP3.
- Le mainteneur **n'affirme pas** détenir les droits nécessaires.
- **Aucune licence distincte** des fichiers audio, **aucune attribution exigée**
  (seulement « feel free to link back »), **aucune restriction** déclarée.
- **Preuve primaire manquante** : rien ne documente qui a enregistré les audios.

---

## 3. PARTIE C — APACHE-2.0

- Apache-2.0 est une licence de **logiciel** : elle autorise usage commercial,
  modification, distribution, sublicence, **à condition** de conserver les
  notices (NOTICE) et de reproduire la licence.
- Apache-2.0 couvre **ce que le mainteneur possède réellement** : la structure du
  dataset, les scripts, le pipeline d'optimisation, les métadonnées.
- Apache-2.0 **n'accorde aucun droit** sur des **enregistrements tiers** dont le
  mainteneur n'est pas détenteur. Déclarer « apache-2.0 » sur un dataset contenant
  des audios tiers ne crée pas de droit.
- **Compatibilité SaaS** : si Apache-2.0 s'appliquait réellement aux fichiers
  audio, l'usage commercial serait permis (avec attribution). Mais cette
  hypothèse n'est **pas démontrée** pour les fichiers audio eux-mêmes.

---

## 4. PARTIE D — COMPATIBILITÉ AVEC HIKMA (scénario Storage/CDN/exercices)

| usage | statut |
|---|---|
| utilisation commerciale | UNCLEAR |
| stockage permanent | UNCLEAR |
| stockage Supabase Storage | UNCLEAR |
| diffusion CDN | UNCLEAR |
| streaming audio | UNCLEAR |
| téléchargement | UNCLEAR |
| mise en cache | UNCLEAR |
| reproduction dans l'app | UNCLEAR |
| usage pédagogique / exercices / reviews | UNCLEAR |
| découpage / normalisation / conversion / renommage | UNCLEAR (déjà transformé par le mainteneur) |
| génération de plusieurs URLs | UNCLEAR |
| redistribution autonome | UNCLEAR |

Tous ces points sont **subordonnés à la question non résolue** : le mainteneur
détient-il les droits sur les audios ? Sans preuve, aucun scénario Hikma n'est
sûr, même si Apache-2.0 le permettrait en apparence.

---

## 5. PARTIE E — AUDIT TECHNIQUE

- **Volume** : 154 858 lignes · ~920 Mo · 2 styles × ~77 000 fichiers mots ·
  114 sourates revendiquées.
- **Format** : `.opus` 16 kHz mono VBR (+ fichiers `.pb` Protobuf de timestamps).
- **Nommage** : `SURAH_AYAH_WORD` (ex. `001_001_001.opus` = sourate 1 · verset 1 · mot 1).
- **Granularité** : par **occurrence** (position dans le verset), pas par forme distincte.
- **Correspondance Hikma** : le nommage mappe sur `word_occurrences`
  (surah + ayah + position), **pas** directement sur `quran_words`.

---

## 6. PARTIE F — COMPATIBILITÉ MODÈLE AUDIO (0009)

- `word_audio.word_id` identifie chaque fichier WBW **après** mapping
  `occurrence (surah, ayah, position) → word_id` + dédup par forme.
- `recitation_id = NULL` convient (WBW non lié à un récitant — colonne nullable).
- `source_id` : nécessiterait une **nouvelle source** (créée lors d'une future
  phase d'import, pas ici).
- **Aucune migration requise.** Le mapping peut se faire **sans modifier
  `quran_words`.**

---

## 7. PARTIE G — COMPARAISON QF vs HUGGING FACE

| critère | A. Quran.com/QF WBW | B. Hugging Face (zaibihassan) |
|---|---|---|
| licence | termes QF (commercial → licence écrite) | Apache-2.0 **déclarée** (fichiers audio non couverts prouvés) |
| provenance | claire (QF Content) | **non divulguée** (probablement dérivée de QF) |
| usage commercial | LICENSE_REQUIRED | UNCLEAR |
| redistribution | conditionnée | UNCLEAR |
| stockage / CDN | licence requise | UNCLEAR |
| transformation | UNCLEAR | UNCLEAR (déjà transformé) |
| couverture | complète | complète (2 styles) |
| qualité | WBW mp3 original | OPUS ré-encodé (équivalent audible) |
| granularité | mot (par position) | mot (par position) |
| intégration | capturé par l'adapteur | mapping occurrence→word_id |
| risque juridique | MODÉRÉ (licence à obtenir) | **ÉLEVÉ (license laundering)** |

**Le dataset HF ne remplace PAS QF** : il semble être une ré-édition de l'audio QF
sans preuve de droits. Utiliser HF sans clarifier la provenance pourrait exposer
Hikma au même détenteur sous-jacent (QF ou le récitant), avec une chaîne de
provenance encore plus fragile.

---

## 8. PARTIE H — CLASSIFICATION FINALE

**`REVIEW_REQUIRED`**

Règle appliquée (exigence de la phase) : « Si Apache-2.0 est seulement déclaré au
niveau du dataset mais que la provenance/droits des audios restent incertains →
REVIEW_REQUIRED, et non SAFE. »

Aucune preuve suffisante ne permet de classer `COMMERCIAL_SAFE` : la licence
déclarée ne couvre pas démontrablement les fichiers audio eux-mêmes.

---

## 9. PARTIE I — RECOMMANDATION

**C. DEMANDER UNE CLARIFICATION / LICENCE.**

Concrètement, demander au mainteneur `zaibihassan` :
1. l'identité des récitants (Muallim et Mujawwad) ;
2. la **source originale** des MP3 ;
3. la **preuve du droit** de redistribuer les enregistrements sous Apache-2.0
   (contrat, autorisation écrite du détenteur) ;
4. l'ajout d'un fichier `LICENSE` / `DATA_LICENSE` explicite couvrant les audios.

**Conséquence attendue** : si la provenance remonte à **Quran.com/QF**, alors la
licence commerciale **QF** (Phase 22B) reste la voie nécessaire — le dataset HF
n'apporte aucun droit supplémentaire. Dans ce cas, la décision de fond reste
« obtenir la licence QF » (ou du récitant), pas « utiliser HF gratuitement ».

**Ne pas approuver (A/B)** sans preuve documentaire sur les fichiers audio
eux-mêmes. **Ne pas importer.**

---

## 10. PARTIE J — NON-TOUCHER

✅ Aucun INSERT/UPDATE/DELETE · aucune migration · aucun seed · aucun import ·
`normalize.ts` non modifié · resolver non modifié · UI non modifiée · tables audio
non modifiées · aucun upload Storage · exercices audio non activés.

---

## 11. NON-RÉGRESSION

| commande | résultat |
|---|---|
| `npm test` | 221/221 ✅ |
| `npx tsc --noEmit` | 0 ✅ |
| `npm run lint` | 0 ✅ |
| `npm run build` | 0 ✅ |
| `npm run verify:persistence` | 13/13 ✅ |
| `npm run verify:rls` | 33/33 ✅ |

Aucune écriture : compteurs identiques (… · word_audio 0 · ayah_audio 0 · recitations 14).

---

## 12. LIVRABLES

- 📄 `PHASE_22C_HUGGINGFACE_WBW_AUDIO_LICENSE_AUDIT.md` (ce rapport)
- 📄 `tmp/phase22c-huggingface-wbw-audio-audit.json` (`HUGGINGFACE_WBW_AUDIT_COMPLETE`)

---

**ARRÊT OBLIGATOIRE.** Aucun import, aucune modification. En attente de votre décision.
