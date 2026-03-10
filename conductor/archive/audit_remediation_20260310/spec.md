# Specification: Audit Remediation 2026

## Overview
This track addresses four critical root causes identified during the system audit on March 10, 2026. The goal is to resolve blocking TypeScript errors in the backend, fix build-breaking prop mismatches in the frontend, and prevent runtime crashes caused by malformed Firestore resource paths. This remediation follows the "Mastermind 2026" standards, emphasizing zero-trust data handling, strict ESM integrity, and robust error handling.

## Functional Requirements
1.  **Omnichannel Type Resolution (Backend):**
    - Refactor `MessageContext` to provide unified accessors for message content (body, media, contentType) to abstract the differences between Baileys and `CommonMessage`.
    - Update all backend commands and middleware to use these accessors instead of direct access to `ctx.msg`.
2.  **Infrastructure Integrity (OpenClaw & Backend):**
    - Synchronize `openclaw/package.json` exports with the backend's requirements, specifically ensuring all `sendMessage*` functions are properly exported.
    - Fix dynamic imports in `ChannelService.ts` to adhere to ESM standards (relative imports MUST include `.js`).
    - Resolve backend `tsconfig.json` issues related to cross-workspace TypeScript resolution.
3.  **Frontend Interface Alignment:**
    - Update `OmnichannelHubContent.tsx` to correctly pass `channelId` and `agentId` to the `ChannelProgressStepper`.
    - Fix `useCreateAgent.test.ts` mock data to include the `iconName` field required by the updated `CreateAgentInput` schema.
4.  **Resource Path Validation (Firestore):**
    - Implement a centralized path validator in `FirebaseService.ts` to ensure all path arguments are non-empty and valid.
    - Fix string interpolation logic in `baileysFirestoreAuth.ts` to prevent malformed Firestore paths.

## Non-Functional Requirements
- **Type Safety:** Maintain 100% type safety without using `as any`.
- **ESM Compliance:** Ensure all changes follow the strict ESM rule (relative imports must include `.js` extensions).
- **Testing:** Update existing unit tests and ensure all new logic has co-located tests.

## Acceptance Criteria
- [ ] Backend build passes with zero TypeScript errors in commands and middleware.
- [ ] Frontend build passes and the Omnichannel Hub displays progress without prop warnings.
- [ ] `useCreateAgent` unit tests pass successfully.
- [ ] Backend server initializes without Firestore path errors in logs.
- [ ] OpenClaw bridge functions are correctly resolvable from the backend.

## Out of Scope
- Adding new features to the Omnichannel Hub.
- General refactoring of Baileys integration beyond identified conflicts.
