# PHASE 24H-AUDIO-STATUS — Audit du statut « Exercices audio : indisponibles »

**STATUS = `AUDIO_STATUS_AUDIT_COMPLETE`**
**Mode = READ_ONLY** — aucune modification de code, de DB, de Storage, de curriculum, de scoring, de mastery, de SRS ou d'UI.

---

## 1. Cause racine exacte

Les `word_audio` **existent** (DB + Storage), mais la **signature des URLs échoue sous le rôle ANON** : le bucket **privé** `word-audio` ne possède **aucune policy Storage RLS** (aucune règle `storage.objects` / `storage.buckets` dans `supabase/migrations/`).

Conséquence en cascade :

```
word_audio (DB)          → 4/4 présents
Storage muallim/*.opus   → 4/4 objets présents
createSignedUrl (service) → OK (4/4)
createSignedUrl (ANON)    → "Object not found" (Storage masque les objets privés)
        ↓
getWordAudioUrls()        → map VIDE (échec avalé silencieusement)
        ↓
audioCount === 0          → badge « Exercices audio : indisponibles pour l'instant »
        ↓
audioUrl = null           → AUDIO_TO_WORD / WORD_TO_AUDIO non générés
```

**La Phase 24F était correcte côté UI** (AudioPlayer intégré, pas d'autoplay, coordination d'un seul audio actif) — mais elle s'appuyait sur un batch d'URL signées qui, en réalité, **échoue en amont** sous le rôle utilisé par la page (`NEXT_PUBLIC_SUPABASE_ANON_KEY`).

## 2. Fichier / fonction responsable

| Couche | Fichier | Rôle |
|---|---|---|
| Signature des URLs | `lib/learning/queries.ts` → `getWordAudioUrls()` (lignes ~207–232) | Signe `word_audio.audio_url` via `client.storage.from(WORD_AUDIO_BUCKET).createSignedUrl(...)` |
| Client fourni | `lib/supabase/server.ts` → `createServerClient` | Client **ANON** (clé publique) en SSR |
| Calcul du statut UI | `app/(app)/learn/[slug]/page.tsx` (lignes ~59–60, 144–147) | `audioCount = audioByWord.size` ; affiche le badge si `=== 0` |
| Données audio | `supabase/migrations/0009_audio.sql` | `public.word_audio` (`word_audio_read` for select using true) — mais **aucune policy Storage** |
| Bucket | `word-audio` | **Privé**, aucun `storage.objects` policy pour anon/authenticated |

## 3. Condition qui déclenche « indisponible »

`app/(app)/learn/[slug]/page.tsx:144` :

```tsx
{audioCount === 0 ? (
  ...
  Exercices audio : indisponibles pour l&apos;instant
```

`audioCount === 0` est vrai car `getWordAudioUrls` renvoie une `Map` vide : dans la fonction, chaque échec de signature est avalé (`if (signError || !signed?.signedUrl) return;` + `catch {}`), donc un mot dont l'objet Storage existe mais dont la signature échoue est **silencieusement absent** du résultat — sans distinction entre « pas d'audio » et « audio illisible ».

## 4. État réel des 4 audios de la Basmala

| word_id | forme | word_audio DB | objet Storage | signed (service) | signed (ANON) |
|---|---|---|---|---|---|
| `aa04696e…` | بِسْمِ | ✓ | ✓ | ✓ | ✗ « Object not found » |
| `d1ec7d7e…` | ٱللَّهِ | ✓ | ✓ | ✓ | ✗ « Object not found » |
| `b44598b1…` | ٱلرَّحْمَـٰنِ | ✓ | ✓ | ✓ | ✗ « Object not found » |
| `0748ad37…` | ٱلرَّحِيمِ | ✓ | ✓ | ✓ | ✗ « Object not found » |

- Chemin : `muallim/{word_id}.opus`
- `recitation_id` : `e0290e00-ce5b-4f2d-aace-e1fad6cb1ace` (Muallim)
- `duration` : `NULL` (métadonnée non renseignée, sans incidence sur ce bug)
- Bucket `word-audio` : **existant**, 4/4 objets présents.

## 5. AUDIO_TO_WORD — **BLOCKED**

