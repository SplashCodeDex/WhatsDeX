# Audit Report: Agents Page (agents_audit_20260312)

## 1. Overview
This report documents all placeholders, simulations, "dummies," and hardcodings identified during the full-stack audit of the Agents page. The audit follows the mandates of `@.gemini/GEMINI.md` for fact-based investigation.

## 2. Frontend Findings (`frontend/src/`)
| File Path | Line(s) | Type | Description | Rationale |
|-----------|---------|------|-------------|-----------|
| `frontend/src/features/agents/components/AgentsDashboard.tsx` | 355, 435 | Placeholder UI | "Omnichannel Matrix" and "Agent Knowledge Matrix (RAG)" | These sections are visual placeholders with static text and no active backend integration for file/index management. |
| `frontend/src/features/agents/components/AgentsDashboard.tsx` | 145-155 | Hardcoded Model | Agent model names (GPT-4o, etc.) are hardcoded in the Template selector. | Should be dynamic based on backend capabilities/config. |
| `frontend/src/stores/useOmnichannelStore.ts` | 511 | Simulation | `getSkillCount` returns hardcoded `51` fallback. | Explicitly labeled as "Design default" instead of relying on live data. |
| `frontend/src/stores/useOmnichannelStore.ts` | 135 | Simulation | `fetchChannels` defaults to `system_default`. | Hardcoded ID usage for initial data fetching. |
| `frontend/src/features/agents/data/templates.ts` | 6-40 | Hardcoded Data | Initial set of Agent Templates (Sales Pro, Support Hero, etc.) | Static templates that are not synced with any backend template engine. |
| `frontend/src/features/agents/utils/ChannelSlotGuard.ts` | 3-7 | Hardcoded Limits | `SLOT_LIMITS` for billing tiers. | These limits should be fetched from a centralized billing/config service to allow for dynamic changes. |
| `frontend/src/features/agents/utils/SkillGating.ts` | 6-31 | Hardcoded Logic | `TIER_SKILLS` mapping. | Manually defines allowed skills per tier, which can drift from actual backend skill availability and permissions. |
| `frontend/src/features/agents/hooks/useCreateAgent.ts` | 17-21 | Hardcoded Limits | `TIER_LIMITS` for agent creation. | Duplicate logic to `UsageGuard.ts` in the backend; creates a maintenance burden and potential drift. |

## 3. Backend Findings (`backend/src/`)
| File Path | Line(s) | Type | Description | Rationale |
|-----------|---------|------|-------------|-----------|
| `backend/src/services/geminiAI.ts` | 115, 150 | Simulation | Artificial delays (`perceptionDelay`, `thinkingJitter`) | Simulates cognitive processes using `DeliberationService` instead of raw execution. |
| `backend/src/services/geminiAI.ts` | 415 | Placeholder Logic | `executeGenericResponse` has a stub for "Multiple actions". | Message: "Multiple actions execution is currently optimized for WhatsApp. Standby for omnichannel roll-out." |
| `backend/src/services/geminiAI.ts` | 515 | Placeholder Logic | `executeSingleActionGeneric` returns a placeholder string. | "Action execution is being wired in Phase 3." |
| `backend/src/services/researchSkill.ts` | 45-100 | Simulation | Fixed 3-agent spawn cycle (Researcher -> Critique -> Synthesis). | A fixed orchestration loop that simulates "deep research" through sequential `sessions_spawn` calls. |
| `backend/src/services/OpenClawSkillBridge.ts` | 45 | Hardcoded Config | `plugins: { enabled: false }` | Disables heavy plugin discovery to prevent port 3001 hangs, sacrificing capability for stability. |
| `backend/src/services/OpenClawSkillBridge.ts` | 80 | Simulation | Prompt-based skills return a static string. | "Skill ${entry.skill.name} executed with args: ${JSON.stringify(args)}" |
| `backend/src/services/AgentService.ts` | 17-25 | Hardcoded Data | `system_default` agent initialization. | Hardcoded "Personality" and default settings for the system agent. |

## 4. Agentic Logic & Tool Registry Findings
| File Path | Line(s) | Type | Description | Rationale |
|-----------|---------|------|-------------|-----------|
| `backend/src/services/geminiAI.ts` | 950-955 | Stubbed Helpers | `planWorkflow`, `selectResponseStrategy`, etc. | These return empty arrays or default strings, indicating the complex decision-making logic is not yet implemented. |
| `backend/src/services/toolRegistry.ts` | 65-75 | Logic Gap | Tool persistence for chaining. | While it attempts to store results, the "chaining" logic (using previous results as input for next tools) is not fully realized in the brain's planning phase. |

## 5. Compliance Verification (`@.gemini/GEMINI.md`)
- [x] No assumptions made.
- [x] Facts empirically verified (via code read).
- [x] Professional diagnostic terminology used.

## 6. Synthesis & Enhancement Roadmap (The Power-Up)
The "Agents" experience is currently a high-fidelity simulation. To achieve true robustness and power, the following enhancements are required:

### 6.1 Real-time Status & Feedback (WebSockets)
- **Problem:** Current status updates are "emitted" in fixed loops or rely on Zustand state polling.
- **Solution:** Implement a **Mastermind Event Stream** using WebSockets (Socket.io or native WS).
- **Impact:** Live, granular feedback of AI thought processes (e.g., "Agent X is crawling site Y", "Agent Y is synthesizing findings") without artificial delays.

### 6.2 Unified Dynamic Gating
- **Problem:** Redundant hardcoded limits in Frontend (`TIER_SKILLS`, `SLOT_LIMITS`) and Backend (`UsageGuard`).
- **Solution:** Consolidate all limits into a single `CapabilityService` in the backend. Frontend should fetch these capabilities on mount.
- **Impact:** Zero-drift policy enforcement and easier plan management.

### 6.3 True Agentic Autonomy (The Brain)
- **Problem:** `planWorkflow` and "Multiple Actions" are stubbed or WhatsApp-only.
- **Solution:** 
    - Wire `planWorkflow` to a recursive reasoning loop that uses the `DynamicToolRegistry`.
    - Implement a "Mastermind Supervisor" that can orchestrate arbitrary sub-agents based on task complexity (replacing the fixed 3-agent research loop).
- **Impact:** Omnichannel multi-action execution and truly adaptive research.

### 6.4 Knowledge Matrix (RAG Core)
- **Problem:** The "Knowledge Matrix" is a UI shell.
- **Solution:** Integrate **OpenClaw's Vector Store** (or a custom Pinecone/Chroma integration) into the `AgentService`.
- **Impact:** Agents can actually "read" and "remember" tenant-specific files and documentation.

### 6.5 Skill Integration (Deep Wiring)
- **Problem:** Many bridged skills return static strings.
- **Solution:** Map `openclaw` prompt-based skills to active `Skill` executors that can invoke shell, API, or web-crawler tools directly.
- **Impact:** The "Intelligence Store" becomes a library of executable power-ups rather than a catalog of metadata.
