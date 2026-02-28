# Implementation Plan: Phase 2 - Visual Skill Orchestration

This plan outlines the integration of the Intelligence Store with the FlowBuilder to enable dynamic, visual AI automation.

## Phase 1: Shared Capabilities Foundation [checkpoint: 045417b]
Goal: Ensure skill definitions and metadata are available globally in the frontend.

- [x] Task: Shared Zustand Store. 045417b
    - [x] Create/Update `useOmnichannelStore` to include a `skills` array and `fetchSkills` action.
    - [x] Refactor `Intelligence Store` page to consume this shared state.
- [x] Task: Backend Schema Enrichment. 045417b
    - [x] Update `skillsManager.listAvailableSkills` to return full JSON Schema for skill parameters.
    - [x] Add `category` and `icon` metadata to the `/api/skills` response.
- [x] Task: Conductor - User Manual Verification 'Shared Capabilities Foundation' (Protocol in workflow.md) 045417b

## Phase 2: Visual Flow Integration [checkpoint: 4ea4e46]
Goal: Dynamically load and configure skills within the FlowBuilder canvas.

- [x] Task: Dynamic Skill Palette. 4ea4e46
    - [x] Refactor `FlowBuilder` sidebar to use the shared store for the `Skill` node dropdown.
    - [x] Implement visual plan-gating (locks) for Pro/Enterprise skills in the FlowBuilder.
- [x] Task: Intelligent Property Editor. 4ea4e46
    - [x] Create a dynamic form generator that renders input fields based on the selected skill's JSON Schema.
    - [x] Ensure parameter values are saved into the `node.data` object.
- [x] Task: Conductor - User Manual Verification 'Visual Flow Integration' (Protocol in workflow.md) 4ea4e46

## Phase 3: Logic Engine & Execution
Goal: Execute orchestrated skills with real-time parameters and track metrics.

- [~] Task: TDD - Skill Execution Logic.
    - [ ] Write backend unit tests for `FlowEngine.executeSkillNode` using mocked OpenClaw tools.
    - [ ] Write integration tests for flow traversal with parameter passing.
- [ ] Task: Implement Execution Bridge.
    - [ ] Refactor `FlowEngine` to extract parameters from `node.data` and pass them to the `toolRegistry.executeTool` method.
    - [ ] Enhance error handling to return human-friendly messages when skills fail or keys are missing.
- [~] Task: Metrics & Monetization.
    - [ ] Implement `trackNodeExecution` to record every skill trigger in `tenants/{tenantId}/events`.
- [ ] Task: Conductor - User Manual Verification 'Logic Engine & Execution' (Protocol in workflow.md)
