# Specification: FlowBuilder 2.0 (The Visual Revolution)

## Overview
FlowBuilder 2.0 is a visual, no-code logic designer for WhatsDeX. It allows users to create complex automation workflows by dragging and dropping nodes on a canvas. This moves the platform beyond simple auto-replies into sophisticated, multi-step conversation logic and platform actions.

## Functional Requirements

### 1. Visual Canvas (Frontend)
- **Library:** Use `react-flow` for the interactive canvas.
- **Node Types:**
    - **Trigger Nodes:** Incoming message (keyword match, regex, platform-specific).
    - **Logic Nodes:** Conditionals (if user is premium, if contact has tag).
    - **AI Nodes:** Route to Gemini for conversational response or intent detection.
    - **Action Nodes:** Send message, add tag to contact, trigger webhook, wait/delay.
- **Persistence:** Save/Load flow configurations as JSON.

### 2. Logic Engine (Backend)
- **Interpreter:** A service capable of parsing the Flow JSON and executing it step-by-step.
- **State Management:** Track the "current node" for active sessions to support multi-turn flows.
- **Integration:** Hook into the existing `MessageController` and bot adapters.

### 3. Hybrid AI/Static Flows
- Ability to switch from a rigid menu (Static) to a fluid AI conversation (Gemini) and back based on user input or node logic.

### 4. Router Node (AI Decision)
- An AI-powered node that takes user input and decides which outbound edge to follow based on semantic understanding.

## Non-Functional Requirements
- **Performance:** Smooth rendering of complex flows (up to 50 nodes).
- **Scalability:** The backend engine must handle thousands of concurrent flow executions.
- **Security:** Sanitize all dynamic inputs within the logic engine.

## Acceptance Criteria
- Users can create a flow with at least 3 nodes (Trigger -> Logic -> Action) and save it.
- A bot correctly executes a saved flow upon receiving a matching message.
- A "Gemini AI" node successfully generates a response within a flow.
- Visual feedback shows the flow execution path during testing.
