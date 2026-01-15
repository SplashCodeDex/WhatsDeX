# Global Stabilization & Linting Fixes

## Goal
Achieve a 100% type-safe and lint-clean codebase for the WhatsDeX backend by systematically resolving remaining errors and enforcing the new project standards.

## Phase 1: Automated Cleanup [DONE]
- [x] Task: Run `npm run lint:fix` to auto-resolve stylistic issues.
- [x] Task: Verify no regression in core services after lint fix. (Baseline established: 1077 type errors)

## Phase 2: Type Safety Hardening [IN PROGRESS]
- [~] Task: Resolve `any` and `unknown` types in Command files.
    - [x] `src/commands/ai-chat` (gemini.ts fixed)
    - [x] `src/commands/downloader` (instagramdl, play, tiktokdl, twitterdl fixed)
    - [x] `src/commands/ai-misc` (youtubesummarizer fixed)
    - Focus: Remaining `src/commands` directory.
- [ ] Task: Resolve `any` and `unknown` types in Service files.
    - Focus: `src/services` directory (especially `jobQueue`, `sessionManager`, `stripe`).
- [ ] Task: Resolve `any` and `unknown` types in Utilities.
    - Focus: `src/utils` directory.

## Phase 3: Final Verification
- [ ] Task: Run full test suite (`npm run test:run`).
- [ ] Task: Run full typecheck (`npm run typecheck`).
- [ ] Task: Verify build (`npm run build`).
