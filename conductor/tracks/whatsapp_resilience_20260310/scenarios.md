# WhatsApp Resilience: 50+ Conflict Registry

This document tracks all "What If" scenarios for the WhatsApp integration. Each item must be marked as `[x] Resolved` only after automated tests and manual verification.

## Conflict Zone 1: Connection & Hardware Stress (1-15)
- [ ] **1. Sudden Death:** Socket closes abruptly during initial handshake.
- [ ] **2. Pairing Paralysis:** User provides phone number, but pairing code request fails on WhatsApp side.
- [ ] **3. Internet Ghosting:** QR generated, but server internet drops before scan.
- [ ] **4. Event Storm:** Baileys emits 5+ `qr` events in < 1 second.
- [ ] **5. Data Corruption:** Firestore `creds` document contains invalid JSON.
- [ ] **6. The "Gap" Restart:** Server restarts after `open` event but before status update.
- [ ] **7. Network Flip:** Phone switches from WiFi to LTE mid-transmission.
- [ ] **8. The Ban Hammer:** WhatsApp account is banned while system is polling.
- [ ] **9. Fragmented Auth:** `auth` collection has keys but missing `creds` document.
- [ ] **10. TUI Overlap:** TUI and Dashboard try to auth same channel at once.
- [ ] **11. Clock Drift:** Server clock drifts by 5 minutes, breaking session tokens.
- [ ] **12. Alien Reason:** Baileys emits `close` with undocumented status code.
- [ ] **13. Database Lag:** `updateStatus` hangs for 10s during reconnection.
- [ ] **14. User Interruption:** User clicks "Stop" while backoff timer is active.
- [ ] **15. Zombie Session:** Previous session lock exists but process is dead.

## Conflict Zone 2: Concurrency & Load (16-30)
- [ ] **16. Thundering Herd (Local):** 100+ inbound messages for 1 channel in 1s.
- [ ] **17. Global Surge:** 500+ inbound messages across 50 tenants.
- [ ] **18. The Clicker:** User clicks "Generate QR" 10 times in a row.
- [ ] **19. Mid-Flight Delete:** User clicks "Delete" while channel is "Connecting".
- [ ] **20. Atomic Race:** Two API requests call `startChannel` at exact same ms.
- [ ] **21. Broadcast Clash:** Background worker sends while user toggles adapter.
- [ ] **22. The 10MB Choke:** Processing massive video while 50 other texts are queued.
- [ ] **23. Memory Spike:** Socket service hits 5,000 active connections.
- [ ] **24. AI Bottleneck:** AI reasoning takes 30s while 10 new messages arrive.
- [ ] **25. OS Exhaustion:** System runs out of file descriptors (too many sockets).
- [ ] **26. Cache Desync:** Redis shows "Connected", Firestore shows "Disconnected".
- [ ] **27. Batch Move:** 20 agents reassigned across 20 channels in one transaction.
- [ ] **28. Cold Boot Herd:** 1,000 channels attempt `resumeActiveChannels` at once.
- [ ] **29. Slow Webhook:** Target webhook server takes 5s to respond.
- [ ] **30. Queue Overflow:** BullMQ hits 10,000 pending tasks for one tenant.

## Conflict Zone 3: Gating & Security (31-40)
- [ ] **31. Limit Perfection:** Message sent when `messagesSent` is exactly at limit.
- [ ] **32. Double Dip:** Two concurrent sends when only 1 slot remaining.
- [ ] **33. Subscription Snap:** Plan expires while channel is in active chat.
- [ ] **34. Path Forgery:** Attacker sends forged `agentId` in API path.
- [ ] **35. Cross-Tenant Leak:** Tenant A uses Channel ID belonging to Tenant B.
- [ ] **36. Path Injection:** `fullPath` manipulated to point to internal agent.
- [ ] **37. Zod Bypass:** Malformed Unicode in message content.
- [ ] **38. ID Spoofing:** User tries to create channel with duplicate ID.
- [ ] **39. Usage Hammer:** 1,000 `usage/totals` requests/min from one IP.
- [ ] **40. AI Hijack:** Tenant `aiEnabled` flag flipped to `false` mid-reasoning.

## Conflict Zone 4: Workflow & Logic (41-50+)
- [ ] **41. Moving Target:** Agent moved while mid-way through 5-step flow.
- [ ] **42. Orphaned Sub-Agent:** Channel disconnects while nested researcher is working.
- [ ] **43. Tool Timeout:** Research skill hangs for 60s on dead URL.
- [ ] **44. The Blob:** AI returns response exceeding WhatsApp text limits.
- [ ] **45. Ghost Move:** Firestore updates agent path but adapter update fails.
- [ ] **46. Archived Ghost:** Message received for channel marked "Archived".
- [ ] **47. Reaction Failure:** Reacting to message already deleted by user.
- [ ] **48. Prompt Injection:** User sends "Ignore instructions" via WhatsApp.
- [ ] **49. UTF-8 Nightmare:** Tool results contain null bytes.
- [ ] **50. Notification Failure:** User-In-Loop socket fails during backend error.
- [ ] **51. Persistence Check:** Server crashes mid-reasoning; resumes on restart.
- [ ] **52. Skill Hot-Swap:** Skill updated while agent is calling it.
