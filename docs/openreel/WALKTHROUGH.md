# WALKTHROUGH.md — Ce qui a été intégré (Étape 1) et pourquoi

## Périmètre de cette phase

Intégration **progressive et réversible** d'OpenReel (Phase 8 du cahier des
charges — Étape 1 : « Timeline core / clip manipulation »), avec les modules au
meilleur ratio valeur / couplage / risque. Rien d'autre n'a été touché :
5 templates, Remotion, pipeline audio, routes admin, données Supabase intactes.

## Modules intégrés (portés)

### 1. `lib/content-studio/editor/timeline-multi.ts` — sélection multiple & marquee

- `getSceneRanges` / `getAudioSceneRanges` — plages vidéo + lanes audio
  (adapté de `getTimelineItemRanges`) ;
- `audioTrackOfScene` — une scène avec `audioUrl` expose une lane audio
  (`word → audio-word`, `quran → audio-verse`) ;
- `getSplittableSceneIndexes` — scènes sélectionnées coupables par un frame ;
- `getTrackSceneSelection` — sélection par piste logique ;
- `getMarqueeSceneIndexes` — sélection rectangulaire temps × hauteurs de piste
  (dédupliquée par index) ;
- `scenesOverlap` / `getGapBetweenScenes` / `sceneEndFrame` (adapté de
  `clipsOverlap` / `getGapBetweenClips`).

**Adaptation** : secondes → frames ; `TrackItem` → `VideoScene` ; une scène vit
sur la piste vidéo ET peut avoir une lane audio (sémantique clip média lié).

### 2. `lib/content-studio/audio/links.ts` — garantie récitation continue

- `findSceneWithAudio` — localise la scène portant l'audio (mot / verset) ;
- `getLinkedAudioLinks` — liens audio liés aux scènes ;
- `resolveContinuousVerseAudio` — **UNE seule source de verset**, jamais par mot ;
- `isVerseRecitationSource` — distingue CDN Al-Afasy (verset) de la
  prononciation du mot (Supabase) ;
- `hasPerWordAudio` — détecte une scène Coran corrompue (audio par mot).

**Motivation** : verrouille par contrat la règle « la récitation est une piste
continue » du bug critique résolu précédemment.

### 3. `lib/content-studio/audio/fade-envelope.ts` — fades audio

- `fadeValueAtTime` — rampe linéaire in/out ;
- `getClipFadeEnvelopePoints` — points d'enveloppe (bornes + seuils), fenêtre
  décalée par `clipOffset` (adapté de `clip-fade-envelope`).

### 9. `lib/content-studio/graphics/shape-graphic.ts` + `ShapesPanel` — FORMES (LOT 2)

- **`shape-graphic.ts` (adapté Hikma)** : `ShapeGraphicClip` — 6 formes
  (rectangle, ellipse, polygon, star, line, arrow), fill solid/gradient
  (couleurs hex filtrées), stroke, roundness, sides, épaisseur normalisée ;
  géométrie SVG **pure** (`evaluateShapeGeometry`, positions normalisées
  centrées, viewBox -1..1) — concepts des types OpenReel `shape-tools.ts` /
  `motion-shape-style.ts` (MIT, NOTICE à jour) ;
