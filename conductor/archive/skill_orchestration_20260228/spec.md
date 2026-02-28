# Specification: Phase 2 - Visual Skill Orchestration

## Overview
Unify the "Intelligence Store" with the "FlowBuilder" to allow users to visually orchestrate powerful AI skills (Web Search, Image Gen, etc.) within their conversation flows. This track moves beyond static auto-replies into dynamic, tool-aware automation.

## Functional Requirements
- **Dynamic Skill Loading:** The FlowBuilder property panel must fetch the list of available skills from the backend `/api/skills` endpoint (via a shared Zustand store).
- **Intelligent Property Editor:** When a `SkillNode` is selected, the property panel must render a dynamic form based on the skill's parameter schema (JSON Schema).
- **Eligibility Gating:** Skills restricted by the user's plan (Starter/Pro/Enterprise) must be visually locked or marked in the FlowBuilder, mirroring the Intelligence Store.
- **Direct Skill Execution:** The `FlowEngine` must execute the bridged OpenClaw tools immediately during flow traversal, passing configured parameters.
- **Execution Metrics:** Every skill execution must be logged for future usage-based billing.

## Non-Functional Requirements
- **Consistency:** Use identical icons, names, and categories as the Intelligence Store.
- **Performance:** Cache skill definitions in the frontend to prevent canvas lag.
- **Robustness:** Gracefully handle skill failures or missing API keys without crashing the entire flow.

## Acceptance Criteria
- [ ] Users can drag a `SkillNode` and select any enabled OpenClaw skill from a dropdown.
- [ ] Users can fill in skill-specific parameters (e.g., "Search Query") in the flow UI.
- [ ] Locked skills (due to tier) cannot be selected in the FlowBuilder.
- [ ] A test flow using a "Web Search" skill successfully replies with real-time data.

## Out of Scope
- Implementing new OpenClaw skills (this track uses existing ones).
- Visualizing complex JSON outputs from skills (simple text responses only for now).
