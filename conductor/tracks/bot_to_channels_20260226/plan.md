# Implementation Plan: Refactor Bot to Channels

## Phase 1: Archival & Scaffolding [checkpoint: c89c5a1]
- [x] **Task: Archive Legacy Bot Logic** 2b55bd9
    - [x] Create `backend/src/archive/` directory.
    - [x] Move `MultiTenantBotService.ts` and related specialized logic to the archive.
    - [x] Ensure the project still compiles after the move (placeholder replacements if needed).
- [x] **Task: Define Unified Channel Schema** b59f3f2913
    - [x] Update `backend/src/types/contracts.ts` and `firestore.ts` with the new `Channel` and `AgentBinding` definitions.
    - [x] Create Zod schemas for the new Channel entities.
- [x] **Task: Scaffold ChannelService** 8feed08
    - [x] Create `backend/src/services/ChannelService.ts` to manage the lifecycle of connectivity slots.
    - [x] Implement basic CRUD for Channels in Firestore.
- [x] **Task: Conductor - User Manual Verification 'Phase 1: Archival & Scaffolding' (Protocol in workflow.md)** c89c5a1

## Phase 2: WhatsApp Channel Refactor [checkpoint: c036708]
- [x] **Task: Implement WhatsApp Channel Adapter** 9e26e56
    - [x] Refactor Baileys connection logic into a dedicated `WhatsappAdapter`.
    - [x] Implement standalone connection, QR generation, and state management for WhatsApp channels.
- [x] **Task: Write Tests for WhatsApp Connectivity** a94f41d
    - [x] Create `backend/src/services/channels/whatsapp/WhatsappAdapter.test.ts`.
    - [x] Verify connection lifecycle independent of AI Agents.
- [x] **Task: Implement Connection Persistence** d49dda2
    - [x] Ensure channel sessions are correctly stored and recovered using the existing Firestore auth state logic.
- [x] **Task: Conductor - User Manual Verification 'Phase 2: WhatsApp Channel Refactor' (Protocol in workflow.md)** c036708

## Phase 3: Agent-Channel Orchestration
- [x] **Task: Implement ChannelBindingService** 3e9e040
    - [x] Create `backend/src/services/ChannelBindingService.ts` to manage the links between Agents and Channels.
    - [x] Implement logic to resolve the "Active Brain" for a given "Channel Slot".
- [~] **Task: Implement Webhook Mode**
    - [ ] Update the message ingress pipeline to check for an assigned Agent.
    - [ ] If no Agent is assigned, forward the message to `WebhookService`.
- [ ] **Task: Integrate with GeminiAI**
    - [ ] Update `GeminiAI.ts` to pull its context and personality based on the new Agent-Channel binding.
- [ ] **Task: Write Tests for Orchestration**
    - [ ] Verify message routing: User -> Channel -> (Agent exists ? Agent Respond : Webhook Forward).
- [ ] **Task: Conductor - User Manual Verification 'Phase 3: Agent-Channel Orchestration' (Protocol in workflow.md)**

## Phase 4: Final Cleanup & Integration
- [ ] **Task: Update Global Context**
    - [ ] Refactor `backend/src/lib/context.ts` to remove `multiTenantBotService` and inject `ChannelService` and `ChannelBindingService`.
- [ ] **Task: Retirement of Legacy Routes**
    - [ ] Remove or redirect `/api/bots` endpoints to the new `/api/channels` equivalents.
- [ ] **Task: Final System Verification**
    - [ ] Run full test suite and verify no regressions in OpenClaw skill bridging.
- [ ] **Task: Conductor - User Manual Verification 'Phase 4: Final Cleanup & Integration' (Protocol in workflow.md)**
