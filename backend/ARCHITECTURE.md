# WhatsDeX Backend Architecture

> **Version**: 1.0.0
> **Last Updated**: 2026-01-23
> **Stack**: Node.js 24 | Express 5 | Baileys 7 | BullMQ

---

## 1. Design Philosophy

The WhatsDeX backend is a high-performance, multi-tenant bot management engine. It prioritizes **Resilience**, **Security**, and **Observability**.

### Key Principles
- **Zero-Trust Data Layer**: All I/O is validated at the boundary via Zod.
- **Service-Oriented Logic**: Business logic is decoupled from Express and Baileys.
- **Event-Driven**: Internal state changes are propagated via local event emitters and job queues.

---

## 2. Directory Structure

```
src/
├── commands/       # WhatsApp Bot Commands (Maker, Search, AI)
├── config/         # Environment & Platform configuration
├── controllers/    # Express API Controllers (Thin)
├── events/         # Local event handlers (Connection updates, stats)
├── jobs/           # BullMQ Workers (Campaigns, Media Processing)
├── lib/            # Shared libraries (Firestore, Auth, Simple WhatsApp wrapper)
├── middleware/     # Express Middleware (Auth, Cooldown, Rate-limits)
├── routes/         # Express API Routes
├── services/       # Core Business Logic (The brain)
├── tools/          # Helper tools for bot interaction
├── tui/            # Terminal UI for debugging
├── types/          # Shared TypeScript types & Zod schemas
└── utils/          # Pure utilities (Logger, Performance)
```

---

## 3. WhatsApp Integration (Baileys v7)

We use Baileys v7 for stable connectivity.

### Multi-Bot Session Management
- **Persistence**: We do NOT use file-based auth. Sessions are persisted in Firestore under `tenants/{tenantId}/bots/{botId}/auth`.
- **LID Mapping**: All message processing must support LID (Local Identifier) mapping for 2026 WhatsApp compatibility.
- **Connection Pooling**: Managed via `BotManagerService`, ensuring each tenant stays within their subscription bot limit.

---

## 4. Background Processing (BullMQ)

Heavy tasks are offloaded to BullMQ workers.

- **CampaignWorker**: Handles broadcast marketing with intelligent throttling.
- **MediaProcessor**: Processes images/videos for sticker generation and compression.
- **AIProcessor**: Manages Gemini API calls to prevent blocking the main event loop.

---

## 5. Security (Node.js Permission Model)

In production, we leverage the Node.js 24 stable permission model.

- **Filesystem**: Restrict write access to `Logs/` and `backups/`.
- **Network**: Allow outbound to Google (Firebase/Gemini), Stripe, and WhatsApp sockets.

---

## 6. Observability

- **OpenTelemetry**: Every bot command and API request is traced.
- **Metrics**: Exported via Prometheus for real-time dashboarding.
- **Logging**: JSON-structured logging via Pino for high-speed log ingestion.
