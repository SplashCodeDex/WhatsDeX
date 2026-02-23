# Implementation Plan: Google Login/Signup Functional Implementation

## Phase 1: Environment & Backend Foundation
*Goal: Ensure Firebase Admin is correctly configured and initialized for token verification.*

- [x] Task: Verify Firebase Admin Configuration (check service account and env vars)
- [x] Task: TDD - `FirebaseService.ts` extension for Auth verification
    - [x] Write failing tests for `verifyIdToken` in `FirebaseService.test.ts` (Red)
    - [x] Implement `verifyIdToken` wrapper in `FirebaseService.ts` (Green)
    - [x] Refactor and verify (Refactor)
- [x] Task: Conductor - User Manual Verification 'Phase 1: Environment & Backend Foundation' (Protocol in workflow.md)

## Phase 2: Core Auth Logic & Multi-Tenancy (Backend)
*Goal: Implement the backend logic for verifying tokens and auto-creating workspaces.*

- [ ] Task: TDD - `authSystem.ts` Google Login logic
    - [ ] Write failing tests in `authSystem.test.ts` for `loginWithGoogle` (Red)
    - [ ] Implement `loginWithGoogle` in `authSystem.ts` (Green)
    - [ ] Implement Email Conflict check (Option B) in `authSystem.ts` (Green)
    - [ ] Refactor and verify (Refactor)
- [ ] Task: TDD - Workspace Auto-Initialization
    - [ ] Write failing tests in `multiTenantService.test.ts` for auto-creation (Red)
    - [ ] Implement `initializePersonalWorkspace` logic in `multiTenantService.ts` (Green)
    - [ ] Refactor and verify (Refactor)
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Core Auth Logic & Multi-Tenancy (Backend)' (Protocol in workflow.md)

## Phase 3: Frontend Hand-off & Server Actions
*Goal: Implement the UI button and the Server Action to bridge client and server.*

- [ ] Task: TDD - Auth Server Action
    - [ ] Write failing tests for `googleAuthAction` (Red)
    - [ ] Implement `googleAuthAction` using the Result Pattern (Green)
    - [ ] Refactor and verify (Refactor)
- [ ] Task: TDD - Google Sign-In Button Component
    - [ ] Write failing tests for the `GoogleSignInButton` component in `frontend` (Red)
    - [ ] Implement component using Firebase Client SDK and `useActionState` (Green)
    - [ ] Refactor and verify (Refactor)
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Frontend Hand-off & Server Actions' (Protocol in workflow.md)

## Phase 4: Middleware & Final Integration
*Goal: Secure the dashboard and handle redirects based on the new auth state.*

- [ ] Task: TDD - Middleware Route Protection
    - [ ] Write failing tests for dashboard access without session (Red)
    - [ ] Update `middleware.ts` to handle the new session cookie/token (Green)
    - [ ] Refactor and verify (Refactor)
- [ ] Task: End-to-End Verification of the Login Flow
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Middleware & Final Integration' (Protocol in workflow.md)
