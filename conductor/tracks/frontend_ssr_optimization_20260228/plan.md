# Implementation Plan: Frontend SSR Optimization

## Phase 1: Context & Hook Normalization
- [x] **Task: Refactor `useAuth` for SSR Safety** ac07b9f
    - [x] Replace `window.location` with `usePathname`.
    - [x] Ensure all redirection logic is deferred to `useEffect`.
- [x] **Task: Standardize Root Providers** b0e0a14
    - [x] Remove the hydration guard (`if (!mounted)`) in `src/app/providers.tsx`.
    - [x] Update `ThemeProvider.tsx` to use React 19 `<Context value={...}>` syntax and provide a solid initial state.
- [x] **Task: Secure `QueryProvider` Hydration** 0a4ba69
    - [x] Ensure the `QueryClient` singleton is stable across the SSR/Hydration boundary.
- [ ] **Task: Conductor - User Manual Verification 'Phase 1: Context & Hook Normalization' (Protocol in workflow.md)**

## Phase 2: Performance Recovery
- [ ] **Task: Re-enable Next.js 16 Caching**
    - [ ] Update `next.config.ts` to set `cacheComponents: true`.
- [ ] **Task: Cleanup Static Isolation**
    - [ ] Remove `export const dynamic = 'force-dynamic'` from layout/page files.
    - [ ] Remove `DashboardClientWrapper.tsx` and integrate `DashboardShell.tsx` directly into the layout.
- [ ] **Task: Restore Full Page Logic**
    - [ ] Revert any temporary build-fix skeleton pages to their full implementations.
- [ ] **Task: Conductor - User Manual Verification 'Phase 2: Performance Recovery' (Protocol in workflow.md)**

## Phase 3: Final Build & Audit
- [ ] **Task: Comprehensive Build Verification**
    - [ ] Run `pnpm --filter frontend build`.
    - [ ] Verify that pages are correctly marked as Static/Dynamic in the build output.
- [ ] **Task: Conductor - User Manual Verification 'Phase 3: Final Build & Audit' (Protocol in workflow.md)**
