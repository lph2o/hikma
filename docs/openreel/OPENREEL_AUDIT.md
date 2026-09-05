# OPENREEL_AUDIT — Audit du code source OpenReel

Audit réalisé sur le code source réel (clone shallow), pas sur le README.

- Source : https://github.com/Augani/openreel-video
- Commit audité : HEAD du clone `--depth 1` (réf. `/tmp/openreel-audit`)
- Licence : **MIT** (Copyright 2024-2026 Augustus Otu and Contributors)

## 1. Architecture générale

Monorepo pnpm avec :

| Dossier | Rôle |
| --- | --- |
| `packages/core` | Moteur (pur, framework-agnostic) : timeline, clips, keyframes, audio, media |
| `packages/sdk` | API publique haut niveau par-dessus le core |
| `apps/web` | App de démo/studio (timeline React complète) |
| `apps/studio` | Variante studio |
| `apps/docs` | Documentation |

Le **core** est découplé de l'UI : toute la logique de manipulation (trim, split,
snap, ripple, selection) est en fonctions pures, ce qui la rend portable.

## 2. Fonctionnalités découvertes (fichiers exacts)

### Timeline / clips
- `packages/core/src/timeline/clip-manager.ts` — `clipsOverlap`, `getGapBetweenClips`, split/trim helpers
- `packages/core/src/timeline/track-manager.ts` — rang/piste des items (`getTimelineItemRanges`)
- `apps/web/src/utils/timeline-item-actions.ts` — sélection multiple, marquee (`getTimelineMarqueeSelection`), splittable ids, sélection par piste
- UI timeline complète dans `apps/web/src/components/` (ruler, playhead, drag, trim handles)

### Audio
- `packages/core/src/audio/clip-audio-resolution.ts` — résolution de la **source audio** d'un clip (durée source, URL)
- `packages/core/src/audio/` — gestion des clips audio (volume, fade, mute)
- `packages/core/src/animation/clip-fade-envelope.ts` — **enveloppe de fade** (points temporels + valeurs)
- Pas de composant waveform React sous `apps/web` : le waveform est référencé conceptuellement, pas implémenté en composant réutilisable.

### Animation / keyframes
- `packages/core/src/animation/evaluate-keyframes.ts` — évaluation déterministe des keyframes à un instant donné
- `packages/core/src/animation/` — easing, interpolation
- `packages/core/src/animation/beat-sync.ts` — sync musicale (battements), peu pertinent pour la récitation coranique

### Sync mots / karaoké
- `packages/core/src/audio-text-sync-engine/` — moteur de sync texte↔audio
- `packages/core/src/subtitle-engine.ts` — timings par mot / sous-titres
- Pertinent pour le **Golden Recitation Follower**, mais basé sur des **timestamps fournis** (pas de génération de timestamps depuis l'audio)

## 3. Licence

MIT — réutilisable avec conservation de la notice. Voir `docs/openreel/NOTICE.md`.

## 4. Compatibilité Hikma — verdict

| Point | Analyse |
| --- | --- |
| Modèle de données | OpenReel = secondes + `TrackItem` ; Hikma = frames + `VideoScene[]` → **adapter obligatoire** |
| Renderer | OpenReel a son propre pipeline de rendu → **non utilisé** : Remotion reste le renderer Hikma |
| UI | `apps/web` est couplée à son propre store → **inspiration uniquement** |
| Logique pure | clip/track manager, selection, fade envelope → **portables** (adaptés dans cette phase) |
| Keyframes | évaluateur pur portable (étape ultérieure) |
| Sync audio | conceptuellement utile, mais exige des timestamps réels que nous n'avons pas pour l'audio coranique → à ne pas forcer |

## 5. Risques

- OpenReel est un projet récent et en évolution : ne pas « suivre » le dépôt à distance (pas de mise à jour automatique).
- Le portage doit rester sur le modèle Hikma (frames) pour ne pas créer de seconde architecture parallèle.
- Ne jamais remplacer la garantie « une seule piste de récitation continue » par un système de sync par mot sans vrais timestamps.
