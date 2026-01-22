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

## 3. Code Quality Standards
-   **No Placeholders:** Never use `TODO`, `pass`, or `// implementation here` unless explicitly instructed for prototyping.
-   **Strict Typing:** Use strict types (TypeScript, C#, Go, etc.). Avoid `any`.
-   **Comments:** Explain *why*, not *what*.
-   **No Dead Code:** Remove unused variables, imports, and commented-out blocks immediately.

## 4. Agent Behavior
-   **Explain First:** Before executing a tool that modifies files, explain what you are about to do and why.
-   **No "Simulations":** Do not create "fake" logic just to satisfy a test unless mocking an external dependency.
-   **Context Awareness:** Verify the current directory (`cwd`) before running commands.
-   **Error Handling:** If a command fails, analyze the output. Do not blindly retry the same command. Search the web or read documentation if the error is obscure.

## 5. File Management
-   **New Files:** Always clarify where a new file should live (directory structure).
-   **Edits:** Use `replace_file_content` for single blocks, `multi_replace_file_content` for multiple blocks.
