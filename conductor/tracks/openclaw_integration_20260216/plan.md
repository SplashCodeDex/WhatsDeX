# Plan: WhatsDeX × OpenClaw Omnichannel Integration

## Phase 1: Foundation & OpenClaw Linkage [checkpoint: pending]
Setup the technical bridge between the WhatsDeX backend and the OpenClaw engine.

- [x] Task: Project - Initialize pnpm workspace linkage and verify dependencies
- [x] Task: Backend - Implement `OpenClawGateway` service singleton in WhatsDeX
- [x] Task: Backend - Create `ChannelAdapter` base class/interface following OpenClaw's registry pattern
- [x] Task: Conductor - User Manual Verification 'Phase 1: Foundation' (Protocol in workflow.md)

## Phase 2: WhatsApp Adapter (TDD)
Wrap existing Baileys logic to work through the OpenClaw registry.

- [ ] Task: Test - Write failing tests for `WhatsAppChannelAdapter` ensuring multi-tenant message routing
- [ ] Task: Implement - Refactor `multiTenantBotService.ts` to implement `WhatsAppChannelAdapter`
- [ ] Task: Test - Verify adapter handles Baileys events and routes them to Gemini Brain
- [ ] Task: Conductor - User Manual Verification 'Phase 2: WhatsApp Adapter' (Protocol in workflow.md)

## Phase 3: Omnichannel Hub & Data Schema
Prepare the UI and database for multiple platforms.

- [ ] Task: Database - Update Firestore schema for `tenants/{id}/bots` to support multi-channel metadata
- [ ] Task: Frontend - Design and implement the `OmnichannelHub` shell (UI components)
- [ ] Task: Frontend - Implement channel connection forms for Telegram and Discord
- [ ] Task: Backend - Create API endpoints for managing channel credentials and statuses
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Omnichannel Hub' (Protocol in workflow.md)

## Phase 4: Multi-Channel Expansion
Activate Telegram and Discord via OpenClaw bridges.

- [ ] Task: Test - Write unit tests for `TelegramChannelBridge` integration
- [ ] Task: Implement - Wire OpenClaw Telegram bridge to WhatsDeX Gemini Brain
- [ ] Task: Test - Write unit tests for `DiscordChannelBridge` integration
- [ ] Task: Implement - Wire OpenClaw Discord bridge to WhatsDeX Gemini Brain
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Multi-Channel Expansion' (Protocol in workflow.md)

## Phase 5: Skills Platform & Tier Integration
Integrate the Skills system with Stripe gating and Admin controls.

- [ ] Task: Backend - Implement `SkillsManager` service to wrap OpenClaw skills
- [ ] Task: Backend - Integrate `SkillsManager` with `billingController.ts` for tier-based gating
- [ ] Task: Frontend - Build the "Skills Store" UI for tenant self-service toggles
- [ ] Task: Backend - Implement Admin global kill-switch for skills
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Skills Platform' (Protocol in workflow.md)
