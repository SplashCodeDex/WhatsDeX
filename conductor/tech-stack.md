# WhatsDeX Technology Stack (2026 Mastermind Edition)

## 1. Frontend

- **Framework:** Next.js 16.1.2 (App Router, Turbopack, PPR Stable)
- **Library:** React 19.2.3 (Server Components, Server Actions, React Compiler Enabled)
- **Language:** TypeScript 5.9.3 (Strict Mode)
- **Styling:** Tailwind CSS 4.1.18 (CSS-first `@theme` configuration, Zero Config)
- **Animations:** Framer Motion 12.26.2 (GPU-accelerated)
- **State Management:**
  - **Server State:** Server Components & Actions (Result Pattern)
  - **Mutation State:** `useActionState` (replacing manual loading states)
  - **Client UI State:** Zustand 5.0.10
  - **URL State:** Next.js Navigation Hooks
- **Validation:** Zod 4.3.5 (Mandatory for all I/O)
- **Icons:** Lucide React 0.562.0

## 2. Backend

- **Runtime:** Node.js 24+ (Strict ESM, Permission Model Enabled)
- **Framework:** Express 5.2.1 (Thin Controllers, Service-Oriented)
- **Language:** TypeScript 5.9.3
- **Execution:** `tsx` (TypeScript Execute) - **STRICT: DO NOT use ts-node**
- **Omnichannel Engine:** OpenClaw 2026.2.15 (Unified Gateway & Skills Platform)
- **WhatsApp API:** Baileys 7.0.0 (via OpenClaw Adapter)
- **Telegram API:** grammY 1.40.0 (via OpenClaw Adapter)
- **Discord API:** discord.js 14.18.0 (via OpenClaw Adapter)
- **Job Queues:** BullMQ / BullMQ Pro (Group Isolation for Multi-Tenancy)
- **Real-time:** WebSockets (Socket.io 4.8.3 & socket.io-client)
- **Observability:** OpenTelemetry (Tracing & Metrics, Low-overhead auto-instrumentation)
- **Logging:** Pino (High-performance, JSON structured)
- **Testing:** Node.js Native Test Runner (`node --test`) & Vitest 4.0

## 3. Infrastructure & Services

- **Database:** Firebase Firestore (Subcollection Multi-Tenancy Pattern)
- **Authentication:** Firebase Admin / Client SDK 12.8.0
- **Payments:** Stripe 20.1.2
- **Caching:** Redis (ioredis 5.9.1)
- **AI Integration:** Google Generative AI (Gemini) 0.24.1
- **File Storage:** Firebase Storage / Google Drive API

## 4. Development & Tooling

- **Testing:** Vitest 4.0 (Backend) / Vitest 3.2 (Frontend)
- **Linting:** ESLint 9+ (Flat Config), Prettier
- **Git Hooks:** Husky, Lint-staged
- **API Validation:** Zod (Mandatory for all contracts)
- **Automation:** Custom scripts in `backend/scripts/`
