# Specification: Upstream Engine Synchronization (2026.2.24)

## Overview
Synchronize the local `openclaw` workspace package with the latest upstream release (v2026.2.24). This update is critical to unlock **Nested Subagents**, **Improved WhatsApp Voice Notes (Opus)**, and resolve systematic TypeScript build errors.

## Functional Requirements
- **Upstream Alignment:** Fetch and merge the `main` branch from `https://github.com/openclaw/openclaw` into the `openclaw/` directory using a subtree-style merge.
- **Conflict Resolution:** Manually resolve any conflicts between upstream changes and WhatsDeX-specific patches (e.g., custom adapter bindings).
- **Dependency Update:** Update `openclaw/package.json` and the root `pnpm-lock.yaml` to reflect the new engine requirements.
- **Build Stability:** Ensure `pnpm --filter openclaw build` passes without errors.

## Critical Areas to Preserve (WhatsDeX Patches)
- **Adapter Hook Seams:** Ensure our `WhatsappAdapter` and `TelegramAdapter` can still bind to the underlying socket/bot instances.
- **Unified Tool Registry Seams:** Verify that `OpenClawSkillBridge` correctly imports and initializes tools after the update.
- **Firestore Logic:** Preserve any custom persistence logic that bridges OpenClaw's file-based storage to WhatsDeX's Firestore model.

## Acceptance Criteria
- [ ] `openclaw/package.json` version is `2026.2.24`.
- [ ] `pnpm build` completes successfully for the `openclaw` package.
- [ ] All OpenClaw unit and integration tests pass in our environment.
- [ ] WhatsDeX `ChannelService` successfully starts a WhatsApp channel using the updated engine.

## Out of Scope
- Migrating the entire WhatsDeX project to a new major framework (this is an engine-only sync).
- Implementing new features that depend on 2026.2.24 (that will be a subsequent track).
