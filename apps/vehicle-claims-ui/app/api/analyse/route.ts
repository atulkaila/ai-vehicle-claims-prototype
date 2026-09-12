import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { assessmentSchema } from "@/lib/assessmentSchema";

export const runtime = "nodejs";
export const maxDuration = 60;

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 4 * 1024 * 1024;

const SYSTEM_PROMPT = `You are a professional vehicle damage assessor for a UK insurance company. Analyse the provided vehicle photograph and return a JSON object matching this exact schema:

{
  "vehicle": { "make": string, "model": string, "color": string, "confidence": number },
  "damage": {
    "summary": string,
    "severity": "minor" | "moderate" | "severe" | "unknown",
    "affectedAreas": string[],
    "confidence": number
  },
  "repairEstimate": {
    "costRange": { "min": number, "max": number, "currency": "GBP" },
    "assumptions": string[],
    "confidence": number
  },
  "reviewRequired": boolean,
  "warnings": string[]
}

Rules:
- All confidence values are decimals between 0 and 1 representing your certainty for that specific field.
- Cost is a preliminary GBP range based only on visible damage, standard UK labour rates, and no hidden structural damage.
- "affectedAreas" lists the specific damaged panels or regions (for example "front bumper", "left front door", "rear quarter panel").
- "assumptions" lists the estimation caveats (for example "No hidden structural damage", "Standard UK labour rates assumed", "OEM parts pricing").
- "warnings" mention any limitations such as image quality, occluded views, ambiguity, or the possibility of hidden damage.
- Set "reviewRequired" to true when severity is "severe", when any confidence is below 0.7, when hidden damage is plausible, or when the image is ambiguous.
- If the image is not a vehicle or is unclear, still return the JSON object: use "Unknown" for text fields, severity "unknown", empty arrays where nothing is applicable, low confidences, reviewRequired true, and appropriate warnings.
- Return ONLY the JSON object. No markdown, no code fences, no commentary before or after.`;

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function isSafePublicUrl(raw: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host.endsWith(".localhost") ||
    host === "169.254.169.254" ||
    host.startsWith("127.") ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  ) {
    return false;
  }
  return true;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return errorResponse("INTERNAL_ERROR", "Analysis service is not configured.", 500);
  }
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const contentType = request.headers.get("content-type") ?? "";

  let imagePayload: string;

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const image = form.get("image");
      if (!(image instanceof File)) {
        return errorResponse("INVALID_INPUT", "Provide an image file in the 'image' field.", 400);
      }
      if (!ACCEPTED_TYPES.has(image.type)) {
        return errorResponse("INVALID_IMAGE", "Only JPEG, PNG, or WebP images are supported.", 400);
      }
      if (image.size > MAX_BYTES) {
        return errorResponse("IMAGE_TOO_LARGE", "Image exceeds the 4 MB limit.", 413);
      }
      const bytes = Buffer.from(await image.arrayBuffer());
      imagePayload = `data:${image.type};base64,${bytes.toString("base64")}`;
    } else if (contentType.includes("application/json")) {
      const body = (await request.json()) as { imageUrl?: unknown };
      const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
      if (!imageUrl) {
        return errorResponse("INVALID_INPUT", "Provide an 'imageUrl' string in the JSON body.", 400);
      }
      if (!isSafePublicUrl(imageUrl)) {
        return errorResponse("INVALID_URL", "The image URL must be a public http or https URL.", 400);
      }
      imagePayload = imageUrl;
    } else {
      return errorResponse(
        "INVALID_INPUT",
        "Send multipart/form-data with an 'image' file, or JSON with an 'imageUrl'.",
        400,
      );
    }
  } catch {
    return errorResponse("INVALID_INPUT", "Could not read the request body.", 400);
  }

  const client = new OpenAI({ apiKey, timeout: 45_000 });

  let raw: string;
  try {
    const completion = await client.chat.completions.create({
      model,
      max_tokens: 800,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyse this vehicle for damage and return the JSON assessment.",
            },
            { type: "image_url", image_url: { url: imagePayload } },
          ],
        },
      ],
    });
    raw = completion.choices[0]?.message?.content ?? "";
  } catch (err) {
    const status = (err as { status?: number })?.status;
    if (status === 400) {
      return errorResponse(
        "IMAGE_FETCH_FAILED",
        "The image could not be read by the model. Check the file or URL and try again.",
        400,
      );
    }
    return errorResponse("MODEL_ERROR", "The analysis service is temporarily unavailable.", 502);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return errorResponse(
      "INVALID_MODEL_RESPONSE",
      "The AI response could not be parsed. Please retry.",
      502,
    );
  }

  const result = assessmentSchema.safeParse(parsed);
  if (!result.success) {
    return errorResponse(
      "INVALID_MODEL_RESPONSE",
      "The AI response did not match the expected schema.",
      502,
    );
  }

  return NextResponse.json(result.data);
}
