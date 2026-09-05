# OPENREEL_FULL_INTEGRATION_AUDIT — Audit consolidé (STEP 0)

État réel de l'intégration OpenReel (MIT) dans Hikma Content Studio, à partir du
code source réel (clone `/tmp/openreel-audit`) — pas du README.

## 1. Réutilisé (code porté, traçable)

| Module Hikma | Source OpenReel | Classe | Statut |
| --- | --- | --- | --- |
| `editor/easing.ts` | `animation/easing-functions.ts` | A | ✅ |
| `editor/keyframes.ts` | `video/keyframe-engine.ts` + `animation/evaluate-keyframes.ts` + `types/timeline.ts` | B | ✅ |
| `editor/timeline-multi.ts` | `apps/web/src/utils/timeline-item-actions.ts` + `timeline/clip-manager.ts` + `timeline/track-manager.ts` | A/B | ✅ |
| `audio/links.ts` | `audio/clip-audio-resolution.ts` | B | ✅ |
| `audio/fade-envelope.ts` | `animation/clip-fade-envelope.ts` | A | ✅ |
| `graphics/text-types.ts` | `text/types.ts` | B | ✅ |
| `graphics/text-animation-presets.ts` | `text/text-animation-presets.ts` | A | ✅ |
| `graphics/text-animation.ts` | `text/text-animation.ts` | B | ✅ |
| `graphics/animation-engine.ts` | adapter (remplace `video/animation-engine.ts`) | B | ✅ |
| `graphics/subtitle-engine.ts` | `text/subtitle-engine.ts` (fonctions pures) | B | ✅ |

Tests associés : `openreel-adapted` (15), `openreel-keyframes` (26),
`openreel-text-engine` (15), `openreel-subtitle-engine` (16).

## 2. Inspiré (architecture, non copié)

- `actions/action-history.ts` + `action-executor.ts` → undo/redo groupé (STEP 8+) ;
- `audio-text-sync-engine.ts` / `subtitle-engine` (classe `SubtitleEngine`,
  couplée au modèle Timeline) → karaoké Hikma (`WordTiming`/`VerseWordTiming`) ;
- `motion/motion-shape-*` → shapes (STEP 3) ;
- `graphics/svg-animation-presets.ts` → SVG (STEP 4) ;
- `graphics/sticker-library.ts` → stickers (STEP 5) ;
- `graphics/graphics-engine.ts` → backgrounds (STEP 6, calculs purs seulement) ;
- `title-engine.ts` → rendu titre (le RENDU reste Remotion/Hikma).

## 3. Non réutilisable (documenté)

- **STT / transcription / speech-to-text** : services externes, hors périmètre.
- **Sync mots sans timestamps réels** : le Golden Follower reste déterministe sur
  la durée réelle de la récitation (pas de timestamps inventés).
- **Rendu canvas captions** (`caption-animation-renderer.ts`) : Remotion rend à la
  place (PREVIEW == RENDER, pas de second rendu).
- **`graphics-engine.ts` (2087 l.)** : couplé au canvas OpenReel — seuls les
  calculs purs seront repris.
- **UI timeline React OpenReel** : couplée au store OpenReel — la timeline Hikma
  existe et est étendue.
- **Renderer OpenReel** : Remotion reste le renderer officiel.

## 4. Points critiques — garanties maintenues

1. **Récitation continue** : UNE source audio de verset, jamais fragmentée
   (`audio/links.ts` + contract `resolveContinuousVerseAudio`) ;
2. **Durée réelle** : scène Coran = durée réelle de l'audio (parseurs MP3/Ogg
   exacts, `lib/content-studio/audio.ts`) — le follower ne termine jamais avant
   la récitation ;
3. **Texte coranique** : renderer arabe Hikma inchangé (shaping, harakāt, RTL) ;
   le moteur texte porté ne décrit que style/transform/animation ;
4. **PREVIEW == RENDER** : tous les moteurs portés sont des fonctions pures du
   frame (`getAnimatedState(clip, time)`, `evaluateKeyframesAt(keyframes, time)`,
   `parseSRT`) — aucun timer, aucun `Date.now()` ;
5. **Rendu explicite uniquement** : le bouton « Rendre MP4 » reste le seul
   déclencheur (aucun rendu automatique) ;
6. **DB read-only** : 0 écriture, 0 migration, Quran/translations inchangées.

## 5. 3D (audit Three.js — verdict séparé)

`docs/threejs/THREEJS_AUDIT.md` : Three.js/R3F **RECOMMENDED** comme couche
optionnelle DANS Remotion (`@remotion/three`, `gl: "angle"`), frame-deterministic,
texte arabe en overlay 2.5D (jamais de Text3D arabe). Installation et prototype
`GoldenWord3DScene` à valider avant (STEP 9).

## 6. Étapes restantes (ordre mission)

| STEP | Contenu | Statut |
| --- | --- | --- |
| 0 | Audit complet | ✅ ce document |
| 1 | Text (TextClip/TextStyle/presets/engine/Inspector) | ✅ moteur + tests ; ⏳ Inspector |
| 2 | Karaoké (SRT, WordTiming, Follower, durée audio) | ✅ SRT + frames ; ⏳ branchement Follower |
| 3 | Shapes (motion-shape-*) | ⏳ |
| 4 | SVG (import, sanitizer, tint) | ⏳ |
| 5 | Stickers/emoji | ⏳ |
| 6 | Backgrounds (solid/gradient/mesh/pattern) | ⏳ |
| 7 | Keyframes branchés (Text/Shape/SVG/Sticker/Background) | ⏳ |
| 8 | Timeline (multi-selection, graphics clips, indicateurs) | ⏳ |
| 9 | Three.js (`remotion/scenes/three/`) | ⏳ (deps à valider) |
| 10 | Inspector 3D | ⏳ |
| 11 | Intégration finale + validation complète | ⏳ |

## 7. Fichiers OpenReel utilisés (notice)

Liste exhaustive maintenue dans `docs/openreel/NOTICE.md` (10 fichiers portés,
tous MIT, attribution conservée).
