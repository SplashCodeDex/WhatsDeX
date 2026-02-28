# Plan: Frontend Wiring & Robustness Integration

## Phase 1: Analytics & API Foundation
*Goal: Standardize the communication layer and implement high-performance historical analytics.*

- [x] **Task: Standardize Frontend API Layer**
    - [x] Sub-task: Update `frontend/src/lib/api.ts` (or equivalent) to use the `Result<T>` pattern.
    - [x] Sub-task: Generate/Update TypeScript interfaces for all backend controller responses.
- [ ] **Task: Backend Analytics Aggregator**
    - [ ] Sub-task: Write tests for `StatsAggregatorJob`.
    - [ ] Sub-task: Implement BullMQ job to roll up `command_usage` and `messages` into `stats_daily`.
    - [ ] Sub-task: Implement `AnalyticsController.getMessageAnalytics` to query the daily collection.
- [ ] **Task: Wire Dashboard Analytics**
    - [ ] Sub-task: Replace mock data in Dashboard widgets with real calls to `getDashboardStats`.
    - [ ] Sub-task: Connect the message volume chart to `getMessageAnalytics`.
- [ ] **Task: Conductor - User Manual Verification 'Phase 1: Analytics' (Protocol in workflow.md)**

## Phase 2: Contacts & Streaming Import
*Goal: Implement scalable contact management and a robust import engine.*

- [ ] **Task: Backend Streaming CSV Parser**
    - [ ] Sub-task: Write tests for `ContactImportService` with large file streams.
    - [ ] Sub-task: Implement `busboy`/`multer` stream handler in `ContactController.importContacts`.
    - [ ] Sub-task: Process imported rows in batches to Firestore.
- [ ] **Task: Wire Contacts CRUD**
    - [ ] Sub-task: Connect `ContactsTable` to the `listContacts` endpoint with basic pagination.
    - [ ] Sub-task: Implement Create/Update/Delete modals using `ContactController`.
- [ ] **Task: Wire Contacts Import UI**
    - [ ] Sub-task: Implement file upload component with progress feedback.
    - [ ] Sub-task: Connect to the streaming backend endpoint.
- [ ] **Task: Conductor - User Manual Verification 'Phase 2: Contacts' (Protocol in workflow.md)**

## Phase 3: Campaigns & Real-Time Feedback
*Goal: Connect the marketing engine and provide live execution feedback.*

- [ ] **Task: Wire Campaign Management**
    - [ ] Sub-task: Implement Campaign Creation wizard connected to `CampaignController`.
    - [ ] Sub-task: Implement Start/Pause/Resume/Duplicate/Delete actions.
- [ ] **Task: Real-Time Progress UI**
    - [ ] Sub-task: Implement a Socket.io listener in the frontend for `campaign.progress` events.
    - [ ] Sub-task: Update the Campaign list/detail view with live progress bars and stats.
- [ ] **Task: Conductor - User Manual Verification 'Phase 3: Campaigns' (Protocol in workflow.md)**
