# Prototype demo guide

> A run-book for demonstrating the **AI Vehicle Claims Prototype** end-to-end. Keep this open on a second screen while driving the live app. Time targets are indicative — adjust to your audience.

- **Live demo:** https://ai-vehicle-claims-prototype-p6sy.vercel.app
- **Source:** https://github.com/atulkaila/ai-vehicle-claims-prototype
- **SOW:** [docs/SOW.md](SOW.md) · [docs/SOW.pdf](SOW.pdf)
- **Sample images:** [docs/examples/](examples/README.md)

---

## 0. One-minute elevator pitch

> "It is a preliminary AI-assisted vehicle damage assessment tool for an insurance claims assessor. An assessor uploads a photo — or pastes a public URL — and the app returns the vehicle make/model/colour, a plain-English damage summary, a preliminary GBP repair range, three independent confidence scores, and a **human-review flag**. It is deliberately positioned as *decision support*, not automated claim approval. It is a full-stack Next.js 15 app on Vercel with OpenAI `gpt-4o-mini` behind a server-side route handler, and every response is validated by a Zod schema before it reaches the browser."

---

## 1. Demo script (≈ 3 minutes)

Open the live URL in a clean browser window. Have the [samples folder](examples/README.md) open in a second tab.

| Step | Action | What to say |
| ---- | ------ | ----------- |
| 1 | Upload **`Insurance-Damage-VW-Sample-1.jpg`** or **`Insurance-Damage-BMW-Sample-2.jpg`** | *"This is the primary happy path. A single image in, a full structured assessment out on the same page."* |
| 2 | Point out the three confidences | *"They are independent by design — I can be very confident about the make but much less confident about the cost. A single global number would hide that."* |
| 3 | Point out the **Human review required** flag | *"The prompt sets this whenever severity is severe, any confidence is below 0.7, or hidden damage is plausible. It reinforces that a human is always in the loop."* |
| 4 | Upload **`Insurance-Damage-Crash- Sample-4.jpg.png`** | *"Second car on top of the first — deliberately ambiguous. The model returns `Unknown` for make and model with low confidence and flags a warning. It does not hallucinate a claim."* |
| 5 | Try **`Insurance-Damage-Sample-Morethan4MB-3.jpg`** | *"Client-side check refuses the upload before it reaches the API. The 4 MB limit is Vercel's serverless request-body cap; the app calls it out clearly."* |
| 6 | Paste a public URL (a Wikipedia thumbnail is convenient) to trigger an error | *"The API returns a coded error envelope, the UI translates it into a plain-English banner. Users never see a stack trace, and the app never returns a mock or a hallucinated success."* |

---

## 2. Architecture in 60 seconds

> "The browser only ever calls the same-origin `/api/analyse` endpoint. That route runs on the Vercel Node.js runtime, holds the OpenAI key in an encrypted env var, and calls `chat.completions.create` on `gpt-4o-mini` with `response_format: json_object`. The raw JSON is parsed and then **validated by a Zod schema**. That schema is the single source of truth — the TypeScript types the UI uses are inferred from it, so the runtime contract and the compile-time contract cannot drift. On failure, the API returns a customer-safe error envelope with a specific code; the UI maps codes to red banners."

Sketch it if asked:

```
[Browser] ──► /api/analyse ──► OpenAI gpt-4o-mini ──► JSON ──► Zod ──► Typed Assessment ──► [Browser]
                                                                             │
                                                             failure ──► coded error envelope
```

---

## 3. Design decisions — why, not what

| If asked … | Answer |
| ---------- | ------ |
| **Why OpenAI and not Azure OpenAI?** | The personal Azure Foundry resource had `disableLocalAuth=true` enforced by tenant policy. OpenAI was the fastest path to a working, deployable prototype under the time cap. Azure OpenAI + managed identity is called out in the SOW (**M2 decision** and **M3 hardening / migration**). |
| **Why Vercel?** | Zero-config Next.js hosting, free encrypted env vars, auto-deploy on push, serverless functions with the 60 s max duration the API needs. Perfect for a demo; the SOW discusses when to consider Azure App Service or Container Apps instead. |
| **Why `gpt-4o-mini`?** | Vision-capable, JSON-native, ≈ US$0.0002 per assessment, 2–5 s typical latency. Adequate accuracy for a decision-support prototype. |
| **Why Zod?** | Runtime validation of model output *and* automatic TypeScript type inference. Prevents drift between what the code assumes and what actually arrives. |
| **Why not JSON Schema structured outputs?** | Prompt + `json_object` was simpler for one endpoint and one schema. If we added more endpoints, Structured Outputs would earn its keep. |
| **Why single request, no multi-agent?** | The prototype's goal is customer-experience validation, not orchestration complexity. Latency and cost stay minimal. Production could split vehicle-ID, damage, and cost into specialised agents (called out in Future Improvements). |
| **Why three independent confidences?** | Uncertainty is not uniform across the three reasoning steps. A single global number would hide the real risk. |
| **Why a GBP range, not a point estimate?** | Image-only cost prediction has intrinsic uncertainty. A range communicates that honestly. |
| **Why a customer-safe error envelope?** | Never surface raw OpenAI messages, stack traces, or provider identifiers. Every failure maps to a specific `code` and a plain-English banner in the UI. |

