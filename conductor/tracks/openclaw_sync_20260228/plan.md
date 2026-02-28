# Implementation Plan: Upstream Engine Synchronization

Synchronize OpenClaw to v2026.2.24 and stabilize the build.

## Phase 1: Pre-Sync Baseline
Goal: Document current state and protect local patches.

- [ ] Task: Create Engine Backup.
    - [ ] Copy `openclaw/` to `openclaw_backup/` (already exists, but we will refresh it).
- [ ] Task: Baseline Build Check.
    - [ ] Run `pnpm --filter openclaw build` and log existing TS errors to `openclaw/pre_sync_errors.txt`.
- [ ] Task: Conductor - User Manual Verification 'Pre-Sync Baseline' (Protocol in workflow.md)

## Phase 2: Upstream Synchronization
Goal: Merge v2026.2.24 code into the local directory.

- [ ] Task: Subtree Merge Execution.
    - [ ] Add upstream remote and fetch tags.
    - [ ] Use `git merge` with subtree strategy to pull in the `v2026.2.24` tag into the `openclaw/` directory.
- [ ] Task: Manual Conflict Resolution.
    - [ ] Resolve conflicts in `openclaw/src/`, specifically ensuring custom WhatsDeX adapter bindings are not wiped.
    - [ ] Verify `openclaw/package.json` version is updated.
- [ ] Task: Conductor - User Manual Verification 'Upstream Synchronization' (Protocol in workflow.md)

## Phase 3: Build & Stabilization
Goal: Resolve engine build errors and align dependencies.

- [ ] Task: Dependency Alignment.
    - [ ] Run `pnpm install` from root to update the lockfile.
- [ ] Task: TS Error Clearance.
    - [ ] Systematically fix TypeScript errors in `openclaw/` introduced by upstream breaking changes.
- [ ] Task: Build Verification.
    - [ ] Successfully run `pnpm --filter openclaw build`.
- [ ] Task: Conductor - User Manual Verification 'Build & Stabilization' (Protocol in workflow.md)

## Phase 4: Integration Validation
Goal: Ensure WhatsDeX bridges still work with the new engine.

- [ ] Task: Full Test Suite Execution.
    - [ ] Run `pnpm --filter openclaw test`.
- [ ] Task: Mastermind Integration Test.
    - [ ] Verify `ChannelService.startChannel` successfully initializes both WhatsApp and Telegram.
    - [ ] Verify `OpenClawSkillBridge` correctly registers the updated skills in the Unified Registry.
- [ ] Task: Conductor - User Manual Verification 'Integration Validation' (Protocol in workflow.md)
