// Hikma — polices Remotion : Poppins (latin) + Amiri (arabe), les deux polices
// du Design System (app/layout.tsx utilise les mêmes via next/font/google).
// Chargées au moment du bundle/rendu Remotion (jamais dans le bundle Next).

import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";
import { loadFont as loadAmiri } from "@remotion/google-fonts/Amiri";

export const fonts = {
  poppins: loadPoppins(),
  amiri: loadAmiri(),
};

export const fontFamilyLatin = fonts.poppins.fontFamily;
export const fontFamilyArabic = fonts.amiri.fontFamily;
