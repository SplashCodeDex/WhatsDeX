# Track Spec: Core Modernization (Backend)

## Overview
This track focuses on implementing the critical backend modernizations identified during the 2026 research. It transitions the WhatsApp session persistence from fragile local files to a scalable Firestore-backed system, implements robust LID mapping for Baileys v7 compatibility, and modernizes the CI/CD pipeline to target Node.js 24 with blocking security gates.

## Functional Requirements
- **Firestore Auth State**:
    - Implement a custom `AuthenticationState` for Baileys that reads/writes directly to Firestore subcollections (`tenants/{tenantId}/bots/{botId}/auth`).
    - Decommission the current file-based `SessionManager.ts` logic for WhatsApp sessions.
- **LID Mapping Integration**:
    - Update `backend/src/lib/simple.ts` and the message processor to transparently handle WhatsApp Local Identifiers (LIDs).
    - Ensure commands receive a unified identifier, abstracting away the LID/JID complexity.
- **CI/CD Modernization**:
    - Update `.github/workflows/backend-ci.yml` to target Node.js 24 and 25.
    - Integrate `npm audit` as a blocking step in the quality gate.

## Non-Functional Requirements
- **Scalability**: Firestore persistence must support hundreds of concurrent bot sessions without filesystem overhead or file handle limits.
- **Security**: The CI/CD pipeline must enforce a zero-tolerance policy for high/critical vulnerabilities.
- **Strict Typing (Rule 2)**: All LID/JID mapping logic must be explicitly typed to prevent identity leakage or unhandled `unknown` types.

## Acceptance Criteria
- [ ] WhatsApp bots successfully connect and maintain state using Firestore subcollections.
- [ ] No new `.session` files are created in the `backend/sessions` directory during bot operations.
- [ ] Group and private messages correctly identify users even when LIDs are present in the Baileys payload.
- [ ] GitHub Actions successfully run quality gates on Node 24 and fail if security vulnerabilities are detected.

## Out of Scope
- Frontend refactors or `useActionState` implementation (handled in the next track).
- Full migration of all unit tests to the native runner (this track focuses on CI/CD infrastructure).
