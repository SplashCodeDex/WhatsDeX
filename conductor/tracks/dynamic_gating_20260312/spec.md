# Specification: Unified Dynamic Gating (dynamic_gating_20260312)

## 1. Overview
This track implements the **SystemAuthorityService** in the backend to centralize all tier-based restrictions, feature access rules, and agentic skill mappings. The goal is to eliminate data drift between the frontend and backend by providing a single source of truth for "what a user can do" based on their current plan.

## 2. Scope
### 2.1 Backend Implementation (`backend/src/`)
- **SystemAuthorityService:** Create a core service that consolidates logic from `UsageGuard.ts` and hardcoded limits.
- **Capability Matrix:** Define a centralized configuration for all tiers (Starter, Pro, Enterprise):
    - **Usage Limits:** Max messages, max agents, max channels.
    - **Feature Access:** AI Reasoning enabled, Backups enabled, Marketing tools enabled.
    - **Skill Mappings:** List of allowed OpenClaw skills per tier.
- **Authority API:** Create a new endpoint `GET /api/authority/capabilities` that returns the user's specific capability object.

### 2.2 Frontend Implementation (`frontend/src/`)
- **Authority Integration:** Replace all local hardcoded limits (`ChannelSlotGuard.ts`, `SkillGating.ts`, `useCreateAgent.ts`) with data from the `SystemAuthorityService`.
- **Just-in-Time Sync:** Fetch capabilities during dashboard initialization and provide them via a global `useAuthorityStore`.
- **UI Gating:** Components must reactively hide or disable features based on the `SystemAuthorityService` data.

## 3. Acceptance Criteria
- [ ] No hardcoded tier limits or skill lists remain in the frontend codebase.
- [ ] `SystemAuthorityService` correctly returns the expected matrix for each tier.
- [ ] Frontend UI updates instantly when a user's plan is updated (verified via state refresh).
- [ ] Backend API calls (e.g., creating an agent) use `SystemAuthorityService` for server-side validation.

## 4. Non-Functional Requirements
- **Consistency:** Use the same "Capability" terminology across the entire stack.
- **Security:** Server-side validation is mandatory; frontend gating is for UX only.
- **Maintainability:** New tiers or features can be added by updating a single configuration object in the backend.

## 5. Out of Scope
- Implementation of the actual features being gated (e.g., the backup engine itself).
- Payment processing or subscription upgrade logic (handled in `plans_billing` track).
