# Track: Backend Internals & Bot Logic

**Goal**: Refactor backend routes to use controllers, audit bot commands, and clean up internal logic not exposed to the frontend.

## Phases

### Phase 1: Controller Standardization
Refactor routes that currently contain inline logic to use the Controller -> Service pattern.

- [x] Create `AnalyticsController` and refactor `analyticsRoutes.ts`.
- [x] Create `MessageController` and refactor `messageRoutes.ts`.
- [x] Create `CampaignController` and refactor `campaigns.ts`.
- [x] Create `TenantSettingsController` and refactor `tenantSettingsRoutes.ts`.
- [x] Ensure all controllers use consistent error handling and response formatting.

### Phase 2: Bot Command Audit & Standardization
Review and standardize the bot commands located in `backend/src/commands/`.

- [x] Audit `backend/src/commands/` structure.
- [x] Ensure all commands follow a consistent interface (e.g., `Command` interface).
- [x] Verify error handling and logging in bot commands.
- [x] Document internal bot commands if necessary.

### Phase 3: Internal Services & Cleanup
Review internal services and remove/refactor unused or "non-wired" code.

- [x] Review `backend/src/services` for unused methods or services.
- [x] Check for dead code in `backend/src/utils` and `backend/src/lib`.
- [x] Ensure `backend/src/server/multiTenantApp.ts` is correctly mounting all refactored routes.

## Completion Criteria
- All routes in `backend/src/routes` delegate logic to controllers in `backend/src/controllers`.
- Bot commands share a consistent structure and error handling.
- Codebase is cleaner and follows the established architecture.
