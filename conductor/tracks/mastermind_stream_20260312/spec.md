# Specification: Mastermind Event Stream (mastermind_stream_20260312)

## 1. Overview
This track implements a real-time reasoning stream for DeXMart Agents using Socket.io. The goal is to replace artificial delays and simulated "thinking" states with authentic, live transparency. Users will see granular details of the AI's internal processes, including tool invocations, research stages, and sub-agent spawning.

## 2. Scope
### 2.1 Backend Implementation (`backend/src/`)
- **WebSocket Gateway:** Initialize a Socket.io server (already in dependencies).
- **Mastermind Event Emitter:** Create a service to emit reasoning events from `GeminiAI.ts`, `ResearchSkill.ts`, and the `DynamicToolRegistry`.
- **Event Types:**
    - `reasoning:start`: Triggered when an agent begins processing a request.
    - `reasoning:thought`: Emits internal "AI thoughts" or plan updates.
    - `tool:invoke`: Emits when a tool is about to be called (with name and params).
    - `tool:result`: Emits the output of a tool execution.
    - `agent:spawn`: Emits when a sub-agent is initialized.
    - `reasoning:complete`: Final state after synthesis.

### 2.2 Frontend Implementation (`frontend/src/`)
- **Socket Client:** Integrate `socket.io-client` into the Agents dashboard.
- **Live Status Badges:** Update agent cards in real-time with the current reasoning stage.
- **Recursive Trace View:** A dedicated UI component (likely a slide-over or modal) showing a hierarchical tree of the current multi-agent reasoning trace.
- **Zustand Integration:** Wire the socket events into a new `useMastermindStore` for global availability.

## 3. Acceptance Criteria
- [ ] Backend successfully emits typed Socket.io events during a research cycle.
- [ ] Frontend displays live status updates next to the active agent.
- [ ] The "Recursive Trace" correctly visualizes parent -> child agent relationships during complex tasks.
- [ ] No performance regression (socket connections are efficient and tenant-scoped).

## 4. Non-Functional Requirements
- **Tenant Isolation:** WebSocket rooms must be scoped to the `tenantId` to prevent cross-tenant data leakage.
- **Fact-Based:** The stream must reflect *actual* engine events, not simulated ones.
- **Low Latency:** Events should be delivered with <100ms overhead.

## 5. Out of Scope
- Persistent history of reasoning traces (Live session only).
- Manual intervention in the live reasoning stream (Read-only for now).
