# Implementation Plan: fix_connection_flaws_20260310

## Phase 1: Connection Status & Reconnection Logic

- [ ] **Task: Implement QR Pending Status**
    - [ ] Write Tests for `AuthSystem` QR Event Status Update
    - [ ] Implement Status Update in `AuthSystem.ts`
- [ ] **Task: Implement Exponential Backoff for Reconnection**
    - [ ] Write Tests for Reconnection Backoff in `AuthSystem`
    - [ ] Implement Backoff Logic in `AuthSystem.ts`
- [ ] **Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md)**

## Phase 2: Path-Aware Routing Fix

- [ ] **Task: Update Adapter on Channel Move**
    - [ ] Write Tests for `ChannelService.moveChannel` Adapter Update
    - [ ] Update `ChannelService.ts` to Restart or Update the Adapter
- [ ] **Task: Verify Path-Aware Ingress Routing**
    - [ ] Write Tests for `IngressService` Path Resolution
    - [ ] Ensure `IngressService` Properly Resolves Agent from `fullPath`
- [ ] **Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)**

## Phase 3: Authentication Data Cleanup

- [ ] **Task: Clean Up Auth Data on Deletion**
    - [ ] Write Tests for `ChannelService.deleteChannel` Auth Data Cleanup
    - [ ] Implement Cleanup Logic in `ChannelService.ts`
- [ ] **Task: Conductor - User Manual Verification 'Phase 3' (Protocol in workflow.md)**
