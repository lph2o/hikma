# PHASE 20A — AUDIT DU MOTEUR PÉDAGOGIQUE APRÈS INTÉGRATION LEXICALE

## STATUT

**STATUS = AUDIT_COMPLETE** · **READ_ONLY** · **DATABASE_WRITES = 0**

**Problèmes classés : P0 = 0 · P1 = 1 · P2 = 1 · P3 = 0**

---

## A. Architecture réelle

Le resolver est **un point unique** (`lib/learning/language.ts`) :

```
resolveWordMeanings(word, french, lemmaFrench?)
  précédence : FORME (word_translations) > LEMME (lemma_translations) > EN (quran_words.meaning)
```

La couche requêtes (`lib/learning/queries.ts`) fournit 3 fonctions, toutes filtrées `is_validated = true` :
- `getValidatedFrenchMeanings` → word_translations (forme) ;
- `getValidatedFrenchLemmaMeanings` → lemma_translations (lemme) ;
- `getValidatedFrenchLemmaMeaningsByWord` → forme → `quran_words.lemma_id` → glose de lemme.

**Aucun chemin parallèle** dans `app/` : les seuls lecteurs de `word_translations`/`lemma_translations` sont les fonctions batch du resolver.

## B. Chemins de résolution

| Fichier | Fonction | Niveaux utilisés | Verdict |
|---|---|---|---|
| `app/(app)/mots/[id]/page.tsx` | `getWordDetail` | forme + lemme | ✅ |
| `app/(app)/review/page.tsx` | `getReviewItems` | forme + lemme | ✅ |
| `app/(app)/learn/[slug]/page.tsx` | `buildWordBank` | **forme seule** | ⚠️ **P1** |
| `lib/learning/lesson.ts` | `buildWordBank` | **forme seule** (signature 2 params) | ⚠️ **P1** |

## C. Matrice de résolution (résultats réels)

| Cas | Mot | Forme | Lemme | Résolu |
|---|---|---|---|---|
| A. forme validée | بِسْمِ | « au nom de » | — | **« au nom de » [fr]** |
| B. lemme validé | يَوْمَ | — | « jour » | **« jour » [fr]** |
| C/D. fallback EN | مَـٰلِكِ (lemma null) | — | — | **« (The) Master » [en fallback]** |
| E. mot grammatical | فِى | — | « dans / en / sur » | **« dans / en / sur » [fr]** |
| E. mot grammatical | لَا | — | « non / ne…pas » | **« non / ne…pas » [fr]** |
| E. mot grammatical | كَانَ | — | « être » | **« être » [fr]** |
| F. multi-formes يَوْم | يَوْمَ / يَوْمُ / يَوْمِ | — | « jour » | **« jour » [fr] ×3** |
| F. multi-formes رَسُول | رَسُولُ | — | « messager / envoyé » | **« messager / envoyé » [fr]** |
| F. multi-formes قَوْم | قَوْمٌ | — | « peuple / gens » | **« peuple / gens » [fr]** |
| F. multi-formes عَبْد | عَبْدُ | — | « serviteur (de Dieu) » | **« serviteur (de Dieu) » [fr]** |

**Toutes les formes d'un même lemme résolvent la même glose** (aucune duplication en word_translations).

## D. Test des 14 gloses

**14/14 accessibles** via `getValidatedFrenchLemmaMeanings` : يَوْم · رَسُول · رَحْمَة · أَرْض · كِتَاب · قَوْم · نَاس · عَذَاب · نَبِيّ · عَبْد · لَا · كَان · كَفَر · فِي. Les mots grammaticalux (فِي · لَا · كَان) retournent leurs gloses fonctionnelles ; `editorial_notes` n'est jamais exposé comme texte utilisateur.

## E. Test de précédence

Cas réel بِسْمِ : possède une `word_translation` validée → résout « au nom de » (FORME prioritaire), **jamais écrasé** par une glose de lemme. **FORME > LEMME > EN confirmé.**

## F. Test des 4 fiches historiques 1860

