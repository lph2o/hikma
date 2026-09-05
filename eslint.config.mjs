import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Fichiers portés depuis OpenReel (MIT) : les paramètres inutilisés sont
  // préfixés `_` par convention (source OpenReel) — autoriser explicitement.
  {
    files: ["lib/content-studio/graphics/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Scratch d'analyse par phase (scripts jetables produisant tmp/*.json et les
    // rapports PHASE_*.md) — hors code produit.
    "tmp/**",
  ]),
]);

export default eslintConfig;
