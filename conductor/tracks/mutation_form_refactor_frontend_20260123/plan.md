# Implementation Plan - Mutation & Form Refactor (Frontend)

## Phase 1: Foundation & Standard Type Definitions [checkpoint: c1d6d52]
- [x] Task: Context Analysis - Current Form States [commit: fc1366a]
- [x] Task: Standardize Action Result Type [commit: 3f3ab37]
    - Ensure `Result<T>` is exported from a shared location (e.g., `frontend/src/types/index.ts`).
- [x] Task: Conductor - User Manual Verification 'Phase 1: Foundation & Standard Type Definitions' (Protocol in workflow.md) [commit: c1d6d52]

## Phase 2: Auth Feature Refactor [checkpoint: 4d64ac7]
- [x] Task: Refactor Auth Server Actions [commit: b5fd9d4]
    - Update `features/auth/actions.ts` to return `Result<T>`.
- [x] Task: TDD - Login Form Refactor [commit: 7efc6ec]
    - Update/Create tests for `LoginForm.tsx` ensuring it uses `useActionState`.
    - Implement `useActionState` in `LoginForm.tsx` with inline error display.
- [x] Task: TDD - Register Form Refactor [commit: 22bf62e]
    - Update/Create tests for `RegisterForm.tsx`.
    - Implement `useActionState` in `RegisterForm.tsx`.
- [x] Task: TDD - Password Reset Forms Refactor [commit: a031e53]
    - Refactor `ForgotPasswordForm.tsx` and `ResetPasswordForm.tsx` to use `useActionState`.
    - Update `requestPasswordReset` and `resetPassword` action signatures.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Auth Feature Refactor' (Protocol in workflow.md) [checkpoint: 4d64ac7]

## Phase 3: Bot Management Feature Refactor [checkpoint: 87a08d8]
- [x] Task: Refactor Bot Server Actions [commit: cb66091]
    - Update `features/bots/actions.ts` to return `Result<T>`.
- [x] Task: TDD - Create Bot Form Refactor [commit: 118194c]
    - Update/Create tests for `CreateBotForm.tsx`.
    - Implement `useActionState` in `CreateBotForm.tsx`.
- [x] Task: TDD - Bot Settings Refactor [commit: 309f8da]
    - Implement `useActionState` for settings updates in `BotSettings.tsx`.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Bot Management Feature Refactor' (Protocol in workflow.md)

## Phase 4: Marketing & Billing Feature Refactor
- [x] Task: Refactor Campaign/Billing Server Actions [commit: 19a30d0]
    - Update relevant `actions.ts` in `features/campaigns` and `features/billing`.
- [~] Task: TDD - Form Refactors
    - Migrate remaining forms to `useActionState`.
- [ ] Task: Regression Testing & Cleanup
    - Run full frontend test suite.
    - Remove unused `useState` and `isLoading` legacy logic.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Marketing & Billing Feature Refactor' (Protocol in workflow.md)
