// Hikma — thème Remotion (identité visuelle existante, tokens du Design System).
// Les valeurs proviennent de app/globals.css (variables --hikma-*), gelées par
// tests/brand-system-contract.test.ts. Aucune nouvelle identité visuelle.

export const HIKMA_THEME = {
  teal900: "#002828",
  teal800: "#083838",
  gold: "#c8a058",
  goldMuted: "#b89050",
  goldBright: "#f0d090",
  ivory: "#f8f8f0",
  cream: "#fffdf8",
  charcoal: "#182028",
  charcoalDeep: "#102020",
} as const;

/** Zones sûres 9:16 (contract RENDER_V1 Phase A). */
export const SAFE_ZONES = {
  topPx: 160,
  bottomPx: 220,
  rightRailPx: 140,
} as const;

export const FONT_STACK = {
  latin: "Poppins, sans-serif",
  arabic: "Amiri, serif",
} as const;
