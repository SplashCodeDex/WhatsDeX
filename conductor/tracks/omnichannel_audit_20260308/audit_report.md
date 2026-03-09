# Audit Report: Omnichannel Orphan Logic & Wiring Gaps

## 1. Connection Management Gaps

### Orphan Backend Logic
- **`ChannelService.stopChannel`**: Successfully implemented in backend but not wired to a "Disconnect" button in the `OmnichannelHubPage`.
- **`ChannelService.deleteChannel`**: Exists in backend but no UI component allows users to remove a channel slot.
- **Agent Assignment**: `ChannelService` supports assigning channels to specific agents (e.g., `tenants/T/agents/A/channels/C`), but the `ChannelConnectionForm` defaults all new channels to `system_default`. There is no UI to re-assign a channel to a different agent.

### Status Synchronization
- **Mem-State Truth**: `ChannelService.syncMemoryStatus` attempts to sync Firestore with live memory, but it's only called in `getAllChannelsAcrossAgents`. Individual status updates from `ChannelWatchdog` or `AuthSystem` events are not consistently pushed back to Firestore for all channel types.

## 2. Pairing & Authentication Gaps

### WhatsApp/Signal
- **Pairing Codes**: Backend supports `requestPairingCode`, but the `ChannelConnectionForm` for WhatsApp has zero fields, assuming QR only. Signal's adapter doesn't yet hook into a pairing flow in the UI.
- **QR Display**: The `OmnichannelHubPage` has a placeholder for `ChannelProgressStepper`, but it doesn't currently fetch or display the live QR code URL from the backend's `/qr` endpoint.

### Discord/Telegram/Slack
- **Initialization**: These channels require tokens at creation. While `ChannelConnectionForm` collects them, there's no way to *update* a token if it expires or is rotated without deleting and recreating the channel.

## 3. Configuration & Hierarchy Mismatches

### The "Bots" vs "Channels" Schism
- **`TenantConfigService`**: Hardcoded to look for configs in `tenants/{tenantId}/bots/{botId}`.
- **`ChannelService`**: Operates in `tenants/{tenantId}/agents/{agentId}/channels/{channelId}`.
- **Impact**: Any "Bot Config" (like AI personality, auto-reply settings) saved via the legacy system or `TenantConfigService` is **completely ignored** by the new Omnichannel adapters because the paths don't match.

### Missing Surfacing
- **AI Soul/Personality**: Backend `geminiAI.ts` looks for `channelDoc.config.aiPersonality`, but there is no "Settings" dialog for individual channels to set this.
- **OpenClaw Tools**: OpenClaw has a rich set of tools (YouTube DL, DALL-E, etc.), but `DeXMartToolBridge` only bridges a hardcoded list. There's no UI to enable/disable specific tools per channel.

## 4. Ingress & AI Wiring

### Baileys Dependency
- **`IngressService.handleMessage`**: Still expects `proto.IWebMessageInfo` (Baileys).
- **`createBotContext`**: Strictly tied to Baileys.
- **Result**: Even if a Telegram message is received, the AI context builder will likely fail or provide null values because it can't parse the raw Telegram object using Baileys utilities.

## 5. Frontend Surface Gaps

### Dashboard Cards
- **Manage connection**: The "Manage connection" button on channel cards is a ghost—it doesn't open any dialog or route.
- **Activity Feed**: The feed is global. There's no way to filter activity by a specific channel from the card itself.
