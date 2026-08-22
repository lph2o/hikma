# PHASE 18A — AUDIT ET SÉLECTION DE TRADUCTIONS FRANÇAISES SUPPLÉMENTAIRES

## STATUT

**READ_ONLY · RESEARCH_ONLY · NO_IMPORT**

- **DATABASE_WRITES = 0**
- **IMPORTS = 0**
- **MIGRATIONS = 0**
- **MODIFICATIONS DE PROJET = 0**

Aucune donnée n'a été importée, aucune source ajoutée, aucune écriture en base.
Le seul accès base effectué est un **audit en lecture seule** (SELECT) de `translations`, `ayahs`, `surahs`, `sources`.

---

## A. État actuel — audit du corpus (lecture seule, vérifié sur la base réelle)

### Table `translations` (18 708 lignes, exact)

| source_id | source_name | language | translation_count | ayah_coverage |
|---|---|---|---|---|
| `a4a59a8c-…` | Quran.com API v4 (resource 31) | **fr** | **6 236** | **6 236 / 6 236 (100 %)** |
| `a4a59a8c-…` | Quran.com API v4 (resource 20) | en | 6 236 | 6 236 / 6 236 (100 %) |
| `a4a59a8c-…` | Quran.com API v4 (resource 153) | it | 6 236 | 6 236 / 6 236 (100 %) |

### Constats vérifiés

- `ayahs` : **6 236** versets (exact).
- `translations` : **18 708** lignes = 6 236 × 3. **Aucun doublon** `(ayah_id, resource_id)` ni `(ayah_id, translator)`.
- Toutes les lignes (18 708 / 18 708) sont liées à `source_id` → « Quran.com API v4 ».
- Table `sources` (3 lignes) : Quran.com API v4 · Hikma — lexique éditorial · Kazimirski — Dictionnaire arabe-français (1860).
- **Seule traduction française stockée : Muhammad Hamidullah (resource 31).**
- **Aucune autre traduction française présente sous un autre nom** (vérifié : 1 seul traducteur `fr`).

### Traductions italiennes et autres langues

| Langue | Traducteur | resource_id | Lignes |
|---|---|---|---|
| it | Hamza Roberto Piccardo | 153 | 6 236 |
| en | Sahih International | 20 | 6 236 |

### Constat technique sur le corpus existant

Le texte stocké (dont la traduction française Hamidullah) contient des **balises HTML de renvois de notes**
(ex. `<sup foot_note=…>`) : le texte n'est **pas nettoyé** au moment de l'import. À garder en tête pour toute
comparaison/analyse lexicale et pour le futur pipeline d'import (normalisation nécessaire).

---

## B. Traductions françaises déjà présentes

**1 seule : Muhammad Hamidullah** (resource Quran.com 31, couverture 6 236/6 236).
- Traduction protégée (auteur décédé en 2002 ; M. Léturmy, co-traducteur, décédé en 1986) — non libre.
- Hébergée actuellement via les conditions de la **Quran Foundation** (voir §E).
- Copies textuelles alternatives (Tanzil.net) : **non-commerciales** uniquement (§E).

**Conséquence** : la réduction de la dépendance à une seule traduction française nécessite d'ajouter des
traductions **supplémentaires**, c'est l'objet de cette phase.

---

## C. Candidats externes (recherche documentaire effectuée le 14/08/2026)

