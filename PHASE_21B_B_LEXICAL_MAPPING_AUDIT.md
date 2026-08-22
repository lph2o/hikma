# PHASE 21B-B — LEXICAL / GRAMMATICAL MAPPING AUDIT & DESIGN

## STATUT

**STATUS = AUDIT_COMPLETE** · **READ_ONLY** · **DATABASE_WRITES = 0**

**INSERT = 0 · UPDATE = 0 · DELETE = 0 · UPSERT = 0 · MIGRATION = 0 · SEED = 0 · VALIDATION = 0**

Aucune migration appliquée. Aucune donnée modifiée. Les 18 lignes `lemma_translations`,
les 14 gloses validées et les 4 entrées historiques Kazimirski 1860 (`is_validated=false`)
sont **strictement inchangées**.

---

# FACTS OBSERVED

## A. Audit du schéma et de l'état réel

| Fait | Valeur |
|---|---|
| quran_words | 21 296 lignes — `arabic` UNIQUE est la clé naturelle de la **forme** |
| quran_words avec `lemma_id` renseigné | **135** (91 sous 14 lemmes FR validés + 44 sous 8 lemmes FORM_ONLY) |
| quran_words avec `lemma_id` **NULL** | **21 161 (99,37 %)** |
| occurrences liées aux formes NULL | **71 589 / 77 430 (92,5 %)** |
| champs d'identification d'une forme | `arabic` (UNIQUE), `normalized_text` dérivé (word_occurrences), `transliteration`, `meaning` (glose EN Quran.com) |
| comment lemma_id est renseigné | FK `quran_words.lemma_id → lemmas.id`, rempli uniquement pour 135 formes nues |

**Cause racine** : la segmentation word-by-word de Quran.com fusionne **proclitiques**
(و، ب، ف، ل، ت، ك) et **enclitiques pronominaux** (-ه، -هم، -ك، -نا، -كم…) dans des
unités « mot » distinctes. `quran_words.lemma_id` ne couvre que les formes **nues**.

Top des formes NULL (extrait) : ٱلَّذِينَ (810) · مِن (728) · مَا (710) · وَلَا (604) ·
إِنَّ (596) · إِلَّا (562) · وَمَا (509) · أَن (461) · مِنَ (412) · قَالَ (407)…

## B. Cas الله

- `lemma_id` = `62b46eb1-9234-4bd3-88b0-0298c25ebe6b`
- **16 formes mappées, 2 153 occurrences** (nom. ٱللَّهُ · acc. ٱللَّهَ · gén. ٱللَّهِ + variantes de ponctuation ۖ ۚ ۗ ۘ ۙ + rubʿ ۞)
- **12 formes non mappées (~400 occ)** — toutes des **proclitiques fusionnés**, mapping **SAFE** :

| Forme | Normalisé | Occ | Type |
|---|---|---|---|
| وَٱللَّهُ | والله | 239 | و + الله |
| بِٱللَّهِ (+ ۚ ۙ ۖ ۗ) | بالله | 139 | ب + الله |
| تَٱللَّهِ | تالله | 8 | serment (ت + الله) |
| فَٱللَّهُ | فالله | 6 | ف + الله |
| ٱللَّهُمَّ | اللهم | 5 | vocatif (الله + مّ) |
| وَٱللَّهِ / وَتَٱللَّهِ / أَبِٱللَّهِ / ءَآللَّهُ | — | ~5 | variantes |

- **Faux positifs exclus** : ٱللَّهَبِ (racine ل-ه-ب), ٱللَّهْوِ (racine ل-ه-و).
- **Distinction obligatoire** : variation graphique (wasla ٱ/ا, alif suscrit) · diacritiques ·
  proclitique (و/ب/ف/ت) · vocatif (مّ) · faux lexèmes (ل-ه-ب, ل-ه-و). Une simple
  normalisation Unicode **ne suffit pas** à distinguer ٱللَّهَبِ de الله.

## C. Cas رَبّ

- `lemma_id` = `01021c14-2f6b-4ce7-b18b-0c21557c023b`
- **7 formes mappées, 128 occurrences** (رَبِّ · رَّبِّ · رَبُّ · رَبَّ · رَّبُّ · رَّبٍّ · ۞ رَبِّ)
- **~194 formes non mappées (~886 occ)** — proclitiques + **suffixes pronominaux**, mapping **SAFE**
  (si la forme est bien رَبّ) :

| Forme | Occ | Type |
|---|---|---|
| رَبِّكَ | 70 | رَبّ + -كَ (ton Seigneur) |
| رَبِّي | 61 | رَبّ + -ي (mon Seigneur) |
| رَبَّكَ | 52 | رَبّ + -كَ (acc.) |
| رَبِّهِمْ | 47 | رَبّ + -هم |
| رَبَّنَا | 40 | رَبّ + -نا |
| رَبُّكَ | 38 | رَبّ + -كَ (nom.) |
| رَبِّكُمَا / رَّبِّكَ / رَّبِّكُمْ / رَبُّكُمْ / رَبِّهِ / رَبُّنَا / رَبَّهُمْ… | ~578 | autres suffixes + proclitiques (بِرَبِّ، لِرَبِّ، وَرَبِّ…) |

