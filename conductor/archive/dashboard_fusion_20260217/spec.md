# Specification: Omnichannel Dashboard Fusion

## 1. Overview
This track involves the "UI Fusion" of WhatsDeX and OpenClaw. We will port OpenClaw's rich, data-heavy features into the WhatsDeX Next.js dashboard, maintaining the WhatsDeX brand and Tailwind 4.0 aesthetic. This transformation turns WhatsDeX into a high-fidelity "Control Center" for omnichannel AI agents.

## 2. Functional Requirements

### 2.1 Navigation & Structure
- **Categorized Sidebar:** Implement a collapsible, grouped sidebar in WhatsDeX following OpenClaw's hierarchy:
  - **Main:** Home (Overview), Bots (Channels), Contacts, Messages.
  - **Automation:** Cron Jobs, Webhooks.
  - **Intelligence:** Agents, Skills Store.
  - **Infrastructure:** Nodes, Config, System Logs.
- **Dynamic Routing:** All new pages will be native Next.js routes within the `(dashboard)` group.

### 2.2 Feature Porting (React/Shadcn)
- **Enhanced Overview:** Inject OpenClaw's health beacons, uptime metrics, and average latency stats into the WhatsDeX Home page.
- **Sessions & Usage:** Create new pages for detailed token usage tracking and active session management (compaction status, etc.).
- **Cron Engine UI:** A high-fidelity interface to schedule recurring agent runs and system wakeups.
- **Node Management:** UI to manage paired mobile nodes and their capabilities (Camera, Screen, etc.).

### 2.3 Branded Personality
- **Tailwind 4.0 Integration:** Every ported component must use the `@theme` tokens of WhatsDeX (Mastermind colors, premium shadows).
- **Lucide Iconography:** Maintain consistent icon sets across all pages.
- **Multi-Tenant Scoping:** Ensure that data on every page (Usage, Cron, Logs) is strictly filtered by the authenticated `tenantId`.

## 3. Technical Requirements
- **Porting Strategy:** Manually convert OpenClaw's Lit views (`ui/src/ui/views/`) into React Server and Client Components.
- **State Management:** Use the `useOmnichannelStore` (Zustand) to bridge real-time gateway data with the UI.
- **API Consistency:** Leverage the `/api/omnichannel/*` and `/api/internal/*` endpoints for all data operations.

## 4. Acceptance Criteria
- [ ] Sidebar is categorized and collapsible, containing all 12+ OpenClaw-derived sections.
- [ ] The "Cron Jobs" page allows creating and managing recurring tasks for any bot.
- [ ] Token usage is displayed with high-fidelity charts (porting OpenClaw's usage views).
- [ ] Nodes page displays paired mobile devices with their real-time statuses.
- [ ] The overall UI remains "Pixel Perfect" and follows the WhatsDeX design system.

## 5. Out of Scope
- Migrating OpenClaw's TUI (terminal interface).
- Porting OpenClaw's macOS/iOS native apps (this track focuses on the Web Dashboard).
