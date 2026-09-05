# OPENREEL_INTEGRATION_MAP — Cartographie complète OpenReel → Hikma

Source audité : https://github.com/Augani/openreel-video (clone local `/tmp/openreel-audit`, MIT — Augustus Otu, 2024-2026).
Le rendu final Hikma reste **Remotion** : OpenReel n'est utilisé que pour la logique d'édition, jamais pour le rendu.

## 1. Table complète

| OpenReel (fichier réel) | Fonction | Réutilisable ? | Adaptation | Destination Hikma | Statut |
| --- | --- | --- | --- | --- | --- |
| `packages/core/src/animation/easing-functions.ts` | 50+ easings, cubic-bezier, spring, `interpolate` | **A — directe** (zéro import, pur) | aucune (types conservés) | `lib/content-studio/editor/easing.ts` | ✅ porté |
| `packages/core/src/video/keyframe-engine.ts` (`getValueAtTime`, `interpolateValue`) | évaluation de keyframes à un instant (clamp, segment, easing, interpolation num/objet) | **B — adapter** | dépend `Keyframe` OpenReel + `AnimationEngine` → pur, frames Hikma | `lib/content-studio/editor/keyframes.ts` | ✅ porté |
| `packages/core/src/animation/evaluate-keyframes.ts` | `evaluateKeyframesAt` → Map property→valeur | **B — adapter** | idem | `lib/content-studio/editor/keyframes.ts` | ✅ porté |
| `packages/core/src/timeline/track-manager.ts` | rangs/pistes des items | **A** | secondes → frames, `VideoScene` | `lib/content-studio/editor/timeline-multi.ts` | ✅ porté (étape 1) |
| `apps/web/src/utils/timeline-item-actions.ts` | selection, marquee, splittable, selection par piste | **A/B** | frames + lanes audio | `lib/content-studio/editor/timeline-multi.ts` | ✅ porté (étape 1) |
| `packages/core/src/timeline/clip-manager.ts` | overlap, gap, split/trim helpers | **A** | frames | `lib/content-studio/editor/timeline-multi.ts` | ✅ porté (étape 1) |
| `packages/core/src/audio/clip-audio-resolution.ts` | résolution source audio d'un clip | **B** | garantie récitation continue | `lib/content-studio/audio/links.ts` | ✅ porté (étape 1) |
| `packages/core/src/animation/clip-fade-envelope.ts` | enveloppe de fade | **A** | frames + offset | `lib/content-studio/audio/fade-envelope.ts` | ✅ porté (étape 1) |
| `packages/core/src/actions/action-history.ts` | historique undo/redo (entries, groupes, snapshots) | **C — inspiration** | modèle d'action OpenReel (`clip/move`…) | — | à comparer avec l'undo/redo Hikma existant |
| `packages/core/src/actions/action-executor.ts` + `inverse-action-generator.ts` | exécution + génération inverse (undo multi-actions) | **C** | store OpenReel | — | phase ultérieure |
| `packages/core/src/audio-text-sync-engine/` | sync texte↔audio | **C** | exige de vrais timestamps | Golden Follower (inspiration) | documenté, non intégré |
| `packages/core/src/subtitle-engine.ts` | timings par mot / sous-titres | **C** | idem | — | documenté, non intégré |
| `packages/core/src/animation/beat-sync.ts` | beat-sync musical | **D** | musical, pas coranique | — | ❌ |
| `packages/core/src/video/keyframe-engine.ts` (le reste) | CRUD keyframes, clipboard, motion paths | **C** | état + UI OpenReel | — | inspiration |
| UI timeline React `apps/web/src/components/` | ruler, playhead, drag, trim handles | **C** | couplée au store OpenReel | timeline Hikma existante (`timeline-ops.ts`, `timeline-multi.ts`) | inspiration uniquement |
| Renderer OpenReel `packages/renderer` | rendu vidéo | **D** | — | Remotion (officiel) | ❌ |

## 2. Fichiers OpenReel réutilisables (priorité)

1. `animation/easing-functions.ts` — ✅ porté tel quel (pur).
2. `video/keyframe-engine.ts` (logique `getValueAtTime`/`interpolateValue`) — ✅ porté en pur.
3. `animation/evaluate-keyframes.ts` — ✅ porté.
4. `timeline/track-manager.ts`, `timeline/clip-manager.ts`, `utils/timeline-item-actions.ts` — ✅ portés (étape 1).
5. `audio/clip-audio-resolution.ts`, `animation/clip-fade-envelope.ts` — ✅ portés (étape 1).
6. `actions/action-history.ts` + `action-executor.ts` — candidat **C** (phase 7 : shortcuts/history), après comparaison avec l'undo/redo Hikma.

## 3. Fichiers déjà portés dans Hikma

- `lib/content-studio/editor/timeline-multi.ts` (selection, marquee, overlap/gap, splittable, pistes)
- `lib/content-studio/audio/links.ts` (récitation continue, jamais par mot)
- `lib/content-studio/audio/fade-envelope.ts` (fades)
- `lib/content-studio/editor/easing.ts` (nouveau — ce cycle)
- `lib/content-studio/editor/keyframes.ts` (nouveau — ce cycle)

## 4. Fonctionnalités encore manquantes

- Keyframes **branchées** à l'UI inspector + au rendu Remotion (moteur porté, UI à faire).
- Waveform (serveur/pré-calculé — CORS CDN bloqué côté navigateur).
- Historique undo/redo multi-actions groupé (comparer avec l'existant).
- Marquee/multi-sélection branchée dans la timeline UI.
- Pistes lock/mute/solo affinées côté UI (logique présente dans `timeline-ops.ts`).

## 5. Dépendances nécessaires

- Aucune nouvelle dépendance npm : tout ce qui a été porté est du TypeScript pur, testé avec Vitest existant.

## 6. Incompatibilités

- Modèle de données : OpenReel = secondes + `TrackItem` ; Hikma = **frames** + `VideoScene[]` → tout est converti à la frontière (adapter).
- Store/état : OpenReel est piloté par son propre store et actions typées ; Hikma garde `editor_state` JSONB + fonctions pures.
- Récitation coranique : le sync générique OpenReel (beat/music) ne convient pas ; le contrat Hikma « une seule piste continue » prime.

## 7. Risques

- Suivre le dépôt distant OpenReel à la volée (ne pas faire : code figé, porté avec notice).
- Créer une seconde architecture parallèle (ne pas faire : tout passe par l'adapter frames).
- Brancher le sync mots sans vrais timestamps (ne pas faire : follower déterministe sur durée réelle).

## 8. Stratégie d'intégration progressive

1. ✅ Helpers timeline purs (selection/marquee/audio lié/fades) — fait.
2. ✅ Moteur keyframes/easing pur — fait (ce cycle).
3. Brancher keyframes dans l'inspector + adapter Remotion (une propriété à la fois : opacity, scale…).
4. Waveform serveur/pré-calculé (proxy CORS ou décodage serveur).
5. Undo/redo groupé multi-actions.
6. Multi-sélection/marquee dans l'UI timeline.
7. Raccourcis clavier + UX NLE.
8. Audit complet du rendu Remotion.

## Architecture cible

```text
Supabase → Hikma Content Data → Editor → Adapters (purs, portés d'OpenReel) → Remotion → MP4
```
