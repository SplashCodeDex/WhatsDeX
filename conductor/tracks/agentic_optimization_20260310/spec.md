# Specification: Agentic Performance & Intelligence Optimization (Phase 5)

## Objective
Elevate the DeXMart Mastermind engine from reactive processing to **proactive, reasoning-native orchestration**. This track focuses on reducing latency, lowering token costs via semantic efficiency, and implementing high-precision retrieval inspired by the PageIndex framework, while surfacing the powerful OpenClaw Chat UI directly within DeXMart.

## Scope

### 1. Reasoning-Native Context Retrieval (PageIndex Integration)
- **Hierarchical Indexing**: Implement logic to transform long tenant documents and multi-session conversation histories into a semantic tree structure (ToC-style).
- **Tree-Search Retrieval**: Refactor the AI's memory search tool to perform recursive reasoning over the tree index rather than flat vector similarity.
- **Traceability**: Surfacing the "reasoning path" in the frontend activity feed, showing which "branches" of the document tree the agent navigated.

### 2. Semantic Caching & Memoization
- **Intent Caching**: Store results of expensive intent detection and tool-selection phases for semantically similar queries.
- **Result Persistence**: Use Redis to cache common tool outputs (e.g., weather, translations) with TTLs to prevent redundant API usage.

### 3. Predictive Tool Prefetching
- **Next-Step Prediction**: Based on the current conversation state, predict the next 2-3 likely tools required and pre-initialize their configuration.
- **Asynchronous Spawning**: Optimize the "Researcher -> Auditor" cycle by allowing sub-agents to start background verification tasks before the primary researcher has fully finished.

### 4. Advanced "Thought" Visualization (OpenClaw Integration)
- **Reasoning UI**: Create a dedicated "Mastermind Trace" view in DeXMart.
- **OpenClaw Chat Surfacing**: Integrate the **OpenClaw Chat tab** directly into DeXMart via an intelligent proxy/iframe layer, allowing users to see the raw, low-level reasoning and tool execution stream.
- **Visual Drill-down**: Real-time visualization of the "Tree Search" process, showing how the agent drills down from high-level summaries to specific data points.

## Deliverables
- `TreeIndexService.ts` for hierarchical document indexing.
- `SemanticCacheService.ts` for intent and result memoization.
- `OpenClawChatFrame.tsx` React component in DeXMart frontend.
- Updated `ActivityFeed` with "View Trace" capabilities.
