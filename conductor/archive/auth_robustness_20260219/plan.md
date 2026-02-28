# Implementation Plan: Auth Flow Robustness & State Preservation

## Phase 1: Foundation & Action Fixes
Focus on fixing the server-side crashes and ensuring the data payload returned to the frontend is correct and complete.

- [x] Task: Fix `ReferenceError` in `signUp` server action.
- [x] Task: Audit `signIn` and `signUp` actions to ensure all raw fields are returned in the `fields` object on error.
- [x] Task: Add unit tests for `signIn` and `signUp` actions to verify field preservation in error payloads.
- [x] Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md)

## Phase 2: UI Component Reliability
Fix the `Checkbox` component's state synchronization and address the animation warnings in the Auth Hero.

- [x] Task: Refactor `Checkbox.tsx` to use `key` or `useEffect` to force state synchronization when `defaultChecked` changes.
- [x] Task: Fix non-animatable `oklch` values in `AnimatedAuthHero.tsx` by using standard hex/rgb or theme-safe CSS variables.
- [x] Task: Create a storybook-style test page or unit tests for `Checkbox` to verify state persistence across re-renders.
- [x] Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)

## Phase 3: Form Integration & Verification
Wire up the forms to the corrected actions and verify the end-to-end user experience.

- [x] Task: Update `LoginForm.tsx` to ensure `PasswordInput` is always cleared/reset on failure while other fields persist.
- [x] Task: Update `RegisterForm.tsx` to ensure `PasswordInput` is always cleared/reset on failure while other fields persist.
- [x] Task: Update `ForgotPasswordForm.tsx` to implement field preservation for the email input.
- [x] Task: Perform a full manual audit of the Login -> Register -> Forgot Password flow.
- [x] Task: Conductor - User Manual Verification 'Phase 3' (Protocol in workflow.md)
