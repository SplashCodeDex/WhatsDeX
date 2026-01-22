---
description: Project Governance - Checklists, Definition of Done, and Violations
globs: ["**/*"]
alwaysApply: true
---
# Project Governance

## 1. Definition of Done
A task is considered complete ONLY when:
1.  [ ] Code is implemented and functional.
2.  [ ] **Unit Tests** are written and passing (Green Phase).
3.  [ ] **Linting** passes with zero errors.
4.  [ ] **Documentation** (comments, README updates) is complete.
5.  [ ] `plan.md` is updated with the commit hash.

## 2. Pre-Commit Verification
Before running `/finish-task` or committing:
-   **Check**: Are there any `console.log` leftovers? (Delete them, unless using a Logger).
-   **Check**: Are there commented-out blocks of dead code? (Delete them).
-   **Check**: Did you use the correct file naming convention? (`PascalCase` for Components, `camelCase` for functions).

## 3. Violations Policy
The following are considered "Severe Violations" of project rules:
1.  **Breaking the Build**: Committing code that does not compile.
2.  **Ignored Tests**: Commenting out failing tests instead of fixing them.
3.  **Magic Numbers**: Using unexplained numbers in logic.
4.  **Duplication**: Copy-pasting complex logic instead of refactoring into a utility.

## 4. Emergency Protocol
If a critical bug is found:
1.  **Stop**: Halt all new feature work.
2.  **Reproduce**: Write a test case that reproduces the bug (it should fail).
3.  **Fix**: Implement the fix until the test passes.
4.  **Verify**: Ensure no regressions in related modules.
