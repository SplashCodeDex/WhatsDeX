# Specification: Comprehensive Dashboard Audit & Functional Wiring

## Overview
DeXMart currently contains several placeholder components, hardcoded strings, and unwired UI elements ("simulations"). This track aims to identify these elements, investigate their intended behavior within the multi-tenant and gated architecture, and implement full functional wiring.

## Problem Statement
- Several dashboard pages (Overview, Channels, Settings, etc.) contain "dead" UI elements or simulated data.
- Logic for multi-tenant isolation and feature gating needs to be consistently applied to all live components.
- Placeholders reduce the enterprise-grade reliability and utility of the platform.

## Functional Requirements
1. **Systematic Audit:** Scan prioritized pages for TODOs, hardcoded placeholders (e.g., "Coming Soon", "123 items"), and buttons/forms without functional handlers.
2. **Deep Investigation:** For every placeholder found, investigate the `AuthStore` (tenant context) and `ConfigService` (feature gating) to determine the correct live data flow.
3. **End-to-End Wiring:** 
    - Replace simulated state with live data fetched via `apiClient`.
    - Wire frontend forms/buttons to existing or new backend service methods.
    - Ensure proper error handling and optimistic UI updates where applicable.
4. **Architecture Alignment:** All fixes must strictly adhere to:
    - **Multi-Tenancy:** Data must be scoped to the active tenant ID.
    - **Feature Gating:** Functionality must check subscription tiers (Free vs. Premium).
    - **Modern Standards:** Use React 19 patterns, Zustand for client state, and Zod for validation.

## Priority Sequence
1. **Group A:** Settings, Config, Nodes, System Logs.
2. **Group B:** Overview, Channels, Messages, Templates, Flows.
3. **Group C:** Contacts, Agents, Skills, Store, Cron Jobs, Webhooks, Sessions, Usage, Billing.

## Acceptance Criteria
- [ ] No "simulated" or "hardcoded" data remains on audited pages.
- [ ] All UI controls (buttons, toggles, forms) perform actual API/State updates.
- [ ] Tenant isolation is verified for all newly wired features.
- [ ] Feature gating correctly blocks/enables features based on plan limits.
- [ ] Real-time updates (WebSockets) are used where appropriate (e.g., System Logs, Nodes).

## Out of Scope
- Large-scale UI redesigns (unless required for functional wiring).
- Implementing entirely new modules not mentioned in the audit list.
