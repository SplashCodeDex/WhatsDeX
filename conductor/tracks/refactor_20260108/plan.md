# Implementation Plan - Refactor Codebase to Strict TypeScript and Service-Oriented Architecture

## Phase 1: Environment & Configuration Hardening

- [x] Task: Install Validation Dependencies [commit: d108714]
  - [ ] Sub-task: Install `zod` and `dotenv` in backend.
- [x] Task: Create ConfigService [commit: 16ff979]
  - [ ] Sub-task: Write Tests: Create `backend/src/services/__tests__/ConfigService.test.ts` to test Zod validation logic (success/failure cases).
  - [ ] Sub-task: Implement Feature: Create `backend/src/config/env.schema.ts` to define the Zod schema for all env variables.
  - [ ] Sub-task: Implement Feature: Create `backend/src/services/ConfigService.ts` as a singleton that validates env vars on instantiation and exposes typed getters.
- [ ] Task: Refactor Main Entry Point
  - [ ] Sub-task: Update `backend/src/main.ts` (or `index.ts`) to initialize `ConfigService` before any other logic.
- [ ] Task: Conductor - User Manual Verification 'Environment & Configuration Hardening' (Protocol in workflow.md)

## Phase 2: Service Layer Migration

- [ ] Task: Refactor Database Service
  - [ ] Sub-task: Write Tests: Create `backend/src/services/__tests__/DatabaseService.test.ts`.
  - [ ] Sub-task: Implement Feature: Create `backend/src/services/DatabaseService.ts` to encapsulate Firebase/Firestore logic, using `ConfigService` for credentials.
- [ ] Task: Refactor Core Bot Logic (Baileys)
  - [ ] Sub-task: Write Tests: Create tests for Bot connection logic (mocking the socket).
  - [ ] Sub-task: Implement Feature: Create `backend/src/services/WhatsAppService.ts` to manage the Baileys socket connection, delegating events to handlers.
- [ ] Task: Conductor - User Manual Verification 'Service Layer Migration' (Protocol in workflow.md)

## Phase 3: Cleanup & Strict Mode Enforcement

- [ ] Task: Enforce Strict TypeScript
  - [ ] Sub-task: Update `backend/tsconfig.json` to set `strict: true`, `noImplicitAny: true`, etc.
  - [ ] Sub-task: Run `tsc` and fix all resulting type errors across the backend codebase.
- [ ] Task: Final Polish
  - [ ] Sub-task: Remove old configuration files (e.g., `backend/src/config/config.js`).
  - [ ] Sub-task: Run `npm run lint:fix` to ensure code style compliance.
- [ ] Task: Conductor - User Manual Verification 'Cleanup & Strict Mode Enforcement' (Protocol in workflow.md)
