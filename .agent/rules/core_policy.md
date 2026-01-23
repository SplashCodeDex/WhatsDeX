---
description: Core Policy - Enforces TDD, Plan-Driven Development, and Code Quality
globs: ["**/*"]
alwaysApply: true
---
# Core Project Policy

## 1. The Plan is the Source of Truth
-   **Always** read `plan.md` before starting work.
-   **Always** update `plan.md` to reflect progress (`[ ]` -> `[~]` -> `[x]`).
-   **Never** deviate from the plan without updating `plan.md` first.

## 2. Test-Driven Development (TDD) Mandate
-   **Red:** Write failing tests *before* writing any implementation code.
-   **Green:** Write *only* enough code to pass the tests.
-   **Refactor:** Clean up code while keeping tests green.
-   **Policy:** If you are asked to implement a feature, your first step must be creating a test file that fails.
-   **2026 Verification**: Use specialized tools (linters, test runners) to verify results rather than relying on LLM intuition.

## 3. Code Quality Standards
-   **No Placeholders:** Never use `TODO`, `pass`, or `// implementation here` unless explicitly instructed for prototyping.
-   **Strict Typing:** Use strict types (TypeScript 5.9+). Avoid `any` at all costs.
-   **Result Pattern**: Prefer returning Result objects `{ success, data, error }` over throwing exceptions for expected failures.
-   **Comments:** Explain *why*, not *what*.

## 4. Agent Behavior
-   **Explain First:** Before executing a tool that modifies files, explain what you are about to do and why.
-   **Strategic Planning**: Generate a multi-step plan for complex tasks and update it dynamically.
-   **Reflection (Critic Phase)**: Before reporting completion, the agent MUST review its own work for edge cases or security flaws.
-   **No "Simulations":** Do not create "fake" logic just to satisfy a test unless mocking an external dependency.

## 5. File Management
-   **New Files:** Always clarify where a new file should live (directory structure).
-   **Edits:** Use `replace_file_content` for single blocks, `multi_replace_file_content` for multiple blocks.
