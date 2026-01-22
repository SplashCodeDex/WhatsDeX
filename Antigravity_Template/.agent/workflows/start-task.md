---
description: Start a new task from the plan
---
# Workflow: Start Task

## Step 1: Analyze Plan
1.  Read `plan.md`.
2.  Identify the next unstarted task (first `[ ]` item).
3.  **Output:** "Starting Task: [Task Name]"

## Step 2: Update Plan status
1.  Edit `plan.md`.
2.  Change the identified task status from `[ ]` to `[~]`.

## Step 3: Analyze Requirements
1.  Read the task description and any related "Product Requirements" or "Tech Stack" documents.
2.  Determine the necessary file changes.

## Step 4: TDD - Red Phase
1.  Create a new test file (or add to an existing one) corresponding to the feature.
2.  Write a test case that defines the expected behavior.
3.  **Run the test** to confirm it fails.
4.  **Output:** "Test created and failing as expected. Ready to implement."