| # | Candidat | Traducteur | Couverture | Format / structuration | Licence |
|---|---|---|---|---|---|
| 1 | **Kazimirski — Le Koran** (1840 / 1869) | A. de Biberstein-Kazimirski | Complète (114 sourates) | Wikisource HTML par chapitre, **pas de numérotation des versets** ; scans archive.org (OCR) | **Domaine public** |
| 2 | **Montet — Le Coran, trad. nouvelle et intégrale** (1929, Payot) | Édouard Montet (†1934) | Intégrale (éd. 1929) ; Wikisource : choix de sourates (1925) | Aucun texte numérique complet localisé (scan requis) | **Domaine public** (PD France depuis 2005) |
| 3 | **Savary — Le Coran** (1783 ; Wikisource : éd. 1821) | Claude-Étienne Savary (†1788) | Complète (114 chapitres) | Wikisource HTML, état « à relire », **pas de versets** | **Domaine public** |
| 4 | **Du Ryer — L'Alcoran de Mahomet** (1647) | André Du Ryer (†1672) | Complète (fiabilité discutée) | Wikisource, **pas de versets**, français du XVIIe | **Domaine public** |
| 5 | **Centre International Nûr (« Montada »)** (moderne) | Dr Nabîl Ridwân | Complète, **per-ayah (6 236)** | QuranEnc : API JSON, XML, CSV, SQLite ; Quran.com resource 136 | **ALLOWED_WITH_CONDITIONS** (QuranEnc) — commercial **UNCLEAR** |
| 6 | **Rachid Maach** (moderne) | Rachid Maach | Complète, **per-ayah (6 236)** | QuranEnc : API JSON, XML, CSV, SQLite ; Quran.com resource 779 | **ALLOWED_WITH_CONDITIONS** (QuranEnc) — commercial **UNCLEAR** |
| 7 | **Hamidullah** (copie Tanzil) | M. Hamidullah | Complète, per-ayah | Tanzil TXT UTF-8 | **RESTRICTED** (non-commercial) |
| 8 | Traductions modernes protégées | Chiadmi, Penot, Berque, Masson, Blachère, Grosjean, Complexe Roi Fahd FR, Al-Hilali/Khan FR… | Complètes | Imprimé / PDF | **RESTRICTED / UNKNOWN** |
| 9 | Résumé de l'Exégèse (FR) — auxiliaire (tafsir, pas une traduction) | Centre d'Exégèse pour les Études Coraniques | Complète, per-ayah | QuranEnc API | **ALLOWED_WITH_CONDITIONS** — commercial **UNCLEAR** |

> Sources consultées : fr.wikisource.org (Kazimirski, Savary, Montet), tanzil.net/trans/,
> api.qurancdn.com (liste officielle des traductions), quranenc.com (Terms & Policies + pages French),
> islamhouse.com, archive.org, data.bnf.fr, Persée (RHPR 1929), Brill CMR (biographie Montet).
> Une simple copie trouvée sur un site tiers n'a **jamais** été considérée comme établissant les droits.

---

## D. Provenance (traçabilité pour un futur audit)

### 1. Kazimirski — traduction du Coran ✅ RECOMMANDÉ
- Traducteur : Albert de Biberstein-Kazimirski (1808-1887).
- Titre : *Le Koran, traduction nouvelle faite sur le texte arabe* — Paris, Charpentier, 1840 ; rééd. revue 1852, 1869.
- URL officielle : `https://fr.wikisource.org/wiki/Le_Koran_(Traduction_de_Kazimirski)` (édition 1869, 114 chapitres).
- Scans : `archive.org/details/lekorantradictio00bibe` (1840) ; `archive.org/details/CoranTraductionDeKazimirski` (PDF).
- Contexte BnF : `heritage.bnf.fr/bibliothequesorient/traductions-coran-kazimirski`.
- **Ne pas confondre** avec le *Dictionnaire arabe-français* (1860) déjà intégré aux Phases 16-17 : ici il s'agit de la **traduction du Coran** (§10 du cahier des charges).

### 2. Montet — édition 1929 (Payot) ⚠️ PD mais non numérisée
- Édouard Montet (1856-1934), « traduction nouvelle et intégrale », Paris, Payot, 1929 (895 pp.).
- Wikisource : `https://fr.wikisource.org/wiki/Le_Coran_(Traduction_de_Montet)` — **uniquement le choix de sourates de 1925**.
- Aucun texte numérique complet de l'édition 1929 trouvé (Gallica/Internet Archive) → acquisition du scan requise.

### 3. Savary — 1783 / Wikisource 1821 ⚠️ « à relire »
- Claude-Étienne Savary (1750-1788), 1783 ; Wikisource sur l'éd. Dufour 1821 (`Le_Coran_(Traduction_de_Savary)`).

### 4. Du Ryer — 1647
- André Du Ryer (c. 1580-1672), *L'Alcoran de Mahomet*, 1647 (première traduction française).

### 5. Centre International Nûr (« Montada ») et 6. Rachid Maach
- Nûr : Dr Nabîl Ridwân ; Maach : Rachid Maach (contemporains).
- QuranEnc (FR) : `quranenc.com/fr/browse/french_montada`, `quranenc.com/fr/browse/french_rashid`.
- Quran.com (FR) : resource 136 « Montada Islamic Foundation », resource 779 « Rashid Maash » (vérifié via `api.qurancdn.com/api/qdc/resources/translations`).
- IslamHouse : `islamhouse.com/en/books/1534/` (éditeur Complexe du Roi Fahd pour la diffusion).
- Version/date : QuranEnc french_montada (2025-06-24), french_rashid V1.0.3 (2026-06-21).

