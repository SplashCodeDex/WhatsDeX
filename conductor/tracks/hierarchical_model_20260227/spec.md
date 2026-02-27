# Specification: Hierarchical Agent-Controller Model (Path-Aware)

## Overview
This track refactors the system architecture to establish a strict hierarchy where **Channels** (social media connections) are children of **Agents** (AI Brains). This ensures data integrity, automatic cleanup, and a clear logical flow from intelligence to connectivity. Crucially, this model implements **Path-Awareness**, where OpenClaw adapters are initialized with the full Firestore path for deep system visibility.

## Functional Requirements
1.  **Nested Subcollection:** Move the "Channels" collection to live inside the "Agents" collection in Firestore: `tenants/{tenantId}/agents/{agentId}/channels/{channelId}`.
2.  **Global System Agent:** Implement a `system_default` agent for each tenant. This agent acts as the parent for all connectivity slots that do not have an assigned AI personality (e.g., for Free Tier or Webhook-Only use).
3.  **Agent-First Mapping:** Update the Ingress and Outbound pipelines to resolve connectivity through the Agent context.
4.  **Cascading Shutdown:** 
    -   Implement **Service-Level Cleanup** in `AgentService.deleteAgent()` to manually stop child OpenClaw adapters.
    -   Prepare a **Cloud Function Hook** (optional scaffold) for asynchronous session cleanup in production.
5.  **Path-Based OpenClaw Init:** Update OpenClaw adapters to receive and store the full Firestore path. This allows OpenClaw to perform its own direct lookups or logs within the correct tenant/agent scope.

## Non-Functional Requirements
1.  **Breaking Refactor:** Existing top-level channel logic will be fully migrated to the new hierarchy.
2.  **Zero-Trust Pathing:** Ensure `FirebaseService` is updated to validate the deep nested paths.
3.  **Performance:** Optimize the `Agent-First` mapping to ensure no latency increase in message processing.

## Acceptance Criteria
1.  Deleting an Agent automatically deletes (or renders inactive) all its child Channels in Firestore.
2.  Incoming messages on a WhatsApp Channel correctly identify their parent Agent via the path hierarchy.
3.  Users on the Free plan can connect social media through the `system_default` agent without AI intervention.
4.  OpenClaw social media sessions are successfully terminated when the parent Agent is removed.
5.  OpenClaw adapter logs include the full Firestore path for easier debugging and multi-tenant audit trails.

## Out of Scope
- Building a complex multi-agent UI (focus is on data and service orchestration).
- Support for legacy top-level 'channels' after migration.
