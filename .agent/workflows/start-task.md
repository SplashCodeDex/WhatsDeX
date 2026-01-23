---
description: Start a new task from the plan
---
# Workflow: Start Task

## Step 1: Analyze Plan
1.  Read `plan.md`.
2.  Identify the next unstarted task (first `[ ]` item).
3.  **Output:** "Starting Task: [Task Name]"

## Step 2: Strategic Planning (2026 Mandate)
1.  Identify dependencies and potential side effects.
2.  Draft a 3-5 step internal micro-plan for the task.
3.  **Output:** "Strategic Plan: 1. [Step 1] 2. [Step 2] ..."

## Step 3: Update Plan status
1.  Edit `plan.md`.
2.  Change the identified task status from `[ ]` to `[~]`.

## Step 4: Analyze Requirements
1.  Read the task description and related docs (`PROJECT_RULES.md`, `tech-stack.md`).
2.  Determine necessary file changes.

## Step 5: TDD - Red Phase
1.  Create/update test file.
2.  **Run test** to confirm failure.
3.  **Output:** "Test created and failing as expected. Ready to implement."