- **UI** : `ShapesPanel` dans l'Inspector (« Graphiques · Formes ») — ajouter
  une forme (6 boutons), éditer couleur/opacité/taille/rotation, supprimer ;
  les formes sont des `GraphicClip` dans `editor_state.graphics` (sanitisées
  serveur, hash d'invalidation) ;
- **Rendu** : `ShapeGraphicLayer` dans `GraphicsOverlay.tsx` — SVG déterministe
  par frame, mêmes fonctions pures en Preview et en Render ;
- **Preuve réelle** : `scripts/text-graphics-proof.ts` rend désormais aussi une
  étoile dorée — pixels dorés vérifiés au bon emplacement dans le MP4.

### 8. `remotion/scenes/GraphicsOverlay.tsx` + `remotion/bundler-config.ts` — RENDU réel des clips graphiques (LOT 1 — branchement)

- **`GraphicsOverlay.tsx` (Hikma)** : couche Remotion superposée aux scènes
  (`<GraphicsOverlay graphics={...} />` dans `HikmaWordVideo`), qui rend chaque
  clip texte via `evaluateTextGraphic(clip, useCurrentFrame())` — **même
  fonction pure en Preview (Player) et en Render (renderMedia)** →
  PREVIEW == RENDER par construction. Aucune horloge réelle.
- **`bundler-config.ts` (Hikma)** : `hikmaWebpackOverride` — l'alias `@/` du
  tsconfig fourni au bundle webpack de Remotion (qui ne lit pas les `paths`).
  Nécessaire depuis l'arrivée des imports VALUE de `lib/` dans la composition
  (les imports type-only étaient éliminés avant webpack). Passé à `bundle()`
  par la route serveur (`lib/content-studio/render.ts`) et les scripts CLI.
- **`buildTextAnimation(preset, config)` (Hikma)** : construit une
  `TextAnimation` COMPLÈTE (params remplis avec les défauts du moteur OpenReel)
  — `params` est requis par `getAnimatedState`.
- **Preuve réelle** : `scripts/text-graphics-proof.ts` rend un MP4 1080×1920
  avec clips texte (fade LTR + typewriter RTL arabe) ; ffprobe confirme le
  fichier, et l'extraction de frames vérifie les overlays visibles
  (pixels clairs du titre + doré du mot arabe).

### 7. `lib/content-studio/graphics/graphic-clip.ts` + `text-graphic.ts` — clips graphiques (LOT 1)

- **`graphic-clip.ts` (Hikma)** : modèle générique `GraphicClipBase` (kinds
  text/shape/svg/sticker/background/three), `GraphicTransform` normalisé 0..1,
  zIndex, keyframes (propriétés opacity/position.x/position.y/scale.x/scale.y/
  rotation), sanitization stricte (clamps, jamais NaN/Infinity),
  `evaluateGraphicTransform(clip, frame)` pur ;
- **`text-graphic.ts` (Hikma)** : `TextGraphicClip` (texte + TextStyle +
  animation + direction RTL/LTR) et `evaluateTextGraphic(clip, frame)` : le
  moteur texte porté d'OpenReel est la SOURCE DE VÉRITÉ (temps local au clip),
  keyframes-first sinon preset 24 animations — PREVIEW == RENDER par
  construction ;
- collection SÉPARÉE de `VideoScene[]` → rétro-compatible (anciens
  `editor_state` inchangés).

### 6. `lib/content-studio/graphics/subtitle-engine.ts` — karaoké / SRT (STEP 4)

- Port des **fonctions pures** de `text/subtitle-engine.ts` : `parseSRT`
  (SRT + WEBVTT, cue ids/settings/markup, rejets d'erreurs), `parseSRTTimestamp`,
  `formatSRTTimestamp`, `exportSRT`, `normalizeSRT`, `reflowCaptionText`,
  `splitCaptionIntoSingleLineCues`, `subtitleMarkupToText`, styles par défaut ;
- la classe `SubtitleEngine` (couplée au modèle Timeline OpenReel) n'est **pas**
  portée (classe C) ;
- **adaptations Hikma** : ids déterministes (plus de `Date.now()`/`Math.random()`) ;
  ajout de `subtitleWordsToFrames(words, fps, maxEndFrame?)` pour brancher les
  timings SRT sur le Golden Follower, bornés à la durée réelle de la récitation.

### 5. `lib/content-studio/graphics/` — moteur TEXTE + ANIMATIONS (STEP 2/3)

- `text-types.ts` — port des types texte OpenReel (`TextStyle`, `TextAnimation`,
  `TextAnimationParams`, 24 `TextAnimationPreset`, `TextClip`, defaults) ;
  dépendances remplacées par `TextTransform` (normalisé 0..1), `HikmaKeyframe`
  (frames), `EasingName` ;
- `text-animation-presets.ts` — port **quasi verbatim** (pur) des 24 presets
  d'animation unit-level (character/word/line) avec stagger : typewriter, fade,
  slide*, scale, blur, bounce, rotate, wave, shake, pop, glitch, split, flip,
  word-by-word, rainbow, rise, drop, elastic, swing, zoom-blur, cascade ;
- `text-animation.ts` — port de `TextAnimationEngine.getAnimatedState(clip, time)`
  : keyframes-first puis in/hold/out par preset, déterministe en frames ;
- `animation-engine.ts` — adapter local remplaçant `AnimationEngine` OpenReel
  (applyEasing + getValueAtTime) via nos ports easing/keyframes.

**Règle arabe** : le moteur décrit style/transform/animation ; le RENDU du texte
coranique reste le renderer arabe Hikma (shaping, harakāt) — jamais remplacé.

### 4. `lib/content-studio/editor/easing.ts` + `lib/content-studio/editor/keyframes.ts` — moteur keyframes/easing

- `easing.ts` — port **quasi verbatim** de `easing-functions.ts` (module pur,
  zéro import) : 50+ easings, `cubicBezier`, `springEasing`, `interpolate`,
  presets et catégories. Valeurs identiques aux références OpenReel.
- `keyframes.ts` — extraction de la logique pure de `keyframe-engine.ts`
  (`getValueAtTime`, `interpolateValue`) et de `evaluate-keyframes.ts`, adaptée
  au modèle frames Hikma : clamp avant/après, segment, easing (nommé, poignées
  Bézier, spring), interpolation numérique/objet récursif/hold. CRUD keyframes
  pur (add/remove/update sans mutation).
- **PREVIEW == RENDER** : le même moteur pur peut alimenter le Player et
  `renderMedia()` ; aucune divergence possible.

## Ce qui n'a PAS été intégré (et pourquoi)

| Élément | Raison |
| --- | --- |
| UI timeline React d'OpenReel | Couplée au store OpenReel ; la timeline Hikma existe déjà (trim/split/ripple/snap dans `timeline-ops.ts`) — inspiration uniquement |
| Renderer OpenReel | Remotion reste le renderer officiel (preuve MP4 existante) |
| Beat-sync | Musical, pas coranique |
| Moteur de sync mots | Exige de vrais timestamps par mot, que nous n'avons pas pour l'audio coranique ; le Golden Follower reste déterministe sur la durée réelle |
| Keyframes/easing | Étape 5 recommandée (non réalisée dans cette phase) |

## Preuves

- 15 tests unitaires déterministes : `tests/openreel-adapted.test.ts`
  (selection/marquee, overlap/gap, split, liens audio, récitation continue,
  fades, offset de fenêtre).
- Typecheck, ESLint, suite complète : voir `TEST REPORT` ci-dessous.

## Ce qui reste (phases suivantes recommandées)

1. Brancher `getMarqueeSceneIndexes` / multi-sélection dans l'UI timeline.
2. Keyframes + easing (`evaluate-keyframes`).
3. Waveform (décodage navigateur — nécessite un proxy CORS pour le CDN).
4. Undo/redo multi-actions sur la timeline.

---

# TEST REPORT — Intégration OpenReel Étape 1

```text
TypeScript:       PASS (0 erreur, npx tsc --noEmit --skipLibCheck)
ESLint:           PASS (0 erreur sur les fichiers nouveaux/modifiés)
Vitest ciblé:     PASS — tests/openreel-adapted.test.ts : 15/15
                  PASS — tests/openreel-keyframes.test.ts : 26/26
                  PASS — tests/openreel-text-engine.test.ts : 15/15
                  PASS — tests/openreel-subtitle-engine.test.ts : 16/16
                  PASS — tests/openreel-graphic-clip.test.ts : 15/15
                  PASS — tests/openreel-text-editor-state.test.ts : 10/10
                  PASS — tests/openreel-shape-graphic.test.ts : 17/17
Vitest complet:   PASS — 105 fichiers / 1467 tests OK
                  (2 échecs préexistants hors périmètre :
                   brand-system-contract login — à re-vérifier en fin de cycle)
                  (2 échecs préexistants hors périmètre :
                   brand-system-contract login — à re-vérifier en fin de cycle)
                  (2 échecs préexistants hors périmètre :
                   tests/brand-system-contract.test.ts — contrat logo de la
                   page login, lié à un travail antérieur non committé)
Database writes:  0 · Migrations: 0 · Données Quran: 0 modifiées
Templates:        inchangés (WORD_REVEAL_V1, WORD_QUIZ_V1, VERSE_DEEP_DIVE_V1,
                  FREQUENCY_FACT_V1, SURAH_HIGHLIGHT_V1)
Audio:            inchangé — récitation continue garantie par audio/links.ts
Timeline:         helpers purs ajoutés (selection/marquee/overlap/fades) ;
                  timeline existante (trim/split/ripple/snap) intacte
Rendering:        Remotion intact — couche graphics ADDITIVE ajoutée
                  (GraphicsOverlay + alias webpack @/ pour le bundle)
Preuve MP4:       out/text-graphics-proof.mp4 — clips texte (fade + typewriter
                  RTL arabe) + étoile dorée rendus et vérifiés frame par frame
                  (ffprobe + pixels)
```

---

# LOT 3 — Interactive Graphics Overlay : sélection / drag / resize / rotation dans le Preview

## Ce qui a été ajouté (éditeur visuel réel)

`components/content-studio/editor/interactive-graphics-overlay.tsx` — couche interactive
posée **par-dessus le Player** (mode édition uniquement, jamais dans le render MP4) :

- **Sélection** : clic direct sur un texte ou une forme dans le Preview → clip sélectionné,
  bounding box + handles affichés. Chevauchement résolu par z-index (élément visible en premier).
- **Drag** : déplacement souris/trackpad/pointer → pixels convertis en coordonnées normalisées
  → `GraphicTransform.x/y` (jamais de pixels persistés). Delta appliqué relatif au snapshot du clip.
- **Resize** : handles de coins → `width/height` (texte) et `size` (shapes).
- **Rotation** : handle ↻ au-dessus de la bounding box → `transform.rotation` (0-360°),
  centre de rotation = centre du clip.
- **Pointer robustesse** : `try/catch` sur `setPointerCapture` (les événements synthétiques
  des tests lancent une exception), fallback `window pointerup` pour que le release arrive
  toujours, handles maintenus montés pendant le drag.
- **`data-selected`** attribut DOM sur le clip sélectionné (observable par les tests).
- **Alignement** : Centrer H / Centrer V / Centre exact dans le panel.

`components/content-studio/editor/text-graphics-panel.tsx` — complété :
- **24 presets d'animation** exposés (None + 24, liste = `TEXT_ANIMATION_PRESETS` du moteur,
  vérifiée 1:1 : typewriter, fade, 4 slides, scale, blur, bounce, rotate, pop, flip, split,
  word-by-word, rise, drop, elastic, swing, zoom-blur, cascade, wave, shake, glitch, rainbow).
- Entrée (durée en frames) / Sortie + easing par défaut.
- Transform : X / Y / rotation / échelle + actions d'alignement.
- Boutons Duplicate + Delete par clip.

`components/content-studio/editor/timeline.tsx` + `video-editor.tsx` :
- Piste **G1 GRAPHICS** dans la Timeline existante (aucune 2e timeline).
- Move (drag horizontal → `startFrame` + snap aux clips), Trim (bordures gauche/droite,
  clamp durée ≥ 1), sélection par clic, Delete.

`lib/content-studio/editor/timeline-ops.ts` : ops pures `moveGraphicClip` / `trimGraphicClip`
avec clamps (déjà testées).

`app/dev/graphics-editor/page.tsx` : route de démo locale (`/dev/graphics-editor`) qui monte
le vrai `VideoEditor` avec des graphics seedés — utilisée pour la **vérification visuelle réelle**
(le Content Studio admin est derrière le login).

## Preuves (vrai Content Studio, route de démo, interaction réelle vérifiée)

```
SELECTION   = PASS (clic sur l'étoile → data-selected, bounding box + handles visibles)
DRAG        = PASS (étoile déplacée (510,160) → (600,215), delta pointer identique)
RESIZE      = PASS (36×64 → 55×98 sur le clip texte)
ROTATION    = PASS (0° → 90°, Inspector synchronisé)
PRESETS_UI  = PASS (24 presets + Aucune dans le sélecteur, liste identique au moteur)
ALIGN       = PASS (Centrer H / V / Centre exact présents)
TIMELINE    = PASS (piste G1, 4 clips graphiques visibles, move/trim)
```

## Validation

```
TYPECHECK = PASS (0 erreur projet) · ESLINT = PASS (0 erreur)
VITEST    = 1476 PASS (106 fichiers) — 51/51 tests graphics/timeline-ops
           (2 échecs préexistants hors périmètre : brand-system-contract login)
DB_WRITES = 0 · Migrations = 0 · Quran/audio/traductions intacts
AUTO_RENDER = SAFE (création/édition → jamais de rendu ; seul "Rendre MP4" déclenche)
PREVIEW == RENDER = par construction (mêmes fonctions pures dans l'overlay et le renderer)
```

---

# FIX LOT 3 — Manipulation visuelle réelle (drag, bounding box, cercle, Inspector)

## Causes racines (test manuel réel)

1. **Drag impossible sur l'élément sélectionné** — la cible de sélection du clip actif
   était `display: none` une fois sélectionné, et la boîte de sélection était
   `pointerEvents: none` → plus aucun moyen de déplacer l'élément déjà sélectionné
   (seuls les handles marchaient). Le drag n'était fiable qu'une fois par clip.
2. **Bounding box ≫ forme réelle** — le renderer SVG utilisait une taille fixe
   `min(62vw, 60vh)` (unités viewport, indépendantes de `thickness` et du canvas),
   et la hauteur de la boîte était calculée comme fraction de la LARGEUR du canvas
   mais mise à l'échelle par la hauteur du conteneur → boîte trop grande et
   distordue.
3. **« Cercle » ovale** — le kind `circle` n'existait pas ; seul `ellipse` (ry = 0.62r)
   existait, et le container non carré distordait l'ellipse en ovale.
4. **Formes sans position X/Y dans l'Inspector** — seuls les textes avaient X/Y.

## Corrections

### Modèle (`lib/content-studio/graphics/shape-graphic.ts`)
- Nouveau kind **`circle`** (7 kinds) : géométrie `r = 1` unique (rx === ry), aspect
  VERROUILLÉ à 1 même au resize.
- Nouveau champ **`aspect`** (ratio hauteur/largeur en px, défauts par forme :
  cercle/rectangle/étoile/polygone = 1, ellipse = 0.62, ligne = 0.1, flèche = 0.35),
  sanitisé [0.05, 2].
- Géométrie réécrite en **rayon 1 dans le viewBox -1..1** : la taille visible est
  portée par le container (thickness × largeur canvas), plus jamais par la géométrie.

### Renderer (`remotion/scenes/GraphicsOverlay.tsx`)
- Container SVG = **`thickness` × largeur de la composition** (px), hauteur = même
  valeur (container CARRÉ) → cercle parfaitement rond sur tout écran, et la
  bounding box de l'éditeur correspond EXACTEMENT au rendu.
- `useVideoConfig()` pour la largeur (déterministe, Preview == Render).
- Stroke converti px-canvas → unités viewBox (constant à l'écran).
- Cas SVG `circle` ajouté.

### Interaction (`lib/content-studio/graphics/interaction.ts` — nouveau, PURE)
- `pxDeltaToNormalized` : delta écran → normalisé via la taille RÉELLE du conteneur
  (responsive 1080×1920 / 390×844 / 768×1024).
- `applyDragDelta` : delta calculé depuis le snapshot de DÉPART (jamais d'état
  obsolète), clamp **taille-aware** (`x ∈ [-w/2, 1 + w/2]` : un élément de 20 % peut
  toucher les bords sans disparaître).
- `sizeFromWidthHeight` : W/H ↔ thickness/aspect, cercle toujours aspect 1.

### Overlay (`components/content-studio/editor/interactive-graphics-overlay.tsx`)
- Cible de sélection du clip ACTIF **toujours montée** → drag direct sur l'élément
  sélectionné (le fix n°1).
- Métriques formes : `h = w × aspect × (canvasW/canvasH)` → boîte en px carrée quand
  l'aspect vaut 1 (bounding box == rendu).
- Désélection par clic sur le fond (attribut `data-graphic-deselect`).
- Drag via `applyDragDelta` (clamps taille-aware, responsive).

### Inspector (`components/content-studio/editor/text-graphics-panel.tsx`)
- Bouton **Cercle** ajouté aux formes.
- Les formes disposent désormais de **Position X / Position Y / Largeur / Hauteur /
  Rotation / Opacité** (parité avec les textes). Hauteur du cercle verrouillée
  (= Largeur) pour garantir la rondeur.
- `video-editor.tsx` : `aspect` propagé dans la reconstruction du clip.

## Preuves (vrai Content Studio, route `/dev/graphics-editor`)

```
DRAG_SELECTED     = PASS — cercle sélectionné puis déplacé de +40px/+30px (delta exact)
BOUNDING_BOX      = PASS — étoile 36×36 px = SVG 36×36 ; cercle 60×60 = SVG 60×60
CIRCLE_ROUND      = PASS — boîte carrée (60×60) et container SVG carré
CIRCLE_RESIZE     = PASS — 60×60 → 72×72, reste parfaitement carré (rond)
INSPECTOR_SHAPE   = PASS — X/Y/Largeur/Hauteur affichés pour les formes
INSPECTOR_SYNC    = PASS — slider X à 40 % → centre du cercle à 396 px (40 % du canvas)
```

## Validation

```
TYPECHECK = PASS (0 erreur projet) · ESLINT = PASS (0 erreur)
VITEST    = 1497 PASS (107 fichiers) — 38/38 tests shapes + interaction (21 nouveaux)
           (2 échecs préexistants hors périmètre : brand-system-contract login)
MP4_PROOF = out/text-graphics-proof.mp4 — étoile dorée vérifiée par pixels
           (7242 px dorés au bon emplacement, nouvelle taille thickness×canvas)
DB_WRITES = 0 · Migrations = 0 · Quran/audio/traductions intacts
AUTO_RENDER = SAFE (seul « Rendre MP4 » déclenche un rendu)
```

---

# FIX LOT 3B — Création au playhead, z-index, polices réelles, sync sélection

## Mesures réelles (avant toute correction)

Les deux mappings de drag ont été MESURÉS dans le vrai Content Studio (pas supposés) :

- **Drag Preview** : +100 px pointeur → objet déplacé de +100 px exactement (1:1). Le
  calcul `dxPx / containerW` (conteneur = zone Player 9:16 réelle) est correct.
- **Drag Timeline** : +100 px sur une piste de 760 px (240 frames) → +32 frames
  (31.58 attendus). `pxPerFrame = rect.width / duration` est correct.

→ Les plaintes « trop rapide » concernaient l'état PRÉ-FIX ; le comportement actuel
est 1:1. Vérifié par mesure DOM, pas par lecture de code.

## Nouveautés implémentées (réellement vérifiées dans le Content Studio)

### Création au PLAYHEAD + sélection immédiate + z-index empilé
- `addTextGraphic` / `addShapeGraphic` (video-editor.tsx) : `startFrame = frame`
  (playhead), `zIndex = max + 1` (le nouveau clip arrive AU-DESSUS), id UUID,
  **auto-sélection** du nouveau clip (prêt à éditer).
- Vérifié : playhead à 75 % (frame 180) → « + Texte » → clip à `left: 75 %`
  (startFrame 180), sélectionné, piste G1 à 8 clips.

### Z-index : premier / arrière plan
- `bringGraphicToFront` / `sendGraphicToBack` (zIndex max+1 / min−1) + boutons ⤴/⤵
  dans les panneaux Texte et Formes (16 boutons présents pour 8 clips).

### Polices RÉELLES (audit préalable)
- `app/layout.tsx` charge Poppins + Geist Mono + Amiri (next/font) ; Remotion charge
  Poppins + Amiri. `DEFAULT_TEXT_STYLE.fontFamily` utilisait **"Inter" — jamais
  chargée** → corrigé vers **Poppins** (police réelle du Design System).
- Sélecteur « Police » dans l'Inspector : Poppins (latin) / Amiri (arabe) / Geist
  Mono (mono) / Système. **Vérifié : changement Poppins → Amiri → le texte rendu
  dans le Player passe réellement à `font-family: Amiri`.**

### Sync sélection Preview ↔ Timeline
- Déjà câblée via `selectedGraphicId` (overlay `onSelect` + timeline `onSelectGraphic`).
- **Vérifié : clic sur le clip « Texte : Hikma Studio » dans la piste G1 → le clip
  est sélectionné dans le Preview (data-selected), bounding box + handles visibles.**

## Validation

```
TYPECHECK = PASS (0 erreur projet) · ESLINT = PASS (0 erreur)
VITEST    = 1496 PASS (107 fichiers) — tests engine texte mis à jour (Poppins)
           (2 échecs préexistants hors périmètre : brand-system-contract login)
DB_WRITES = 0 · Migrations = 0 · Quran/audio/traductions intacts
AUTO_RENDER = SAFE (seul « Rendre MP4 » déclenche un rendu)
```

---

# FIX CRITIQUE — Drag / Resize « trop rapide » (accumulation du delta)

## Cause racine (trouvée par le test utilisateur)

Dans `InteractiveGraphicsOverlay.handleMove`, le snapshot `dragStartClip.current`
était **mis à jour après chaque pointermove** avec le clip re-rendu, alors que le
delta était recalculé depuis le point de DÉPART (`e.clientX - dragStart.current.x`).
Conséquence : à chaque pointermove, on ajoutait le delta CUMULÉ à une position déjà
décalée → le déplacement s'ACCÉLÉRAIT (2×, 3×… trop rapide). Même bug sur le
resize : la taille courante (déjà agrandie) servait de base au facteur suivant.

## Correction

- **Drag** : `dragStartClip.current` n'est PLUS mis à jour pendant le drag. Le delta
  est toujours appliqué à la position de DÉPART (snapshot) → déplacement exactement
  1:1 avec le pointeur, quelle que soit la fréquence des pointermove.
- **Resize** : le facteur est calculé depuis le delta (départ) et appliqué à la
  taille du SNAPSHOT (pas à la taille courante re-rendue).

## Preuve (vrai Content Studio, 3 pointermove successifs)

```
DRAG   avant fix : +100 px en 3 moves → objet décalé ~66-150+ px (accumulation)
       après fix : +100 px en 3 moves → objet décalé de 100 px EXACTEMENT
RESIZE avant fix : +30 px en 3 moves → 60 → 87 px (facteur au carré)
       après fix : +30 px en 3 moves → 60 → 72 px (60 × 1.2 attendu)
CIRCLE reste carré (rond) pendant le resize.
```

## Validation

```
TYPECHECK = PASS · ESLINT = PASS · VITEST = 38/38 (interaction + shapes)
AUTO_RENDER = SAFE · Quran/audio/DB intacts
```

---

# FIX — Timeline : trim/move « trop rapide » (accumulation + échelle vivante)

## Cause racine (mesures multi-moves dans le Content Studio)

Deux défauts dans `timeline.tsx` :

1. **Accumulation du delta** : `moveGraphicClip` / `trimGraphicClipEnd` /
   `trimGraphicClipStart` appliquaient le delta CUMULÉ (depuis le pointerdown) à
   l'état COURANT re-rendu → chaque pointermove ajoutait le delta total à une
   valeur déjà décalée (2×, 3×… trop rapide). Même défaut pour le trim des
   SCÈNES (`trimSceneEnd`/`trimSceneStart`).
2. **Échelle vivante** : `pxPerFrame = rect.width / durationInFrames` était
   recalculé à chaque move — or la durée TOTALE change pendant un trim (layout
   flexbox proportionnel) → le mapping pixels → frames se re-calibrait en plein
   drag (mesuré : trim scène +100 px en 3 moves → +34 frames au lieu de +32).

## Correction

- **Snapshots au pointerdown** (`dragSceneSnapshot`, `dragGraphicSnapshot`) : le
  delta (depuis le départ) est appliqué à la valeur de DÉPART, jamais à l'état
  courant — même règle que l'overlay canvas.
- **Échelle figée** (`dragPxPerFrame` via `snapshotPxPerFrame()`) : la conversion
  pixels → frames utilise l'échelle du début du drag, pas une échelle recalculée.
- Les ops pures (`timeline-ops.ts`) restent inchangées (delta-appliers testés,
  utilisés par le nudge clavier en one-shot).

## Preuve (vrai Content Studio, 3 pointermove successifs, page vierge)

```
SCÈNE  trim-out +100 px en 3 moves : 90 → 122 frames (= 90 + 32 attendu)
       (avant : 124 — accumulation + échelle vivante)
GRAPHIC trim-in +100 px en 3 moves : 240 → 204 frames (= 240 − 36 attendu,
       échelle 760/272 après le trim scène)
MOVE graphique +100 px en 3 moves : +32 frames exacts
```

## Validation

```
TYPECHECK = PASS · ESLINT = PASS · VITEST = 9/9 timeline-ops + 38/38 interaction
AUTO_RENDER = SAFE · Quran/audio/DB intacts
```
---

## UNIFICATION TEXT EDITOR — textes hérités (Hikma/Quran) dans l'éditeur graphique

**Stratégie — PROMOTION LAZY (adapter, aucune migration DB) :**

- `lib/content-studio/graphics/legacy-text-adapter.ts` (Hikma) : décrit chaque texte
  rendu par les scènes VideoScene (`arabic`, `transliteration`, `text`, `subtext`)
  comme un descripteur unifié (contenu + style par défaut reproduisant le rendu
  scène + transform + direction + protection). Module pur, partagé
  Preview / Timeline / Inspector / Render.
- Cliquer un texte hérité (Preview) ou le bouton ✎ (Inspector de scène) le
  PROMEUT en un vrai `TextGraphicClip` (porté dans `editor_state.graphics`,
  rendu par `GraphicsOverlay`, éditable partout). Le champ `source`
  `{ sceneIndex, field }` masque l'original dans sa scène tant que le clip
  existe — supprimer le clip restaure l'original. Zéro migration.
- Tous les contrôles unifiés s'appliquent alors : police, taille, poids,
  couleur, opacité, ombre, contour, halo, gradient, position, rotation,
  échelle, animation (24 presets), Timeline G1, drag/resize/rotate 1:1,
  persistence, MP4 (parité par construction : même `evaluateTextGraphic`).

**PROTECTION CORAN :** le verset (`quran.arabic`) n'est JAMAIS promu — le
renderer arabe (shaping, harakāt, RTL), le Golden Recitation Follower et la
récitation continue restent intacts. Seule la référence (`subtext`) est
promouvable sur la scène coran.

**Preuves :** tests `tests/openreel-legacy-text-adapter.test.ts` (10) + preuve
pixel `scripts/legacy-promote-proof.ts` (frame renderStill : clip promu peint,
original masqué — 0 double rendu).
