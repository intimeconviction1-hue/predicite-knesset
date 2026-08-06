import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginUnusedImports from "eslint-plugin-unused-imports";

export default [
  {
    files: [
      "src/components/**/*.{js,mjs,cjs,jsx}",
      "src/pages/**/*.{js,mjs,cjs,jsx}",
      "src/Layout.jsx",
    ],
    ignores: ["src/lib/**/*", "src/components/ui/**/*"],
    // Les deux presets étaient étalés ICI, au niveau du bloc — mais leur clé
    // `rules` était ensuite écrasée par le `rules:` explicite plus bas. Résultat :
    // le dépôt croyait faire tourner les règles recommandées et n'en appliquait
    // AUCUNE, seulement les six écrites à la main. `no-undef` en particulier ne
    // tournait pas — c'est ce qui a laissé passer, le 2026-08-07, un
    // `useProjection` utilisé sans être importé : lint vert, build vert, page
    // blanche au chargement. Les règles se fusionnent désormais dans `rules`.
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "unused-imports": pluginUnusedImports,
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      ...pluginReact.configs.flat.recommended.rules,
      "no-unused-vars": "off",
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      // 70 des 71 erreurs révélées par la fusion des presets. La règle demande
      // d'écrire &apos; à la place de chaque apostrophe dans du texte JSX : sur
      // un site intégralement rédigé en français, ça rendrait le source
      // illisible pour un gain nul (React échappe déjà le texte). Désactivée en
      // connaissance de cause, pas par facilité — c'est la seule du lot.
      "react/no-unescaped-entities": "off",
      "react/no-unknown-property": [
        "error",
        { ignore: ["cmdk-input-wrapper", "toast-close"] },
      ],
      "react-hooks/rules-of-hooks": "error",
    },
  },
];
