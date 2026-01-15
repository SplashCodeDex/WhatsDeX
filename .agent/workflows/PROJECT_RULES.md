---
description: Project coding standards and architectural rules for WhatsDeX
---

# WhatsDeX Project Rules (2026 Mastermind Edition)

See [ARCHITECTURE.md](file:///w:/CodeDeX/WhatsDeX/frontend/ARCHITECTURE.md) for detailed architectural documentation.

## Tech Stack

- **Backend**: Node.js 24+, Express, Baileys (WhatsApp)
- **Runtime**: `tsx` (TypeScript Execute) - **STRICT: DO NOT use ts-node**
- **Frontend**: Next.js 15+, React 19, TypeScript 5.7+
- **Database**: Firebase (Firestore) - **Subcollection Multi-Tenancy Pattern**
- **Validation**: Zod (Mandatory for all IO)
- **Observability**: OpenTelemetry (Tracing/Metrics)

---

## 1. Zero-Trust Data Layer (Zod-First)

**CRITICAL**: Every interaction with external data (Firestore, API, User Input) MUST be validated via Zod.

- **Firestore Contracts**: Define a Zod schema for every collection. Use `schema.parse(doc.data())` on read.
- **API Contracts**: Use Zod for `req.body` and `req.query`. 
- **Type Casting**: NEVER use `as Type`. Use `schema.parse()` to guarantee the type at runtime.

---

## 2. Code Quality & Logic

### Robust Error Handling (The Result Pattern)

- **Prefer Results over Throws**: Service methods should return `{ success: true, data: T } | { success: false, error: AppError }`.
- **Catch Policy**: In `catch` blocks, use `if (error instanceof Error)` or `const err = ZodError.from(error)`.
- **Global Handler**: The `errorHandler.ts` must log via `logger.security()` or `logger.performance()` depending on context.

### Type Safety

- **No `any` or `unknown` leakage**: `unknown` is only for the entry point of a catch block. It must be narrowed immediately.
- **Explicit Returns**: All exported functions and service methods MUST have an explicit return type.
- **Const Everything**: Use `readonly` for interfaces and `as const` for literals.

---

## 3. Data Layer (Firestore Native)

**Mandate**: Use the **Subcollection Pattern** for multi-tenancy.

- **Hierarchy**: `tenants/{tenantId}/{collectionName}/{docId}`
- **Security**: Rules must enforce `request.auth.uid` matches the tenant ownership.
- **Atomic Operations**: Use `writeBatch` for multi-document updates.

---

## 4. File Structure & Naming (Strict ESM)

### Naming Conventions

- **Components**: PascalCase (`UserProfile.tsx`)
- **Services/Utils**: camelCase (`userService.ts`, `logger.ts`)
- **Classes**: PascalCase (`UserService`)
- **Folders**: kebab-case (`ai-chat`, `group-management`)

### ESM Integrity (Rule 16)

- **Mandatory Extensions**: All relative imports MUST include the `.js` extension.
- **Module Resolution**: Use `@/` alias for all internal source paths.

---

## 5. Performance & Automation

- **Memoization**: Cache AI responses and expensive Firestore reads using the `CacheService` (Redis/Memory).
- **Traces**: Every bot command must start an OpenTelemetry span.
- **Automation**: If a task is repeated 3 times (e.g., fixing imports), **write a script** in `backend/scripts/` to automate it.

---

## 6. Continuous Evolution & Standards

**Mandate**: New practices must be codified before widespread adoption.

- **Documentation First**: Any well-researched best practice, logic, or feature pattern (2026 standards) introduced into this project MUST be clearly stated in these rules to guide and shape all future work.
- **Foundation Solidity**: We do not implement "hidden" patterns. If it's a standard, it belongs here.

---

## 7. Testing Strategy (Confidence-First)

**Mandate**: All logic must be verifiable without starting the full bot.

- **Co-location**: Unit tests (`*.test.ts`) MUST reside next to the source file they test. `__tests__/` is reserved for integration/E2E suites only.
- **The "Confidence Gate"**: Type-checking (`npm run typecheck`) and unit tests (`npm run test:run`) MUST pass before code is considered "commit-ready".
- **Mocking Policy**: 
    - Mock external I/O (Firebase, Baileys, Stripe, Redis).
    - NEVER mock internal logic or utility functions. Test with real data structures.
- **Zero-Error Policy**: Tests must not only pass but must not emit console warnings (e.g., unhandled rejections).
- **Critical Path Coverage**: Auth, Payments, and Multi-Tenant routing require mandatory coverage of all logical branches.