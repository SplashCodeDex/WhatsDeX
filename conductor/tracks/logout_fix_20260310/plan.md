# Implementation Plan: Fix Logout Infinite Reload & Backend Restart Loop

## Phase 1: OpenClaw Import & Backend Watcher Fixes
Goal: Stabilize the backend by fixing the runtime import error and preventing the watcher from restarting on unrelated file writes.

- [ ] Task: Fix OpenClaw runtime import error
    - [ ] Create a reproduction script/test in `backend/src/` that attempts to call `getHealth` via `OpenClawGateway` (using Bun if possible, or tsx).
    - [ ] Add `listChatChannelAliases` to `openclaw/src/channels/identifiers.ts`.
    - [ ] Export `listChatChannelAliases` from `openclaw/src/channels/registry.ts`.
    - [ ] Verify the import error is resolved.
- [ ] Task: Isolate Backend Watcher
    - [ ] Update `backend/package.json` dev script to include ignore patterns for `tsx --watch`.
    - [ ] Ensure `openclaw/` and `logs/` directories are ignored by the watcher.
    - [ ] Verify that writing to `backend/logs/app.log` does not trigger a backend restart.
- [ ] Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md)

## Phase 2: Frontend Auth Loop Prevention
Goal: Modify the frontend to prevent infinite redirection and hydration loops during logout.

- [ ] Task: Update `useAuth` hook logic
    - [ ] Write a unit test for `useAuth` verifying it does NOT call `verifySession` when on `/login`.
    - [ ] Implement path-based check in `useAuth` hydration `useEffect`.
    - [ ] Verify `useAuth` state transitions correctly during logout.
- [ ] Task: Update API Client logout handling
    - [ ] Write a unit test for `apiClient` verifying it does not broadcast `LOGOUT` if already on an auth route.
    - [ ] Implement the check in `handleApiError` or the 401 interceptor.
    - [ ] Verify that background 401s (e.g. from health checks) don't trigger reloads on the login page.
- [ ] Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)

## Phase 3: Final Integration & Regression Testing
Goal: Ensure the entire flow is seamless and robust against backend unavailability.

- [ ] Task: End-to-End Logout Flow Verification
    - [ ] Perform a full logout with the backend running.
    - [ ] Perform a full logout with the backend stopped.
    - [ ] Verify no infinite reloads occur in either scenario.
- [ ] Task: Conductor - User Manual Verification 'Phase 3' (Protocol in workflow.md)
