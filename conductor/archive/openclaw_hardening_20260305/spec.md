# Specification: OpenClaw Engine Hardening (Security & Stability)

## Overview
Hardening the local `openclaw` engine by addressing two critical issues identified in the upstream pull request report:
1. **#26211:** Implement log file rotation on size cap to prevent silenced logs.
2. **#26225:** Implement fail-closed SSRF protection for node camera downloads.

## Functional Requirements

### 1. Log Rotation (#26211)
- **Current Behavior:** Engine suppresses all log writes once `maxFileBytes` is reached.
- **Improved Behavior:** When the log file exceeds the size cap, it should be renamed to `<logfile>.1` (rotating existing backups) and a fresh log file should be started.
- **Constraints:** Keep up to 1 backup file by default to prevent disk exhaustion.

### 2. SSRF Protection for Camera Downloads (#26225)
- **Current Behavior:** `writeUrlToFile` in `nodes-camera.ts` uses raw `fetch()` with no DNS or IP filtering.
- **Improved Behavior:** Integrate the existing `SsrFPolicy` from `infra/net/ssrf.js` into the camera download path.
- **Fail-Closed:** If DNS resolution fails or identifies a private/loopback IP, the download must be blocked immediately.

## Acceptance Criteria
- [ ] Log files successfully rotate when reaching the configured `maxFileBytes`.
- [ ] `nodes` tool camera downloads are blocked when targeting local/private network URLs.
- [ ] Unit tests for `logger` verify rotation logic.
- [ ] Unit tests for `nodes-camera` verify SSRF blocking.

## Out of Scope
- Implementing a full-blown centralized logging server.
- Hardening other tools besides `nodes` camera downloads (this is a targeted fix).
