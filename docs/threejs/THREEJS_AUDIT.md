# THREEJS_AUDIT — Three.js / React Three Fiber pour Hikma Content Studio

Audit réalisé à partir des docs officielles (Remotion, React Three Fiber, Drei,
Troika) et de l'état réel du dépôt. **Aucune dépendance installée, aucun code
modifié.** Verdict à valider avant toute intégration.

## 1. Contexte projet

| Élément | Valeur |
| --- | --- |
| Remotion | `^4.0.518` |
| React | `19.2.8` |
| Next.js | `16.3.0` |
| Dépendances 3D | **aucune** dans `package.json` ni `node_modules` |
| Pipeline MP4 | local / self-hosted (verdict Phase G : `PHASE_G_LOCAL_RENDER_COMPLETE`) |

## 2. Fait technique central : `@remotion/three` (officiel)

Remotion publie un paquet officiel `@remotion/three` :

- `<ThreeCanvas />` — wrapper du `<Canvas>` React Three Fiber qui accepte les
  hooks Remotion (`useCurrentFrame()`, `interpolate()`, `spring()`, …) ;
- **les animations doivent être déclaratives dans le markup**, PAS dans
  `useFrame()` → chaque frame est une fonction pure de `useCurrentFrame()` :
  **déterminisme garanti** (aucun `Date.now()`, aucun `requestAnimationFrame`) ;
- `<ThreeWebGPUCanvas />` existe (WebGPU + TSL) — non retenu pour la V1 ;
- **rendu serveur obligatoire** : `chromiumOptions: { gl: "angle" }` sur
  `renderMedia()`/`renderFrames()`/`getCompositions()` (le fallback Chromium
  SwiftShader fonctionne sans option, mais `angle` est recommandé) ;
- `<Sequence>` dans un `<ThreeCanvas>` doit porter `layout="none"`.

Installation documentée par Remotion : `three @react-three/fiber @remotion/three @types/three`.

## 3. React Three Fiber v9

- v9 = version **compatible React 19** (migration guide officiel) ;
- R3F est un **renderer React** (client-only) → composants client, sans SSR ;
- dans notre stack (compositions Remotion toutes client-side), aucune friction
  Next.js ; le `Canvas` ne doit jamais être rendu côté serveur.

## 4. Drei — composants réellement pertinents

| Composant | Pertinent ? | Raison |
| --- | --- | --- |
| `<Text>` (troika-three-text) | ✅ sélectif | texte 3D SDF, **arabe lié/ligatures/RTL supporté** — à valider visuellement avec Amiri et les harakāt |
| `<Float>` | ✅ | flottement doux déterministe (paramètres fixes) |
| `<Sparkles>` | ✅ | particules dorées (instanciées, léger) |
| `<Environment>` | ⏳ plus tard | reflets HDR (coût de chargement) |
| `<Text3D>` (extrusion typeface JSON) | ❌ pour l'arabe | **pas de shaping arabe** (pas de ligatures cursives) — réservé au latin |
| `<OrbitControls>` | ❌ | interaction manuelle, inutile en rendu vidéo |
| `<Stars>`, `Stage`, `MeshTransmissionMaterial`, effets | ❌ V1 | coût/pertinence non démontrés pour Hikma |

## 5. POINT CRITIQUE — le texte arabe

Règle absolue Hikma : « Le texte Quran doit rester fidèle à la donnée source,
jamais déformé. »

| Approche | Rendu arabe | Verdict |
| --- | --- | --- |
| **A — Hybride 2.5D (recommandé V1)** : le `ThreeCanvas` rend l'environnement (lumière, profondeur, particules, caméra) ; le mot arabe est un **overlay HTML exact** (renderer Amiri actuel) positionné par dessus, transformé par la même caméra (parallaxe calculée depuis le frame) | **identique au rendu actuel** | ✅ PREVIEW == RENDER, fidélité Quran garantie |
| **B — `<Text>` troika dans la scène** avec la police Amiri (TTF) | shaping arabe supporté ; position des harakāt à valider | ⏳ optionnel, après validation visuelle |
| **C — `<Text3D>`** | pas de ligatures cursives arabes | ❌ interdit pour l'arabe |

