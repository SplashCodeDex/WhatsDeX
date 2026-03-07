# Implementation Plan: OpenClaw Engine Hardening (Security & Stability)

## Overview
Hardening the local `openclaw` engine by addressing two critical issues identified in the upstream pull request report: log file rotation and SSRF protection for node camera downloads.

## Phase 1: Research & Fact-Finding
- [x] Task: Locate and audit the `logger` implementation and `nodes-camera.ts` in `openclaw/src/`.
- [x] Task: Reproduce the log suppression issue (#26211) with a test script.
- [x] Task: Verify the SSRF vulnerability in `nodes-camera.ts` (#26225) by attempting to fetch a local/private IP.

## Phase 2: Log Rotation Implementation (#26211)
- [x] Task: Implement log rotation logic in the `logger` (rename to `.1` and start fresh). [90709b7]
- [x] Task: Ensure rotation respects `maxFileBytes` and only keeps 1 backup by default. [90709b7]
- [x] Task: Create/update unit tests for `logger` to verify rotation behavior. [90709b7]

## Phase 3: SSRF Protection Implementation (#26225)
- [x] Task: Locate `infra/net/ssrf.js` and identify the `SsrFPolicy` integration point. [e91261a]
- [x] Task: Modify `writeUrlToFile` in `nodes-camera.ts` to enforce fail-closed SSRF protection. [e91261a]
- [x] Task: Create/update unit tests for `nodes-camera` to verify SSRF blocking for private/loopback IPs. [e91261a]

## Phase 4: Final System Validation
- [x] Task: Run full project regression suite (`npm test`) to ensure no side effects.
- [x] Task: Verify `nodes` tool functionality with the new security policy.
- [x] Task: Final Cleanup: Remove all remaining temporary research and test artifacts.
