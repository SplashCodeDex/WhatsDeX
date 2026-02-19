# Plan: Unified AI Orchestration

## Phase 1: Common Message Interface
Define the universal language the AI and Adapters will use to communicate.

- [x] Task: Backend - Define `CommonMessage` and `CommonAttachment` interfaces in `types/omnichannel.ts` (85d0996)
- [x] Task: Backend - Update `ChannelAdapter` interface to support `sendCommon(message: CommonMessage)` (7c200c7)
- [x] Task: Backend - Implement platform-specific formatting in `WhatsappAdapter` (Text), `TelegramAdapter` (Markdown), and `DiscordAdapter` (Embeds) (b694b7b)
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Common Interface' (Protocol in workflow.md)

## Phase 2: Core AI Decoupling (TDD)
Refactor the GeminiAI service to be platform-agnostic.

- [x] Task: Test - Write failing tests for `GeminiAI` ensuring it can process messages from any channel (f6b0570)
- [x] Task: Implement - Refactor `geminiAI.ts` to remove Baileys-specific dependencies and return `CommonMessage` (f6b0570)
- [x] Task: Test - Verify AI maintains the correct personality and intent detection across different channel inputs (f6b0570)
- [ ] Task: Conductor - User Manual Verification 'Phase 2: AI Decoupling' (Protocol in workflow.md)

## Phase 3: Unified Tool Registry & Bridges
Create the technical bridge between WhatsDeX commands and OpenClaw skills.

- [x] Task: Backend - Implement `ToolRegistry` service to manage available tools for the AI (b8d7a73)
- [x] Task: Backend - Create `WhatsDeXToolBridge` to wrap selected commands (Sticker, Downloader) as AI tools (b8d7a73)
- [x] Task: Backend - Create `OpenClawSkillBridge` to register OpenClaw skills into the registry (b8d7a73)
- [x] Task: Backend - Wire the `ToolRegistry` into Gemini's function-calling loop (b8d7a73)
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Tool Registry' (Protocol in workflow.md)

## Phase 4: Scoped Memory & Session Pruning
Ensure private and optimized conversation history for every channel.

- [x] Task: Backend - Update `memoryService.ts` to scope context by `(channelId + chatID)` (cce32ef)
- [x] Task: Backend - Integrate OpenClaw's session pruning logic to manage context window limits (cce32ef)
- [x] Task: Test - Write integration tests verifying that WhatsApp context doesn't leak into Telegram sessions (cce32ef)
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Scoped Memory' (Protocol in workflow.md)
