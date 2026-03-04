# Specification: Phase 2 - Nested Agentic Research

## Overview
Leverage the modernized OpenClaw v2026.2.27 engine to implement "Deep Research" capabilities. This allows the Mastermind to spawn multiple levels of specialized sub-agents (up to Depth 5) to perform autonomous web crawling, data synthesis, and fact-checking.

## Functional Requirements
- **Deep Nesting Support:** Update `FlowEngine` and `GeminiAI` to support agent spawning up to 5 levels deep.
- **Autonomous Audit System:** Implement a mandatory "Verification Phase" where a specialized sub-agent audits the primary research findings for accuracy and consistency before delivery.
- **Visual Progress (Dashboard):** Real-time "Thinking..." indicators for each active sub-agent in the session view.
- **Visual Trace UI:** A hierarchical tree view in the dashboard showing the spawning history of sub-agents for a given request.
- **Nesting Toggle:** Allow users to enable/disable "Deep Reasoning" per flow node to control speed vs. depth.

## Technical Seams
- **OpenClaw Integration:** Use `agents.defaults.subagents.maxSpawnDepth` from the 2026.2.27 engine.
- **Flow Engine Bridge:** Update `SkillNode` to support the `research` skill which triggers the nesting logic.

## Acceptance Criteria
- [ ] A user can trigger a "Research" node via WhatsApp/Telegram.
- [ ] The system successfully spawns multiple sub-agents (verified in logs/UI).
- [ ] A "Critique Agent" rejects and corrects at least one hallucinated or inconsistent finding during a test run.
- [ ] The final response is a synthesized report delivered through the primary channel.

## Out of Scope
- Implementing custom non-AI tools within the sub-agents (only existing OpenClaw tools are used).
- Real-time user intervention in the middle of a nesting chain (fully autonomous execution).
