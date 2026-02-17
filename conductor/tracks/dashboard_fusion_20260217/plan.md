# Plan: Omnichannel Dashboard Fusion

## Phase 1: High-Fidelity Sidebar & Navigation [checkpoint: 5190887]
Refactor the dashboard layout to support the new categorized structure.

- [x] Task: Frontend - Implement `SidebarGroup` and `SidebarItem` components using Shadcn
- [x] Task: Frontend - Update `dashboard/layout.tsx` to include the new grouped navigation (Main, Automation, Intelligence, Infra)
- [x] Task: Frontend - Implement collapsible functionality for sidebar categories
- [x] Task: Conductor - User Manual Verification 'Phase 1: Sidebar' (Protocol in workflow.md)

## Phase 2: Intelligence & Automation Pages [checkpoint: pending]
Port the core "Brain" and "Task" management UIs.

- [x] Task: Frontend - Implement the `Cron Jobs` page (`dashboard/cron`) with task creation forms
- [x] Task: Frontend - Implement the `Skills Store` page (`dashboard/skills`) with tier-gating logic
- [x] Task: Frontend - Implement the `Agents` page (`dashboard/agents`) for workspace management
- [x] Task: Conductor - User Manual Verification 'Phase 2: Intelligence & Automation' (Protocol in workflow.md)

## Phase 3: Infrastructure & Usage Monitoring [checkpoint: pending]
Port the low-level system and data tracking UIs.

- [x] Task: Frontend - Implement the `Usage` page (`dashboard/usage`) with token consumption charts
- [x] Task: Frontend - Implement the `Sessions` page (`dashboard/sessions`) for active thread management
- [x] Task: Frontend - Implement the `Nodes` page (`dashboard/nodes`) for mobile device pairing
- [x] Task: Frontend - Implement the `System Logs` page (`dashboard/logs`) with real-time tailing
- [x] Task: Conductor - User Manual Verification 'Phase 3: Infrastructure' (Protocol in workflow.md)

## Phase 4: Integration & Visual Polish [checkpoint: pending]
Ensure all pages are fully wired and "Pixel Perfect."

- [x] Task: Frontend - Refactor `dashboard/home` to include OpenClaw health and latency metrics
- [x] Task: Frontend - Apply WhatsDeX premium shadows and gradients to all ported components
- [~] Task: Frontend - Final pass on responsive layout for all 12+ dashboard sections
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Final Fusion' (Protocol in workflow.md)
