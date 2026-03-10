# Implementation Plan: fix_connection_flaws_20260310

## Phase 1: Connection Status & Reconnection Logic

- [x] **Task: Implement QR Pending Status**
    - [x] Write Tests for `AuthSystem` QR Event Status Update
    - [x] Implement Status Update in `AuthSystem.ts` 699df22
- [x] **Task: Implement Exponential Backoff for Reconnection**
    - [x] Write Tests for Reconnection Backoff in `AuthSystem`
    - [x] Implement Backoff Logic in `AuthSystem.ts` 699df22
- [x] **Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md)**

## Phase 2: Path-Aware Routing Fix

- [x] **Task: Update Adapter on Channel Move**
    - [x] Write Tests for `ChannelService.moveChannel` Adapter Update
    - [x] Update `ChannelService.ts` to Restart or Update the Adapter cd752ba

- [x] **Task: Verify Path-Aware Ingress Routing**
    - [x] Write Tests for `IngressService` Path Resolution 4dfe9a1
    - [x] Ensure `IngressService` Properly Resolves Agent from `fullPath` cd752ba
- [x] **Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)**

## Phase 3: Authentication Data Cleanup

- [x] **Task: Clean Up Auth Data on Deletion**
    - [x] Write Tests for `ChannelService.deleteChannel` Auth Data Cleanup 29c15d6
    - [x] Implement Cleanup Logic in `ChannelService.ts` 29c15d6
- [x] **Task: Conductor - User Manual Verification 'Phase 3' (Protocol in workflow.md)**
