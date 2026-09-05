// Hikma — Content Studio : OVERRIDE WEBPACK partagé pour @remotion/bundler.
//
// Le bundle Remotion (renderMedia / selectComposition) utilise webpack, qui ne
// lit PAS les `paths` du tsconfig. Les imports VALUE de `lib/` (graphics,
// editor, …) utilisent l'alias `@/` comme Next.js — on le fournit donc
// explicitement ici. (Les imports type-only étaient éliminés par le
// transpileur avant webpack, d'où la nécessité uniquement depuis la couche
// graphics, qui importe des valeurs.)
//
// Utilisé par scripts/render-content-video.ts, scripts/text-graphics-proof.ts
// et lib/content-studio/render.ts (route serveur) → même résolution partout.

import { join } from "node:path";
import type { Configuration } from "webpack";

export const hikmaWebpackOverride = (config: Configuration): Configuration => ({
  ...config,
  resolve: {
    ...(config.resolve ?? {}),
    alias: {
      ...(config.resolve?.alias ?? {}),
      "@": join(process.cwd()),
    },
  },
});
