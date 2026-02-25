# OpenClaw Upstream Repository - Pull Requests & Updates Report

**Generated on:** 2026-02-25 07:16:57
**Upstream Repository:** https://github.com/openclaw/openclaw
**Your Fork Location:** openclaw/ subdirectory in WhatsDeX project

---

## 📊 Summary Statistics

- **Total PRs Found:** 1000
- **Open PRs:** 635
- **Merged PRs:** 117
- **Closed (Not Merged) PRs:** 248

---

## 🚀 Latest Releases

openclaw 2026.2.24	Latest	v2026.2.24	2026-02-25T03:31:17Z
openclaw 2026.2.24-beta.1	Pre-release	v2026.2.24-beta.1	2026-02-25T03:01:17Z
openclaw 2026.2.23		v2026.2.23	2026-02-24T05:41:47Z
openclaw 2026.2.22		v2026.2.22	2026-02-23T04:09:40Z
openclaw 2026.2.21		v2026.2.21	2026-02-21T16:56:48Z
openclaw 2026.2.19		v2026.2.19	2026-02-19T17:35:21Z
openclaw 2026.2.19	Pre-release	v2026.2.19-beta.1	2026-02-19T16:21:06Z
openclaw 2026.2.17		v2026.2.17	2026-02-18T02:55:29Z
openclaw 2026.2.15-beta.1	Pre-release	v2026.2.15-beta.1	2026-02-16T04:12:20Z
openclaw 2026.2.15		v2026.2.15	2026-02-16T04:43:47Z
openclaw 2026.2.14		v2026.2.14	2026-02-15T03:18:52Z
openclaw 2026.2.13		v2026.2.13	2026-02-14T03:32:02Z
openclaw 2026.2.12		v2026.2.12	2026-02-13T02:18:50Z
openclaw 2026.2.9		v2026.2.9	2026-02-09T19:23:20Z
openclaw 2026.2.6		v2026.2.6	2026-02-07T02:27:43Z
openclaw 2026.2.3		v2026.2.3	2026-02-05T01:57:22Z
openclaw 2026.2.2		v2026.2.2	2026-02-04T01:05:25Z
openclaw 2026.2.1		v2026.2.1	2026-02-02T11:54:07Z
openclaw 2026.1.30		v2026.1.30	2026-01-31T15:22:30Z
openclaw 2026.1.29		v2026.1.29	2026-01-30T05:26:50Z
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
| [#26090](https://github.com/openclaw/openclaw/pull/26090) | telegram: treat unmatched \|\| as plain text in markdown formatter | Kemalau | 2026-02-25 | channel: signal, channel: telegram, size: XS |
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

## ✅ Recently Merged Pull Requests (Latest 50)

These PRs have been successfully merged into the upstream repository:

| # | Title | Author | Merged Date | Labels |
|---|-------|--------|-------------|--------|
| [#26171](https://github.com/openclaw/openclaw/pull/26171) | Android canvas: screen tab restore flow + mobile viewport fixes | obviyus | 2026-02-25 | app: android, maintainer, size: M |
| [#26119](https://github.com/openclaw/openclaw/pull/26119) | fix(discord): gate component command authorization for guild interactions | bmendonca3 | 2026-02-25 | channel: discord, size: S, experienced-contributor |
| [#26118](https://github.com/openclaw/openclaw/pull/26118) | security(nextcloud-talk): reject unsigned webhook traffic before body reads | bmendonca3 | 2026-02-25 | channel: nextcloud-talk, size: S, experienced-contributor |
| [#26116](https://github.com/openclaw/openclaw/pull/26116) | security(nextcloud-talk): isolate group allowlist from pairing-store entries | bmendonca3 | 2026-02-25 | channel: nextcloud-talk, size: S, experienced-contributor |
| [#26115](https://github.com/openclaw/openclaw/pull/26115) | fix(hooks): include guildId and channelName in message_received metadata | davidrudduck | 2026-02-25 | size: XS, trusted-contributor |
| [#26112](https://github.com/openclaw/openclaw/pull/26112) | security(irc): isolate group allowlist from DM pairing-store entries | bmendonca3 | 2026-02-25 | channel: irc, size: S, experienced-contributor |
| [#26111](https://github.com/openclaw/openclaw/pull/26111) | security(msteams): isolate group allowlist from pairing-store entries | bmendonca3 | 2026-02-25 | channel: msteams, size: S, experienced-contributor |
| [#26109](https://github.com/openclaw/openclaw/pull/26109) | fix(followup): fall back to dispatcher when same-channel origin routing fails | Sid-Qin | 2026-02-25 | size: S, experienced-contributor |
| [#26106](https://github.com/openclaw/openclaw/pull/26106) | fix(agents): continue fallback loop for unrecognized provider errors | Sid-Qin | 2026-02-25 | agents, size: S, experienced-contributor |
| [#26105](https://github.com/openclaw/openclaw/pull/26105) | fix(markdown): require paired \|\| delimiters for spoiler detection | Sid-Qin | 2026-02-25 | channel: telegram, size: XS, experienced-contributor |
| [#26095](https://github.com/openclaw/openclaw/pull/26095) | security(line): cap unsigned webhook body reads before auth | bmendonca3 | 2026-02-25 | size: XS, experienced-contributor |
| [#26079](https://github.com/openclaw/openclaw/pull/26079) | feat(android): improve chat streaming and markdown rendering | obviyus | 2026-02-25 | app: android, agents, maintainer, size: L |
| [#25991](https://github.com/openclaw/openclaw/pull/25991) | fix(security): fail-closed turn-source routing in shared sessions | steipete | 2026-02-25 | gateway, commands, maintainer, size: S |
| [#25954](https://github.com/openclaw/openclaw/pull/25954) | fix(telegram): fail closed on empty group allowFrom override | bmendonca3 | 2026-02-25 | channel: telegram, size: S, experienced-contributor |
| [#25924](https://github.com/openclaw/openclaw/pull/25924) | test(media): add win32 dev=0 local media regression | steipete | 2026-02-25 | channel: whatsapp-web, maintainer, size: XS |
| [#25923](https://github.com/openclaw/openclaw/pull/25923) | fix(imessage): stop reasoning echo feedback loops and harden reply suppression | steipete | 2026-02-25 | channel: imessage, agents, maintainer, size: M |
| [#25917](https://github.com/openclaw/openclaw/pull/25917) | fix(windows): align async/sync safe-open identity checks | steipete | 2026-02-25 | maintainer, size: S |
| [#25916](https://github.com/openclaw/openclaw/pull/25916) | fix(heartbeat): default target none and internalize cron/exec relay prompts | steipete | 2026-02-25 | docs, gateway, docker, agents, maintainer, size: M |
| [#25909](https://github.com/openclaw/openclaw/pull/25909) | fix(discord): harden voice DAVE receive reliability | steipete | 2026-02-25 | docs, channel: discord, gateway, maintainer, size: M |
| [#25901](https://github.com/openclaw/openclaw/pull/25901) | fix(gateway): honor explicit allowlist refs when bundled catalog is stale | vincentkoc | 2026-02-25 | gateway, agents, maintainer, size: S |
| [#25898](https://github.com/openclaw/openclaw/pull/25898) | docs(changelog): backfill landed fix PR entries | steipete | 2026-02-24 | maintainer, size: XS |
| [#25894](https://github.com/openclaw/openclaw/pull/25894) | Auto-reply: treat exact 'do not do that' as stop trigger | vincentkoc | 2026-02-24 | channel: telegram, gateway, maintainer, size: XS |
| [#25892](https://github.com/openclaw/openclaw/pull/25892) | Auth: bypass cooldown windows for OpenRouter profiles | vincentkoc | 2026-02-25 | agents, maintainer, size: S |
| [#25891](https://github.com/openclaw/openclaw/pull/25891) | fix(sandbox): prevent shell option interpretation for paths with leading hyphens | albertlieyingadrian | 2026-02-25 | agents, size: XS |
| [#25881](https://github.com/openclaw/openclaw/pull/25881) | fix: harden routing/session isolation for followups and heartbeat | steipete | 2026-02-24 | maintainer, size: M |
| [#25874](https://github.com/openclaw/openclaw/pull/25874) | fix(tui): resolve wrong provider prefix when session has model without modelProvider | lbo728 | 2026-02-25 | gateway, commands, agents, size: L, trusted-contributor |
| [#25865](https://github.com/openclaw/openclaw/pull/25865) | refactor(ios): drop legacy talk payload and keychain fallbacks | steipete | 2026-02-24 | app: ios, maintainer, size: S |
| [#25858](https://github.com/openclaw/openclaw/pull/25858) | fix(whatsapp): treat close status 440 as non-retryable | markmusson | 2026-02-24 | channel: whatsapp-web, size: S |
| [#25847](https://github.com/openclaw/openclaw/pull/25847) | UI: tighten external image-open safety checks and CI guard | shakkernerd | 2026-02-24 | app: web-ui, maintainer, size: S |
| [#25832](https://github.com/openclaw/openclaw/pull/25832) | security(voice-call): detect Telnyx webhook replay | bmendonca3 | 2026-02-24 | channel: voice-call, size: S, trusted-contributor |
| [#25820](https://github.com/openclaw/openclaw/pull/25820) | fix(sandbox): block tmp hardlink alias escapes in media path resolution | bmendonca3 | 2026-02-25 | docker, agents, size: S, trusted-contributor, experienced-contributor |
| [#25803](https://github.com/openclaw/openclaw/pull/25803) | fix(onboard): avoid false 'telegram plugin not available' block | Suko | 2026-02-24 | commands, size: S |
| [#25756](https://github.com/openclaw/openclaw/pull/25756) | fix: normalize provider ID in resolveModelConfig for Bedrock auth | fwhite13 | 2026-02-24 | agents, size: XS |
| [#25755](https://github.com/openclaw/openclaw/pull/25755) | fix(security): sanitize inherited host env for exec host runs | bmendonca3 | 2026-02-24 | agents, size: XS, trusted-contributor |
| [#25753](https://github.com/openclaw/openclaw/pull/25753) | Gateway/Security: protect /api/channels plugin root | bmendonca3 | 2026-02-24 | gateway, size: XS, trusted-contributor |
| [#25750](https://github.com/openclaw/openclaw/pull/25750) | fix(security): normalize hook session key casing for external classification | bmendonca3 | 2026-02-24 | size: XS, trusted-contributor |
| [#25616](https://github.com/openclaw/openclaw/pull/25616) | feat(android): continue rebuild with onboarding, chat, and settings updates | obviyus | 2026-02-24 | app: android, maintainer, size: XL |
| [#25491](https://github.com/openclaw/openclaw/pull/25491) | fix(config): coerce numeric meta.lastTouchedAt to ISO string | mcaxtr | 2026-02-24 | size: S, experienced-contributor |
| [#25490](https://github.com/openclaw/openclaw/pull/25490) | docs: add WeChat community plugin listing | icesword0760 | 2026-02-24 | docs, size: XS |
| [#25485](https://github.com/openclaw/openclaw/pull/25485) | fix: slug-generator uses effective model instead of agent-primary | SudeepMalipeddi | 2026-02-24 | size: XS |
| [#25479](https://github.com/openclaw/openclaw/pull/25479) | fix(slack): override wrong channel_type for D-prefix DM channels | mcaxtr | 2026-02-24 | channel: slack, size: S, experienced-contributor |
| [#25459](https://github.com/openclaw/openclaw/pull/25459) | fix(hooks): ensure native /new emits command hooks on early-return paths | chilu18 | 2026-02-24 | size: M, trusted-contributor |
| [#25444](https://github.com/openclaw/openclaw/pull/25444) | ui: centralize safe external URL opening for chat images | shakkernerd | 2026-02-24 | app: web-ui, scripts, maintainer, size: M |
| [#25438](https://github.com/openclaw/openclaw/pull/25438) | fix(doctor): improve sandbox warning when Docker unavailable | mcaxtr | 2026-02-24 | commands, size: S, experienced-contributor |
| [#25436](https://github.com/openclaw/openclaw/pull/25436) | fix(usage): parse Kimi K2 cached_tokens from prompt_tokens_details | Elarwei001 | 2026-02-24 | agents, size: XS |
| [#25429](https://github.com/openclaw/openclaw/pull/25429) | fix: prevent synthetic toolResult for aborted/errored assistant messages | mikaeldiakhate-cell | 2026-02-24 | agents, size: S |
| [#25428](https://github.com/openclaw/openclaw/pull/25428) | fix(gateway): allow trusted-proxy control-ui auth to skip device pairing | Sid-Qin | 2026-02-24 | gateway, size: S, trusted-contributor |
| [#25427](https://github.com/openclaw/openclaw/pull/25427) | fix(agents): await block-reply flush before tool execution starts | Sid-Qin | 2026-02-24 | agents, size: XS, trusted-contributor |
| [#25410](https://github.com/openclaw/openclaw/pull/25410) | fix(sandbox): preserve bind mount security overrides when resolving D… | skyer-jian | 2026-02-25 | docker, size: XS |
| [#25368](https://github.com/openclaw/openclaw/pull/25368) | docs: fix 4 broken documentation links in README | PinoHouse | 2026-02-24 | size: XS |

---

## ❌ Closed Pull Requests (Latest 50)

These PRs were closed without being merged:

| # | Title | Author | Closed Date | Labels |
|---|-------|--------|-------------|--------|
| [#26208](https://github.com/openclaw/openclaw/pull/26208) | Docker: cap Node heap in image build to reduce OOM (exit 137) on smal… | zwffff | 2026-02-25 | docs, docker, size: XS |
| [#26191](https://github.com/openclaw/openclaw/pull/26191) | fix(whatsapp): use Opus format for TTS voice notes instead of MP3 | Lucenx9 | 2026-02-25 | channel: whatsapp-web, size: S |
| [#26159](https://github.com/openclaw/openclaw/pull/26159) | docs: add v2026.2.24 upgrade readiness checklist | senzu-dev | 2026-02-25 | docs, size: XS |
| [#26151](https://github.com/openclaw/openclaw/pull/26151) | Claude/general improvements h nhls | ianalloway | 2026-02-25 | size: M |
| [#26146](https://github.com/openclaw/openclaw/pull/26146) | feat: Discord rich UI components (buttons, select menus, modals) | victorGPT | 2026-02-25 | docs, agents, size: L |
| [#26142](https://github.com/openclaw/openclaw/pull/26142) | fix(whisper): prefix skill script invocations with bash | drvoss | 2026-02-25 | size: XS |
| [#26126](https://github.com/openclaw/openclaw/pull/26126) | Memory: unify embedding providers across supabase and lancedb | cfregly | 2026-02-25 | gateway, extensions: diagnostics-otel, extensions: memory-lancedb, agents, size: XL |
| [#26114](https://github.com/openclaw/openclaw/pull/26114) | Thelab v1 | thestudiopod | 2026-02-25 | docs, size: XL |
| [#26102](https://github.com/openclaw/openclaw/pull/26102) | security(nextcloud-talk): isolate group allowlist from DM pairing-store entries | bmendonca3 | 2026-02-25 | channel: nextcloud-talk, size: S, experienced-contributor |
| [#26099](https://github.com/openclaw/openclaw/pull/26099) | fix(cron): clear threadId for announce-mode deliveries | jleechan2015 | 2026-02-25 | size: S |
| [#26083](https://github.com/openclaw/openclaw/pull/26083) | feat: Add SkillBoss provider with 50+ AI models | xiaoyinqu | 2026-02-25 | docs, size: XS |
| [#26046](https://github.com/openclaw/openclaw/pull/26046) | Fix/relay token double derivation 26036 | white-rm | 2026-02-25 | size: M |
| [#26008](https://github.com/openclaw/openclaw/pull/26008) | fix(telegram): add explicit type params to vi.fn() exports in test-utils | beiyu | 2026-02-25 | channel: telegram, size: XS |
| [#25986](https://github.com/openclaw/openclaw/pull/25986) | Extensions: add memory-supabase plugin | cfregly | 2026-02-25 | docs, agents, size: XL |
| [#25949](https://github.com/openclaw/openclaw/pull/25949) | fix(cli): support --query in memory search | stakeswky | 2026-02-25 | docs, cli, size: S, trusted-contributor |
| [#25942](https://github.com/openclaw/openclaw/pull/25942) | fix(channels): add typing keepalive for long-running replies | Sid-Qin | 2026-02-25 | channel: telegram, docker, agents, size: S, experienced-contributor |
| [#25937](https://github.com/openclaw/openclaw/pull/25937) | fix(sandbox): dash compatibility for fs-bridge + propagate dangerously* config keys | sebasortiz-dev | 2026-02-25 | agents, size: XS |
| [#25922](https://github.com/openclaw/openclaw/pull/25922) | fix: include configured fallback chain when running non-primary model | Taskle | 2026-02-25 | agents, size: S |
| [#25919](https://github.com/openclaw/openclaw/pull/25919) | fix: include configured fallback chain when running non-primary model | Taskle | 2026-02-25 | agents, size: L |
| [#25914](https://github.com/openclaw/openclaw/pull/25914) | fix: include configured fallback chain when running non-primary model | Taskle | 2026-02-25 | agents, size: L |
| [#25905](https://github.com/openclaw/openclaw/pull/25905) | feat(pruning): extend context pruning to all providers | Jherrild | 2026-02-25 | agents, size: XL |
| [#25904](https://github.com/openclaw/openclaw/pull/25904) | fix(cli): support --query flag in memory search command | niceysam | 2026-02-25 | cli, size: XS |
| [#25886](https://github.com/openclaw/openclaw/pull/25886) | fix: keep typing indicator alive during long inference | stakeswky | 2026-02-25 | size: S, trusted-contributor |
| [#25885](https://github.com/openclaw/openclaw/pull/25885) | Occc/phase 3 installer wizard | hlucianojr2 | 2026-02-24 | docs, app: android, app: ios, app: macos, app: web-ui, gateway, cli, scripts, commands, docker, agents, size: XL |
| [#25879](https://github.com/openclaw/openclaw/pull/25879) | fix(plugins): close system prompt replacement vulnerability via appendSystemPrompt | John-Rood | 2026-02-24 | agents, size: M |
| [#25873](https://github.com/openclaw/openclaw/pull/25873) | fix(plugins): close system prompt replacement vulnerability via appendSystemPrompt | John-Rood | 2026-02-24 | agents, size: M |
| [#25870](https://github.com/openclaw/openclaw/pull/25870) | feat(security): add external secrets management | joshavant | 2026-02-25 | docs, channel: discord, channel: googlechat, channel: imessage, channel: matrix, channel: mattermost, channel: msteams, channel: signal, channel: slack, channel: telegram, channel: voice-call, channel: whatsapp-web, channel: zalo, app: macos, app: web-ui, gateway, extensions: llm-task, extensions: memory-lancedb, cli, security, scripts, commands, docker, agents, maintainer, channel: feishu, size: XL |
| [#25867](https://github.com/openclaw/openclaw/pull/25867) | fix(cli): remove incorrect --query flag from memory search help example | kevinWangSheng | 2026-02-25 | cli, size: XS |
| [#25866](https://github.com/openclaw/openclaw/pull/25866) | fix(plugins): close system prompt replacement vulnerability via appendSystemPrompt | John-Rood | 2026-02-24 | agents, size: M |
| [#25860](https://github.com/openclaw/openclaw/pull/25860) | Secrets: add SecretRef runtime activation, migrate/reload tooling, onboarding refs, and docs | joshavant | 2026-02-24 | docs, channel: googlechat, gateway, cli, commands, agents, maintainer, size: XL |
| [#25841](https://github.com/openclaw/openclaw/pull/25841) | fix(matrix): per-room send queue and immediate read receipts | joshjhall | 2026-02-24 | channel: matrix, size: M |
| [#25839](https://github.com/openclaw/openclaw/pull/25839) | fix(discord): only suppress reasoning payloads, not all block payloads | pewallin | 2026-02-24 | channel: discord, size: XS |
| [#25834](https://github.com/openclaw/openclaw/pull/25834) | fix(plugins): close system prompt replacement vulnerability via appendSystemPrompt | John-Rood | 2026-02-24 | agents, size: M |
| [#25827](https://github.com/openclaw/openclaw/pull/25827) | fix(synology-chat): fail closed on empty allowlist | bmendonca3 | 2026-02-25 | size: XS, trusted-contributor |
| [#25822](https://github.com/openclaw/openclaw/pull/25822) | fix(agents): suppress ANNOUNCE_SKIP in sessions_spawn direct completion delivery | widingmarcus-cyber | 2026-02-24 | agents, size: S, trusted-contributor |
| [#25821](https://github.com/openclaw/openclaw/pull/25821) | fix(tools): include cron in coding tool profile | stakeswky | 2026-02-24 | gateway, agents, size: S, trusted-contributor |
| [#25817](https://github.com/openclaw/openclaw/pull/25817) | fix(macos): guard all audio input paths against missing microphone (AI-assisted) | sfo2001 | 2026-02-25 | app: macos, size: S, trusted-contributor |
| [#25814](https://github.com/openclaw/openclaw/pull/25814) | Rewrite SOUL.md for Openclaw Mobile users | goatag | 2026-02-24 | docs, size: XS |
| [#25813](https://github.com/openclaw/openclaw/pull/25813) | fix(subagent): respect ANNOUNCE_SKIP in sessions_spawn direct completion delivery | kevinWangSheng | 2026-02-24 | agents, size: XS |
| [#25804](https://github.com/openclaw/openclaw/pull/25804) | WhatsApp: filter reasoning messages from delivery (fixes #25214, #24328) | Lucenx9 | 2026-02-25 | channel: whatsapp-web, size: S |
| [#25785](https://github.com/openclaw/openclaw/pull/25785) | security: add config integrity verification (Spec 04) | joelnishanth | 2026-02-25 | gateway, cli, size: XL |
| [#25771](https://github.com/openclaw/openclaw/pull/25771) | security: add plugin capability manifest system | joelnishanth | 2026-02-25 | channel: matrix, channel: msteams, channel: voice-call, gateway, size: XL |
| [#25770](https://github.com/openclaw/openclaw/pull/25770) | fix(tui): show context bar during thinking/waiting states | joeyfrasier | 2026-02-24 | size: S |
| [#25763](https://github.com/openclaw/openclaw/pull/25763) | Added ClawPane as a Provider in OpenClaw | aposded | 2026-02-24 | docs, cli, commands, size: S |
| [#25762](https://github.com/openclaw/openclaw/pull/25762) | security: add config integrity verification (Spec 04) | joelnishanth | 2026-02-24 | gateway, cli, size: XL |
| [#25757](https://github.com/openclaw/openclaw/pull/25757) | fix(message): include target in reply suppression tracking | Suko | 2026-02-25 | agents, size: XS |
| [#25748](https://github.com/openclaw/openclaw/pull/25748) | fix(outbound): prevent heartbeat/cron delivery from inheriting session lastThreadId | markshields-tl | 2026-02-25 | size: XS |
| [#25741](https://github.com/openclaw/openclaw/pull/25741) | fix(security): normalize hook session key casing for external classification | bmendonca3 | 2026-02-24 | size: XS, trusted-contributor |
| [#25737](https://github.com/openclaw/openclaw/pull/25737) | fix(sandbox): POSIX sh syntax error in resolveCanonicalContainerPath | DennisGoldfinger | 2026-02-24 | agents, size: XS |
| [#25733](https://github.com/openclaw/openclaw/pull/25733) | fix(gateway): bind node system.run approval to approved run-shape | bmendonca3 | 2026-02-24 | app: web-ui, gateway, agents, size: M, trusted-contributor |


---

## 📋 Recent Changelog Highlights

```markdown
# Changelog

Docs: https://docs.openclaw.ai

## 2026.2.15 (Unreleased)

### Changes

- Cron/Gateway: add finished-run webhook delivery toggle (`notify`) and dedicated webhook auth token support (`cron.webhookToken`) for outbound cron webhook posts. (#14535) Thanks @advaitpaliwal.
- Plugins: expose `llm_input` and `llm_output` hook payloads so extensions can observe prompt/input context and model output usage details. (#16724) Thanks @SecondThread.
- Subagents: nested sub-agents (sub-sub-agents) with configurable depth. Set `agents.defaults.subagents.maxSpawnDepth: 2` to allow sub-agents to spawn their own children. Includes `maxChildrenPerAgent` limit (default 5), depth-aware tool policy, and proper announce chain routing. (#14447) Thanks @tyler6204.
- Discord: components v2 UI + embeds passthrough + exec approval UX refinements (CV2 containers, button layout, Discord-forwarding skip). Thanks @thewilloftheshadow.
- Slack/Discord/Telegram: add per-channel ack reaction overrides (account/channel-level) to support platform-specific emoji formats. (#17092) Thanks @zerone0x.
- Channels: deduplicate probe/token resolution base types across core + extensions while preserving per-channel error typing. (#16986) Thanks @iyoda and @thewilloftheshadow.

### Fixes

- Web UI/Agents: hide `BOOTSTRAP.md` in the Agents Files list after onboarding is completed, avoiding confusing missing-file warnings for completed workspaces. (#17491) Thanks @gumadeiras.
- Telegram: omit `message_thread_id` for DM sends/draft previews and keep forum-topic handling (`id=1` general omitted, non-general kept), preventing DM failures with `400 Bad Request: message thread not found`. (#10942) Thanks @garnetlyx.
- Subagents/Models: preserve `agents.defaults.model.fallbacks` when subagent sessions carry a model override, so subagent runs fail over to configured fallback models instead of retrying only the overridden primary model.
- Config/Gateway: make sensitive-key whitelist suffix matching case-insensitive while preserving `passwordFile` path exemptions, preventing accidental redaction of non-secret config values like `maxTokens` and IRC password-file paths. (#16042) Thanks @akramcodez.
- Group chats: always inject group chat context (name, participants, reply guidance) into the system prompt on every turn, not just the first. Prevents the model from losing awareness of which group it's in and incorrectly using the message tool to send to the same group. (#14447) Thanks @tyler6204.
- TUI: make searchable-select filtering and highlight rendering ANSI-aware so queries ignore hidden escape codes and no longer corrupt ANSI styling sequences during match highlighting. (#4519) Thanks @bee4come.
- TUI/Windows: coalesce rapid single-line submit bursts in Git Bash into one multiline message as a fallback when bracketed paste is unavailable, preventing pasted multiline text from being split into multiple sends. (#4986) Thanks @adamkane.
- TUI: suppress false `(no output)` placeholders for non-local empty final events during concurrent runs, preventing external-channel replies from showing empty assistant bubbles while a local run is still streaming. (#5782) Thanks @LagWizard and @vignesh07.
- TUI: preserve copy-sensitive long tokens (URLs/paths/file-like identifiers) during wrapping and overflow sanitization so wrapped output no longer inserts spaces that corrupt copy/paste values. (#17515, #17466, #17505) Thanks @abe238, @trevorpan, and @JasonCry.
- Auto-reply/WhatsApp/TUI/Web: when a final assistant message is `NO_REPLY` and a messaging tool send succeeded, mirror the delivered messaging-tool text into session-visible assistant output so TUI/Web no longer show `NO_REPLY` placeholders. (#7010) Thanks @Morrowind-Xie.
- Gateway/Chat: harden `chat.send` inbound message handling by rejecting null bytes, stripping unsafe control characters, and normalizing Unicode to NFC before dispatch. (#8593) Thanks @fr33d3m0n.
- Gateway/Send: return an actionable error when `send` targets internal-only `webchat`, guiding callers to use `chat.send` or a deliverable channel. (#15703) Thanks @rodrigouroz.
- Gateway/Agent: reject malformed `agent:`-prefixed session keys (for example, `agent:main`) in `agent` and `agent.identity.get` instead of silently resolving them to the default agent, preventing accidental cross-session routing. (#15707) Thanks @rodrigouroz.
- Gateway/Security: redact sensitive session/path details from `status` responses for non-admin clients; full details remain available to `operator.admin`. (#8590) Thanks @fr33d3m0n.
- Web Fetch/Security: cap downloaded response body size before HTML parsing to prevent memory exhaustion from oversized or deeply nested pages. Thanks @xuemian168.
- Agents: return an explicit timeout error reply when an embedded run times out before producing any payloads, preventing silent dropped turns during slow cache-refresh transitions. (#16659) Thanks @liaosvcaf and @vignesh07.
- Agents/OpenAI: force `store=true` for direct OpenAI Responses/Codex runs to preserve multi-turn server-side conversation state, while leaving proxy/non-OpenAI endpoints unchanged. (#16803) Thanks @mark9232 and @vignesh07.
- Agents/Context: apply configured model `contextWindow` overrides after provider discovery so `lookupContextTokens()` honors operator config values (including discovery-failure paths). (#17404) Thanks @michaelbship and @vignesh07.
- CLI/Build: make legacy daemon CLI compatibility shim generation tolerant of minimal tsdown daemon export sets, while preserving restart/register compatibility aliases and surfacing explicit errors for unavailable legacy daemon commands. Thanks @vignesh07.
- Telegram: replace inbound `<media:audio>` placeholder with successful preflight voice transcript in message body context, preventing placeholder-only prompt bodies for mention-gated voice messages. (#16789) Thanks @Limitless2023.
- Telegram: retry inbound media `getFile` calls (3 attempts with backoff) and gracefully fall back to placeholder-only processing when retries fail, preventing dropped voice/media messages on transient Telegram network errors. (#16154) Thanks @yinghaosang.
- Telegram: finalize streaming preview replies in place instead of sending a second final message, preventing duplicate Telegram assistant outputs at stream completion. (#17218) Thanks @obviyus.
- Cron: infer `payload.kind="agentTurn"` for model-only `cron.update` payload patches, so partial agent-turn updates do not fail validation when `kind` is omitted. (#15664) Thanks @rodrigouroz.
- Subagents: use child-run-based deterministic announce idempotency keys across direct and queued delivery paths (with legacy queued-item fallback) to prevent duplicate announce retries without collapsing distinct same-millisecond announces. (#17150) Thanks @widingmarcus-cyber.
- Discord: ensure role allowlist matching uses raw role IDs for message routing authorization. Thanks @xinhuagu.

## 2026.2.14

### Changes

- Telegram: add poll sending via `openclaw message poll` (duration seconds, silent delivery, anonymity controls). (#16209) Thanks @robbyczgw-cla.
- Slack/Discord: add `dmPolicy` + `allowFrom` config aliases for DM access control; legacy `dm.policy` + `dm.allowFrom` keys remain supported and `openclaw doctor --fix` can migrate them.
- Discord: allow exec approval prompts to target channels or both DM+channel via `channels.discord.execApprovals.target`. (#16051) Thanks @leonnardo.
- Sandbox: add `sandbox.browser.binds` to configure browser-container bind mounts separately from exec containers. (#16230) Thanks @seheepeak.
- Discord: add debug logging for message routing decisions to improve `--debug` tracing. (#16202) Thanks @jayleekr.
- Agents: add optional `messages.suppressToolErrors` config to hide non-mutating tool-failure warnings from user-facing chat while still surfacing mutating failures. (#16620) Thanks @vai-oro.

### Fixes

- CLI/Plugins: ensure `openclaw message send` exits after successful delivery across plugin-backed channels so one-shot sends do not hang. (#16491) Thanks @yinghaosang.
- CLI/Plugins: run registered plugin `gateway_stop` hooks before `openclaw message` exits (success and failure paths), so plugin-backed channels can clean up one-shot CLI resources. (#16580) Thanks @gumadeiras.
- WhatsApp: honor per-account `dmPolicy` overrides (account-level settings now take precedence over channel defaults for inbound DMs). (#10082) Thanks @mcaxtr.
- Telegram: when `channels.telegram.commands.native` is `false`, exclude plugin commands from `setMyCommands` menu registration while keeping plugin slash handlers callable. (#15132) Thanks @Glucksberg.
- LINE: return 200 OK for Developers Console "Verify" requests (`{"events":[]}`) without `X-Line-Signature`, while still requiring signatures for real deliveries. (#16582) Thanks @arosstale.
- Cron: deliver text-only output directly when `delivery.to` is set so cron recipients get full output instead of summaries. (#16360) Thanks @thewilloftheshadow.
- Cron/Slack: preserve agent identity (name and icon) when cron jobs deliver outbound messages. (#16242) Thanks @robbyczgw-cla.
- Media: accept `MEDIA:`-prefixed paths (lenient whitespace) when loading outbound media to prevent `ENOENT` for tool-returned local media paths. (#13107) Thanks @mcaxtr.
- Media understanding: treat binary `application/vnd.*`/zip/octet-stream attachments as non-text (while keeping vendor `+json`/`+xml` text-eligible) so Office/ZIP files are not inlined into prompt body text. (#16513) Thanks @rmramsey32.
- Agents: deliver tool result media (screenshots, images, audio) to channels regardless of verbose level. (#11735) Thanks @strelov1.
- Auto-reply/Block streaming: strip leading whitespace from streamed block replies so messages starting with blank lines no longer deliver visible leading empty lines. (#16422) Thanks @mcinteerj.
- Auto-reply/Queue: keep queued followups and overflow summaries when drain attempts fail, then retry delivery instead of dropping messages on transient errors. (#16771) Thanks @mmhzlrj.
- Agents/Image tool: allow workspace-local image paths by including the active workspace directory in local media allowlists, and trust sandbox-validated paths in image loaders to prevent false "not under an allowed directory" rejections. (#15541)
- Agents/Image tool: propagate the effective workspace root into tool wiring so workspace-local image paths are accepted by default when running without an explicit `workspaceDir`. (#16722)
- BlueBubbles: include sender identity in group chat envelopes and pass clean message text to the agent prompt, aligning with iMessage/Signal formatting. (#16210) Thanks @zerone0x.
- CLI: fix lazy core command registration so top-level maintenance commands (`doctor`, `dashboard`, `reset`, `uninstall`) resolve correctly instead of exposing a non-functional `maintenance` placeholder command.
- CLI/Dashboard: when `gateway.bind=lan`, generate localhost dashboard URLs to satisfy browser secure-context requirements while preserving non-LAN bind behavior. (#16434) Thanks @BinHPdev.
- TUI/Gateway: resolve local gateway target URL from `gateway.bind` mode (tailnet/lan) instead of hardcoded localhost so `openclaw tui` connects when gateway is non-loopback. (#16299) Thanks @cortexuvula.
- TUI: honor explicit `--session <key>` in `openclaw tui` even when `session.scope` is `global`, so named sessions no longer collapse into shared global history. (#16575) Thanks @cinqu.
- TUI: use available terminal width for session name display in searchable select lists. (#16238) Thanks @robbyczgw-cla.
- TUI: refactor searchable select list description layout and add regression coverage for ANSI-highlight width bounds.
- TUI: preserve in-flight streaming replies when a different run finalizes concurrently (avoid clearing active run or reloading history mid-stream). (#10704) Thanks @axschr73.
- TUI: keep pre-tool streamed text visible when later tool-boundary deltas temporarily omit earlier text blocks. (#6958) Thanks @KrisKind75.
- TUI: sanitize ANSI/control-heavy history text, redact binary-like lines, and split pathological long unbroken tokens before rendering to prevent startup crashes on binary attachment history. (#13007) Thanks @wilkinspoe.
- TUI: harden render-time sanitizer for narrow terminals by chunking moderately long unbroken tokens and adding fast-path sanitization guards to reduce overhead on normal text. (#5355) Thanks @tingxueren.
- TUI: render assistant body text in terminal default foreground (instead of fixed light ANSI color) so contrast remains readable on light themes such as Solarized Light. (#16750) Thanks @paymog.
- TUI/Hooks: pass explicit reset reason (`new` vs `reset`) through `sessions.reset` and emit internal command hooks for gateway-triggered resets so `/new` hook workflows fire in TUI/webchat.
- Gateway/Agent: route bare `/new` and `/reset` through `sessions.reset` before running the fresh-session greeting prompt, so reset commands clear the current session in-place instead of falling through to normal agent runs. (#16732) Thanks @kdotndot and @vignesh07.
- Cron: prevent `cron list`/`cron status` from silently skipping past-due recurring jobs by using maintenance recompute semantics. (#16156) Thanks @zerone0x.
- Cron: repair missing/corrupt `nextRunAtMs` for the updated job without globally recomputing unrelated due jobs during `cron update`. (#15750)
- Cron: treat persisted jobs with missing `enabled` as enabled by default across update/list/timer due-path checks, and add regression coverage for missing-`enabled` store records. (#15433) Thanks @eternauta1337.
- Cron: skip missed-job replay on startup for jobs interrupted mid-run (stale `runningAtMs` markers), preventing restart loops for self-restarting jobs such as update tasks. (#16694) Thanks @sbmilburn.
- Heartbeat/Cron: treat cron-tagged queued system events as cron reminders even on interval wakes, so isolated cron announce summaries no longer run under the default heartbeat prompt. (#14947) Thanks @archedark-ada and @vignesh07.
- Discord: prefer gateway guild id when logging inbound messages so cached-miss guilds do not appear as `guild=dm`. Thanks @thewilloftheshadow.
- Discord: treat empty per-guild `channels: {}` config maps as no channel allowlist (not deny-all), so `groupPolicy: "open"` guilds without explicit channel entries continue to receive messages. (#16714) Thanks @xqliu.
- Models/CLI: guard `models status` string trimming paths to prevent crashes from malformed non-string config values. (#16395) Thanks @BinHPdev.
- Gateway/Subagents: preserve queued announce items and summary state on delivery errors, retry failed announce drains, and avoid dropping unsent announcements on timeout/failure. (#16729) Thanks @Clawdette-Workspace.
- Gateway/Config: make `config.patch` merge object arrays by `id` (for example `agents.list`) instead of replacing the whole array, so partial agent updates do not silently delete unrelated agents. (#6766) Thanks @lightc
```

---

## 🔍 How to Use This Report

1. **Review Open PRs**: Check the open PRs table to see what's being worked on upstream
2. **Check Merged PRs**: See what features/fixes have been merged that you might want to pull
3. **Compare Versions**: Your fork is on version 2026.2.15, latest upstream is 2026.2.24
4. **Update Your Fork**: Consider pulling updates from upstream using:
   ```bash
   cd openclaw
   git remote add upstream https://github.com/openclaw/openclaw.git
   git fetch upstream
   git merge upstream/main
   ```

---

## ⚠️ Important Notes

- This report shows the first 1000 PRs from the upstream repository
- **635 PRs are currently open** - review these for potential contributions or features
- **Latest upstream version:** 2026.2.24 (released 2026-02-25)
- **Your current version:** 2026.2.15 (from package.json)
- **Version gap:** You are 9 versions behind upstream

---

**Report Generated:** 2026-02-25 07:19:37
**Generated by:** gh CLI automation script
