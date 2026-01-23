---
description: Finish the current task with verification and git notes
---
# Workflow: Finish Task

## Step 1: Verify Tests (Green Phase)
1.  Run the full test suite for the affected module.
2.  **Constraint:** All tests *must* pass. If not, stop and fix.

## Step 2: Check Coverage (Optional)
1.  If a coverage tool is configured (check `package.json` or equivalent), run it.
2.  **Report:** "Current Code Coverage: X%"

## Step 3: Commit
1.  **Format:** `<type>(<scope>): <description>` (e.g., `feat(auth): Add login validation`).
2.  Execute the commit.

## Step 4: Attach Git Note
1.  **Draft Note:** Create a summary including:
    -   Task Name
    -   Files Changed
    -   Reasoning
2.  **Get Hash:** Get the hash of the commit just made.
3.  **Attach:** `git notes add -m "<Note Content>" <hash>`

## Step 5: Update Plan
1.  Get the short hash (first 7 chars).
2.  Edit `plan.md`.
3.  Mark the task as `[x]` and append `[commit: <short-hash>]`.
4.  Commit the plan update: `conductor(plan): Complete task '<Task Name>'`

## Step 6: Next Steps
1.  Read `plan.md` to see what's next.
2.  **Output:** "Task completed and documented. Next task is: [Next Task Name]. ready to continue?"
