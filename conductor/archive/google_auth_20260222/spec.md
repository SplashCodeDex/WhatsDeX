# Track Spec: Google Login/Signup Functional Implementation

## 1. Overview
This track implements a secure, functional Google Authentication flow for WhatsDeX using Next.js 16 Server Actions and the Firebase Admin SDK. The goal is to provide a seamless "one-click" onboarding experience while maintaining strict multi-tenancy isolation and backend-driven session management.

## 2. Functional Requirements
- **Google OAuth Handshake:** Implement a frontend "Sign in with Google" button using the Firebase Client SDK.
- **Hybrid Token Hand-off:** The frontend must obtain an `idToken` from Google and pass it to a Next.js Server Action for validation.
- **Backend Verification:** The `authSystem.ts` service must use `firebase-admin` to verify the `idToken` and extract the user's profile (name, email, UID).
- **Multi-Tenant Auto-Initialization:** 
    - For new users, automatically create a default "Personal Workspace" in Firestore using the subcollection pattern.
    - Initialize a `tenantConfig` and a `userService` record for the new user.
- **Conflict Management:** If a Google signup uses an email address already associated with an existing account (e.g., Email/Password), the system must block the login and display a clear security alert.
- **Session Management:** Securely handle the authenticated state across the frontend `(auth)` and `(dashboard)` route groups.

## 3. Technical Implementation (Option B)
- **Frontend:** React 19 Client Component with `signInWithPopup`.
- **Server-Side:** Next.js Server Action invoking `backend/src/services/authSystem.ts`.
- **Validation:** Use Zod for all authentication payload validation.
- **Middleware:** Update `middleware.ts` to protect dashboard routes and handle redirects based on the new auth state.

## 4. Acceptance Criteria
- [ ] User can click "Sign in with Google" and complete the OAuth flow.
- [ ] New users are automatically provisioned with a workspace and redirected to the dashboard.
- [ ] Existing users are correctly logged into their existing workspace.
- [ ] Attempting to sign in with a Google email that already exists as an Email/Password account results in a specific error message.
- [ ] All session logic works across page refreshes.

## 5. Out of Scope
- Implementing other OAuth providers (GitHub, Apple, etc.) at this stage.
- Custom onboarding UI for workspace naming (handled via auto-creation).
- SMS-based authentication.
