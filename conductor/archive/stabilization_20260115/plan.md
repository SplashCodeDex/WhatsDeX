# Track Plan: System Stabilization & Core Wiring

## Phase 1: Frontend Registration Audit & Fix

- [x] Task: Audit `app/(auth)/register/page.tsx` and `features/auth/components/RegisterForm.tsx`.
  - [x] Subtask: Verify Zod schema definition matches backend requirements.
  - [x] Subtask: Ensure Server Action (`features/auth/actions.ts`) handles API communication correctly.
- [x] Task: Wire Frontend to Backend.
  - [x] Subtask: Verify `lib/apiClient.ts` (or equivalent) is correctly configured to hit the backend URL.
  - [x] Subtask: Implement/Fix the `register` Server Action to call the Backend API.

## Phase 2: Backend Tenant Initialization

- [x] Task: Audit `backend/src/controllers/authController.ts`.
  - [x] Subtask: Ensure it uses the Result Pattern and Zod validation for `req.body`.
- [x] Task: Fix `backend/src/services/multiTenantService.ts`.
  - [x] Subtask: Implement `createTenant` method if missing or broken.
  - [x] Subtask: Ensure atomic creation of Firestore subcollections (`users`, `settings`).
- [x] Task: Verify Firestore Security Rules.
  - [x] Subtask: Ensure rules allow creation/read for the authenticated user.

## Phase 3: Session & Dashboard Wiring

- [x] Task: Audit Session Management.
  - [x] Subtask: Check how the token is stored/passed (Cookie vs Header).
  - [x] Subtask: Verify Backend `authMiddleware` correctly parses the token.
- [x] Task: Fix Dashboard Entry (`app/(dashboard)/page.tsx`).
  - [x] Subtask: Ensure it fetches initial data using a Server Component.
  - [x] Subtask: Handle "Empty State" (no bots yet) gracefully.

## Phase 4: End-to-End Verification

- [x] Task: Manual Verification Run.
  - [x] Subtask: Clear local DB/Auth (if possible).
  - [x] Subtask: Perform full signup flow.
  - [x] Subtask: Verify Firestore data integrity.
