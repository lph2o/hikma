# PHASE 22B — AUDIO PROVIDER & LICENSING PREPARATION

**STATUS FINAL : `AUDIO_PROVIDER_PREPARATION_COMPLETE`**
**DATABASE_WRITES = 0 · IMPORTS = 0 · MIGRATIONS = 0**

> Phase strictement READ_ONLY. Aucun fichier audio importé, aucun schéma modifié,
> aucun resolver ni UI modifiés. Ce rapport prépare la **licence** et la
> **technique** avant toute implémentation (22C+).

---

## 0. RÉSUMÉ

- **Juridique** : l'affichage/streaming in-app de l'audio QF est
  `ALLOWED_WITH_CONDITIONS`, mais l'**usage commercial SaaS**, le **stockage >
  1 semaine** et la **redistribution autonome** sont `LICENSE_REQUIRED`.
  → **Hikma doit obtenir une licence commerciale écrite QF** avant tout import.
- **Technique** : le plus petit changement est d'ajouter `audio_url` au type
  `NormalizedWord` dans `normalize.ts` (aucune migration).
- **Architecture** : un `AudioProvider` (interface) découple le moteur pédagogique
  de la source (QF / alternative / self-hosted), via les tables 0009 existantes.
- **Aucune alternative WBW open-license trouvée** : négocier QF plutôt que changer.

---

## 1. PARTIE A — AUDIT JURIDIQUE QF

**Source primaire** : *Quran Foundation Developer Terms of Service* (MAJ 2026-08-10)
+ *quran.com/terms-and-conditions*.

| point | classification | preuve / note |
|---|---|---|
| Définition QF Content | FACT | « text, translations, metadata, **audio**, reflections… » |
| Affichage in-app | ALLOWED_WITH_CONDITIONS | « may display QF Content to end users » (pas de revente autonome, contexte prohibé) |
| Streaming | ALLOWED_WITH_CONDITIONS | relève de l'affichage ; commercial → licence |
| Usage commercial | **LICENSE_REQUIRED** | « requires a separate written commercial license agreement » |
| SaaS commercial | **LICENSE_REQUIRED** | idem |
| Utilisateurs payants | **LICENSE_REQUIRED** | usage commercial |
| Usage dans les exercices | ALLOWED_WITH_CONDITIONS | intégral à l'expérience ; payant → licence |
| Cache | ALLOWED_WITH_CONDITIONS | « longer than 1 week » interdit |
| Durée max cache | FACT | 1 semaine (sauf Content Sync APIs) |
| Stockage permanent | **LICENSE_REQUIRED** | dépasse le cache 1 semaine |
| Téléchargement | UNCLEAR | non explicitement traité |
| Redistribution | **BLOCKED** | « not resold, sublicensed, redistributed except as integral… » |
| Transformation audio | UNCLEAR | seuls le texte (« not modified ») est couvert |
| Découpage audio | UNCLEAR | non couvert (inutile : WBW natif existe) |
| Génération audio depuis flux | UNCLEAR | non couvert |
| Attribution | UNCLEAR | pas d'exigence explicite, mais « ne pas tromper sur la source » |
| Restrictions de marque | SAFE | Brand Features protégées |
| Restrictions API / quotas | ALLOWED_WITH_CONDITIONS | rate limits, pas de scraping |
| Web / mobile | ALLOWED_WITH_CONDITIONS | affichage in-app ; commercial → licence |

**Conclusion** : `ALLOWED_WITH_CONDITIONS` pour l'affichage, **`LICENSE_REQUIRED`**
pour l'usage commercial SaaS, le stockage durable et la redistribution autonome.
Aucun point n'est `SAFE` pour un service payant sans licence écrite.

---

## 2. PARTIE B — LICENCE À DEMANDER

**Checklist (15 points)** : usage commercial · audio mot-à-mot · streaming ·
cache > 1 semaine · stockage/hors-ligne · exercices pédagogiques · utilisateurs
gratuits · utilisateurs payants · volume de requêtes · attribution ·
modification/découpage · CDN propre · durée de conservation · web · mobile.

**Brouillon d'email** : `tmp/phase22b-qf-commercial-license-request.md` (factuel,
n'affirme aucune autorisation existante).

---

## 3. PARTIE C — AUDIT TECHNIQUE

- `QuranComWord.audio_url` (chemin relatif `wbw/001_001_001.mp3`) est **capturé** par l'adapteur.
- `normalize.ts` le **jette** : `NormalizedWord` n'a aucun champ audio et
  `wordsByArabic.set()` n'enregistre que `arabic / transliteration / meaning / root`.
- **Plus petit changement** : ajouter `audio_url: string | null` à `NormalizedWord`
  + `audio_url: token.audio_url ?? null` dans `normalize.ts`. **Aucune migration.**
- Tables 0009 (`recitations` 14 · `ayah_audio` 0 · `word_audio` 0) : prêtes.
- Générateurs `audioToWord` / `wordToAudio` : renvoient `null` (prêts à activer).
- UI : aucun player ; badge « indisponible » dans la page leçon.

---

## 4. PARTIE D — ARCHITECTURE AUDIO PROVIDER

