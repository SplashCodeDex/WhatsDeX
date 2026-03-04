# Implementation Plan: Upstream Engine Synchronization

Synchronize OpenClaw to v2026.2.27 and stabilize the build.

## Phase 1: Pre-Sync Baseline [checkpoint: 92a32d4]
Goal: Document current state and protect local patches.

- [x] Task: Create Engine Backup. 92a32d4
    - [x] Copy `openclaw/` to `openclaw_backup/`.
- [x] Task: Baseline Build Check. 92a32d4
    - [x] Run `pnpm --filter openclaw build` and log existing TS errors.
- [x] Task: Conductor - User Manual Verification 'Pre-Sync Baseline' (Protocol in workflow.md) 92a32d4

## Phase 2: Upstream Synchronization [checkpoint: 045417b]
Goal: Merge v2026.2.27 code into the local directory.

- [x] Task: Subtree Merge Execution. 045417b
    - [x] Add upstream remote and fetch tags.
    - [x] Use `git merge` with subtree strategy to pull in the `v2026.2.27` tag into the `openclaw/` directory.
- [x] Task: Manual Conflict Resolution. 045417b
    - [x] Resolve conflicts in `openclaw/src/`.
    - [x] Verify `openclaw/package.json` version is updated to 2026.2.27.
- [x] Task: Conductor - User Manual Verification 'Upstream Synchronization' (Protocol in workflow.md) 045417b

## Phase 3: Build & Stabilization [checkpoint: adf2da6]
Goal: Resolve engine build errors and align dependencies.

- [x] Task: Dependency Alignment. adf2da6
    - [x] Run `pnpm install` from root to update the lockfile.
- [~] Task: TS Error Clearance.
    - [x] Run `tsdown` to verify compilation.
    - [ ] Systematically fix any remaining TypeScript errors in `openclaw/`.
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
