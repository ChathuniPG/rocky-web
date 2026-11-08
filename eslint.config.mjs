import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Same files eslint-config-next registers its plugins for; without this, the react
    // rule below also hits .cjs files, where the react plugin is not loaded.
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    rules: {
      "no-console": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "react/jsx-no-useless-fragment": "error",
      "react/self-closing-comp": "error",
      // shadcn's registry imports the young `cn` package; use clsx + tailwind-merge
      // through @/lib/utils (add components with `npm run ui:add`).
      "no-restricted-imports": [
        "error",
        { paths: [{ name: "cn", message: 'Import { cn } from "@/lib/utils" instead.' }] },
      ],
    },
  },
  // Type-aware rules, consistent with rocky-api (ADR-010): unhandled promises are a
  // common source of silent failures in event handlers and effects.
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
    },
  },
  // CommonJS tool config such as ecosystem.config.cjs (PM2). ESLint already parses .cjs
  // as CommonJS, so `module` and `__dirname` are known globals.
  {
    files: ["**/*.cjs"],
    rules: {
      "no-console": "error",
      "no-unused-vars": "error",
    },
  },
  prettier,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "src/lib/api/schema.d.ts"]),
]);

export default eslintConfig;
