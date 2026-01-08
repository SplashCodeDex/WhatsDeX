import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
    { files: ["**/*.{js,mjs,cjs,ts}"] },
    { languageOptions: { globals: globals.node } },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.ts"],
        rules: {
            "@typescript-eslint/no-explicit-any": "error",
            "no-unused-vars": "warn",
            "@typescript-eslint/no-unused-vars": "warn",
            "no-console": "warn"
        }
    },
    {
        files: ["**/*.js"],
        rules: {
            "@typescript-eslint/no-var-requires": "off",
            "no-undef": "off",
            "no-unused-vars": "warn"
        }
    }
];
