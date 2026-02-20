# Implementation Plan: FlowBuilder 2.0

This plan outlines the steps to build the visual flow designer and its backend execution engine.

## Phase 1: Frontend Foundation & Canvas [checkpoint: ]
Goal: Set up the React Flow environment and basic node structure.

- [x] Task: Install and Configure React Flow. 2ce27bd
    - [x] Sub-task: Add `react-flow` dependency to the frontend.
    - [x] Sub-task: Create a dedicated page at `frontend/src/app/(dashboard)/dashboard/flows/page.tsx`.
    - [x] Sub-task: Implement a basic canvas with zoom/pan controls.
- [x] Task: Define Custom Node Types. 2ce27bd
    - [x] Sub-task: Implement UI for 'Trigger', 'Action', and 'Logic' nodes.
    - [x] Sub-task: Add a sidebar for dragging new nodes onto the canvas.
- [x] Task: Flow Persistence (Local/Save). 2ce27bd
    - [x] Sub-task: Implement the `onSave` logic to export the flow state as JSON.
    - [x] Sub-task: Create the backend API endpoint to store Flow JSON in Firestore.

## Phase 2: Logic Engine & Execution [checkpoint: ]
Goal: Enable the backend to interpret and run the visual flows.

- [ ] Task: Prototype Logic Engine (TDD).
    - Sub-task: Write unit tests for an interpreter that navigates a simple Node/Edge JSON.
    - Sub-task: Implement the `FlowEngine` service in the backend.
- [ ] Task: Hook Engine into Incoming Messages.
    - Sub-task: Update the message handling pipeline to check for matching "Trigger" nodes before falling back to default AI.
- [ ] Task: Implement Basic Node Executors.
    - Sub-task: Implement 'Send Message' and 'Condition' node logic in the engine.

## Phase 3: AI & Hybrid Intelligence [checkpoint: ]
Goal: Integrate Gemini into the visual flows.

- [ ] Task: Implement 'Gemini AI' Node.
    - Sub-task: Add a node that forwards context to `GeminiAI` and returns the generated response.
- [ ] Task: AI Router Node (TDD).
    - Sub-task: Implement logic where Gemini decides which edge to follow based on user intent.
- [ ] Task: State Preservation (Multi-turn Flows).
    - Sub-task: Use Redis/Firestore to track the user's current position in a flow across multiple messages.

## Phase 4: UX Polish & Enterprise Features [checkpoint: ]
Goal: Finalize the builder for production use.

- [ ] Task: Flow Debugger/Simulator.
    - Sub-task: Add a "Test Flow" modal to simulate user input and see the path taken.
- [ ] Task: Template Integration.
    - Sub-task: Allow nodes to use existing message templates.
- [ ] Task: Conductor - User Manual Verification 'FlowBuilder 2.0' (Protocol in workflow.md)
