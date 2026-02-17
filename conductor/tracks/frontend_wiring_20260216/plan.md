# Plan: Frontend Wiring & Real-time Status

## Phase 1: Backend Emitters & Granular Status [checkpoint: pending]
Update the backend to broadcast detailed connection progress and activity events.

- [x] Task: Backend - Extend `socketService.ts` with `bot_progress_update` and `activity_event` emitters
- [x] Task: Backend - Update `multiTenantBotService.ts` to emit granular progress during bot startup
- [x] Task: Backend - Emit activity events in `handleIncomingMessage` and `sendMessage`
- [~] Task: Conductor - User Manual Verification 'Phase 1: Backend Emitters' (Protocol in workflow.md)

## Phase 2: Frontend State & Real-time Hooks
Implement the client-side infrastructure to manage live omnichannel data.

- [~] Task: Frontend - Create `useOmnichannelStore` in Zustand to manage channels and activity
- [ ] Task: Frontend - Implement `fetchChannels` action using the `/api/omnichannel/status` endpoint
- [ ] Task: Frontend - Set up WebSocket listeners in `OmnichannelHub` for live updates
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Frontend State' (Protocol in workflow.md)

## Phase 3: Dynamic Hub & Connection Workflow
Wire the UI to the real data and implement the "Instant Feedback" connection flow.

- [ ] Task: Frontend - Refactor `OmnichannelHubPage` to use the new store instead of static data
- [ ] Task: Frontend - Implement `ChannelProgressStepper` component for the "connecting" card state
- [ ] Task: Frontend - Wire `ChannelConnectionForm` to trigger bot creation and handle the "Background Connection" transition
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Dynamic Hub' (Protocol in workflow.md)

## Phase 4: Activity Feed & Refinement
Build the streaming feed and polish the user experience.

- [ ] Task: Frontend - Implement the `ActivityFeed` component with real-time log entries
- [ ] Task: Frontend - Add platform-based filtering to the activity feed
- [ ] Task: Frontend - Ensure automatic reconnection logic for the WebSocket stream
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Activity Feed' (Protocol in workflow.md)
