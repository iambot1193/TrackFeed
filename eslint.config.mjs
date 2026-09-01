import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scripts/**", // utilitários Node standalone (CJS/ts-node), fora das regras do app
  ]),
  {
    rules: {
      // Legado com muitos `any` em shapes de API externas; rebaixado para não travar o build.
      // TODO: tipar aos poucos (payloads do NewsAPI/GNews/Guardian, props internas).
      "@typescript-eslint/no-explicit-any": "warn",
      // next 16 promoveu essa regra a error; nossos usos são hidratação client-only
      // (tema do localStorage, partículas aleatórias no mount) — padrão intencional, não bug.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
