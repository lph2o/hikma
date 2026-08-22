# PHASE 21B-E — PRIORITY PILOT LEMMA GLOSSES

**STATUS FINAL : `PRIORITY_GLOSS_ANALYSIS_COMPLETE`**
**DATABASE_WRITES = 0 · IMPORTS = 0 · VALIDATIONS = 0 · MIGRATIONS = 0**

> Aucune glose importée, aucune validée, aucun mapping modifié, aucune migration.
> Ce rapport est une **analyse + proposition** uniquement.

---

## 0. RÉSUMÉ

Analyse des 5 lemmes pilotes (cibles du mapping 21B-C) et proposition de gloses
françaises pédagogiques courtes, étayées par les traductions réellement présentes
en base (Hamidullah FR, Kazimirski 1869 FR, Sahih International EN, Piccardo IT)
et par les glosses EN word-by-word (Quran.com).

**Résultat : 4 gloses `VALIDATE_CANDIDATE` + 1 `REVIEW_REQUIRED` (لِلَّه).**

| lemme | glose proposée | confiance | décision |
|---|---|---|---|
| رَبّ | Seigneur / maître | high | **VALIDATE_CANDIDATE** |
| الله | Allah | high | **VALIDATE_CANDIDATE** |
| الرَّحْمَـٰن | le Tout Miséricordieux | high | **VALIDATE_CANDIDATE** |
| لِلَّه | à Allah / pour Allah | medium | **REVIEW_REQUIRED** |
| الْحَمْد | louange | high | **VALIDATE_CANDIDATE** |

---

## 1. LEMMES CIBLÉS (lemma_id RÉELS)

| lemme | lemma_id | formes directes | formes mappées | total | occurrences | ayahs |
|---|---|---|---|---|---|---|
| رَبّ | `01021c14-2f6b-4ce7-b18b-0c21557c023b` | 7 | 154 | 161 | 963 | 855 |
| الله | `62b46eb1-9234-4bd3-88b0-0298c25ebe6b` | 16 | 12 | 28 | 2 550 | 1 740 |
| الرَّحْمَـٰن | `6115a3ca-9e39-4cf9-a348-e47b97df5653` | 8 | 2 | 10 | 48 | 48 |
| لِلَّه | `190c14de-25f5-4d83-b680-c8cd258d4d19` | 7 | 2 | 9 | 149 | 145 |
| الْحَمْد | `b878702b-25de-4ab7-94ef-d8572d6eb380` | 2 | 1 | 3 | 28 | 27 |

**Sources réellement présentes en base** : Hamidullah FR (334 ayahs) · Kazimirski
« Le Koran 1869 » FR (8 ayahs) · Sahih International EN (328) · Piccardo IT (330).
Le dictionnaire Kazimirski **1860** ne couvre pas ces 5 lemmes (ses 4 entrées
historiques portent sur عَبْد / رَحْمَة / لَا / أَرْض).

---

## 2. ANALYSE PAR LEMME

### 2.1 رَبّ → « Seigneur / maître » (VALIDATE_CANDIDATE, high)

- **EN (Quran.com WBW)** : « Lord » uniforme sur les 161 formes (« the Lord »,
  « your Lord », « our Lord », « their Lord »…).
