# CLAUDE.md — AI Assistant Guide for DeXMart

This file provides essential context for AI assistants (Claude, Copilot, etc.) working in this codebase.

---

## Repository Overview

DeXMart is a **multi-tenant WhatsApp bot management platform** built as a pnpm monorepo. It provides:
- A web dashboard for managing WhatsApp bots and AI agents
- A backend API with multi-tenant isolation via Firestore
- An AI "Mastermind" brain powered by Google Gemini
- Multi-channel messaging via the `openclaw` gateway

**Version**: 2026.x | **Primary Language**: TypeScript (strict)

---

## Monorepo Structure

```
DeXMart/
├── frontend/         # Next.js 16 web dashboard (port 3000)
├── backend/          # Express 5 API server (port 3001)
├── openclaw/         # Multi-channel AI gateway (workspace package)
├── shared/           # @DeXMart/shared — cross-package types/utilities
├── scripts/          # Automation (upstream-watcher, seed scripts)
├── docs/             # Architecture docs, upstream reports
├── conductor/        # Project planning & task tracking
├── .agent/           # Agent workflow configurations
├── .github/          # GitHub Actions CI/CD
└── pnpm-workspace.yaml
```

---

## Development Commands

### Installation
```bash
pnpm install          # Install all workspace dependencies
```

### Development Servers
```bash
pnpm dev:frontend     # Next.js dev server with Turbopack (port 3000)
pnpm dev:backend      # tsx watch server (port 3001)
```

### Building
```bash
pnpm build:frontend   # next build
pnpm build:backend    # tsc compilation → dist/
```

### Testing
```bash
pnpm test:all         # Run both frontend and backend tests
pnpm test:frontend    # Vitest (jsdom environment)
pnpm test:backend     # Vitest (node environment)
pnpm test:run         # Backend tests, single run with coverage
```

### Linting & Type Checking
```bash
pnpm lint:frontend    # ESLint, zero warnings policy
pnpm lint:backend     # ESLint, zero warnings policy
pnpm typecheck        # tsc --noEmit (backend)
```

### Database Seeding
```bash
pnpm --filter backend seed:firestore
pnpm --filter backend seed:stripe
pnpm --filter backend seed:all
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16.1 + React 19 + TypeScript 5.9 |
| Styling | Tailwind CSS 4 (CSS-first configuration) |
| State | Zustand 5 (client), React Query 5 (server state) |
| UI | Radix UI 1.4 + Lucide React |
| Forms | React Hook Form 7 + Zod 4 |
| Animation | Framer Motion 12 |
| Backend | Express 5.2 + Node.js 24–25 + TypeScript 5.9 |
| Database | Firestore (Firebase Admin SDK 13) |
| Auth | Firebase Auth + JWT |
| AI | Google Gemini (geminiAI.ts) |
| WhatsApp | Baileys 7.0 |
| Queue | BullMQ 5 + Redis |
| Caching | Redis + ioredis + Node-Cache |
| Testing | Vitest 4 (both packages) |
| Package Manager | pnpm (workspaces) |

---

## Frontend Architecture

### Directory Layout (`frontend/src/`)
```
app/                  # Next.js App Router (thin page wrappers only)
  (auth)/             # login, register routes
  (dashboard)/        # authenticated dashboard routes
  api/                # API route handlers
features/             # Business domain modules (self-contained)
  agents/
  auth/
  billing/
  contacts/
  flows/
  messages/
  omnichannel/
  settings/
  webhooks/
  dashboard/
components/
  ui/                 # Atomic, pure, stateless primitives
server/
  dal/                # Data Access Layer (server-side queries)
