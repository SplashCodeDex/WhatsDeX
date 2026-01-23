---
description: Technical Standards - Directory Structure, Imports, and Coding patterns
globs: ["**/*"]
alwaysApply: true
---
# Technical Standards (2026 Mastermind Edition)

## 1. Directory Structure Authority (Hybrid FSD)
*   **`src/app`**: Route definitions only (Thin Page Pattern).
*   **`src/features`**: Domain-driven business logic, components, and actions.
*   **`src/components/ui`**: Atomic, stateless design system primitives.
*   **`src/services`**: External integrations (API, Database) using Result Pattern.
*   **`src/lib`**: Pure utility functions and shared infrastructure.

## 2. Import & ESM Conventions
-   **Strict ESM**: Relative imports MUST include the `.js` extension.
-   **Use Aliases**: Always use `@/` aliases for internal source paths.

## 3. Banned Patterns
-   **Hardcoded Secrets**: NEVER hardcode API keys. Use `.env`.
-   **Manual Loading States**: BANNED in frontend forms. Use `useActionState` (React 19).
-   **"Any" Types**: Strictly prohibited. Use `unknown` + Zod/Narrowing.
-   **useEffect for Data**: BANNED. Use Server Components or Actions.

## 4. Integration Standards
-   **Zod-First**: Mandatory validation for all external data (Firestore, API, Env).
-   **Node.js 24+**: Leverage the stable permission model and native test runner.
-   **React 19**: Leverage the compiler; manual `useMemo`/`useCallback` are deprecated.
-   **Firebase**: Use subcollection multi-tenancy pattern for data isolation.