- **Hamidullah FR** : « Seigneur » (ex. « le Seigneur de l'Univers »).
- **Kazimirski 1869 FR** : « Seigneur » / « maître » (ex. « maître de l'univers »).
- **Piccardo IT** : « il Signore ».
- **Noyau** : Seigneur (possesseur, maître). La double formulation couvre la
  variation Hamidullah (« Seigneur ») vs Kazimirski (« maître »). Aucune nuance
  « éducateur/nourricier » observée dans les traductions consultées → non retenue
  (pas de sur-traduction).

### 2.2 الله → « Allah » (VALIDATE_CANDIDATE, high)

- **EN** : « Allah » (nom propre). **Hamidullah FR** : « Allah ». **Piccardo IT** : « Allah ».
- **Kazimirski 1869 FR** : « Dieu » (convention propre à Kazimirski).
- **Noyau** : nom propre de Dieu, pas une traduction sémantique.
- **Justification pédagogique** : « Allah » est la translittération/nom propre
  standard en français (retenue par Hamidullah, la traduction de référence Hikma).
  La variante Kazimirski « Dieu » est documentée mais non retenue, pour rester
  cohérent avec la référence Hamidullah.

### 2.3 الرَّحْمَـٰن → « le Tout Miséricordieux » (VALIDATE_CANDIDATE, high)

- **EN WBW** : « the Most Gracious » ⚠️ ; **Sahih International** : « the Most Merciful ».
- **Hamidullah FR** : « le Tout Miséricordieux » (convergent sur toutes les occurrences).
- **Kazimirski 1869 FR** : « le Miséricordieux » / « le Clément ».
- **Piccardo IT** : « il Compassionevole ».
- **Divergence documentée** : la gloss WBW anglaise (« Gracious ») diverge des
  traductions (« Merciful » / « Miséricordieux »). La glose française suit le
  **consensus des traductions** (Hamidullah « le Tout Miséricordieux »), pas la
  gloss WBW isolée.

### 2.4 لِلَّه → « à Allah / pour Allah » (REVIEW_REQUIRED, medium)

- **EN** : « for Allah » / « to Allah » / « (be) to Allah ».
- **Hamidullah FR** : « à Allah » / « pour Allah » (ex. « la religion soit
  entièrement à Allah »). **Kazimirski 1869** : « à Dieu ». **Piccardo** : « per/ad Allah ».
- **Noyau** : composé grammatical **لِ + الله** (datif / attribution). **Ce n'est
  PAS un synonyme lexical de الله.**
- **Décision** : `REVIEW_REQUIRED`. Trois options documentées :
  - (A) glose autonome « à Allah / pour Allah » ;
  - (B) traiter comme forme grammaticale (pas de glose lexicale) ;
  - (C) relier pédagogiquement à الله avec une note grammaticale.
  **Ne pas valider sans décision humaine.** Ne jamais confondre avec ٱللَّهُمَّ
  (vocatif) ni avec les homographes ل-ه-د / ل-ه-ب (exclus par le pilote).

### 2.5 الْحَمْد → « louange » (VALIDATE_CANDIDATE, high)

- **EN** : « All praises and thanks » / « (is) the praise » (formule WBW étendue).
- **Hamidullah FR** : « Louange » (ex. « Louange à Allah »). **Kazimirski 1869** :
  « Gloire à Dieu » / « grâce à Dieu ». **Piccardo IT** : « la lode ».
- **Noyau** : louange. Le complément « à Allah / à Dieu » est contextuel (formule
  coranique complète), **pas lexical** → réduit au noyau « louange » (anti-réduction
  documentée, la formule complète n'est pas la définition du mot).

---

## 3. CONTRÔLE DES FAUX POSITIFS (hérité du pilote 21B-C)

- **رَبّ** : homographes exclus — رِبَا (usure), رِبَاط, رَبِحَت, رَبَطْنَا,
  رُبَاعَ, رَبَائِب (11 REJECTED, jamais importés).
- **الله** : homographes exclus — ل-ه-ب (Abu Lahab), ل-ه-و (divertissement).
- **لِلَّه** : لَلْهُدَىٰ (ل + الهُدَى) exclu ; يُضْلِلْهُ REVIEW_REQUIRED.
- **Mécanisme** : le classifieur 21B-C n'a marqué SAFE que si la **décomposition
  structurelle exacte + glose EN de contrôle** concordaient. Seuls les `word_id`
  déjà présents dans `word_lemma_mapping` sont utilisés ici (171 SAFE, aucun
  homographe).

---

## 4. GAIN POTENTIEL (pas un gain réel)

**`MAPPING_COVERAGE`** (déjà réalisée en 21B-C, inchangée) : 171 mappings SAFE ·
1 270 occurrences.

**`POTENTIAL_RESOLVER_COVERAGE`** (SI les propositions étaient validées) :

| périmètre | formes | occurrences |
|---|---|---|
| les 5 lemmes | 211 | 3 738 |
| 4 `VALIDATE_CANDIDATE` (sans لِلَّه) | **202** | **3 589** |
| لِلَّه seul (`REVIEW_REQUIRED`) | 9 | 149 |

- Formes actuellement FR : **99** (8 forme + 91 lemme direct).
- Formes qui deviendraient FR si les 4 gloses étaient validées : **+202** → **301**.
- Formes si les 5 gloses étaient validées : **+211** → **310**.

> ⚠️ **Le gain réel reste 0** tant que les gloses ne sont pas `is_validated=true`.
> Ce tableau est un **potentiel**, pas une réalité.

---

## 5. NON-RÉGRESSION

Aucune écriture : compteurs identiques attendus et vérifiés
(quran_words 21 296 · word_occurrences 77 430 · ayahs 6 236 · translations 24 944 ·
lemmas 22 · lemma_translations 18 · word_translations 8 · word_lemma_mapping 171).

Les 14 gloses validées et les 4 entrées historiques Kazimirski 1860 restent intactes.

| commande | résultat |
|---|---|
| `npm test` | 221/221 ✅ |
| `npx tsc --noEmit` | 0 ✅ |
| `npm run lint` | 0 ✅ |
| `npm run build` | 0 ✅ |
| `npm run verify:persistence` | 13/13 ✅ |
| `npm run verify:rls` | 33/33 ✅ |

---

## 6. RECOMMANDATION FINALE

1. **Valider en priorité les 4 gloses `VALIDATE_CANDIDATE`** (رَبّ, الله,
   الرَّحْمَـٰن, الْحَمْد) → **+202 formes FR (≈3 589 occurrences)**.
2. **لِلَّه** : décision humaine requise (`REVIEW_REQUIRED`) — glose autonome vs
   traitement grammatical vs lien pédagogique à الله avec note. Ne pas valider
   sans décision.
3. Les 4 gloses suffisamment solides ne nécessitent pas de nouvelle analyse ;
   seule لِلَّه nécessite une décision.

**ARRÊT OBLIGATOIRE** : aucune glose importée/validée, aucune poursuite
automatique vers la phase suivante.

---

## 7. LIVRABLES

- 📄 `PHASE_21B_E_PRIORITY_LEMMA_GLOSS_ANALYSIS.md` (ce rapport)
- 📄 `tmp/phase21b-e-priority-lemma-gloss-analysis.json` (`PRIORITY_GLOSS_ANALYSIS_COMPLETE`)
- 📄 `tmp/phase21b-e-audit.ts` + `tmp/phase21b-e-audit.json` (audit READ-ONLY)
