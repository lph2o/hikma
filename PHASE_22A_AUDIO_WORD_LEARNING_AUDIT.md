# PHASE 22A — AUDIT AUDIO & WORD LEARNING ARCHITECTURE

**STATUS FINAL : `AUDIO_ARCHITECTURE_AUDIT_COMPLETE`**
**DATABASE_WRITES = 0 · IMPORTS = 0 · MIGRATIONS = 0**

> Phase strictement READ_ONLY. Aucune table, migration, import, ni modification
> de code produit. Ce rapport détermine l'architecture **avant** implémentation.

---

## 0. RÉSUMÉ

Hikma possède déjà **l'ossature audio** (3 tables `recitations` / `ayah_audio` /
`word_audio`, migration 0009) mais **aucun fichier audio** n'est importé
(`ayah_audio = 0`, `word_audio = 0`, 14 récitants sans URL).

Le canal le plus directement disponible est l'**audio mot-à-mot (WBW) de
Quran.com**, déjà **capturé** par l'adapteur (`QuranComWord.audio_url`) mais
**jeté** par la normalisation (`normalize.ts` ne porte aucun champ audio).

**Recommandation unique** : mot isolé (WBW) d'abord via les tables 0009
existantes, **après licence commerciale écrite QF** ; audio du verset différé.

---

## 1. AUDIT — SOURCES AUDIO EXISTANTES

| table | lignes | état |
|---|---|---|
| `recitations` | 14 | récitants importés, `audio_url = NULL` |
| `ayah_audio` | 0 | vide |
| `word_audio` | 0 | vide |

**Source** : `Quran.com API v4` (source_id `a4a59a8c…`). L'adapteur
(`lib/quran/adapters/quran-com-adapter.ts`) :
- récupère `audio_url` par mot WBW (`QuranComWord.audio_url`, ex. `wbw/001_001_001.mp3`) ;
- récupère la liste des récitants (`/audio/reciters`) sans URL d'audio de verset.

**Pipeline d'import** (`normalize.ts` + `import-quran.ts`) :
- `NormalizedWord` n'a **aucun** champ audio → l'URL WBW est **perdue** ;
- aucune écriture dans `word_audio` ni `ayah_audio`.

**Consommation** :
- `SupabaseQuranDataProvider.getAudio(ayahId)` → lit `ayah_audio` (retourne `[]`) ;
- `getWordAudioCount` → lit `word_audio` (retourne `0`) ;
- générateurs `audioToWord` / `wordToAudio` → renvoient `null` (audio absent) ;
- UI : badge « Exercices audio : indisponibles pour l'instant » ; **aucun player audio**.

---

## 2. AUDIT — AUDIO AYAH VS AUDIO MOT

| type | disponible ? | source | état |
|---|---|---|---|
| A. Audio complet par ayah | ❌ | récitations (droits par récitant) | non importé |
| B. Audio isolé par mot (WBW) | ❌ (mais capturé puis jeté) | Quran.com WBW | **le plus direct** |
| C. Les deux | ❌ | — | aucun |

