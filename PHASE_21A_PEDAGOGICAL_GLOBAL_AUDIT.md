# PHASE 21A — AUDIT PÉDAGOGIQUE GLOBAL

## STATUT

**STATUS = AUDIT_COMPLETE** · **READ_ONLY** · **DATABASE_WRITES = 0**

**P0 = 0 · P1 = 0 · P2 = 2 · P3 = 1 · P4 = 0**

---

## A. État actuel

| Compteur | Valeur |
|---|---|
| quran_words | 21 296 |
| word_occurrences | 77 430 |
| ayahs | 6 236 |
| translations | 24 944 (Hamidullah + Kazimirski 1869 + Sahih + Piccardo) |
| word_translations | 8 (validées) |
| lemmas | 22 |
| sources | 4 |
| lemma_translations | **18** (14 FR validées éditoriales + 4 Kazimirski 1860 non validées) |

## B. Ce qui fonctionne

1. **Résolution cohérente** : FORME → LEMME → EN sur toutes les surfaces (fiche mot, review, leçon — fix 20B appliqué et testé). Aucune inversion, aucune duplication, aucun mot à double sens.
2. **Resolver branché jusqu'à l'UI** : chaîne complète DATABASE → queries batch → `resolveWordMeanings` → `buildWordBank` → `generateLessonExercises` → LessonPlayer/exercises. Vérifiée sur les générateurs (word-to-translation, translation-to-word, multiple-choice, review).
3. **14 gloses FR validées opérationnelles** : 91 formes, 3 275 occurrences, 2 206 ayahs couverts.
4. **Les 4 fiches historiques 1860 restent invisibles** (is_validated=false) — le texte 1860 n'est jamais exposé.
5. **RLS sain** : lecture anon OK sur 11/11 tables ; INSERT/UPDATE/DELETE bloqués.
6. **Performance** : aucun N+1, requêtes batch `.in()`, index couvrants.
7. **3 leçons existantes** : 10 mots, tous résolus en FR forme validé — 0 fallback EN dans le parcours actuel.

## C. Problèmes P0–P4

| Niveau | Description |
|---|---|
| **P0** | Aucun — le moteur ne bloque nulle part |
| **P1** | Aucun (le P1 20A est corrigé en 20B et vérifié) |
| **P2-1** | Couverture FR faible : 99/21 296 formes (0,46 %) |
| **P2-2** | Corpus de leçons minimal (3 leçons, 10 mots) — impact réel des gloses à mesurer sur un parcours plus riche |
| **P3** | 21 197 formes EN-only dont des mots grammaticalux très fréquents (مِن، مَا، إِنَّ…) **sans lemma_id** — gloses fonctionnelles impossibles au niveau lemme actuel |

## D. Couverture française réelle

| Mesure | Nombre | % |
|---|---|---|
| A. Total quran_words | 21 296 | 100 % |
| B. Formes avec FR forme validé | 8 | 0,04 % |
| C. Formes avec FR via lemme | 91 | 0,43 % |
| **FR accessible (B+C)** | **99** | **0,46 %** |
| D. EN seulement | 21 197 | 99,54 % |
| E. Aucune donnée | 0 | 0 % |

**Distribution par fréquence** : les FR accessibles sont biaisées vers les formes fréquentes (7 formes >100 occurrences FR couvertes vs 70 EN-only). La couverture FR est concentrée là où elle compte le plus — mais reste très minoritaire.

## E. Impact des 14 gloses

- **91 formes** couvertes · **3 275 occurrences** · **2 206 ayahs** (35 % du Coran).
- Top contributeurs : فِي (1 098 occ), لَا (749), كَان (323), أَرْض (291), يَوْم (217), نَاس (182), عَذَاب (150).
- Les 14 lemmes couvrent les catégories majeures : nom divin, messagers, noms communs religieux, mots grammaticalux.

## F. Top priorités lexicales

### Le mmes FORM_ONLY (8) — glose de lemme manquante, ordonnés par impact

