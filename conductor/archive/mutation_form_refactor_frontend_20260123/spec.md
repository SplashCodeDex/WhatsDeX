# Track Spec: Mutation & Form Refactor (Frontend)

## Overview
This track focuses on modernizing the frontend mutation layer to align with React 19 and our 2026 Mastermind standards. We will migrate all frontend forms from legacy state management to the `useActionState` hook and ensure all Server Actions return a standardized `Result<T>` type. This will provide a more robust, type-safe, and predictable user experience during data mutations.

## Functional Requirements
- **Standardize Server Actions**: Refactor all Server Actions in `features/*/actions.ts` to return the functional `Result<T>` type (`{ success: true, data: T } | { success: false, error: AppError }`).
- **Migrate to `useActionState`**: Update all form components (Auth, Bot Management, Marketing, Billing) to use the React 19 `useActionState` hook for handling submissions, loading states, and result data.
- **Inline Error Handling**: Implement a standardized pattern for displaying Zod validation errors and server errors inline within the forms, rather than relying solely on global toasts.
- **Direct Component Integration**: Implement the `useActionState` logic directly within each feature component to allow for granular control over local UI state.

## Non-Functional Requirements
- **FSD Integrity**: Maintain strict separation between `features/` logic and `components/ui` primitives.
- **Type Safety**: All form states and action results must be strictly typed using Zod schemas.
- **Performance**: Leverage React 19's automatic transition handling provided by `useActionState` to ensure smooth UI updates.

## Acceptance Criteria
- [ ] All forms in the `auth`, `bots`, `campaigns`, and `billing` features use `useActionState`.
- [ ] Server Actions return consistent `Result<T>` objects.
- [ ] Validation errors are displayed inline below the respective form fields.
- [ ] No manual `isLoading` state variables are used for form submissions (managed by `isPending` from `useActionState`).

## Out of Scope
- Creating a global wrapper hook for forms (direct implementation per component was selected).
- Refactoring backend service logic (this track focus is purely on the Action -> UI bridge).
