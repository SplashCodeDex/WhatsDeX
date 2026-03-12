# Implementation Plan: Dashboard Functional Audit & Wiring

## Phase 1: High Priority Audit (Group A)
Goal: Audit and wire the most critical system and configuration pages.

- [x] Task: Audit & Wire 'Settings'
    - [x] Scan `frontend/src/app/(dashboard)/dashboard/settings/page.tsx` and `frontend/src/app/(dashboard)/settings/page.tsx`.
    - [x] Identify hardcoded user profiles or organization settings.
    - [x] Write failing tests for profile updates and preference saving.
    - [x] Implement wiring to backend tenant/user services.
- [x] Task: Audit & Wire 'Config'
    - [x] Scan `frontend/src/app/(dashboard)/dashboard/config/page.tsx`.
    - [x] Identify simulated environment variables or system toggles.
    - [x] Implement real-time configuration fetching and updating.
- [x] Task: Audit & Wire 'Nodes'
    - [x] Scan `frontend/src/app/(dashboard)/dashboard/nodes/page.tsx`.
    - [x] Replace static node lists with live data from OpenClaw gateway.
    - [x] Implement node restart/management actions.
- [x] Task: Audit & Wire 'System Logs'
    - [x] Identify log viewer component (likely within `dashboard/omnichannel` or shared).
    - [x] Replace static log entries with live stream from `/api/omnichannel/logs/stream`.
- [x] Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md)

## Phase 2: Core Functional Audit (Group B)
Goal: Ensure the primary automation and messaging modules are fully functional.

- [x] Task: Audit & Wire 'Overview'
    - [x] Scan `frontend/src/app/(dashboard)/dashboard/page.tsx`.
    - [x] Replace simulated metrics (message counts, active bots) with live data.
- [x] Task: Audit & Wire 'Channels'
    - [x] Scan `frontend/src/app/(dashboard)/dashboard/omnichannel/page.tsx`.
    - [x] Ensure QR code generation and API token inputs are fully wired.
- [x] Task: Audit & Wire 'Messages'
    - [x] Scan `frontend/src/app/(dashboard)/dashboard/messages/page.tsx`.
    - [x] Verify Unified Inbox functionality and campaign management.
- [x] Task: Audit & Wire 'Templates & Flows'
    - [x] Scan `frontend/src/app/(dashboard)/dashboard/templates/page.tsx` and `flows/page.tsx`.
    - [x] Ensure visual builders save to Firestore and respect tenant scoping.
- [x] Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)

## Phase 3: Extended Dashboard Audit (Group C)
Goal: Complete the audit for all remaining utility and infrastructure pages.

- [x] Task: Audit & Wire 'Agents & Skills'
    - [x] Scan `dashboard/agents` and `dashboard/skills`.
    - [x] Wire Agent creation and Skill assignment.
- [x] Task: Audit & Wire 'Billing & Usage'
    - [x] Scan `dashboard/billing` and `dashboard/usage`.
    - [x] Ensure Stripe integration and usage counters reflect real data.
- [x] Task: Audit & Wire 'Utilities' (Cron Jobs, Webhooks, Sessions)
    - [x] Scan `dashboard/cron`, `dashboard/webhooks`, `dashboard/sessions`.
    - [x] Implement management logic for each module.
- [x] Task: Conductor - User Manual Verification 'Phase 3' (Protocol in workflow.md)
