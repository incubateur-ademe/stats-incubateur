import js from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import lodash from "eslint-plugin-lodash";
import perfectionist from "eslint-plugin-perfectionist";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import unusedImports from "eslint-plugin-unused-imports";
import { defineConfig } from "eslint/config";
import path from "path";
import tseslint from "typescript-eslint";

const nextFiles = [
  "page",
  "head",
  "error",
  "template",
  "layout",
  "route",
  "loading",
  "opengraph-image",
  "twitter-image",
  "not-found",
  "forbidden",
  "unauthorized",
  "default",
  "icon",
  "apple-icon",
  "sitemap",
  "robots",
  "global-error",
  "middleware",
  "proxy",
].join("|");

export default defineConfig([
  {
    ignores: ["node_modules/**", "src/generated/**", "**/*.js?(x)", "\\.yarn/**", "\\.husky/**"],
    name: "Global ignore patterns",
  },
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    name: "Base config",
  },
  {
    name: "@eslint/js config",
    ...js.configs.recommended,
  },
  ...nextVitals,
  ...nextTs,
  tseslint.configs.recommendedTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    name: "TypeScript type checking",
  },
  {
    name: "Project specific rules",
    plugins: {
      lodash,
      perfectionist,
      "unused-imports": unusedImports,
    },
    rules: {
      "@next/next/no-html-link-for-pages": ["error", ["src/app", "src/pages"]],
      "@typescript-eslint/adjacent-overload-signatures": "error",
      "@typescript-eslint/array-type": [
        "error",
        {
          default: "array-simple",
        },
      ],
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          disallowTypeAnnotations: false,
          fixStyle: "inline-type-imports",
          prefer: "type-imports",
        },
      ],
      "@typescript-eslint/explicit-member-accessibility": [
        "error",
        {
          accessibility: "explicit",
          overrides: {
            accessors: "no-public",
            constructors: "no-public",
          },
        },
      ],
      "@typescript-eslint/member-delimiter-style": [
        "off",
        {
          multiline: {
            delimiter: "none",
            requireLast: true,
          },
          singleline: {
            delimiter: "semi",
            requireLast: false,
          },
        },
      ],
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: {
            attributes: false,
          },
        },
      ],
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [
            {
              allowTypeImports: true,
              importNames: ["default"],
              message: 'Import "React" par défaut déjà géré par Next.',
              name: "react",
            },
          ],
        },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/prefer-nullish-coalescing": [
        "error",
        {
          ignorePrimitives: {
            string: true,
          },
        },
      ],
      "@typescript-eslint/sort-type-constituents": "warn",
      "import/consistent-type-specifier-style": ["error", "prefer-inline"],
      "import/export": "off",
      "import/named": "off",
      "import/newline-after-import": "error",
      "import/no-absolute-path": "warn",
      "import/no-default-export": "error",
      "import/no-duplicates": [
        "error",
        {
          "prefer-inline": true,
        },
      ],
      "import/no-extraneous-dependencies": "off",
      "import/no-internal-modules": "off",
      "import/no-named-as-default": "off",
      "import/no-useless-path-segments": "warn",
      "import/order": "off",
      "lodash/import-scope": ["error", "member"],
      // Enable only for CSP inline-style
      // "react/forbid-component-props": [
      //   "error",
      //   {
      //     forbid: [
      //       {
      //         propName: "style",
      //         message: "Utiliser className à la place de style (react-dsfr ou global.css).",
      //       },
      //     ],
      //   },
      // ],
      // "react/forbid-dom-props": [
      //   "error",
      //   {
      //     forbid: [
      //       {
      //         propName: "style",
      //         message: "Utiliser className à la place de style (react-dsfr ou global.css).",
      //       },
      //     ],
      //   },
      // ],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              importNames: ["default"],
              message: 'Import "React" par défaut déjà géré par Next.',
              name: "react",
            },
          ],
        },
      ],
      "no-unused-vars": "off",
      "perfectionist/sort-enums": "error",
      "perfectionist/sort-exports": "error",
      "perfectionist/sort-imports": "error",
      "perfectionist/sort-objects": "error",
      "prettier/prettier": [
        "error",
        {
          arrowParens: "avoid",
          parser: "typescript",
          printWidth: 120,
          singleQuote: false,
          tabWidth: 2,
          trailingComma: "all",
        },
      ],
      "react-hooks/exhaustive-deps": "warn", // Vérifie les tableaux de dépendances
      "react-hooks/rules-of-hooks": "error", // Vérifie les règles des Hooks
      "react/no-unescaped-entities": [
        "error",
        {
          forbid: [">", "}"],
        },
      ],
      "sort-import": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          vars: "all",
          varsIgnorePattern: "^_",
        },
      ],
    },
    settings: {
      "import/resolver": {
        typescript: {}, // this loads <rootdir>/tsconfig.json to eslint
      },
    },
  },
  {
    files: [
      "src/pages/**/*.ts?(x)",
      `src/app/**/+(${nextFiles}).ts?(x)`,
      "next.config.ts",
      "eslint.config.ts",
      "tailwind.config.ts",
      "next-sitemap.config.js",
      "postcss.config.js",
      "global.d.ts",
    ],
    rules: {
      "import/no-default-export": "off",
    },
  },
  {
    files: ["scripts/**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: path.resolve(import.meta.dirname, "./scripts"),
        },
      },
    },
  },
  eslintPluginPrettierRecommended,
]);
