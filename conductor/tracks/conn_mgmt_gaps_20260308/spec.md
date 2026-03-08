# Specification: Connection Management Gaps (Audit Fix Phase 1)

## Overview
Address "orphan" logic related to channel lifecycle and agent assignment discovered in the Omnichannel audit.

## Functional Requirements
1. **Manage Connection Dialog**:
    - Wire "Stop Channel" button to `ChannelService.stopChannel`.
    - Wire "Delete Channel" button to `ChannelService.deleteChannel`.
2. **Advanced Deletion**:
    - Provide a confirmation dialog for deletion with an option to:
        - **Hard Delete**: Wipe all Firestore data and logs.
        - **Archive**: Remove live connectivity but preserve message history.
3. **Agent Assignment**:
    - Add an "Agent" dropdown to `ChannelConnectionForm` to allow selecting an agent (other than `system_default`) during creation.
    - Surface current assigned agent on the Channel Card.
4. **WebSocket Synchronization**:
    - Ensure `ChannelWatchdog` and `AuthSystem` emit status updates via `SocketService`.
    - Frontend `OmnichannelSocketManager` should update the store immediately on receipt.

## Acceptance Criteria
- User can successfully disconnect a channel from the UI.
- User can delete a channel and verify either full cleanup or preserved history based on choice.
- New channels can be assigned to specific agents during creation.
- Live status (e.g., 'connecting' -> 'connected') is reflected in UI without page refresh.
