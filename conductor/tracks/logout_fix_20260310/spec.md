# Specification: Fix Logout Infinite Reload & Backend Restart Loop

## Overview
Clicking "Logout" triggers an infinite page reload. This is a multi-layered failure involving a broken OpenClaw import, backend watcher instability, and a frontend auth-verification loop.

## Root Causes
1.  **Broken OpenClaw Internal Import:** The `openclaw` workspace is missing an export for `listChatChannelAliases` in `registry.ts`, which causes runtime errors (specifically visible in Bun) when the gateway health endpoint is called.
2.  **Watcher Sensitivity:** The backend `dev` script (`tsx --watch`) restarts when it detects file changes in `openclaw/` or `logs/`. Normal operations like logout or health polling can trigger these writes, leading to a restart loop.
3.  **Connectivity & Auth Loop:** Backend restarts cause `ECONNREFUSED`. The frontend `useAuth` hook attempts to verify the session after logout (on re-mount). Failing verification (due to backend being down) triggers a `LOGOUT` broadcast that forces *another* refresh, creating an infinite cycle.

## Functional Requirements
1.  **Fix OpenClaw Export:** Add the missing `listChatChannelAliases` function and its export to `openclaw/src/channels/identifiers.ts` and ensure it is exported from `registry.ts`.
2.  **Isolate Backend Watcher:** Update the backend `dev` script to ignore the `openclaw/` workspace directory and the `logs/` folder to prevent restart loops during active development.
3.  **Frontend Auth Page Guard:** Update `useAuth` to skip `verifySession` if the user is already on `/login` or `/register`.
4.  **Idempotent API Client:** Prevent `LOGOUT` broadcasts from the API Client if the current pathname is an auth route.

## Acceptance Criteria
- [ ] No "Export named 'listChatChannelAliases' not found" errors in backend logs.
- [ ] Backend does NOT restart when performing a logout.
- [ ] Frontend redirects to `/login` exactly once after logout.
- [ ] Dashboard pages correctly redirect to login without looping when the backend is manually stopped.

## Out of Scope
- Large-scale refactoring of the OpenClaw engine.
- Implementing persistent local storage for auth state beyond cookies.
