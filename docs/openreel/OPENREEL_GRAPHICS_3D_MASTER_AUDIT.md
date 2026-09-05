# OPENREEL_GRAPHICS_3D_MASTER_AUDIT — Matrice maître (PHASE 0)

Audit read-only. Aucune modification de code. Base : clone OpenReel local
(`/tmp/openreel-audit`, MIT) + modules Hikma déjà portés + `docs/threejs/THREEJS_AUDIT.md`.

## 1. Matrice complète

| FEATURE | OPENREEL SOURCE | HIKMA MODULE | REUSE | POINT D'INTÉGRATION | TEST | STATUT |
| --- | --- | --- | --- | --- | --- | --- |
| **TEXT** | `text/types.ts`, `text/text-animation.ts`, `text/text-animation-presets.ts` | `graphics/text-types.ts`, `graphics/text-animation.ts`, `graphics/text-animation-presets.ts`, `graphics/animation-engine.ts` | DIRECT/ADAPTED | `TextGraphicClip` → scènes Remotion + Inspector (STYLE/ANIMATION) | `openreel-text-engine` (15) | ✅ moteur ; ⏳ éditeur/Inspector |
| **KARAOKE** | `text/subtitle-engine.ts` (pures), `audio-text-sync-engine.ts` (inspiration) | `graphics/subtitle-engine.ts`, `subtitleWordsToFrames` | ADAPTED/INSPIRED | `WordTiming`/`VerseWordTiming` → GoldenRecitationFollower (durée réelle) | `openreel-subtitle-engine` (16) | ✅ SRT ; ⏳ branchement Follower |
| **SHAPES** | `types/shape-tools.ts` (configs), `motion/motion-shape-*` (path/style/boolean) ; `graphics/graphics-engine.ts` (canvas → NON) | — (à créer `graphics/shapes.ts`) | ADAPTED (configs/path) + INSPIRED (rendu → Remotion, pas canvas) | `ShapeClip` + Inspector SHAPE + scènes Remotion | à créer | ⏳ STEP 3 |
| **SVG** | `graphics/svg-animation-presets.ts` (presets) ; **pas de sanitizer** | — (à créer `graphics/svg.ts` + sanitizer) | ADAPTED (presets) + **NOUVEAU** (sanitizer XSS = code Hikma) | `SVGClip` + import sanitizé + tint | à créer | ⏳ STEP 4 |
| **STICKERS** | `graphics/sticker-library.ts` (`EMOJI_CATEGORIES`, `StickerLibrary`) | — (à créer `graphics/stickers.ts`) | ADAPTED (catalogue + catégories) | `StickerClip` + registry Hikma | à créer | ⏳ STEP 5 |
| **BACKGROUNDS** | `graphics/graphics-engine.ts` (calculs purs seulement) | — (à créer `graphics/backgrounds.ts`) | INSPIRED (stops/gradients purs, rendu CSS/Remotion) | `BackgroundClip` + presets Hikma | à créer | ⏳ STEP 6 |
| **KEYFRAMES** | `animation/easing-functions.ts`, `video/keyframe-engine.ts`, `animation/evaluate-keyframes.ts` | `editor/easing.ts`, `editor/keyframes.ts` | DIRECT/ADAPTED | `evaluateKeyframesAt(frame)` → Text/Shape/SVG/Sticker/Background/3D | `openreel-keyframes` (26) | ✅ moteur ; ⏳ branchement |
| **TIMELINE** | `timeline/clip-manager.ts`, `track-manager.ts`, `apps/web/.../timeline-item-actions.ts` | `editor/timeline-ops.ts` (existant), `editor/timeline-multi.ts` | DIRECT/ADAPTED | multi-select/marquee dans l'UI + tracks graphiques (G1/T1/S1) | `openreel-adapted` (15) | ✅ helpers ; ⏳ UI |
| **THREEJS** | (pas de moteur 3D OpenReel — modèle architectural seulement) | — (à créer `remotion/scenes/three/`) | INSPIRED | `@remotion/three` `<ThreeCanvas>` + `useCurrentFrame()` | à créer | ⏳ deps à valider |
| **R3F** | — | — | INSPIRED | v9 (React 19) ; scènes 3D déclaratives | à créer | ⏳ deps à valider |

## 2. Sécurité — SVG

- **Aucun sanitizer SVG dans OpenReel** (les matches « sanitize » sont des
  modules motion, pas de la sécurité XSS) → le sanitizer sera **code Hikma
  nouveau** (déclaré NOUVEAU, pas « réutilisé ») : suppression scripts/événements
  inline/URL dangereuses, allowlist d'éléments SVG.
- Non couvert par la licence OpenReel — aucune attribution OpenReel pour ce fichier.

## 3. Dépendances à ajouter (après validation)

| Paquet | Raison | Licence | Statut |
| --- | --- | --- | --- |
| `three` | moteur 3D | MIT | à valider (import dynamique) |
| `@react-three/fiber@9` | bridge React 19 | MIT | à valider |
| `@remotion/three` | `<ThreeCanvas>` frame-déterministe | MIT (Remotion) | à valider |
| `@types/three` | types | MIT | dev only |
| `@react-three/drei` | Text troika/Float/Sparkles **seulement** | MIT | optionnel, plus tard |

