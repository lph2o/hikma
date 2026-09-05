// Hikma — Types : TAG DYNAMIQUE SÛR (polymorphisme `as`).
//
// @react-three/fiber v9 injecte TOUS les exports de three (y compris les
// non-constructeurs → `never`) dans `JSX.IntrinsicElements` (module
// augmentation `declare module 'react'`). Conséquence : tout tag dynamique
// typé `React.ElementType` (le pattern `const Comp = (as ?? "div") as
// ElementType`) voit ses props s'effondrer en `never` — TS calcule
// l'intersection des props de TOUS les éléments intrinsèques, dont les
// entrées three invalides.
//
// Ce type exclut explicitement les clés three (`keyof ThreeElements`) du
// domaine des tags dynamiques applicatifs : les composants polymorphiques de
// Hikma n'acceptent QUE les éléments HTML/SVG réels + les composants React.
// C'est le correctif recommandé par la communauté R3F (discussion #1793).

import type { ComponentType, ElementType, ReactNode } from "react";
import type { ThreeElements } from "@react-three/fiber";

/** Tag dynamique sûr pour les composants polymorphiques Hikma (`as` prop). */
export type AppElementType =
  | Exclude<ElementType, keyof ThreeElements>
  | ComponentType<{ children?: ReactNode } & Record<string, unknown>>;
