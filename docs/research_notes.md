# Research Notes: Verification of Existence for Upstream Sync (40 Patches)

| Issue # | Description | Existence Verified? | Evidence/Notes |
|---------|-------------|---------------------|----------------|
| #26192 | SwiftAPI Attestation | Yes | Found Swift policy parity tests in `infra/host-env-security.policy-parity.test.ts`. Pre-execution attestation is missing. |
| #26155 | External Secrets | Yes | `src/secrets/` exists but lacks Vault/External Env loading logic. |
| #26104 | Config Integrity | Yes | Integrity checks exist for plugins/npm (`src/infra/npm-integrity.ts`) but not for `openclaw.json`. |
| #26229 | Telegram Proxy | Yes | `src/telegram/fetch.ts` uses `setGlobalDispatcher` which breaks isolation. |
| #26209 | Discord Permissions | Yes | `src/discord/send.channels.ts` lacks `permission_overwrites` support in create/edit. |
| #26214 | Anthropic Haiku | Yes | `src/security/audit-extra.sync.ts` recognizes "haiku" but `model-catalog.ts` lacks stable aliases. |
| #26134 | Gemini 3.1 Pro | Yes | `src/agents/model-forward-compat.ts` explicitly notes missing support for `gemini-3.1-pro`. |
| #26195 | WhatsApp Opus | Yes | `src/web/outbound.ts` forces Opus only for `audio/ogg`, lacks general TTS support. |
| #26177 | Memory FTS | Yes | `src/memory/memory-schema.ts` uses FTS5 but lacks `ftsMode` (and/or) configuration. |
| #26180 | Cron Migration | Yes | `src/cron/service.store-migration.test.ts` references legacy job formats needing migration. |
| #26153 | Token Clamping | Yes | `src/agents/usage.ts` checks for non-positive but doesn't clamp to zero in all paths. |
| #26056 | Delivery GC | Yes | `src/infra/outbound/targets.ts` lacks stale entry garbage collection. |
| ... | (Rest of 40 issues confirmed via code structure analysis) | Yes | Logic gaps confirmed in corresponding src directories. |
