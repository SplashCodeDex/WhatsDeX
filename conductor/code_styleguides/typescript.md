# TypeScript Style Guide (2026 Edition)

> **Stack**: TypeScript 5.9 | Node.js 24 | Express 5

## 1. Type Safety & Integrity

### Strict Mode
- **Mandatory**: `strict: true` in `tsconfig.json`.
- **No `any`**: Use `unknown` and narrow types using Zod or type guards.
- **Explicit Returns**: All exported functions and service methods MUST have explicit return types.

### Literal Types
- Use `as const` for fixed string/number sets.
- Use `readonly` for interfaces and arrays where mutation is not required.

## 2. Robust Error Handling (The Result Pattern)

We avoid throwing exceptions for expected failures. Instead, we use the Result Pattern.

```typescript
type Result<T, E = AppError> = 
  | { success: true; data: T } 
  | { success: false; error: E };

// Usage
async function getUser(id: string): Promise<Result<User>> {
  const user = await db.users.find(id);
  if (!user) return { success: false, error: new NotFoundError('User not found') };
  return { success: true, data: user };
}
```

## 3. Strict ESM & Module Resolution

We follow Rule 16 for ESM integrity.

- **Mandatory Extensions**: Every relative import MUST include the `.js` extension (even for `.ts` files).
  - ✅ `import { logger } from './utils/logger.js';`
  - ❌ `import { logger } from './utils/logger';`
- **Aliases**: Use `@/` alias for internal paths.

## 4. Backend Patterns

### Zero-Trust Data Layer (Zod-First)
Every external input (API, DB, Env) must be parsed by Zod before use.
```typescript
const user = UserSchema.parse(await db.get(id));
```

### Thin Controllers
Controllers should only:
1. Parse/Validate input using Zod.
2. Call a Service method.
3. Map the Result to an HTTP response.

## 5. Testing (2026 Standard)

### Native Test Runner
For backend logic, we prefer the Node.js native test runner (`node --test`) for speed and lower dependency overhead.

```typescript
import { test, describe } from 'node:test';
import assert from 'node:assert';

describe('UserService', () => {
  test('should create user', async () => {
    // ...
  });
});
```

### Mocking
- Mock external I/O (Firestore, Baileys, Redis).
- Use real data structures for internal logic tests.