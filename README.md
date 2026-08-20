# Hikma (حكمة) — application d'apprentissage du vocabulaire coranique

Hikma est une application pédagogique qui apprend à ses utilisateurs le **vocabulaire arabe du Coran** à partir des **formes réellement présentes dans le texte coranique**.

> **Public visé en priorité** : utilisateurs capables de **réciter** le Coran en arabe et souhaitant **mieux comprendre** le sens de son vocabulaire.

Langue pédagogique par défaut : **le français** (sélection unique dans `lib/learning/language.ts`, `PEDAGOGICAL_LANGUAGE = "fr"`).

---

## Parcours pédagogique

```
FORME ARABE (extrait d'un verset)
        ↓
SIGNIFICATION FRANÇAISE (glose Hikma validée)
        ↓
RECONNAISSANCE (exercices de sens)
        ↓
RÉVISION (système SRS Leitner avec plafond 365 j)
        ↓
COMPRÉHENSION DU CONTEXTE CORANIQUE
        ↓
  - Verset étudié (traduction FR Hamidullah)
  - Couche linguistique MASAQ (préfixe / radical / suffixe, POS, cas)
```

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | **Next.js 16.3** (App Router, RSC, `proxy.ts` pour le refresh de session Supabase) |
| UI | **React 19**, **Tailwind CSS 4**, `@base-ui/react` (coss/shadcn `new-york`) |
| Icônes | `lucide-react` |
| State | `zustand` (store client) |
| Base de données | **Supabase / PostgreSQL** (31 migrations versionnées sous `supabase/migrations/`) |
| Auth | `@supabase/ssr` — server + browser clients |
| Polices | Poppins (texte), Amiri (arabe), Geist Mono (code) |
| Validation | TypeScript strict, ESLint 9 (`eslint-config-next`) |
| Tests | **vitest** (≈ 60 fichiers de tests unitaires et de contrat) |
| Dates | `@daypicker/react` |

Scripts (`package.json`) : `dev`, `build`, `lint`, `test`, plus les seeds et imports
lexicaux/curriculum/MASAQ/audio reproductibles sous `scripts/`.

---

## Architecture du produit

| Surface | Route | Rôle |
|---|---|---|
| Landing publique | `app/page.tsx` (redirige `/dashboard` si connecté) | Proposition de valeur + CTA |
| Auth | `app/(auth)/login` | Connexion Supabase |
| Onboarding obligatoire | `app/(onboarding)/onboarding` | Personnalisation (Phase 32) |
| Application principale | `app/(app)/…` (route group) | Dashboard, parcours, surahs, mots, profile, review |
| Admin | `app/admin/page.tsx` | Outils internes |
| Design system | `app/design-system/page.tsx` | Catalogue de primitives UI |

Composants (App Router, Server/Client Components) :
- `components/app/` — landing, header, navigation, formulaires auth/onboarding
- `components/learn/` — lesson player, review player, daily activity, lesson discovery
- `components/ui/` — primitives UI (~50 composants : `button`, `card`, `dialog`, `exercise`, `arabic-keyboard`, `hikma-explanation`, `audio-player`, `calendar`, …)

Hook d'arabe : `hooks/`. Utilitaires : `lib/utils.ts`.

---

## Modèle lexical (cœur pédagogique)

```
quran_words            ← forme arabe (token dans un verset) + sens mot-à-mot EN (Quran.com, fallback)
  │
  ├─ word_occurrences   ← (surah, ayah, position) → word_id
  │
  ├─ lemmas             ← forme de dictionnaire (32 lemmes importés au statut initial)
  │     └─ lemma_translations  ← glose FR validée au niveau du lemme (32)
  │
  ├─ word_lemma_mapping ← table de correspondance FORME → LEMME (184 entrées)
  │
  └─ word_translations  ← glose FR validée au niveau de la FORME (538 actuellement)

translations           ← Hamidullah FR (resource_id 31) au niveau du VERSET
                        ← Sahih Intl EN (20)         — contrôles éditoriaux
                        ← Kazimirski FR (9001)       — contrôles éditoriaux
                        ← Piccardo IT (153)          — contrôles éditoriaux
sources                ← 6 sources canoniques

(la table `translations` ne doit PAS être confondue avec `word_translations` ;
 les traductions d'ayah servent au CONTEXTE ÉDITORIAL, les gloses de
 `word_translations` sont consommées par le moteur pédagogique)
```

