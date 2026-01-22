# Plan: Marketing & Broadcast Engine (WANotifier Clone)

## Phase 1: Contact & Audience Foundation [checkpoint: 6c13105]
Establish the data layer and import logic for contacts following Rule 1 (Zod) and Rule 3 (Subcollections).

- [x] Task: Define Data Contracts & Schemas. (c6ded13)
    - [x] Sub-task: Write Tests: Validate `ContactSchema` and `AudienceSchema` in `backend/src/types/contracts.test.ts`.
    - [x] Sub-task: Implement: Define schemas in `backend/src/types/contracts.ts`.
- [x] Task: Implement `ContactService`. (bb43203)
    - [x] Sub-task: Write Tests: Mock Firestore and test `importContacts` (CSV parsing) and `getAudience`.
    - [x] Sub-task: Implement: Create `backend/src/services/contactService.ts` with Result Pattern.
- [x] Task: Create Contact API Routes. (d36f528)
    - [x] Sub-task: Write Tests: Test `/api/contacts/import` and `/api/contacts` endpoints.
    - [x] Sub-task: Implement: Create `backend/src/routes/contactRoutes.ts` and wire to `multiTenantApp.ts`.
- [x] Task: Conductor - User Manual Verification 'Contact & Audience Foundation' (Protocol in workflow.md) (6c13105)

## Phase 2: Rich Template System & AI Spinning
Build the template management system with integrated AI personalization.

- [x] Task: Implement `TemplateService`. (e32d138)
    - [x] Sub-task: Write Tests: Test CRUD operations for templates in `tenants/{tenantId}/templates`.
    - [x] Sub-task: Implement: Create `backend/src/services/templateService.ts`.
- [ ] Task: Integrate AI Message Spinning.
    - [ ] Sub-task: Write Tests: Test `GeminiAI.spinMessage` logic with OpenTelemetry trace verification.
    - [ ] Sub-task: Implement: Add `spinMessage` to `backend/src/services/geminiAI.ts` using Rule 5 (Memoization).
- [ ] Task: Create Template API Routes.
    - [ ] Sub-task: Write Tests: Test `/api/templates` endpoints.
    - [ ] Sub-task: Implement: Create `backend/src/routes/templateRoutes.ts`.
- [ ] Task: Conductor - User Manual Verification 'Rich Template System & AI Spinning' (Protocol in workflow.md)

## Phase 3: Broadcast Engine & Hybrid Distribution
The core execution engine using BullMQ and multi-bot pooling.

- [ ] Task: Define `Campaign` Logic & Queue.
    - [ ] Sub-task: Write Tests: Test campaign state transitions and queue job adding.
    - [ ] Sub-task: Implement: Create `backend/src/services/campaignService.ts` and `backend/src/jobs/broadcastWorker.ts`.
- [ ] Task: Implement Hybrid Distribution (Single vs Pool).
    - [ ] Sub-task: Write Tests: Verify load-balancing logic across multiple bots for Enterprise tier.
    - [ ] Sub-task: Implement: Update `multiTenantBotService` to support bot pooling.
- [ ] Task: Implement Intelligent Throttling.
    - [ ] Sub-task: Write Tests: Verify randomized delays and rate-limiting enforcement.
    - [ ] Sub-task: Implement: Add throttling middleware to the broadcast worker.
- [ ] Task: Conductor - User Manual Verification 'Broadcast Engine & Hybrid Distribution' (Protocol in workflow.md)

## Phase 4: Real-time Monitoring & Dashboard UI
WebSocket integration and the multi-step campaign wizard.

- [ ] Task: Wire Real-time Progress.
    - [ ] Sub-task: Write Tests: Verify WebSocket event emission during broadcast.
    - [ ] Sub-task: Implement: Add socket.io emitters to `broadcastWorker.ts`.
- [ ] Task: Build Campaign Wizard (Frontend).
    - [ ] Sub-task: Write Tests: Test the multi-step form logic and Server Action calls.
    - [ ] Sub-task: Implement: Create `frontend/src/features/messages/components/CampaignWizard.tsx`.
- [ ] Task: Build Monitoring Dashboard (Frontend).
    - [ ] Sub-task: Write Tests: Verify real-time progress bar updates and error log display.
    - [ ] Sub-task: Implement: Create `frontend/src/app/(dashboard)/messages/campaigns/[id]/page.tsx`.
- [ ] Task: Conductor - User Manual Verification 'Real-time Monitoring & Dashboard UI' (Protocol in workflow.md)

## Phase 5: Final Polish & "Mastermind" Verification
End-to-end audit and performance verification.

- [ ] Task: Final System Walkthrough.
    - [ ] Sub-task: Perform full CSV -> Template -> Schedule -> Pool Send flow.
- [ ] Task: Verify Quality Gates.
    - [ ] Sub-task: Run `npm run typecheck` and verify >80% coverage.
    - [ ] Sub-task: Confirm all Rule 16 ESM extensions are correct.
- [ ] Task: Conductor - User Manual Verification 'Final Polish & "Mastermind" Verification' (Protocol in workflow.md)
