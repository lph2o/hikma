# OPENREEL_GRAPHICS_AUDIT — Text / Animation / Graphics (source réelle)

Audit du code source réel (clone `/tmp/openreel-audit`), licence MIT (Augustus
Otu, 2024-2026). Complète `OPENREEL_AUDIT.md` sur les modules graphiques.

## 1. Modules audités (fichiers exacts)

### Text (`packages/core/src/text/`)

| Fichier | Rôle | Dépendances | Verdict |
| --- | --- | --- | --- |
| `types.ts` | `TextStyle`, `TextAnimation`, `TextAnimationParams`, `TextAnimationPreset`, `TextClip`, defaults | `types/timeline`, `graphics/types` | **B — adapté** (deps → équivalents Hikma) |
| `text-animation-presets.ts` | 24 presets d'animation unit-level (character/word/line) avec stagger, `UnitAnimationState`, `ANIMATION_MAP`, `TEXT_ANIMATION_PRESETS` | easing-functions uniquement | **A — direct** (pur) |
| `text-animation.ts` | `TextAnimationEngine.getAnimatedState(clip, time)` : keyframes-first, puis in/hold/out par preset, character states | `video/animation-engine` | **B — adapté** (moteur → adapter Hikma) |
| `subtitle-engine.ts` | parse/export SRT, cues par ligne, reflow | pur | **B — adapté** (STEP 4 karaoké) |
| `audio-text-sync-engine.ts`, `speech-to-text-engine.ts`, `transcription-service.ts` | sync texte↔audio, STT | services externes | **C/D** — non pertinents (pas de STT, timestamps à fournir) |
| `caption-animation-renderer.ts`, `character-animator.ts` | rendu canvas des captions | canvas | **C** — inspiration |

### Graphics (`packages/core/src/graphics/`)

| Fichier | Rôle | Verdict |
| --- | --- | --- |
| `graphics-engine.ts` (2087 l.) | engine shape/SVG canvas (rectangle, circle, polygon…) | **C** — rendu canvas, couplé au modèle OpenReel |
| `svg-animation-presets.ts` | presets d'animation SVG (metadata) | **A/B** — pur, STEP 6 |
| `sticker-library.ts` | bibliothèque de stickers | **B** — modèle de catalogue |
| `types.ts` | types graphiques | **B** |

### Motion shapes (`packages/core/src/motion/motion-shape-*`)

`motion-shape-path.ts`, `motion-shape-style.ts`, `motion-shape-modifiers.ts`,
`motion-shape-boolean.ts` (+ tests) — modèle de formes géométriques (path,
style, boolean ops). **B** — STEP 5 (shapes), pur et testé en amont.

### Types partagés

- `types/timeline.ts` — `Transform` (position **normalisée 0..1**), `Keyframe`,
  `EasingType` → déjà portés (TextTransform, HikmaKeyframe, EasingName).
- `types/shape-tools.ts` — types des shape tools.

## 2. Cartographie (résumé)

| Fonctionnalité | Fichier OpenReel | Classe | Étape Hikma |
| --- | --- | --- | --- |
| Text engine + styling | `text/types.ts` + `text/text-animation.ts` | B | **STEP 2 ✅** |
| Text animations (24 presets) | `text/text-animation-presets.ts` | A | **STEP 3 ✅ (moteur porté)** |
| Keyframes/easing | `animation/*`, `video/keyframe-engine.ts` | A/B | ✅ déjà portés |
| Karaoké / SRT | `text/subtitle-engine.ts` | B | STEP 4 |
| Shapes | `motion/motion-shape-*` | B | STEP 5 |
| SVG | `graphics/svg-animation-presets.ts` | B | STEP 6 |
| Stickers | `graphics/sticker-library.ts` | B | STEP 7 |
| Backgrounds | (solid/gradient dans graphics-engine) | C | STEP 8 |
| Rendu canvas captions | `caption-animation-renderer.ts` | C/D | non repris (Remotion rend) |

## 3. Points critiques Hikma

- **Texte arabe** : le moteur porté décrit le style/transform (normalisé 0..1) ;
  le RENDU reste celui de Hikma (shaping arabe, harakāt, Amiri). Jamais de
  canvas/3D pour le texte coranique.
- **Déterminisme** : `getAnimatedState(clip, time)` est une fonction pure du
  frame — aucun timer, aucun `Date.now()`, aucune dépendance au rafraîchissement.
- **PREVIEW == RENDER** : même fonction alimente Player et `renderMedia()`.
- **Audio** : les éléments texte sont purement visuels — la récitation reste
  une piste continue.

## 4. Risques

- `graphics-engine.ts` (2087 l.) est couplé au rendu canvas OpenReel → ne pas
  le porter tel quel ; ne garder que les calculs purs (STEP 5/6).
- `subtitle-engine.ts` exige des timestamps de mots réels pour le karaoké ;
  pour la récitation coranique, le follower reste déterministe sur la durée
  réelle (pas de timestamps inventés).
- La normalisation 0..1 des transforms diffère du layout px des scènes Hikma →
  adapter à la frontière (documenté dans la MAP).
