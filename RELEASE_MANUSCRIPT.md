# Release Manuscript for WhatsDeX

This document serves as a living record of significant architectural decisions, feature implementations, and the reasoning behind them for the WhatsDeX project. Its purpose is to ensure any future developer or AI can seamlessly understand the project's evolution and continue its development.

## Table of Contents

- [Initial Setup and Renaming (August 31, 2025)](#initial-setup-and-renaming-august-31-2025)
- [Language Localization (August 31, 2025)](#language-localization-august-31-2025)

## Initial Setup and Renaming (August 31, 2025)

### Decision:

The project, originally cloned from `itsreimau/gaxtawu`, was re-established as an independent repository under `SplashCodeDex/WhatsDeX`.

### Reasoning:

This decision was made to:

1.  **Establish independent ownership:** To allow CodeDeX to manage the project directly without being tied to the original upstream repository as a traditional fork.
2.  **Facilitate custom development:** Provide a clean base for future custom features, automation, and productization efforts as per CodeDeX's vision.
3.  **Maintain historical context:** Unlike a complete re-initialization, this method preserved the entire commit history from the original `gaxtawu` project, ensuring that all development lineage is retained.

### Implementation Details:

- The existing remote origin (`git remote remove origin`) was removed.
- A new empty repository (`https://github.com/SplashCodeDex/WhatsDeX.git`) was created by CodeDeX on GitHub.
- The new repository URL was added as the new remote origin (`git remote add origin <new_url>`).
- All local branches (`git push -u origin --all`) and tags (`git push origin --tags`) were pushed to the new remote, effectively transferring the entire history.

## Language Localization (August 31, 2025)

### Decision:

All user-facing text and comments in the codebase were translated from Indonesian to English.

### Reasoning:

This decision was made to:

1.  **Expand Accessibility:** Make the bot and its codebase accessible to a broader, global audience, aligning with CodeDeX's ambition for scalable productization.
2.  **Improve Maintainability:** English is a widely understood language in software development, which will facilitate easier collaboration and future maintenance by a larger pool of developers.
3.  **Standardization:** Align the project with common industry practices for open-source projects, which often use English for documentation and user interfaces.

### Implementation Details:

- Identified all files containing Indonesian text, primarily in `README.md`, `config.example.js`, and various `.js` files within the `commands/game` and `commands/group` directories.
- Used a combination of `replace` tool calls and manual file overwrites (for larger, more complex files) to perform the translations.
- Ensured that code logic and variable names remained consistent, with only human-readable strings being altered.
- Specific files translated include:
  - `README.md`
  - `config.example.js`
  - `commands/group/add.js`
  - `commands/group/approve.js`
  - `commands/group/demote.js`
  - `commands/group/group.js`
  - `commands/group/intro.js`
  - `commands/group/kick.js`
  - `commands/group/listpendingmembers.js`
  - `commands/group/mute.js`
  - `commands/group/promote.js`
  - `commands/group/reject.js`
  - `commands/group/setoption.js`
  - `commands/group/settext.js`
  - `commands/group/simulate.js`
  - `commands/group/unmute.js`
  - `commands/group/unwarning.js`
  - `commands/group/warning.js`
  - All `.js` files within `commands/game` directory (e.g., `asahotak.js`, `caklontong.js`, `family100.js`, etc.)

### Future Considerations:

- Implement a more robust localization (i18n) system if multi-language support becomes a primary requirement, rather than hardcoding strings.
- Review all remaining files in the project for any untranslated strings or comments.

## Architectural Refactor - September 2025

This document outlines the significant architectural refactor merged into the `master` branch. The primary goal of this refactor was to improve the project's modularity, testability, and maintainability, laying a more robust foundation for future development.

### Core Changes

1.  **Centralized Context (`context.js`):**

    - **Previous State:** The project relied on global variables and direct `require` statements within files, making it difficult to manage shared resources and dependencies.
    - **New Architecture:** A single `context.js` file now initializes and holds all core components (configuration, database connections, logging, tools). This `context` object is then injected into the main bot instance.
    - **Reasoning:** This inversion of control makes the system more predictable and vastly simplifies testing by allowing for easy mocking of dependencies.

2.  **Modular Middleware (`/middleware` directory):**

    - **Previous State:** Middleware logic was primarily contained in a monolithic `middleware.js` file and intertwined with the main event handler in `events/handler.js`.
    - **New Architecture:** Each piece of middleware (e.g., `antiLink`, `botMode`, `afk`) is now a small, self-contained module in its own file within the `/middleware` directory. The main event handler now iterates through these modules, applying them in a defined sequence.
    - **Reasoning:** This approach promotes the Single Responsibility Principle. Each file has one clear job, making the code easier to understand, debug, and test in isolation.

3.  **Data Access Layer (DAL) (`/database` directory):**

    - **Previous State:** Database interactions were scattered throughout the codebase, with direct calls to the `simpl.db` library.
    - **New Architecture:** A Data Access Layer has been established in the `/database` directory. Files like `user.js`, `group.js`, and `bot.js` now export functions that provide a clear API for all database operations (e.g., `database.user.get()`, `database.group.update()`).
    - **Reasoning:** This abstracts the underlying database implementation. If the project were to migrate from `simpl.db` to another database system (like MySQL or MongoDB), only the files within the DAL would need to be updated, rather than hunting for database queries throughout the entire application.

4.  **Introduction of Automated Testing (`jest`):**

    - **Previous State:** The project had no automated tests.
    - **New Architecture:** The `jest` testing framework has been integrated, and initial test suites have been written for the new middleware (`__tests__/middleware.botMode.test.js`) and tools (`__tests__/tools.msg.test.js`). The `package.json` now includes a `test` script.
    - **Reasoning:** Automated tests are critical for ensuring code quality and preventing regressions. They allow developers to make changes with confidence, knowing that existing functionality is verified.

5.  **State Management (`state.js`):**
    - **Previous State:** Volatile state information (like bot uptime) was managed directly within the configuration.
    - **New Architecture:** A dedicated `state.js` file now manages this information, keeping it separate from static configuration.
    - **Reasoning:** This separation of concerns makes the configuration cleaner and prevents accidental modification of runtime state.

### Impact on Future Development

## WhatsDeXBrain: The AI Core (September 2025)

### Decision:

A new AI core, named `WhatsDeXBrain`, was implemented to handle all incoming messages and make intelligent decisions about how to respond. This represents a major step towards a more conversational and intelligent bot.

### Reasoning:

The previous architecture relied on a simple command-based system. The `WhatsDeXBrain` was introduced to:

1.  **Enable Natural Language Understanding:** To allow the bot to understand natural language and not just commands.
2.  **Provide a More Human-like Experience:** To make the bot more conversational and engaging.
3.  **Centralize Decision-Making:** To have a single point of entry for all incoming messages, making the code easier to manage and debug.

### Implementation Details:

- **`WhatsDeXBrain.js`:** The core of the brain, responsible for processing incoming messages.
- **`nlpProcessor.js`:** A new service that uses a combination of keyword matching, pattern matching, and the Gemini API to determine the user's intent.
- **`brain/` directory:** A new directory that contains the intent handlers. Each handler is responsible for a specific intent (e.g., `greeting`, `farewell`, `question`).
- **`intentRouter.js`:** A new file that routes the message to the appropriate handler based on the intent.

### New Architecture:

The new architecture is as follows:

1.  **`middleware.js`:** The main entry point for all incoming messages. It calls the `WhatsDeXBrain.processMessage` method.
2.  **`WhatsDeXBrain.js`:** The core of the brain. It calls the `nlpProcessor.js` to determine the user's intent, and then calls the `intentRouter.js` to route the message to the appropriate handler.
3.  **`nlpProcessor.js`:** Determines the user's intent.
4.  **`intentRouter.js`:** Routes the message to the appropriate handler.
5.  **`brain/` directory:** Contains the intent handlers.

This new architecture is highly modular and extensible. New intents and handlers can be easily added without modifying the core logic of the brain.
