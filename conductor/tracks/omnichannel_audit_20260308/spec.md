# Specification: Omnichannel Orphan Logic Audit

## Objective
Identify all "orphan" backend logic—functions, services, and configurations that exist in the code but are not currently wired to the REST API or surfaced in the Frontend UI.

## Scope
1. **Connection Management**: Logic for assigning agents to channels, connecting/disconnecting, and state persistence.
2. **Pairing Methods**: QR code and Pairing Code logic for WhatsApp, Signal, and potential other channels.
3. **Configurations**: Channel-specific settings (e.g., auto-reply, media handling, proxy settings) that are defined in backend but missing UI controls.
4. **Agent-Channel Linkage**: Verification of the hierarchy `tenants/T/agents/A/channels/C` and if UI correctly handles this nesting.
5. **OpenClaw Parity**: Ensuring all relevant OpenClaw engine features are exposed via WhatsDeX.

## Deliverables
- A comprehensive Audit Report (`audit_report.md`).
- A prioritized Implementation Plan (`plan.md`) to wire these features.
