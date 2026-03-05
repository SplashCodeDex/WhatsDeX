# Specification: OpenClaw Channel-Specific Upstream Patching (Telegram, Discord, Anthropic)

## Overview
This track focuses on integrating critical upstream pull requests identified in the `OPENCLAW_UPSTREAM_REPORT.md` to improve the reliability and compatibility of the local OpenClaw engine within the WhatsDeX ecosystem.

## Functional Requirements

### 1. Telegram Proxy Fix (#26229)
- **Problem:** A global dispatcher implementation in the upstream Telegram adapter inadvertently breaks HTTP proxy support for outbound requests.
- **Improved Behavior:** Ensure the Telegram adapter correctly respects proxy settings (as defined in `openclaw.json` or environment variables) by isolating the dispatcher's impact on the global agent.

### 2. Anthropic Haiku Model Alias (#26214)
- **Problem:** Recent changes in the Anthropic API have deprecated some older Haiku model snapshots, leading to `404 Not Found` errors.
- **Improved Behavior:** Add explicit model aliases for `haiku` (mapping to the stable `claude-3-haiku-20240307` or equivalent) to ensure backward compatibility for existing Agents.

### 3. Discord Numeric Channel ID Resolution (#26164)
- **Problem:** In certain configurations, the Discord adapter fails to resolve numeric channel IDs correctly when they are provided as strings without a guild context.
- **Improved Behavior:** Harden the channel resolution logic to reliably handle both numeric string IDs and structured `guildId/channelId` formats.

## Acceptance Criteria
- [ ] Telegram adapter successfully connects and communicates through a configured HTTP proxy.
- [ ] Requests using the `haiku` model alias resolve to a valid, non-deprecated Anthropic model.
- [ ] Discord channel creation and messaging work correctly with raw numeric channel IDs.
- [ ] Unit tests for the modified channel adapters (Telegram, Discord) and the Anthropic provider verify the fixes.
- [ ] Existing regression tests for all three components pass without regressions.

## Out of Scope
- Upgrading the entire OpenClaw engine to a new major version.
- Adding new channel adapters (e.g., Feishu, Line) not already in use.
- Implementing UI changes in the WhatsDeX dashboard (this is an engine-level track).
