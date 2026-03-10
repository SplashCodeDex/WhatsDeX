# Track Specification: fix_connection_flaws_20260310

**Overview:**
This track addresses critical flaws in the WhatsApp connection lifecycle, focusing on path-aware routing, connection status accuracy, reconnection logic, and authentication data cleanup to improve system reliability and security.

**Functional Requirements:**
1.  **Stale Path Routing Fix:**
    *   Ensure that moving a channel between agents triggers a restart or update of the running adapter to use the new Firestore path.
    *   `IngressService` must resolve the correct agent from the updated `fullPath`.
2.  **Connection Status Accuracy:**
    *   Update Firestore status to `qr_pending` immediately upon QR code generation in `AuthSystem`.
    *   Ensure the dashboard reflects the true connection state (e.g., `qr_pending` vs. `connected`).
3.  **Reconnection Logic Improvement:**
    *   Implement an exponential backoff strategy for reconnection attempts (starting at 1s, doubling up to 1m) to prevent infinite loops and rate limiting.
4.  **Authentication Data Cleanup:**
    *   Automatically delete associated Baileys authentication data from Firestore when a channel is permanently deleted.

**Acceptance Criteria:**
*   Moving a channel correctly reroutes inbound messages to the new agent's AI logic without server restart.
*   The dashboard displays `qr_pending` when a QR code is waiting to be scanned.
*   Reconnection attempts follow the exponential backoff pattern and are logged correctly.
*   Deleting a channel removes both the channel document and its corresponding session data from the `waba_sessions` (or equivalent) collection.

**Out of Scope:**
*   Changes to the frontend UI beyond status display updates.
*   Support for non-WhatsApp channels (unless they share the same auth patterns).
