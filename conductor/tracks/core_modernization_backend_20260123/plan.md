# Implementation Plan - Core Modernization (Backend)

## Phase 1: CI/CD Infrastructure Modernization
- [x] Task: Update GitHub Actions Matrix [commit: 7174441]
    - Modify `.github/workflows/backend-ci.yml` to target Node.js versions `[24.x, 25.x]`.
    - Enable `npm ci --prefer-offline` and `setup-node@v4` built-in caching.
- [ ] Task: Implement Blocking Security Gate
    - Add `npm audit --audit-level=high` step to the CI workflow.
    - Ensure CI fails if vulnerabilities are found.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: CI/CD Infrastructure Modernization' (Protocol in workflow.md)

## Phase 2: LID Mapping & Unified Identity
- [ ] Task: TDD - LID Mapping Utility
    - Create `backend/src/lib/identity.test.ts`.
    - Write tests for converting LIDs to JIDs and handling mixed payloads.
    - Implement `convertLidToJid` utility in `backend/src/lib/identity.ts`.
- [ ] Task: TDD - Message Wrapper Update
    - Create/update tests for `backend/src/lib/simple.ts` to simulate LID-heavy payloads.
    - Refactor `simple.ts` to automatically map sender identities.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: LID Mapping & Unified Identity' (Protocol in workflow.md)

## Phase 3: Firestore Auth State Implementation
- [ ] Task: Context Analysis - Baileys Firestore Auth
    - Analyze existing `backend/src/lib/baileysFirestoreAuth.ts` (if stubbed) or research the required `AuthenticationState` interface for Baileys v7.
- [ ] Task: TDD - Firestore Auth Provider
    - Write unit tests for `baileysFirestoreAuth.ts` using a mocked Firestore.
    - Implement the full `AuthenticationState` lifecycle: `creds.update`, `keys.get`, `keys.set`.
- [ ] Task: Integration - Switch Bot Session Management
    - Refactor `multiTenantBotService.ts` to use `baileysFirestoreAuth` instead of `useMultiFileAuthState`.
    - Update `ConfigManager` to prioritize Firestore sessions.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Firestore Auth State Implementation' (Protocol in workflow.md)

## Phase 4: Final Cleanup & Decommissioning
- [ ] Task: File-Based Cleanup
    - Remove local `.session` file creation logic from `SessionManager.ts`.
    - Update `backend/.gitignore` to ignore the legacy `sessions/` directory.
- [ ] Task: Regression Testing
    - Run full backend test suite on Node 24.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Final Cleanup & Decommissioning' (Protocol in workflow.md)
