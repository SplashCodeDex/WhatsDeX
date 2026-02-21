# Specification: System-Wide Feature Integration & Infrastructure Fixes

## Overview
This track addresses the critical infrastructure gaps and "partially wired" features identified in the system audit. The goal is to move the WhatsDeX platform from a state of visual completion to full operational robustness by initializing the background job system, connecting the frontend to missing backend routes, and implementing key interaction and intelligence logic.

## Functional Requirements

### 1. Infrastructure: Job System Initialization
- **JobRegistry Activation:** Import and initialize the `JobRegistry` in `backend/src/main.ts` immediately after the Global Context is ready.
- **Worker Connectivity:** Ensure all BullMQ workers (AI, Media, Analytics, Campaigns) are started during the boot sequence.

### 2. Messaging: Unified Inbox & Safety
- **Inbox Reply:** Implement the `reply` functionality in the Unified Inbox. 
    - Logic: Replies must be automatically routed through the *last* bot/channel that interacted with the contact.
- **AI Message Spinning:** Add a UI button to the Template/Campaign editors to trigger the backend "Message Spinning" logic (Enterprise only).
- **Template Management:** Create a dedicated dashboard page for managing (CRUD) message templates.

### 3. Analytics & Usage
- **Hybrid Usage Tracking:**
    - **Real-time:** Use Firestore `increment()` counters for critical billing limits (message counts).
    - **Historical:** Implement the `StatsAggregatorJob` to roll up raw event data into daily/monthly records for charts.
- **Usage Routes:** Implement the missing Express routes to serve usage analytics to the frontend.

### 4. Intelligence & Resiliency
- **AI Persistent Learning:** Wire the existing learning logic so that agents actually store and retrieve user facts during conversations.
- **Google Drive Backups:** Implement and wire the service to perform automated database/media backups to user-linked Drive accounts.

## Non-Functional Requirements
- **Performance:** Initialization of `JobRegistry` must not block the main server thread excessively.
- **Scalability:** The `StatsAggregatorJob` must be optimized to handle high volumes of message logs without hitting Firestore rate limits.
- **Multi-Tenancy:** Ensure all usage tracking and learning logic is strictly scoped to the `tenantId`.

## Acceptance Criteria
- Server logs confirm "JobRegistry initialized" during startup.
- Users can reply to any message in the Unified Inbox and have it delivered via the correct channel.
- Usage charts in the dashboard reflect real (aggregated) data.
- AI agents demonstrate "memory" by recalling facts from previous sessions.
- A "Backup Successful" status appears in the system settings after a backup run.

## Out of Scope
- Advanced NLP sentiment analysis (Basic learning focus only).
- Real-time video/audio calling.
