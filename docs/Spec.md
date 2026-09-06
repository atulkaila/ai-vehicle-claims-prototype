# AI Vehicle Claims Prototype — Product & Technical Specification

## 1. Objective

Build a lightweight, customer-ready AI prototype that allows a user to submit a photograph of a damaged vehicle and receive an AI-assisted vehicle damage assessment.

The prototype should demonstrate an end-to-end workflow that:

- accepts an uploaded vehicle image or image URL;
- identifies available vehicle metadata;
- describes visible vehicle damage;
- estimates a preliminary repair cost range;
- communicates uncertainty through confidence indicators, warnings and assumptions;
- identifies cases that may require human review.

The primary objective is to validate the customer experience and technical feasibility quickly rather than build a production claims-management platform.

---

## 2. User Journey

### Primary user

Insurance claims assessor / vehicle damage reviewer.

### User journey

1. User opens the web application.
2. User provides a vehicle image by:
   - uploading an image file; or
   - providing an image URL.
3. The application displays an image preview.
4. User selects **Analyse Damage**.
5. The application sends the image to the server-side analysis API.
6. The multimodal AI model analyses:
   - vehicle characteristics;
   - visible damage;
   - likely affected areas;
   - severity;
   - preliminary repair-cost range.
7. The server validates and structures the model response.
8. The application displays:
   - vehicle metadata;
   - damage assessment;
   - affected areas;
   - severity;
   - repair estimate;
   - confidence indicators;
   - assumptions;
   - warnings;
   - human-review requirement.
9. The assessor uses the information as decision support rather than as an autonomous claims decision.

---

## 3. MVP Scope

The MVP will include:

### Image input

- Upload vehicle image from local device.
- Provide publicly accessible image URL.
- Preview selected image before analysis.

### Vehicle identification

Return:

- make;
- model;
- colour;
- confidence.

### Damage assessment

Return:

- textual damage summary;
- severity;
- affected areas;
- confidence.

### Repair estimate

Return:

- minimum estimated cost;
- maximum estimated cost;
- currency;
- assumptions;
- confidence.

### Decision-support information

Return:

- `reviewRequired`;
- warnings.

### Application behaviour

- loading state while analysis runs;
- validation errors for invalid input;
- customer-friendly results display;
- server-side AI invocation;
- structured and schema-validated AI response.

---

## 4. Out of Scope

The MVP will deliberately not implement:

- claims history;
- persistent image storage;
- user authentication;
- claims-system integration;
- automatic claim approval or denial;
- repair-shop integration;
- vehicle-parts pricing catalogue;
- labour-rate databases;
- payment processing;
- production RBAC;
- enterprise audit logging;
- full observability platform;
- production-grade evaluation pipeline;
- model routing;
- multi-agent orchestration.

These capabilities are candidates for later production phases.

The prototype is intentionally stateless unless persistence becomes necessary during development.

---

## 5. Architecture

The MVP uses a single full-stack application to minimise integration overhead and accelerate delivery.

### High-level flow

User  
→ Next.js user interface  
→ server-side `/api/analyse` endpoint  
→ multimodal AI model  
→ structured response  
→ schema validation  
→ results UI

The browser does not call the AI service directly.

AI credentials remain server-side.

The MVP architecture is documented here:

![MVP Architecture](architecture_mvp.svg)

The broader architecture evolution is documented here:

![Architecture Evolution](architecture_3_phase.svg)

### Key architectural decisions

#### Single full-stack application

Next.js is used for both the user interface and server-side API.

This avoids creating and deploying separate front-end and back-end applications during the MVP.

#### No persistent storage

Images and analysis results do not need to be stored to validate the initial customer workflow.

This reduces implementation complexity and avoids unnecessary data-retention concerns.

#### Single multimodal model

The MVP uses a vision-capable multimodal model to perform vehicle recognition, damage interpretation and preliminary estimate reasoning in a single analysis flow.

A production system may decompose these responsibilities into specialised components or external pricing services.

#### Structured AI output

The model must return structured data rather than free-form prose.

The application validates the model output before displaying it to the user.

---

## 6. Data Model

The analysis response will contain three main sections:

- `vehicle`
- `damage`
- `repairEstimate`

It will also contain cross-cutting decision-support fields:

- `reviewRequired`
- `warnings`

### Proposed response