---

## E. Licence

| Candidat | LICENSE_STATUS | Détail documenté |
|---|---|---|
| Kazimirski (traduction du Coran) | **EXPLICITLY_ALLOWED** | Domaine public mondial (auteur †1887 ; œuvres 1840-1869). Confirmé par Wikisource (« domaine public ») et scans PD. |
| Montet 1929 | **EXPLICITLY_ALLOWED** | Auteur †1934 → domaine public en France depuis 2005 (70 ans post-mortem). |
| Savary 1783 | **EXPLICITLY_ALLOWED** | Auteur †1788 → PD. |
| Du Ryer 1647 | **EXPLICITLY_ALLOWED** | Auteur †1672 → PD. |
| Nûr / Montada (FR) | **ALLOWED_WITH_CONDITIONS** | QuranEnc : téléchargement + republication possibles sous conditions : (1) aucune modification/ajout/suppression du contenu ; (2) attribution claire de l'éditeur + source QuranEnc.com ; (3) mention de la version ; (4) conservation des infos de transcription ; (5) notification des remarques ; (6) mise à jour vers la dernière version ; (7) pas de publicité inappropriée. |
| Rachid Maach (FR) | **ALLOWED_WITH_CONDITIONS** | Mêmes conditions QuranEnc. |
| Hamidullah (Tanzil) | **RESTRICTED** | Tanzil : « The translations provided at this page are for non-commercial purposes only. If used otherwise, you need to obtain necessary permission from the translator or the publisher. » |
| Hamidullah (Quran.com, en base) | **ALLOWED_WITH_CONDITIONS** | Conditions développeur Quran Foundation (auditées en Phase 16B, consultées le 10/08/2026) : redistribution commerciale non intégrée à l'expérience de l'application interdite sans licence commerciale écrite de QF ; stockage > 1 semaine interdit hors API Content Sync. |
| Traductions modernes (Chiadmi, Penot, Berque, Masson, Blachère, Grosjean…) | **RESTRICTED / UNKNOWN** | Droits d'auteur en vigueur ; aucune licence libre identifiée. |

**Règle appliquée** : une traduction moderne est présumée protégée jusqu'à preuve contraire ;
**UNKNOWN n'a jamais été transformé en ALLOWED**. Ce rapport ne constitue pas un avis juridique.

---

## F. Compatibilité commerciale (SaaS)

| Candidat | Commercial | Stockage base | Modification/transformation | Redistribution | Affichage public | Appli web / SaaS |
|---|---|---|---|---|---|---|
| Kazimirski (PD) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Montet (PD) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Savary (PD) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Du Ryer (PD) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Nûr / Montada | **UNCLEAR** (non documenté) | ✅ (sous conditions QuranEnc) | ⚠️ interdit (condition 1) | ✅ (sous conditions) | ✅ | ⚠️ à confirmer par écrit auprès du titulaire |
| Rachid Maach | **UNCLEAR** | ✅ (sous conditions QuranEnc) | ⚠️ interdit (condition 1) | ✅ (sous conditions) | ✅ | ⚠️ à confirmer par écrit auprès du titulaire |
| Hamidullah (Tanzil) | ❌ (non-commercial) | ❌ | ❌ | ❌ | ❌ | ❌ sans permission écrite |
| Modernes protégées | ❌ sans contrat | ❌ | ❌ | ❌ | ❌ | ❌ sans contrat |

> Note : les conditions QuranEnc (n°1 : pas de modification) ne bloquent pas un **affichage verset-par-verset**
> à l'identique, mais limitent fortement les **usages dérivés** (transformation pour le moteur pédagogique,
> extraction de gloses) sans accord supplémentaire du titulaire des droits de la traduction.

---

## G. Couverture

| Candidat | 6 236 ayahs | Complet | Correspondance au corpus Hikma |
|---|---|---|---|
| Kazimirski | En-têtes de sourates conformes (ex. « 286 versets » pour la 2) ; alignement **paragraphe ≈ verset à vérifier sourate par sourate** | ✅ (114 sourates) | Mapping à construire (pas de numérotation) |
| Montet 1929 | Probable (édition intégrale) | ✅ | Non vérifiable tant que le texte n'est pas numérisé |
| Savary | Non vérifiable (pas de versets) | ✅ (114 chapitres) | Mapping difficile |
| Du Ryer | Non vérifiable (pas de versets) | ✅ | Mapping difficile |
| Nûr / Montada | ✅ per-ayah | ✅ | Direct (sura/aya) |
| Rachid Maach | ✅ per-ayah | ✅ | Direct (sura/aya) |