Le schéma complet est défini dans `supabase/migrations/0001_sources.sql` à `0031_word_explanations.sql`.

---

## Resolver lexical canonique (`lib/linguistic/*`, `lib/quran/lemma-mapping.ts`)

Le resolver utilisé à l'exécution — unique chemin pour déterminer la couverture
linguistique d'une sourate :

```
FORME (quran_words)
   ├─ 1. LEMME DIRECT (word_id ↔ lemma_translations)
   ├─ 2. LEMME VIA word_lemma_mapping (word_id → lemma_id → lemma_translations)
   └─ 3. FALLBACK EN (quran_words.meaning — Quran.com, marqué isFallback)
```

- Pas de logique parallèle. La `readiness` d'une sourate (`classifySurahReadiness`)
  est une **conséquence** du resolver, pas une source de vérité indépendante.
- 0 forme non résolue sur les 114 sourates (les formes sans glose FR tombent sur
  le fallback EN, jamais sur une donnée inventée).

---

## Workflow éditorial canonique (hérité d'Al-Fātiḥah)

```
FORME ARABE
    ↓
OCCURRENCES   (sourate, ayah, position)
    ↓
AYAHS         (phrases contenant ces occurrences)
    ↓
4 TRADUCTIONS DES MÊMES AYAHS
    ↓
  • Hamidullah FR    (resource_id 31)
  • Kazimirski FR    (resource_id 9001, Le Koran 1869)
  • Sahih Intl EN    (resource_id 20)  — contrôle
  • Piccardo IT      (resource_id 153) — contrôle
    ↓
COMPARAISON FR
    ↓
CONTRÔLE EN / IT
    ↓
NOYAU SÉMANTIQUE
    ↓
GLOSE HIKMA (proposition)
    ↓
PROPOSITION (is_validated = false)
    ↓
REVUE ÉDITORIALE
    ↓
VALIDATION (is_validated = true)
    ↓
word_translations  (ou lemma_translations)
```

Les traductions d'ayah ne sont **jamais copiées** comme gloses. Les contrôles
EN/IT sont utilisés pour trancher les cas ambigus (notamment Kazimirski
datant de 1869, dont certaines tournures ne correspondent plus à l'usage
moderne du français).

---

## MASAQ — couche linguistique d'enrichissement

MASAQ est une **couche linguistique passive** ajoutée au-dessus des tokenizations
de `word_occurrences`. Elle expose le découpage **préfixe / radical / suffixe**,
les attributs morpho-syntaxiques (POS, cas, rôle syntaxique) et le statut de
lemmatisation pour chaque occurrence.

### Tables et API

- Tables : `linguistic_occurrences` (413 → **539** après Phase 63) et `linguistic_segments` (796 → **1 051**).
- Lecture runtime : `getWordLinguisticEvidence(client, wordIds, surah_number)`
  dans `lib/learning/queries.ts`.
- L'absence de données MASAQ renvoie une **Map sans entrée** pour le `word_id`
  concerné : l'absence (`ABSENT_DATA`) est une valeur valide, elle ne provoque
  **aucune erreur runtime** et aucune n'invente de donnée depuis une autre sourate.

### Classifieur d'alignement (`lib/linguistic/masaq.ts`)

```
EXACT                    ← forme Hikma = forme MASAQ après normalisation
EXACT_ORTHOGRAPHIC       ← alignement exact modulo variantes orthographiques canoniques
VARIANT_ORTHOGRAPHY_DOCUMENTED  ← variantes documentées (alif maqṣūra → yā', etc.)
AMBIGUOUS                ← alignement insuffisant — bloque l'import
MISSING                  ← occurrence présente en DB MASAQ, absente en Hikma
EXTRA                    ← occurrence présente en Hikma, absente en DB MASAQ
```

