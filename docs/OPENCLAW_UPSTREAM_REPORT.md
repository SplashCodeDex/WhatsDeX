# OpenClaw Upstream Repository - Pull Requests & Updates Report

**Generated on:** 2026-03-05 00:15:00
**Upstream Repository:** https://github.com/openclaw/openclaw
**Your Fork Location:** openclaw/ subdirectory in WhatsDeX project

---

## 📊 Summary Statistics

- **Total PRs Found:** 1000
- **Open PRs:** 635
- **Synchronized PRs:** 117 (All recent merges integrated)
- **Closed (Not Merged) PRs:** 248

---

## 🚀 Latest Releases

openclaw 2026.2.27	Latest	v2026.2.27	2026-03-01T05:46:00Z
openclaw 2026.2.24		v2026.2.24	2026-02-25T03:31:17Z
openclaw 2026.2.24-beta.1	Pre-release	v2026.2.24-beta.1	2026-02-25T03:01:17Z
openclaw 2026.2.23		v2026.2.23	2026-02-24T05:41:47Z
openclaw 2026.2.22		v2026.2.22	2026-02-23T04:09:40Z
openclaw 2026.2.21		v2026.2.21	2026-02-21T16:56:48Z
openclaw 2026.2.19		v2026.2.19	2026-02-19T17:35:21Z
openclaw 2026.2.19	Pre-release	v2026.2.19-beta.1	2026-02-19T16:21:06Z
openclaw 2026.2.17		v2026.2.17	2026-02-18T02:55:29Z
openclaw 2026.2.15-beta.1	Pre-release	v2026.2.15-beta.1	2026-02-16T04:12:20Z
openclaw 2026.2.15		v2026.2.15	2026-02-16T04:43:47Z
---

## 📝 Open Pull Requests (Latest 100)

These are currently open PRs in the upstream OpenClaw repository that you may want to review:

