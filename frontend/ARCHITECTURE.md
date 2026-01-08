# WhatsDeX Architecture

## Overview

WhatsDeX follows a strict layered architecture to ensure separation of concerns, maintainability, and scalability. This document defines the rules for each layer.

## Architectural Layers

### 1. Presentation Layer (UI)

- **Location**: `src/app`, `src/components`
- **Responsibility**: Rendering UI, handling user user interactions, usage of Hooks.
- **Rules**:
  - NEVER call API endpoints directly (no `fetch` or `axios` in components).
  - ALWAYS use Custom Hooks or Contexts to access data.
  - Keep logic minimal; delegate to Hooks.

### 2. Application Layer (Hooks)

- **Location**: `src/hooks`
- **Responsibility**: Connecting UI to Services, managing local component state, handling side effects.
- **Naming**: `use[Feature]`.
- **Rules**:
  - Wrap Service calls.
  - Handle loading and error states.
  - Return typed objects.

### 3. Domain Layer (Services)

- **Location**: `src/services`
- **Responsibility**: Business logic, API calls, data transformation.
- **Naming**: `[entity]Service.ts` (e.g., `authService.ts`, `botService.ts`).
- **Patterns**:
  - **Repository Pattern**: Services act as repositories for data.
  - **Singleton**: Export instances of service classes or collections of functions.
- **Rules**:
  - One service per domain entity.
  - STRICTLY TYPED return values (use `ApiResponse<T>`).
  - NO UI dependency (no React imports).

### 4. Infrastructure Layer (Core)

- **Location**: `src/lib`, `src/types`
- **Responsibility**: Low-level generic utilities, HTTP client setup, shared types.
- **Key Files**:
  - `apiClientCore.ts`: Configures Axios (interceptors, headers).
  - `apiClient.ts`: **DEPRECATED** Facade for backward compatibility. Use specific services instead.
  - `types/index.ts`: Centralized type definitions.

---

## Data Flow

`UI Component` -> `Custom Hook` -> `Domain Service` -> `API Client` -> `Backend`

## Directory Structure

```
src/
├── app/               # Routes
├── components/        # UI
├── hooks/             # React Hooks (useAuth, useBots)
├── services/          # API Wrappers (authService, botService)
├── lib/               # Core Utils (apiClient, utils)
├── types/             # TS Interfaces
└── contexts/          # Global State
```

## Strict Policies

1.  **No God Objects**: Files like `apiClient.ts` must NOT contain methods for every feature. Split them into services.
2.  **Centralized Types**: All shared types must be in `src/types` or exported from `src/services`.
3.  **Strict Typing**: logic must use specific interfaces, not `any`.