| Lemme | Occurrences | Formes | Ayahs | Impact |
|---|---|---|---|---|
| الله | 2 153 | 16 | 1 566 | **Très élevé** (nom divin omniprésent) |
| رَبّ | 128 | 7 | 124 | **Élevé** (Seigneur) |
| لِلَّه | 116 | 7 | 113 | **Élevé** (à Allah) |
| الْعَـٰلَمِين | 61 | 1 | 61 | Moyen (les mondes) |
| الرَّحْمَـٰن | 45 | 8 | 45 | Moyen (Le Tout Miséricordieux) |
| الرَّحِيم | 34 | 2 | 34 | Moyen (Le Très Miséricordieux) |
| الْحَمْد | 26 | 2 | 25 | Moyen (la louange) |
| بِسْم | 3 | 1 | 3 | Faible (forme déjà couverte) |

### Mots fréquents sans FR et sans lemme (échantillon Top 50)
ٱلَّذِينَ (810) · مِن (728) · مَا (710) · وَلَا (604) · إِنَّ (596) · إِلَّا (562) · قَالَ (407) · عَلَىٰ (347) · ثُمَّ (337) · ذَٰلِكَ (267)… — **nécessitent un mapping lemme grammatical** avant toute glose fonctionnelle.

## G. Impact sur les premières leçons

Les 3 leçons existantes (basmala, al-hamd, ar-rahman — 10 mots) : **100 % FR forme validé, 0 fallback EN**. Le parcours débutant actuel est entièrement en français. L'ajout de gloses de lemme pour الله/رَبّ/لِلَّه toucherait les versets 1:1-1:5 (basmala + Fatiha) dès le premier écran — impact maximal pour les débutants.

## H. Problèmes dans les exercices

**Aucun.** Tous les générateurs consomment `target.meaning` (résolu). La review utilise FORME+LEMME. Les badges (« Sens français validé » / « Sens mot à mot en anglais — FR en préparation ») reflètent correctement la résolution.

## I. Recommandations produit

1. **Enrichir les leçons** pour exposer les 91 formes des 14 lemmes validés (maximiser l'exposition FR).
2. **Conserver l'affichage double** (glose + contexte verset FR) — bonne pratique actuelle, indispensable pour les lemmes polysémiques.
3. **Afficher les contextual_variations** dans la fiche mot pour كِتَاب، أَرْض، يَوْم.
4. Mesurer le taux de fallback EN réel après enrichissement du parcours.

## J. Recommandations données

1. **Priorité 1** : gloses de lemme pour **الله (2 153 occ), رَبّ (128), لِلَّه (116)** — impact immédiat maximal.
2. **Priorité 2** : les 5 autres lemmes FORM_ONLY (الْعَـٰلَمِين، الرَّحْمَـٰن، الرَّحِيم، الْحَمْد، بِسْم).
3. **Priorité 3** : lexique grammatical dédié pour les mots fréquents sans lemma_id (مِن، مَا، إِنَّ…) — travail de recherche en amont.
4. **Total utile** : ~8 gloses de lemme immédiates + lexique grammatical à moyen terme.

## K. Ce qui NE doit PAS être modifié

- Les **4 entrées Kazimirski 1860** (source historique, is_validated=false).
- La **précédence FORME > LEMME > EN** (corrigée et testée en 20B).
- Le **resolver** (point unique de résolution) et la couche requêtes batch.
- Les **données importées** (translations, word_translations, lemma_translations validées).
- Les **politiques RLS** (lecture OK, écriture protégée).
- Le **double affichage glose + contexte verset**.

## L. Proposition de PHASE 21B

**PHASE 21B — GLOSES DE LEMME PRIORITAIRES** : produire et importer les gloses des 8 lemmes FORM_ONLY (priorité الله/رَبّ/لِلَّه) selon la chaîne validée 19A→19E (analyse multi-traductions → propositions → revue éditoriale → import `is_validated=false`). Prévoir la revue du mapping lemme des mots grammaticalux fréquents.

**Décision recommandée : oui** — mais **non lancée automatiquement**. Décision éditoriale requise.

---

## Décision finale

```
STATUS = AUDIT_COMPLETE
DATABASE_WRITES = 0
INSERT = 0 · UPDATE = 0 · DELETE = 0 · MIGRATIONS = 0 · IMPORTS = 0 · SEEDS = 0
P0 = 0 · P1 = 0 · P2 = 2 · P3 = 1 · P4 = 0
```

**Aucune modification du produit, aucune donnée touchée.**

### Livrables
- 📄 `PHASE_21A_PEDAGOGICAL_GLOBAL_AUDIT.md`
- 📄 `tmp/phase21a-pedagogical-global-audit.json` (`AUDIT_COMPLETE`)
