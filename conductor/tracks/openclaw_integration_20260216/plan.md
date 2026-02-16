# Plan: WhatsDeX × OpenClaw Omnichannel Integration

## Phase 1: Foundation & OpenClaw Linkage [checkpoint: a18cfa2]
Setup the technical bridge between the WhatsDeX backend and the OpenClaw engine.

- [x] Task: Project - Initialize pnpm workspace linkage and verify dependencies a18cfa2
- [x] Task: Backend - Implement `OpenClawGateway` service singleton in WhatsDeX a18cfa2
- [x] Task: Backend - Create `ChannelAdapter` base class/interface following OpenClaw's registry pattern a18cfa2
- [x] Task: Conductor - User Manual Verification 'Phase 1: Foundation' (Protocol in workflow.md) a18cfa2

## Phase 2: WhatsApp Adapter (TDD) [checkpoint: 39df767]
Wrap existing Baileys logic to work through the OpenClaw registry.

- [x] Task: Test - Write failing tests for `WhatsAppChannelAdapter` ensuring multi-tenant message routing 39df767
- [x] Task: Implement - Refactor `multiTenantBotService.ts` to implement `WhatsAppChannelAdapter` 39df767
- [x] Task: Test - Verify adapter handles Baileys events and routes them to Gemini Brain 39df767
- [x] Task: Conductor - User Manual Verification 'Phase 2: WhatsApp Adapter' (Protocol in workflow.md) 39df767

## Phase 3: Omnichannel Hub & Data Schema [checkpoint: 06c681c]
Prepare the UI and database for multiple platforms.

- [x] Task: Database - Update Firestore schema for `tenants/{id}/bots` to support multi-channel metadata 06c681c
- [x] Task: Frontend - Design and implement the `OmnichannelHub` shell (UI components) 06c681c
- [x] Task: Frontend - Implement channel connection forms for Telegram and Discord 06c681c
- [x] Task: Backend - Create API endpoints for managing channel credentials and statuses 06c681c
- [x] Task: Conductor - User Manual Verification 'Phase 3: Omnichannel Hub' (Protocol in workflow.md) 06c681c

## Phase 4: Multi-Channel Expansion [checkpoint: pending]
Activate Telegram and Discord via OpenClaw bridges.

- [x] Task: Test - Write unit tests for `TelegramChannelBridge` integration
- [x] Task: Implement - Wire OpenClaw Telegram bridge to WhatsDeX Gemini Brain
- [x] Task: Test - Write unit tests for `DiscordChannelBridge` integration
- [x] Task: Implement - Wire OpenClaw Discord bridge to WhatsDeX Gemini Brain
- [~] Task: Conductor - User Manual Verification 'Phase 4: Multi-Channel Expansion' (Protocol in workflow.md)

## Phase 5: Skills Platform & Tier Integration
Integrate the Skills system with Stripe gating and Admin controls.

- [ ] Task: Backend - Implement `SkillsManager` service to wrap OpenClaw skills
- [ ] Task: Backend - Integrate `SkillsManager` with `billingController.ts` for tier-based gating
- [ ] Task: Frontend - Build the "Skills Store" UI for tenant self-service toggles
- [ ] Task: Backend - Implement Admin global kill-switch for skills
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Skills Platform' (Protocol in workflow.md)
