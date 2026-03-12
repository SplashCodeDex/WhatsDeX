# Specification: Agents Page Audit & Enhancement (agents_audit_20260312)

## 1. Overview
This track initiates a full-stack, "deep-dive" audit of the **Agents** page in DeXMart. The primary goal is to identify and document all instances of placeholders, "dummies," `fixMe` comments, simulations, and hardcodings that deviate from the production-ready vision. This audit is the foundation for transforming the Agents system into a "powerful, robust, and enhanced" feature set.

## 2. Scope
### 2.1 Audit Areas (Full Stack)
- **Frontend (`frontend/src/app/dashboard/agents/`):**
    - Identify UI components rendering static/dummy data.
    - Check for simulated loading states or hardcoded IDs in Server Actions/Components.
    - Verify Zod schema validation for agent configuration inputs.
- **Backend (`backend/src/src/services/agent/` & OpenClaw Integrations):**
    - Investigate simulated research cycles (Researcher -> Auditor -> Synthesis).
    - Audit the **Unified Tool Registry** for gaps or hardcoded skill mappings.
    - Check for "stubbed" methods in Agent lifecycle management (Create, Connect, Delete).
- **Compliance:** Ensure adherence to `@.gemini/GEMINI.md` mandates.

### 2.2 Functional Requirements
- **Investigation Phase:** Conduct a systematic code search and execution trace to find all "dummies."
- **Fact-Based Documentation:** Document every finding with file paths, line numbers, and the rationale for why it's a simulation/placeholder.
- **Strategic Mapping:** Propose enhancements for **Real-time Status** (WebSockets) and **Skill Integration**.

## 3. Acceptance Criteria
- [ ] A comprehensive `AUDIT_REPORT.md` is generated within the track directory.
- [ ] No placeholders or simulations are missed (verified through recursive search).
- [ ] A clear roadmap for the "Enhancement Phase" (Robustness/Power) is defined based on the audit findings.

## 4. Non-Functional Requirements
- **Zero Assumptions:** All findings must be empirically verified.
- **Consistency:** Use professional diagnostic terminology.
- **Integrity:** No code changes are to be made during the audit phase; reporting only.

## 5. Out of Scope
- Immediate fixing of identified issues (reserved for the subsequent "Enhancement" phase).
- UI/UX redesign (unless related to robustness/status updates).
