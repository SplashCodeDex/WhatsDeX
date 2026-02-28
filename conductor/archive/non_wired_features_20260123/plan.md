# Plan: Wiring Non-Wired Logics/Features

## Phase 1: Contact Management
- [ ] **Task: Contacts API & Hooks**
    - [ ] Implement `frontend/src/features/contacts/hooks/useContacts.ts`.
    - [ ] Implement `frontend/src/features/contacts/types.ts`.
- [ ] **Task: Contacts UI Base**
    - [ ] Create `frontend/src/features/contacts/components/ContactsTable.tsx`.
    - [ ] Create `frontend/src/features/contacts/components/ImportContactsDialog.tsx`.
    - [ ] Export via `frontend/src/features/contacts/index.ts`.
- [ ] **Task: Contacts Route**
    - [ ] Create `frontend/src/app/(dashboard)/dashboard/contacts/page.tsx`.
- [ ] **Task: Verify Contacts Wiring**
    - [ ] Test CSV import.
    - [ ] Test contact list display.

## Phase 2: Analytics & Insights
- [ ] **Task: Analytics Backend Rollup**
    - [ ] Verify/Implement `StatsAggregatorJob`.
- [ ] **Task: Wire Dashboard Analytics**
    - [ ] Replace mock data in `DashboardStatsGrid`.
    - [ ] Wire `InsightCard` in Sidebar to real stats.

## Phase 3: Settings & Workspace
- [ ] **Task: Settings Route & UI**
    - [ ] Create `frontend/src/app/(dashboard)/dashboard/settings/page.tsx`.
    - [ ] Implement `WorkspaceSettings.tsx`.

## Phase 4: Unified Inbox (Optional/Future)
- [ ] **Task: Research Inbox requirements**
- [ ] **Task: Implement basic chat view**
