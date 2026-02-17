# Plan: Frontend Wiring & Real-time Status

## Phase 1: Backend Emitters & Granular Status [checkpoint: 25c3fac]
Update the backend to broadcast detailed connection progress and activity events.

- [x] Task: Backend - Extend `socketService.ts` with `bot_progress_update` and `activity_event` emitters 25c3fac
- [x] Task: Backend - Update `multiTenantBotService.ts` to emit granular progress during bot startup 25c3fac
- [x] Task: Backend - Emit activity events in `handleIncomingMessage` and `sendMessage` 25c3fac
- [x] Task: Conductor - User Manual Verification 'Phase 1: Backend Emitters' (Protocol in workflow.md) 25c3fac

## Phase 2: Frontend State & Real-time Hooks [checkpoint: 1a5fff6]
Implement the client-side infrastructure to manage live omnichannel data.

- [x] Task: Frontend - Create `useOmnichannelStore` in Zustand to manage channels and activity 1a5fff6
- [x] Task: Frontend - Implement `fetchChannels` action using the `/api/omnichannel/status` endpoint 1a5fff6
- [x] Task: Frontend - Set up WebSocket listeners in `OmnichannelHub` for live updates 1a5fff6
- [x] Task: Conductor - User Manual Verification 'Phase 2: Frontend State' (Protocol in workflow.md) 1a5fff6

## Phase 3: Dynamic Hub & Connection Workflow [checkpoint: ed82513]
Wire the UI to the real data and implement the "Instant Feedback" connection flow.

- [x] Task: Frontend - Refactor `OmnichannelHubPage` to use the new store instead of static data ed82513
- [x] Task: Frontend - Implement `ChannelProgressStepper` component for the "connecting" card state ed82513
- [x] Task: Frontend - Wire `ChannelConnectionForm` to trigger bot creation and handle the "Background Connection" transition ed82513
- [x] Task: Conductor - User Manual Verification 'Phase 3: Dynamic Hub' (Protocol in workflow.md) ed82513

## Phase 4: Activity Feed & Refinement [checkpoint: pending]
Build the streaming feed and polish the user experience.

- [x] Task: Frontend - Implement the `ActivityFeed` component with real-time log entries
- [x] Task: Frontend - Add platform-based filtering to the activity feed
- [x] Task: Frontend - Ensure automatic reconnection logic for the WebSocket stream
- [~] Task: Conductor - User Manual Verification 'Phase 4: Activity Feed' (Protocol in workflow.md)
