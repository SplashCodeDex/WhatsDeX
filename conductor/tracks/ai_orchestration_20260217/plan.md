# Plan: Unified AI Orchestration

## Phase 1: Common Message Interface
Define the universal language the AI and Adapters will use to communicate.

- [x] Task: Backend - Define `CommonMessage` and `CommonAttachment` interfaces in `types/omnichannel.ts` (85d0996)
- [ ] Task: Backend - Update `ChannelAdapter` interface to support `sendCommon(message: CommonMessage)`
- [ ] Task: Backend - Implement platform-specific formatting in `WhatsappAdapter` (Text), `TelegramAdapter` (Markdown), and `DiscordAdapter` (Embeds)
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Common Interface' (Protocol in workflow.md)

## Phase 2: Core AI Decoupling (TDD)
Refactor the GeminiAI service to be platform-agnostic.

- [ ] Task: Test - Write failing tests for `GeminiAI` ensuring it can process messages from any channel
- [ ] Task: Implement - Refactor `geminiAI.ts` to remove Baileys-specific dependencies and return `CommonMessage`
- [ ] Task: Test - Verify AI maintains the correct personality and intent detection across different channel inputs
- [ ] Task: Conductor - User Manual Verification 'Phase 2: AI Decoupling' (Protocol in workflow.md)

## Phase 3: Unified Tool Registry & Bridges
Create the technical bridge between WhatsDeX commands and OpenClaw skills.

- [ ] Task: Backend - Implement `ToolRegistry` service to manage available tools for the AI
- [ ] Task: Backend - Create `WhatsDeXToolBridge` to wrap selected commands (Sticker, Downloader) as AI tools
- [ ] Task: Backend - Create `OpenClawSkillBridge` to register OpenClaw skills into the registry
- [ ] Task: Backend - Wire the `ToolRegistry` into Gemini's function-calling loop
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Tool Registry' (Protocol in workflow.md)

## Phase 4: Scoped Memory & Session Pruning
Ensure private and optimized conversation history for every channel.

- [ ] Task: Backend - Update `memoryService.ts` to scope context by `(channelId + chatID)`
- [ ] Task: Backend - Integrate OpenClaw's session pruning logic to manage context window limits
- [ ] Task: Test - Write integration tests verifying that WhatsApp context doesn't leak into Telegram sessions
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Scoped Memory' (Protocol in workflow.md)
