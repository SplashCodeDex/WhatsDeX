---
description: Technical Standards - Directory Structure, Imports, and Coding patterns
globs: ["**/*"]
alwaysApply: true
---
# Technical Standards

## 1. Directory Structure Authority
*   **`src/components`**: UI-only. No complex logic.
*   **`src/features`** or **`src/screens`**: Domain logic connection to UI.
*   **`src/services`**: External integrations (API, Database).
*   **`src/lib`**: Pure utility functions with no side effects.
*   **`src/context`** or **`src/state`**: Global state management.

## 2. Import Conventions
-   **Use Aliases**: Always use `@/` aliases (e.g., `import { Button } from '@/components/ui/button'`) instead of relative paths (`../../components/`).
-   **No Barrel File Abuse**: Do not create circular dependencies with `index.ts` files.

## 3. Banned Patterns
-   **Hardcoded Secrets**: NEVER hardcode API keys or secrets. Use `.env`.
-   **Hardcoded Colors**: Do not hardcode Hex/RGB values in components. Use config variables (CSS vars or Tailwind config).
-   **"Any" Types**: The `any` type is strictly prohibited in TypeScript. Use `unknown` if necessary, but preferably specific types.
-   **Inline Styles**: Avoid inline styles (`style={{ color: 'red' }}`). Use classes.

## 4. Integration Standards
-   **Google/Firebase**: When using Gemini or Firebase, follow the official SDK implementation patterns.
-   **Authentication**: Always handle auth states (loading, error, unauthenticated) gracefully.
