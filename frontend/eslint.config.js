import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "lines-between-class-members": "off",
      "no-restricted-syntax": [
        "error",
        {
          selector:
            'TSTypeReference[typeName.name="SxProps"]:not([typeParameters])',
          message:
            "SxProps must have Theme parameter to avoid significant compiler slowdown.",
        },
        {
          selector:
            'TSTypeReference[typeName.name="Components"]:not([typeParameters])',
          message:
            "Components must have Theme parameter to avoid significant compiler slowdown.",
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@mui/material", "@mui/system", "!@mui/material/"],
              importNames: [
                "styled",
                "alpha",
                "SxProps",
                "createTheme",
                "useTheme",
                "Theme",
                "ThemeOptions",
                "ThemeProvider",
              ],
              message: "Please import it from '@mui/material/styles' instead.",
            },
            {
              group: ["@mui/material/*/*"],
              message:
                "Only support first and second-level imports. Anything deeper is considered private and can cause issues",
            },
          ],
        },
      ],
    },
  }
);