stores/               # Zustand stores
lib/                  # Firebase client, constants, utilities
types/                # Shared TypeScript types
```

### Key Conventions

1. **Server Components by default**: Every component is RSC unless it has `'use client'`. Minimize client components.
2. **Thin page pattern**: `app/` routes only render feature components — no business logic in route files.
3. **Feature modules are self-contained**: Each feature exports via `index.ts`; internals stay private.
4. **Result pattern for services**:
   ```typescript
   // All service methods must return this shape
   { success: true; data: T } | { success: false; error: AppError }
   ```
5. **React 19 mutations**: Use `useActionState` hook for form mutations/loading state — never manual `useState` for async loading.
6. **PPR (Partial Prerendering)**: Use static shells with Suspense boundaries for dynamic content.
7. **No logic in `app/` routes**: Delegate everything to `features/`.

### State Hierarchy
```
URL State → Server State (React Query) → Local Component State → Global UI State (Zustand)
```

Zustand stores: `useOmnichannelStore`, `useUIStore`, `useMastermindStore`, `useAuthorityStore`

### Data Fetching
- Server-side: Use DAL functions in `server/dal/` directly in Server Components
- Client-side: Use React Query (`useQuery`, `useMutation`) for all client data fetching
- Never use `useEffect` for data fetching

---

## Backend Architecture

### Directory Layout (`backend/src/`)
```
commands/             # Bot command implementations
  ai-chat/, ai-image/, ai-misc/
  downloader/, group/, information/
  main/, maker/, owner/, search/, tool/
services/             # Business logic layer (~100+ services)
  geminiAI.ts         # Core Mastermind brain (55KB)
  antiBanService.ts   # Anti-ban velocity/content/cooldown rules
  multiTenantService.ts
  campaignService.ts
  authSystem.ts
  ...
routes/               # Express route definitions
controllers/          # HTTP request handlers (thin)
middleware/           # Auth, security, rate limiting, moderation
config/               # Environment validation, ConfigManager, tenant config
jobs/                 # BullMQ background workers
```

### Key Conventions

1. **Layered architecture**: Routes → Controllers → Services → Database. Never skip layers.
2. **Services are framework-agnostic**: No `req`/`res` in service methods.
3. **Every operation is tenant-scoped**: All service methods accept `tenantId` as a parameter.
4. **Environment validation at startup**: All env vars validated via `env.schema.ts` (Zod) before app starts.
5. **Configuration hierarchy**:
   ```
   Infrastructure (.env)
     → Platform Defaults (ConfigManager.ts)
       → Tenant Settings (Firestore)
         → Bot Configuration (Firestore)
   ```

### Multi-Tenancy

Every Firestore path is scoped by `tenantId`:
```
tenants/{tenantId}/users/{userId}
tenants/{tenantId}/bots/{botId}
tenants/{tenantId}/messages/{messageId}
tenants/{tenantId}/groups/{jid}
tenants/{tenantId}/settings/{settingId}
```

Firebase security rules enforce: `request.auth.token.tenantId == tenantId`.

### AI Mastermind (GeminiAI)

The AI brain (`services/geminiAI.ts`) implements:
- **Intent Detection**: Context-aware multi-goal analysis per message
- **Strategic Planning**: Multi-step workflows using bot commands as tools
- **RAG**: Vector memory injection for context
- **Anti-Ban Engine**: Velocity rules, content rules, cooldown management
- **Reflection**: Brain reviews plans before execution
- **Memoization**: Expensive analysis cached per tenant/message
- **Persistence**: Continuous learning via Firestore subcollections

---

## Database Patterns

- **No ORM**: Direct Firebase Admin SDK (`FirebaseService`, `DatabaseService`)
- **FirebaseService**: Low-level document CRUD with path-aware templating
- **DatabaseService**: High-level operations with strict tenancy enforcement
- Path templates use `{tenantId}` substitution throughout

---

## Environment Variables

Backend requires ~100 environment variables validated by Zod at startup. Key groups:

| Group | Key Variables |
|-------|--------------|
| Channel | `CHANNEL_NAME`, `SESSION_ID`, `CHANNEL_PREFIX` |
| Firebase | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` |
| AI | `GOOGLE_GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_TEMP` |
| Redis | `REDIS_URL`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Auth | `JWT_SECRET`, `AUTH_ADAPTER` |
| Rate Limits | `RATE_LIMIT_GLOBAL`, `RATE_LIMIT_USER`, `RATE_LIMIT_AI` |

Frontend requires `NEXT_PUBLIC_FIREBASE_*` variables and `BACKEND_URL`.

