# Specification: Codebase-Wide Placeholder & Simulation Cleanup

## Overview
This track focuses on the systematic identification and replacement of all placeholders, dummy data, and simulations across the WhatsDeX codebase. The goal is to move the system from a "simulated" state to a "live-ready" state by wiring real backend services, external APIs (in Sandbox mode), and dynamic frontend components.

## Functional Requirements
1.  **Backend Service Finalization**:
    *   Replace all hardcoded tenant/user IDs (e.g., `tenant-123`, `user-abc`) with dynamic values derived from authenticated session context.
    *   Convert mock service responses in `MultiTenantService`, `PlanService`, and `BotService` to real Firestore queries following the **Subcollection Pattern**.
    *   Remove all artificial delays (`setTimeout`, `sleep`) used to simulate network latency.
2.  **External Integration Wiring**:
    *   **Stripe**: Transition from simulated success responses to real Stripe API calls in **Test Mode**.
    *   **Gemini AI**: Ensure the `GeminiAI` service is hitting the live Google Generative AI endpoints using the provided API keys.
    *   **Google Drive**: Wire the backup logic to real Drive API Sandbox environments.
3.  **Frontend Dynamic Hydration**:
    *   Replace "Coming Soon" placeholders and empty state illustrations with real data fetched from the API.
    *   Update dashboard metrics, charts, and bot lists to reflect live Firestore state.
4.  **Global Marker Cleanup**:
    *   Execute a codebase-wide search for keywords (`TODO`, `FIXME`, `MOCK`, `DUMMY`, `PLACEHOLDER`, `TEMP`) and resolve all items related to data simulation.

## Non-Functional Requirements
1.  **Zero-Trust Validation**: Every real data interaction must be wrapped in a Zod schema parse (`Rule 1`).
2.  **Statelessness**: Ensure all refactored services are stateless and rely on Redis/Firestore for persistence (`Rule 5`).
3.  **Error Specificity**: Replace generic "An error occurred" messages with specific, actionable errors derived from real API/DB failures.

## Acceptance Criteria
*   The system successfully completes a full Signup -> Bot Creation -> Message Sending flow using only real Firestore data.
*   Dashboard metrics are non-zero and correctly reflect the tenant's actual bot count and message history.
*   External API calls (Stripe/Gemini) are verified in the network logs as hitting real endpoints (Sandbox/Test).
*   Global search for "dummy" or "tenant-123" returns zero results in the `src/` directories.

## Out of Scope
*   Production "Live" mode for Stripe (No real transactions).
*   New feature development outside of existing placeholder replacements.
