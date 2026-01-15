# Track Plan: System Stabilization & Core Wiring

## Phase 1: Frontend Registration Audit & Fix

- [~] Task: Audit `app/(auth)/register/page.tsx` and `features/auth/components/RegisterForm.tsx`.
  - [ ] Subtask: Verify Zod schema definition matches backend requirements.
  - [ ] Subtask: Ensure Server Action (`features/auth/actions.ts`) handles API communication correctly.
- [ ] Task: Wire Frontend to Backend.
  - [ ] Subtask: Verify `lib/apiClient.ts` (or equivalent) is correctly configured to hit the backend URL.
  - [ ] Subtask: Implement/Fix the `register` Server Action to call the Backend API.

## Phase 2: Backend Tenant Initialization

- [ ] Task: Audit `backend/src/controllers/authController.ts`.
  - [ ] Subtask: Ensure it uses the Result Pattern and Zod validation for `req.body`.
- [ ] Task: Fix `backend/src/services/multiTenantService.ts`.
  - [ ] Subtask: Implement `createTenant` method if missing or broken.
  - [ ] Subtask: Ensure atomic creation of Firestore subcollections (`users`, `settings`).
- [ ] Task: Verify Firestore Security Rules.
  - [ ] Subtask: Ensure rules allow creation/read for the authenticated user.

## Phase 3: Session & Dashboard Wiring

- [ ] Task: Audit Session Management.
  - [ ] Subtask: Check how the token is stored/passed (Cookie vs Header).
  - [ ] Subtask: Verify Backend `authMiddleware` correctly parses the token.
- [ ] Task: Fix Dashboard Entry (`app/(dashboard)/page.tsx`).
  - [ ] Subtask: Ensure it fetches initial data using a Server Component.
  - [ ] Subtask: Handle "Empty State" (no bots yet) gracefully.

## Phase 4: End-to-End Verification

- [ ] Task: Manual Verification Run.
  - [ ] Subtask: Clear local DB/Auth (if possible).
  - [ ] Subtask: Perform full signup flow.
  - [ ] Subtask: Verify Firestore data integrity.
