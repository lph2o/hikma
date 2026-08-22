# PHASE 70B — PILOTE ÉDITORIAL : GRILLE DE REVUE HUMAINE (LOT 1)

**STATUT : READ_ONLY · DATABASE_WRITES = 0 · IMPORTS = 0 · VALIDATIONS = 0**

Méthodologie : **Phase 22 LEXICAL_WORKFLOW_STANDARD** — 4 traductions alignées sur le même ayah_id
(31 Hamidullah FR · 9001 Kazimirski 1869 FR · 20 Sahih International EN · 153 Piccardo IT), noyau
sémantique par convergence, aucune glose copiée d'une traduction d'ayah. Chaque ligne est une
**PROPOSITION** (`is_validated = false` implicite) : rien n'est écrit, rien n'est validé.

## Sélection (déterministe, données réelles)

Base : `tmp/phase69/forms-coverage.csv` → **1 115 candidats** catégorie C (évidence MASAQ, sans glose
FR validée) + P1 (impact HIGH, Phase 66) + non enseignés. Stratification : 8 nominaux / 5 verbaux /
2 grammaticalx / 1 non classé (tri par fréquence au sein de chaque famille). Garde-fou live :
aucune `word_translation` FR validée (vérifié en base, 0 écart).

## Grille de revue — décisions possibles : ACCEPT · MODIFY · REJECT · MOVE_TO_LEMMA · NEEDS_REVIEW

| # | Forme | Famille / POS (MASAQ) | Occ. | Sour. | Proposition | Classification | Conf. | Décision |
|---|-------|----------------------|-----:|------:|-------------|---------------|--------|----------|
| 1 | دُونِ | NOMINAL · NOUN_ABSTRACT | 71 | 34 | GLOSE « en dehors de / autre que » | GRAMMATICAL_FUNCTION | HIGH | |
| 2 | ٱلسَّمَآءِ | NOMINAL · NOUN_CONCRETE | 67 | 38 | GLOSE « le ciel » | DIRECT_EQUIVALENT | HIGH | |
| 3 | ٱلْكِتَـٰبَ | NOMINAL · NOUN_CONCRETE | 61 | 29 | MOVE_TO_LEMMA → كِتَاب (« livre / Écriture » existant) | DIRECT_EQUIVALENT | HIGH | |
| 4 | ٱلْكِتَـٰبِ | NOMINAL · NOUN_CONCRETE | 67 | 28 | MOVE_TO_LEMMA → كِتَاب (idem, variante casuelle) | DIRECT_EQUIVALENT | HIGH | |
| 5 | سَبِيلِ | NOMINAL · NOUN_ABSTRACT | 63 | 20 | GLOSE « sentier / voie » | DIRECT_EQUIVALENT | HIGH | |
| 6 | ٱلْمُؤْمِنِينَ | NOMINAL · NOUN_ACTIVE_PART | 49 | 20 | GLOSE « les croyants » | DIRECT_EQUIVALENT | HIGH | |
| 7 | ٱلظَّـٰلِمِينَ | NOMINAL · NOUN_ACTIVE_PART | 34 | 23 | GLOSE « les injustes / les oppresseurs » | DIRECT_EQUIVALENT | HIGH | |
| 8 | مُوسَىٰ | NOMINAL · NOUN_PROP_FOREIGN | 48 | 23 | GLOSE « Moïse » | DIRECT_EQUIVALENT | HIGH | |
| 9 | لَيْسَ | VERBAL · UNINFLECTED_VERB | 32 | 21 | GLOSE « n'être pas » | GRAMMATICAL_FUNCTION | MEDIUM | |
| 10 | وَبِئْسَ | VERBAL · CONJ+UNINFLECTED_VERB | 10 | 8 | GLOSE « et quel mauvais… ! » | CONTEXTUAL_EQUIVALENT | MEDIUM | |
| 11 | عَسَىٰٓ | VERBAL · UNINFLECTED_VERB | 8 | 8 | GLOSE « il se peut / peut-être » | DIRECT_EQUIVALENT | HIGH | |
| 12 | فَبِئْسَ | VERBAL · CONJ+UNINFLECTED_VERB | 5 | 4 | GLOSE « et quel mauvais… ! » (même verbe بِئْسَ) | CONTEXTUAL_EQUIVALENT | MEDIUM | |
| 13 | لَّيْسَ | VERBAL · UNINFLECTED_VERB | 7 | 6 | GLOSE « n'être pas » (variante orthographique de لَيْسَ) | GRAMMATICAL_FUNCTION | MEDIUM | |
| 14 | مِّنَ | GRAMMATICAL · PREP | 225 | 60 | GLOSE « de / parmi (préposition) » | GRAMMATICAL_FUNCTION | MEDIUM | |
| 15 | بِمَا | GRAMMATICAL · PREP+REL_PRON | 158 | 57 | GLOSE « par ce que / ce que » | GRAMMATICAL_FUNCTION | MEDIUM | |
| 16 | كُنتُمْ | UNKNOWN (verbe : PV+PVSUFF 2MP) | 95 | 37 | MOVE_TO_LEMMA → كَان (« être » existant) | DIRECT_EQUIVALENT | HIGH | |

