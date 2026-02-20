# Implementation Plan: Unified Agent Intelligence & Omnichannel Chat

This plan implements a consolidated "Super-Agent" model, merging legacy bot logic into the OpenClaw-powered Agent orchestration system, with integrated billing enforcement.

## Phase 1: Core Agent Identity & Tiered Creation [checkpoint: fb295866]
Focus on the "Brain" and enforcing quantity limits per plan.

- [x] Task: Define Zod schemas for the Unified Agent, Templates, and Billing Context. a0d33996
- [x] Task: Implement Template Data Store (Sales, Support, Assistant). c6a0e01d
- [x] Task: Create Tier-Aware Agent Creation Hook (TDD). afdd9511
    - [x] Sub-task: Write tests to ensure Starter plan cannot create >1 agent, Pro >5, etc.
    - [x] Sub-task: Implement `useCreateAgent` with Firestore transactional checks against the user's `planTier`.
- [x] Task: Implement Template Selection UI with "Premium" badges for tier-locked templates. 19a2b65b
- [x] Task: Conductor - User Manual Verification 'Phase 1: Core Agent Identity' (Protocol in workflow.md) fb295866

## Phase 2: Dynamic Channel Connectivity & Slot Enforcement [checkpoint: e5592c0f]
Focus on the "Phone" and limiting the number of active channel connections.

- [x] Task: Refactor Channel Instance Logic (TDD) for Baileys/Telegram. 63e9b40c
- [x] Task: Implement "Connectivity" Tab in Agent Settings. 72274cda
- [x] Task: Implement Billing Tier Enforcement for Channel Slots. 2d86637f
    - [x] Sub-task: Write tests for `ChannelSlotGuard` to enforce limits on active connections (e.g., 1 channel for Starter, 3 for Pro).
    - [x] Sub-task: Implement UI alerts/modals suggesting an upgrade when limits are reached.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Dynamic Connectivity' (Protocol in workflow.md) e5592c0f

## Phase 3: Omnichannel Chat & Skill Gating
Focus on interaction and restricting advanced AI capabilities to higher tiers.

- [x] Task: Standardize Omnichannel Message Schema. d6e65a4e
- [x] Task: Implement Unified Inbox UI with Channel Filtering. e59af74e
- [ ] Task: Implement Skill Gating Logic (TDD).
    - Sub-task: Write tests to ensure "Web Search" and "File Analysis" tools are rejected for Starter users.
    - Sub-task: Update `frontend/src/features/agents/components/SkillToggle.tsx` to show lock icons for premium skills.
- [ ] Task: Implement Real-time Tool Activity Stream (Socket.io).
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Omnichannel Chat' (Protocol in workflow.md)

## Phase 4: Automation, Broadcasts & Usage Caps
Focus on scalability and enforcing monthly volume limits.

- [ ] Task: Implement Cron-based Auto-Posting (TDD) with Tiered Frequency.
    - Sub-task: Restrict high-frequency posting (e.g., every 5 mins) to Enterprise users.
- [ ] Task: Implement Multi-Channel Broadcast Engine with Usage Tracking.
    - Sub-task: Create `usage_metrics` collection in Firestore to track monthly message volume.
    - Sub-task: Implement `UsageGuard` to stop broadcasts if the monthly limit is exceeded (Starter vs. Pro vs. Enterprise).
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Automation' (Protocol in workflow.md)
