# Implementation Plan: Hierarchical Agent-Controller Model

## Phase 1: Core Hierarchy Refactor
- [ ] **Task: Update Firestore Schema & Path Resolution**
    - [ ] Update `backend/src/types/firestore.ts` to reflect nested `channels` subcollection.
    - [ ] Update `backend/src/services/FirebaseService.ts` to support the `tenants/{t}/agents/{a}/channels/{c}` path pattern.
- [ ] **Task: Implement AgentService & System Agent**
    - [ ] Create `backend/src/services/AgentService.ts` with logic to ensure `system_default` agent exists for every tenant.
    - [ ] Update `ChannelService.ts` to always create channels within an agent's path.
- [ ] **Task: Write Tests for Hierarchy**
    - [ ] Create `backend/src/services/AgentService.test.ts`.
    - [ ] Verify that deleting an agent logically impacts its child channels.
- [ ] **Task: Conductor - User Manual Verification 'Phase 1: Core Hierarchy Refactor' (Protocol in workflow.md)**

## Phase 2: Path-Aware OpenClaw Integration
- [ ] **Task: Update OpenClaw Adapter Interface**
    - [ ] Modify `ChannelAdapter` and `WhatsappAdapter` to accept `fullPath` during initialization.
    - [ ] Update OpenClaw logging to include the Firestore path context.
- [ ] **Task: Refactor IngressService**
    - [ ] Update `IngressService.ts` to extract Agent and Tenant IDs directly from the path context provided by the adapter.
- [ ] **Task: Write Integration Tests for Path-Awareness**
    - [ ] Verify message routing using the full path from adapter to AI Agent.
- [ ] **Task: Conductor - User Manual Verification 'Phase 2: Path-Aware OpenClaw Integration' (Protocol in workflow.md)**

## Phase 3: Cascading Deletion & Cleanup
- [ ] **Task: Implement Cascading Shutdown**
    - [ ] Add `shutdownAllChannels(agentId)` to `AgentService`.
    - [ ] Integrate with `OpenClawGateway` to ensure live sockets are closed on Agent removal.
- [ ] **Task: Final Cleanup of Flattened Logic**
    - [ ] Remove `ChannelBindingService.ts` (obsolete).
    - [ ] Refactor any remaining `/api/bots` or `/api/channels` (top-level) controllers to the new hierarchical API structure.
- [ ] **Task: Write Tests for Cleanup**
    - [ ] Verify that `AgentService.deleteAgent` successfully shuts down all related connections.
- [ ] **Task: Conductor - User Manual Verification 'Phase 3: Cascading Deletion & Cleanup' (Protocol in workflow.md)**
