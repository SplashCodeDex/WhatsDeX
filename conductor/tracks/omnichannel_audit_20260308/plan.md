# Implementation Plan: Omnichannel Wiring & Surfacing

## Phase 1: Hierarchy & Configuration Alignment
- [ ] **Unified Config Paths**: Update `TenantConfigService.ts` to support the `agents/A/channels/C` path for all omnichannel settings.
- [ ] **Dynamic Tool Bridging**: Refactor `WhatsDeXToolBridge` to dynamically load OpenClaw tools based on channel configuration rather than a hardcoded list.

## Phase 2: Connection Management Wiring
- [ ] **Disconnect & Delete**: Add API endpoints and UI buttons to stop and remove channels.
- [ ] **Real-time QR Surfacing**: Implement a `useChannelStatus` hook in the frontend to poll `/status` and `/qr` for active pairing.
- [ ] **WhatsApp Pairing Code**: Update `ChannelConnectionForm` to allow choosing between QR and Pairing Code for WhatsApp.

## Phase 3: AI Context Decoupling
- [ ] **Platform-Agnostic Context**: Update `createBotContext.ts` to handle `CommonMessage` instead of just Baileys `proto`.
- [ ] **Ingress Standardization**: Migrate all remaining logic in `IngressService.ts` to `handleCommonMessage`.

## Phase 4: Frontend Surface Enhancement
- [ ] **Channel Settings Dialog**: Create a settings modal accessible from "Manage connection" to configure AI Personality and other channel-specific flags.
- [ ] **Agent Assignment UI**: Allow moving a channel from one Agent to another in the settings.
