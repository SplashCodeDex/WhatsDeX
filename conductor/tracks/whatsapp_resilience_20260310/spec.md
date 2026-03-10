# Track Specification: whatsapp_resilience_20260310

**Overview:**
This track focuses on engineering extreme resilience for the WhatsApp integration by simulating 50+ "defeating" and "what if" scenarios. We will utilize a high-fidelity unit/mock testing harness to ensure DeXMart handles failures gracefully, maintains data integrity across tenants, and keeps the user informed (User-In-Loop policy).

**Functional Requirements:**
1.  **Connection Stability (15+ Scenarios):**
    *   Handle rapid network switching, simulated "battery death" (socket abrupt close), and Baileys session expiration.
    *   Test recovery when Firestore is temporarily unreachable during a handshake.
2.  **Concurrency & Load (15+ Scenarios):**
    *   Simulate "Thundering Herd" (100+ messages arriving within 1 second).
    *   Test UI abuse: Rapidly clicking "Generate QR", "Delete", and "Stop" simultaneously.
3.  **Gating & Security (10+ Scenarios):**
    *   Ensure a tenant cannot exceed their plan limit even with concurrent message bursts.
    *   Verify that Agent ID spoofing or path manipulation in `fullPath` is blocked.
4.  **Workflow Integrity (10+ Scenarios):**
    *   Test "Hot Reassignment": Moving a channel to a new agent while a 10MB media file is still being processed.
    *   Handle Skill Timeouts: What if a research agent hangs for 2 minutes on a WhatsApp request?

**Acceptance Criteria:**
*   A dedicated test suite (`whatsappResilience.test.ts`) covering 50+ distinct failure cases.
*   System remains stable (no crashes) during all scenarios.
*   User-In-Loop: Every failure that requires user intervention must trigger a clear, actionable notification/status update.
*   Zero cross-tenant data leakage confirmed via isolated mock tests.