### Variantes orthographiques traitées (Phase 43 + Phase 65)

| Variante | Règle | Source |
|---|---|---|
| Petit yeh exposant `ٞ` (U+06E6) | Voyelle `-i` → yā' plein (U+064A) | Phase 43B |
| Dagger-alif (U+0670) | → alif (U+0627) | baseline |
| `U+0649 + U+0670` | → alif (U+0627) | baseline |
| Alif maqṣūra → yā' | `ى` → `ي` | baseline |
| Wasla → alif ; hamza → lettres pleines ; tatweel et signes coraniques U+06D6–U+06ED supprimés | normalisation | baseline |
| **`U+0647 + U+06E6` → omission (suffixe pronominal هِۦ)** | Phase 65 règle A′ | Phase 65 |
| **`U+0648 + U+0670` → alif plein (wāw silencieux + dagger-alif)** | Phase 65 règle B2 | Phase 65 |

Les règles A′ et B2 sont les seules ajoutées en Phase 65 ; la chaîne
`normalizeOrthographic → classifyAlignment → buildImportPlan → assertPlanScope`
reste le chemin canonique.

`scripts/import-masaq-multi-surah.ts` orchestre l'import ; `scripts/import-masaq-fatihah.ts` est conservé pour le pilote initial.

---

## État réel après Phase 65

### Compteurs de base (DB réelle, post-Phase 63, inchangés en Phase 64/65)

| Table | Valeur |
|---:|---|
| `quran_words` | **21 296** |
| `word_occurrences` | **77 430** |
| `ayahs` | 6 236 |
| `translations` | **24 944** |
| `lemmas` | 32 |
| `lemma_translations` | 32 |
| `word_lemma_mapping` | 184 |
| `word_translations` (FR validées) | **538** |
| `sources` | 6 |

### MASAQ

| Élément | Valeur |
|---:|---|
| `linguistic_occurrences` | **539** (post-Phase 63, +126 vs Phase 62) |
| `linguistic_segments` | **1 051** (post-Phase 63) |
| MASAQ sourate **91 Ash-Shams** | **54 / 116** (100 % couverture runtime) |
| MASAQ sourate **96 Al-ʿAlaq** | **72 / 139** (100 % couverture runtime) |
| MASAQ sourate **87 Al-Aʿlā** | **0 — NON IMPORTÉE en DB** |

**État 87 (post-Phase 65, pré-import)** :
- Le dry-run de sourate 87 (`SURAH=87 APPLY=0`) est **propre** :
  72/72 alignées, EXACT=47, EXACT_ORTHO=21, VARIANT=4, MISSING=0, EXTRA=0, AMBIGUOUS=0, segments=137.
- L'import réel **n'a pas encore été exécuté**.
- Les deux cas historiquement bloquants (`رَبِّهِۦ` 87:15:3 et `ٱلْحَيَوٰةَ` 87:16:3)
  sont désormais couverts par les règles A′ et B2 (Phase 65).

### Catalogue (24 parcours)

