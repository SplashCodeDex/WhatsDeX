## ✅ PROJECT_RULES.md — Acknowledged

Before the full report, here's what the rules mandate (and I will strictly follow):

- ❌ Never delete, suppress, or remove code just to fix issues
- ❌ Never introduce new placeholders, workarounds, or simulations
- ❌ Never replace sophisticated code with "simpler" versions
- ✅ Dive deep into WHY code exists before touching it
- ✅ Complete unfinished features — don't remove them
- ✅ Keep codebase clean and organized
- ✅ Fix according to the project's real goal and data flow

---

## 🔍 FULL CODEBASE STUB/PLACEHOLDER/DUMMY/SIMULATION AUDIT REPORT

### 🔴 CRITICAL — Production Code Silently Broken or Returning Fake Data



**4. `backend/src/tools/list.ts` — Lines 2–3**
> Entire tool file is a placeholder returning a fake string

```ts
// Placeholder implementation
return `List of ${type} (Placeholder)`
```
💀 **Impact:** Any AI or command using this tool gets back a useless string like `"List of contacts (Placeholder)"`.

---

**5. `backend/src/services/geminiAI.ts` — Lines 482, 500–506**
> `intentToLegacyActionStub()` is a named stub actively called in AI routing

```ts
const action = await this.intentToLegacyActionStub(intent); // line 482

async intentToLegacyActionStub(intent: any): Promise<AIAction | null> {
    // Just a placeholder until Phase 3 ToolRegistry
    // Placeholder - actions will be handled by ToolRegistry
}
```
💀 **Impact:** AI intent-to-action routing is broken. Multi-action AI flows silently fall back to stub.



### 🟡 HIGH — Architectural Stubs / Technical Debt

---

**7. `backend/src/lib/identity.ts` — Line 28**
> LID-to-JID mapping is a placeholder comment

```ts
// Placeholder: In a real scenario, we would lookup in the LID mapping table
```
⚠️ **Impact:** WhatsApp identity resolution (LID mapping) is not fully implemented. Contact identity may be wrong.

---

**8. `backend/src/lib/context.ts` — Line 80**
> `mockBot` — fake partial Bot object cast with `as any` used to bridge commands to AI

```ts
const mockBot = { cmd: commandSystem.getCommands() } as any;
WhatsDeXToolBridge.registerCommands(mockBot);
```
⚠️ **Impact:** `WhatsDeXToolBridge` receives a fake `Bot` object. Any downstream code expecting a real `Bot` instance will silently have missing properties.

---

**9. `backend/src/commands/ai-chat/gemini.ts` — Lines 147–165**
> `mockCtx` — forged MessageContext for AI tool execution

```ts
const mockCtx: Partial<MessageContext> = {
    ...ctx,
    isOwner: false, // always forced false
    group: undefined, // stripped
    reply: (output) => { ... } // intercepted
};
```
⚠️ **Impact:** Commands executed via AI always run as non-owner, non-group — permission checks and group-aware logic are bypassed or incorrect.

---

**10. `backend/src/services/commandSystem.ts` — Line 264**
> `tenant: null as any` — tenant forced to null in command context

```ts
tenant: null as any, // Placeholder, will be set or is optional
```
⚠️ **Impact:** Commands relying on tenant context for multi-tenant logic will receive `null` — potential crashes or cross-tenant data leaks.

---

**11. `backend/src/services/ConfigService.ts` — Line 39**
> `jid: ''` — dynamic JID never set

```ts
jid: '', // Placeholder for dynamic JID
```
⚠️ **Impact:** Bot JID (WhatsApp phone identifier) defaults to empty string — any code reading `config.jid` before it's set will behave incorrectly.

---

**12. `backend/src/workers/intelligentWorker.ts` — Line 83**
> `getStats()` placeholder comment — EnhancedAIBrain stats not wired

```ts
// EnhancedAIBrain doesn't have getStats yet, adding a basic placeholder
```

---

**13. `frontend/src/features/messages/hooks/useAudiences.ts` — Line 8**
> Backend endpoint flagged as possibly missing

```ts
// Placeholder: The backend endpoint might not exist yet
```
⚠️ **Impact:** Audience fetching may silently return empty — campaign targeting broken.

---

**14. `frontend/src/components/layouts/InsightCard.tsx` — Line 35**
> `audiences: 0` hardcoded — real data not fetched

```ts
audiences: 0, // Placeholder for actual audience segments
```

---

### 🟠 MEDIUM — Unimplemented Exposed Features

---

**15. `frontend/src/app/(dashboard)/dashboard/usage/page.tsx` — Line 77**
> CSV Export button shows "coming soon" toast

```ts
toast.info('CSV Export coming soon')
```
⚠️ Users can click the button but nothing happens — feature is exposed in UI but not built.