- **Faux positifs (~148 formes)** : racines homographes ر-ب-ص (تَرَبَّصَ « épier »),
  ق-ر-ب (قُرْبَىٰ « proximité »), ر-ب-و (رِبَا « usure »), ر-ب-ع, ر-ب-ح…
- **Ce qui relève du lemme** : le radical رَبّ. **Ce qui relève des affixes** : article
  défini assimilé (رَّبّ = الرَّبّ), préfixes بِ/لِ/و, suffixes pronominaux -ي/-كَ/-نا/-هم.

## D. Cas grammaticaux

| Groupe | Formes | Occurrences | lemma_id | Risque de conflation |
|---|---|---|---|---|
| مِن (from/among) | 82 | 2 987 | 0/82 | **normalisé « من » = identique à مَن « qui »** (conflation prouvée sur données réelles) |
| مَا (what) | 15 nues | 887 (≈2 000 avec وَمَا/بِمَا/إِنَّمَا…) | 0 | multifonction (relatif/interrogatif/négatif) |
| إِنَّ (indeed/verily) | 67 | 1 436 | 0 | se confond avec قَدْ/لَقَدْ « indeed » (glose EN non discriminante) |
| إِلَّا (except) | 8 | 672 | 0 | faible |
| وَلَا (and not) | 11 | 747 | 0 | faible |
| عَلَىٰ (on/upon) | 68 | 734 | 0 | عَلَيْهِ/عَلَيْهِمْ (enclitique) changent ى → ي |
| ثُمَّ (then) | 337 (nue) | — | 0 | faible |
| pronoms (he/they/you/we) | 2 597 | 6 869 | 0 | enclitiques fusionnés (لَهُ، بِهِ، عَلَيْهِ…) |
| démonstratifs | 245 | 1 353 | 0 | proclitiques fusionnés |

**Démonstration anti-sur-normalisation (données réelles)** :

```
مِنْ  (from)  → normalizeWordText → "من"   (728 occ)
مَنْ  (who)   → normalizeWordText → "من"   (223 occ)
```

Deux mots grammaticaux distincts → **même** `normalized_text`. Une règle
`normalized_text → lemma_id` les confondrait. Idem pour `لِلَّهِ` (« لله ») qui est
sous-chaîne de `ٱللَّهِ` (« الله »).

# SIMULATIONS

## E–K. Couverture simulée (SIMULATION ONLY — NO DATABASE WRITE)

| Étape | Formes FR gagnées | Occurrences FR gagnées |
|---|---|---|
| **Baseline** (21A) | 99 | 3 275 |
| 1. Gloser les 8 lemmes FORM_ONLY | +36 | +1 622 |
| 2. Mapper les formes الله à proclitique | +12 | +400 |
| 3. Mapper les formes رَبّ à suffixe pronominal | +194 | +886 |
| 4. Créer 15 lemmes candidats + gloses | +704 | +4 271 |
| **Total potentiel** | **≈1 045 (4,9 %)** | **≈10 454 (13,5 %)** |

> Les étapes 3 et 4 utilisent un regroupement par sous-chaîne normalisée qui peut
> inclure des faux positifs (racines homographes). Valeurs **indicatives**, à confirmer
> par analyse morphologique avant toute décision.

# RECOMMENDATIONS

## Matrice des 23 priorités (extrait — voir JSON `priorities`)

| Lemme | Status | Mappé | Non mappé | Action |
|---|---|---|---|---|
| الله | PARTIAL | 16 | 12 | mapper les proclitiques (SAFE) |
| رَبّ | PARTIAL | 7 | 194 | mapper suffixes pronominaux (SAFE) |
| لِلَّه | PARTIAL | 7 | 4 | composé de الله ; mapper وَلِلَّهِ/فَلِلَّهِ |
| الْعَـٰلَمِين | COMPLETE | 1 | 0 | glose de lemme suffit |
| الرَّحْمَـٰن | PARTIAL | 8 | 2 | mapper بِٱلرَّحْمَـٰنِ |
| الرَّحِيم | COMPLETE | 2 | 0 | glose de lemme suffit |
| الْحَمْد | PARTIAL | 2 | 1 | mapper وَٱلْحَمْدُ |
| بِسْم | COMPLETE | 1 | 0 | glose de lemme suffit |
| 15 candidats | MAPPING_REQUIRED | 0 | ~704 | créer le lemme AVANT glose |

## Comparaison des architectures (résumé — voir JSON `architecture_options`)

