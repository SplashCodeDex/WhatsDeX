# Specification: OpenClaw Comprehensive Upstream Sync (40 Patches)

## Overview
This track integrates 40 critical upstream pull requests from the `OPENCLAW_UPSTREAM_REPORT.md` to harden the local OpenClaw engine, improve omnichannel reliability, and enhance agentic intelligence.

## Functional Requirements

### 1. Security & Hardening (10 Issues)
- **#26192 (SwiftAPI Attestation):** Add pre-execution attestation and fail-closed governance for unsafe tool calls.
- **#26155 (External Secrets):** Implement support for external secrets management (Vault/Env) for channel credentials.
- **#26104 (Config Integrity):** Add verification checks to ensure `openclaw.json` hasn't been tampered with.
- **#26130 (BlueBubbles Isolation):** Isolate group allowlists from DM pairing entries.
- **#26121 (Zalo Isolation):** Scope pairing approvals strictly to `accountId`.
- **#26098 (Slack Isolation):** Isolate room text-command auth from DM stores.
- **#26094 (Twitch Isolation):** Fail closed on explicit empty `allowFrom` lists.
- **#26092 (Mattermost SSRF):** Add SSRF protection and target ID resolution hardening.
- **#26073 (Browser Security):** Block writable symlink path escapes.
- **#26047 (Line De-dupe):** Deduplicate replayed webhook events using `webhookEventId`.

### 2. Channel Stability & Features (12 Issues)
- **#26229 (Telegram Proxy):** Fix global dispatcher breaking HTTP proxy support.
- **#26226 (Discord read action):** Pass `threadId` in read actions to maintain conversation context.
- **#26216 (Slack read action):** Always forward `threadId` in plugin-sdk read actions.
- **#26210 (Synology Chat):** Fix configuration reading from outbound context for incoming URLs.
- **#26209 (Discord Permissions):** Support `permission_overwrites` for channel creation/editing.
- **#26206 (Telegram Startup):** Register handlers first to avoid webhook startup delays.
- **#26203 (Feishu Efficiency):** Reduce API consumption with probe cache and typing throttle.
- **#26201 (Telegram Typing):** Cancel in-flight typing requests on agent stop.
- **#26195 (WhatsApp Opus):** Use Opus format for TTS voice notes for high fidelity.
- **#26172 (Feishu Ordering):** Insert document blocks sequentially to preserve content order.
- **#26164 (Discord IDs):** Harden numeric channel ID resolution for raw string IDs.
- **#26144 (Discord guildId):** Resolve channel IDs correctly in `guildId/channelId` format.

### 3. Agent & Model Intelligence (8 Issues)
- **#26214/#26181 (Anthropic Alias):** Add `haiku` model aliases to resolve deprecated 404 errors.
- **#26175 (Haiku 4.5):** Map `haiku` alias to `claude-haiku-4-5` where available.
- **#26134 (Gemini 3.1 Pro):** Add preview normalization support for `gemini-3.1-pro`.
- **#26133 (Cortex Tags):** Strip internal semantic tags from user-facing agent text.
- **#26131 (isReasoning Flag):** Preserve `isReasoning` metadata in payload mapping returns.
- **#26085 (Overflow UX):** Improve context overflow UI with diagnostics and progress notifications.
- **#26228 (Model Override):** Prefer `modelOverride` over stale runtime models in session headers.
- **#26153 (Token Clamping):** Clamp token counts to non-negative values when storing usage.

### 4. Infrastructure & Logic (10 Issues)
- **#26205 (Memory Unification):** Unify embedding providers across Supabase and LanceDB.
- **#26213/#26062 (Heartbeat Exec):** Detect local execution events in heartbeat prompts.
- **#26221 (Auth-profiles):** Persist custom provider API keys to `auth-profiles` instead of `openclaw.json`.
- **#26184 (Plugin Hooks):** Preserve plugin-registered internal hooks across gateway startup.
- **#26180 (Cron Migration):** Migrate legacy `jobId` field to `id` on store load.
- **#26177 (Memory FTS):** Add configurable `ftsMode` (and/or) for hybrid search queries.
- **#26168 (Cron Announce):** Bind new announce jobs to the creator's session target.
- **#26163 (Session ID):** Honor `--session-id` before falling back to agent defaults.
- **#26145 (Memory Flush):** Fix off-by-one error in memory flush cycle deduplication.
- **#26056 (Delivery GC):** Add garbage collection for stale/undeliverable entries in delivery queue.

## Acceptance Criteria
- [ ] All 40 patches integrated into the local `openclaw` engine.
- [ ] Each patch verified with a targeted unit test or regression check.
- [ ] No regressions in core WhatsApp, Telegram, or Discord messaging flows.
- [ ] Security isolation verified for BlueBubbles, Zalo, Slack, and Twitch.
- [ ] Engine successfully boots and handles Gemini 3.1 and Anthropic Haiku requests.
- [ ] Cleanup performed after each implementation block.

## Out of Scope
- UI/UX changes to the DeXMart Dashboard (Backend/Engine only).
- Non-essential upstream PRs (refactor-only or documentation-only).