---

**16. `frontend/src/app/(dashboard)/dashboard/flows/page.tsx` — Line 58**
> `initialEdges` is a hardcoded stub flow

```ts
const initialEdges: Edge[] = [{ id: 'e1-2', source: '1', target: '2' }]
```

---

**17. `backend/src/commands/search/googlesearch.ts` — Lines 39–42**
> Hardcoded API URL bypasses the project's `tools.api.createUrl()` system

```ts
// Mocking API call for type safety...
const apiUrl = `https://api.neko.fun/search/google?q=${encodeURIComponent(query)}`;
```

**18. `backend/src/commands/search/githubsearch.ts` — Lines 31–32**
> Same hardcoded URL bypass pattern

```ts
// Mocking URL creation for safety, assuming tool.api structure
const apiUrl = `https://api.neko.fun/search/github-search?q=${encodeURIComponent(input)}`;
```

---

**19. `frontend/src/features/agents/hooks/useCreateAgent.ts` — Line 53**
> Client-side `Math.random()` agent ID instead of server-assigned

```ts
agent_${Math.random().toString(36).substring(2, 11)}
```

---

**20. `backend/src/tools/cmd.ts` — Lines 77–89**
> `fakeMetaAiQuotedText()` uses hardcoded sentinel `'META_AI_MOCK'` as message ID

```ts
id: 'META_AI_MOCK', // hardcoded mock message ID
```

---

### 🟢 LOW / INTENTIONAL (Not Issues)

These use "simulate" / "fake" language but are **real, legitimate product features**:

| Area | Why it's legitimate |
|---|---|
| `campaignWorker.ts` — `typingSimulation` | Real anti-ban feature: sends WhatsApp typing indicator |
| `createBotContext.ts` — `simulateTyping` | Real WhatsApp `composing` presence signal |
| `flows/page.tsx` — `executeSimulationStep` | Flow Builder preview mode — legitimate UX |
| `backend/src/commands/group/simulate.ts` | Real bot command to simulate group join/leave for testing welcome messages |
| `frontend/src/lib/api/client.ts:76` — `'http://dummy.com'` | Correct Node.js URL constructor workaround, never hits network |

---

## 📊 Master Priority Table

| # | 🚦 | File | Issue |
| 4 | 🔴 | `tools/list.ts:2` | Tool returns `"List of X (Placeholder)"` |
| 5 | 🔴 | `geminiAI.ts:482,500` | `intentToLegacyActionStub()` in AI routing |
| 6 | 🔴 | `BotSettingsDialog.tsx:530` | `getMockCommands()` — fake commands shown to users |
| 7 | 🟡 | `identity.ts:28` | LID mapping lookup is a comment |
| 8 | 🟡 | `context.ts:80` | `mockBot` — fake bot object with `as any` |
| 9 | 🟡 | `gemini.ts:149` | `mockCtx` — forged permission context |
| 10 | 🟡 | `commandSystem.ts:264` | `tenant: null as any` |
| 11 | 🟡 | `ConfigService.ts:39` | `jid: ''` never set |
| 12 | 🟡 | `useAudiences.ts:8` | Endpoint may not exist |
| 13 | 🟡 | `InsightCard.tsx:35` | `audiences: 0` hardcoded |
| 14 | 🟠 | `usage/page.tsx:77` | CSV Export — "coming soon" stub |
| 15 | 🟠 | `flows/page.tsx:58` | `initialEdges` hardcoded |
| 16 | 🟠 | `googlesearch.ts:42` | Hardcoded URL bypasses `tools.api.createUrl` |
| 17 | 🟠 | `githubsearch.ts:32` | Same hardcoded URL bypass |
| 18 | 🟠 | `useCreateAgent.ts:53` | Client-side random agent ID |
| 19 | 🟠 | `cmd.ts:82` | `'META_AI_MOCK'` hardcoded sentinel |

---

That's the **complete, honest, no-assumptions audit** of every stub, placeholder, dummy, and simulation across the entire codebase — organized by real impact.

**Here's what I'd suggest as the next logical move:**

**Option A — Fix the 🔴 Critical 6 first** (the ones that are silently broken for users right now): `backupService`, `translate()`, `telegramWebhookRoutes`, `tools/list.ts`, `geminiAI intentToLegacyActionStub`, and `getMockCommands` — tackle them one by one in order of impact.

**Option B — Fix a specific single item** — you tell me which one and I deep-dive that file end-to-end right now.

**Option C — Create a Jira board** — I can create all 19 of these as tracked Jira tickets in your `KAN` project, organized by priority, so the whole team can work through them systematically.

**Option D — Fix by area** — e.g., fix all AI/Gemini stubs together, then all WhatsApp stubs, then all frontend stubs.

Which approach shall we take? 🎯
