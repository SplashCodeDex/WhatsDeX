# Plan: Codebase-Wide Placeholder & Simulation Cleanup

## Phase 1: Backend Service Finalization
Identify and replace all internal data simulations with real Firestore logic.

- [ ] Task: Audit and Refactor `MultiTenantService`.
    - [ ] Subtask: Identify all hardcoded tenant/user IDs.
    - [ ] Subtask: Write failing unit tests for real Firestore fetch/set logic.
    - [ ] Subtask: Implement real logic using `FirebaseService` and Zod validation.
- [ ] Task: Finalize `PlanService` and `SubscriptionService`.
    - [ ] Subtask: Replace in-memory plan definitions with Firestore `plans` collection reads.
    - [ ] Subtask: Implement real usage counter logic in `tenants/{tenantId}/usage_counters`.
- [ ] Task: Remove simulated delays across the backend.
    - [ ] Subtask: Global search for `setTimeout` and `sleep` in `src/services` and `src/controllers`.
    - [ ] Subtask: Verify logic stability after removal.
- [ ] Task: Conductor - User Manual Verification 'Backend Service Finalization' (Protocol in workflow.md)

## Phase 2: External Integration Wiring (Sandbox)
Transition external provider placeholders to real Sandbox/Test API calls.

- [ ] Task: Wire real Stripe Test Mode.
    - [ ] Subtask: Verify `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are correctly loaded.
    - [ ] Subtask: Replace mock Checkout Session creation with real Stripe SDK call.
    - [ ] Subtask: Verify real webhook receipt and processing.
- [ ] Task: Activate Live Gemini AI.
    - [ ] Subtask: Ensure `GeminiAI` service uses the environment API key.
    - [ ] Subtask: Remove "Dummy Response" logic from `NLPProcessor` and `GeminiAI`.
- [ ] Task: Wire Google Drive Backup.
    - [ ] Subtask: Transition from simulated upload logs to real Drive API calls.
- [ ] Task: Conductor - User Manual Verification 'External Integration Wiring (Sandbox)' (Protocol in workflow.md)

## Phase 3: Global Marker Cleanup
Exhaustive search and resolution of code-level "TODO" markers.

- [ ] Task: Execute Global Marker Search.
    - [ ] Subtask: Search for `TODO`, `FIXME`, `MOCK`, `DUMMY`, `PLACEHOLDER`, `tenant-123`, `user@example.com`.
- [ ] Task: Resolve Backend Markers.
    - [ ] Subtask: Address all identified backend simulations.
- [ ] Task: Resolve Frontend Markers.
    - [ ] Subtask: Address all identified frontend hardcodings.
- [ ] Task: Conductor - User Manual Verification 'Global Marker Cleanup' (Protocol in workflow.md)

## Phase 4: Frontend Dynamic Hydration
Connect UI components to real data sources and remove visual placeholders.

- [ ] Task: Hydrate Dashboard Metrics.
    - [ ] Subtask: Update `StatsGrid` to use real data from `/api/analytics/dashboard`.
    - [ ] Subtask: Remove "Coming Soon" messages from Charts and Activity Feeds.
- [ ] Task: Finalize Bot Management UI.
    - [ ] Subtask: Ensure Bot statuses and QR flows reflect real Baileys/Firestore state.
- [ ] Task: Implement "Empty State" Logic.
    - [ ] Subtask: Replace placeholder text with helpful "Get Started" CTAs when data is truly empty.
- [ ] Task: Conductor - User Manual Verification 'Frontend Dynamic Hydration' (Protocol in workflow.md)

## Phase 5: Final Verification & Polish
End-to-end system audit and final quality gates.

- [ ] Task: Full System Walkthrough.
    - [ ] Subtask: Perform Signup -> Create Bot -> Connect -> Send Message flow.
    - [ ] Subtask: Verify data persistence in Firestore subcollections.
- [ ] Task: Final Quality Gate Check.
    - [ ] Subtask: Run `npm run typecheck` and `npm run lint` across workspaces.
    - [ ] Subtask: Verify >80% test coverage for refactored services.
- [ ] Task: Conductor - User Manual Verification 'Final Verification & Polish' (Protocol in workflow.md)