Never commit `.env` files. Use `.env.example` as a template.

---

## Code Quality Standards

- **TypeScript strict mode** in all packages — no `any` without justification
- **ESLint zero warnings** policy (`--max-warnings 0`)
- **Prettier**: single quotes, 2-space indent, 100-char line width, ES5 trailing commas
- **Husky pre-commit hooks**: lint-staged runs ESLint + Prettier on staged files
- **Test coverage**: 70% threshold for lines/branches/functions (backend)
- **Conventional Commits**: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`

---

## Testing Conventions

- Test files are **co-located** with source: `*.test.ts` next to `*.ts`
- Use **Vitest** (not Jest) for all tests
- Frontend: jsdom environment; Backend: node environment
- Mock Firebase/external services in tests — never call real APIs
- Coverage tracked with v8 provider

---

## CI/CD

**GitHub Actions** (`.github/workflows/`):

- **`backend-ci.yml`**: Triggers on push/PR to `main`/`master`/`dev` for backend changes
  - Matrix: Node.js 24.x and 25.x
  - Steps: install → audit → lint → typecheck → test

- **`openclaw-watcher.yml`**: Runs every 12 hours
  - Monitors OpenClaw upstream repository
  - Auto-commits update reports to `docs/OPENCLAW_UPSTREAM_REPORT.md`

---

## OpenClaw Integration

OpenClaw (`openclaw/`) is a **multi-channel AI gateway** that DeXMart imports as a workspace dependency. It provides:
- 22+ channel extensions (WhatsApp, Discord, Slack, Signal, Zalo, IRC, etc.)
- 54 skills/commands
- Plugin SDK for extending functionality

Key files: `openclaw/AGENTS.md` (guidelines), `openclaw/CHANGELOG.md` (release history).

---

## Important Gotchas

1. **Port conflicts**: Frontend pre-dev script kills port 3000 automatically (`predev` in frontend package.json).
2. **pnpm only**: Do not use `npm` or `yarn` — the monorepo uses pnpm workspaces.
3. **Firestore paths are case-sensitive**: Always use the correct collection name casing.
4. **Baileys sessions**: WhatsApp sessions are stored per `SESSION_ID`; changing this ID creates a new session.
5. **Anti-ban is critical**: Never bypass `antiBanService` rate limits — WhatsApp may ban the number.
6. **React Compiler is enabled**: Do not manually add `useMemo`/`useCallback` — the compiler handles it.
7. **Turbopack in dev**: Some webpack plugins may not be compatible; test in production build if you see dev-only issues.
8. **Backend startup order**: Env validation → ConfigService → Firebase → JobRegistry → MultiTenantApp → Watchdog. Errors in early stages crash the process intentionally.
9. **No direct Firestore access from frontend routes**: Always go through the DAL (`server/dal/`) or API routes.
10. **Tenant context is mandatory**: Every backend operation touching data must have a verified `tenantId` from the auth token.

---

## Git Workflow

- **Default branch**: `master`
- Feature branches: `feat/`, `fix/`, `chore/`, `claude/` prefixes
- Commit messages follow Conventional Commits spec
- Pre-commit hooks enforce linting (via Husky + lint-staged)
- PRs require passing CI before merge

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `backend/src/main.ts` | Backend entry point |
| `frontend/src/app/layout.tsx` | Frontend root layout |
| `backend/src/config/env.schema.ts` | Environment variable validation |
| `backend/src/config/ConfigManager.ts` | Layered configuration system |
| `backend/src/services/geminiAI.ts` | AI Mastermind brain |
| `backend/src/services/multiTenantService.ts` | Multi-tenancy routing |
| `backend/src/services/DatabaseService.ts` | High-level Firestore operations |
| `backend/src/services/FirebaseService.ts` | Low-level Firestore CRUD |
| `backend/src/services/antiBanService.ts` | Anti-ban enforcement |
| `frontend/src/lib/firebase.ts` | Firebase client initialization |
| `ARCHITECTURE.md` | System architecture deep-dive |
| `frontend/ARCHITECTURE.md` | Frontend architecture patterns |
