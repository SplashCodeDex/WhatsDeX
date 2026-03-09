# Implementation Plan: Connection Management Gaps (Audit Fix Phase 1)

## Phase 1: Wiring Lifecycle Actions [checkpoint: a5f820d]
- [x] Task: TDD - Implement/Leverage Backend API for stopping a channel 4a9af31
    - [x] **Investigate**: Check `multiTenant.ts` for existing `/disconnect` route and verify if it's fully wired to `ChannelService.stopChannel`.
    - [x] Write failing test for the endpoint (or enhance existing ones).
    - [x] Implement/Fix the wiring to ensure Firestore and Memory states are synced.
- [x] Task: TDD - Implement/Leverage Backend API for deleting a channel (Basic) 4a9af31
    - [x] **Investigate**: Check existing `DELETE` routes in `multiTenant.ts`.
    - [x] Write failing test for the endpoint.
    - [x] Ensure `ChannelService.deleteChannel` correctly cleans up.
- [x] Task: UI - Wire "Stop" button in Manage Dialog 8f0a2cb7
    - [x] **Investigate**: Check if `OmnichannelHubContent.tsx` or `ChannelCard` has commented out logic for disconnect.
    - [x] Add "Stop Bot" button to the Manage Connection modal.
    - [x] Implement API call and update local store.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Wiring Lifecycle Actions' (Protocol in workflow.md) a5f820d

## Phase 2: Advanced Deletion Logic [checkpoint: ea7a7d1]
- [x] Task: TDD - Implement "Archive" option in `ChannelService.deleteChannel` ea7a7d1
    - [x] **Investigate**: Check `ChannelSchema` in `contracts.ts` for an `archived` status or similar.
    - [x] Update `deleteChannel` to accept an `options` object `{ archive: boolean }`.
    - [x] If `archive: true`, only shutdown adapter but keep Firestore doc (mark as `archived`).
- [x] Task: UI - "Delete Channel" Confirmation Modal ea7a7d1
    - [x] Implement a destructive action modal with radio buttons: "Hard Delete" vs "Archive".
    - [x] Wire to the updated backend logic.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Advanced Deletion Logic' (Protocol in workflow.md) ea7a7d1

## Phase 3: Agent Assignment UI/UX [checkpoint: 8f0a2cb7]
- [x] Task: UI - Add Agent Selector to `ChannelConnectionForm` 8f0a2cb7
    - [x] **Investigate**: Check if `AgentService` has existing "move channel" or "assign" methods we can reuse.
    - [x] Fetch available agents for the tenant.
    - [x] Add a `Select` component to the form.
- [x] Task: UI - Display Assigned Agent on Channel Card 8f0a2cb7
    - [x] **Investigate**: Check if the `Channel` type already includes `assignedAgentId` in the frontend store.
    - [x] Show agent name/badge on the card for quick identification.
- [x] Task: Conductor - User Manual Verification 'Phase 3: Agent Assignment UI/UX' (Protocol in workflow.md) 8f0a2cb7

## Phase 4: Real-time Status Sync
- [~] Task: Backend - Emit status changes via WebSockets
    - [ ] **Investigate**: Check `SocketService` for existing `channel_status` or `bot_update` events.
    - [ ] Update `ChannelService.updateStatus` to trigger a socket emission.
    - [ ] Ensure `AuthSystem` events are piped to the socket.
- [ ] Task: Frontend - Update store on Socket Event
    - [ ] Enhance `OmnichannelSocketManager` to handle `channel_status_update`.
    - [ ] Verify UI updates without refresh.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Real-time Status Sync' (Protocol in workflow.md)
