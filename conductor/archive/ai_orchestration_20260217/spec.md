# Specification: Unified AI Orchestration

## 1. Overview
This track transforms the WhatsDeX GeminiAI service into a platform-agnostic "Mastermind." It enables the AI brain to communicate across all channels (WhatsApp, Telegram, Discord) using a standardized message format and provides a unified tool registry that merges legacy WhatsDeX commands with the OpenClaw skills platform.

## 2. Functional Requirements

### 2.1 Standardized AI Outputs
- **Common Message Model:** The AI will return platform-neutral objects (text, media, tool_call) rather than raw Baileys objects.
- **Adapter-Led Formatting:** Each `ChannelAdapter` will be responsible for converting this common model into its native platform format (e.g., Markdown for Telegram, Discord Embeds).

### 2.2 Unified Tool Registry
- **WhatsDeX Tool Bridge:** Automatically wrap high-value WhatsDeX commands (downloader, sticker, maker) into Gemini Function Declarations.
- **OpenClaw Skill Bridge:** Import and register OpenClaw's 51+ skills as available tools for the Gemini model.
- **Dynamic Selection:** The AI will autonomously decide whether to use a WhatsDeX utility or an OpenClaw skill based on the user's intent.

### 2.3 Scoped Memory
- **Channel Isolation:** maintain separate conversation context/memory for every unique (Channel + ChatID) pair to ensure privacy and technical simplicity.
- **Session Pruning:** Absorb OpenClaw's session management to optimize context windows and token costs per channel.

## 3. Technical Requirements
- **Core Refactor:** Decouple `backend/src/services/geminiAI.ts` from Baileys-specific types.
- **Interface Alignment:** Ensure the `ToolBridge` maps WhatsDeX's `MessageContext` to OpenClaw's execution environment.
- **Provider Support:** Maintain compatibility with the existing `ApiKeyManager` for rotation and failover.

## 4. Acceptance Criteria
- [ ] A user on Telegram can ask to "make a sticker" and the WhatsDeX sticker command is triggered and delivered to Telegram.
- [ ] A user on WhatsApp can ask for a "web search" and the OpenClaw skill is executed, with the result delivered to WhatsApp.
- [ ] AI responses correctly use Markdown on Telegram/Discord and plain text on WhatsApp.
- [ ] Conversation history on Telegram does not bleed into the same user's WhatsApp conversation.

## 5. Out of Scope
- Cross-channel user identity (merging a user's Telegram and WhatsApp profiles into one).
- Rewriting all 175 WhatsDeX commands (we will focus on bridging the most important categories).