| # | Title | Author | Created | Labels |
|---|-------|--------|---------|--------|
| [#26229](https://github.com/openclaw/openclaw/pull/26229) | fix(telegram): global dispatcher breaks HTTP proxy for all outbound requests (#26207) | yinghaosang | 2026-02-25 | channel: telegram, size: XS, experienced-contributor |
| [#26228](https://github.com/openclaw/openclaw/pull/26228) | fix(gateway): prefer modelOverride over stale runtime model in session header | Sid-Qin | 2026-02-25 | gateway, size: XS, experienced-contributor |
| [#26227](https://github.com/openclaw/openclaw/pull/26227) | fix(test): add missing setSessionRuntimeModel mock in run.skill-filter.test.ts | lbo728 | 2026-02-25 | size: XS, trusted-contributor |
| [#26226](https://github.com/openclaw/openclaw/pull/26226) | fix: pass threadId in Discord read action (#26202) | echoVic | 2026-02-25 | size: XS, experienced-contributor |
| [#26225](https://github.com/openclaw/openclaw/pull/26225) | fix(security): fail-closed SSRF protection for node camera downloads | Marvae | 2026-02-25 | cli, agents, size: M |
| [#26223](https://github.com/openclaw/openclaw/pull/26223) | docs(i18n): fix locale internal links and add post-translation rewrite pipeline | strongwong | 2026-02-25 | docs, scripts, size: M |
| [#26221](https://github.com/openclaw/openclaw/pull/26221) | fix: persist custom provider API keys to auth-profiles instead of openclaw.json | kckylechen1 | 2026-02-25 | commands, size: S |
| [#26218](https://github.com/openclaw/openclaw/pull/26218) | feat(auto-reply): add Korean abort/stop triggers | jh280722 | 2026-02-25 | channel: telegram, gateway, size: XS |
| [#26216](https://github.com/openclaw/openclaw/pull/26216) | fix(slack): always forward threadId in plugin-sdk read action | lbo728 | 2026-02-25 | size: XS, trusted-contributor |
| [#26214](https://github.com/openclaw/openclaw/pull/26214) | fix(anthropic): add haiku model alias to resolve deprecated model error (#26018) | Lucenx9 | 2026-02-25 | agents, size: XS |
| [#26213](https://github.com/openclaw/openclaw/pull/26213) | fix(heartbeat): detect local exec completed/failed events in heartbeat prompt | Sid-Qin | 2026-02-25 | size: XS, experienced-contributor |
| [#26211](https://github.com/openclaw/openclaw/pull/26211) | fix(logging): rotate log file on size cap instead of suppressing writes | Sid-Qin | 2026-02-25 | size: S, experienced-contributor |
| [#26210](https://github.com/openclaw/openclaw/pull/26210) | fix(synology-chat): read cfg from outbound context so incomingUrl res… | white-rm | 2026-02-25 | size: S |
| [#26209](https://github.com/openclaw/openclaw/pull/26209) | feat(discord): support permission_overwrites for channel-create/channel-edit | ashclaw5381089 | 2026-02-25 | channel: discord, agents, size: S |
| [#26206](https://github.com/openclaw/openclaw/pull/26206) | fix: avoid Telegram webhook startup delay by registering handler first | pandego | 2026-02-25 | channel: telegram, size: XS |
| [#26205](https://github.com/openclaw/openclaw/pull/26205) | Memory: unify embedding providers across supabase and lancedb | cfregly | 2026-02-25 | gateway, extensions: diagnostics-otel, extensions: memory-lancedb, agents, size: XL |
| [#26204](https://github.com/openclaw/openclaw/pull/26204) | fix(cli): rename cron list Agent column to Agent ID (#26122) | Lucenx9 | 2026-02-25 | cli, size: XS |
| [#26203](https://github.com/openclaw/openclaw/pull/26203) | feat(feishu): reduce API rate limit consumption with probe cache and typing throttle | Stitch2001 | 2026-02-25 | channel: feishu, size: S |
| [#26201](https://github.com/openclaw/openclaw/pull/26201) | fix(telegram): cancel in-flight typing HTTP request on stop() | openperf | 2026-02-25 | channel: telegram, size: M |
| [#26200](https://github.com/openclaw/openclaw/pull/26200) | fix(agents): enforce config runTimeoutSeconds as minimum floor for subagent timeouts | MoerAI | 2026-02-25 | agents, size: XS |
| [#26198](https://github.com/openclaw/openclaw/pull/26198) | test: auto-bundle A2UI assets before parallel suites | diegueins680 | 2026-02-25 | scripts, size: XS |
| [#26195](https://github.com/openclaw/openclaw/pull/26195) | fix(whatsapp): use Opus format for TTS voice notes instead of MP3 | Lucenx9 | 2026-02-25 | size: XS |
| [#26192](https://github.com/openclaw/openclaw/pull/26192) | feat: add SwiftAPI pre-execution attestation + fail-closed governance layer for unsafe tool calls | theonlypal | 2026-02-25 | size: L |
| [#26190](https://github.com/openclaw/openclaw/pull/26190) | fix: label Codex secondary usage window as Week when >= 168h (#25812) | echoVic | 2026-02-25 | size: XS, experienced-contributor |
| [#26189](https://github.com/openclaw/openclaw/pull/26189) | Chrome extension: fix toolbar stuck at …, add 8s timeout and cancel-o… | zwffff | 2026-02-25 | docs, size: M |
| [#26188](https://github.com/openclaw/openclaw/pull/26188) | fix(compaction): route safeguard cancellation warnings through file logger | lbo728 | 2026-02-25 | agents, size: XS, trusted-contributor |
| [#26187](https://github.com/openclaw/openclaw/pull/26187) | fix(discord): defer own-mode fetch until thread allow checks pass | victorGPT | 2026-02-25 | channel: discord, size: XS |
| [#26184](https://github.com/openclaw/openclaw/pull/26184) | fix: preserve plugin-registered internal hooks across gateway startup | white-rm | 2026-02-25 | gateway, size: XS |
| [#26182](https://github.com/openclaw/openclaw/pull/26182) | fix(cli): cron list shows "-" instead of misleading "default" for empty agentId | Kay-051 | 2026-02-25 | cli, size: XS |
| [#26181](https://github.com/openclaw/openclaw/pull/26181) | fix: add haiku model aliases to prevent deprecated 404 (#26018) | echoVic | 2026-02-25 | agents, size: XS, experienced-contributor |
| [#26180](https://github.com/openclaw/openclaw/pull/26180) | fix: migrate legacy cron jobId field to id on store load | Kay-051 | 2026-02-25 | size: XS |
| [#26179](https://github.com/openclaw/openclaw/pull/26179) | fix: allow Google Fonts in Control UI CSP header | Kay-051 | 2026-02-25 | gateway, size: XS |
| [#26178](https://github.com/openclaw/openclaw/pull/26178) | fix(compaction): use effective reserveTokens for memory flush threshold | MoerAI | 2026-02-25 | size: XS |
| [#26177](https://github.com/openclaw/openclaw/pull/26177) | feat(memory): add configurable ftsMode (and/or) for hybrid FTS5 queries | jo-minjun | 2026-02-25 | agents, size: XS |
| [#26176](https://github.com/openclaw/openclaw/pull/26176) | fix: add Model column to cron list and show dash for unset agentId (#26122) | echoVic | 2026-02-25 | cli, size: XS, experienced-contributor |
| [#26175](https://github.com/openclaw/openclaw/pull/26175) | fix: "haiku" model alias resolves to claude-haiku-4-5 instead of deprecated snapshot | Kay-051 | 2026-02-25 | agents, size: XS |
| [#26173](https://github.com/openclaw/openclaw/pull/26173) | fix: Slack streaming: false resolves to "off" instead of "partial" | Kay-051 | 2026-02-25 | size: XS |
| [#26172](https://github.com/openclaw/openclaw/pull/26172) | fix(feishu): insert document blocks sequentially to preserve order (#26022) | echoVic | 2026-02-25 | channel: feishu, size: S, experienced-contributor |
| [#26170](https://github.com/openclaw/openclaw/pull/26170) | fix(bluebubbles): add allowPrivateNetwork to gateway config schema | lbo728 | 2026-02-25 | size: XS, trusted-contributor |
| [#26168](https://github.com/openclaw/openclaw/pull/26168) | fix(cron): bind new announce jobs to creator session target | yfge | 2026-02-25 | agents, size: XS |
| [#26167](https://github.com/openclaw/openclaw/pull/26167) | test(web-search): use config apiKey instead of env stub for Brave tests | drvoss | 2026-02-25 | agents, size: XS |
| [#26164](https://github.com/openclaw/openclaw/pull/26164) | fix/discord numeric channel id 26139 | Nipurn123 | 2026-02-25 | channel: discord, size: XS |
| [#26163](https://github.com/openclaw/openclaw/pull/26163) | Agent: honor --session-id before --agent main fallback | danielstarman | 2026-02-25 | gateway, commands, size: M |
| [#26162](https://github.com/openclaw/openclaw/pull/26162) | Fix cron list Agent column ambiguity when agentId is unset | pandego | 2026-02-25 | cli, size: XS |
| [#26157](https://github.com/openclaw/openclaw/pull/26157) | fix(onboard): seed Control UI origins for non-loopback binds | stakeswky | 2026-02-25 | size: S, trusted-contributor |
| [#26155](https://github.com/openclaw/openclaw/pull/26155) | feat(security): add external secrets management | joshavant | 2026-02-25 | docs, channel: googlechat, gateway, cli, commands, agents, maintainer, size: XL |
| [#26153](https://github.com/openclaw/openclaw/pull/26153) | fix(session): clamp token counts to non-negative when storing usage | drvoss | 2026-02-25 | agents, size: S |
| [#26152](https://github.com/openclaw/openclaw/pull/26152) | fix(hooks): warn when slug generator falls back to DEFAULT_MODEL | drvoss | 2026-02-25 | agents, size: S |
| [#26150](https://github.com/openclaw/openclaw/pull/26150) | fix(gateway): allow Google Fonts origins in Control UI CSP | drvoss | 2026-02-25 | gateway, agents, size: S |
| [#26149](https://github.com/openclaw/openclaw/pull/26149) | fix(extension): add configurable relay host to browser extension | drvoss | 2026-02-25 | agents, size: S |
| [#26148](https://github.com/openclaw/openclaw/pull/26148) | fix(doctor): suggest gateway restart after writing config | drvoss | 2026-02-25 | commands, agents, size: XS |
| [#26147](https://github.com/openclaw/openclaw/pull/26147) | fix(config): migrate removed telegram groupMentionsOnly key | drvoss | 2026-02-25 | agents, size: S |
| [#26145](https://github.com/openclaw/openclaw/pull/26145) | fix(memory): correct off-by-one in memory flush cycle dedup | drvoss | 2026-02-25 | agents, size: S |
| [#26144](https://github.com/openclaw/openclaw/pull/26144) | fix(discord): resolve channel ID in guildId/channelId config format | Sid-Qin | 2026-02-25 | channel: discord, size: XS, experienced-contributor |
| [#26143](https://github.com/openclaw/openclaw/pull/26143) | fix(abort): add Korean stop phrases and cancel/quit triggers | drvoss | 2026-02-25 | agents, size: S |
| [#26141](https://github.com/openclaw/openclaw/pull/26141) | fix(codex): label weekly usage window as Week not Day | drvoss | 2026-02-25 | agents, size: S |
| [#26140](https://github.com/openclaw/openclaw/pull/26140) | test(web_search): assert Brave auth uses X-Subscription-Token | Kemalau | 2026-02-25 | agents, size: XS |
| [#26138](https://github.com/openclaw/openclaw/pull/26138) | fix(config): add missing params field to AgentEntrySchema | moliendocode | 2026-02-25 | size: XS |
| [#26134](https://github.com/openclaw/openclaw/pull/26134) | feat(models): support gemini-3.1-pro via preview normalization | DongDongBear | 2026-02-25 | agents, size: XS |
| [#26133](https://github.com/openclaw/openclaw/pull/26133) | fix(agents): strip Cortex semantic tags from user-facing text | MoerAI | 2026-02-25 | agents, size: XS |
| [#26131](https://github.com/openclaw/openclaw/pull/26131) | fix: preserve isReasoning flag in buildEmbeddedRunPayloads return mapping | HirokiKobayashi-R | 2026-02-25 | agents, size: XS |
| [#26130](https://github.com/openclaw/openclaw/pull/26130) | security(bluebubbles): isolate group allowlist from DM pairing-store entries | bmendonca3 | 2026-02-25 | channel: bluebubbles, size: S, experienced-contributor |
| [#26128](https://github.com/openclaw/openclaw/pull/26128) | fix: Issue where discord is not installed on startup. | ungb | 2026-02-25 | commands, size: M |
| [#26124](https://github.com/openclaw/openclaw/pull/26124) | fix(cron): improve announce delivery reliability | dario-github | 2026-02-25 | agents, size: XS |
| [#26121](https://github.com/openclaw/openclaw/pull/26121) | security(zalo): scope pairing approvals to accountId | bmendonca3 | 2026-02-25 | channel: zalo, size: S, experienced-contributor |
| [#26104](https://github.com/openclaw/openclaw/pull/26104) | security: add config integrity verification (Spec 04) | joelnishanth | 2026-02-25 | gateway, cli, size: XL |
| [#26098](https://github.com/openclaw/openclaw/pull/26098) | security(slack): isolate room text-command auth from DM pairing-store entries | bmendonca3 | 2026-02-25 | channel: slack, size: XS, experienced-contributor |
| [#26096](https://github.com/openclaw/openclaw/pull/26096) | feat(plugins): expose session store API and sessionKey for plugin commands | hakonhagland | 2026-02-25 | docs, channel: telegram, extensions: lobster, size: S |
| [#26094](https://github.com/openclaw/openclaw/pull/26094) | security(twitch): fail closed explicit empty allowFrom | bmendonca3 | 2026-02-25 | channel: twitch, size: XS, experienced-contributor |
| [#26093](https://github.com/openclaw/openclaw/pull/26093) | security(bluebubbles): scope pairing approvals to accountId | bmendonca3 | 2026-02-25 | channel: bluebubbles, size: S, experienced-contributor |
| [#26092](https://github.com/openclaw/openclaw/pull/26092) | fix(mattermost): add SSRF protection and improve target ID resolution | webclerk | 2026-02-25 | channel: mattermost, size: S |
| [#26091](https://github.com/openclaw/openclaw/pull/26091) | fix(plugins): use active registry in resolvePluginTools to prevent EADDRINUSE | Diaspar4u | 2026-02-25 | size: S |
| [#26090](https://github.com/openclaw/openclaw/pull/26090) | telegram: treat unmatched \|\| as plain text in markdown formatter | Kemalau | 2026-03-04 | channel: signal, channel: telegram, size: XS |
| [#26088](https://github.com/openclaw/openclaw/pull/26088) | fix(daemon): re-bootstrap stopped service on gateway start when plist exists | lbo728 | 2026-02-25 | gateway, cli, size: S, trusted-contributor |
| [#26086](https://github.com/openclaw/openclaw/pull/26086) | bridge-vanguardIA | mateuscvictor-cs | 2026-02-25 | gateway, size: M |
| [#26085](https://github.com/openclaw/openclaw/pull/26085) | feat(agents): improve context overflow UX with diagnostics and progress notifications | hongliangzhang07 | 2026-02-25 | agents, size: S |
| [#26084](https://github.com/openclaw/openclaw/pull/26084) | fix(voice-call): route CLI through gateway RPC to fix EADDRINUSE | Diaspar4u | 2026-02-25 | channel: voice-call, size: M |
| [#26082](https://github.com/openclaw/openclaw/pull/26082) | fix(matrix): pass accountId through media send for multi-account routing | hclsys | 2026-02-25 | channel: matrix, size: XS |
| [#26081](https://github.com/openclaw/openclaw/pull/26081) | fix(diagnostics-otel): support custom OTEL resource attributes via config | ibrahimover | 2026-02-25 | docs, extensions: diagnostics-otel, size: S |
| [#26078](https://github.com/openclaw/openclaw/pull/26078) | fix: watch memory directory directly for recursive subdirectory monitoring | hclsys | 2026-02-25 | size: XS |
| [#26077](https://github.com/openclaw/openclaw/pull/26077) | fix(irc): retry nick collisions with incremental fallback names | chilu18 | 2026-02-25 | channel: irc, size: S, trusted-contributor |
| [#26073](https://github.com/openclaw/openclaw/pull/26073) | security(browser): block writable symlink path escapes | bmendonca3 | 2026-02-25 | size: S, experienced-contributor |
| [#26072](https://github.com/openclaw/openclaw/pull/26072) | fix(skills): refresh stale skill snapshots on gateway restart and in agent command path | yongPhone | 2026-02-25 | gateway, commands, size: S |
| [#26071](https://github.com/openclaw/openclaw/pull/26071) | fix(skills): guard install actions by architecture | chilu18 | 2026-02-25 | agents, size: S, trusted-contributor |
| [#26070](https://github.com/openclaw/openclaw/pull/26070) | fix(build): make bundle-a2ui.sh work on Windows with WSL | BinHPdev | 2026-02-25 | scripts, agents, size: S |
| [#26067](https://github.com/openclaw/openclaw/pull/26067) | security(feishu): block off-path traffic from exhausting webhook budget | bmendonca3 | 2026-02-25 | channel: feishu, size: XS, experienced-contributor |
| [#26064](https://github.com/openclaw/openclaw/pull/26064) | feat: lightweight bootstrap context mode for heartbeat/cron runs | jose-velez | 2026-02-25 | app: web-ui, gateway, cli, agents, size: S |
| [#26062](https://github.com/openclaw/openclaw/pull/26062) | fix(heartbeat): handle exec completed wake/events | chilu18 | 2026-02-25 | size: XS, trusted-contributor |
| [#26061](https://github.com/openclaw/openclaw/pull/26061) | fix(signal): treat non-2xx probe as reachable and fallback to RPC | openperf | 2026-02-25 | channel: signal, size: S |
| [#26060](https://github.com/openclaw/openclaw/pull/26060) | security(fs-safe): block root hardlink containment bypass | bmendonca3 | 2026-02-25 | size: XS, experienced-contributor |
| [#26057](https://github.com/openclaw/openclaw/pull/26057) | fix(matrix): handle missing self-verification API | stakeswky | 2026-02-25 | channel: matrix, size: S, trusted-contributor |
| [#26056](https://github.com/openclaw/openclaw/pull/26056) | fix(infra): add garbage collection to delivery queue for stale/undeliverable entries | mcekinci | 2026-02-25 | size: XS |
| [#26054](https://github.com/openclaw/openclaw/pull/26054) | fix(agents): avoid injecting memory file twice on case-insensitive mounts | Lanfei | 2026-02-25 | agents, size: XS |
| [#26053](https://github.com/openclaw/openclaw/pull/26053) | security(mattermost): isolate group allowlist from DM pairing-store entries | bmendonca3 | 2026-02-25 | channel: mattermost, size: S, experienced-contributor |
| [#26052](https://github.com/openclaw/openclaw/pull/26052) | security(slack): isolate room slash auth from DM pairing-store entries | bmendonca3 | 2026-02-25 | channel: slack, size: XS, experienced-contributor |
| [#26051](https://github.com/openclaw/openclaw/pull/26051) | security(sandbox): block hardlinked path alias escapes | bmendonca3 | 2026-02-25 | docker, agents, size: XS, experienced-contributor |
| [#26050](https://github.com/openclaw/openclaw/pull/26050) | security(feishu): bound unauthenticated webhook rate-limit state | bmendonca3 | 2026-02-25 | channel: feishu, size: S, experienced-contributor |
| [#26049](https://github.com/openclaw/openclaw/pull/26049) | test(bash-tools): fix Windows CI path prepend assertion | drvoss | 2026-02-25 | agents, size: XS |
| [#26047](https://github.com/openclaw/openclaw/pull/26047) | security(line): dedupe replayed webhook events by webhookEventId | bmendonca3 | 2026-02-25 | size: S, experienced-contributor |
| [#26045](https://github.com/openclaw/openclaw/pull/26045) | fix(gateway): exempt loopback from hook auth rate-limiting by default | mcekinci | 2026-02-25 | gateway, size: XS |


---



# Releases · openclaw/openclaw

## openclaw 2026.3.2

03 Mar 04:43

Immutable release. Only release title and notes can be modified.

[
```
85377a2
```
](https://github.com/openclaw/openclaw/commit/85377a28175695c224f6589eb5c1460841ecd65c)

### Changes

-   Secrets/SecretRef coverage: expand SecretRef support across the full supported user-supplied credential surface (64 targets total), including runtime collectors,
    ```
    openclaw secrets
    ```
     planning/apply/audit flows, onboarding SecretInput UX, and related docs; unresolved refs now fail fast on active surfaces while inactive surfaces report non-blocking diagnostics. ([#29580](https://github.com/openclaw/openclaw/pull/29580)) Thanks [@joshavant](https://github.com/joshavant).
-   Tools/PDF analysis: add a first-class
    ```
    pdf
    ```
     tool with native Anthropic and Google PDF provider support, extraction fallback for non-native models, configurable defaults (
    ```
    agents.defaults.pdfModel
    ```
    ,
    ```
    pdfMaxBytesMb
    ```
    ,
    ```
    pdfMaxPages
    ```
    ), and docs/tests covering routing, validation, and registration. ([#31319](https://github.com/openclaw/openclaw/pull/31319)) Thanks [@tyler6204](https://github.com/tyler6204).
-   Outbound adapters/plugins: add shared
    ```
    sendPayload
    ```
     support across direct-text-media, Discord, Slack, WhatsApp, Zalo, and Zalouser with multi-media iteration and chunk-aware text fallback. ([#30144](https://github.com/openclaw/openclaw/pull/30144)) Thanks [@nohat](https://github.com/nohat).
-   Models/MiniMax: add first-class
    ```
    MiniMax-M2.5-highspeed
    ```
     support across built-in provider catalogs, onboarding flows, and MiniMax OAuth plugin defaults, while keeping legacy
    ```
    MiniMax-M2.5-Lightning
    ```
     compatibility for existing configs.
-   Sessions/Attachments: add inline file attachment support for
    ```
    sessions_spawn
    ```
     (subagent runtime only) with base64/utf8 encoding, transcript content redaction, lifecycle cleanup, and configurable limits via
    ```
    tools.sessions_spawn.attachments
    ```
    . ([#16761](https://github.com/openclaw/openclaw/pull/16761)) Thanks [@napetrov](https://github.com/napetrov).
-   Telegram/Streaming defaults: default
    ```
    channels.telegram.streaming
    ```
     to
    ```
    partial
    ```
     (from
    ```
    off
    ```
    ) so new Telegram setups get live preview streaming out of the box, with runtime fallback to message-edit preview when native drafts are unavailable.
-   Telegram/DM streaming: use
    ```
    sendMessageDraft
    ```
     for private preview streaming, keep reasoning/answer preview lanes separated in DM reasoning-stream mode. ([#31824](https://github.com/openclaw/openclaw/pull/31824)) Thanks [@obviyus](https://github.com/obviyus).
-   Telegram/voice mention gating: add optional
    ```
    disableAudioPreflight
    ```
     on group/topic config to skip mention-detection preflight transcription for inbound voice notes where operators want text-only mention checks. ([#23067](https://github.com/openclaw/openclaw/pull/23067)) Thanks [@yangnim21029](https://github.com/yangnim21029).
-   CLI/Config validation: add
    ```
    openclaw config validate
    ```
     (with
    ```
    --json
    ```
    ) to validate config files before gateway startup, and include detailed invalid-key paths in startup invalid-config errors. ([#31220](https://github.com/openclaw/openclaw/pull/31220)) thanks [@Sid-Qin](https://github.com/Sid-Qin).
-   Tools/Diffs: add PDF file output support and rendering quality customization controls (
    ```
    fileQuality
    ```
    ,
    ```
    fileScale
    ```
    ,
    ```
    fileMaxWidth
    ```
    ) for generated diff artifacts, and document PDF as the preferred option when messaging channels compress images. ([#31342](https://github.com/openclaw/openclaw/pull/31342)) Thanks [@gumadeiras](https://github.com/gumadeiras).
-   Memory/Ollama embeddings: add
    ```
    memorySearch.provider = "ollama"
    ```
     and
    ```
    memorySearch.fallback = "ollama"
    ```
     support, honor
    ```
    models.providers.ollama
    ```
     settings for memory embedding requests, and document Ollama embedding usage. ([#26349](https://github.com/openclaw/openclaw/pull/26349)) Thanks [@nico-hoff](https://github.com/nico-hoff).
-   Zalo Personal plugin (
    ```
    @openclaw/zalouser
    ```
    ): rebuilt channel runtime to use native
    ```
    zca-js
    ```
     integration in-process, removing external CLI transport usage and keeping QR/login + send/listen flows fully inside OpenClaw.
-   Plugin SDK/channel extensibility: expose
    ```
    channelRuntime
    ```
     on
    ```
    ChannelGatewayContext
    ```
     so external channel plugins can access shared runtime helpers (reply/routing/session/text/media/commands) without internal imports. ([#25462](https://github.com/openclaw/openclaw/pull/25462)) Thanks [@guxiaobo](https://github.com/guxiaobo).
-   Plugin runtime/STT: add
    ```
    api.runtime.stt.transcribeAudioFile(...)
    ```
     so extensions can transcribe local audio files through OpenClaw's configured media-understanding audio providers. ([#22402](https://github.com/openclaw/openclaw/pull/22402)) Thanks [@benthecarman](https://github.com/benthecarman).
-   Plugin hooks/session lifecycle: include
    ```
    sessionKey
    ```
     in
    ```
    session_start
    ```
    /
    ```
    session_end
    ```
     hook events and contexts so plugins can correlate lifecycle callbacks with routing identity. ([#26394](https://github.com/openclaw/openclaw/pull/26394)) Thanks [@tempeste](https://github.com/tempeste).
-   Hooks/message lifecycle: add internal hook events
    ```
    message:transcribed
    ```
     and
    ```
    message:preprocessed
    ```
    , plus richer outbound
    ```
    message:sent
    ```
     context (
    ```
    isGroup
    ```
    ,
    ```
    groupId
    ```
    ) for group-conversation correlation and post-transcription automations. ([#9859](https://github.com/openclaw/openclaw/pull/9859)) Thanks [@Drickon](https://github.com/Drickon).
-   Media understanding/audio echo: add optional
    ```
    tools.media.audio.echoTranscript
    ```
     +
    ```
    echoFormat
    ```
     to send a pre-agent transcript confirmation message to the originating chat, with echo disabled by default. ([#32150](https://github.com/openclaw/openclaw/pull/32150)) Thanks [@AytuncYildizli](https://github.com/AytuncYildizli).
-   Plugin runtime/system: expose
    ```
    runtime.system.requestHeartbeatNow(...)
    ```
     so extensions can wake targeted sessions immediately after enqueueing system events. ([#19464](https://github.com/openclaw/openclaw/pull/19464)) Thanks [@AustinEral](https://github.com/AustinEral).
-   Plugin runtime/events: expose
    ```
    runtime.events.onAgentEvent
    ```
     and
    ```
    runtime.events.onSessionTranscriptUpdate
    ```
     for extension-side subscriptions, and isolate transcript-listener failures so one faulty listener cannot break the entire update fanout. ([#16044](https://github.com/openclaw/openclaw/pull/16044)) Thanks [@scifantastic](https://github.com/scifantastic).
-   CLI/Banner taglines: add
    ```
    cli.banner.taglineMode
    ```
     (
    ```
    random
    ```
     |
    ```
    default
    ```
     |
    ```
    off
    ```
    ) to control funny tagline behavior in startup output, with docs + FAQ guidance and regression tests for config override behavior.

### Breaking

-   **BREAKING:** Onboarding now defaults
    ```
    tools.profile
    ```
     to
    ```
    messaging
    ```
     for new local installs (interactive + non-interactive). New setups no longer start with broad coding/system tools unless explicitly configured.
-   **BREAKING:** ACP dispatch now defaults to enabled unless explicitly disabled (
    ```
    acp.dispatch.enabled=false
    ```
    ). If you need to pause ACP turn routing while keeping
    ```
    /acp
    ```
     controls, set
    ```
    acp.dispatch.enabled=false
    ```
    . Docs: [https://docs.openclaw.ai/tools/acp-agents](https://docs.openclaw.ai/tools/acp-agents)
-   **BREAKING:** Plugin SDK removed
    ```
    api.registerHttpHandler(...)
    ```
    . Plugins must register explicit HTTP routes via
    ```
    api.registerHttpRoute({ path, auth, match, handler })
    ```
    , and dynamic webhook lifecycles should use
    ```
    registerPluginHttpRoute(...)
    ```
    .
-   **BREAKING:** Zalo Personal plugin (
    ```
    @openclaw/zalouser
    ```
    ) no longer depends on external
    ```
    zca
    ```
    \-compatible CLI binaries (
    ```
    openzca
    ```
    ,
    ```
    zca-cli
    ```
    ) for runtime send/listen/login; operators should use
    ```
    openclaw channels login --channel zalouser
    ```
     after upgrade to refresh sessions in the new JS-native path.

### Fixes

-   Plugin command/runtime hardening: validate and normalize plugin command name/description at registration boundaries, and guard Telegram native menu normalization paths so malformed plugin command specs cannot crash startup (
    ```
    trim
    ```
     on undefined). ([#31997](https://github.com/openclaw/openclaw/pull/31997)) Fixes [#31944](https://github.com/openclaw/openclaw/issues/31944). Thanks [@liuxiaopai-ai](https://github.com/liuxiaopai-ai).
-   Telegram: guard duplicate-token checks and gateway startup token normalization when account tokens are missing, preventing
    ```
    token.trim()
    ```
     crashes during status/start flows. ([#31973](https://github.com/openclaw/openclaw/pull/31973)) Thanks [@ningding97](https://github.com/ningding97).
-   Discord/lifecycle startup status: push an immediate
    ```
    connected
    ```
     status snapshot when the gateway is already connected before lifecycle debug listeners attach, with abort-guarding to avoid contradictory status flips during pre-aborted startup. ([#32336](https://github.com/openclaw/openclaw/pull/32336)) Thanks [@mitchmcalister](https://github.com/mitchmcalister).
-   Feishu/multi-app mention routing: guard mention detection in multi-bot groups by validating mention display name alongside bot
    ```
    open_id
    ```
    , preventing false-positive self-mentions from Feishu WebSocket remapping so only the actually mentioned bot responds under
    ```
    requireMention
    ```
    . ([#30315](https://github.com/openclaw/openclaw/pull/30315)) Thanks [@teaguexiao](https://github.com/teaguexiao).
-   Feishu/session-memory hook parity: trigger the shared
    ```
    before_reset
    ```
     session-memory hook path when Feishu
    ```
    /new
    ```
     and
    ```
    /reset
    ```
     commands execute so reset flows preserve memory behavior consistent with other channels. ([#31437](https://github.com/openclaw/openclaw/pull/31437)) Thanks [@Linux2010](https://github.com/Linux2010).
-   Feishu/LINE group system prompts: forward per-group
    ```
    systemPrompt
    ```
     config into inbound context
    ```
    GroupSystemPrompt
    ```
     for Feishu and LINE group/room events so configured group-specific behavior actually applies at dispatch time. ([#31713](https://github.com/openclaw/openclaw/pull/31713)) Thanks [@whiskyboy](https://github.com/whiskyboy).
-   Mentions/Slack formatting hardening: add null-safe guards for runtime text normalization paths so malformed/undefined text payloads do not crash mention stripping or mrkdwn conversion. ([#31865](https://github.com/openclaw/openclaw/pull/31865)) Thanks [@stone-jin](https://github.com/stone-jin).
-   Feishu/Plugin sdk compatibility: add safe webhook default fallbacks when loading Feishu monitor state so mixed-version installs no longer crash if older
    ```
    openclaw/plugin-sdk
    ```
     builds omit webhook default constants. ([#31606](https://github.com/openclaw/openclaw/issues/31606))
-   Feishu/group broadcast dispatch: add configurable multi-agent group broadcast dispatch with observer-session isolation, cross-account dedupe safeguards, and non-mention history buffering rules that avoid duplicate replay in broadcast/topic workflows. ([#29575](https://github.com/openclaw/openclaw/pull/29575)) Thanks [@ohmyskyhigh](https://github.com/ohmyskyhigh).
-   Gateway/Subagent TLS pairing: allow authenticated local
    ```
    gateway-client
    ```
     backend self-connections to skip device pairing while still requiring pairing for non-local/direct-host paths, restoring
    ```
    sessions_spawn
    ```
     with
    ```
    gateway.tls.enabled=true
    ```
     in Docker/LAN setups. Fixes [#30740](https://github.com/openclaw/openclaw/issues/30740). Thanks [@Sid-Qin](https://github.com/Sid-Qin) and [@vincentkoc](https://github.com/vincentkoc).
-   Browser/CDP startup diagnostics: include Chrome stderr output and a Linux no-sandbox hint in startup timeout errors so failed launches are easier to diagnose. ([#29312](https://github.com/openclaw/openclaw/issues/29312)) Thanks [@veast](https://github.com/veast).
-   Synology Chat/webhook ingress hardening: enforce bounded body reads (size + timeout) via shared request-body guards to prevent unauthenticated slow-body hangs before token validation. ([#25831](https://github.com/openclaw/openclaw/pull/25831)) Thanks [@bmendonca3](https://github.com/bmendonca3).
-   Feishu/Dedup restart resilience: warm persistent dedup state into memory on monitor startup so retry events after gateway restart stay suppressed without requiring initial on-disk probe misses. ([#31605](https://github.com/openclaw/openclaw/pull/31605))
-   Voice-call/runtime lifecycle: prevent
    ```
    EADDRINUSE
    ```
     loops by resetting failed runtime promises, making webhook
    ```
    start()
    ```
     idempotent with the actual bound port, and fully cleaning up webhook/tunnel/tailscale resources after startup failures. ([#32395](https://github.com/openclaw/openclaw/pull/32395)) Thanks [@scoootscooob](https://github.com/scoootscooob).
-   Gateway/Security hardening: tie loopback-origin dev allowance to actual local socket clients (not Host header claims), add explicit warnings/metrics when
    ```
    gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback
    ```
     accepts websocket origins, harden safe-regex detection for quantified ambiguous alternation patterns (for example
    ```
    (a|aa)+
    ```
    ), and bound large regex-evaluation inputs for session-filter and log-redaction paths.
-   Gateway/Plugin HTTP hardening: require explicit
    ```
    auth
    ```
     for plugin route registration...

[Read more](https://github.com/openclaw/openclaw/releases/tag/v2026.3.2)

## openclaw 2026.3.2-beta.1

03 Mar 03:59

Immutable release. Only release title and notes can be modified.

[
```
eb8a884
```
](https://github.com/openclaw/openclaw/commit/eb8a8840d65fd082bdb4712d132fb7d262e24732)

Pre-release

### Changes

-   Secrets/SecretRef coverage: expand SecretRef support across the full supported user-supplied credential surface (64 targets total), including runtime collectors,
    ```
    openclaw secrets
    ```
     planning/apply/audit flows, onboarding SecretInput UX, and related docs; unresolved refs now fail fast on active surfaces while inactive surfaces report non-blocking diagnostics. ([#29580](https://github.com/openclaw/openclaw/pull/29580)) Thanks [@joshavant](https://github.com/joshavant).
-   Tools/PDF analysis: add a first-class
    ```
    pdf
    ```
     tool with native Anthropic and Google PDF provider support, extraction fallback for non-native models, configurable defaults (
    ```
    agents.defaults.pdfModel
    ```
    ,
    ```
    pdfMaxBytesMb
    ```
    ,
    ```
    pdfMaxPages
    ```
    ), and docs/tests covering routing, validation, and registration. ([#31319](https://github.com/openclaw/openclaw/pull/31319)) Thanks [@tyler6204](https://github.com/tyler6204).
-   Outbound adapters/plugins: add shared
    ```
    sendPayload
    ```
     support across direct-text-media, Discord, Slack, WhatsApp, Zalo, and Zalouser with multi-media iteration and chunk-aware text fallback. ([#30144](https://github.com/openclaw/openclaw/pull/30144)) Thanks [@nohat](https://github.com/nohat).
-   Models/MiniMax: add first-class
    ```
    MiniMax-M2.5-highspeed
    ```
     support across built-in provider catalogs, onboarding flows, and MiniMax OAuth plugin defaults, while keeping legacy
    ```
    MiniMax-M2.5-Lightning
    ```
     compatibility for existing configs.
-   Sessions/Attachments: add inline file attachment support for
    ```
    sessions_spawn
    ```
     (subagent runtime only) with base64/utf8 encoding, transcript content redaction, lifecycle cleanup, and configurable limits via
    ```
    tools.sessions_spawn.attachments
    ```
    . ([#16761](https://github.com/openclaw/openclaw/pull/16761)) Thanks [@napetrov](https://github.com/napetrov).
-   Telegram/Streaming defaults: default
    ```
    channels.telegram.streaming
    ```
     to
    ```
    partial
    ```
     (from
    ```
    off
    ```
    ) so new Telegram setups get live preview streaming out of the box, with runtime fallback to message-edit preview when native drafts are unavailable.
-   Telegram/DM streaming: use
    ```
    sendMessageDraft
    ```
     for private preview streaming, keep reasoning/answer preview lanes separated in DM reasoning-stream mode. ([#31824](https://github.com/openclaw/openclaw/pull/31824)) Thanks [@obviyus](https://github.com/obviyus).
-   Telegram/voice mention gating: add optional
    ```
    disableAudioPreflight
    ```
     on group/topic config to skip mention-detection preflight transcription for inbound voice notes where operators want text-only mention checks. ([#23067](https://github.com/openclaw/openclaw/pull/23067)) Thanks [@yangnim21029](https://github.com/yangnim21029).
-   CLI/Config validation: add
    ```
    openclaw config validate
    ```
     (with
    ```
    --json
    ```
    ) to validate config files before gateway startup, and include detailed invalid-key paths in startup invalid-config errors. ([#31220](https://github.com/openclaw/openclaw/pull/31220)) thanks [@Sid-Qin](https://github.com/Sid-Qin).
-   Tools/Diffs: add PDF file output support and rendering quality customization controls (
    ```
    fileQuality
    ```
    ,
    ```
    fileScale
    ```
    ,
    ```
    fileMaxWidth
    ```
    ) for generated diff artifacts, and document PDF as the preferred option when messaging channels compress images. ([#31342](https://github.com/openclaw/openclaw/pull/31342)) Thanks [@gumadeiras](https://github.com/gumadeiras).
-   Memory/Ollama embeddings: add
    ```
    memorySearch.provider = "ollama"
    ```
     and
    ```
    memorySearch.fallback = "ollama"
    ```
     support, honor
    ```
    models.providers.ollama
    ```
     settings for memory embedding requests, and document Ollama embedding usage. ([#26349](https://github.com/openclaw/openclaw/pull/26349)) Thanks [@nico-hoff](https://github.com/nico-hoff).
-   Zalo Personal plugin (
    ```
    @openclaw/zalouser
    ```
    ): rebuilt channel runtime to use native
    ```
    zca-js
    ```
     integration in-process, removing external CLI transport usage and keeping QR/login + send/listen flows fully inside OpenClaw.
-   Plugin SDK/channel extensibility: expose
    ```
    channelRuntime
    ```
     on
    ```
    ChannelGatewayContext
    ```
     so external channel plugins can access shared runtime helpers (reply/routing/session/text/media/commands) without internal imports. ([#25462](https://github.com/openclaw/openclaw/pull/25462)) Thanks [@guxiaobo](https://github.com/guxiaobo).
-   Plugin runtime/STT: add
    ```
    api.runtime.stt.transcribeAudioFile(...)
    ```
     so extensions can transcribe local audio files through OpenClaw's configured media-understanding audio providers. ([#22402](https://github.com/openclaw/openclaw/pull/22402)) Thanks [@benthecarman](https://github.com/benthecarman).
-   Plugin hooks/session lifecycle: include
    ```
    sessionKey
    ```
     in
    ```
    session_start
    ```
    /
    ```
    session_end
    ```
     hook events and contexts so plugins can correlate lifecycle callbacks with routing identity. ([#26394](https://github.com/openclaw/openclaw/pull/26394)) Thanks [@tempeste](https://github.com/tempeste).
-   Hooks/message lifecycle: add internal hook events
    ```
    message:transcribed
    ```
     and
    ```
    message:preprocessed
    ```
    , plus richer outbound
    ```
    message:sent
    ```
     context (
    ```
    isGroup
    ```
    ,
    ```
    groupId
    ```
    ) for group-conversation correlation and post-transcription automations. ([#9859](https://github.com/openclaw/openclaw/pull/9859)) Thanks [@Drickon](https://github.com/Drickon).
-   Media understanding/audio echo: add optional
    ```
    tools.media.audio.echoTranscript
    ```
     +
    ```
    echoFormat
    ```
     to send a pre-agent transcript confirmation message to the originating chat, with echo disabled by default. ([#32150](https://github.com/openclaw/openclaw/pull/32150)) Thanks [@AytuncYildizli](https://github.com/AytuncYildizli).
-   Plugin runtime/system: expose
    ```
    runtime.system.requestHeartbeatNow(...)
    ```
     so extensions can wake targeted sessions immediately after enqueueing system events. ([#19464](https://github.com/openclaw/openclaw/pull/19464)) Thanks [@AustinEral](https://github.com/AustinEral).
-   Plugin runtime/events: expose
    ```
    runtime.events.onAgentEvent
    ```
     and
    ```
    runtime.events.onSessionTranscriptUpdate
    ```
     for extension-side subscriptions, and isolate transcript-listener failures so one faulty listener cannot break the entire update fanout. ([#16044](https://github.com/openclaw/openclaw/pull/16044)) Thanks [@scifantastic](https://github.com/scifantastic).
-   CLI/Banner taglines: add
    ```
    cli.banner.taglineMode
    ```
     (
    ```
    random
    ```
     |
    ```
    default
    ```
     |
    ```
    off
    ```
    ) to control funny tagline behavior in startup output, with docs + FAQ guidance and regression tests for config override behavior.

### Breaking

-   **BREAKING:** Onboarding now defaults
    ```
    tools.profile
    ```
     to
    ```
    messaging
    ```
     for new local installs (interactive + non-interactive). New setups no longer start with broad coding/system tools unless explicitly configured.
-   **BREAKING:** ACP dispatch now defaults to enabled unless explicitly disabled (
    ```
    acp.dispatch.enabled=false
    ```
    ). If you need to pause ACP turn routing while keeping
    ```
    /acp
    ```
     controls, set
    ```
    acp.dispatch.enabled=false
    ```
    . Docs: [https://docs.openclaw.ai/tools/acp-agents](https://docs.openclaw.ai/tools/acp-agents)
-   **BREAKING:** Plugin SDK removed
    ```
    api.registerHttpHandler(...)
    ```
    . Plugins must register explicit HTTP routes via
    ```
    api.registerHttpRoute({ path, auth, match, handler })
    ```
    , and dynamic webhook lifecycles should use
    ```
    registerPluginHttpRoute(...)
    ```
    .
-   **BREAKING:** Zalo Personal plugin (
    ```
    @openclaw/zalouser
    ```
    ) no longer depends on external
    ```
    zca
    ```
    \-compatible CLI binaries (
    ```
    openzca
    ```
    ,
    ```
    zca-cli
    ```
    ) for runtime send/listen/login; operators should use
    ```
    openclaw channels login --channel zalouser
    ```
     after upgrade to refresh sessions in the new JS-native path.

### Fixes

-   Plugin command/runtime hardening: validate and normalize plugin command name/description at registration boundaries, and guard Telegram native menu normalization paths so malformed plugin command specs cannot crash startup (
    ```
    trim
    ```
     on undefined). ([#31997](https://github.com/openclaw/openclaw/pull/31997)) Fixes [#31944](https://github.com/openclaw/openclaw/issues/31944). Thanks [@liuxiaopai-ai](https://github.com/liuxiaopai-ai).
-   Telegram: guard duplicate-token checks and gateway startup token normalization when account tokens are missing, preventing
    ```
    token.trim()
    ```
     crashes during status/start flows. ([#31973](https://github.com/openclaw/openclaw/pull/31973)) Thanks [@ningding97](https://github.com/ningding97).
-   Discord/lifecycle startup status: push an immediate
    ```
    connected
    ```
     status snapshot when the gateway is already connected before lifecycle debug listeners attach, with abort-guarding to avoid contradictory status flips during pre-aborted startup. ([#32336](https://github.com/openclaw/openclaw/pull/32336)) Thanks [@mitchmcalister](https://github.com/mitchmcalister).
-   Feishu/LINE group system prompts: forward per-group
    ```
    systemPrompt
    ```
     config into inbound context
    ```
    GroupSystemPrompt
    ```
     for Feishu and LINE group/room events so configured group-specific behavior actually applies at dispatch time. ([#31713](https://github.com/openclaw/openclaw/pull/31713)) Thanks [@whiskyboy](https://github.com/whiskyboy).
-   Mentions/Slack formatting hardening: add null-safe guards for runtime text normalization paths so malformed/undefined text payloads do not crash mention stripping or mrkdwn conversion. ([#31865](https://github.com/openclaw/openclaw/pull/31865)) Thanks [@stone-jin](https://github.com/stone-jin).
-   Feishu/Plugin sdk compatibility: add safe webhook default fallbacks when loading Feishu monitor state so mixed-version installs no longer crash if older
    ```
    openclaw/plugin-sdk
    ```
     builds omit webhook default constants. ([#31606](https://github.com/openclaw/openclaw/issues/31606))
-   Feishu/group broadcast dispatch: add configurable multi-agent group broadcast dispatch with observer-session isolation, cross-account dedupe safeguards, and non-mention history buffering rules that avoid duplicate replay in broadcast/topic workflows. ([#29575](https://github.com/openclaw/openclaw/pull/29575)) Thanks [@ohmyskyhigh](https://github.com/ohmyskyhigh).
-   Gateway/Subagent TLS pairing: allow authenticated local
    ```
    gateway-client
    ```
     backend self-connections to skip device pairing while still requiring pairing for non-local/direct-host paths, restoring
    ```
    sessions_spawn
    ```
     with
    ```
    gateway.tls.enabled=true
    ```
     in Docker/LAN setups. Fixes [#30740](https://github.com/openclaw/openclaw/issues/30740). Thanks [@Sid-Qin](https://github.com/Sid-Qin) and [@vincentkoc](https://github.com/vincentkoc).
-   Browser/CDP startup diagnostics: include Chrome stderr output and a Linux no-sandbox hint in startup timeout errors so failed launches are easier to diagnose. ([#29312](https://github.com/openclaw/openclaw/issues/29312)) Thanks [@veast](https://github.com/veast).
-   Synology Chat/webhook ingress hardening: enforce bounded body reads (size + timeout) via shared request-body guards to prevent unauthenticated slow-body hangs before token validation. ([#25831](https://github.com/openclaw/openclaw/pull/25831)) Thanks [@bmendonca3](https://github.com/bmendonca3).
-   Feishu/Dedup restart resilience: warm persistent dedup state into memory on monitor startup so retry events after gateway restart stay suppressed without requiring initial on-disk probe misses. ([#31605](https://github.com/openclaw/openclaw/pull/31605))
-   Voice-call/runtime lifecycle: prevent
    ```
    EADDRINUSE
    ```
     loops by resetting failed runtime promises, making webhook
    ```
    start()
    ```
     idempotent with the actual bound port, and fully cleaning up webhook/tunnel/tailscale resources after startup failures. ([#32395](https://github.com/openclaw/openclaw/pull/32395)) Thanks [@scoootscooob](https://github.com/scoootscooob).
-   Gateway/Security hardening: tie loopback-origin dev allowance to actual local socket clients (not Host header claims), add explicit warnings/metrics when
    ```
    gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback
    ```
     accepts websocket origins, harden safe-regex detection for quantified ambiguous alternation patterns (for example
    ```
    (a|aa)+
    ```
    ), and bound large regex-evaluation inputs for session-filter and log-redaction paths.
-   Gateway/Plugin HTTP hardening: require explicit
    ```
    auth
    ```
     for plugin route registration, add route ownership guards for duplicate
    ```
    path+match
    ```
     registrations, centralize plugin path matching/auth logic into dedicated modules, and share webhook target-route lifecycle wiring across channel monitors to avoid stale or conflicting registrations. Thanks [@tdjackey](https://github.com/tdjackey) for reporting.
-   Browser/Profile defaults: prefer
    ```
    openclaw
    ```
     profile over
    ```
    chrome
    ```
     in headless/no-sandbox environments unless an explicit
    ```
    defaultProfile
    ```
     is configured. ([#14944](https://github.com/openclaw/openclaw/pull/14944)) Thanks [@BenediktSchackenberg](https://github.com/BenediktSchackenberg).
-   Gateway/WS security: keep plaintext
    ```
    ws://
    ```
     loopback-only by default, w...

[Read more](https://github.com/openclaw/openclaw/releases/tag/v2026.3.2-beta.1)

## openclaw 2026.3.1

02 Mar 04:42

Immutable release. Only release title and notes can be modified.

[
```
d76b224
```
](https://github.com/openclaw/openclaw/commit/d76b224e20c790b7223d4075abd087c9576a4661)

### Changes

-   Agents/Thinking defaults: set
    ```
    adaptive
    ```
     as the default thinking level for Anthropic Claude 4.6 models (including Bedrock Claude 4.6 refs) while keeping other reasoning-capable models at
    ```
    low
    ```
     unless explicitly configured.
-   Gateway/Container probes: add built-in HTTP liveness/readiness endpoints (
    ```
    /health
    ```
    ,
    ```
    /healthz
    ```
    ,
    ```
    /ready
    ```
    ,
    ```
    /readyz
    ```
    ) for Docker/Kubernetes health checks, with fallback routing so existing handlers on those paths are not shadowed. ([#31272](https://github.com/openclaw/openclaw/pull/31272)) Thanks [@vincentkoc](https://github.com/vincentkoc).
-   Android/Nodes: add
    ```
    camera.list
    ```
    ,
    ```
    device.permissions
    ```
    ,
    ```
    device.health
    ```
    , and
    ```
    notifications.actions
    ```
     (
    ```
    open
    ```
    /
    ```
    dismiss
    ```
    /
    ```
    reply
    ```
    ) on Android nodes, plus first-class node-tool actions for the new device/notification commands. ([#28260](https://github.com/openclaw/openclaw/pull/28260)) Thanks [@obviyus](https://github.com/obviyus).
-   Discord/Thread bindings: replace fixed TTL lifecycle with inactivity (
    ```
    idleHours
    ```
    , default 24h) plus optional hard
    ```
    maxAgeHours
    ```
     lifecycle controls, and add
    ```
    /session idle
    ```
     +
    ```
    /session max-age
    ```
     commands for focused thread-bound sessions. ([#27845](https://github.com/openclaw/openclaw/pull/27845)) Thanks [@osolmaz](https://github.com/osolmaz).
-   Telegram/DM topics: add per-DM
    ```
    direct
    ```
     + topic config (allowlists,
    ```
    dmPolicy
    ```
    ,
    ```
    skills
    ```
    ,
    ```
    systemPrompt
    ```
    ,
    ```
    requireTopic
    ```
    ), route DM topics as distinct inbound/outbound sessions, and enforce topic-aware authorization/debounce for messages, callbacks, commands, and reactions. Landed from contributor PR [#30579](https://github.com/openclaw/openclaw/pull/30579) by [@kesor](https://github.com/kesor). Thanks [@kesor](https://github.com/kesor).
-   Web UI/Cron i18n: localize cron page labels, filters, form help text, and validation/error messaging in English and zh-CN. ([#29315](https://github.com/openclaw/openclaw/pull/29315)) Thanks [@BUGKillerKing](https://github.com/BUGKillerKing).
-   OpenAI/Streaming transport: make
    ```
    openai
    ```
     Responses WebSocket-first by default (
    ```
    transport: "auto"
    ```
     with SSE fallback), add shared OpenAI WS stream/connection runtime wiring with per-session cleanup, and preserve server-side compaction payload mutation (
    ```
    store
    ```
     +
    ```
    context_management
    ```
    ) on the WS path.
-   Android/Gateway capability refresh: add live Android capability integration coverage and node canvas capability refresh wiring, plus runtime hardening for A2UI readiness retries, scoped canvas URL normalization, debug diagnostics JSON, and JavaScript MIME delivery. ([#28388](https://github.com/openclaw/openclaw/pull/28388)) Thanks [@obviyus](https://github.com/obviyus).
-   Android/Nodes parity: add
    ```
    system.notify
    ```
    ,
    ```
    photos.latest
    ```
    ,
    ```
    contacts.search
    ```
    /
    ```
    contacts.add
    ```
    ,
    ```
    calendar.events
    ```
    /
    ```
    calendar.add
    ```
    , and
    ```
    motion.activity
    ```
    /
    ```
    motion.pedometer
    ```
    , with motion sensor-aware command gating and improved activity sampling reliability. ([#29398](https://github.com/openclaw/openclaw/pull/29398)) Thanks [@obviyus](https://github.com/obviyus).
-   CLI/Config: add
    ```
    openclaw config file
    ```
     to print the active config file path resolved from
    ```
    OPENCLAW_CONFIG_PATH
    ```
     or the default location. ([#26256](https://github.com/openclaw/openclaw/pull/26256)) thanks [@cyb1278588254](https://github.com/cyb1278588254).
-   Feishu/Docx tables + uploads: add
    ```
    feishu_doc
    ```
     actions for Docx table creation/cell writing (
    ```
    create_table
    ```
    ,
    ```
    write_table_cells
    ```
    ,
    ```
    create_table_with_values
    ```
    ) and image/file uploads (
    ```
    upload_image
    ```
    ,
    ```
    upload_file
    ```
    ) with stricter create/upload error handling for missing
    ```
    document_id
    ```
     and placeholder cleanup failures. ([#20304](https://github.com/openclaw/openclaw/pull/20304)) Thanks [@xuhao1](https://github.com/xuhao1).
-   Feishu/Reactions: add inbound
    ```
    im.message.reaction.created_v1
    ```
     handling, route verified reactions through synthetic inbound turns, and harden verification with timeout + fail-closed filtering so non-bot or unverified reactions are dropped. ([#16716](https://github.com/openclaw/openclaw/pull/16716)) Thanks [@schumilin](https://github.com/schumilin).
-   Feishu/Chat tooling: add
    ```
    feishu_chat
    ```
     tool actions for chat info and member queries, with configurable enablement under
    ```
    channels.feishu.tools.chat
    ```
    . ([#14674](https://github.com/openclaw/openclaw/pull/14674)) Thanks [@liuweifly](https://github.com/liuweifly).
-   Feishu/Doc permissions: support optional owner permission grant fields on
    ```
    feishu_doc
    ```
     create and report permission metadata only when the grant call succeeds, with regression coverage for success/failure/omitted-owner paths. ([#28295](https://github.com/openclaw/openclaw/pull/28295)) Thanks [@zhoulongchao77](https://github.com/zhoulongchao77).
-   Web UI/i18n: add German (
    ```
    de
    ```
    ) locale support and auto-render language options from supported locale constants in Overview settings. ([#28495](https://github.com/openclaw/openclaw/pull/28495)) thanks [@dsantoreis](https://github.com/dsantoreis).
-   Tools/Diffs: add a new optional
    ```
    diffs
    ```
     plugin tool for read-only diff rendering from before/after text or unified patches, with gateway viewer URLs for canvas and PNG image output. Thanks [@gumadeiras](https://github.com/gumadeiras).
-   Memory/LanceDB: support custom OpenAI
    ```
    baseUrl
    ```
     and embedding dimensions for LanceDB memory. ([#17874](https://github.com/openclaw/openclaw/pull/17874)) Thanks [@rish2jain](https://github.com/rish2jain) and [@vincentkoc](https://github.com/vincentkoc).
-   ACP/ACPX streaming: pin ACPX plugin support to
    ```
    0.1.15
    ```
    , add configurable ACPX command/version probing, and streamline ACP stream delivery (
    ```
    final_only
    ```
     default + reduced tool-event noise) with matching runtime and test updates. ([#30036](https://github.com/openclaw/openclaw/pull/30036)) Thanks [@osolmaz](https://github.com/osolmaz).
-   Shell env markers: set
    ```
    OPENCLAW_SHELL
    ```
     across shell-like runtimes (
    ```
    exec
    ```
    ,
    ```
    acp
    ```
    ,
    ```
    acp-client
    ```
    ,
    ```
    tui-local
    ```
    ) so shell startup/config rules can target OpenClaw contexts consistently, and document the markers in env/exec/acp/TUI docs. Thanks [@vincentkoc](https://github.com/vincentkoc).
-   Cron/Heartbeat light bootstrap context: add opt-in lightweight bootstrap mode for automation runs (
    ```
    --light-context
    ```
     for cron agent turns and
    ```
    agents.*.heartbeat.lightContext
    ```
     for heartbeat), keeping only
    ```
    HEARTBEAT.md
    ```
     for heartbeat runs and skipping bootstrap-file injection for cron lightweight runs. ([#26064](https://github.com/openclaw/openclaw/pull/26064)) Thanks [@jose-velez](https://github.com/jose-velez).
-   OpenAI/WebSocket warm-up: add optional OpenAI Responses WebSocket warm-up (
    ```
    response.create
    ```
     with
    ```
    generate:false
    ```
    ), enable it by default for
    ```
    openai/*
    ```
    , and expose
    ```
    params.openaiWsWarmup
    ```
     for per-model enable/disable control.
-   Agents/Subagents runtime events: replace ad-hoc subagent completion system-message handoff with typed internal completion events (
    ```
    task_completion
    ```
    ) that are rendered consistently across direct and queued announce paths, with gateway/CLI plumbing for structured
    ```
    internalEvents
    ```
    .

### Fixes

-   Android/Nodes reliability: reject
    ```
    facing=both
    ```
     when
    ```
    deviceId
    ```
     is set to avoid mislabeled duplicate captures, allow notification
    ```
    open
    ```
    /
    ```
    reply
    ```
     on non-clearable entries while still gating dismiss, trigger listener rebind before notification actions, and scale invoke-result ack timeout to invoke budget for large clip payloads. ([#28260](https://github.com/openclaw/openclaw/pull/28260)) Thanks [@obviyus](https://github.com/obviyus).
-   Windows/Plugin install: avoid
    ```
    spawn EINVAL
    ```
     on Windows npm/npx invocations by resolving to
    ```
    node
    ```
     + npm CLI scripts instead of spawning
    ```
    .cmd
    ```
     directly. Landed from contributor PR [#31147](https://github.com/openclaw/openclaw/pull/31147) by [@codertony](https://github.com/codertony). Thanks [@codertony](https://github.com/codertony).
-   LINE/Voice transcription: classify M4A voice media as
    ```
    audio/mp4
    ```
     (not
    ```
    video/mp4
    ```
    ) by checking the MPEG-4
    ```
    ftyp
    ```
     major brand (
    ```
    M4A
    ```
     /
    ```
    M4B
    ```
    ), restoring voice transcription for LINE voice messages. Landed from contributor PR [#31151](https://github.com/openclaw/openclaw/pull/31151) by [@scoootscooob](https://github.com/scoootscooob). Thanks [@scoootscooob](https://github.com/scoootscooob).
-   Slack/Announce target account routing: enable session-backed announce-target lookup for Slack so multi-account announces resolve the correct
    ```
    accountId
    ```
     instead of defaulting to bot-token context. Landed from contributor PR [#31028](https://github.com/openclaw/openclaw/pull/31028) by [@taw0002](https://github.com/taw0002). Thanks [@taw0002](https://github.com/taw0002).
-   Android/Voice screen TTS: stream assistant speech via ElevenLabs WebSocket in Talk Mode, stop cleanly on speaker mute/barge-in, and ignore stale out-of-order stream events. ([#29521](https://github.com/openclaw/openclaw/pull/29521)) Thanks [@gregmousseau](https://github.com/gregmousseau).
-   Android/Photos permissions: declare Android 14+ selected-photo access permission (
    ```
    READ_MEDIA_VISUAL_USER_SELECTED
    ```
    ) and align Android permission/settings paths with current minSdk behavior for more reliable permission state handling.
-   Web UI/Cron: include configured agent model defaults/fallbacks in cron model suggestions so scheduled-job model autocomplete reflects configured models. ([#29709](https://github.com/openclaw/openclaw/pull/29709)) Thanks [@Sid-Qin](https://github.com/Sid-Qin).
-   Cron/Delivery: disable the agent messaging tool when
    ```
    delivery.mode
    ```
     is
    ```
    "none"
    ```
     so cron output is not sent to Telegram or other channels. ([#21808](https://github.com/openclaw/openclaw/issues/21808)) Thanks [@lailoo](https://github.com/lailoo).
-   CLI/Cron: clarify
    ```
    cron list
    ```
     output by renaming
    ```
    Agent
    ```
     to
    ```
    Agent ID
    ```
     and adding a
    ```
    Model
    ```
     column for isolated agent-turn jobs. ([#26259](https://github.com/openclaw/openclaw/pull/26259)) Thanks [@openperf](https://github.com/openperf).
-   Feishu/Reply media attachments: send Feishu reply
    ```
    mediaUrl
    ```
    /
    ```
    mediaUrls
    ```
     payloads as attachments alongside text/streamed replies in the reply dispatcher, including legacy fallback when
    ```
    mediaUrls
    ```
     is empty. ([#28959](https://github.com/openclaw/openclaw/pull/28959)) Thanks [@icesword0760](https://github.com/icesword0760).
-   Slack/User-token resolution: normalize Slack account user-token sourcing through resolved account metadata (
    ```
    SLACK_USER_TOKEN
    ```
     env + config) so monitor reads, Slack actions, directory lookups, onboarding allow-from resolution, and capabilities probing consistently use the effective user token. ([#28103](https://github.com/openclaw/openclaw/pull/28103)) Thanks [@Glucksberg](https://github.com/Glucksberg).
-   Feishu/Outbound session routing: stop assuming bare
    ```
    oc_
    ```
     identifiers are always group chats, honor explicit
    ```
    dm:
    ```
    /
    ```
    group:
    ```
     prefixes for
    ```
    oc_
    ```
     chat IDs, and default ambiguous bare
    ```
    oc_
    ```
     targets to direct routing to avoid DM session misclassification. ([#10407](https://github.com/openclaw/openclaw/pull/10407)) Thanks [@Bermudarat](https://github.com/Bermudarat).
-   Feishu/Group session routing: add configurable group session scopes (
    ```
    group
    ```
    ,
    ```
    group_sender
    ```
    ,
    ```
    group_topic
    ```
    ,
    ```
    group_topic_sender
    ```
    ) with legacy
    ```
    topicSessionMode=enabled
    ```
     compatibility so Feishu group conversations can isolate sessions by sender/topic as configured. ([#17798](https://github.com/openclaw/openclaw/pull/17798)) Thanks [@yfge](https://github.com/yfge).
-   Feishu/Reply-in-thread routing: add
    ```
    replyInThread
    ```
     config (
    ```
    disabled|enabled
    ```
    ) for group replies, propagate
    ```
    reply_in_thread
    ```
     across text/card/media/streaming sends, and align topic-scoped session routing so newly created reply threads stay on the same session root. ([#27325](https://github.com/openclaw/openclaw/pull/27325)) Thanks [@kcinzgg](https://github.com/kcinzgg).
-   Feishu/Probe status caching: cache successful
    ```
    probeFeishu()
    ```
     bot-info results for 10 minutes (bounded cache with per-account keying) to reduce repeated status/onboarding probe API calls, while bypassing cache for failures and exceptions. ([#28907](https://github.com/openclaw/openclaw/pull/28907)) Thanks [@Glucksberg](https://github.com/Glucksberg).
-   Feishu/Opus media send type: send
    ```
    .opus
    ```
     attachments with
    ```
    msg_type: "audio"
    ```
     (instead of
    ```
    "media"
    ```
    ) so Feishu voice messages deliver correctly while
    ```
    .mp4
    ```
     remains
    ```
    msg_type: "media"
    ```
     and documents remain
    ```
    msg_type: "file"
    ```
    . ([#28269](https://github.com/openclaw/openclaw/pull/28269)) Thanks [@Glucksberg](https://github.com/Glucksberg).
-   Feishu/Mobile video media type: treat inbound
    ```
    message_type: "media"
    ```
     as video-equivalent for media key extraction, placeholder inference, and media download resolution so mobile-app video sends ingest correctly. ([#25502](https://github.com/openclaw/openclaw/pull/25502)) Thanks [@4ier](https://github.com/4ier).
-   Feishu/Inbound sender fallback: fall back to
    ```
    sender_id.user_id
    ```
     when
    ```
    sender_id.open_id
    ```
     is missing on inbound events, and use ID-type-aware sender lookup so mobile-delivered messages keep stable sender identity/routing. ([#26703](https://github.com/openclaw/openclaw/pull/26703))...

[Read more](https://github.com/openclaw/openclaw/releases/tag/v2026.3.1)


---
## ✅ Recently Synchronized Pull Requests (Integrated in 2026.2.27)

The following PRs have been integrated into our local engine:

- [x] #26171 Android canvas: screen tab restore flow + mobile viewport fixes
- [x] #26119 fix(discord): gate component command authorization for guild interactions
- [x] #26118 security(nextcloud-talk): reject unsigned webhook traffic before body reads
- [x] #26116 security(nextcloud-talk): isolate group allowlist from pairing-store entries
- [x] #26115 fix(hooks): include guildId and channelName in message_received metadata
- [x] #26112 security(irc): isolate group allowlist from DM pairing-store entries
- [x] #26111 security(msteams): isolate group allowlist from pairing-store entries
- [x] #26109 fix(followup): fall back to dispatcher when same-channel origin routing fails
- [x] #26106 fix(agents): continue fallback loop for unrecognized provider errors
- [x] #26105 fix(markdown): require paired \|\| delimiters for spoiler detection
- [x] #26095 security(line): cap unsigned webhook body reads before auth
- [x] #26079 feat(android): improve chat streaming and markdown rendering
- [x] #25991 fix(security): fail-closed turn-source routing in shared sessions
- [x] #25954 fix(telegram): fail closed on empty group allowFrom override
- [x] #25924 test(media): add win32 dev=0 local media regression
- [x] #25923 fix(imessage): stop reasoning echo feedback loops and harden reply suppression
- [x] #25917 fix(windows): align async/sync safe-open identity checks
- [x] #25916 fix(heartbeat): default target none and internalize cron/exec relay prompts
- [x] #25909 fix(discord): harden voice DAVE receive reliability
- [x] #25901 fix(gateway): honor explicit allowlist refs when bundled catalog is stale
- [x] #25898 docs(changelog): backfill landed fix PR entries
- [x] #25894 Auto-reply: treat exact 'do not do that' as stop trigger
- [x] #25892 Auth: bypass cooldown windows for OpenRouter profiles
- [x] #25891 fix(sandbox): prevent shell option interpretation for paths with leading hyphens
- [x] #25881 fix: harden routing/session isolation for followups and heartbeat
- [x] #25874 fix(tui): resolve wrong provider prefix when session has model without modelProvider
- [x] #25865 refactor(ios): drop legacy talk payload and keychain fallbacks
- [x] #25858 fix(whatsapp): treat close status 440 as non-retryable
- [x] #25847 UI: tighten external image-open safety checks and CI guard
- [x] #25832 security(voice-call): detect Telnyx webhook replay
- [x] #25820 fix(sandbox): block tmp hardlink alias escapes in media path resolution
- [x] #25803 fix(onboard): avoid false 'telegram plugin not available' block
- [x] #25756 fix: normalize provider ID in resolveModelConfig for Bedrock auth
- [x] #25755 fix(security): sanitize inherited host env for exec host runs
- [x] #25753 Gateway/Security: protect /api/channels plugin root
- [x] #25750 fix(security): normalize hook session key casing for external classification
- [x] #25616 feat(android): continue rebuild with onboarding, chat, and settings updates
- [x] #25491 fix(config): coerce numeric meta.lastTouchedAt to ISO string
- [x] #25490 docs: add WeChat community plugin listing
- [x] #25485 fix: slug-generator uses effective model instead of agent-primary
- [x] #25479 fix(slack): override wrong channel_type for D-prefix DM channels
- [x] #25459 fix(hooks): ensure native /new emits command hooks on early-return paths
- [x] #25444 ui: centralize safe external URL opening for chat images
- [x] #25438 fix(doctor): improve sandbox warning when Docker unavailable
- [x] #25436 fix(usage): parse Kimi K2 cached_tokens from prompt_tokens_details
- [x] #25429 fix: prevent synthetic toolResult for aborted/errored assistant messages
- [x] #25428 fix(gateway): allow trusted-proxy control-ui auth to skip device pairing
- [x] #25427 fix(agents): await block-reply flush before tool execution starts
- [x] #25410 fix(sandbox): preserve bind mount security overrides when resolving D…
- [x] #25368 docs: fix 4 broken documentation links in README

---

## 🔍 Status Summary

1. **Current Version:** 2026.2.27 (Synchronized on 2026-03-04)
2. **Upstream Version:** 2026.2.27
3. **Version Gap:** 0 (Up to date)

---

**Report Updated:** 2026-03-04 23:15:00
**Reason:** Completed Track `openclaw_sync_20260228`
