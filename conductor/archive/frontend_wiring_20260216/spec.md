# Specification: Frontend Wiring & Real-time Status

## 1. Overview
This track focuses on connecting the newly created `OmnichannelHub` UI to the backend engine and providing a real-time experience. Users will see live status updates for their bots across all platforms and a streaming activity feed of messaging and AI skill events.

## 2. Functional Requirements

### 2.1 Live Data Fetching
- **Client-side Hydration:** Implement a client-side fetching strategy (via Zustand/Hooks) to load the initial bot list from `/api/omnichannel/status`.
- **WebSocket Synchronization:** Integrate with the existing `socketService.ts` to listen for `bot_status_update` and `bot_log` events, surgically updating the UI state.

### 2.2 Connection Workflow
- **Instant Feedback:** Upon submitting a connection form (Telegram/Discord), the UI will close the form and immediately create a placeholder card.
- **Live Progress Stepper:** The placeholder card will display a "Connecting..." state with granular progress steps ("Verifying Token", "Connecting to Gateway", "Starting Bot") as received from the backend.

### 2.3 Real-time Activity Feed
- **Live Stream:** Implement a scrollable activity feed in the Hub that displays:
  - **Messaging Events:** "Message received from..." or "Reply sent via..." with platform icons.
  - **Skills Events:** "Web Search triggered" or "Math result computed".
- **Filtering:** Allow users to filter activity by platform (WhatsApp, Telegram, etc.).

## 3. Technical Requirements
- **Backend Emitters:** Update `multiTenantBotService.ts` and `ChannelManager.ts` to emit granular status events via `socketService`.
- **Frontend State:** Create a `useOmnichannelStore` in Zustand to manage the global state of all connected channels and the live activity log.
- **Resilience:** Implement automatic reconnection logic for the WebSocket listener if the connection is dropped.

## 4. Acceptance Criteria
- [ ] Omnichannel Hub loads the actual list of bots from Firestore on mount.
- [ ] Changing a bot's status in the backend (e.g., stopping a bot) is reflected in the Hub within 1 second without page refresh.
- [ ] Connecting a new Telegram bot shows a progress stepper on the card during the connection phase.
- [ ] Inbound messages from any platform appear in the "Channel Activity" feed in real-time.
- [ ] AI skill triggers (e.g., Web Search) are visible in the activity feed.

## 5. Out of Scope
- Implementing the actual backend logic for Discord/Slack (covered in Phase 4 of the previous track).
- Persistent activity history (feed will be session-based for now).