4 lignes (source `567c8b5d-…`), **is_validated = false**, **invisibles au resolver** : le texte 1860 (« Esclave », « Clémence… ») n'est jamais retourné — pour les lemmes partagés (عَبْد، رَحْمَة، لَا، أَرْض), le resolver rend la glose éditoriale validée.

## G. Couverture des 21 296 formes

| Métrique | Nombre |
|---|---|
| Formes avec word_translation FR validée | **8** |
| Formes avec résolution lemme FR | **91** |
| **Formes avec une glose française (forme OU lemme)** | **99** (0,46 %) |
| Formes sans glose française (fallback EN) | **21 197** |
| Formes avec fallback anglais | 21 296 |
| Formes avec meaning vide | 0 |

## H. Duplication

**Aucun risque** : `resolveWordMeanings` sélectionne **une seule valeur** (forme > lemme > EN). Jamais deux textes rendus simultanément. Les DTO/UI consomment `meaning.text` unique. 18 lemmes multi-formes — tous résolus cohéremment.

## I. Performance

- **Aucun N+1** : requêtes batch `.in(wordIds)` + regroupement des lemma_id avant `.in(lemmaIds)`.
- **Aucune boucle SQL**, aucun chargement des 24 944 translations.
- **Index couvrants** : `(lemma_id, language)`, `(is_validated)`, `(source_id)`.
- **Verdict : aucun problème démontré.**

## J. RLS

| Opération anon | Résultat |
|---|---|
| SELECT | **OK** (18 lignes lisibles, politique de lecture) |
| INSERT | **BLOCKED** (violation RLS) |
| UPDATE | **0 ligne affectée** (RLS filtre tout) — données intactes |
| DELETE | **0 ligne supprimée** |

Seul le service role écrit. Contrainte `UNIQUE (lemma_id, language, source_id)` + invariant validation en place.

## K. Tests

`npm test` **184/184** · `tsc` **0** · `lint` **0** · `build` **0** · `verify:persistence` **13/13** · `verify:rls` **27/27** · **8 compteurs identiques** (21 296 / 77 430 / 6 236 / 24 944 / 8 / 22 / 4 / 18).

## L. Problèmes et recommandations

### P0 (bloque le moteur) — aucun

### P1 — 1 problème
**P1-20A-1 : le chemin LEÇON ignore les gloses de lemme.**
`app/(app)/learn/[slug]/page.tsx` appelle `getValidatedFrenchMeanings` (forme seule) puis `buildWordBank`, qui appelle `resolveWordMeanings` **sans le paramètre lemme**. Conséquence démontrée sur 7 mots : les leçons affichent l'EN (« (on the) Day », « (was) a Messenger »…) là où la fiche mot et la review affichent la glose FR validée (« jour », « messager / envoyé »…).

→ **Recommandation** : ajouter `getValidatedFrenchLemmaMeaningsByWord` dans la page leçon et transmettre les gloses de lemme à `buildWordBank` (3ᵉ paramètre), exactement comme les pages mot/review. **Resolver et données inchangés.**

### P2 — 1 amélioration
**P2-20A-1 : couverture FR limitée (99/21 296 formes).** Les 14 lemmes validés couvrent 91 formes + 8 formes directes. Étendre la chaîne 19A→19E aux autres lemmes du corpus (22 lemmes → lemmes restants) augmenterait la couverture. Limite de données documentée, pas un bug.

### P3 — aucun

## Décision finale

```
STATUS = AUDIT_COMPLETE
DATABASE_WRITES = 0
INSERTS = 0 · UPDATES = 0 · DELETES = 0 · MIGRATIONS = 0

P0 = 0 · P1 = 1 · P2 = 1 · P3 = 0
```

**Aucune correction appliquée** (READ_ONLY). La correction du P1 (leçon → gloses de lemme) est proposée pour une phase ultérieure dédiée.

### Livrables
- 📄 `PHASE_20A_PEDAGOGICAL_RESOLUTION_AUDIT.md`
- 📄 `tmp/phase20a-resolution-audit.json`