| Statut | Compte | Sourates |
|---|---:|---|
| **REFERENCE** | 1 | 1 (Al-Fātiḥah — état de référence pédagogique) |
| **READY** | 23 | 87, 91, 93, 94, 95, 96, 97, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114 |
| **IN_PREPARATION** | 0 dans le catalogue (les autres sourates n'ont pas encore de parcours) | — |

Sourates **récemment débloquées** (catalogue READY) :
- **91 Ash-Shams** (Phase 55)
- **87 Al-Aʿlā** (Phase 57) — référencée READY mais MASAQ non encore importé
- **96 Al-ʿAlaq** (Phase 59)

### Explications pédagogiques (couche `word_explanations`, Phase 44)

| Métrique | Valeur |
|---:|---|
| Explications actives FR (`is_validated = true`) | **13** |
| Contextes dédiés (`word_explanation_contexts`) | **1** |
| Sourates avec explications | 1–5 uniquement |

La couche d'explications est distincte de `word_translations`, `lemma_translations`,
`translations` (ayah) et de MASAQ. Elle reste **en cours d'enrichissement**
uniquement pour les sourates 1–5 ; les sourates 91 / 87 / 96 et toutes les autres
n'ont pas encore d'explication rédigée.

### Progression / SRS (`lib/review/scheduler.ts`)

- **Système Leitner** à doublage d'intervalle, plafonné par
  `MAX_REVIEW_INTERVAL_DAYS = 365` (Phase 63A — correction du bug de timestamp
  « année 13 510 »).
- Validation `Date` côté écriture côté serveur avant insertion dans
  `user_word_progress` / `user_word_skill_progress`.
- Activité idempotente (`activity-idempotency.test.ts`) : pas de double comptage
  sur soumissions répétées.

---

## Audio

L'application embarque un coordinateur audio (`lib/pronunciation/acoustics.ts`,
`components/ui/audio-player.tsx`) avec discrimination phonétique
(`lib/learning/phonetics.ts`). Les assets word-by-word arabe sont importables via
`scripts/import-huggingface-wbw-audio.ts` (Phase 22, source Muallim / Hugging Face).
L'audio de basmala et de quelques sourates courtes est utilisé dans l'expérience
de leçon ; la couverture **n'est pas exhaustive** sur les 114 sourates.

---

## Tests et vérification

```bash
npm run lint       # eslint 9
npx tsc --noEmit   # TypeScript strict
npm test           # vitest (≈ 60 fichiers)
npm run build      # production build Next.js
```

Tests obligatoires avant toute PR : lint, typecheck, vitest, build (toutes
doivent être vertes). Les tests incluent : `masaq.test.ts` (Phase 65 — variants
orthographiques), `resolver-mapping.test.ts`, `pedagogical-engine.test.ts`,
`exercise-state-feedback.test.ts`, `language.test.ts` (verrouillage FR), etc.

---

## Recent development status

| Phase | Verdict | Apport |
|---|---|---|
| 54 | DONE | Audit du backlog éditorial |
| 55 | DONE | Ash-Shams (91) débloquée |
| 56 | DONE | Sélection Al-Aʿlā (87) |
| 57 | DONE | Al-Aʿlā débloquée dans le catalogue |
| 58 | DONE | Sélection Al-ʿAlaq (96) |
| 59 | DONE | Al-ʿAlaq débloquée |
| 60–61 | DONE | Audit et préparation MASAQ / explanations |
| 62 | DONE | Blocage MASAQ 87 identifié (cas `رَبِّهِۦ`, `ٱلْحَيَوٰةَ`) |
| 63 | DONE | MASAQ importé pour 91 (+54 occ, +116 seg) et 96 (+72 occ, +139 seg) ; 87 différé |
| 63A | DONE | Correction du bug de timestamp SRS (plafond `MAX_REVIEW_INTERVAL_DAYS = 365`) |
| 64 | DONE | Audit READ-ONLY des variantes orthographiques MASAQ 87 (règles A′ et B2 simulées) |
| 65 | DONE | Classifieur MASAQ corrigé, dry-run sourate 87 propre (72/72 alignées, 0 AMBIGUOUS) |
| 66 | **À VENIR** | GLOBAL CONTENT PIPELINE AUDIT & INDUSTRIALIZATION PREPARATION |

---

## Roadmap

### Completed

- Moteur lexical Hikma et resolver canonique
- Workflow éditorial 4 traductions (Hamidullah FR + Kazimirski FR, contrôles EN + IT)
- Catalogue multi-sourate (24 parcours, 1 REFERENCE + 23 READY)
- Moteur d'exercices (`lib/exercises/engine.ts`, ~10 types)
- Système de progression et de maîtrise par sourate
- SRS Leitner plafonné (Phase 63A)
- Pipeline MASAQ (classifier, import-script, runtime `getWordLinguisticEvidence`)
- Couche `word_explanations` (FR, validée)
- Onboarding personnalisé obligatoire (Phase 32)
- Espace leçons hebdo / daily plan / weekly summary
- Al-Fātiḥah (référence pédagogique)
- Ash-Shams (91), Al-Aʿlā (87), Al-ʿAlaq (96) débloquées lexicalement

