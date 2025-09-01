# Contributing to WhatsDeX

First off, thank you for considering contributing to WhatsDeX! Your help is essential for keeping this project great.

Following these guidelines helps to communicate that you respect the time of the developers managing and developing this open-source project. In return, they should reciprocate that respect in addressing your issue or assessing patches and features.

## Code of Conduct

This project and everyone participating in it is governed by a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior.

## How to Contribute

### Reporting Bugs

- **Ensure the bug was not already reported** by searching on GitHub under [Issues](https://github.com/SplashCodeDex/WhatsDeX/issues).
- If you're unable to find an open issue addressing the problem, [open a new one](https://github.com/SplashCodeDex/WhatsDeX/issues/new). Be sure to include a **title and clear description**, as much relevant information as possible, and a **code sample** or an **executable test case** demonstrating the expected behavior that is not occurring.

### Suggesting Enhancements

- Open a new issue and provide a clear and detailed explanation of the feature you would like to see, why it is useful, and how it would work.

### Pull Requests

- Fork the repo and create your branch from `master`.
- If you've added code that should be tested, add tests.
- If you've changed APIs, update the documentation.
- Ensure the test suite passes (`npm test`).
- Make sure your code lints.
- Issue that pull request!

## Architectural Guidelines

With the recent architectural refactor, it is critical that all contributions adhere to the new patterns to maintain the quality and consistency of the codebase.

### 1. The Context Object (`context.js`)

- All shared services, tools, and configurations are managed in `context.js`.
- If you need to access a shared resource (like the database or a tool), it should be destructured from the `context` object, which is available in the `bot` instance (`ctx.self.context`).
- Do **not** use global variables or direct `require` statements for shared resources.

### 2. Middleware (`/middleware`)

- Any new logic that needs to inspect or intercept incoming messages should be implemented as a new middleware file in the `/middleware` directory.
- Each middleware file must export a single asynchronous function that accepts the `ctx` object as its only argument.
- The middleware should return `false` to halt further processing of the message, or `true` to pass it to the next middleware in the chain.

### 3. Data Access Layer (DAL) (`/database`)

- All interactions with the database **must** go through the DAL.
- To access user data, for example, use `ctx.self.context.database.user.get(userId)` or `ctx.self.context.database.user.update(userId, data)`.
- Do **not** interact with the `simpl.db` instance directly from within commands or middleware.

### 4. Automated Testing

- All new features (especially middleware and commands) should be accompanied by tests written using the `jest` framework.
- New tests should be placed in the `__tests__` directory, mirroring the project structure.
- Before submitting a pull request, ensure all tests pass by running `npm test`.

By following these guidelines, we can ensure that WhatsDeX remains a high-quality, maintainable, and robust application. Thank you for your contribution!
