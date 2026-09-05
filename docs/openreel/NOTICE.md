# NOTICE — OpenReel (MIT) code reuse in Hikma

Portions of the Hikma Content Studio timeline/audio tooling were adapted from
[**OpenReel**](https://github.com/Augani/openreel-video), an open-source video
editor released under the **MIT License**.

```
MIT License

Copyright (c) 2024-2026 Augustus Otu and Contributors
https://github.com/Augani/openreel-video
```

## Files in this repository that adapt OpenReel code

| Hikma file | OpenReel source (adapted, not copied verbatim) |
| --- | --- |
| `lib/content-studio/editor/timeline-multi.ts` | `apps/web/src/utils/timeline-item-actions.ts` (`getTimelineItemRanges`, `getSplittableTimelineItemIds`, `getTimelineTrackSelection`, `getTimelineMarqueeSelection`) and `packages/core/src/timeline/clip-manager.ts` (`clipsOverlap`, `getGapBetweenClips`) |
| `lib/content-studio/audio/links.ts` | `packages/core/src/audio/clip-audio-resolution.ts` (audio source resolution, linked audio semantics) |
| `lib/content-studio/audio/fade-envelope.ts` | `packages/core/src/animation/clip-fade-envelope.ts` (fade in/out envelope) |
| `lib/content-studio/editor/easing.ts` | `packages/core/src/animation/easing-functions.ts` (easing names, cubic-bezier, spring, interpolate, presets) |
| `lib/content-studio/editor/keyframes.ts` | `packages/core/src/video/keyframe-engine.ts` (`getValueAtTime`, `interpolateValue`), `packages/core/src/animation/evaluate-keyframes.ts` (`evaluateKeyframesAt`), `packages/core/src/types/timeline.ts` (`Keyframe`) |
| `lib/content-studio/graphics/text-types.ts` | `packages/core/src/text/types.ts` (`TextStyle`, `TextAnimation`, `TextAnimationParams`, `TextAnimationPreset`, defaults) |
| `lib/content-studio/graphics/text-animation-presets.ts` | `packages/core/src/text/text-animation-presets.ts` (24 presets d'animation unit-level, `TEXT_ANIMATION_PRESETS`) |
| `lib/content-studio/graphics/text-animation.ts` | `packages/core/src/text/text-animation.ts` (`TextAnimationEngine.getAnimatedState`, keyframe-first, in/hold/out) |
| `lib/content-studio/graphics/animation-engine.ts` | adapter vers nos ports : remplace `packages/core/src/video/animation-engine.ts` (`applyEasing`, `getValueAtTime`) |
| `lib/content-studio/graphics/subtitle-engine.ts` | `packages/core/src/text/subtitle-engine.ts` (fonctions pures : parseSRT/VTT, formatSRTTimestamp, exportSRT, reflow, single-line cues ; la classe `SubtitleEngine` couplée à `Timeline` n'est pas portée) |
| `lib/content-studio/graphics/shape-graphic.ts` | concepts de `packages/core/src/types/shape-tools.ts` (`ShapeTool` : rectangle/ellipse/polygon/star/line, configs) et `packages/core/src/motion/motion-shape-style.ts` (fill/stroke) — types réutilisés, géométrie/rendu SVG Hikma |

## Hikma-native code (aucune copie OpenReel)

Couche d'intégration écrite par Hikma au-dessus des moteurs portés (aucune
attribution OpenReel nécessaire — pas de copie) :

- `lib/content-studio/graphics/graphic-clip.ts` — modèle générique de clip
  graphique (kinds text/shape/svg/sticker/background/three, transform normalisé,
  zIndex, keyframes, sanitization, évaluation pure du frame) ;
- `lib/content-studio/graphics/text-graphic.ts` — `TextGraphicClip` + évaluation
  pure (moteur texte porté = source de vérité, temps local au clip) ;
- `lib/content-studio/graphics/shape-graphic.ts` — `ShapeGraphicClip` (6 formes,
  fill solid/gradient, stroke, géométrie SVG pure évaluée par frame) ;
- `remotion/scenes/GraphicsOverlay.tsx` — rendu Remotion des clips graphiques
  (texte + formes) ; PREVIEW == RENDER par construction ;
- `remotion/bundler-config.ts` — alias `@/` pour le bundle webpack Remotion ;
- `components/content-studio/editor/text-graphics-panel.tsx` — panneaux
  Inspector Texte + Formes (création/édition/suppression dans editor_state).

## Adaptation scope

The OpenReel modules were **ported to the Hikma data model** (frames-based
scenes `durationInFrames`/`starts[]`, `VideoScene`/`VideoContent`, scene-kind
audio lanes `audio-word`/`audio-verse`; keyframe times in frames) and are
pure, deterministic functions. `easing.ts` is a verbatim port of the upstream
pure module; `keyframes.ts` extracts the pure evaluation logic
(`getValueAtTime`, `interpolateValue`, `evaluateKeyframesAt`) from the
stateful OpenReel class, without its clipboard/motion-path state. No OpenReel
UI, renderer, state management, or data model was copied.

See `docs/openreel/OPENREEL_AUDIT.md` and `docs/openreel/WALKTHROUGH.md` for
details on what was reused and how.
