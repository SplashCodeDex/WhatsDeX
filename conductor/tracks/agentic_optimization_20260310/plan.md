# Implementation Plan: Agentic Performance & Intelligence Optimization

## Phase 1: Reasoning-Native Retrieval (PageIndex)
- [x] **Tree Index Engine**: Implement `TreeIndexService.ts` to convert long text/history into hierarchical JSON tree structures.
- [x] **Recursive Tree Search**: Refactor `memoryService.ts` to implement a recursive retrieval algorithm that navigates the tree index based on LLM reasoning.
- [x] **Path Logging**: Update `geminiAI.ts` to record the "Navigated Branches" during retrieval for traceability.

## Phase 2: Semantic Caching & Prefetching
- [x] **Redis Semantic Cache**: Implement `SemanticCacheService.ts` to cache intent detection and common tool results.
- [x] **Predictive Prefetching**: Implement logic to pre-initialize the next most likely tools in the "Researcher" pipeline.
- [x] **Async Auditor Spawning**: Refactor the research cycle to allow auditors to start verification as soon as partial results are available.

## Phase 3: OpenClaw Chat Integration
- [x] **Proxy Route**: Add a backend route in DeXMart to proxy the OpenClaw Dashboard UI (port 18789) to handle CORS/Auth.
- [x] **OpenClawChatFrame Component**: Create a React component that iframes the OpenClaw Chat tab with optimized styling for DeXMart.
- [x] **Reasoning Page**: Create `/dashboard/omnichannel/reasoning` page in the frontend to house the visualization.

## Phase 4: Activity Feed Enhancement
- [x] **"View Trace" Action**: Add a button to `ActivityFeed` entries that opens the Reasoning Page filtered to that specific message's run ID.
- [x] **Tree Visualization**: Implement a recursive tree component to show the "Navigated Branches" logged in Phase 1.
