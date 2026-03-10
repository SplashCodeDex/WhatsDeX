# Implementation Plan: Audit Remediation 2026

## Phase 1: Omnichannel Type Safety & Backend Refactoring
- [ ] Task: Create type guards `isCommonMessage` and `isBaileysMessage` in `backend/src/utils/typeGuards.ts`.
- [ ] Task: Add safe content accessors (`getBody`, `getMedia`, `getContentType`) to the `MessageContext` interface in `backend/src/types/index.ts`.
- [ ] Task: Implement these accessors in the `MessageContext` factory/constructor.
- [ ] Task: Refactor `backend/src/commands/ai-misc/editimage.ts` to use the new `MessageContext` accessors.
- [ ] Task: Refactor `backend/src/middleware/main.ts` to safely handle the `ctx.msg` union.
- [ ] Task: Create a script `backend/scripts/refactor_commands_types.js` to automate the transition to safe accessors across all ~50 command files.
- [ ] Task: Execute the refactor script and verify results.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Omnichannel Type Safety' (Protocol in workflow.md)

## Phase 2: Infrastructure & Workspace Synchronization
- [ ] Task: Synchronize `openclaw/package.json` exports to include all bridge functions (`sendMessageSignal`, etc.).
- [ ] Task: Fix relative dynamic imports in `backend/src/services/ChannelService.ts` by appending `.js` extensions.
- [ ] Task: Verify workspace resolution in `backend/tsconfig.json` and ensure build compatibility without `allowImportingTsExtensions`.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Infrastructure Sync' (Protocol in workflow.md)

## Phase 3: Frontend Interface & Mock Alignment
- [ ] Task: Update `OmnichannelHubContent.tsx` to correctly pass `channelId` and `agentId` props to `ChannelProgressStepper`.
- [ ] Task: Update `useCreateAgent.test.ts` to use `iconName` in mock data, aligning with the `CreateAgentInput` schema.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Frontend Alignment' (Protocol in workflow.md)

## Phase 4: Runtime Resilience & Firestore Validation
- [ ] Task: Implement a centralized `validatePath` utility in `backend/src/services/FirebaseService.ts` to catch malformed resource paths.
- [ ] Task: Refactor `backend/src/lib/baileysFirestoreAuth.ts` to use robust path construction with validation.
- [ ] Task: Add unit tests for `FirebaseService` path validation to ensure coverage of edge cases (empty IDs, double slashes).
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Runtime Resilience' (Protocol in workflow.md)
