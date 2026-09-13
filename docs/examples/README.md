# Sample assessment scenarios

Curated demo inputs for the [live prototype](https://ai-vehicle-claims-prototype-p6sy.vercel.app). Each row represents a scenario the assessment pipeline should handle. Use these when demonstrating the app end-to-end.

Two ways to feed each scenario into the app:

- **File upload** — download the local image (when available) and use the **Choose File** button.
- **Public URL** — paste the URL into the **Or paste a public image URL** field.

---

## Scenario catalog

| # | Scenario | Expected result | File | Public URL |
| - | -------- | --------------- | ---- | ---------- |
| 1 | **Undamaged vehicle** — reference / control input | Vehicle identified with high confidence, damage `severity: minor` or `unknown` with an empty affected-areas array, human review flag surfaced when the model isn't certain damage is absent | _add local image_ | https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80 |
| 2 | **Minor damage** — scratch, small dent, or scuffed bumper | `severity: minor`, low-hundreds GBP range, `reviewRequired: false` when all confidences ≥ 0.7 | _add local image_ | _add public URL_ |
| 3 | **Moderate damage** — dented panel, cracked bumper, broken headlight | `severity: moderate`, mid four-figure GBP range, `reviewRequired: true` when hidden damage is plausible | _add local image_ | _add public URL_ |
| 4 | **Severe damage** — front-end collision, deployed airbags, structural deformation | `severity: severe`, top of the GBP range, `reviewRequired: true` always | _add local image_ | _add public URL_ |
| 5 | **Anti-fraud — non-vehicle** (dog, chair, landscape, etc.) | Every field returns `"Unknown"` with 0% confidence, `reviewRequired: true`, `warnings` explains the image is not a vehicle | _add local image_ | _add public URL_ |
| 6 | **Ambiguous / poor quality** — blurred, dark, extreme angle | Low confidences (< 0.7), `reviewRequired: true`, warnings mention image quality | _add local image_ | _add public URL_ |

---

## Notes on public URLs

The OpenAI image fetcher is strict about the source. Verified working:

- **Unsplash** with the `?w=800&q=80` query string — confirmed against the smoke test.

Known-failing (documented as `IMAGE_FETCH_FAILED` in the app):

- **Wikimedia / Wikipedia** thumbnails — Wikimedia rejects the OpenAI fetcher's User-Agent.

If a scenario needs a specific look, prefer a local file upload over a URL.

---

## Adding new samples

1. Drop the image file into this folder. Keep filenames short and descriptive: `01-undamaged-honda-civic.jpg`, `04-severe-collision-bmw.jpg`, `05-antifraud-dog.jpg`.
2. Keep each file under **4 MB** — that is the API cap.
3. Update the table above: fill the **File** cell with a repo-relative link (e.g. `[01-undamaged.jpg](01-undamaged-honda-civic.jpg)`) and add a Public URL if you have one.
4. Commit with a message such as `docs: add sample scenario N — <short description>`.

Images in this folder are intended purely as demo inputs. They are not training data and are never sent to OpenAI unless a user explicitly uploads one from this folder.
