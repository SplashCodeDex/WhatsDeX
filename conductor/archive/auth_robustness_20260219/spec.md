# Specification: Auth Flow Robustness & State Preservation

## Overview
This track fixes critical UX bugs in the authentication flow where form data is lost on submission failure, checkboxes exhibit inconsistent visual states, and server actions crash due to undefined references. It also addresses a "non-animatable value" warning in the Auth Hero component.

## Functional Requirements

### 1. Form State Preservation
- **Preservation Logic:** Automatically re-populate fields from the last submission attempt (via `useActionState`) to prevent user frustration.
- **Affected Forms:** 
    - **Login:** Email, Remember Me.
    - **Register:** First Name, Last Name, Email, Accept Terms.
    - **Forgot Password:** Email.
- **Security Constraint:** Password fields **MUST** be cleared upon any submission attempt (success or failure).

### 2. Checkbox Component Reliability
- **State Sync:** Fix the `Checkbox` component to ensure internal state (`isChecked`) stays in sync with `defaultChecked` when server actions trigger a re-render.
- **Visual Feedback:** Ensure the "check" animation triggers correctly only when the value is actually true.

### 3. Server Action Fixes
- **Reference Errors:** Fix `signUp` in `actions.ts` where `firstName`, `lastName`, etc., are referenced before or outside their scope in error return blocks.
- **Payload Integrity:** Ensure the `fields` object returned in the `ActionResult` error details matches the expected schema of the forms.

### 4. Animation Fix
- **Hero Component:** Fix `AnimatedAuthHero.tsx` to use animatable color values (hex or rgb) instead of raw `oklch(var(--p))` strings which cause Framer Motion warnings/errors.

## Acceptance Criteria
- [ ] Submitting the Login form with an incorrect password preserves the email.
- [ ] Submitting the Registration form with errors preserves names and email.
- [ ] Checkboxes consistently reflect their value even after multiple failed submissions.
- [ ] Password fields are always empty after a failed submission attempt.
- [ ] Registration no longer throws `ReferenceError: firstName is not defined`.
- [ ] Console no longer shows "value not animatable" warnings for the Auth Hero.

## Out of Scope
- Changing the underlying authentication provider (Firebase).
- Redesigning the Auth UI layout.