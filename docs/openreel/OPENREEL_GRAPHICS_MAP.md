# OPENREEL_GRAPHICS_MAP — Cartographie graphique OpenReel → Hikma

| OpenReel (fichier réel) | Fonction | Classe | Adaptation Hikma | Destination | Statut |
| --- | --- | --- | --- | --- | --- |
| `text/types.ts` | TextStyle, TextAnimation, params, presets, defaults | **B — adapté** | deps `types/timeline`/`graphics` → `TextTransform`, `HikmaKeyframe`, `EasingName` | `lib/content-studio/graphics/text-types.ts` | ✅ porté |
| `text/text-animation-presets.ts` | 24 presets unit-level + stagger | **A — direct** | imports → easing Hikma porté | `lib/content-studio/graphics/text-animation-presets.ts` | ✅ porté |
| `text/text-animation.ts` | getAnimatedState (keyframes-first, in/hold/out) | **B — adapté** | `AnimationEngine` → adapter `animation-engine.ts` (nos ports) | `lib/content-studio/graphics/text-animation.ts` | ✅ porté |
| `video/animation-engine.ts` | applyEasing, getValueAtTime | **B — adapté** | ré-implémenté via easing.ts + keyframes.ts (mêmes sémantiques) | `lib/content-studio/graphics/animation-engine.ts` | ✅ porté |
| `text/subtitle-engine.ts` | parse/export SRT, cues, reflow | **B** | pure, frames | STEP 4 karaoké | ⏳ |
| `motion/motion-shape-*` | path/style/modifiers/boolean des formes | **B** | pur, testé en amont | STEP 5 shapes | ⏳ |
| `graphics/svg-animation-presets.ts` | presets animation SVG | **B** | pure | STEP 6 SVG | ⏳ |
| `graphics/sticker-library.ts` | catalogue stickers | **B** | modèle | STEP 7 stickers | ⏳ |
| `graphics/graphics-engine.ts` | rendu canvas shapes/SVG | **C** | trop couplé au canvas OpenReel | STEP 8 backgrounds (calculs purs seulement) | ⏳ |
| `caption-animation-renderer.ts` | rendu canvas captions | **C/D** | Remotion rend à la place | — | ❌ |
| `audio-text-sync-engine.ts`, STT, transcription | sync/STT | **C/D** | exige timestamps réels / services externes | — | ❌ |
| `types/shape-tools.ts` | types shapes | **B** | — | STEP 5 | ⏳ |

## Légende

- **A = direct** : port quasi verbatim (pur, zéro dépendance OpenReel restante).
- **B = adapté** : logique conservée, dépendances remplacées par les équivalents Hikma.
- **C = inspiration** : architecture utile mais trop couplée (canvas, store).
- **D = non réutilisable** : STT, sync sans timestamps, rendu canvas concurrent de Remotion.

## Règles de port

1. Le rendu final est **toujours Remotion** — aucun port de rendu canvas OpenReel.
2. Le **texte coranique** garde le renderer arabe Hikma (shaping/harakāt) — le
   moteur porté ne décrit que style/transform/animation.
3. Toutes les valeurs d'animation sont **déterministes** (fonctions du frame).
4. Chaque fichier porté conserve la notice MIT (voir `NOTICE.md`).
