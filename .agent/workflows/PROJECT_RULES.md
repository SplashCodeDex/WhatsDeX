---
description: Project coding standards and architectural rules for WhatsDeX
---

# WhatsDeX Project Rules

## Tech Stack
- **Backend**: Node.js, Express, Baileys (WhatsApp)
- **Frontend**: Next.js 14+, React, TypeScript
- **Database**: Firebase (Firestore)
- **Styling**: Tailwind CSS

---

## 1. Code Quality

### Linting
```bash
npm run lint        # ESLint check
npm run lint:fix    # Auto-fix issues
```

**Rules:**
- No `any` types in TypeScript (use `unknown` or proper types)
- No unused variables/imports
- Prefer `const` over `let`
- Use arrow functions for callbacks
- Max line length: 100 characters

### Type Checking
```bash
npm run typecheck   # TypeScript validation
```

**Rules:**
- All functions must have explicit return types
- Props interfaces required for all components
- No implicit `any` allowed
- Use strict mode in `tsconfig.json`

### Testing
```bash
npm run test        # Run all tests
npm run test:watch  # Watch mode
npm run test:cov    # Coverage report
```

**Rules:**
- Minimum 80% code coverage for new code
- Unit tests for all utility functions
- Integration tests for API endpoints
- E2E tests for critical user flows

### Build
```bash
npm run build       # Production build
npm run dev         # Development server
```

---

## 2. File Structure

### Frontend (Next.js)
```
frontend/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth group routes
│   ├── (dashboard)/       # Dashboard routes
│   └── layout.tsx         # Root layout
├── components/
│   ├── ui/                # Reusable UI primitives
│   ├── forms/             # Form components
│   ├── layouts/           # Layout components
│   └── [feature]/         # Feature-specific components
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities and helpers
├── services/               # API service layers
├── stores/                 # State management
├── types/                  # TypeScript types
└── styles/                 # Global styles
```

### Backend
```
backend/
├── src/
│   ├── commands/          # Bot commands (categorized)
│   ├── handlers/          # Event handlers
│   ├── services/          # Business logic
│   ├── utils/             # Utilities
│   └── lib/               # Core libraries
├── routes/                 # API routes
└── middleware/             # Express middleware
```

---

## 3. Component Standards

### Naming
- **Components**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAuth.ts`)
- **Utils**: camelCase (`formatDate.ts`)
- **Types**: PascalCase with suffix (`UserProps`, `AuthState`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_RETRIES`)

### Component Template
```tsx
// components/ui/Button.tsx
import { type FC, type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

export const Button: FC<ButtonProps> = ({
  variant = 'primary',
  isLoading = false,
  children,
  ...props
}) => {
  return (
    <button
      className={`btn btn-${variant}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
};
```

---

## 4. Hooks Standards

### Custom Hook Template
```tsx
// hooks/useUser.ts
import { useState, useEffect } from 'react';
import type { User } from '@/types';

interface UseUserReturn {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useUser(userId: string): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = async () => {
    // Implementation
  };

  useEffect(() => {
    refetch();
  }, [userId]);

  return { user, isLoading, error, refetch };
}
```

### Hook Rules
- Always return an object (not tuple) for >2 values
- Include loading and error states
- Prefix with `use`
- Place in `/hooks` directory
- One hook per file

---

## 5. Services Layer

### Service Template
```typescript
// services/userService.ts
import { db } from '@/lib/firebase';

class UserService {
  async getById(id: string) {
    const doc = await db.collection('users').doc(id).get();
    return doc.exists ? doc.data() : null;
  }

  async create(data: CreateUserData) {
    const ref = await db.collection('users').add(data);
    return ref.id;
  }

  async update(id: string, data: Partial<User>) {
    await db.collection('users').doc(id).update(data);
  }

  async delete(id: string) {
    await db.collection('users').doc(id).delete();
  }
}

export const userService = new UserService();
```

### Service Rules
- One service per domain (user, auth, bot, etc.)
- No direct Firebase calls in components
- All services exported from `services/index.ts`
- Handle errors within service methods

---

## 6. State Management

### Zustand Store Template
```typescript
// stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }
  )
);
```

---

## 7. Import Standards

### Order
1. React/Next.js imports
2. Third-party libraries
3. Internal aliases (@/)
4. Relative imports
5. Types (last, with `type` keyword)

### Example
```typescript
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services';

import { formatDate } from '../utils';

import type { User, AuthState } from '@/types';
```

### Path Aliases
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./components/*"],
      "@/hooks/*": ["./hooks/*"],
      "@/services/*": ["./services/*"],
      "@/types/*": ["./types/*"]
    }
  }
}
```

---

## 8. API Standards

### Response Format
```typescript
// Success
{
  success: true,
  data: { ... }
}

// Error
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid input'
  }
}
```

### Error Handling
```typescript
try {
  const result = await someOperation();
  return { success: true, data: result };
} catch (error) {
  logger.error('Operation failed', { error });
  return { success: false, error: { code: 'OPERATION_FAILED', message: error.message } };
}
```

---

## 9. Git Workflow

### Commit Messages
```
type(scope): description

feat(auth): add login with Google
fix(bot): resolve message parsing error
docs(readme): update installation steps
chore(deps): upgrade dependencies
```

### Branches
- `main` - Production
- `develop` - Development
- `feature/*` - New features
- `fix/*` - Bug fixes
- `refactor/*` - Code improvements

### Pre-commit Hooks (Husky)
```bash
# .husky/pre-commit
npm run lint
npm run typecheck
npm run test -- --passWithNoTests
```

---

## 10. Performance Rules

- Lazy load components with `next/dynamic`
- Use React.memo for expensive components
- Debounce user inputs (300ms default)
- Virtualize long lists (>50 items)
- Optimize images with `next/image`
- Cache API responses appropriately

---

## 11. Security Rules

- Never commit secrets (.env files)
- Validate all user inputs
- Sanitize data before database writes
- Use HTTPS for all API calls
- Implement rate limiting on APIs
- Use Firebase Security Rules

---

## Quick Reference

| Task | Command |
|------|---------|
| Lint | `npm run lint` |
| Type check | `npm run typecheck` |
| Test | `npm run test` |
| Build | `npm run build` |
| Dev | `npm run dev` |
