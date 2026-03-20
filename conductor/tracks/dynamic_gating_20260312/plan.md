# Implementation Plan: Unified Dynamic Gating (dynamic_gating_20260312)

## Phase 1: Backend Authority Core [checkpoint: f9a8580]
- [x] Task: Create `SystemAuthorityService.ts` with the master Capability Matrix [x]
- [x] Task: Migrate logic from `UsageGuard.ts` into `SystemAuthorityService.ts` [x]
- [x] Task: Implement `GET /api/authority/capabilities` endpoint [x]
- [x] Task: Write unit tests for `SystemAuthorityService` verifying tier outputs [x]

## Phase 2: Backend Enforcement
- [x] Task: Update `AgentService.ts` to use `SystemAuthorityService` for agent creation limits [x]
- [x] Task: Update `ChannelService.ts` to use `SystemAuthorityService` for slot limits [x]
- [x] Task: Update `GeminiAI.ts` and `SkillsManager.ts` to use `SystemAuthorityService` for skill gating [x]

## Phase 3: Frontend Authority Bridge
- [x] Task: Create `useAuthorityStore.ts` in Zustand to manage the fetched capability matrix [x]
- [x] Task: Implement capability fetching in the root Dashboard layout [x]
- [x] Task: Refactor `ChannelSlotGuard.ts` and `SkillGating.ts` to delegate to `useAuthorityStore` [x]

## Phase 4: UI Cleanup & Verification
- [x] Task: Update `AgentsDashboard.tsx` and `TemplateSelector.tsx` to use dynamic model/feature flags [x]
- [x] Task: Remove all deprecated hardcoded limit files from `frontend/src/features/agents/` [x]
- [x] Task: Final end-to-end verification of tier-based restriction enforcement [x]
