# Implementation Plan: Agentic Performance & Intelligence Optimization

## Phase 1: Reasoning-Native Retrieval (PageIndex)
- [ ] **Tree Index Engine**: Implement `TreeIndexService.ts` to convert long text/history into hierarchical JSON tree structures.
- [ ] **Recursive Tree Search**: Refactor `memoryService.ts` to implement a recursive retrieval algorithm that navigates the tree index based on LLM reasoning.
- [ ] **Path Logging**: Update `geminiAI.ts` to record the "Navigated Branches" during retrieval for traceability.

## Phase 2: Semantic Caching & Prefetching
- [ ] **Redis Semantic Cache**: Implement `SemanticCacheService.ts` to cache intent detection and common tool results.
- [ ] **Predictive Prefetching**: Implement logic to pre-initialize the next most likely tools in the "Researcher" pipeline.
- [ ] **Async Auditor Spawning**: Refactor the research cycle to allow auditors to start verification as soon as partial results are available.

## Phase 3: OpenClaw Chat Integration
- [ ] **Proxy Route**: Add a backend route in DeXMart to proxy the OpenClaw Dashboard UI (port 18789) to handle CORS/Auth.
- [ ] **OpenClawChatFrame Component**: Create a React component that iframes the OpenClaw Chat tab with optimized styling for DeXMart.
- [ ] **Reasoning Page**: Create `/dashboard/omnichannel/reasoning` page in the frontend to house the visualization.

## Phase 4: Activity Feed Enhancement
- [ ] **"View Trace" Action**: Add a button to `ActivityFeed` entries that opens the Reasoning Page filtered to that specific message's run ID.
- [ ] **Tree Visualization**: Implement a recursive tree component to show the "Navigated Branches" logged in Phase 1.