Le générateur (`lib/exercises/generators/audio.ts`) est correct, mais il reçoit `audioUrl = null` (car `getWordAudioUrls` renvoie une map vide sous ANON) → l'exercice n'est pas généré. **Ce n'est pas un bug de générateur, c'est un bug d'URL en amont.**

## 6. WORD_TO_AUDIO — **BLOCKED**

Même cause que ci-dessus.

## 7. AudioPlayer — **AVAILABLE**

Le composant (`components/ui/audio-player.tsx`, Phase 24F) est correct et prêt, mais **ne reçoit jamais d'URL en production** (map vide). Le problème est strictement en amont de l'UI.

## 8. Différence entre « audio disponible » et « exercice audio disponible »

- **AUDIO DISPONIBLE** (données) : `word_audio` DB + objet Storage présents → **OUI, 4/4** (et 21 295 au global).
- **EXERCICE AUDIO DISPONIBLE** : nécessite une **URL signée générée sous le rôle ANON** → **NON** (0/4).

La logique actuelle confond implicitement ces deux notions : elle traite « échec de signature » comme « pas d'audio », sans canal d'erreur distinct.

## 9. Impact sur les autres leçons

**Global — 8/8 leçons Al-Fatiha affectées :**

| Leçon | mots | audio_db | signed ANON | statut UI |
|---|---|---|---|---|
| basmala | 4 | 4 | 0 | AUDIO_INDISPONIBLE |
| al-hamd | 8 | 8 | 0 | AUDIO_INDISPONIBLE |
| ar-rahman | 6 | 6 | 0 | AUDIO_INDISPONIBLE |
| malik-yawm-ad-din | 7 | 7 | 0 | AUDIO_INDISPONIBLE |
| iyyaka-nabudu | 8 | 8 | 0 | AUDIO_INDISPONIBLE |
| ihdina-sirat | 7 | 7 | 0 | AUDIO_INDISPONIBLE |
| sirat-alladhina | 8 | 8 | 0 | AUDIO_INDISPONIBLE |
| wa-la-d-dallin | 8 | 8 | 0 | AUDIO_INDISPONIBLE |

Le problème est **systémique**, pas spécifique à la Basmala.

## 10. Correction recommandée

Ajouter une **policy Storage RLS** (migration SQL) sur `storage.objects` pour le bucket `word-audio`, autorisant `anon` (et `authenticated`) en **SELECT** — afin que `createSignedUrl` fonctionne sous ANON. Exemple conceptuel :

```sql
create policy "word_audio_storage_read"
on storage.objects for select
using (bucket_id = 'word-audio');
```

Alternative : générer les URLs signées avec le **service role** (contournement, à privilégier uniquement si l'on veut garder le bucket strictement privé). **Ne PAS rendre le bucket public** sans décision explicite du propriétaire.

## 11. Risque de la correction

**Faible à moyen.** Il s'agit d'autoriser la **lecture** d'un bucket de référence audio (aucune donnée utilisateur). L'exposition doit être **limitée à ce bucket précis** (`bucket_id = 'word-audio'`), jamais étendue à d'autres buckets. Une policy mal écrite (sans filtre `bucket_id`) ouvrirait tout le Storage — c'est le point de vigilance principal.

## 12. Phase suivante recommandée

**Phase corrective dédiée** : « Storage policy `word-audio` » (migration SQL + vérification de la génération des URLs ANON + revalidation du badge et des exercices AUDIO_TO_WORD / WORD_TO_AUDIO). **Aucun correctif appliqué dans cet audit** — attente d'approbation explicite.

---

## Non-régression & baseline (inchangées)

- Tests : **328/328** · `tsc` 0 erreur · lint clean · build OK
- Compteurs : `quran_words` 21 296 · `word_occurrences` 77 430 · `word_audio` 21 295 · `ayah_audio` 0 · `lemmas` 32 · `word_translations FR` 25 · `word_lemma_mapping` 183
- **0 migration, 0 écriture DB/Storage, 0 modification de code.**

## Livrables

- `PHASE_24H_AUDIO_STATUS_AUDIT.md` (ce rapport)
- `tmp/phase24h-audio-status-audit.json`
- `tmp/phase24h-audio-lesson-matrix.json`
- `tmp/phase24h-audio-basmala-evidence.json`
- Scripts d'audit read-only : `tmp/phase24h-audio-status-audit.ts`, `tmp/phase24h-audio-lesson-matrix.ts`
