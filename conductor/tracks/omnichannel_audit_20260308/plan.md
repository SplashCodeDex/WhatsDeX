# Implementation Plan: Omnichannel Wiring & Surfacing

## Phase 1: Hierarchy & Configuration Alignment [checkpoint: 3bd7a02]
- [x] **Unified Config Paths**: Update `TenantConfigService.ts` to support the `agents/A/channels/C` path for all omnichannel settings. [250b6e2]
- [x] **Dynamic Tool Bridging**: Refactor `DeXMartToolBridge` to dynamically load OpenClaw tools based on channel configuration rather than a hardcoded list. [be23413]

## Phase 2: Connection Management Wiring
- [x] **Disconnect & Delete**: Add API endpoints and UI buttons to stop and remove channels. [8c4181e]
- [x] **Real-time QR Surfacing**: Implement a `useChannelStatus` hook in the frontend to poll `/status` and `/qr` for active pairing. [8c4181e]
- [x] **WhatsApp Pairing Code**: Update `ChannelConnectionForm` to allow choosing between QR and Pairing Code for WhatsApp. [8c4181e]

## Phase 3: AI Context Decoupling
- [ ] **Platform-Agnostic Context**: Update `createBotContext.ts` to handle `CommonMessage` instead of just Baileys `proto`.
- [ ] **Ingress Standardization**: Migrate all remaining logic in `IngressService.ts` to `handleCommonMessage`.

## Phase 4: Frontend Surface Enhancement
- [ ] **Channel Settings Dialog**: Create a settings modal accessible from "Manage connection" to configure AI Personality and other channel-specific flags.
- [ ] **Agent Assignment UI**: Allow moving a channel from one Agent to another in the settings.
