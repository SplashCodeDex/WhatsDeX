# Release Manuscript

This document outlines the major changes in each release of WhatsDeX.

## v1.5.0

### Major Changes

- **Refactored the codebase to use `@whiskeysockets/baileys`.** The entire codebase has been refactored to use the official `@whiskeysockets/baileys` library instead of the old `@itsreimau/gktw` library. This change improves the stability and performance of the bot.
- **Added `pino` for logging.** The `pino` library has been added for logging. This allows for more detailed and structured logs.

### Breaking Changes

- The old `@itsreimau/gktw` library is no longer supported.
- The `Formatter` object has been changed.

### New Features

- None.

### Bug Fixes

- Fixed a bug that caused the bot to crash on startup.
- Fixed a bug that caused the bot to be unstable.
