# Specification: Refactor Codebase to Strict TypeScript and Service-Oriented Architecture

## 1. Overview

The goal of this track is to establish a robust, maintainable, and type-safe foundation for the WhatsDeX project. We will refactor the existing backend codebase to adhere to the strict architectural rules defined in `PROJECT_RULES.md` and `tech-stack.md`. This involves migrating from loose JavaScript/CommonJS to strict TypeScript, implementing Zod for runtime environment validation, and decoupling logic into a service-oriented architecture.

## 2. Objectives

- **Strict Typing:** Eliminate all `any` types and enforce strict TypeScript configuration.
- **Environment Validation:** Replace manual `process.env` checks with a centralized, Zod-validated configuration service.
- **Service Layer:** Refactor the current monolithic or scattered logic into dedicated, singleton-based services (e.g., `ConfigService`, `DatabaseService`).
- **Clean Architecture:** Ensure clear separation between Controllers, Services, and Data Access layers.
- **Testing:** Establish a testing harness to verify the refactoring.

## 3. Scope

### In Scope

- Refactoring `backend/src/config/config.ts` to use Zod.
- Creating a `ConfigService` singleton.
- Refactoring `backend/src/services` to follow the Service Template pattern.
- Updating `backend/tsconfig.json` to `strict: true`.
- Removing hardcoded strings and magic numbers.
- Adding unit tests for the new services.

### Out of Scope

- Frontend refactoring (this will be a separate track).
- Adding new product features (e.g., new bot commands).
- Changing the underlying database (Firebase) or external APIs (Baileys).

## 4. Requirements

### 4.1. Configuration Management

- **Requirement:** All environment variables must be validated at startup using `zod`.
- **Requirement:** The application must fail to start if required variables are missing or invalid.
- **Requirement:** Configuration must be accessed via a typed `ConfigService`, not direct `process.env` access.

### 4.2. Service Architecture

- **Requirement:** Business logic must be encapsulated in Service classes (e.g., `UserService`, `AuthService`).
- **Requirement:** Services must use Dependency Injection or Singleton patterns for testability.
- **Requirement:** Services must return typed responses and handle errors gracefully.

### 4.3. Code Quality

- **Requirement:** No `any` types allowed.
- **Requirement:** ESLint and Prettier must pass without warnings.
- **Requirement:** Unit tests must provide at least 80% coverage for the refactored modules.

## 5. Acceptance Criteria

- [ ] `npm run typecheck` passes with zero errors in the backend.
- [ ] `npm run lint` passes with zero errors.
- [ ] `npm test` passes for all new/refactored services.
- [ ] The application starts successfully with valid `.env` variables.
- [ ] The application crashes immediately with a descriptive error if `.env` is invalid.
