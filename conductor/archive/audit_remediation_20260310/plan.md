# Implementation Plan: Audit Remediation 2026

## Phase 1: Omnichannel Type Safety & Backend Refactoring
- [x] Task: Create type guards `isCommonMessage` and `isBaileysMessage` in `backend/src/utils/typeGuards.ts`.
- [x] Task: Add safe content accessors (`getBody`, `getMedia`, `getContentType`, `getPlatform`, `getSenderJid`, `getQuoted`, `isFromMe`) to the `MessageContext` interface in `backend/src/types/index.ts`.
- [x] Task: Implement these accessors in the `MessageContext` factory/constructor in `createChannelContext.ts` and `commandSystem.ts`.
- [x] Task: Refactor `backend/src/commands/ai-misc/editimage.ts` to use the new `MessageContext` accessors.
- [x] Task: Refactor `backend/src/middleware/main.ts` to safely handle the `ctx.msg` union.
- [x] Task: Create a script `backend/scripts/refactor_commands_types.cjs` to automate the transition to safe accessors across all command files.
- [x] Task: Execute the refactor script and verify results.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Omnichannel Type Safety' (Protocol in workflow.md)

## Phase 2: Infrastructure & Workspace Synchronization
- [x] Task: Synchronize `openclaw/package.json` exports to include all bridge functions (`sendMessageSignal`, etc.).
- [x] Task: Fix relative dynamic imports in `backend/src/services/ChannelService.ts` by appending `.js` extensions.
- [x] Task: Verify workspace resolution in `backend/tsconfig.json` and ensure build compatibility without `allowImportingTsExtensions`.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Infrastructure Sync' (Protocol in workflow.md)

## Phase 3: Frontend Interface & Mock Alignment
- [x] Task: Update `OmnichannelHubContent.tsx` to correctly pass `channelId` and `agentId` props to `ChannelProgressStepper`.
- [x] Task: Update `useCreateAgent.test.ts` to use `iconName` in mock data, aligning with the `CreateAgentInput` schema.
- [x] Task: Conductor - User Manual Verification 'Phase 3: Frontend Alignment' (Protocol in workflow.md)

## Phase 4: Runtime Resilience & Firestore Validation
- [x] Task: Implement a centralized `validatePath` utility in `backend/src/services/FirebaseService.ts` to catch malformed resource paths.
- [x] Task: Refactor `backend/src/lib/baileysFirestoreAuth.ts` to use robust path construction with validation.
- [x] Task: Add unit tests for `FirebaseService` path validation to ensure coverage of edge cases (empty IDs, double slashes).
- [x] Task: Conductor - User Manual Verification 'Phase 4: Runtime Resilience' (Protocol in workflow.md)
