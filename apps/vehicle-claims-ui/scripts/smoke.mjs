// Phase 2 smoke test: prove OpenAI vision + JSON output work before wiring the full API.
// Run from apps/vehicle-claims-ui:  node scripts/smoke.mjs

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";

const here = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(here, "..", ".env.local");

for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

if (!process.env.OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY in .env.local");
  process.exit(1);
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
const imageUrl =
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80";

console.log(`Model: ${model}`);
console.log(`Image: ${imageUrl}`);
console.log("Calling OpenAI...");

const started = Date.now();
let response;
try {
  response = await client.chat.completions.create({
    model,
    max_tokens: 200,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          'Return strict JSON only: {"make": string, "model": string, "color": string, "notes": string}.',
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Identify this vehicle." },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
  });
} catch (err) {
  console.error("\n--- OpenAI call FAILED ---");
  console.error(`status:  ${err?.status}`);
  console.error(`code:    ${err?.code}`);
  console.error(`type:    ${err?.type}`);
  console.error(`message: ${err?.message}`);
  if (err?.error) {
    console.error(`error object:\n${JSON.stringify(err.error, null, 2)}`);
  }
  process.exit(1);
}

const ms = Date.now() - started;
const raw = response.choices[0]?.message?.content ?? "";
console.log(`\nLatency: ${ms} ms`);
console.log(`Tokens: prompt=${response.usage?.prompt_tokens} completion=${response.usage?.completion_tokens}`);
console.log(`Raw response:\n${raw}`);

try {
  const parsed = JSON.parse(raw);
  console.log(`\nParsed OK. make=${parsed.make} model=${parsed.model} color=${parsed.color}`);
  console.log("\nSMOKE TEST PASSED");
} catch (err) {
  console.error("\nSMOKE TEST FAILED: response was not valid JSON.");
  process.exit(1);
}
