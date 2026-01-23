## 3. AI & DevOps Gaps

### Critical
- **Outdated CI/CD Targets**: `backend-ci.yml` targets Node.js 18.x and 20.x. These versions are deprecated for 2026 production environments.
    - *Remediation*: Update matrix to `[24.x, 25.x]`.
- **Lack of Automated Security Scanning**: No `npm audit` or `snyk` integration in the CI pipeline. This violates the "Security-as-Code" mandate.

### High Priority
- **AI Learning Persistence**: `geminiAI.ts` currently skips persistent storage for interaction learning ("Rule 5 skip"). This prevents the bot from evolving based on user behavior.
    - *Remediation*: Implement `tenants/{tenantId}/learning` Firestore subcollection.
- **RAG Memory Lifecycle**: Current `memoryService` stores conversations but lacks a structured lifecycle (Active -> Merged -> Archived). This will cause token bloat as user history grows.

### Medium Priority
- **CI/CD Caching**: Verify if `setup-node@v4` caching is fully utilized to minimize build times.
- **Agent Reflection Logs**: Implement a mechanism to log "Self-Critic" phases during agent operations for auditability.

---

## 4. Implementation Roadmap

Based on this analysis, the following tracks are recommended:

1.  **Track: Core Modernization (Backend)**
    - Implement Firestore-backed Baileys auth state.
    - Implement LID mapping in message processor.
    - Update CI/CD to Node 24 matrix.
2.  **Track: Mutation & Form Refactor (Frontend)**
    - Migrate all forms to `useActionState`.
    - Implement `Result<T>` pattern in all Server Actions.
3.  **Track: PPR & Performance Optimization**
    - Audit all layouts for Suspense boundaries.
    - Enable `ppr: true` in `next.config.ts`.