---

## 4. Security & privacy (30 seconds)

- **Key never leaves the server.** Not `NEXT_PUBLIC_`, not logged, not in error responses.
- **No persistence.** No database, no blob storage, no cookies for tracking.
- **Layered validation:** URL syntax → MIME/size checks → SSRF guard (rejects `localhost`, RFC1918 ranges, `169.254.169.254`) → OpenAI moderation → Zod response validation.
- **Structured server logs** with request IDs, timings, token counts, and cost estimates — **never** image bytes, full URLs, or keys.

---

## 5. What comes next (in priority order)

Same order as in the README's *Future improvements* section:

1. **Persistence & history** (Postgres or Cosmos DB).
2. **Authentication** — Entra ID / SSO.
3. **Rate limiting & abuse controls** — Vercel KV / Upstash + OpenAI Moderation or Azure Content Safety.
4. **Move to Azure** — Container Apps or App Service, Azure OpenAI with managed identity, App Insights, private networking.
5. **Evaluation dataset & continuous quality** — labelled gold set, regression tests on prompt/model changes.
6. **Calibrated confidence** — self-reported → observed accuracy.
7. **Real repair-parts + labour-rate integration** — replace GPT-guessed pricing.
8. **Multi-modal fusion** — VIN plate, telematics, prior claims.
9. **Human review workflow** — queue, SLAs, assignments, comments.
10. **Client-side compression** — accept 4K photos, resize to ≤ 4 MB before upload.

---

## 6. Frequently asked questions

- **"How do you know the confidence is real?"** → It is self-reported by the model and *not calibrated*. That is a stated limitation. The next step is to build an eval set and calibrate against outcomes before ever using it as a business threshold.
- **"What stops someone submitting a fake photo?"** → The prompt-based anti-fraud path returns `"Unknown"` for non-vehicles, and every response has `reviewRequired` and `warnings`. Production would add image forensics, EXIF checks, and multi-photo cross-validation.
- **"What's the cost model?"** → ≈ US$0.0002 per assessment on `gpt-4o-mini`. The server logs an `estCostUsd` per request so it can be measured. At 10 k assessments/day, that is ≈ US$2/day for the AI call.
- **"Why not use OpenAI Assistants / a framework?"** → Overkill for a single-endpoint prototype. Adds latency, cost, and complexity. Worth considering when we need retrieval, tool-use, or long-lived conversations.
- **"What tests are there?"** → A GitHub Actions workflow runs `tsc --noEmit` and `next build` on Node 20 and 22 on every push. A smoke script exercises the full OpenAI path locally. Unit and integration tests for the route are in the *Future improvements* backlog.
- **"How would this scale to 100 k/day?"** → Vercel serverless handles the concurrency. Bottleneck is OpenAI rate limits — solve by tier upgrade or Azure OpenAI regional deployments. Add KV-backed rate limiting per user. Add queueing if durable retries are required.

---

## 7. Live-recovery cues

Things that might go wrong during the demo:

| Symptom | Fix / say |
| ------- | --------- |
| The Vercel deploy has cold-started and takes ~8 s | *"First request wakes the serverless function. Subsequent calls are 2–5 s."* |
| A Wikipedia URL fails | *"Expected — OpenAI's image fetcher can't set a Wikimedia-approved User-Agent. Documented as `IMAGE_FETCH_FAILED`."* |
| Model returns lower confidence than expected | *"That is the point — the app is transparent about uncertainty, not confidently wrong."* |
| An error banner | *"Coded error envelope in action — no stack trace, no mock, no hallucinated success."* |

---

## 8. Closing

> "This is a prototype to prove out the customer experience. The GitHub repo, the README, the SOW, and this demo guide all live in the same repo so a customer team can follow the reasoning end-to-end."