---

## H. Qualité technique des candidats accessibles

| Candidat | Format | Encodage | Versets identifiés | Doublons | Texte complet | Difficulté de mapping |
|---|---|---|---|---|---|---|
| Kazimirski (Wikisource) | HTML par chapitre (114 pages) | UTF-8 | ❌ (paragraphes) | Aucun constaté | ✅ | **Élevée** : alignement paragraphe→verset + vérification par sourate (6 236 cibles) |
| Kazimirski (scans archive.org) | djvu.txt / PDF OCR | UTF-8 | ❌ | — | ✅ | Très élevée (OCR + alignement) |
| Nûr / Montada (QuranEnc) | JSON / XML / CSV / SQLite / API | UTF-8 | ✅ | Aucun constaté | ✅ | **Directe** (sura/aya 1-6236) |
| Rachid Maach (QuranEnc) | JSON / XML / CSV / SQLite / API | UTF-8 | ✅ | Aucun constaté | ✅ | **Directe** |
| Hamidullah (Tanzil) | TXT structuré (`S|n|n`) | UTF-8 | ✅ | — | ✅ | Directe (mais non-commercial) |

**Stabilité/qualité du corpus** : les textes QuranEnc sont versionnés (V1.x.y) et exposés en API publique ;
Kazimirski Wikisource est stable (édition 1869), la relecture Wikisource de Savary n'est pas finalisée (« à relire »).

---

## I. Recommandations

1. **RECOMMANDÉ — Kazimirski, traduction du Coran (PD).** Seule traduction française complète à la fois
   juridiquement compatible avec un SaaS commercial (domaine public) et réellement distincte de Hamidullah.
   **Travail préalable obligatoire** : constituer un corpus aligné par verset (extraction Wikisource par chapitre,
   contrôle du nombre de paragraphes contre le nombre de versets attendu par sourate, validation humaine sur
   échantillon), avant toute import.
2. **POSSIBLE — Centre International Nûr / Montada et Rachid Maach (modernes, structurés).** Qualité et
   structuration excellentes (per-ayah, API libre), mais l'usage **commercial** n'est pas documenté par QuranEnc ;
   obtenir **une confirmation écrite** des titulaires des droits (traducteur/éditeur) avant usage SaaS, et respecter
   les conditions de republication (pas de modification, attribution, version).
3. **POSSIBLE (faible priorité) — Montet 1929 (PD)** après numérisation ; **Savary (PD)** valeur historique surtout.
4. **REJETÉ** — Du Ryer (trop archaïque), Hamidullah via Tanzil (non-commercial ; déjà en base via Quran.com).
5. **BLOQUÉ** — traductions modernes protégées (Chiadmi, Penot, Berque, Masson, Blachère, Grosjean, etc.) sans
   négociation de droits ; « Résumé de l'Exégèse » (FR) possible en **auxiliaire** (tafsir per-ayah utile pour les
   gloses de contexte), à ne jamais confondre avec une traduction.
6. **Voie mixte conseillée** : (a) importer Kazimirski (PD) comme **2e traduction française indépendante** ;
   (b) lancer la **demande de licence écrite** pour Nûr/Maach en parallèle pour disposer d'une 3e source moderne.

---

## J. Risques

**Juridiques**
1. **Couche de numérisation Wikisource** : le texte de la traduction est PD, mais la mise en page Wikisource est
   CC BY-SA. Utiliser le texte PD (édition 1869) sans copier la structure éditoriale, ou partir des scans PD
   (archive.org) et refaire notre propre extraction.
2. **Traductions modernes** : la permission de republication QuranEnc ne prouve pas un droit commercial ; sans
   confirmation écrite du titulaire, un SaaS commercial reste exposé. **UNKNOWN ≠ ALLOWED.**
3. **Hamidullah (en base)** : la couverture contractuelle actuelle repose sur les conditions développeur QF
   (voir Phase 16B) — toute nouvelle traduction QF (136, 779) tomberait sous les mêmes conditions.

**Techniques**
4. **Alignement Kazimirski** : pas de numérotation des versets → risque d'erreurs de mapping (fusion/séparation de
   versets, notes mélangées au texte) ; exiger un contrôle par sourate et une validation humaine sur échantillon.
