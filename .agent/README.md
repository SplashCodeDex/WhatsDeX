# Antigravity Template

This template provides a standardized, "Superpowered" configuration for Antigravity agents (Claude, Gemini, etc.) using **Deepmind's Agentic Coding** principles.

## Features

-   **Core Rules**:
    -   `core_policy.md`: Enforces TDD and `plan.md` usage.
    -   `agent_behavior.md`: Defines the "Mastermind" persona and "Real Impelmentation" policy.
    -   `tech_standards.md`: Enforces clean architecture, strict typing, and no hardcoded values.
    -   `project_governance.md`: Defines "Done" and pre-commit checklists.
-   **Automated Workflows**:
    -   `/start-task`: Picks the next task, marks it in-progress, and sets up the "Red" phase (failing tests).
    -   `/finish-task`: Verifies tests/coverage, commits with standard sizing/messaging, attaches detailed git notes, and marks the task complete.
    -   `/verify-phase`: Runs a rigorous checkpoint protocol for major milestones.
-   **Agent Skills** (`.agent/skills`):
    -   `code-review`: Systematic review for correctness, security, style, and performance.
    -   `security-audit`: Deep-dive "black-box" security analysis.

## Installation

1.  **Copy**: Copy the `.agent` folder from this directory to the root of your target workspace.
2.  **Initialize**: Ensure your project has a `plan.md` file in the root (see `plan_template.md` if needed).
3.  **Activate**:
    -   Open the Agent panel.
    -   Go to "Customizations" -> "Rules" -> "+ Workspace" -> Import or Paste `core_policy.md`.
    -   Go to "Customizations" -> "Workflows" -> "+ Workspace" -> Import or Paste the workflow files.

## Usage

-   **Start a Task**: Type `/start-task` in the Agent chat.
-   **Finish a Task**: Type `/finish-task` in the Agent chat.
-   **Verify a Phase**: Type `/verify-phase` in the Agent chat.
