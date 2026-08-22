# PHASE 19B — PRÉPARATION DES GLOSES PÉDAGOGIQUES KAZIMIRSKI

## STATUT

**STATUS = GLOSS_PROPOSALS_READY** · **DATABASE_WRITES = 0** · **IMPORTS = 0** · **VALIDATIONS = 0** · **MIGRATIONS = 0**

**14 propositions** préparées · **13 HIGH** · **1 MEDIUM** · **0 LOW** · **0 INSUFFICIENT_EVIDENCE** · **14/14 nécessitent une revue humaine**

---

## 1. Méthode

Chaque glose est une **synthèse lexicale courte** (1–5 mots) construite à partir :
1. des formulations **Hamidullah** (fr, rid 31) ;
2. des formulations **Kazimirski 1869** (fr, rid 9001) ;
3. **Sahih International** (en, rid 20) et **Piccardo** (it, rid 153) comme contrôle ;
4. des **occurrences réelles** du lemme (3 275 occurrences, 2 206 ayahs — Phase 19A) ;
5. des **variations contextuelles** observées (semantic_core + contextual_variations).

**Aucun texte de traduction n'est copié tel quel** : la glose résume le noyau lexical. **Aucune écriture en base.**

## 2. Tableau final

| Lemme | Glose proposée | Confiance | Variations | Revue humaine |
|------|----------------|-----------|------------|---------------|
| يَوْم | « jour » | HIGH | jour temporel · jour eschatologique (Rétribution, Résurrection, Dernier) | ✅ |
| رَسُول | « messager / envoyé » | HIGH | envoyé de Dieu · prophètes envoyés (pluriel) | ✅ |
| رَحْمَة | « miséricorde » | HIGH | miséricorde divine (attribut) · bienfait accordé | ✅ |
| أَرْض | « terre » | HIGH | terre-monde · surface terrestre (sur la terre) | ✅ |
| كِتَاب | « livre / Écriture » | HIGH | révélation (Coran) · écritures antérieures · loi/prescription | ✅ |
| قَوْم | « peuple / gens » | **MEDIUM** | gens · peuple · groupe · tribu · hommes | ✅ |
| نَاس | « gens / hommes » | HIGH | humanité (indéfini) · vocatif « Ô hommes » | ✅ |
| عَذَاب | « châtiment » | HIGH | châtiment douloureux · cruel · du Feu · humiliant | ✅ |
| نَبِيّ | « prophète » | HIGH | le Prophète (titre) · prophètes (collectif) · ummî | ✅ |
| عَبْد | « serviteur (de Dieu) » | HIGH | statut de dévotion (Jésus, Muhammad) · serviteur repentant | ✅ |
| لَا | « non / ne…pas » | HIGH | négation verbale · nominale (aucun) · coordonnée (ni) · réponse | ✅ |
| كَان | « être » | HIGH | copule du passé · existence · aspect inaccompli (habitude) | ✅ |
| كَفَر | « être incrédule / ne pas croire » | HIGH | verbe (renier) · substantif (mécréant / infidèle) | ✅ |
| فِي | « dans / en / sur » | HIGH | localisation concrète (dans) · figurée (en) · spatiale (sur) | ✅ |

## 3. Catégorisation

### A — PROPOSITIONS FORTEMENT SUPPORTÉES (13)
يَوْم · رَسُول · رَحْمَة · أَرْض · كِتَاب · نَاس · عَذَاب · نَبِيّ · عَبْد · لَا · كَان · كَفَر · فِي

Convergence nette des deux traductions françaises + cohérence des contrôles EN/IT sur des centaines d'occurrences (jusqu'à 1 098 pour فِي). **HIGH ≠ VALIDATED** : chaque proposition est une proposition éditoriale, `requires_human_review = true`.

### B — PROPOSITION À REVUE (1)
**قَوْم** — MEDIUM. Kazimirski 1869 rend قَوْم par « hommes », « tribu », « quelques hommes » là où Hamidullah dit « gens », « peuple », « un groupe » : le noyau « collectif de personnes » est stable, mais la **réduction à une glose unique est délicate**. La formulation prudente « peuple / gens » doit être validée humainement avec les variantes documentées dans la fiche.

