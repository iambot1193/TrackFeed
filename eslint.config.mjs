import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import { defineConfig, globalIgnores } from "eslint/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = defineConfig([
  ...compat.extends("next/core-web-vitals", "next/typescript"),
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
    },
  },
]);

export default eslintConfig;
