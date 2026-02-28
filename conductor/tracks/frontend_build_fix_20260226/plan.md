# Implementation Plan: Resolve Systemic Frontend Build Failures

## Phase 1: Root Architecture Stabilization
- [ ] **Task: Refactor Global Error Boundary**
    - [ ] Rewrite `src/app/global-error.tsx` as a minimal, dependency-free React component.
    - [ ] Remove all complex provider dependencies from the global error page.
- [ ] **Task: Secure Provider Initialization**
    - [ ] Update `src/lib/query/provider.tsx` to use a singleton pattern that is safe for both SSR and Hydration.
    - [ ] Update `src/app/providers.tsx` to ensure all child providers are wrapped in a single `'use client'` entry point.
- [ ] **Task: Conductor - User Manual Verification 'Phase 1: Root Architecture Stabilization' (Protocol in workflow.md)**

## Phase 2: Route Rendering Strategy
- [ ] **Task: Configure Dynamic Dashboard Routes**
    - [ ] Add `export const dynamic = 'force-dynamic'` to the root layout of the `(dashboard)` group.
    - [ ] Verify that this bypasses static prerendering for all authenticated sub-pages.
- [ ] **Task: Restore Skills Page**
    - [ ] Re-enable the full `SkillsStorePage` component in `src/app/(dashboard)/dashboard/omnichannel/skills/page.tsx`.
    - [ ] Verify that the `Tabs` and `useContext` errors are resolved.
- [ ] **Task: Conductor - User Manual Verification 'Phase 2: Route Rendering Strategy' (Protocol in workflow.md)**

## Phase 3: Final Build & Validation
- [ ] **Task: Comprehensive Build Verification**
    - [ ] Run `pnpm --filter frontend typecheck`.
    - [ ] Run `pnpm --filter frontend build`.
    - [ ] Address any remaining "Key" prop warnings or hydration mismatches identified in logs.
- [ ] **Task: Final System Verification**
    - [ ] Manually verify dashboard navigation and real-time data updates in dev mode.
- [ ] **Task: Conductor - User Manual Verification 'Phase 3: Final Build & Validation' (Protocol in workflow.md)**