### C — INSUFFICIENT_EVIDENCE (0)
Aucun lemme ne présente une insuffisance réelle des données après l'analyse détaillée 19A (tous les lemmes disposent d'occurrences suffisantes et de convergence FR).

## 4. Notes éditoriales clés (par lemme — extraits)

- **يَوْم** : « jour » couvre le temporel (2:259) et l'eschatologique (1:4, 2:113, 2:212) — nuance à documenter dans la fiche.
- **رَسُول** : « apôtre » (Kazimirski, 19ᵉ s.) = même noyau que « Messager » (Hamidullah) — pas trois sens.
- **عَبْد** : sur les 5 occurrences coraniques, les 4 traductions rendent « serviteur (de Dieu) » ; la valeur « esclave » du Dictionnaire 1860 n'apparaît pas dans ces contextes. Glose indépendante de la fiche 1860.
- **لَا · كَان · فِي** : mots grammaticalux — glose fonctionnelle (négation / copule / préposition), explication grammaticale dans `editorial_note`, jamais dans `proposed_gloss`.

## 5. Contrôle contre les traductions (section 12)

Pour chaque proposition : noyau présent dans Hamidullah ✅, présent ou équivalent dans Kazimirski 1869 ✅, cohérent avec les occurrences ✅, aucune contradiction majeure ✅, cohérent avec EN/IT ✅. Aucune glose n'a été classée HIGH sans ce contrôle. Aucune donnée inventée.

## 6. lemma_translations — inchangées

Les 4 entrées existantes (عَبْد · رَحْمَة · لَا · أَرْض, `is_validated = false`, source `567c8b5d-…`) sont **strictement inchangées**. Aucune proposition n'est écrite, validée ni insérée — **PROPOSED / NOT VALIDATED** pour les 14.

## 7. Non-régression

| Compteur | Attendu | Constaté |
|---|---|---|
| quran_words | 21 296 | **21 296** ✅ |
| word_occurrences | 77 430 | **77 430** ✅ |
| ayahs | 6 236 | **6 236** ✅ |
| translations | 24 944 | **24 944** ✅ |
| word_translations | 8 | **8** ✅ |
| lemmas | 22 | **22** ✅ |
| sources | 4 | **4** ✅ |
| lemma_translations | 4 | **4** ✅ |

| Contrôle | Résultat |
|---|---|
| `npm test` | ✅ 184/184 |
| `npx tsc --noEmit` | ✅ 0 erreur |
| `npm run lint` | ✅ 0 erreur |
| `npm run build` | ✅ 0 erreur |
| `npm run verify:persistence` | ✅ 13/13 |
| `npm run verify:rls` | ✅ 27/27 |

## 8. Livrables

- 📄 `PHASE_19B_PEDAGOGICAL_GLOSS_PROPOSALS.md` (ce rapport)
- 📄 `tmp/phase19b-pedagogical-gloss-proposals.json` (**14 propositions**, schéma : lemma, lemma_id, proposed_gloss, confidence, semantic_core, contextual_variations, evidence_summary, editorial_note, requires_human_review)
- Référence : `tmp/phase19a-multi-translation-analysis.json` (analyse source, 19A)

---

## DÉCISION FINALE

**STATUS = GLOSS_PROPOSALS_READY**

- **HIGH : 13** · **MEDIUM : 1** · **LOW : 0** · **INSUFFICIENT_EVIDENCE : 0**
- **Nécessitant une revue humaine : 14/14** (y compris les HIGH — jamais validées automatiquement)

**DATABASE_WRITES = 0 · IMPORTS = 0 · VALIDATIONS = 0 · MIGRATIONS = 0** — ARRÊT OBLIGATOIRE. La validation humaine des propositions et l'éventuel import dans `lemma_translations` (avec `is_validated = false`) seront des étapes éditoriales séparées.
