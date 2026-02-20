# Specification: Unified Agent Intelligence & Omnichannel Chat

## Overview
This track implements a consolidated "Super-Agent" model that merges legacy "Bots" logic (WhatsApp pairing/instances) into the sophisticated "Agents" orchestration system. It establishes a "Brain + Phone" architecture where AI personas (Agents) are created as independent intelligences that can be dynamically deployed across one or more communication channels (WhatsApp, Telegram, etc.) based on user preference and billing tier.

## Functional Requirements

### 1. Unified Agent Creation (The "Brain")
- **Template-Based Onboarding:** Users create agents starting from pre-defined templates (e.g., Sales Pro, Support Hero, Personal Assistant).
- **Persona Configuration:** Each Agent has a name, emoji avatar, system prompt, and selected LLM model (Gemini/OpenAI/Anthropic).
- **Skill Management:** Agents can be assigned specific "Skills" (OpenClaw tools like Web Search, File Analysis) based on the user's billing tier.

### 2. Dynamic Channel Deployment (The "Phone")
- **Channel Independence:** Channel instances (WhatsApp QR sessions, Telegram Bot tokens) are managed as "Connectivity Slots".
- **Dynamic Linking:** A user can "attach" a Brain (Agent) to any active Channel Slot. 
- **Omnichannel Support:** A single Agent Brain can be optionally attached to multiple channels simultaneously (e.g., the same agent handles both WhatsApp and Telegram).
- **Lifecycle Management:** Users can "swap" agents on a channel or restart channel sessions without losing the agent's configuration.

### 3. Omnichannel Messages & Chat
- **Unified Inbox:** A single interface for viewing and replying to messages across all connected channels.
- **Agent Interventions:** Users can manually intervene in an agent's conversation.
- **Real-time Streaming:** Live activity stream showing the agent's "thinking" process (OpenClaw tool execution) during chat.

### 4. Billing & Tier Enforcement
- **Agent Limits:** Starter (1 Agent), Pro (5 Agents), Enterprise (Unlimited).
- **Channel Limits:** Enforce limits on the number of active WhatsApp/Telegram connections.
- **Skill Gating:** Advanced skills (e.g., Web Search) are restricted to Pro and Enterprise tiers.
- **Broadcast/Auto-Post Caps:** Monthly limits on automated group posts or broadcast campaigns.

## Non-Functional Requirements
- **Performance:** Message latency should remain low despite the orchestration layer.
- **Security:** Strict multi-tenancy; an agent in Workspace A must never access data from Workspace B.
- **Resilience:** If a channel disconnects (e.g., WhatsApp phone goes offline), the Agent "Brain" and its context remain preserved.

## Acceptance Criteria
- Users can create an agent from a template and see it in the "Agents" list.
- Users can link a WhatsApp account via QR code within the Agent's "Connectivity" settings.
- Messages sent to the linked WhatsApp are processed by the assigned Agent using its specific persona and tools.
- The "Messages" page correctly displays conversations from both WhatsApp and Telegram with channel-specific icons.
- Billing limits are enforced (e.g., trying to create a 2nd agent on a Starter plan triggers an upgrade prompt).

## Out of Scope
- Voice/Audio calls (Initial focus is text/media messaging).
- Native mobile apps (Focus is the web dashboard).
