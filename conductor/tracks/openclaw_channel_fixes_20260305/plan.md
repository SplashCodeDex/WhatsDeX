# Implementation Plan: OpenClaw Channel-Specific Upstream Patching

## Overview
This plan outlines the steps to integrate critical upstream pull requests from OpenClaw into the local WhatsDeX engine.

## Phase 1: Research & Preparation
- [ ] Task: Research and analyze current Telegram adapter implementation in `openclaw/src/telegram/`.
- [ ] Task: Research and analyze Anthropic provider model definitions in `openclaw/src/agents/providers/anthropic/`.
- [ ] Task: Research and analyze Discord adapter channel resolution logic in `openclaw/src/discord/`.
- [ ] Task: Conductor - User Manual Verification 'Research & Preparation' (Protocol in workflow.md)

## Phase 2: Telegram Proxy Fix (#26229)
- [ ] Task: Write failing unit tests for Telegram proxy behavior in `openclaw/test/telegram.proxy.test.ts`.
- [ ] Task: Implement proxy isolation in Telegram adapter (`openclaw/src/telegram/`).
- [ ] Task: Verify fix with unit tests and ensure no regressions in existing Telegram tests.
- [ ] Task: Conductor - User Manual Verification 'Telegram Proxy Fix' (Protocol in workflow.md)

## Phase 3: Anthropic Haiku Model Alias (#26214)
- [ ] Task: Write failing unit tests for `haiku` model alias resolution in `openclaw/test/anthropic.alias.test.ts`.
- [ ] Task: Add `haiku` model alias to Anthropic provider configuration (`openclaw/src/agents/providers/anthropic/`).
- [ ] Task: Verify alias resolution with unit tests.
- [ ] Task: Conductor - User Manual Verification 'Anthropic Haiku Alias' (Protocol in workflow.md)

## Phase 4: Discord Channel ID Resolution (#26164)
- [ ] Task: Write failing unit tests for Discord numeric channel ID parsing in `openclaw/test/discord.channel.test.ts`.
- [ ] Task: Harden channel resolution logic in Discord adapter (`openclaw/src/discord/`).
- [ ] Task: Verify resolution with unit tests and existing Discord regression tests.
- [ ] Task: Conductor - User Manual Verification 'Discord Channel Resolution' (Protocol in workflow.md)

## Phase 5: Final Verification & Integration
- [ ] Task: Run full OpenClaw engine regression suite to ensure cross-channel stability.
- [ ] Task: Verify WhatsDeX-OpenClaw integration by running backend tests in `backend/`.
- [ ] Task: Conductor - User Manual Verification 'Final Verification' (Protocol in workflow.md)