```
Pedagogical Engine (LessonPlayer / exercices / review / fiche mot)
        │  dépend UNIQUEMENT de
        ▼
   AudioProvider (interface)
     ├─ getWordAudio(wordIds) → Map<word_id, audio_url[]>
     └─ getAyahAudio(ayahId)  → AyahAudioInfo[]
        │
        ├── QFProvider            (stream CDN QF)
        ├── AlternativeProvider   (autre source)
        └── SelfHostedProvider    (Supabase Storage)
```

- Le moteur pédagogique ne connaît **jamais** Quran.com directement.
- **Aucune nouvelle migration** : les implémentations lisent `word_audio` /
  `ayah_audio` (0009).
- Remplaçable sans toucher LessonPlayer, exercices, review, progression.

---

## 5. PARTIE E — MODÈLE `word_audio`

Schéma (0009) : `id · word_id (FK cascade) · recitation_id (FK set null) ·
audio_url (NOT NULL) · duration · source_id (set null) · created_at ·
UNIQUE(word_id, recitation_id)` · index `word_audio_word_id_idx` · RLS lecture seule.

**Déduplication** :

| option | avantage | inconvénient | verdict |
|---|---|---|---|
| A. `word_id` | clé naturelle du mot isolé | — | ✅ RECOMMANDÉ |
| B. texte/forme | identique à A (arabic = identité) | redondant | équivalent |
| C. `audio_url` | — | URL WBW quasi-uniques par position | ❌ |
| D. provider + id | provenance traçable | clé non naturelle | ✅ hybride (source_id) |

**Recommandation** : dédup par **A (word_id)** + provenance **D (source_id)** ;
`recitation_id` NULL pour le WBW (mot isolé non lié à un récitant), renseigné pour
un éventuel audio par récitant.

---

## 6. PARTIE F — STRATÉGIE DE CACHE

| option | licence | coût | performance | risque | verdict |
|---|---|---|---|---|---|
| A. streaming direct | cache 1 sem | nul | dépend CDN QF | dépendance + 1 sem | **départ** |
| B. cache navigateur | HTTP (1 sem) | nul | bon relecture | limite QF | complément A |
| C. CDN propre | LICENSE_REQUIRED | infra | excellent | juridique | après licence |
| D. Supabase Storage | LICENSE_REQUIRED | storage+bw | bon + offline | juridique | **cible** |
| E. autre storage | LICENSE_REQUIRED | variable | variable | juridique | équiv. D |

Aucune estimation de coût inventée. Départ = A (+B) ; cible = D après licence.

---

## 7. PARTIE G — MOMENT PÉDAGOGIQUE (cible)

| # | moment | comportement | priorité |
|---|---|---|---|
| 1 | première présentation | `رَبِّهِمْ · Seigneur/maître · 🔊 Écouter` | P1 |
| 2 | bouton écouter | rejouer permanent | P1 |
| 3 | répétition | rejouer sans limite | P2 |
| 4 | réponse incorrecte | rejouer avec le feedback | P1 |
| 5 | AUDIO_TO_WORD | 🔊 → choisir le mot | P1 |
| 6 | WORD_TO_AUDIO | mot → valider la prononciation | P1 |
| 7 | review | rejouer en révision espacée | P2 |
| 8 | fiche mot | bouton 🔊 dans /mots/[id] | P1 |
| 9 | contexte ayah | audio du verset (différé) | P3 |

---

## 8. PARTIE H — PLAN D'IMPLÉMENTATION (rien ici)

22C licence/provider → 22D capture audio_url → 22E import word_audio → 22F player →
22G AUDIO_TO_WORD → 22H WORD_TO_AUDIO → 22I review audio → 22J audio ayah.

---

## 9. PARTIE I — ALTERNATIVES À QF

| source | granularité | licence | classification |
|---|---|---|---|
| EveryAyah.com | ayah | non documentée | REVIEW_REQUIRED |
| QuranicAudio.com | ayah | non documentée | REVIEW_REQUIRED |
| AlQuran.cloud | ayah+audio | fair use + attribution Tanzil | REVIEW_REQUIRED |
| King Fahd Complex | texte+audio | enregistrements à vérifier | REVIEW_REQUIRED |
| WBW mot-à-mot hors QF | mot | aucune trouvée | **BLOCKED** |

**Conclusion** : aucune alternative WBW avec licence commerciale documentée.
Négocier QF (canal WBW) plutôt que changer de source.

---

## 10. NON-RÉGRESSION

| commande | résultat |
|---|---|
| `npm test` | 221/221 ✅ |
| `npx tsc --noEmit` | 0 ✅ |
| `npm run lint` | 0 ✅ |
| `npm run build` | 0 ✅ |
| `npm run verify:persistence` | 13/13 ✅ |
| `npm run verify:rls` | 33/33 ✅ |

Aucune écriture (compteurs identiques · recitations 14 · ayah_audio 0 · word_audio 0).

---

## 11. LIVRABLES

- 📄 `PHASE_22B_AUDIO_PROVIDER_LICENSING_PREPARATION.md` (ce rapport)
- 📄 `tmp/phase22b-audio-provider-licensing.json` (`AUDIO_PROVIDER_PREPARATION_COMPLETE`)
- 📄 `tmp/phase22b-qf-commercial-license-request.md` (brouillon d'email de licence)

---

**ARRÊT OBLIGATOIRE.** Aucun import audio, aucun changement de schéma/resolver/UI.
Ne pas lancer 22C automatiquement.