Aucune autre dépendance : tout le reste est TypeScript pur.

## 4. Migrations

**0 migration requise.** Modèle cible : extensions de `VideoScene` /
`editor_state` (JSONB) avec `kind: "graphic"` et un payload graphique typé
(`TextGraphicClip` / `ShapeClip` / `SVGClip` / `StickerClip` / `BackgroundClip`),
rétrocompatibles. Aucune table Supabase nouvelle.

## 5. Fichiers

- **À créer** : `graphics/shapes.ts`, `graphics/svg.ts` (+ sanitizer), `graphics/stickers.ts`, `graphics/backgrounds.ts`, `graphics/graphic-clip.ts` (modèle unifié), `remotion/scenes/three/*`, sections Inspector, tests correspondants.
- **À modifier** : `components/content-studio/video-editor.tsx` (Inspector, timeline tracks, multi-select UI), `lib/content-studio/video/types.ts` (kinds graphiques, additif), `docs/openreel/NOTICE.md` (à chaque port).
- **NE PAS TOUCHER** : `quran_words`, `word_occurrences`, `ayahs`, `translations`, `word_translations`, `lemma_translations`, contrat audio (`audio.ts`, `audio/links.ts`), contrat `resolveContentStudioAudio`, déclencheur rendu (route render), données Supabase.

## 6. Risques

1. **Récitation** : toute intégration graphique ne doit jamais fragmenter l'audio du verset (contrat `resolveContinuousVerseAudio` inchangé).
2. **Durée réelle** : scène Coran = durée réelle de l'audio ; les timings de mots restent bornés (`subtitleWordsToFrames` clamp) — pas de timestamps inventés.
3. **Renderer arabe** : jamais `<Text3D>`/canvas pour le texte coranique — overlay 2.5D ou renderer Hikma.
4. **Déterminisme** : interdiction `Date.now()`/`Math.random()`/horloge réelle dans tout moteur d'animation (ids SRT déjà rendus déterministes).
5. **AUTO_RENDER** : le bouton « Rendre MP4 » reste le seul déclencheur.
6. **Bundle** : three/R3F chargés dynamiquement (scène 3D uniquement) — le shell admin reste léger.
7. **Perf rendu 3D** : WebGL logiciel (SwiftShader) — scènes sobres, temps de rendu à mesurer.

## 7. Verdict

```text
OPENREEL_GRAPHICS_3D_MASTER_AUDIT

TEXT              = PORTED (moteur) / INSPECTOR_PENDING
KARAOKE           = PORTED (SRT) / FOLLOWER_WIRING_PENDING
SHAPES            = NOT_IMPLEMENTED (source audité : motion-shape-* + shape-tools)
SVG               = NOT_IMPLEMENTED (presets audités ; sanitizer = nouveau code Hikma)
STICKERS          = NOT_IMPLEMENTED (source audité : sticker-library)
BACKGROUNDS       = NOT_IMPLEMENTED (source audité : graphics-engine, calculs purs)
KEYFRAMES         = PORTED (easing + evaluateKeyframesAt)
TIMELINE          = PORTED (helpers) / UI_PENDING (multi-select, tracks graphiques)
THREEJS           = AUDITED (verdict RECOMMENDED) / DEPS_NOT_INSTALLED
R3F               = AUDITED (v9 React 19) / DEPS_NOT_INSTALLED

PREVIEW_RENDER_PARITY = GARANTI PAR CONSTRUCTION (mêmes fonctions pures du frame)
QURAN_AUDIO_SAFE      = OUI (contrat récitation continue intact)
QURAN_TEXT_SAFE       = OUI (renderer arabe Hikma conservé)
AUTO_RENDER_SAFE      = OUI (rendu explicite uniquement)

DEPENDENCIES_TO_ADD   = 4 (three, @react-three/fiber@9, @remotion/three, @types/three)
                        + optionnel drei (Text troika/Float/Sparkles)
MIGRATIONS_REQUIRED   = 0
FILES_TO_CREATE       = graphics/{shapes,svg,stickers,backgrounds,graphic-clip}.ts
                        + remotion/scenes/three/* + sanitizer SVG + sections Inspector + tests
FILES_TO_MODIFY       = video-editor.tsx, lib/content-studio/video/types.ts (additif),
                        NOTICE.md (à chaque port)
FILES_NOT_TO_TOUCH    = données Quran/traductions, contrat audio, route de rendu,
                        pipeline MP4, stockage
RISKS                 = 7 (récitation, durée réelle, renderer arabe, déterminisme,
                        auto-render, bundle, perf 3D SwiftShader)
```

## 8. Ordre d'exécution recommandé (après validation)

B (Text Editor + Inspector) → C (Shapes) → D (SVG) → E (Stickers) → F (Backgrounds) →
G (Keyframes branchés) → H (Timeline multi-clips) → I (Karaoke + Follower) →
J/K/L (Three.js, Golden Word 3D, Inspector 3D) → M (Preview/render parity) → N (tests finaux).

Architecture cible : voir `ARCHITECTURE.md` + `THREEJS_AUDIT.md` (2D et 3D convergent
vers le même keyframe/easing engine puis Remotion → MP4 ; Quran : récitation continue →
durée réelle → word timings → Golden Follower → renderer arabe Hikma).
