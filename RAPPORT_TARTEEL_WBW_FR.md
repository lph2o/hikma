# RAPPORT — Fichier `french-wbw-translation.json` (Tarteel / QUL)

> Document rédigé pour être remis à une IA (GPT) afin qu'elle raisonne sur l'utilisation de ce fichier dans le projet **Hikma** (apprentissage du vocabulaire coranique). Ce rapport est **factuel** : il décrit le fichier, ses métadonnées, sa couverture, et les **questions de licence/provenance à trancher avant toute utilisation**. Rien n'a été importé.

---

## 1. Ce que c'est

- **Nom du fichier** : `french-wbw-translation.json`
- **Taille** : 2 051 237 octets (~2,0 Mo), UTF-8, une seule ligne JSON.
- **Provenance déclarée** : téléchargé depuis **Tarteel** — plus précisément le projet **QUL (« Quranic Universal Library »)**, hub open-source de Tarteel (`qul.tarteel.ai`, dépôt GitHub `TarteelAI/quranic-universal-library`).
- **Nature** : traduction **mot-à-mot (word-by-word) en français** du Coran.
- **Structure** : un **objet JSON plat** clé→valeur, où chaque clé est au format **`sourate:verset:position_mot`** et chaque valeur est la glose française du mot correspondant.

Exemple :
```json
{
  "1:1:1": "(Je lis) avec (Le) Nom",
  "1:1:2": "(d’)Allâh,",
  "1:1:3": "L’Extrêmement Miséricordieux en Son Essence,",
  "1:1:4": "Le Très Miséricordieux dans Ses Actions.",
  "1:4:2": "(du) Jour",
  "1:4:3": "(du) Jugement"
}
```

---

## 2. Mesures réelles (faites sur le fichier)

| Mesure | Valeur |
|---|---|
| Nombre total d'entrées | **77 429** |
| Sourates couvertes | **114 / 114** (1 → 114) |
| Versets couverts | **6 236** (tous les versets du Coran) |
| Clés malformées (hors format `s:v:m`) | **0** |
| Valeurs vides/invalides | **0** |
| Longueur moyenne d'une glose | ~12,6 caractères |
| Position de mot max observée | sourate 2 : 128 · sourate 18 : 38 · sourate 112 : 5 |

→ **Couverture complète du Coran** : une glose française pour chaque mot de chaque verset des 114 sourates.

---

## 3. Style des gloses (important pour l'usage pédagogique)

Les gloses ne sont **pas** de simples équivalents lexicaux « propres ». Elles sont **contextuelles** et portent des **annotations grammaticales entre parenthèses** :

- `1:1:1` → « (Je lis) avec (Le) Nom » (le mot `بِسْمِ` est glosé par son contexte « je lis / au nom »)
- `1:2:4` → « (de) toutes les générations de chaque créature » (glose très périphrastique)
- `114:6:3` → « et les gens humains. » (une glose inclut même la ponctuation/contexte)

→ C'est un **traduction mot-à-mot interlinéaire de type « tafsir compact »**, pas un **dictionnaire de lemme**. Elle est proche, dans la forme, des glosses anglaises mot-à-mot déjà présentes dans `quran_words.meaning` du projet Hikma.

---

## 4. Lien direct avec le projet Hikma (point clé)

Le projet Hikma possède déjà, en base :

| Table | Contenu | Comptage |
|---|---|---|
| `quran_words` | mots du Coran (avec `meaning` = **glosse anglaise** Quran.com) | **21 296** |
| `word_occurrences` | occurrences mot-par-mot (sourate/verset/position) | **77 430** |
| `ayahs` | versets | **6 236** |
| `word_translations` | traductions éditoriales FR **validées** | **8** (gloses protégées) |

**Constat majeur** : le fichier Tarteel a **77 429 entrées**, alors que Hikma a **77 430 occurrences**. Il y a un **écart de 1** à expliquer (convention de comptage : par ex. la basmala initiale, ou un mot particulier). Par ailleurs **6 236 versets** correspondent **exactement** au `ayahs` de Hikma, et le format de clé `s:v:m` correspond directement au schéma d'occurrence mot-par-mot de Hikma.

→ Ce fichier est, **structurellement**, l'équivalent **français** de la colonne `quran_words.meaning` (anglaise) déjà en base : c'est potentiellement **la source lexicale FR mot-à-mot que le projet cherchait depuis les phases 16A–16M**.

