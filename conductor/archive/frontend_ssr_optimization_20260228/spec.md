# Specification: Frontend SSR Optimization & Build Stabilization

## Overview
This track refactors the root architecture to be fully **SSR-safe**, enabling high-performance **Partial Prerendering (PPR)** and resolving build failures by aligning with React 19 standards.

## Functional Requirements
1.  **Normalize `useAuth`**: Remove all direct `window` or `document` access. Use `usePathname` and `useRouter` from `next/navigation`. Move redirection logic strictly into `useEffect`.
2.  **Enable Persistent Rendering**: Remove the `mounted` guard from `src/app/providers.tsx`. All providers must be active during the server-side pass.
3.  **SSR-Safe Contexts**: Update all contexts (`Theme`, `Auth`, `Query`) to provide safe, empty default values that match the server pass to prevent hydration mismatches.
4.  **Re-enable High-Performance Mode**: Re-enable `cacheComponents: true` in `next.config.ts` and remove `force-dynamic` from the dashboard.
5.  **React 19 Modernization**: Update provider syntax to use `<Context value={...}>` as recommended in the React 19 documentation.

## Acceptance Criteria
1.  `pnpm build` completes successfully with `cacheComponents: true`.
2.  No "Hydration Mismatch" warnings appear in the browser console.
3.  The app loads instantly without a "flash of loading state" (Skeleton) for the entire shell.
