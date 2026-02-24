# WhatsDeX AI Agent Knowledge (GEMINI.md)

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
