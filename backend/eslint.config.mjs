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
            "@typescript-eslint/no-explicit-any": "warn",
            "no-unused-vars": "warn",
            "@typescript-eslint/no-unused-vars": "warn",
            "no-console": "warn",
            "@typescript-eslint/ban-ts-comment": "warn",
            "no-empty": "warn",
            "no-control-regex": "warn",
            "no-case-declarations": "warn",
            "@typescript-eslint/no-unsafe-function-type": "warn"
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
