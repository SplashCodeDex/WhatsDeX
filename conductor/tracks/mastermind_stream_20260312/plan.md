# Implementation Plan: Mastermind Event Stream (mastermind_stream_20260312)

## Phase 1: Backend WebSocket Infrastructure
- [ ] Task: Initialize Socket.io server in `backend/src/main.ts` with tenant-based room isolation
- [ ] Task: Create `MastermindStreamService` to encapsulate event emission logic
- [ ] Task: Write unit tests for `MastermindStreamService` verifying room scoping
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Backend WebSocket Infrastructure' (Protocol in workflow.md)

## Phase 2: Engine Integration (The Wiring)
- [ ] Task: Integrate `MastermindStreamService` into `GeminiAI.ts` to emit `reasoning:thought` and `agent:spawn`
- [ ] Task: Integrate into `DynamicToolRegistry` to emit `tool:invoke` and `tool:result`
- [ ] Task: Replace artificial delays in `ResearchSkill.ts` with active event emission
- [ ] Task: Write integration tests for a simulated research cycle trace
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Engine Integration' (Protocol in workflow.md)

## Phase 3: Frontend Real-time Integration
- [ ] Task: Implement `useMastermindStore` in Zustand to manage incoming reasoning events
- [ ] Task: Create a `SocketProvider` to manage the client-side connection lifecycle
- [ ] Task: Wire `SocketProvider` to the dashboard layout
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Frontend Real-time Integration' (Protocol in workflow.md)

## Phase 4: Visual Trace Components
- [ ] Task: Enhance `AgentCard` with a `LiveStatusBadge` component
- [ ] Task: Implement `RecursiveTraceView` using `@xyflow/react` (or similar) for hierarchical visualization
- [ ] Task: Add a "Trace" toggle to the Agents dashboard to show/hide the detailed reasoning tree
- [ ] Task: Final end-to-end verification of the live reasoning stream
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Visual Trace Components' (Protocol in workflow.md)
