# Sample assessment inputs

Curated demo files for the [live prototype](https://ai-vehicle-claims-prototype-p6sy.vercel.app). Each row exercises a specific behaviour of the assessment pipeline. Download the file, then use **Choose File** in the app.

---

## Included samples

| # | File | Scenario | What to expect |
| - | ---- | -------- | -------------- |
| 1 | [Insurance-Damage-VW-Sample-1.jpg](Insurance-Damage-VW-Sample-1.jpg) | **Severe front-left collision — VW Tiguan** | Vehicle identified with high confidence (make, model, colour). Severity `severe`. GBP range in the low four-figures. `reviewRequired: true`. |
| 2 | [Insurance-Damage-BMW-Sample-2.jpg](Insurance-Damage-BMW-Sample-2.jpg) | **Severe front-end damage — BMW** | Make + colour identified with high confidence; model may return `Unknown` depending on the angle. Severity `severe`. `reviewRequired: true` with a "possible hidden damage" warning. |
| 3 | [Insurance-Damage-Crash- Sample-4.png](Insurance-Damage-Crash-%20Sample-4.png) | **Ambiguous vehicle — second car on top** | The model correctly refuses to guess: `make` and `model` return `Unknown`, confidences drop below 0.7, `reviewRequired: true`, warnings mention image ambiguity. Demonstrates the anti-hallucination guard. |
| 4 | [Insurance-Damage-Sample-Morethan4MB-3.jpg](Insurance-Damage-Sample-Morethan4MB-3.jpg) | **Over the 4 MB cap** | The client-side size check refuses the upload before it reaches the API. If bypassed (e.g. via `curl`), the API returns `IMAGE_TOO_LARGE` (HTTP 413). This is Vercel's serverless request-body cap, not an app-imposed limit. |

The `Insurance-Damage-Crash- Sample-4.png` filename keeps its space in the middle — valid but slightly fragile in shell contexts.

---

## Not yet covered — contributions welcome

| Scenario | What it would prove |
| -------- | ------------------- |
| **Undamaged vehicle** | Model returns severity `minor` or `unknown` with an empty affected-areas list; useful control input. |
| **Minor damage** — a scratch or small dent | Severity `minor`, low-hundreds GBP range, `reviewRequired: false` when all confidences ≥ 0.7. |
| **Anti-fraud — non-vehicle** (dog, chair, landscape) | Every field returns `"Unknown"` with 0% confidence, `reviewRequired: true`, warnings explains the image is not a vehicle. |
| **Ambiguous / poor quality** — blurred, dark, extreme angle | Low confidences, warnings mention image quality. |

Drop a JPEG / PNG / WebP file into this folder (**≤ 4 MB**), then add a row to the table above.

---

## Notes on public URLs

The app also accepts a JSON body `{ "imageUrl": "https://…" }`. OpenAI's server-side image fetcher is strict about the source:

- **Unsplash** with the `?w=800&q=80` query string — verified working (see the smoke test script).
- **Wikimedia / Wikipedia** thumbnails — Wikimedia rejects the OpenAI fetcher's User-Agent. The app degrades gracefully to `IMAGE_FETCH_FAILED`.

Prefer a local file upload when a scenario needs a specific look.