## Justifications clés (extraits réels des 4 traductions, voir `tmp/phase70b/evidence.json`)

1. **دُونِ** — « مِن دُونِ ٱللَّهِ » : Hamidullah « en dehors d'Allah » (37:23, 22:12) · Kazimirski « à côté de Dieu » · Sahih « other than/besides » · Piccardo « all'infuori di ». Nom grammaticalisé en quasi-préposition.
2. **ٱلسَّمَآءِ** — « le ciel » (51:23, 40:13, 2:59) : convergence 4/4 (ciel / ciel / sky / cielo).
3–4. **ٱلْكِتَـٰبَ / ٱلْكِتَـٰبِ** — « le Livre / l'Écriture » (37:117, 46:2, 43:4) : acc./gén. du même nom. **Lemme كِتَاب existant** (« livre / Écriture » FR validée) → mapping au lieu d'un doublon de glose.
5. **سَبِيلِ** — « sentier / voie » : « sentier » (Hamidullah, Kazimirski) · « way » (Sahih) · « sentiero » (Piccardo) ; سَبِيلِ ٱللَّهِ = « la voie d'Allah ».
6. **ٱلْمُؤْمِنِينَ** — « les croyants » : croyants / fidèles / believers / credenti (48:5, 3:121, 9:112).
7. **ٱلظَّـٰلِمِينَ** — « les injustes / les oppresseurs » : injustes / méchants-impies / wrongdoers / ingiusti (42:22, 6:33, 61:7).
8. **مُوسَىٰ** — « Moïse » : translittération standard (28:37, 18:60, 7:142).
9. **لَيْسَ** — « n'être pas » : verbe de négation (56:2, 3:182) — fonction grammaticale, non lexicale.
10. **وَبِئْسَ** — « et quel mauvais… ! » : exclamation de blâme figée (14:29 « et quel mauvais gîte ! », 64:10, 57:15). Pas de lemme بِئْسَ existant.
11. **عَسَىٰٓ** — « il se peut / peut-être » : il se peut / il peut / perhaps / forse (27:72, 12:21, 7:185) — convergence 4/4.
12. **فَبِئْسَ** — même verbe بِئْسَ avec فَ (38:56, 39:72, 43:38) ; glose identique, **jamais de fusion** des deux formes.
13. **لَّيْسَ** — variante orthographique (assimilation) de لَيْسَ (24:29, 4:123, 53:39) ; glose identique, deux word_id conservés.
14. **مِّنَ** — préposition (33:23, 20:128, 3:188) : « parmi / de ». Fréquence seule ≠ justification (règle Phase 70) ; cohérence avec مِن déjà glosé « de / contre » (21E) à vérifier.
15. **بِمَا** — بِ + مَا relatif (36:27, 23:96, 5:44) : « en raison de quoi / par ce qui / selon ce que » — variation contextuelle documentée.
16. **كُنتُمْ** — parfait 2MP de كَان (3:110, 10:22, 10:28) : « vous êtes / vous étiez ». **Lemme كَان existant** (« être » FR validée) → mapping. (POS MASAQ PV+PVSUFF : verbe ; la famille « UNKNOWN » est un artefact de tri.)

## Points de vigilance (décisions éditoriales humaines)

- **Polysémie / cohérence** : دُونِ (prépositionnel) et مِّنَ (fonction) — gloses grammaticales à confirmer ; بِمَا — variation contextuelle large.
- **MOVE_TO_LEMMA (3, 4, 16)** : aucun doublon de glose ; réutilisation des lemmes كِتَاب / كَان. Les lemmes cibles sont `proposed` (status) mais ont une lemma_translation FR **validée** (le runtime s'appuie sur `is_validated`).
- **Formes « sœurs »** : ٱلْكِتَـٰبَ / ٱلْكِتَـٰبِ · لَيْسَ / لَّيْسَ · وَبِئْسَ / فَبِئْسَ — conservées distinctes (jamais de fusion artificielle), gloses ou mappings alignés.
- **Nom propre** : مُوسَىٰ (Moïse) — translittération, pas de noyau sémantique multi-source à proprement parler.

## Artefacts

- `tmp/phase70b/pilot-candidates.json` (sélection, 16) · `tmp/phase70b/evidence.json` (dossiers complets, tous contextes + 4 traductions) · `tmp/phase70b/analyst-view.json` · `tmp/phase70b/proposals.json` (propositions structurées) · scripts read-only `tmp/phase70b-*.ts` · cette grille.

**Aucune écriture DB. Aucune validation. Prochaine étape : décisions humaines de revue (colonne Décision), puis — uniquement après un nouveau human gate — import contrôlé via le mécanisme canonique.**
