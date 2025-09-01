# WhatsDeX Project Guide for AI Agents (e.g., Jules)

This document provides essential information and guidelines for AI agents (like Google's Jules) to understand, set up, and contribute to the WhatsDeX project effectively.

## 1. Project Overview

WhatsDeX is a self-hosted WhatsApp bot built using Baileys. Its primary purpose is to provide a wide range of functionalities, including AI-powered chat and image generation, media conversion, downloaders, entertainment, games, group management, and various utility tools. The project emphasizes modularity, testability, and maintainability, laying a robust foundation for future development and productization.

## 2. Environment Setup

Jules should be able to infer most of the setup from `package.json`. However, here are explicit instructions to ensure a consistent environment:

*   **Node.js Version:** The project is developed with Node.js `v23.6.1`. Please ensure this version or a compatible LTS version is used.
*   **Dependency Installation:**
    ```bash
    npm install
    ```
*   **Running Tests:**
    ```bash
    npm test
    ```
*   **Starting the Bot:**
    ```bash
    node index.js
    ```
*   **Environment Variables:**
    *   The bot requires a `config.js` file (or `config.example.js` renamed to `config.js`) for configuration. This file contains sensitive information like API keys and owner IDs. **AI agents should never commit actual secrets or API keys.** For testing or development, use placeholder values or ensure a secure method for injecting these.
    *   Refer to `config.example.js` for required configuration parameters.

## 3. Architectural Overview

WhatsDeX follows a modular, event-driven architecture with clear separation of concerns.

*   **Centralized Context (`context.js`):**
    *   Acts as the central dependency injection container.
    *   Initializes and manages core services: `config`, `consolefy`, `SimplDB` instance (`db`), Data Access Layer (`database`), `Formatter`, `state`, and `tools`.
    *   Accessible via `bot.context` or `ctx.self.context` within the bot instance.

*   **Modular Middleware (`/middleware` directory):**
    *   A pipeline of self-contained modules that process incoming messages before command dispatch.
    *   Each middleware exports an `async` function taking `ctx` and returns `true` to continue or `false` to halt processing.
    *   Managed and invoked by `events/handler.js`.

*   **Data Access Layer (DAL) (`/database` directory):**
    *   Abstracts all database interactions (using `simpl.db`).
    *   Provides a clean API for CRUD operations on `user`, `group`, `bot`, and `menfess` data.
    *   DAL modules are initialized by passing the `SimplDB` instance from `context.js`.

*   **Command Handler (`commands` directory):**
    *   Manages and executes bot commands, organized by category.
    *   Loaded by `main.js` using `@itsreimau/gktw`'s `CommandHandler`.

*   **Event Handler (`events/handler.js`):**
    *   Primary listener for Baileys client events (e.g., `MessagesUpsert`, `UserJoin`, `Call`).
    *   Orchestrates the middleware chain for incoming messages.

*   **Utilities/Tools (`tools` directory):**
    *   Reusable helper functions and modules for common tasks (API calls, message formatting, command parsing).

*   **State Management (`state.js`):**
    *   Manages volatile runtime information (e.g., bot uptime, database size).

## 4. Coding Style and Conventions

*   **Follow Existing Patterns:** Adhere to the existing code style, formatting, and architectural patterns.
*   **Meaningful Names:** Use clear and descriptive names for variables, functions, and classes.
*   **Comments:** Add comments sparingly, focusing on *why* something is done, especially for complex logic. Ensure comments are in **English**.
*   **Asynchronous Operations:** Prefer `async/await` for asynchronous code.
*   **Error Handling:** Implement robust `try...catch` blocks for API calls and other potentially failing operations.
*   **Localization:** All user-facing strings and comments should be in English.

## 5. Testing

*   **Framework:** `jest` is used for automated testing.
*   **Location:** Tests are located in the `__tests__` directory, mirroring the project structure.
*   **Execution:** Run tests using `npm test`.
*   **Requirement:** All new features and significant bug fixes should be accompanied by corresponding unit or integration tests.

## 6. Project Roadmap and TODOs

Refer to the `ToDo.md` file for the current list of tasks, enhancements, and future features. AI agents should consult this file for prioritized work items.

---