- L'audio **par mot** existe nativement dans les données brutes (WBW) : il suffit
  de le **réimporter** (champ déjà présent dans l'adapteur), pas de re-fetch.
- Une **segmentation temporelle** d'une récitation (coupe verset→mot) n'est **pas
  nécessaire** : le WBW mot isolé existe déjà.
- L'audio **par ayah** exige un endpoint récitation dédié (non branché) + droits
  individuels des récitants.

---

## 3. AUDIT — PARCOURS D'APPRENTISSAGE (surfaces)

| surface | arabe | translit. | FR | EN | audio |
|---|---|---|---|---|---|
| Leçon (contexte ayah) | ✅ | ❌ | ✅ | ❌ | ❌ |
| Exercice (LessonPlayer) | ✅ | ✅ | ✅ | partiel (fallback) | ❌ |
| Review | ✅ | ❌ | ✅ | partiel (fallback) | ❌ |
| Fiche mot (`/mots/[id]`) | ✅ | ✅ | ✅ | partiel (fallback) | ❌ |
| Occurrences du mot | ✅ | ❌ | ✅ (contexte) | ❌ | ❌ |

**Audio : ABSENT sur toutes les surfaces.**

---

## 4. AUDIT — MOMENT PÉDAGOGIQUE OPTIMAL

| # | moment | recommandation | priorité |
|---|---|---|---|
| 1 | Première présentation du mot | OUI (reconnaissance phonologique) | P1 |
| 2 | Après la traduction | OUI (renfort audio-visuel) | P2 |
| 3 | Avant l'exercice | OUI (amorçage) | P2 |
| 4 | Pendant la reconnaissance | OUI (= exercice `AUDIO_TO_WORD`) | P1 |
| 5 | Après réponse incorrecte | OUI (correction auditive) | P1 |
| 6 | Pendant la révision | OUI (re-exposition) | P2 |
| 7 | Fiche détaillée du mot | OUI (bouton rejouer) | P1 |
| 8 | Contexte de l'ayah | OUI (récitation), différé | P3 |

---

## 5. AUDIT — ARCHITECTURE RECOMMANDÉE

```
mot
 ├─ texte arabe (quran_words.arabic)
 ├─ translittération (quran_words.transliteration)
 ├─ glose française (lemma_translations, via resolver)
 ├─ audio mot  → word_audio.word_id → audio_url   (à importer, WBW dédupliqué par forme)
 └─ contexte ayah
      ├─ texte du verset (ayahs.text_uthmani)
      └─ audio ayah → ayah_audio.ayah_id → audio_url (différé)
```

- **DB** : réutiliser `word_audio` + `ayah_audio` (0009). **Aucune table/migration
  nouvelle.**
- **Rattachement mot** : à `quran_words` via `word_audio.word_id`. Le WBW est
  par occurrence, mais la prononciation isolée est identique par forme → **1 URL
  par forme** (dédupliquée depuis la 1ʳᵉ occurrence).
- **Rattachement ayah** : à `ayahs` via `ayah_audio.ayah_id`, jointe à `recitations`.
- **Frontend** : un composant player unique (`<audio>` HTML5 + bouton) branché sur
  `word_audio` / `ayah_audio`, exposé dans ExerciseCard, review, fiche mot, contexte.
- **Stockage** : streaming CDN du fournisseur (aucun stockage local tant que la
  licence n'autorise pas le cache > 1 semaine) ; après licence, Supabase Storage possible.
- **Aucune duplication** de données lexicales : l'audio est un lien séparé.

**Options comparées** : rattacher l'audio à `word_occurrences` (per-occurrence)
dupliquerait ~77 430 fichiers pour un contenu prononcé identique par forme ;
rattacher à une table dédiée est déjà fait (`word_audio`) ; la relation
`audio_source + word_audio` est déjà modélisée (`source_id`, `recitation_id`).

---

## 6. AUDIT — PERFORMANCE

- **N+1** : déjà évité — `getWordAudioCount` est batch (`.in`). Étendre le même
  pattern (un `.in(word_id)` pour N mots).
- **Volume** : 21 296 formes distinctes ≈ **50–100 Mo** (fichiers WBW ~1–5 Ko) ;
  6 236 ayahs × récitants ≈ **100 Ko–1 Mo chacun** → potentiellement plusieurs Go.
  → import **progressif** (formes exposées en leçons d'abord, ~centaines).
- **Cache** : HTTP cache navigateur + CDN. ⚠️ **QF interdit le cache > 1 semaine**
  sans permission → pas de cache local durable sans licence.
- **Offline** : non réalisable sans licence de stockage durable.

---

## 7. AUDIT — LICENCE (preuves)

Source primaire : **Quran Foundation Developer Terms of Service** (MAJ 2026-08-10).

- `QF Content` = « Quran text, translations, metadata, **audio** … » ;
- « Developer **may display** QF Content to end users within the Application … » ;
- « **Any other form of commercial redistribution or use of QF Content or raw API
  data requires a separate written commercial license agreement with QF.** » ;
- « Cache or store QF Content **longer than 1 week** … » (restriction).

| source candidate | granularité | classification |
|---|---|---|
| Quran.com/QF — WBW audio (mot isolé) | mot | **REVIEW_REQUIRED** |
| Quran.com/QF — récitations (ayah) | verset | **REVIEW_REQUIRED** (+ droits récitant) |
| Segmentation temporelle dérivée | mot dérivé | **REVIEW_REQUIRED** (inutile) |

**Aucune source audio n'est `SAFE`** pour un usage commercial SaaS sans licence
écrite. Le streaming in-app (intégral à l'expérience) semble couvert par la clause
d'affichage, mais l'**usage commercial + le stockage durable** restent
`REVIEW_REQUIRED`. (Contraste avec la traduction FR WBW de QUL, classée
`LICENSE_UNKNOWN → STOP_SOURCE` en 16O : l'audio vient de Quran.com/QF, canal distinct.)

---

## 8. RECOMMANDATION FINALE (unique)

1. **Audio ayah** : différé (poids + droits par récitant).
2. **Audio mot** : prioriser le WBW (petit, déjà capturé), après licence.
3. **DB** : tables 0009 existantes, aucune migration.
4. **Frontend** : un player HTML5 unique + bouton rejouer.
5. **Stockage** : streaming CDN d'abord, Supabase Storage après licence.
6. **Cache** : HTTP/CDN, pas de cache durable sans licence.
7. **Moment pédagogique** : 1ʳᵉ présentation + réponse incorrecte + fiche mot (P1).
8. **Ordre d'implémentation** :
   1. obtenir la **licence commerciale écrite QF** (bloquant) ;
   2. capturer `audio_url` dans `normalize.ts` + importer `word_audio` (dédup par forme) ;
   3. composant player + bouton rejouer ;
   4. activer `AUDIO_TO_WORD` / `WORD_TO_AUDIO` (générateurs déjà prêts) ;
   5. audio du verset (`ayah_audio` + récitants) — différé.

**NE RIEN IMPLÉMENTER.**

---

## 9. NON-RÉGRESSION

| commande | résultat |
|---|---|
| `npm test` | 221/221 ✅ |
| `npx tsc --noEmit` | 0 ✅ |
| `npm run lint` | 0 ✅ |
| `npm run build` | 0 ✅ |
| `npm run verify:persistence` | 13/13 ✅ |
| `npm run verify:rls` | 33/33 ✅ |

Aucune écriture : compteurs identiques (… · recitations 14 · ayah_audio 0 · word_audio 0).

---

## 10. LIVRABLES

- 📄 `PHASE_22A_AUDIO_WORD_LEARNING_AUDIT.md` (ce rapport)
- 📄 `tmp/phase22a-audio-word-learning-audit.json` (`AUDIO_ARCHITECTURE_AUDIT_COMPLETE`)

---

**ARRÊT OBLIGATOIRE.** Aucune implémentation après cet audit.
