# Specification: Refactor Bot to Channels

## Overview
This track focuses on the architectural retirement of the "Bot" entity in WhatsDeX. The responsibility for connectivity will be moved to a unified "Channels" system, while the "Agent" system will handle the assignment and intelligence. This allows for a "connectivity-only" experience for users who don't need or aren't eligible for AI Agents.

## Functional Requirements
1.  **Retire "Bot" Entity:** Remove the concept of "Bots" as the primary unit of management in the system hierarchy.
2.  **Elevate "Channels":** Refactor WhatsApp (Baileys) connectivity to live under the unified "Channels" service.
3.  **Agent-Channel Binding:** Implement a robust, bidirectional linking system where Agents can be assigned to one or more Channels, and Channels know their assigned Agent.
4.  **Preserve "Bot Goodies":** Archive all sophisticated logic (broadcast pools, session recovery, anti-call, etc.) from `MultiTenantBotService` into `backend/src/archive/` for safe-keeping.
5.  **Webhook Mode:** Implement a "Webhook-Only" mode for channels that do not have an assigned Agent (serving as the default for Free Tiers).
6.  **Multi-Channel Support:** Ensure the pattern applies consistently across WhatsApp, Telegram, Discord, and Slack.

## Non-Functional Requirements
1.  **Strict Tenant Isolation:** All channel and agent bindings must be strictly scoped to the tenant in Firestore.
2.  **Resilience:** Channel connectivity (Socket maintenance) must remain alive even if the AI Agent engine is down.
3.  **Maintainability:** Use the "Code Archival" strategy to keep the codebase clean while preserving legacy value.

## Acceptance Criteria
1.  A user can connect a WhatsApp "Channel" without being forced to assign an Agent.
2.  When an Agent is assigned to a Channel, it correctly receives and responds to incoming messages.
3.  When no Agent is assigned, incoming messages are forwarded to the tenant's configured Webhook.
4.  The `MultiTenantBotService` code is moved to the archive directory without breaking the build.

## Out of Scope
- Automatic migration of existing 'bot' data (database is fresh).
- Building new UI components (focus is on backend orchestration and API contracts).
