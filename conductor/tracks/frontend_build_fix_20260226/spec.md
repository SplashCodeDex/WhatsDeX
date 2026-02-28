# Specification: Resolve Systemic Frontend Build Failures

## Overview
This track addresses the systemic `TypeError: Cannot read properties of null (reading 'useContext')` and `useEffect` errors encountered during the `next build` process. These errors stem from a conflict between static prerendering and Client Components/Providers in the Next.js 16 and React 19 environment.

## Functional Requirements
1.  **Zero-Dependency Global Error Page:** Refactor `src/app/global-error.tsx` to remove all imports from `@/components` or `@/stores`. It must be a self-contained HTML/CSS file to ensure it can render even when the application's context providers fail.
2.  **Authenticated Route Optimization:** Mark the `(dashboard)` route group as `force-dynamic`. This acknowledges that dashboard pages require a user session and should not be statically prerendered at build time, eliminating "null context" errors.
3.  **Provider Hydration Guard:** Update `src/app/providers.tsx` and `src/lib/query/provider.tsx` to ensure that Client-side singletons (like QueryClient or Firebase instances) are not initialized during the server-side prerender pass.
4.  **Skills Page Restoration:** Restore the full functionality of the `dashboard/omnichannel/skills` page, resolving the specific `useContext` failure identified in its Tabs component.

## Non-Functional Requirements
1.  **Build Stability:** The primary goal is a successful `pnpm build` without errors.
2.  **Performance:** Maintain the performance benefits of Next.js by only using `force-dynamic` where semantically necessary (authenticated routes).
3.  **Strict Typing:** Ensure all fixes maintain TypeScript integrity.

## Acceptance Criteria
1.  `pnpm --filter frontend build` completes successfully.
2.  The Dashboard remains fully functional with all real-time features (WebSockets, Firestore Live) active.
3.  The `global-error.tsx` page correctly displays a fallback UI if a root-level crash occurs.
4.  No `useContext` or `useEffect` null-pointer exceptions appear in the build logs.

## Out of Scope
- Migrating the entire app to a different state management library.
- Redesigning the UI/UX of the dashboard.
