# ARCHITECTURE.md — Architecture du Content Studio Hikma (post-OpenReel Étape 1)

## Vue d'ensemble

```text
                 SUPABASE
                    │
                    ▼
             Hikma Content Data
        (content_items.payload, editor_state)
                    │
                    ▼
             Hikma VideoContent / VideoScene
          (frames, kinds, audioUrl, verseConfig)
                    │
                    ▼
            Content Studio Editor (UI)
          timeline · inspector · preview Player
                    │
                    ▼
          Adapters (logique pure, portée d'OpenReel MIT)
   timeline-multi (selection/marquee/overlap)
   audio/links (récitation continue)
   audio/fade-envelope (fades)
                    │
                    ▼
                 Remotion
      (HikmaWordVideo, SceneRenderer, QuranScene,
       WordScene, GoldenRecitationFollower…)
                    │
                    ▼
                   MP4 (renderMedia → Storage)
```

## Principes invariants

1. **Un seul modèle de données** : `VideoScene[]` en frames. Tout adapter OpenReel
   est converti vers ce modèle — aucune seconde architecture parallèle.
2. **Preview = Render** : le Player et `renderMedia()` consomment la même
   `VideoContent` effective et les mêmes scènes Remotion.
3. **Récitation continue** : la scène Coran porte exactement UNE source audio
   (CDN Al-Afasy), jamais une concaténation par mot. Le Golden Follower est
   purement visuel (frame → mot doré).
4. **Logique pure, déterministe** : les adapters sont des fonctions pures sans
   I/O, testables unitairement et identiques en dev, Vercel et self-hosted.
5. **Backward compatibility** : les `editor_state` anciens (`{ scenes: [...] }`)
   continuent de fonctionner avec des défauts sûrs.
6. **Le rendu MP4 est toujours une action explicite** de l'administrateur —
   jamais déclenchée automatiquement par la création/édition d'un projet.

## Couches

| Couche | Rôle | Fichiers clés |
| --- | --- | --- |
| Données | Contenu et état éditorial | `lib/content-studio/video/types.ts`, `lib/content-studio/editor/state.ts` |
| Édition | Timeline, inspector, actions | `components/content-studio/`, `lib/content-studio/editor/` |
| Adapters OpenReel | Multi-sélection, audio lié, fades | `lib/content-studio/editor/timeline-multi.ts`, `lib/content-studio/audio/*.ts` |
| Rendu | Remotion compositions | `remotion/` (`HikmaWordVideo.tsx`, `scenes/`, `motion/`) |
| Pipeline MP4 | Render → Storage → signed URL | `lib/content-studio/render.ts`, `app/api/admin/content-studio/render/route.ts` |
