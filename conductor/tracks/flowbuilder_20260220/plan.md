# Implementation Plan: FlowBuilder 2.0

This plan outlines the steps to build the visual flow designer and its backend execution engine.

## Phase 1: Frontend Foundation & Canvas [checkpoint: d799acd]
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

- [x] Task: Prototype Logic Engine (TDD). 618e423
    - [x] Sub-task: Write unit tests for an interpreter that navigates a simple Node/Edge JSON.
    - [x] Sub-task: Implement the `FlowEngine` service in the backend.
- [x] Task: Hook Engine into Incoming Messages. 1739157
    - [x] Sub-task: Update the message handling pipeline to check for matching "Trigger" nodes before falling back to default AI.
- [x] Task: Implement Basic Node Executors. 812fa46
    - [x] Sub-task: Implement 'Send Message' and 'Condition' node logic in the engine.

## Phase 3: AI & Hybrid Intelligence [checkpoint: 8536346]
Goal: Integrate Gemini into the visual flows.

- [x] Task: Implement 'Gemini AI' Node. 726889a
    - [x] Sub-task: Add a node that forwards context to `GeminiAI` and returns the generated response.
- [x] Task: AI Router Node (TDD). bd7645e
    - [x] Sub-task: Implement logic where Gemini decides which edge to follow based on user intent.
- [x] Task: State Preservation (Multi-turn Flows). 8536346
    - [x] Sub-task: Use Redis/Firestore to track the user's current position in a flow across multiple messages.

## Phase 4: UX Polish & Enterprise Features [checkpoint: ]
Goal: Finalize the builder for production use.

- [x] Task: Flow Debugger/Simulator. d799acd
    - [x] Sub-task: Add a "Test Flow" modal to simulate user input and see the path taken.
- [x] Task: Template Integration. d799acd
    - [x] Sub-task: Allow nodes to use existing message templates.
- [~] Task: Conductor - User Manual Verification 'FlowBuilder 2.0' (Protocol in workflow.md)