Le mot arabe reste donc rendu par le même système que les scènes 2D actuelles ;
Three.js ajoute la matière, la lumière et la profondeur **autour** et **derrière**
(extension naturelle du Word Hero H1/H2 : silver material, mirror, light sweep).

## 6. Keyframes OpenReel → 3D

Le moteur porté (`lib/content-studio/editor/keyframes.ts` + `easing.ts`) contrôle
les propriétés 3D avec le **même** mécanisme que le 2D :

```text
useCurrentFrame()
   ↓
evaluateKeyframesAt(keyframes, frame)
   ↓
position.x / rotation.y / scale / opacity / camera.position / material…
   ↓
props déclaratives des meshes (déterministe)
```

Aucun moteur d'animation parallèle. Mêmes easings, mêmes tests de déterminisme.

## 7. Inspector 3D (cible)

- **Transform** : position XYZ, rotation XYZ, scale XYZ (keyframes par propriété) ;
- **Camera** : FOV, position, rotation, zoom ;
- **Material** : color, opacity, metalness, roughness, emissive (déterministes) ;
- **Animation** : mêmes sections keyframes/easing que le 2D (réutilisées).

## 8. Timeline

Une scène 3D est une `VideoScene` (kind dédié, ex. `"3d"`) : toutes les
opérations existantes s'appliquent telles quelles (move, trim, split, ripple,
snap, duplicate, delete, multi-select, lock, keyframes) car elles opèrent sur
`durationInFrames`/`starts[]` — déjà génériques.

## 9. Cas d'usage — classement

| # | Concept | Pédagogie | Esthétique | Difficulté | Perf rendu | TikTok/Shorts | Priorité V1 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Golden Word (mot doré 3D) | haute | haute | moyenne | moyenne | forte | ⭐ 1er |
| 2 | Floating Arabic Word (profondeur, 2.5D) | haute | haute | basse | faible | forte | ⭐ 2e |
| 7 | Golden Particles suivant la récitation | moyenne | haute | moyenne | faible (instancing) | forte | ⭐ 3e |
| 5 | Word Orbit (mots liés en orbite) | haute | moyenne | moyenne | moyenne | moyenne | 4e |
| 4 | Frequency Globe | moyenne | moyenne | moyenne | moyenne | moyenne | 5e |
| 9 | Depth Typography (parallaxe) | moyenne | haute | basse | faible | forte | 6e |
| 6 | Verse Universe | haute | haute | élevée | élevée | moyenne | plus tard |
| 3 | Root Morph (racine → dérivés) | très haute | haute | élevée | élevée | moyenne | plus tard |
| 8 | Calligraphy Reveal (construction) | haute | très haute | élevée | moyenne | forte | plus tard |
| 10 | Surah Map | haute | moyenne | élevée | élevée | faible | plus tard |

## 10. Performance

- Scènes V1 : meshes peu nombreux, particules **instanciées**, textures réutilisées,
  `dispose` sur démontage, memoization des géométries/matériaux ;
- le preview 3D est rendu par le GPU navigateur (fluide) ; le rendu MP4 passe par
  le WebGL logiciel de Chromium (SwiftShader) → **temps de rendu multiplié**
  (à mesurer sur le prototype ; garder les scènes sobres) ;
- `evaluateKeyframesAt` est O(keyframes) par frame — négligeable.

## 11. WebGPU

- `<ThreeWebGPUCanvas>` existe dans `@remotion/three` mais WebGPU logiciel en
  rendu headless est immature/lent ; aucune justification fonctionnelle pour
  Hikma. **V1 = WebGL** (`gl: "angle"`). WebGPU restera possible plus tard.

## 12. Post-processing

Seuls les effets pertinents pour l'identité Hikma (calme, premium) :
**bloom/glow très subtil** et **vignette légère**. Pas de chromatic aberration,
motion blur ou bruit en V1 (coût de rendu logiciel). Le bloom peut d'abord être
simulé en 2D (glow overlay) pour éviter un post-process 3D coûteux.

## 13. Audio

