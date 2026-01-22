# WhatsDeX Frontend Architecture

> **Version**: 1.0.0
> **Last Updated**: 2026-01-15
> **Stack**: Next.js 16.1 | React 19 | Tailwind CSS 4 | TypeScript 5.9

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Directory Structure](#directory-structure)
4. [Architectural Patterns](#architectural-patterns)
5. [Component Architecture](#component-architecture)
6. [State Management](#state-management)
7. [Data Fetching](#data-fetching)
8. [Styling System](#styling-system)
9. [Testing Strategy](#testing-strategy)
10. [Performance Guidelines](#performance-guidelines)

---

## Overview

The WhatsDeX frontend follows a **Hybrid Feature-Sliced Design (FSD)** architecture optimized for Next.js 16's App Router. The codebase emphasizes:

- **Server-First Rendering**: RSC by default, Client Components only for interactivity
- **Domain-Driven Organization**: Code organized by business feature, not technology
- **Type Safety**: Strict TypeScript with Zod validation at all boundaries
- **Performance**: Turbopack, React Compiler, Partial Prerendering (PPR)

---

## Technology Stack

| Category   | Technology    | Version | Purpose                         |
| ---------- | ------------- | ------- | ------------------------------- |
| Framework  | Next.js       | 16.1.2  | App Router, RSC, Server Actions |
| Runtime    | React         | 19.2.3  | Server Components, Actions      |
| Language   | TypeScript    | 5.9.3   | Static type checking            |
| Styling    | Tailwind CSS  | 4.1.18  | CSS-first utility classes       |
| Animation  | Framer Motion | 12.26.2 | GPU-accelerated animations      |
| State      | Zustand       | 5.0.10  | Client-side state               |
| Validation | Zod           | 4.3.5   | Runtime type validation         |
| Database   | Firebase      | 12.8.0  | Firestore, Authentication       |
| Icons      | Lucide React  | 0.562.0 | Icon system                     |
| Components | Radix UI      | Latest  | Accessible primitives           |

---

## Directory Structure

```
src/
├── app/                          # 🔷 ROUTING LAYER
│   │                             # Contains ONLY route definitions
│   │                             # No business logic - thin wrappers
│   ├── globals.css               # Design system tokens
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   ├── (auth)/                   # Auth route group
│   │   ├── layout.tsx            # Auth-specific layout
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── (dashboard)/              # Dashboard route group
│       ├── layout.tsx            # Dashboard shell
│       └── bots/page.tsx
│
├── features/                     # 🔷 BUSINESS DOMAINS
│   │                             # Self-contained feature modules
│   ├── auth/                     # Authentication feature
│   │   ├── components/           # Feature-specific UI
│   │   ├── hooks/                # Feature logic
│   │   ├── actions.ts            # Server Actions
│   │   ├── schemas.ts            # Zod schemas
│   │   └── index.ts              # Public API
│   ├── bots/                     # Bot management
│   ├── messages/                 # Messaging
│   ├── dashboard/                # Dashboard widgets
│   ├── billing/                  # Subscriptions
│   └── settings/                 # User settings
│
├── components/                   # 🔷 SHARED UI
│   ├── ui/                       # Atomic primitives
│   │   ├── button.tsx            # Pure, stateless
│   │   ├── input.tsx
│   │   └── index.ts
│   ├── layouts/                  # Structural components
│   │   ├── DashboardShell.tsx
│   │   └── Sidebar.tsx
│   └── motion/                   # Animation wrappers
│       └── FadeIn.tsx
│
├── lib/                          # 🔷 INFRASTRUCTURE
│   ├── firebase/                 # Firebase client
│   ├── constants/                # App constants
│   └── utils/                    # Utility functions
│       └── cn.ts                 # Class merging
│
├── server/                       # 🔷 SERVER-SIDE LOGIC
│   └── dal/                      # Data Access Layer
│       ├── users.ts
│       ├── bots.ts
│       └── tenants.ts
│
├── stores/                       # 🔷 CLIENT STATE
│   └── useUIStore.ts             # UI state (Zustand)
│
├── hooks/                        # 🔷 SHARED HOOKS
│   └── useMediaQuery.ts
│
└── types/                        # 🔷 SHARED TYPES
    ├── api.ts                    # API response types
    └── firebase.ts               # Document types
```

---

## Architectural Patterns

### 1. Thin Page Pattern

Route pages in `app/` should ONLY:

- Fetch initial data (if needed)
- Render a Feature Component
- NO business logic

```tsx
// ✅ Correct: app/(dashboard)/bots/page.tsx
import { BotList } from '@/features/bots';

export default function BotsPage() {
  return <BotList />;
}

// ❌ Wrong: Logic in page file
export default function BotsPage() {
  const [bots, setBots] = useState([]);
  useEffect(() => {
    /* fetch */
  }, []);
  return <div>{/* inline rendering */}</div>;
}
```

### 2. Server Components Default

All components are Server Components unless marked with `'use client'`.

```tsx
// Server Component (default) - can directly fetch data
async function BotList() {
  const bots = await getBots(); // Direct DB access
  return <ul>{bots.map(...)}</ul>;
}

// Client Component - for interactivity
'use client';
function BotActions() {
  const [isOpen, setIsOpen] = useState(false);
  return <button onClick={() => setIsOpen(true)}>...</button>;
}
```

### 3. Feature Module Structure

Each feature is a self-contained module with predictable structure:

```
features/bots/
├── components/           # UI specific to this feature
│   ├── BotCard.tsx
│   └── BotList.tsx
├── hooks/                # Feature-specific hooks
│   └── useBots.ts
├── actions.ts            # Server Actions for mutations
├── schemas.ts            # Zod validation schemas
├── types.ts              # Feature-specific types
└── index.ts              # Public exports (barrel file)
```

### 4. The Result Pattern

All service methods return a Result type for type-safe error handling:

```typescript
type Result<T> = { success: true; data: T } | { success: false; error: AppError };

// Usage
const result = await createBot(data);
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

---

## Component Architecture

### 1. Atomic Design System
...
### 2. UI Patterns & Best Practices

To ensure a premium and consistent UX, follow these patterns:

#### Forms
- **Always** use primitives from `@/components/ui/form` (`<Form>`, `<FormField>`, etc.).
- **Always** include a `<FormError>` for root-level/server errors above the form fields.
- **Prefer** self-contained validation logic via Zod schemas in `features/*/schemas.ts`.

#### Buttons
- **Always** use the `isLoading` prop for async actions instead of manual loading spinners.
- **Ensure** buttons have a `variant` that matches their intent (e.g., `destructive` for delete).

#### Feedback & States
- **Toasts**: Use `sonner` for non-blocking feedback (success, warnings).
- **Empty States**: Use consistent `EmptyState` components (to be implemented) for lists.

---

## State Management

### State Hierarchy

| State Type   | Solution          | Example             |
| ------------ | ----------------- | ------------------- |
| Server State | Server Components | User data, bot list |
| Form State   | `useActionState`  | Form validation     |
| URL State    | `searchParams`    | Filters, pagination |
| UI State     | Zustand           | Modals, sidebar     |
| Optimistic   | `useOptimistic`   | Pending mutations   |

### Rules

1. **No `useEffect` for data fetching** - Use Server Components
2. **Zustand for client-only UI state** - Modals, toasts, sidebar
3. **URL for shareable state** - Filters, tabs, pagination
4. **Server Actions for mutations** - Form submissions, CRUD

---

## Data Fetching

### Server Components (Default)

```tsx
// Direct database access in RSC
async function Dashboard() {
  const stats = await getStats();
  const bots = await getBots();

  return (
    <div>
      <Stats data={stats} />
      <BotList bots={bots} />
    </div>
  );
}
```

### Server Actions (Mutations)

```tsx
// features/bots/actions.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const CreateBotSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function createBot(formData: FormData) {
  const parsed = CreateBotSchema.safeParse({
    name: formData.get('name'),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() };
  }

  // Create bot in database
  await db.collection('bots').add(parsed.data);

  revalidatePath('/bots');
  return { success: true };
}
```

---

## Styling System

### Tailwind CSS v4 Configuration

Tailwind v4 uses CSS-first configuration in `globals.css`:

```css
@import 'tailwindcss';

@theme {
  /* Color tokens */
  --color-primary-500: oklch(58% 0.14 155);
  --color-primary-600: oklch(50% 0.12 155);

  /* Typography */
  --font-sans: 'Inter Variable', system-ui, sans-serif;

  /* Spacing */
  --radius-lg: 0.75rem;

  /* Shadows */
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.08);
}
```

### Class Merging Utility

```typescript
// lib/utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

---

## Testing Strategy

### Co-located Unit Tests

```
features/bots/
├── components/
│   ├── BotCard.tsx
│   └── BotCard.test.tsx    # Co-located
├── hooks/
│   ├── useBots.ts
│   └── useBots.test.ts     # Co-located
```

### Commands

```bash
npm run typecheck    # TypeScript validation
npm run lint         # ESLint (zero warnings)
npm run test:run     # Vitest unit tests
npm run build        # Production build
```

---

## Performance Guidelines

### 1. Bundle Optimization

- Default to Server Components (zero JS sent to client)
- Use dynamic imports for heavy client components
- Leverage React Compiler for automatic memoization

### 2. Rendering Strategy

- **Static Pages**: Landing, legal pages
- **Dynamic Pages**: Dashboard (user-specific)
- **PPR (Partial Prerendering)**: Mixed content

### 3. Image Optimization

```tsx
import Image from 'next/image';

// Always use next/image for automatic optimization
<Image
  src="/hero.webp"
  alt="Hero"
  width={1200}
  height={600}
  priority // Above the fold
/>;
```

### 4. Font Loading

```tsx
// Preconnect in layout.tsx
<link rel="preconnect" href="https://fonts.googleapis.com" />

// Use font-display: swap
<link href="...?display=swap" rel="stylesheet" />
```

---

## Multi-Tenancy

### Path-Based Routing

```
/t/[tenantId]/dashboard
/t/[tenantId]/bots
/t/[tenantId]/settings
```

### Firestore Structure

```
tenants/
└── {tenantId}/
    ├── users/{userId}
    ├── bots/{botId}
    └── messages/{messageId}
```

### Security Rules

```javascript
match /tenants/{tenantId}/{document=**} {
  allow read, write: if request.auth.token.tenantId == tenantId;
}
```

---

## Quick Reference

### File Naming

| Type       | Convention      | Example           |
| ---------- | --------------- | ----------------- |
| Components | PascalCase      | `BotCard.tsx`     |
| Utilities  | camelCase       | `formatDate.ts`   |
| Hooks      | camelCase + use | `useAuth.ts`      |
| Types      | PascalCase      | `ApiResponse.ts`  |
| Folders    | kebab-case      | `bot-management/` |

### Import Order

```typescript
// 1. External packages
import { useState } from 'react';
import { z } from 'zod';

// 2. Internal aliases
import { Button } from '@/components/ui';
import { useAuth } from '@/features/auth';

// 3. Relative imports
import { BotCard } from './BotCard';
```
