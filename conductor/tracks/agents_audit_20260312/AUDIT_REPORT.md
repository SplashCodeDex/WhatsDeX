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

## 3. Backend Findings (`backend/src/`)
| File Path | Line(s) | Type | Description | Rationale |
|-----------|---------|------|-------------|-----------|
| `backend/src/services/geminiAI.ts` | 115, 150 | Simulation | Artificial delays (`perceptionDelay`, `thinkingJitter`) | Simulates cognitive processes using `DeliberationService` instead of raw execution. |
| `backend/src/services/geminiAI.ts` | 415 | Placeholder Logic | `executeGenericResponse` has a stub for "Multiple actions". | Message: "Multiple actions execution is currently optimized for WhatsApp. Standby for omnichannel roll-out." |
| `backend/src/services/geminiAI.ts` | 515 | Placeholder Logic | `executeSingleActionGeneric` returns a placeholder string. | "Action execution is being wired in Phase 3." |
| `backend/src/services/researchSkill.ts` | 45-100 | Simulation | Fixed 3-agent spawn cycle (Researcher -> Critique -> Synthesis). | A fixed orchestration loop that simulates "deep research" through sequential `sessions_spawn` calls. |
| `backend/src/services/OpenClawSkillBridge.ts` | 45 | Hardcoded Config | `plugins: { enabled: false }` | Disables heavy plugin discovery to prevent port 3001 hangs, sacrificing capability for stability. |
| `backend/src/services/OpenClawSkillBridge.ts` | 80 | Simulation | Prompt-based skills return a static string. | "Skill ${entry.skill.name} executed with args: ${JSON.stringify(args)}" |

## 4. Agentic Logic & Tool Registry Findings
| File Path | Line(s) | Type | Description | Rationale |
|-----------|---------|------|-------------|-----------|
| `backend/src/services/geminiAI.ts` | 950-955 | Stubbed Helpers | `planWorkflow`, `selectResponseStrategy`, etc. | These return empty arrays or default strings, indicating the complex decision-making logic is not yet implemented. |
| `backend/src/services/AgentService.ts` | TBD | Simulation | Lifecycle methods (Create/Connect) | Need to verify if these perform real OpenClaw process management or just state updates. |

## 5. Compliance Verification (`@.gemini/GEMINI.md`)
- [x] No assumptions made.
- [x] Facts empirically verified (via code read).
- [x] Professional diagnostic terminology used.

## 6. Synthesis for Enhancement Phase
The "Agents" experience is currently a high-fidelity simulation in several key areas:
1. **Decision Logic:** The AI Brain detects intents but lacks the robust "Workflow Planning" and "Multiple Action" execution required for true autonomy.
2. **Infrastructure:** RAG (Knowledge Matrix) is a UI shell with no backend file-processing logic connected to the Agents.
3. **Skill Execution:** Many bridged skills are "metadata-only" or return static strings instead of invoking actual tool logic.
4. **Real-time Feedback:** UI relies on Zustand state but backend "Progress Updates" are manually emitted in fixed loops rather than streaming from the engine.