5. **Français du XIXe siècle** : formulations archaïques (« châtiment », « Dieu ») — adaptées à la comparaison
   lexicographique, moins à l'affichage pédagogique grand public sans adaptation éditoriale.
6. **HTML dans le corpus existant** : les notes Hamidullah stockées (`<sup foot_note=…>`) polluent toute analyse
   lexicale/statistique du texte français actuel.

---

## K. Prochaine étape

**Phase d'ACQUISITION / LICENCE / IMPORT** — uniquement pour les sources **explicitement retenues** :

1. **Kazimirski (Coran, PD)** : préparer le corpus aligné (extraction Wikisource édition 1869 ou scan PD +
   OCR), construire le mapping verset par verset, valider sur échantillon humain, puis import (nouvelle
   `source_id`, resource propre, `translations` dédiée — **ne pas toucher** aux lignes existantes).
2. **Nûr / Montada & Rachid Maach** : demander l'autorisation commerciale écrite aux titulaires des droits ;
   en cas d'obtention, import structuré via API QuranEnc (JSON per-ayah) en respectant les conditions
   (version, attribution, pas de modification).
3. Documenter chaque import dans `sources` (URL, version, licence, date de consultation) — exigence déjà
   respectée par les phases précédentes.

**ARRÊT OBLIGATOIRE après l'audit.** Aucune importation automatique, aucune migration, aucune source ajoutée,
aucune modification de `translations`, `lemma_translations`, `word_translations`, du resolver ou du code produit.

---

## Tableau final

| Source | Traducteur | Langue | Couverture | Licence | Commercial | DB-ready | Décision |
|---|---|---|---|---|---|---|---|
| **Kazimirski — Le Koran** (1840/1869) | A. de Biberstein-Kazimirski | fr | Complète (6 236, alignement requis) | **Domaine public** | ✅ | ⚠️ (structuration requise) | **RECOMMENDED** |
| **Montet — Le Coran** (1929) | Édouard Montet | fr | Intégrale (non numérisée) | **Domaine public** | ✅ | ❌ (scan requis) | POSSIBLE |
| Savary (1783/1821) | Claude-Étienne Savary | fr | Complète (sans versets, « à relire ») | Domaine public | ✅ | ❌ | POSSIBLE |
| Du Ryer (1647) | André Du Ryer | fr | Complète (sans versets) | Domaine public | ✅ | ❌ | REJECTED |
| Centre International Nûr / Montada | Dr Nabîl Ridwân | fr | 6 236 per-ayah | ALLOWED_WITH_CONDITIONS | ⚠️ UNCLEAR | ✅ (API/JSON) | POSSIBLE |
| Rachid Maach | Rachid Maach | fr | 6 236 per-ayah | ALLOWED_WITH_CONDITIONS | ⚠️ UNCLEAR | ✅ (API/JSON) | POSSIBLE |
| Hamidullah (Tanzil) | M. Hamidullah | fr | 6 236 | RESTRICTED (non-commercial) | ❌ | ✅ | REJECTED |
| Hamidullah (Quran.com — **en base**) | M. Hamidullah | fr | 6 236 | Conditions QF (Phase 16B) | ⚠️ | ✅ | inchangé |
| Chiadmi, Penot, Berque, Masson, Blachère… | divers | fr | Complètes | Protégées | ❌ | ❌ | BLOCKED |
| Résumé de l'Exégèse (FR) | Centre d'Exégèse | fr | 6 236 per-ayah (tafsir) | ALLOWED_WITH_CONDITIONS | ⚠️ UNCLEAR | ✅ | POSSIBLE (auxiliaire) |

---

## Livrables

- 📄 `PHASE_18A_FRENCH_TRANSLATIONS_AUDIT.md` (ce rapport)
- 📄 `tmp/phase18a-french-translations-audit.json` (marqué `RESEARCH_ONLY · NO_IMPORT · DATABASE_WRITES=0`)
- 🔍 Script d'audit lecture seule (SELECT uniquement) : `tmp/audit-translations.ts`

---

**PHASE 18A — RESEARCH_ONLY** · **TRADUCTION FR ACTUELLE : 1 (Hamidullah)** · **CANDIDATS : 9 étudiés** ·
**RECOMMENDED : 1 (Kazimirski PD)** · **POSSIBLE : 4 (Montet, Savary, Nûr, Maach)** ·
**DATABASE_WRITES = 0 · IMPORTS = 0 · MIGRATIONS = 0 · ARRÊT OBLIGATOIRE.**
