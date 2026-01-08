---
description: Project coding standards and architectural rules for WhatsDeX
---

# WhatsDeX Project Rules

See [ARCHITECTURE.md](file:///w:/CodeDeX/WhatsDeX/frontend/ARCHITECTURE.md) for detailed architectural documentation.

## Tech Stack

- **Backend**: Node.js, Express, Baileys (WhatsApp)
- **Frontend**: Next.js 14+, React, TypeScript
- **Database**: Firebase (Firestore)
- **Styling**: Tailwind CSS

---

## 1. Version Control & Dependencies

### Strict Latest Version Policy

**CRITICAL**: All libraries, frameworks, utilities, and packages MUST be kept at their **latest stable versions**.

- **No Legacy Code**: Do not use deprecated or older versions of libraries (e.g., use ESLint 9+, not 8).
- **Regular Updates**: Run `npm update` regularly and check for major version upgrades.
- **Strict Adherence**: If a tool breaks due to an update (e.g., Next.js linter with ESLint 9), **fix the configuration** rather than downgrading the tool.

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
└── src/                    # All source code belongs here
    ├── app/                # Next.js App Router (Routes, Layouts)
    ├── components/
    │   ├── ui/             # Reusable UI primitives (shadcn-like)
    │   ├── layout/         # Structural components (Navbar, Sidebar)
    │   └── features/       # Domain-specific components
    ├── hooks/              # Custom React hooks
    ├── lib/                    # Utilities and helpers
    ├── services/               # API/Firebase service layers
    ├── stores/                 # State management (Zustand)
    ├── types/                  # TypeScript types
    ├── styles/                 # Global styles
    └── contexts/               # React Contexts
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
    <button className={`btn btn-${variant}`} disabled={isLoading} {...props}>
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

- **Strict Separation**: DO NOT add domain methods to `apiClient.ts`. Use dedicated service files.
- **One Service Per Domain**: `authService`, `userService`, `botService`.
- **No Direct API Calls**: Components must use Hooks or Services.
- **Named Exports**: Use named exports for service instances (e.g., `export const authService = ...`).

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
    set => ({
      user: null,
      isAuthenticated: false,
      login: user => set({ user, isAuthenticated: true }),
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
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
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

| Task       | Command             |
| ---------- | ------------------- |
| Lint       | `npm run lint`      |
| Type check | `npm run typecheck` |
| Test       | `npm run test`      |
| Build      | `npm run build`     |
| Dev        | `npm run dev`       |

---

## 12. Barrel Exports

Use `index.ts` files to create clean, organized exports from directories.

### Pattern

```typescript
// contexts/index.ts
export { AuthProvider, useAuth } from './AuthContext';
export type { User, Tenant } from './AuthContext';

export { ThemeProvider, useTheme } from './ThemeContext';
export type { ThemeContextValue } from './ThemeContext';
```

### Usage

```typescript
// Clean imports using barrel exports
import { useAuth, useTheme } from '@/contexts';
import { MainLayout } from '@/components/layout';
import { apiClient } from '@/lib';
```

### Rules

- Every major directory should have an `index.ts`
- Export both values and types from the same barrel
- Use named exports (not default) for better tree-shaking
- Re-export from subdirectories when appropriate

---

## 13. Context Pattern

### Context Template

```tsx
// contexts/ExampleContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ExampleContextValue {
  value: string;
  setValue: (v: string) => void;
}

const ExampleContext = createContext<ExampleContextValue | undefined>(undefined);

interface ExampleProviderProps {
  children: ReactNode;
}

export function ExampleProvider({ children }: ExampleProviderProps): React.ReactElement {
  const [value, setValue] = useState('');

  return <ExampleContext.Provider value={{ value, setValue }}>{children}</ExampleContext.Provider>;
}

export function useExample(): ExampleContextValue {
  const context = useContext(ExampleContext);
  if (context === undefined) {
    throw new Error('useExample must be used within an ExampleProvider');
  }
  return context;
}
```

### Rules

- Always export a typed hook (e.g., `useAuth`) with error boundary
- Use `undefined` as default context value to catch missing providers
- Place `'use client'` directive at the top for client-side contexts
- Export interfaces for consumers to use

---

## 14. Page Component Template

### Next.js App Router Page

```tsx
// app/example/page.tsx
'use client';

export const dynamic = 'force-dynamic'; // For pages that need SSR disabled

import React from 'react';
import { MainLayout } from '@/components/layout';
import { useAuth } from '@/contexts';

export default function ExamplePage(): React.ReactElement {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <MainLayout title="Example">
      <div className="space-y-6">{/* Page content */}</div>
    </MainLayout>
  );
}
```

### Rules

- Use `'use client'` for interactive pages
- Use `dynamic = 'force-dynamic'` when static generation should be disabled
- Show loading states while fetching data
- Use MainLayout for consistent page structure

---

## 15. Error Boundary Guidelines

### Error Boundary Component

```tsx
// components/ErrorBoundary.tsx
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 text-center">
            <h2 className="text-xl font-bold text-red-600">Something went wrong</h2>
            <p className="text-gray-600">{this.state.error?.message}</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

### Rules

- Wrap major page sections with ErrorBoundary
- Provide meaningful fallback UI
- Log errors for debugging
- Never catch errors silently
