# Implementation Plan - Core Modernization (Backend)

## Phase 1: CI/CD Infrastructure Modernization [checkpoint: 26f7c52]
- [x] Task: Update GitHub Actions Matrix [commit: 7174441]
- [x] Task: Implement Blocking Security Gate [commit: bd6ee30]
- [x] Task: Conductor - User Manual Verification 'Phase 1: CI/CD Infrastructure Modernization' (Protocol in workflow.md) [commit: 26f7c52]

## Phase 2: LID Mapping & Unified Identity [checkpoint: 3f3ab37]
- [x] Task: TDD - LID Mapping Utility [commit: e3a3d4a]
- [x] Task: TDD - Message Wrapper Update [commit: 7720b1c]
- [x] Task: Conductor - User Manual Verification 'Phase 2: LID Mapping & Unified Identity' (Protocol in workflow.md) [commit: 3f3ab37]

## Phase 3: Firestore Auth State Implementation
- [~] Task: Context Analysis - Baileys Firestore Auth
    - Analyze existing `backend/src/lib/baileysFirestoreAuth.ts` (if stubbed) or research the required `AuthenticationState` interface for Baileys v7.
- [x] Task: TDD - Firestore Auth Provider [commit: e3a3d4a]
- [x] Task: Integration - Switch Bot Session Management [commit: 9ab7ae5]
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Firestore Auth State Implementation' (Protocol in workflow.md)

## Phase 4: Final Cleanup & Decommissioning
- [ ] Task: File-Based Cleanup
    - Remove local `.session` file creation logic from `SessionManager.ts`.
    - Update `backend/.gitignore` to ignore the legacy `sessions/` directory.
- [ ] Task: Regression Testing
    - Run full backend test suite on Node 24.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Final Cleanup & Decommissioning' (Protocol in workflow.md)