---

## 5. LA question bloquante : licence et provenance

**Ce rapport ne conclut PAS que le fichier est réutilisable.** Les points à trancher (ce pourquoi il est remis à GPT + vérification humaine) :

1. **Licence du code ≠ licence des données.** Le dépôt QUL est en Ruby on Rails et son **code** est sous **MIT**, mais la **licence des données** (les 22 traductions mot-à-mot, dont celle-ci) est documentée **séparément** dans la doc QUL (« Downloading and Using Data »). Elle n'a **pas été vérifiée ici**.

2. **Provenance des gloses.** Les traductions mot-à-mot de QUL/Tarteel sont vraisemblablement construites sur la même structure mot-à-mot que celle de **Quran.com / Quran Foundation** (la même structure que les gloses anglaises `quran_words.meaning` de Hikma). Or, les phases 16A–16B ont établi que :
   > les données de **Quran Foundation** ne sont **pas** librement réutilisables à des fins **commerciales** sans **licence écrite** (« QF Content is not resold, sublicensed, or redistributed… cache or store longer than 1 week interdit »).
   → Si les gloses françaises de ce fichier sont **dérivées** de ce socle Quran.com/QF, elles peuvent hériter de la même restriction **LICENSE_INCOMPATIBLE** pour un usage commercial.

3. **Usage prévu par Hikma** : Hikma vise un **SaaS potentiellement commercial** (application web/mobile, utilisateurs gratuits ET payants, stockage PostgreSQL, affichage des gloses aux utilisateurs). Il faut donc vérifier explicitement :
   - droit d'**utiliser commercialement** les gloses ;
   - droit de **stocker durablement** les gloses dans la base ;
   - droit de **créer des données dérivées** (gloses courtes adaptées éditorialement) ;
   - droit de **redistribuer/afficher** les gloses aux utilisateurs ;
   - obligations d'**attribution** éventuelles.

---

## 6. Ce que le fichier PERMET et NE PERMET PAS de faire (tel quel)

**Il permet (techniquement) :**
- couvrir **100 %** du Coran en français mot-à-mot ;
- être mis en correspondance **1:1** avec `word_occurrences` (clé `s:v:m`) ;
- fournir une base pour des **propositions** de gloses françaises (jamais une validation).

**Il ne permet PAS (tant que la licence n'est pas clarifiée) :**
- d'être **importé** dans `word_translations` / `quran_words` de Hikma ;
- d'être utilisé comme **source validée** ;
- de remplacer les **8 gloses éditoriales validées** existantes (الله, رَبّ, الْحَمْد, etc.) ;
- de passer des lemmas `proposed` → `validated`.

---

## 7. Questions ouvertes à soumettre à GPT

1. La licence **des données** de QUL/Tarteel permet-elle l'**usage commercial + stockage + dérivés + redistribution** pour les **traductions mot-à-mot** (et spécifiquement la française) ?
2. Les gloses françaises sont-elles **dérivées** de Quran.com/Quran Foundation (donc potentiellement `LICENSE_INCOMPATIBLE`), ou sont-elles une **traduction indépendante** sous licence propre ?
3. Comment résoudre l'**écart de 1** (77 429 vs 77 430) pour un mapping exact vers `word_occurrences` ?
4. Comment transformer proprement une glose **contextuelle périphrastique** (ex. « (de) toutes les générations de chaque créature ») en **glose lexicale courte** adaptée à Hikma, **sans** la présenter comme citation directe ?
5. Quelle **provenance** enregistrer (`source_name`, `source_type`, `source_license_status`, `retrieved_at`, `editorial_note`) si une licence est confirmée ?

---

## 8. État du projet Hikma au moment de ce rapport

- `lemmas` = 22 (8 `validated`, 14 `proposed`, 0 `rejected`)
- `quran_words.lemma_id` renseigné = 135
- `quran_words.root` renseigné = 0
- `word_translations` = 8 (gloses FR validées, protégées)
- `sources` = 2
- Dernière migration = `0020`
- Recherche d'une source lexicale FR : en cours depuis 16B (Kazimirski 1860 = piste principale, statut `LEGAL_REVIEW_REQUIRED`).

**Aucune donnée de ce fichier n'a été importée.** Le fichier n'est analysé qu'à titre documentaire, dans l'attente d'une décision de licence/provenance.
