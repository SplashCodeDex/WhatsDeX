# Implementation Plan: Hierarchical Agent-Controller Model

## Phase 1: Core Hierarchy Refactor [checkpoint: 510f0d3]
- [x] **Task: Update Firestore Schema & Path Resolution** 427854d
    - [x] Update `backend/src/types/firestore.ts` to reflect nested `channels` subcollection.
    - [x] Update `backend/src/services/FirebaseService.ts` to support the `tenants/{t}/agents/{a}/channels/{c}` path pattern.
- [x] **Task: Implement AgentService & System Agent** 96a56fe
    - [x] Create `backend/src/services/AgentService.ts` with logic to ensure `system_default` agent exists for every tenant.
    - [x] Update `ChannelService.ts` to always create channels within an agent's path.
- [x] **Task: Write Tests for Hierarchy** 1f702d9
    - [x] Create `backend/src/services/AgentService.test.ts`.
    - [x] Verify that deleting an agent logically impacts its child channels.
- [x] **Task: Conductor - User Manual Verification 'Phase 1: Core Hierarchy Refactor' (Protocol in workflow.md)** 510f0d3

## Phase 2: Path-Aware OpenClaw Integration [checkpoint: 9345dbd]
- [x] **Task: Update OpenClaw Adapter Interface** d60f3b9
    - [x] Modify `ChannelAdapter` and `WhatsappAdapter` to accept `fullPath` during initialization.
    - [x] Update OpenClaw logging to include the Firestore path context.
- [x] **Task: Refactor IngressService** 211ee80
    - [x] Update `IngressService.ts` to extract Agent and Tenant IDs directly from the path context provided by the adapter.
- [x] **Task: Write Integration Tests for Path-Awareness** 549d27b
    - [x] Verify message routing using the full path from adapter to AI Agent.
- [x] **Task: Conductor - User Manual Verification 'Phase 2: Path-Aware OpenClaw Integration' (Protocol in workflow.md)** 9345dbd

## Phase 3: Cascading Deletion & Cleanup
- [x] **Task: Implement Cascading Shutdown** 535b654
    - [x] Add `shutdownAllChannels(agentId)` to `AgentService`.
    - [x] Integrate with `OpenClawGateway` to ensure live sockets are closed on Agent removal.
- [ ] **Task: Final Cleanup of Flattened Logic**
    - [ ] Remove `ChannelBindingService.ts` (obsolete).
    - [ ] Refactor any remaining `/api/bots` or `/api/channels` (top-level) controllers to the new hierarchical API structure.
- [ ] **Task: Write Tests for Cleanup**
    - [ ] Verify that `AgentService.deleteAgent` successfully shuts down all related connections.
- [ ] **Task: Conductor - User Manual Verification 'Phase 3: Cascading Deletion & Cleanup' (Protocol in workflow.md)**
