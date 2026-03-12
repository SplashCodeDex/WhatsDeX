# Implementation Plan: System Health & Technical Debt Remediation

## Phase 1: Frontend Type-Check & Lint Fixes
Goal: Restore frontend build stability.

- [ ] Task: Fix Frontend Type Errors
    - [ ] Fix duplicate `Result` and `TenantSettings` exports in `frontend/src/types/index.ts`.
    - [ ] Add `fetchSessions` to `useOmnichannelStore` and ensure all used actions are declared.
    - [ ] Fix `Terminal` icon import in `LogsPage.tsx`.
    - [ ] Fix `toggleSkill` argument count in `AgentsDashboard.tsx`.
    - [ ] Resolve `firstName` undefined check in `HomeFeature.tsx`.
- [ ] Task: Resolve Frontend ESLint Crash
    - [ ] Investigate `minimatch` export error in `eslint-config`.
    - [ ] Update dependencies or config to fix ESM compatibility.
- [ ] Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md)

## Phase 2: OpenClaw Import Refactoring
Goal: Satisfy ESM requirements for the shared engine.

- [ ] Task: Replace `.ts` extensions in imports
    - [ ] Run a global search and replace in `openclaw/src/` to change `from ".../*.ts"` to `from ".../*.js"`.
    - [ ] Verify `openclaw` internal type-checks pass.
- [ ] Task: Fix Windows Build Scripts
    - [ ] Replace `bash scripts/bundle-a2ui.sh` with a Node-based equivalent or cross-platform command.
- [ ] Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)

## Phase 3: Backend Remediation
Goal: Eliminate backend type errors and resolve missing service logic.

- [ ] Task: Fix Backend Controller Type Mismatches
    - [ ] Ensure `tenantId` and `id` are cast to `string` in `automationController.ts` and `webhookController.ts`.
- [ ] Task: Implement Missing MultiTenantService methods
    - [ ] Add `canAddBot` to `MultiTenantService`.
- [ ] Task: Fix OpenClaw Adapter Imports
    - [ ] Verify exports in `openclaw/src/index.ts` match backend expectations (e.g., `sendMessageIMessage`).
- [ ] Task: Conductor - User Manual Verification 'Phase 3' (Protocol in workflow.md)
