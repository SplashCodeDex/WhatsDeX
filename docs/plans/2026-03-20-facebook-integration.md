# Facebook Messenger Integration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Facebook Messenger into DeXMart using a Hybrid Architecture, starting with Official Direct Token (BYO) support.

**Architecture:** Implements a platform-specific module in OpenClaw dispatched via the `GenericOpenClawAdapter` in DeXMart. Handles inbound via secure webhooks and outbound via Meta's Graph API.

**Tech Stack:** Node.js 24, Meta Graph API v20.0+, Firestore (for multi-tenant auth), OpenClaw Gateway.

---

### Task 1: OpenClaw Facebook Module (Outbound)

**Files:**
- Create: `openclaw/src/facebook/types.ts`
- Create: `openclaw/src/facebook/send.ts`
- Create: `openclaw/src/facebook/index.ts`
- Modify: `openclaw/src/index.ts`

- [ ] **Step 1: Define Facebook Types**
  ```typescript
  export interface FacebookCredentials {
    pageAccessToken: string;
    appSecret: string;
    verifyToken: string;
  }
  export interface FacebookSendResult {
    message_id: string;
    recipient_id: string;
  }
  ```

- [ ] **Step 2: Implement `sendMessageFacebook`**
  Implement core Graph API POST request with 2000-character chunking.

- [ ] **Step 3: Export via OpenClaw Index**
  Add `export { sendMessageFacebook } from "./facebook/send.js"` to `openclaw/src/index.ts`.

- [ ] **Step 4: Commit**
  ```bash
  git add openclaw/src/facebook openclaw/src/index.ts
  git commit -m "feat(openclaw): add facebook outbound messaging core"
  ```

---

### Task 2: OpenClaw Facebook Module (Inbound/Webhook)

**Files:**
- Create: `openclaw/src/facebook/webhook.ts`
- Modify: `openclaw/src/facebook/index.ts`

- [ ] **Step 1: Implement Signature Validation**
  Create middleware to verify `X-Hub-Signature-256` using `crypto.createHmac('sha256', appSecret)`.

- [ ] **Step 2: Implement Challenge Handler**
  Support GET requests for `hub.mode=subscribe` to verify webhook setup with Meta.

- [ ] **Step 3: Implement Message Normalizer**
  Parse `messaging` array from Meta payload and convert to `InboundMessageEvent`.

- [ ] **Step 4: Commit**
  ```bash
  git add openclaw/src/facebook/webhook.ts
  git commit -m "feat(openclaw): add facebook webhook security and normalization"
  ```

---

### Task 3: DeXMart Backend Integration

**Files:**
- Modify: `backend/src/services/channels/registry.ts`
- Modify: `backend/src/openclaw.d.ts`
- Create: `backend/src/webhooks/facebook.ts`

- [ ] **Step 1: Register Platform**
  Add `facebook` entry to `REGISTRY` in `registry.ts` pointing to `GenericOpenClawAdapter`.

- [ ] **Step 2: Update Type Definitions**
  Add `sendMessageFacebook` to `declare module 'openclaw'` in `openclaw.d.ts`.

- [ ] **Step 3: Create Webhook Route**
  Build the Express route in `backend/src/webhooks/facebook.ts` that pipes into `IngressService.handleCommonMessage`.

- [ ] **Step 4: Commit**
  ```bash
  git add backend/src/services/channels/registry.ts backend/src/openclaw.d.ts backend/src/webhooks/facebook.ts
  git commit -m "feat(backend): register facebook platform and setup webhook entrypoint"
  ```

---

### Task 4: UI/UX & Dashboard

**Files:**
- No file changes needed (Dynamic Registry)
- Test: Use `ChannelService.getSupportedPlatforms()` to verify visibility.

- [ ] **Step 1: Verify Dashboard Visibility**
  Run dev server and ensure "Facebook Messenger" appears in the "Add Channel" modal.

- [ ] **Step 2: Test Setup Form**
  Verify the token fields (Page Access Token, App Secret) are rendered correctly.

- [ ] **Step 3: Final Integration Test**
  Mock a Meta webhook payload and verify the DeXMart AI processes it and attempts an outbound response via the new adapter.

- [ ] **Step 4: Commit & Cleanup**
  ```bash
  git commit -m "test: verify facebook integration end-to-end"
  ```
