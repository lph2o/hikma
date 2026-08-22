# PHASE 24I-B — CORRECTION SÉCURITÉ + HARNAIS DE VALIDATION NAVIGATEUR

## STATUT

`SECURITY_FIX_COMPLETE_BROWSER_VALIDATION_BLOCKED`

La correction de sécurité est **réalisée et vérifiée** (`.env.example` + scripts).
Le **harnais de validation navigateur est préparé** (plan de test A–H documenté).
La **validation navigateur réelle reste BLOQUÉE** : aucun microphone réel, aucun
serveur applicatif piloté, aucune session Supabase interactive, aucun framework
d'automatisation installé. Aucune validation n'a été simulée.

---

## 1. ÉTAT AVANT

- `.env.example` ligne 18 contenait `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=eyJhxxxxxx`
  (valeur ressemblant à un JWT réel + préfixe public dangereux) et ligne 19
  `SUPABASE_ACCESS_TOKEN=sbp_axxxxxxx` (valeur ressemblant à un PAT réel).
- Deux scripts serveur référençaient la variante dangereuse en repli :
  `scripts/import-huggingface-wbw-audio.ts` et `scripts/seed-word-lemma-mapping.ts`
  (`process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`).
- Le `.env` réel n'était **pas** affecté (utilise `SUPABASE_SERVICE_ROLE_KEY`, non préfixé).
- Le bundle client `.next/static` était déjà propre (aucun service_role, aucun createSignedUrl).

## 2. ARCHITECTURE RETENUE

```
CLIENT (navigateur)
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
        ↓ (lib/supabase/client.ts — anon uniquement)
SERVER (Server Components / Route Handlers / Server Actions)
  NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY (auth)
  SUPABASE_SERVICE_ROLE_KEY (jamais inliné, jamais préfixé NEXT_PUBLIC_)
        ↓ (scripts tsx uniquement : import, seed, migrate, verify)
```

- La clé `service_role` n'est **nécessaire que dans les scripts** d'import/seed/
  migration/vérification (tsx, exécutés en Node côté serveur).
- Elle est **strictement interdite** dans tout module importé par un Client Component
  ou inlinable par Next.js (tout préfixe `NEXT_PUBLIC_`).

## 3. FICHIERS MODIFIÉS

| Fichier | Modification |
|---|---|
| `.env.example` | Suppression de `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=eyJhxxxxxx` ; placeholder sûr `SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key` ; remplacement de `SUPABASE_ACCESS_TOKEN=sbp_axxxxxxx` par `SUPABASE_ACCESS_TOKEN=your_supabase_access_token` |
| `scripts/import-huggingface-wbw-audio.ts` | Suppression du repli `?? process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` |
| `scripts/seed-word-lemma-mapping.ts` | Suppression du repli `?? process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` |

Aucune migration, aucune donnée Quran, aucune compétence, aucun mastery/SRS, aucun
grading, aucun AudioPlayer modifiés.

## 4. FICHIERS CRÉÉS

- `PHASE_24I_B_SECURITY_BROWSER_HARNESS_REPORT.md` (ce rapport)
- `tmp/phase24i-b/` — 14 JSON de validation

## 5. COMPORTEMENT UTILISATEUR

Inchangé. Cette phase est une phase de sécurité + infrastructure, aucun changement
UI/pédagogique.

## 6. GESTION MICROPHONE

Inchangée (Q3-B). Rappel des invariants vérifiés par code + tests :
- capture strictement locale (`getUserMedia` → `MediaRecorder` → Blob mémoire) ;
- `MediaStreamTrack.stop()`, `AudioContext.close()`, `URL.revokeObjectURL()` au reset/unmount ;
- aucun upload, aucun stockage, aucun STT.

## 7. MESURES ACOUSTIQUES

Inchangées (Q3-B, `lib/pronunciation/acoustics.ts`). Descriptives uniquement :
durée, RMS, peak, silence, saturation. Jamais un verdict pédagogique.

## 8. CONFIDENTIALITÉ

- `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` n'est plus référencée nulle part dans le
  code applicatif ni les scripts (grep : 0 occurrence hors `tmp/` historique).
- Le `.env` réel utilise `SUPABASE_SERVICE_ROLE_KEY` (non préfixé) — aucune exposition.
- `.env.example` ne contient plus aucun secret ni valeur ressemblant à un JWT/PAT.

## 9. ABSENCE DE VERDICT AUTOMATIQUE

Le type `PronunciationProductionVerdict = "NO_SIGNAL" | "REVIEW_REQUIRED"` rend
structurellement impossibles `CORRECT` et `INCORRECT`. Test dédié conservé.

## 10. ABSENCE D'IMPACT MASTERY / SRS

`PRONUNCIATION_GUIDED → null` (auto-évaluation non notée) ;
`PHONETIC_DISCRIMINATION → audio_recognition` (compétence existante).
Aucune nouvelle compétence, aucun changement SRS/mastery.

## 11. TESTS

- `npm test` : **397/397**
- `npx tsc --noEmit` : **0 erreur**
- `npm run lint` : **clean**
- `npm run build` : **OK**
- `verify:persistence` / `verify:rls` : non exécutés (nécessitent DB + credentials).

## 12. NAVIGATEUR

`BROWSER_VALIDATION_PENDING` (hérité de Q3-B) — aucune validation réelle n'a été
réalisée ni inventée. Le harnais est décrit dans `tmp/phase24i-b/browser-test-plan.json`
(tests A–H), prêt à être exécuté dès qu'un environnement compatible existe.

## 13. LIMITATIONS

- Pas de microphone réel → tests Q3-B micro non exécutables ici.
- Pas de serveur piloté ni de session Supabase interactive → parcours E2E non exécutables ici.
- `@playwright/test` non installé → harnais préparé mais non exécuté.
- Source maps serveur : les occurrences `service_role` trouvées dans `.next/server`
  sont des commentaires JSDoc du SDK Supabase (aucune clé, aucune variable, aucun `.js`).

## 14. RISQUES FUTURS

- Valider le micro réel (permission, refus, navigation pendant enregistrement,
  absence de fuite/upload) sur un poste équipé.
- Vérifier le parcours E2E complet (leçon → persistence → review) avec une vraie session.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (présent dans le `.env` réel, absent du
  `.env.example`) est une clé publique Supabase Auth — à documenter dans `.env.example`
  lors d'une phase dédiée (non secret, hors périmètre de cette phase).

## 15. DÉCISION DE PHASE SUIVANTE

`SECURITY_FIX_COMPLETE_BROWSER_VALIDATION_BLOCKED`

La prochaine étape de validation réelle reste bloquée par l'environnement. La
prochaine étape pédagogique reste **Q3-C uniquement après validation réelle de Q3-B**
sur un navigateur réel avec microphone. Ne pas démarrer Q3-C, Q4, 24J, 24K, 23G,
ni import phonétique, ni nouvelle compétence, ni nouveau mastery/SRS sans approbation.
