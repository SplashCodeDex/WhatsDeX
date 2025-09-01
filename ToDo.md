# WhatsDeX To-Do List

This document tracks upcoming tasks, enhancements, and features for the WhatsDeX project.

##  High Priority

- [ ] **Re-localize files to English:** After the architectural refactor, several files were reverted to Indonesian. These need to be translated back to English to maintain project consistency.
    - [ ] `commands/ai-chat/chatgpt.js`
    - [ ] `commands/converter/sticker.js`
    - [ ] `commands/downloader/tiktokdl.js`
    - [ ] `commands/main/menu.js`
    - [ ] `events/handler.js`
    - [ ] `index.js`
    - [ ] `main.js`
    - [ ] `middleware.js`
    - [ ] `package.json`
    - [ ] `tools/exports.js`
- [ ] **Address Security Vulnerabilities:** `npm audit` reported 3 high-severity vulnerabilities. These need to be investigated and patched.
    - [ ] Run `npm audit` to get details on the vulnerabilities.
    - [ ] Apply fixes using `npm audit fix --force` or by manually updating packages.
- [ ] **Resolve Node.js Engine Mismatch:** The project uses a Node.js version (`v23.6.1`) that is not officially supported by Jest.
    - [ ] Investigate potential issues and decide whether to align the Node.js version or confirm stability and suppress the warning.

##  Documentation

- [ ] **Create `RELEASE_MANUSCRIPT.md`:** Document the major architectural refactor, its purpose (modularity, testability), and the new structure (`context.js`, DAL, modular middleware).
- [ ] **Create `CONTRIBUTING.md`:** Outline guidelines for future contributors, including conventions for the new architecture, how to add new middleware, and the importance of writing tests with Jest.
- [ ] **Update `README.md`:** Refresh the README to reflect the current state of the project, update setup instructions (`npm install`), and add the command for running tests (`npm test`).

##  Future Features & Enhancements
- *(No new features planned currently)*
