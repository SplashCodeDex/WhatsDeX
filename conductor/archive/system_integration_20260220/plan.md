# Implementation Plan: System-Wide Feature Integration & Infrastructure Fixes

This plan addresses critical infrastructure gaps and wires up partially implemented features to ensure WhatsDeX is fully operational and scalable.

## Phase 1: Infrastructure & Job Activation [checkpoint: a84243c8]
Goal: Enable the background processing engine to support AI, analytics, and campaigns.

- [x] Task: Activate JobRegistry in Backend Startup (TDD). a84243c8
    - [x] Sub-task: Write unit tests for `JobRegistry` initialization and worker startup confirmation. 6a77724b
    - [x] Sub-task: Import and initialize `JobRegistry` in `backend/src/main.ts` after context initialization. 787fe122
    - [x] Sub-task: Verify that all BullMQ workers start correctly in the test environment. a84243c8
- [x] Task: Conductor - User Manual Verification 'Phase 1: Infrastructure' (Protocol in workflow.md) a84243c8

## Phase 2: Analytics & Usage Engine [checkpoint: d3e28d87]
Goal: Implement the hybrid usage tracking model for real-time billing and historical charts.

- [x] Task: Implement StatsAggregatorJob (TDD). d3e28d87
    - [x] Sub-task: Write tests for rolling up raw message logs into daily `stats_daily` records. d3e28d87
    - [x] Sub-task: Implement the BullMQ job logic to perform Firestore aggregations. d3e28d87
- [x] Task: Real-time Counter Integration. d3e28d87
    - [x] Sub-task: Update `MessageService` (or equivalent) to use Firestore `increment()` for tenant message counts. d3e28d87
- [x] Task: Implement Usage Analytics Routes (TDD). d3e28d87
    - [x] Sub-task: Write tests for the `/api/analytics/usage` and `/api/analytics/dashboard` endpoints. d3e28d87
    - [x] Sub-task: Implement the missing Express routes to serve aggregated stats to the frontend. d3e28d87
- [x] Task: Conductor - User Manual Verification 'Phase 2: Analytics' (Protocol in workflow.md) 1ebb4bc6

## Phase 3: Core Messaging Interaction & Safety
Goal: Close the loop on user interaction by enabling replies and template management.

- [x] Task: Implement Unified Inbox Reply Logic (TDD). bb97ec6
    - [x] Sub-task: Write tests to ensure replies are routed via the last interacting bot/channel.
    - [x] Sub-task: Update the `UnifiedInbox` controller and frontend to support sending replies.
- [x] Task: Create Template Management UI. bb97ec6
    - [x] Sub-task: Implement a new dashboard page at `frontend/src/app/(dashboard)/dashboard/templates/page.tsx`.
    - [x] Sub-task: Wire the existing template CRUD logic to the new UI.
- [x] Task: AI Message Spinning UI. bb97ec6
    - [x] Sub-task: Add the "AI Spin" button to template/campaign forms.
    - [x] Sub-task: Wire the button to the backend rephrasing logic (ensuring tier gating).
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Messaging' (Protocol in workflow.md)

## Phase 4: Intelligence & Resiliency [checkpoint: 016d798]
Goal: Deliver the "Mastermind" experience with persistent memory and data safety.

- [x] Task: Wire AI Persistent Learning (TDD). 016d798
    - [x] Sub-task: Write integration tests where an agent stores a fact and recalls it in a subsequent turn.
    - [x] Sub-task: Update the `GeminiAI` service to invoke the `memoryService` during tool execution and message processing.
- [x] Task: Implement Google Drive Backup Service (TDD). 016d798
    - [x] Sub-task: Write tests for database and media backup routines.
    - [x] Sub-task: Implement the automated backup job and its configuration UI in the settings page.
- [x] Task: Conductor - User Manual Verification 'Phase 4: Intelligence' (Protocol in workflow.md)