| Option | Verdict | Raison principale |
|---|---|---|
| **A** — remplir `quran_words.lemma_id` | **REJETÉ** | non réversible, contamine la provenance, écrasé au ré-import |
| **B** — table de mapping `word_id → lemma_id` (clé EXACTE) | **RECOMMANDÉ** | réversible, traçable, zéro conflation, sans toucher les données source |
| **C** — table de segmentation prefix/stem/suffix | **DIFFÉRÉ** | riche mais surdimensionné ; exige une source morphologique fiable |
| **D** — résolution normalisée dans le resolver | **REJETÉ** | conflation (مِنْ=مَنْ), règles linguistiques dans le code, non auditables |
| **E** — B + segmentation différée | **TRAJECTOIRE** | B immédiatement, C à réévaluer pour grammaire/audio |

## Recommandation finale (UNE)

> **Option B** : créer une table additive **`word_lemma_mapping (word_id → lemma_id)`**,
> clé **EXACTE** sur `word_id` (jamais `normalized_text`), avec provenance complète
> (`source_id`, `editorial_notes`, `created_at`), UNIQUE(word_id), RLS lecture publique /
> écriture service-role. Elle **supplémente** (ne remplace pas) `quran_words.lemma_id`.

Réponses aux 8 questions :
1. **Modifier quran_words.lemma_id ?** → **NON**.
2. **Créer une table de mapping ?** → **OUI** (`word_lemma_mapping`).
3. **Créer une couche morphologique ?** → **PAS MAINTENANT** (différée).
4. **Modifier le resolver ?** → **OUI, minimalement et plus tard** : `COALESCE(mapping.lemma_id, quran_words.lemma_id)` dans `getValidatedFrenchLemmaMeaningsByWord` — pas dans 21B-B.
5. **La moins risquée ?** → B (réversible, données source intactes).
6. **La plus extensible ?** → E (B + segmentation future).
7. **La meilleure pour l'audio ?** → B préserve `word_id` (l'audio est déjà attaché à `word_id`) ; C apportera l'audio du radical, différée.
8. **Maximiser la couverture FR sans fabriquer ?** → gloser les 8 lemmes FORM_ONLY puis mapper les formes **SÛRES** (الله proclitiques, رَبّ pronominaux) ; les 15 candidats exigent d'abord la création des lemmes.

### Migration proposée (PROPOSÉE SEULEMENT — non appliquée)

```sql
-- word_lemma_mapping : mapping lexical éditorial (additif, non destructif)
create table if not exists public.word_lemma_mapping (
  id uuid primary key default gen_random_uuid(),
  word_id uuid not null references public.quran_words (id) on delete cascade,
  lemma_id uuid not null references public.lemmas (id) on delete cascade,
  source_id uuid not null references public.sources (id),
  editorial_notes text,
  created_at timestamptz not null default now(),
  constraint word_lemma_mapping_word_key unique (word_id)
);
-- RLS : SELECT public, aucune policy d'écriture (service-role uniquement)
```

# DECISIONS REQUIRED

1. **Valider l'Option B** (table `word_lemma_mapping`) avant toute implémentation.
2. **Décider si les mots grammaticaux** (مِن، مَا، إِنَّ…) reçoivent des **lemmes
   grammaticaux** (nouvelles lignes `lemmas` de type grammatical) ou une structure dédiée.
3. **Décider la source de provenance** du mapping éditorial (nouvelle ligne `sources`).
4. **Décider le périmètre exact** des mappings « SAFE » à charger (الله/رَبّ/لِلَّه proclitiques+enclitiques documentés ci-dessus).

# NO DATABASE CHANGES

Aucune des opérations suivantes n'a été effectuée : modification de quran_words, lemmas,
lemma_translations, word_translations, translations, sources, resolver, lesson, UI ;
aucune migration, aucun seed, aucun import, aucune validation.

## Non-régression

| Commande | Résultat |
|---|---|
| `npm test` | **190/190** ✅ |
| `npx tsc --noEmit` | ✅ 0 erreur |
| `npm run lint` | ✅ 0 erreur |
| `npm run build` | ✅ |
| `npm run verify:persistence` | 13/13 ✅ |
| `npm run verify:rls` | 27/27 ✅ |

Compteurs DB strictement identiques à 21A/21B-A (vérifiés).

## Livrables

- 📄 `PHASE_21B_B_LEXICAL_MAPPING_AUDIT.md` (ce rapport)
- 📄 `tmp/phase21b-b-lexical-mapping-audit.json` (`AUDIT_COMPLETE`, `database_writes: 0`, `migrations_applied: 0`)
- 📄 `tmp/phase21b-b-facts.json` (faits observés bruts)
- 📄 scripts READ-ONLY : `tmp/phase21b-b-audit.ts`, `tmp/phase21b-b-build.ts`

---

**ARRÊT OBLIGATOIRE.** Aucune implémentation. Aucune glose importée. Aucune glose validée.
La prochaine phase sera décidée uniquement après lecture de ce rapport.
