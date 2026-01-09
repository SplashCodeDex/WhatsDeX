---
description: Project coding standards and architectural rules for WhatsDeX
---

# WhatsDeX Project Rules

See [ARCHITECTURE.md](file:///w:/CodeDeX/WhatsDeX/frontend/ARCHITECTURE.md) for detailed architectural documentation.

## Tech Stack

- **Backend**: Node.js, Express, Baileys (WhatsApp)
- **Runtime**: `tsx` (TypeScript Execute) - **DO NOT use ts-node**
- **Frontend**: Next.js 14+, React, TypeScript
- **Database**: Firebase (Firestore) - **Native SDK Only (No Prisma/SQL)**
- **Styling**: Tailwind CSS

---

## 1. Version Control & Dependencies

### Strict Latest Version Policy

**CRITICAL**: All libraries, frameworks, utilities, and packages MUST be kept at their **latest stable versions**.

- **No Legacy Code**: Do not use deprecated or older versions of libraries (e.g., use ESLint 9+, not 8).
- **Regular Updates**: Run `npm update` regularly and check for major version upgrades.
- **Strict Adherence**: If a tool breaks due to an update, **fix the configuration** rather than downgrading the tool.

### Deep Research & Code Integrity

- **Thorough Investigation**: Hard-to-resolve issues must be solved through **deep research**, documentation analysis, and codebase investigation. Do not guess.
- **Verification**: ALWAYS run tests, lints, and builds to verify changes.
- **Code Preservation**: **NEVER** remove code, variables, or imports that are unrelated to your current task just to make a build pass. Fix the actual root cause.

---

## 2. Code Quality

### Linting

```bash
npm run lint        # ESLint check
npm run lint:fix    # Auto-fix issues
```

**Rules:**

- No `any` types in TypeScript (use `unknown` or proper types).
- **Error Handling**: In `catch` blocks, explicitly cast errors or use type guards (e.g., `catch (error: any)` or `if (error instanceof Error)`).
- No unused variables/imports.
- Prefer `const` over `let`.
- Use arrow functions for callbacks.
- Max line length: 100 characters.

### Type Checking

```bash
npm run typecheck   # TypeScript validation
```

**Rules:**

- All functions must have explicit return types.
- Props interfaces required for all components.
- No implicit `any` allowed.
- Use strict mode in `tsconfig.json`.

### Testing

```bash
npm run test        # Run all tests (Vitest)
npm run test:watch  # Watch mode
npm run test:cov    # Coverage report
```

**Rules:**

- **Runner**: Use `vitest` for both Backend and Frontend.
- Minimum 80% code coverage for new code.
- Unit tests for all utility functions and services.
- Integration tests for API endpoints.

### Build

```bash
npm run build       # Production build
npm run dev         # Development server (using tsx)
```

---

## 3. Data Layer (Firestore Native)

**Mandate**: Use the **Subcollection Pattern** for multi-tenancy.

- **Structure**: `tenants/{tenantId}/{collectionName}/{docId}`
- **Isolation**: All tenant-specific data (users, bots, settings) MUST live within the tenant's document hierarchy.
- **Service**: Use `FirebaseService` or `admin` SDK directly.
- **Prohibited**: Do not use SQL adapters, Prisma, or root-level collections for tenant data.

---

## 4. File Structure & Naming

### Naming Conventions

- **Components**: PascalCase (`UserProfile.tsx`)
- **Services (Files)**: camelCase (`userService.ts`)
- **Services (Classes)**: PascalCase (`UserService`)
- **Utils**: **STRICT** camelCase (`formatDate.ts`, `logger.ts`) - **NO PascalCase files in utils/**.
- **Hooks**: camelCase with `use` prefix (`useAuth.ts`)
- **Types**: PascalCase with suffix (`UserProps`, `AuthState`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_RETRIES`)

### Backend Structure

```
backend/
├── src/
│   ├── commands/          # Bot commands (categorized)
│   ├── handlers/          # Event handlers
│   ├── services/          # Business logic (Singleton Classes)
│   ├── utils/             # Utilities (camelCase only)
│   ├── types/             # Type definitions
│   └── lib/               # Core libraries
├── routes/                 # API routes
└── middleware/             # Express middleware
```

---

## 5. Path Handling & Aliases

### Unified Aliasing (Rule 17)

- **Mandatory**: ALWAYS use the `@/` alias for internal imports in BOTH Frontend and Backend.
- **Incorrect**: `import { Button } from '../../components/ui/button';`
- **Correct**: `import { Button } from '@/components/ui/button';`

### Extensions (Rule 16)

- **Backend (ESM)**: All relative imports MUST include the `.js` extension, even when using aliases.
- **Incorrect**: `import { cache } from '@/lib/cache';`
- **Correct**: `import { cache } from '@/lib/cache.js';`

### File System Paths

- **Project Root Access**: Use `path.join(process.cwd(), 'path/to/resource')` for accessing files relative to the project root.
- **Module Relative Access**: Use `import.meta.url` pattern.
