# Implementation Plan: Connection Management Gaps (Audit Fix Phase 1)

## Phase 1: Wiring Lifecycle Actions
- [ ] Task: TDD - Implement/Leverage Backend API for stopping a channel
    - [ ] **Investigate**: Check `multiTenant.ts` for existing `/disconnect` route and verify if it's fully wired to `ChannelService.stopChannel`.
    - [ ] Write failing test for the endpoint (or enhance existing ones).
    - [ ] Implement/Fix the wiring to ensure Firestore and Memory states are synced.
- [ ] Task: TDD - Implement/Leverage Backend API for deleting a channel (Basic)
    - [ ] **Investigate**: Check existing `DELETE` routes in `multiTenant.ts`.
    - [ ] Write failing test for the endpoint.
    - [ ] Ensure `ChannelService.deleteChannel` correctly cleans up.
- [ ] Task: UI - Wire "Stop" button in Manage Dialog
    - [ ] **Investigate**: Check if `OmnichannelHubContent.tsx` or `ChannelCard` has commented out logic for disconnect.
    - [ ] Add "Stop Bot" button to the Manage Connection modal.
    - [ ] Implement API call and update local store.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Wiring Lifecycle Actions' (Protocol in workflow.md)

## Phase 2: Advanced Deletion Logic
- [ ] Task: TDD - Implement "Archive" option in `ChannelService.deleteChannel`
    - [ ] **Investigate**: Check `ChannelSchema` in `contracts.ts` for an `archived` status or similar.
    - [ ] Update `deleteChannel` to accept an `options` object `{ archive: boolean }`.
    - [ ] If `archive: true`, only shutdown adapter but keep Firestore doc (mark as `archived`).
- [ ] Task: UI - "Delete Channel" Confirmation Modal
    - [ ] Implement a destructive action modal with radio buttons: "Hard Delete" vs "Archive".
    - [ ] Wire to the updated backend logic.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Advanced Deletion Logic' (Protocol in workflow.md)

## Phase 3: Agent Assignment UI/UX
- [ ] Task: UI - Add Agent Selector to `ChannelConnectionForm`
    - [ ] **Investigate**: Check if `AgentService` has existing "move channel" or "assign" methods we can reuse.
    - [ ] Fetch available agents for the tenant.
    - [ ] Add a `Select` component to the form.
- [ ] Task: UI - Display Assigned Agent on Channel Card
    - [ ] **Investigate**: Check if the `Channel` type already includes `assignedAgentId` in the frontend store.
    - [ ] Show agent name/badge on the card for quick identification.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Agent Assignment UI/UX' (Protocol in workflow.md)

## Phase 4: Real-time Status Sync
- [ ] Task: Backend - Emit status changes via WebSockets
    - [ ] **Investigate**: Check `SocketService` for existing `channel_status` or `bot_update` events.
    - [ ] Update `ChannelService.updateStatus` to trigger a socket emission.
    - [ ] Ensure `AuthSystem` events are piped to the socket.
- [ ] Task: Frontend - Update store on Socket Event
    - [ ] Enhance `OmnichannelSocketManager` to handle `channel_status_update`.
    - [ ] Verify UI updates without refresh.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Real-time Status Sync' (Protocol in workflow.md)
