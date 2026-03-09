# Specification: DeXMart \u00d7 OpenClaw Omnichannel Integration

## 1. Overview
This track involves the architectural fusion of DeXMart and OpenClaw. DeXMart will remain the "Boss" (Frontend, Multi-tenancy, Gemini Brain, Branding), while OpenClaw will serve as the "Engine" (Channel Registry, Telegram/Discord/Slack bridges, Skills Platform). The goal is to provide users with a unified dashboard to manage bots across multiple messaging platforms.

## 2. Functional Requirements

### 2.1 Core Integration
- **Unified Gateway:** Implement a shared OpenClaw Gateway within the DeXMart backend that maps tenant-specific bots to isolated OpenClaw sessions.
- **WhatsApp Adapter:** Create a `ChannelAdapter` for the existing DeXMart Baileys/WhatsApp implementation to make it compatible with the OpenClaw channel registry without losing existing anti-ban logic.
- **Channel Expansion:** Enable Telegram, Discord, and Slack channels by wiring OpenClaw's bridges into the DeXMart message flow.

### 2.2 User Experience (Dashboard)
- **Omnichannel Hub:** A new dedicated dashboard section to manage all channel connections (API keys, webhooks, QR codes) in a single, high-fidelity UI.
- **Bot Orchestration:** Ensure that messages from any connected channel flow through the DeXMart GeminiAI brain for intent detection and response generation.

### 2.3 Skills Platform
- **Plugin Integration:** Absorb OpenClaw's 51+ skills.
- **Triple-Layer Control:**
  - **Admin:** Global kill-switch and availability management.
  - **Billing:** Gating specific high-value skills (e.g., Web Search) behind Stripe subscription tiers.
  - **Tenant:** User-level toggles to enable/disable specific skills for their bots.

## 3. Technical Requirements
- **Environment:** Maintain the pnpm workspace with DeXMart and OpenClaw as linked repositories.
- **Architecture:** Use the Service-Oriented architecture in the backend to bridge `DeXMart/backend/src/services` with `OpenClaw/src/`.
- **Data Model:** Update Firestore schemas to support multi-channel configurations per tenant.

## 4. Acceptance Criteria
- [ ] A message sent via Telegram is processed by the DeXMart Gemini Brain and a response is delivered back to Telegram.
- [ ] The existing WhatsApp/Baileys connection remains functional through the new Adapter.
- [ ] The Omnichannel Hub displays status and configuration for at least three platforms (WhatsApp, Telegram, Discord).
- [ ] A "Premium" skill is inaccessible to a "Free" tier tenant.
- [ ] Admin can globally disable a skill, removing it from all tenant views.

## 5. Out of Scope
- Migrating DeXMart's Firestore to OpenClaw's SQLite-vec (keeping Firestore as the primary source of truth).
- Modifying OpenClaw's internal core logic (focus is on consumption and wrapping).
