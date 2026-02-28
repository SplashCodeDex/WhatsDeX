# Track Specification: System Stabilization & Core Wiring (Auth -> Dashboard)

## 1. Objective

To systematically audit, fix, and "wire up" the core application flow, ensuring that a user can successfully register, have their tenant environment initialized on the backend, and access a fully functional dashboard. This track addresses potential broken logic, disconnected APIs, and standardizes the code according to the "2026 Mastermind" rules.

## 2. Context

The project is a "Brownfield" monorepo with a Next.js frontend and Express backend. While the architecture is defined, the actual "wiring" between the frontend auth forms, the backend tenant services, and the database (Firestore) needs verification and stabilization. We are starting "from scratch" in terms of validating the user journey.

## 3. Requirements

### 3.1 Registration & Authentication

- **Frontend**: The Registration page (`app/(auth)/register/page.tsx`) must use a Zod-validated form.
- **API**: The frontend must successfully call the backend registration endpoint.
- **Backend**: The `authController` and `multiTenantService` must coordinate to:
  1. Create the Firebase Auth user.
  2. Initialize the `tenants/{tenantId}` document in Firestore.
  3. Initialize subcollections (`users`, `settings`) with default data.
- **Error Handling**: Any failure in this chain must return a clean error to the UI (Result Pattern).

### 3.2 Session & Dashboard Handoff

- **Session**: The frontend must correctly manage the session token and pass it to the backend for authenticated requests.
- **Middleware**: Backend `authMiddleware` must correctly verify the token and inject the `tenantId` into the request context.
- **Dashboard**: The Dashboard Shell (`app/(dashboard)/layout.tsx`) must fetch the initial user/tenant data without 404/500 errors.

### 3.3 Code Standards (Refactoring)

- **Zod-First**: All inputs (forms, API bodies) must be parsed with Zod.
- **Strict Types**: No `any` types. All service methods must return typed Results.

## 4. Acceptance Criteria

- [ ] A new user can sign up via the UI.
- [ ] The Firestore database shows a new `tenants/{id}` document with correct default settings.
- [ ] The user is automatically redirected to `/dashboard`.
- [ ] The Dashboard loads user details (e.g., "Welcome, [Name]") without console errors.
- [ ] `npm run typecheck` passes for all touched files.
