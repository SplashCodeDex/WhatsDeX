# Plan: Omnichannel Dashboard Fusion

## Phase 1: High-Fidelity Sidebar & Navigation [checkpoint: 5190887]
Refactor the dashboard layout to support the new categorized structure.

- [x] Task: Frontend - Implement `SidebarGroup` and `SidebarItem` components using Shadcn 5190887
- [x] Task: Frontend - Update `dashboard/layout.tsx` to include the new grouped navigation (Main, Automation, Intelligence, Infra) 5190887
- [x] Task: Frontend - Implement collapsible functionality for sidebar categories 5190887
- [x] Task: Conductor - User Manual Verification 'Phase 1: Sidebar' (Protocol in workflow.md) 5190887

## Phase 2: Intelligence & Automation Pages [checkpoint: fd55d39]
Port the core "Brain" and "Task" management UIs.

- [x] Task: Frontend - Implement the `Cron Jobs` page (`dashboard/cron`) with task creation forms fd55d39
- [x] Task: Frontend - Implement the `Skills Store` page (`dashboard/skills`) with tier-gating logic fd55d39
- [x] Task: Frontend - Implement the `Agents` page (`dashboard/agents`) for workspace management fd55d39
- [x] Task: Conductor - User Manual Verification 'Phase 2: Intelligence & Automation' (Protocol in workflow.md) fd55d39

## Phase 3: Infrastructure & Usage Monitoring [checkpoint: fd55d39]
Port the low-level system and data tracking UIs.

- [x] Task: Frontend - Implement the `Usage` page (`dashboard/usage`) with token consumption charts fd55d39
- [x] Task: Frontend - Implement the `Sessions` page (`dashboard/sessions`) for active thread management fd55d39
- [x] Task: Frontend - Implement the `Nodes` page (`dashboard/nodes`) for mobile device pairing fd55d39
- [x] Task: Frontend - Implement the `System Logs` page (`dashboard/logs`) with real-time tailing fd55d39
- [x] Task: Conductor - User Manual Verification 'Phase 3: Infrastructure' (Protocol in workflow.md) fd55d39

## Phase 4: Integration & Visual Polish [checkpoint: fd55d39]
Ensure all pages are fully wired and "Pixel Perfect."

- [x] Task: Frontend - Refactor `dashboard/home` to include OpenClaw health and latency metrics fd55d39
- [x] Task: Frontend - Apply WhatsDeX premium shadows and gradients to all ported components fd55d39
- [x] Task: Frontend - Final pass on responsive layout for all 12+ dashboard sections fd55d39
- [x] Task: Conductor - User Manual Verification 'Phase 4: Final Fusion' (Protocol in workflow.md) fd55d39
