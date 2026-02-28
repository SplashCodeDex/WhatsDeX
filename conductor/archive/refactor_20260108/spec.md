# Specification: Full Firebase Migration and Backend Refactoring

## 1. Overview

Transition the WhatsDeX backend from its current hybrid/placeholder state to a 100% Firebase-native architecture. This track eliminates Prisma/PostgreSQL technical debt, enforces strict TypeScript, and implements a secure, subcollection-based multi-tenant data structure in Firestore.

## 2. Functional Requirements

- **Data Isolation (Multi-Tenancy):** Implement a strict hierarchy where all tenant-specific data (bots, settings, analytics) is stored in subcollections: `tenants/{tenantId}/{collectionName}`.
- **Unified Authentication:** Integrate Firebase Authentication as the primary identity provider, replacing the custom JWT placeholders.
- **Persistent Bot Management:** Store bot connection metadata and session information in Firestore using the specialized Firebase adapter for Baileys.
- **Service-Oriented Logic:** Complete the migration of all business logic into dedicated, singleton services that consume the `ConfigService` and the new `FirebaseService`.

## 3. Non-Functional Requirements

- **No Simulation:** All service placeholders (marked with 🔥) must be replaced with real, production-ready implementation logic.
- **Strict Type Safety:** Resolve the remaining TypeScript errors by providing explicit interfaces for all Firestore documents and service responses.
- **Maintainability:** Standardize on `.ts` files and Rule 16 import extensions.

## 4. Scope

### In Scope

- Uninstalling Prisma dependencies and removing all Prisma artifacts (`schema.prisma`, `prisma.ts`, etc.).
- Implementing the `FirebaseService` (Firestore + Auth interaction).
- Refactoring `multiTenantService.ts`, `botService.ts`, and `userService.ts` to use Firestore subcollections.
- Updating Authentication middleware to verify Firebase tokens.
- Fixing all TypeScript errors in the refactored files.

### Out of Scope

- Frontend UI changes (beyond fixing API connection points).
- Third-party API integrations (Stripe, Gemini) beyond their configuration validation.

## 5. Acceptance Criteria

- [ ] `npm run typecheck` passes for all core backend services.
- [ ] No Prisma-related files or dependencies remain in the backend.
- [ ] Firestore data is correctly siloed using the `tenants/{tenantId}/...` pattern.
- [ ] The application starts and initializes Firebase Admin successfully using the `ConfigService`.
