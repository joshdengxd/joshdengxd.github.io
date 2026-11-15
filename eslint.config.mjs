import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import tseslint from "typescript-eslint";

// Order matters. eslint-config-prettier switches off every rule that conflicts with Prettier, and `curly` is one of
// them: the own rules must come AFTER it, or `curly` is silently off. See docs/context/code-style.md.
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  eslintConfigPrettier,
  {
    rules: {
      curly: ["error", "all"],
      eqeqeq: "error",
      "no-else-return": "error",
      "no-lonely-if": "error",
      "no-nested-ternary": "error",
      "no-unneeded-ternary": "error",
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-template": "error",
      "no-console": "error",
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
    },
  },
  {
    // Tests may use non-null assertions (`!`) on values the test just set up.
    files: ["tests/**"],
    rules: { "@typescript-eslint/no-non-null-assertion": "off" },
  },
  {
    // Build and test-runner scripts report through the console.
    files: ["scripts/**"],
    rules: { "no-console": "off" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "next-env.d.ts",
    "drafts/**",
    "playwright-report/**",
    "test-results/**",
    ".claude/**",
  ]),
]);