### In progress

- Couverture lexicale globale des 114 sourates
- Couverture MASAQ globale (54 sourates immédiatement importables identifiées
  par l'audit Phase 66 ; 40 bloquées par AMBIGUOUS résiduelles)
- Rédaction d'explications pédagogiques pour les sourates hors 1–5
- Industrialisation du traitement sur les 114 sourates

### Next

**Phase 66 — GLOBAL CONTENT PIPELINE AUDIT & INDUSTRIALIZATION PREPARATION**.
Statut : **PRÉPARATION SEULE** (rapport d'audit READ-ONLY déjà rédigé, mais
aucune écriture de production exécutée dans cette phase ; en particulier
**87 N'A PAS ENCORE ÉTÉ IMPORTÉE** en DB MASAQ). Le passage du rapport à
l'exécution reste une décision manuelle post-checkpoint.

---

## Installation locale

Pré-requis : Node 20+, npm 10+, accès à un projet Supabase (URL + clés).

```bash
npm install
cp .env.example .env       # renseigner NEXT_PUBLIC_SUPABASE_URL et _ANON_KEY
npm run db:migrate         # applique les 31 migrations
npm run seed:curriculum    # chemin de seed initial
npm run seed:multisurah    # étend le curriculum aux sourates courtes
npm run seed:word-translations
npm run seed:lemma-translations
npm run seed:word-lemma-mapping
npm run seed:priority-lemma-glosses
npm run dev
```

Les seeds sont idempotents et **ne se chevauchent pas** (chacun son périmètre).
Les imports MASAQ et audio sont séparés : ils présupposent que les seeds
curriculum / word_translations / lemmas sont en place.

Pour ne rien casser : **ne pas appliquer le script `import-masaq-multi-surah.ts`
sur sourate 87 sans dry-run préalable concluant** — c'est la convention posée
par les Phases 62–65.

---

## Conventions du projet

- **Langage** : TypeScript strict, anglais pour les noms techniques, français
  pour la documentation utilisateur et les commentaires métier.
- **RTL** : le contenu arabe est rendu en RTL via `components/ui/arabic-text.tsx` ;
  les form inputs arabe passent par `components/ui/arabic-keyboard.tsx` (Phase 36G).
- **Pas d'invention** : `resolveWordMeaning` ne retourne que des sens réellement
  stockés (le fallback EN Quran.com est marqué `isFallback`).
- **Distinction sémantique obligatoire** : la traduction française de verset
  (Hamidullah) est un **contexte / sens de verset** (`LessonAyahContext`), pas
  une glose lexicale mot-à-mot. Voir `lib/learning/language.ts`.

Les règles spécifiques à Next.js 16 (breaking changes par rapport à 14/15)
sont rappelées dans `AGENTS.md` (auto-généré par `next dev`).

---

## Notes pour contributeurs

- `tmp/` : artefacts JSON d'audit (par phase). **Non versionnés en commit de
  documentation** — ils contiennent des dumps partiels et des sorties de
  readonly-audit à ne pas confondre avec l'état canonique.
- Les `PHASE_*.md` à la racine sont des rapports d'audit relativement
  exhaustifs. Ils sont volumineux et **ne sont pas** la documentation
  utilisateur — celle-ci vit dans ce README.
- Tout changement du resolver ou du schéma se matérialise par une nouvelle
  migration `supabase/migrations/00NN_*.sql` et un test correspondant.

---

## Statut du checkpoint README

Ce README reflète l'état **post-Phase 65**, **pré-Phase 66**. Les chiffres
sont issus directement de la DB consultée pendant l'audit Phase 63 (lignes
« Baseline » des rapports `PHASE_63*`, `PHASE_64*`, `PHASE_65*`). Aucune
donnée MASAQ sourate 87, aucune rédaction d'explications pour 91/87/96, et
aucune exécution de Phase 66 ne sont présentées ici comme terminées.
