# Statement of Work
## AI-Powered Vehicle Damage Assessment — Insurance Claims Intake

| | |
|---|---|
| **Client** | Insurance Company (Prospect) |
| **Vendor** | Atul Kaila — Solutions Engineering |
| **Date** | September 2026 |
| **Reference** | SOW-VDA-2026-001 |
| **Deployed prototype** | [ai-vehicle-claims-prototype-p6sy.vercel.app](https://ai-vehicle-claims-prototype-p6sy.vercel.app) |
| **Source** | [github.com/atulkaila/ai-vehicle-claims-prototype](https://github.com/atulkaila/ai-vehicle-claims-prototype) |

---

### 1. Executive Summary

This SOW covers an AI-powered claims intake solution that ingests a photograph of a damaged vehicle and returns a structured preliminary assessment — vehicle identification, damage summary, repair-cost range, confidence indicators, and a human-review recommendation. The working prototype is deployed and demonstrated. This document defines the scope, technical approach, milestones, risks, and KPIs for taking the prototype through pilot and into production.

### 2. Project Scope

**In scope (prototype, delivered):**
- Single-page web application (Next.js + TypeScript)
- File upload (JPEG / PNG / WebP, ≤ 4 MB) or public image URL input
- Server-side call to a vision-capable large language model
- Structured JSON assessment (vehicle, damage, repair estimate, review flag, warnings) validated by Zod at runtime
- Same-page results with independent confidence per category
- Customer-safe error envelope with codes for invalid input, oversized image, unreachable URL, model failure, and schema mismatch
- Anonymous public demo hosted on Vercel with encrypted server-side API-key storage

**Out of scope (prototype):** claims history, persistent image storage, authentication, claims-system integration, autonomous claim decisions, repair-shop integration, parts-pricing catalogues, labour-rate databases, payment processing, production RBAC, enterprise audit logging, calibrated confidence, model routing, multi-agent orchestration, and rate limiting.

**Delivery phases:**

| Phase | Status | Purpose |
|---|---|---|
| Prototype | ✅ Delivered | Prove technical feasibility and customer experience |
| Pilot (4 weeks) | 🔜 Proposed | Select the production-ready platform, migrate, run against real claims with a small assessor cohort, and decide on wider rollout |

Production rollout beyond the pilot is a separate engagement scoped after pilot evaluation (M5).

### 3. Technical Approach

**Architecture** (single full-stack Next.js app, one API route, one shared JSON schema):

```
Browser ──► /api/analyse (Vercel serverless, Node.js runtime)
                       │
                       ▼
                OpenAI Chat Completions API (gpt-4o-mini, vision + JSON mode)
                       │
                       ▼
                Zod schema validation ──► Typed Assessment JSON ──► Browser
```

**AI/ML model:** OpenAI `gpt-4o-mini` was selected for the prototype based on multimodal vision capability, ~2-second latency, ~US$0.0002 per assessment, and native JSON output mode. The system prompt fixes the schema, enforces confidence bounds, locks the currency to GBP, and instructs the model to return `Unknown` values with `reviewRequired=true` for non-vehicle or ambiguous images rather than fabricate a claim. Zod validates every response before it reaches the UI. Invalid responses are surfaced as `INVALID_MODEL_RESPONSE`, not returned as partial data.

**Integration points (prototype):** OpenAI Chat Completions API; GitHub for source control; Vercel for hosting, CI, and encrypted environment variables.

**Platform selection for the pilot (M2 decision):** Two viable stacks. The choice is deferred to the design phase so it is grounded in the customer's cloud footprint, GDPR posture, existing SSO provider, and downstream integration targets rather than assumed up front:

- **Option A — Harden on Vercel + OpenAI**: Vercel Pro (Firewall, static egress, rate limits), Vercel KV, Vercel Postgres for claim history, Auth.js with Entra ID via OIDC, OpenAI enterprise plan with DPA, Sentry or Vercel Observability for telemetry.
- **Option B — Migrate to Azure**: Azure App Service or Container Apps, Azure OpenAI behind managed identity, native Entra ID authentication, Azure Cosmos DB for history, Azure API Management for rate limits and audit, Application Insights for telemetry.

Both options satisfy the same target architecture (auth, persistence, telemetry, rate limiting, safe secret handling); only the vendor supplying each layer differs. Milestones M3–M5 are written to be platform-agnostic — only M2 depends on the choice.

**Defensive layers:** client-side MIME and size validation; client-side URL syntax and preview verification; server-side re-validation, SSRF guard blocking loopback and RFC1918 ranges; Zod schema enforcement on the model response; consistent customer-safe error envelope.

### 4. Milestones and Timeline

**Total duration: 4 weeks from pilot kickoff.** M1 is the delivered prototype; M2 is the platform and design decision; M3–M5 execute against whichever platform is chosen in M2.

| # | Milestone | Target | Key Deliverables |
|---|---|---|---|
| M1 | Prototype (delivered) | Day 0 | Deployed demo, GitHub repo, README, SOW |
| M2 | Platform decision & design | Week 1 | Selected platform (Vercel-harden or Azure-migrate), success criteria agreed, evaluation dataset spec (200 labelled claims), platform resources provisioned, SSO / Entra ID app registration |
| M3 | Hardening & migration | Week 2 | Auth wired (Entra ID via native or OIDC), claim history persisted, telemetry live, rate limiting applied, secret management on chosen platform, model access configured (Azure OpenAI + managed identity, or enterprise OpenAI + DPA) |
| M4 | Pilot execution | Week 3 | 200–500 real claim images processed by 3–5 assessors, daily telemetry monitoring, prompt-tuning against evaluation set |
| M5 | Evaluation & production readiness | Week 4 | KPI report vs targets, confusion matrix, human-review workflow, operational runbook, go/no-go decision on wider rollout |

Production rollout beyond the pilot (broader assessor onboarding, disaster-recovery drills, multi-region hosting, integration with the core claims system) is a separate engagement to be scoped based on M5 outcomes.

Production rollout beyond the pilot (broader assessor onboarding, disaster-recovery drills, multi-region hosting, integration with the core claims system) is a separate engagement to be scoped based on M5 outcomes.

### 5. Risk Assessment

| # | Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|---|
| R1 | Model hallucinates make/model or cost | High | Medium | Human review threshold, confidence gating (<0.7 → review), evaluation dataset before production, quarterly re-tuning |
| R2 | API key or credential leaked | High | Low | Server-side only, encrypted vault, rotation policy, SIEM alerts on anomalous usage; managed identity replaces the key entirely if Azure is selected in M2 |
| R3 | Model provider outage | Medium | Low | Graceful `MODEL_ERROR` envelope, retry with exponential backoff, secondary provider on hot standby in production |
| R4 | Image PII / GDPR concerns (number plates, faces, VINs) | High | Medium | No persistence in prototype; region-locked hosting + retention policy + redaction pipeline in production |
| R5 | Runaway OpenAI cost from abuse | Medium | Medium | Monthly billing cap on OpenAI account; Vercel Firewall / APIM rate limits in production; budget alerts at 50 % / 80 % / 100 % |
| R6 | Adversarial or fraudulent submissions | High | Medium | Content-moderation pre-check, image forensics (EXIF, error-level analysis) in production, confidence gating, human review |
| R7 | Regulatory or compliance rejection (FCA, ICO) | High | Low | Explicit "decision support, not decision" positioning; audit log of every prediction and human override in production |
| R8 | Model version drift changing outputs | Medium | High | Pin the model version in env vars; run the evaluation dataset before promoting new versions; alert on KPI regressions |

### 6. Success Metrics (KPIs)

| # | KPI | Target | Measurement |
|---|---|---|---|
| K1 | Schema-valid response rate | ≥ 99 % | Zod parse success ÷ total requests |
| K2 | End-to-end latency (P95) | < 10 s | Server-side timing telemetry |
| K3 | Assessor agreement on make/model | ≥ 85 % | Sample audit of 100 random claims per month |
| K4 | Assessor agreement on severity | ≥ 75 % | Same audit sample |
| K5 | Cost per assessment | < £ 0.01 | OpenAI spend ÷ number of assessments |
| K6 | Human-review routing precision | ≥ 80 % | Cases correctly flagged (severe / ambiguous / low-confidence) ÷ total flagged |
| K7 | Availability | ≥ 99.5 % | Vercel / Azure uptime monitor |
| K8 | Security incidents | 0 | Quarterly key-management + access-log audit |
| K9 | Time from image submission to first-look by assessor | < 2 minutes (pilot) | Workflow instrumentation |
| K10 | Cost avoidance per adopted claim | Baseline established in pilot | Compared to average manual-only assessment cost |

---

### Approval

| Vendor | Client |
|---|---|
| _____________________________ | _____________________________ |
| Atul Kaila, Solutions Engineering | (Name, Title) |
| Date: | Date: |

---

*This SOW is a working document and will be refined jointly with the client during the pilot design phase (M2). References: source repository and deployed prototype URLs listed at the top of this document.*
