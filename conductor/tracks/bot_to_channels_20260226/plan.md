# Implementation Plan: Refactor Bot to Channels

## Phase 1: Archival & Scaffolding
- [ ] **Task: Archive Legacy Bot Logic**
    - [ ] Create `backend/src/archive/` directory.
    - [ ] Move `MultiTenantBotService.ts` and related specialized logic to the archive.
    - [ ] Ensure the project still compiles after the move (placeholder replacements if needed).
- [ ] **Task: Define Unified Channel Schema**
    - [ ] Update `backend/src/types/contracts.ts` and `firestore.ts` with the new `Channel` and `AgentBinding` definitions.
    - [ ] Create Zod schemas for the new Channel entities.
- [ ] **Task: Scaffold ChannelService**
    - [ ] Create `backend/src/services/ChannelService.ts` to manage the lifecycle of connectivity slots.
    - [ ] Implement basic CRUD for Channels in Firestore.
- [ ] **Task: Conductor - User Manual Verification 'Phase 1: Archival & Scaffolding' (Protocol in workflow.md)**

## Phase 2: WhatsApp Channel Refactor
- [ ] **Task: Implement WhatsApp Channel Adapter**
    - [ ] Refactor Baileys connection logic into a dedicated `WhatsappAdapter`.
    - [ ] Implement standalone connection, QR generation, and state management for WhatsApp channels.
- [ ] **Task: Write Tests for WhatsApp Connectivity**
    - [ ] Create `backend/src/services/channels/whatsapp/WhatsappAdapter.test.ts`.
    - [ ] Verify connection lifecycle independent of AI Agents.
- [ ] **Task: Implement Connection Persistence**
    - [ ] Ensure channel sessions are correctly stored and recovered using the existing Firestore auth state logic.
- [ ] **Task: Conductor - User Manual Verification 'Phase 2: WhatsApp Channel Refactor' (Protocol in workflow.md)**

## Phase 3: Agent-Channel Orchestration
- [ ] **Task: Implement ChannelBindingService**
    - [ ] Create `backend/src/services/ChannelBindingService.ts` to manage the links between Agents and Channels.
    - [ ] Implement logic to resolve the "Active Brain" for a given "Channel Slot".
- [ ] **Task: Implement Webhook Mode**
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
