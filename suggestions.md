Several issues exist with the provided ESLint configuration, particularly concerning its alias resolution, monorepo setup, and the disabling of key rules.
Alias resolution for monorepos
The import/resolver settings for aliases are misconfigured, which is a common problem in monorepos.
The problem: The current settings in "settings": { "import/resolver": { "alias": { "map": [...] } } } are for the eslint-import-resolver-alias package, but the aliases defined are not valid regular expressions, and the extensions are defined in the wrong place for this specific resolver.
How to fix it: To resolve aliases with the standard eslint-plugin-import plugin, you need the appropriate resolver package, such as eslint-import-resolver-alias or eslint-import-resolver-typescript. Your current setup has a hybrid configuration. A correct approach for a monorepo using TypeScript would be to define paths in your tsconfig.json and then use eslint-import-resolver-typescript.
Example using eslint-import-resolver-typescript:
Install the package: npm install --save-dev eslint-import-resolver-typescript
Ensure your tsconfig.json defines your path aliases:
json
// tsconfig.json
{
"compilerOptions": {
"baseUrl": "./",
"paths": {
"@/_": ["_"],
"@components/_": ["../shared/components/_"],
"@/lib/_": ["../shared/lib/_"],
"@/shared/_": ["../shared/_"]
}
}
}
Use code with caution.

Update your .eslintrc:
json
// ...
"settings": {
"import/resolver": {
"typescript": {
"project": "./tsconfig.json"
}
}
},
// ...
Use code with caution.

This approach is more robust for monorepos and TypeScript projects.
Rule management
You have a long list of important rules turned off, which largely defeats the purpose of using a linter.
import/no-unresolved: off: This rule is a key part of linting imports and ensures your paths are valid. When turned off, it won't warn you about broken file paths, leading to runtime errors that ESLint should catch. This is likely disabled to address the alias resolution issue described above.
no-unused-vars: off: Disabling this rule prevents ESLint from finding and warning about unused variables. This can lead to dead code and clutter in your codebase.
react-hooks/exhaustive-deps: off: This is a crucial rule for Next.js and React projects. It ensures that all dependencies are correctly listed for hooks like useEffect, preventing stale closures and bugs.
no-shadow: off: Ignoring variable shadowing can hide bugs and make your code harder to read.
Overly permissive rules: Many other helpful rules, such as max-len, no-nested-ternary, and prefer-template, are also turned off.
Dependencies
The .eslintrc file relies on eslint-plugin-import for alias resolution, but the configuration is incorrect. This requires an additional package to properly resolve imports from a tsconfig.json or other alias configurations.
Recommended actions
Fix alias resolution: Implement the correct resolver configuration using eslint-import-resolver-typescript and ensure your tsconfig.json has correctly mapped paths.
Enable important rules: After fixing the alias resolution, re-enable import/no-unresolved. You should also consider enabling other useful rules like no-unused-vars, react-hooks/exhaustive-deps, and no-shadow. This will help you catch bugs and improve code quality.
Audit other disabled rules: Review the other rules that have been turned off and decide whether they are truly unnecessary for your project. Many of these rules are considered best practices.