```json
{
  "vehicle": {
    "make": "BMW",
    "model": "3 Series",
    "color": "Black",
    "confidence": 0.84
  },
  "damage": {
    "summary": "Dent and abrasion to left rear bumper",
    "severity": "moderate",
    "affectedAreas": [
      "rear bumper",
      "left quarter panel"
    ],
    "confidence": 0.88
  },
  "repairEstimate": {
    "costRange": {
      "min": 900,
      "max": 1400,
      "currency": "GBP"
    },
    "assumptions": [
      "No structural damage visible",
      "Estimate based only on visible damage"
    ],
    "confidence": 0.58
  },
  "reviewRequired": true,
  "warnings": [
    "Final repair cost requires professional inspection"
  ]
}

## 7. API Contract

### Endpoint

`POST /api/analyse`

The endpoint accepts either:

1. An uploaded image file.
2. A publicly accessible image URL.

Only one input source should be supplied per request.

---

### Request Option 1 — File Upload

Content type:

`multipart/form-data`

Field:

`image`

Example:

```text
image: <uploaded file>

Supported file types:

- JPEG
- PNG
- WebP

Maximum file size:

- 10 MB

---

### Request Option 2 — Image URL

Content type:

`application/json`

Example:

```json
{
  "imageUrl": "https://example.com/car.jpg"
}   


Then add **Section 8 — UI Behaviour**:

```markdown
## 8. UI Behaviour

The MVP will use a single-page interface.

### Initial State

The page should display:

- application title and short description;
- image upload control;
- image URL input;
- image preview area;
- Analyse Damage button;
- brief disclaimer explaining that results are AI-generated preliminary assessments.

The Analyse Damage button should remain disabled until a valid image file or image URL is provided.

### Image Input Behaviour

The user may either:

- upload an image file; or
- provide an image URL.

Only one input method should be active at a time.

Selecting a local file should clear the URL input.

Entering an image URL should clear any selected local file.

### Preview

Before analysis, the selected vehicle image should be shown to the user where possible.

### Loading State

After the user selects Analyse Damage:

- disable the Analyse Damage button;
- display a clear loading indicator;
- show a message such as `Analysing vehicle damage...`;
- prevent duplicate submissions.

### Results State

Successful analysis should display:

#### Vehicle

- make;
- model;
- colour;
- confidence.

#### Damage

- summary;
- severity;
- affected areas;
- confidence.

#### Repair Estimate

- estimated cost range;
- currency;
- assumptions;
- confidence.

#### Decision Support

- whether human review is required;
- warnings.

### Confidence Presentation

Confidence should be presented as a supporting indicator rather than a guarantee of accuracy.

Low-confidence results should be visually clear and may contribute to `reviewRequired`.

### Disclaimer

The user interface should clearly state that:

- the assessment is AI-generated;
- only visible damage can be assessed;
- hidden or structural damage may not be identifiable;
- the repair estimate is preliminary;
- final repair decisions require professional assessment.


## 9. Error Handling

The application should provide clear and user-friendly error messages.

### Client-Side Validation

Validate before sending the request where possible.

Examples:

- no image provided;
- unsupported file type;
- file exceeds 10 MB;
- invalid URL format.

### Server-Side Validation

The server must independently validate all requests even if client-side validation has already occurred.

### Image Fetch Failure

If an external image URL cannot be retrieved, return `IMAGE_FETCH_FAILED`.

The user should be prompted to check the URL or upload the image directly.

### AI Service Failure

If the model service is unavailable or returns an error:

- return `MODEL_ERROR`;
- show a generic customer-friendly message;
- do not expose credentials, provider details, stack traces or raw API errors.

### Invalid Model Output

If the model response does not match the expected schema:

- return `INVALID_MODEL_RESPONSE`;
- do not render partially validated results.

### Unexpected Errors

Unexpected server errors should return `INTERNAL_ERROR`.

The user should see a generic retry message.

### Retry Behaviour

The MVP may allow the user to retry manually after an error.

Automatic retry logic is not required for the initial prototype.

## 10. Acceptance Criteria

The MVP is complete when the following criteria are met.

### Input

- User can upload a JPEG, PNG or WebP image.
- User can provide a valid public image URL.
- User can preview the selected image.
- Invalid inputs are rejected with a clear message.

### Analysis

- The application sends the image to the server-side analysis endpoint.
- The server calls a multimodal AI model.
- The AI response is returned in the defined structured format.
- The response is validated before being displayed.

### Output

The application displays:

- vehicle make;
- vehicle model;
- vehicle colour;
- vehicle confidence;
- damage summary;
- severity;
- affected areas;
- damage confidence;
- repair cost range;
- repair estimate confidence;
- assumptions;
- warnings;
- review-required status.

### User Experience

- Loading state is visible during analysis.
- Duplicate submissions are prevented during processing.
- Errors are displayed clearly.
- Results appear on the same page as the submitted image.
- The user can submit another image after completing an assessment.

### Security

- AI credentials are never exposed to the browser.
- No API keys or secrets are committed to source control.
- Uploaded images are not persisted by the MVP unless explicitly required.

### Documentation

- README includes setup instructions.
- README includes architecture overview.
- Architecture diagrams are included in `/docs`.
- Project specification is documented in `docs/Spec.md`.