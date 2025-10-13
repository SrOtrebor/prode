import globals from "globals";
import js from "@eslint/js";
import reactRecommended from "eslint-plugin-react/configs/recommended.js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  {
    ignores: ["dist/**"],
  },
  js.configs.recommended,
  {
    // Spread the recommended config for React
    ...reactRecommended,
    files: ["src/**/*.{js,jsx}"],
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": "warn",
      "no-unused-vars": "warn",
      // Disable a rule from react/recommended that is often too noisy
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off" // Not needed with new JSX transform
    },
  },
];