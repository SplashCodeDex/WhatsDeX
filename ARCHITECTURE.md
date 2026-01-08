# WhatsDeX Architecture

## 1. System Overview

WhatsDeX is a modern WhatsApp bot management dashboard and automation platform. It consists of a decoupled architecture with a distinct Frontend and Backend, communicating via RESTful APIs and WebSockets.

### High-Level Components

- **Frontend**: Next.js 14+ (App Router), React, TypeScript. Handles UI, user interaction, and dashboard features.
- **Backend**: Node.js, Express, Baileys. Handles WhatsApp connectivity, message processing, and automation logic.
- **Database**: Firebase (Firestore) for persistent data (Users, Bots, Settings).
- **External**: WhatsApp Web API (via Baileys), OpenAI (optional for AI features).

---

## 2. Directory Structure

The project follows a monorepo-style structure within a single root.

```
WhatsDeX/
├── backend/            # Node.js Express Server
│   └── src/            # ALL source code
│       ├── commands/   # Bot commands
│       ├── config/     # Environment configuration
│       ├── controllers/# API Controllers
│       ├── services/   # Business Logic & External Services
│       ├── routes/     # Express Routes
│       ├── middleware/ # Express Middleware
│       └── utils/      # Shared Utilities
├── frontend/           # Next.js Application
│   └── src/            # ALL source code
│       ├── app/        # Pages & Layouts (App Router)
│       ├── components/ # Reusable UI Components
│       ├── hooks/      # Custom React Hooks
│       ├── services/   # Client-side API Services
│       └── types/      # TypeScript Definitions
└── README.md
```

---

## 3. Frontend Architecture

### Layers

1.  **Presentation Layer** (`src/components`, `src/app`)
    - **Responsibility**: Rendering UI.
    - **Rule**: Logic should be delegated to Hooks. No direct API calls.
2.  **Application Layer** (`src/hooks`)
    - **Responsibility**: Managing local state, side effects, and wiring UI to Services.
    - **Rule**: All async logic and state manipulation happens here.
3.  **Domain Layer** (`src/services`)
    - **Responsibility**: Data fetching, transformation, and business rules.
    - **Rule**: Stateless functions/classes returning typed responses.
4.  **Infrastructure Layer** (`src/lib`)
    - **Responsibility**: Core coding, HTTP clients, configuration.

### State Management

- **Local State**: `useState` for component-level interaction.
- **Server State**: `useSWR` or React Query (if applicable) for data fetching.
- **Global State**: `Zustand` for app-wide settings (Auth, Theme).

### Strict Rules

- **No Hardcoding**: UI text should ideally be configurable; strings/colors from standard configs.
- **Atomic Components**: Break down complex UIs into smaller, reusable parts.

---

## 4. Backend Architecture

### Layers

1.  **Interface Layer** (`src/controllers`, `src/routes`)
    - **Responsibility**: Handling HTTP requests/responses, input validation.
    - **Rule**: Thin controllers; delegate logic to Services.
2.  **Business Logic Layer** (`src/services`)
    - **Responsibility**: Core application logic, database interactions, external API calls.
    - **Rule**: Framework agnostic (should not depend on Express `req`/`res`).
3.  **Data Layer** (`src/models`, Firestore)
    - **Responsibility**: Data definitions and database schemas.

### Key Components

- **Baileys Handler**: Manages the socket connection to WhatsApp.
- **Command Processor**: Parses and executes incoming message commands.

---

    -   **Backend**: `tsconfig.json` strict mode enabled.
    -   **Frontend**: `tsconfig.json` strict mode enabled.

## 5. Coding Standards

- **TypeScript**: Strict typing everywhere. No `any`.
- **Testing**:
  - All new features must include Unit Tests.
  - Backend: Jest (`npm test`).
  - Frontend: Jest + React Testing Library (`npm test`).
  - Sanity checks must always pass.
- **Configuration**: All secrets/config via Environment Variables.
- **Error Handling**: Centralized error middleware (Backend) and Error Boundaries (Frontend).
- **Linting**: ESLint and Prettier must pass before commit.

## 6. Development Workflow

- **Branching**: Feature branches -> Pull Request -> Main.
- **Commit Messages**: Conventional Commits (feat, fix, chore).
