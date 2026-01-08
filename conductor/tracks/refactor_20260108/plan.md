# Implementation Plan - Full Firebase Migration and Backend Refactoring

## Phase 1: Technical Debt Removal & Firebase Core

- [x] Task: Remove Prisma Technical Debt [commit: 9cc6b09]
  - [ ] Sub-task: Uninstall `@prisma/client` and `prisma` dependencies from backend.
  - [ ] Sub-task: Delete `backend/src/lib/prisma.ts` and any remaining `.prisma` files or migrations.
- [x] Task: Harden Firebase Initialization [commit: 8b69ed5]
- [x] Task: Conductor - User Manual Verification 'Technical Debt Removal & Firebase Core' (Protocol in workflow.md) [checkpoint: 8b69ed5]

## Phase 2: Multi-Tenant Data Layer

- [x] Task: Define Firestore Schema Types [commit: cd11b87]
  - [ ] Sub-task: Create `backend/src/types/firestore.ts` with strict interfaces for `Tenant`, `User`, and `Bot` documents.
- [ ] Task: Implement Centralized Firebase Service
  - [ ] Sub-task: Write Tests: Create tests for subcollection path generation and generic Firestore CRUD operations.
  - [ ] Sub-task: Implement Feature: Create `backend/src/services/FirebaseService.ts` to handle subcollection logic: `tenants/{tenantId}/{collection}`.
- [ ] Task: Conductor - User Manual Verification 'Multi-Tenant Data Layer' (Protocol in workflow.md)

## Phase 3: Service Layer Migration (Firestore Native)

- [ ] Task: Migrate User & Tenant Services
  - [ ] Sub-task: Write Tests: Mock Firestore to test `userService.ts` and `multiTenantService.ts`.
  - [ ] Sub-task: Implement Feature: Refactor `userService.ts` and `multiTenantService.ts` to use `tenants/{tenantId}/users` and `tenants/{tenantId}/metadata`.
- [ ] Task: Migrate Bot Instance Management
  - [ ] Sub-task: Write Tests: Test `botService.ts` lifecycle logic with Firestore mocks.
  - [ ] Sub-task: Implement Feature: Refactor `multiTenantBotService.ts` to store bot status and connection info in `tenants/{tenantId}/bots`.
- [ ] Task: Conductor - User Manual Verification 'Service Layer Migration (Firestore Native)' (Protocol in workflow.md)

## Phase 4: Authentication & Validation

- [ ] Task: Integrate Firebase Auth Middleware
  - [ ] Sub-task: Write Tests: Test `authMiddleware.ts` with valid/invalid Firebase tokens.
  - [ ] Sub-task: Implement Feature: Refactor `authMiddleware.ts` to use `admin.auth().verifyIdToken()` instead of custom JWT.
- [ ] Task: Global Type Safety & Final Polish
  - [ ] Sub-task: Resolve remaining `tsc` errors in `backend/src/services` and `backend/src/controllers`.
  - [ ] Sub-task: Run `npm run lint:fix` and verify sanity tests.
- [ ] Task: Conductor - User Manual Verification 'Authentication & Validation' (Protocol in workflow.md)