Invariant absolu, inchangé : les scènes 3D sont **purement visuelles**. La
récitation reste UNE piste continue (Al-Afasy), le Golden Follower suit la durée
réelle — aucune scène 3D ne crée ni ne duplique l'audio.

## 14. Rendu serveur / Vercel

- **Preview** : Three.js dans le navigateur admin (client) — fonctionne ;
- **MP4 local/self-hosted** : OK avec `chromiumOptions: { gl: "angle" }` ;
- **Vercel** : le rendu 3D en serverless (SwiftShader CPU) est lent et peu fiable
  pour des scènes non triviales → conformément au verdict Phase G, le rendu MP4
  (y compris 3D) reste **local/self-hosted** ; Vercel sert le studio + preview.
  Documenté, pas simulé.

## 15. Dépendances (à installer uniquement après validation)

| Paquet | Raison | Licence | Impact |
| --- | --- | --- | --- |
| `three` | moteur 3D | MIT | ~600 Ko gzip, chargé dynamiquement (scène 3D uniquement) |
| `@react-three/fiber` (v9) | bridge React 19 déclaratif | MIT | peer React 19 ✓ |
| `@remotion/three` | ThreeCanvas + hooks frame Remotion | MIT (Remotion) | requis pour le rendu |
| `@types/three` | types | MIT | dev only |
| `@react-three/drei` | Text/Float/Sparkles seulement | MIT | optionnel, à la demande |

Aucune de ces dépendances ne touche au bundle des scènes 2D existantes
(import dynamique dans le module de scène 3D uniquement).

## 16. Verdict

```text
THREE_JS              = RECOMMENDED  (couche 3D optionnelle DANS Remotion)
R3F                   = RECOMMENDED  (déclaratif, v9 React 19)
DREI                  = OPTIONAL     (Text troika / Float / Sparkles seulement ;
                                       Text3D interdit pour l'arabe)
REMOTION_INTEGRATION  = PASS         (@remotion/three officiel, gl: "angle")
SSR                   = PASS         (preview client ; rendu serveur configuré)
VERCEL                = PARTIAL      (preview OK ; MP4 3D reste local/self-hosted)
FRAME_DETERMINISTIC   = PASS         (déclaratif, source = useCurrentFrame)
ARABIC_3D_TEXT        = PARTIAL      (V1 : overlay 2.5D fidèle ; troika validé ensuite)
KEYFRAME_INTEGRATION  = PASS         (même evaluateKeyframesAt pour 2D/3D/audio)
POST_PROCESSING       = BLOOM_SUBTLE + VIGNETTE (sinon simulés en 2D)
WEBGPU                = NOT_NOW      (WebGL suffit, rendu logiciel plus fiable)
AUDIO                 = INCHANGÉ     (scènes 3D visuelles uniquement)
DB_WRITES             = 0
```

## 17. Architecture cible

```text
Timeline (VideoScene, kind "3d")
   ↓
Scene Model (keyframes + easing OpenReel, frames)
   ↓
Remotion Composition
   ├── 2D scenes (existantes)
   ├── Quran scene + audio continu + Golden Follower (inchangés)
   └── ThreeDScene
         ├── ThreeCanvas (@remotion/three)
         ├── environnment (light, depth, particles instanciées)
         ├── Arabic overlay 2.5D (renderer Amiri actuel, positionné par caméra)
         └── props ← evaluateKeyframesAt(frame)   [déterministe]
   ↓
renderMedia (chromiumOptions.gl = "angle")
   ↓
MP4 → Supabase Storage → signed URL
```

## 18. Prochaines étapes (après validation)

1. **Prototype `GoldenWord3DScene`** : يَوْمَ, environnement minimaliste Hikma,
   frame-deterministic, rendu Preview + MP4, keyframes Hikma, sans toucher aux
   données Quran — accompagné de tests (déterminisme, keyframes→transform,
   preview==render, absence de duplication audio).
2. Mesure du temps de rendu SwiftShader pour calibrer la complexité des scènes.
3. Brancher l'Inspector 3D (Transform/Camera/Material/Animation) sur le store
   keyframes existant.
