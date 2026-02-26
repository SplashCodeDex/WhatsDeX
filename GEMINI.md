# WhatsDeX AI Agent Knowledge (GEMINI.md)

## The Fusion Principle (WhatsDeX ⊕ OpenClaw)

**WhatsDeX and OpenClaw are being woven into a single unified product.** Neither replaces the other — they merge, each contributing its strongest capabilities.

| WhatsDeX Brings | OpenClaw Brings |
|-----------------|-----------------|
| SaaS frontend (Next.js 16, React 19) | Multi-channel engine (WhatsApp, Telegram, Discord, Slack, Signal, iMessage) |
| Multi-tenant architecture (Firestore subcollections) | Gateway server (Express API, agent protocol) |
| AI intelligence (intent detection, RAG, anti-ban) | Plugin system & agent framework |
| Dashboard UI & authentication | CLI/TUI developer tools |
| Firestore-based auth persistence | File-system auth with backup/resilience |
| Pairing code support | Rich markdown → WhatsApp formatting |

**Rules for all fusion work:**
1. **Never subtract, always weave** — Don't rip out OpenClaw modules to "clean up." Instead, bridge WhatsDeX's services to consume OpenClaw's engine (like `TelegramAdapter` already imports from `openclaw/src/telegram/send.js`).
2. **Best-of-both wins** — When both stacks solve the same problem differently, pick the stronger implementation and adapt the other side to use it.
3. **WhatsDeX = face + brain, OpenClaw = engine + muscles** — Frontend, multi-tenancy, and AI live in WhatsDeX. Channel engines, gateway, and tooling live in OpenClaw.
4. **Shared seams, not shared code** — Integration happens through well-defined interfaces (`ChannelAdapter`, gateway API), not by merging internal code.

---

## Testing Philosophy

### Test Failure ≠ Broken Code

**A failing test does NOT always mean the production code is broken.** Always investigate BOTH sides before making changes:

- **Stale Tests**: When a strategy, config, or dependency evolves, existing tests may still assert old behavior. The test is the bug, not the code.
- **Wrong Abstraction**: Tests should verify **contracts** (what the code promises) not **implementation details** (how it delivers). Test that failover works, not that a specific key is returned second.
- **Strategy Mismatch**: If the code deliberately uses `LatencyStrategy` but a test expects `LRU` rotation, the test is stale — don't change the production strategy to pass a test.
- **Decision Flow**: `Test fails → Verify prod code intent → If prod is correct, update the test → If prod is wrong, fix the prod code.`

### Real Example (ApiKeyManager)

The `apiKeyManager.test.ts` test `"should prefer least recently used key"` was failing because it assumed LRU rotation behavior. However, the production `ApiKeyManager` deliberately uses `LatencyStrategy` (picks lowest-latency key). The fix was to **update the test** to verify failover rotation (strategy-agnostic behavior), not to change the production strategy.

---

## Architecture Patterns

### Lazy Initialization

Services that depend on environment state (e.g., API keys, database connections) should use **lazy initialization** rather than module-level singletons. This prevents import-time crashes when dependencies aren't ready yet.

**Pattern**: Use a Proxy to defer initialization to first access:
```typescript
export const service = new Proxy({} as ServiceType, {
  get(_target, prop) { return (getServiceInstance() as any)[prop]; }
});
```

### Stale State Recovery

Persistent state files (e.g., API key health state) can become stale across process restarts. Always clear or validate persisted state on boot to prevent carrying over dead states from previous sessions.
