/**
 * Phase 1: Customer-facing assessment screen.
 *
 * The entire Phase 1 experience is implemented in this single client component:
 *   - File upload (JPEG / PNG / WebP up to 10 MB) OR image URL (mutually exclusive)
 *   - Local validation and image preview with object-URL cleanup
 *   - Disabled "Analyse damage" button until the input is valid
 *   - Simulated analysis delay backed by the typed mock Assessment
 *   - Full results view (vehicle, damage, estimate, warnings, review status)
 *   - Reset / analyse-another-image path
 *
 * No API call, AI SDK, persistence, or credentials are used. Phase 2 will replace
 * the mock and simulated delay with a real /api/analyse fetch.
 */
"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import type { Assessment, Severity } from "@/lib/types";
import { mockAssessment } from "@/lib/mockAssessment";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;
const SIMULATED_ANALYSIS_MS = 1500;

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [result, setResult] = useState<Assessment | null>(null);

  const objectUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const revokeCurrentObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const clearPreviewAndResult = () => {
    setPreviewSrc(null);
    setResult(null);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setResult(null);
    const selected = event.target.files?.[0] ?? null;

    if (!selected) {
      revokeCurrentObjectUrl();
      setFile(null);
      clearPreviewAndResult();
      setValidationError(null);
      return;
    }

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      revokeCurrentObjectUrl();
      setFile(null);
      clearPreviewAndResult();
      setValidationError("Unsupported file type. Use JPEG, PNG, or WebP.");
      return;
    }

    if (selected.size > MAX_BYTES) {
      revokeCurrentObjectUrl();
      setFile(null);
      clearPreviewAndResult();
      setValidationError("Image exceeds the 10 MB limit.");
      return;
    }

    revokeCurrentObjectUrl();
    const nextObjectUrl = URL.createObjectURL(selected);
    objectUrlRef.current = nextObjectUrl;

    setFile(selected);
    setUrl("");
    setPreviewSrc(nextObjectUrl);
    setValidationError(null);
  };

  const handleUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setResult(null);
    setUrl(next);

    if (file) {
      revokeCurrentObjectUrl();
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }

    if (!next) {
      setPreviewSrc(null);
      setValidationError(null);
      return;
    }

    try {
      const parsed = new URL(next);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        setPreviewSrc(null);
        setValidationError("URL must use http or https.");
        return;
      }
      setPreviewSrc(next);
      setValidationError(null);
    } catch {
      setPreviewSrc(null);
      setValidationError("Enter a valid image URL.");
    }
  };

  const canAnalyse =
    !isAnalysing &&
    !validationError &&
    (file !== null || (url.length > 0 && previewSrc !== null));

  const handleAnalyse = () => {
    if (!canAnalyse) return;
    setIsAnalysing(true);
    setResult(null);
    window.setTimeout(() => {
      setResult(mockAssessment);
      setIsAnalysing(false);
    }, SIMULATED_ANALYSIS_MS);
  };

  const handleReset = () => {
    revokeCurrentObjectUrl();
    setFile(null);
    setUrl("");
    setPreviewSrc(null);
    setValidationError(null);
    setIsAnalysing(false);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Vehicle Damage Assessment
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Upload a photo of a damaged vehicle or paste an image URL to receive
            a preliminary, AI-assisted assessment. Results are indicative and
            require professional review.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold">Provide an image</h2>
            <p className="mt-1 text-xs text-slate-500">
              Use one input method. Selecting one clears the other.
            </p>

            <div className="mt-4">
              <label className="block text-sm font-medium" htmlFor="image-file">
                Upload image
              </label>
              <input
                id="image-file"
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                disabled={isAnalysing}
                className="mt-1 block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800 disabled:opacity-50"
              />
              <p className="mt-1 text-xs text-slate-500">
                JPEG, PNG, or WebP up to 10 MB.
              </p>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium" htmlFor="image-url">
                Or image URL
              </label>
              <input
                id="image-url"
                type="url"
                inputMode="url"
                placeholder="https://example.com/car.jpg"
                value={url}
                onChange={handleUrlChange}
                disabled={isAnalysing}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:opacity-50"
              />
            </div>

            {validationError && (
              <p
                role="alert"
                className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {validationError}
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleAnalyse}
                disabled={!canAnalyse}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAnalysing ? "Analysing…" : "Analyse damage"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={isAnalysing}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Reset
              </button>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              This is a preliminary AI-assisted assessment. Only visible damage
              can be considered. Hidden or structural damage may not be detected.
              Final decisions require professional inspection.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold">Preview</h2>
            <div className="mt-3 flex aspect-video items-center justify-center overflow-hidden rounded-md border border-dashed border-slate-300 bg-slate-50">
              {previewSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewSrc}
                  alt="Selected vehicle preview"
                  className="h-full w-full object-contain"
                  onError={() =>
                    setValidationError(
                      "The image could not be displayed. Check the URL or upload the file directly.",
                    )
                  }
                />
              ) : (
                <p className="text-sm text-slate-400">No image selected</p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8" aria-live="polite">
          {isAnalysing && (
            <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
              Analysing vehicle damage…
            </div>
          )}

          {result && !isAnalysing && <Results assessment={result} />}
        </section>
      </div>
    </main>
  );
}

function Results({ assessment }: { assessment: Assessment }) {
  const { vehicle, damage, repairEstimate, reviewRequired, warnings } =
    assessment;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium">Assessment complete</p>
        <span
          className={
            "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium " +
            (reviewRequired
              ? "bg-amber-100 text-amber-800"
              : "bg-emerald-100 text-emerald-800")
          }
        >
          {reviewRequired ? "Human review required" : "No review required"}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Vehicle" confidence={vehicle.confidence}>
          <Field label="Make" value={vehicle.make} />
          <Field label="Model" value={vehicle.model} />
          <Field label="Colour" value={vehicle.color} />
        </Card>

        <Card title="Damage" confidence={damage.confidence}>
          <Field label="Summary" value={damage.summary} />
          <Field
            label="Severity"
            value={<SeverityBadge severity={damage.severity} />}
          />
          <Field
            label="Affected areas"
            value={
              <ul className="list-disc pl-4">
                {damage.affectedAreas.map((area) => (
                  <li key={area}>{area}</li>
                ))}
              </ul>
            }
          />
        </Card>

        <Card title="Repair estimate" confidence={repairEstimate.confidence}>
          <Field
            label="Cost range"
            value={`${formatMoney(
              repairEstimate.costRange.min,
              repairEstimate.costRange.currency,
            )} – ${formatMoney(
              repairEstimate.costRange.max,
              repairEstimate.costRange.currency,
            )}`}
          />
          <Field
            label="Assumptions"
            value={
              <ul className="list-disc pl-4">
                {repairEstimate.assumptions.map((assumption) => (
                  <li key={assumption}>{assumption}</li>
                ))}
              </ul>
            }
          />
        </Card>
      </div>

      {warnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-semibold text-amber-900">Warnings</h3>
          <ul className="mt-2 list-disc pl-5 text-sm text-amber-900">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Card({
  title,
  confidence,
  children,
}: {
  title: string;
  confidence: number;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <ConfidenceBadge value={confidence} />
      </div>
      <div className="mt-3 space-y-3 text-sm">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 text-slate-800">{value}</div>
    </div>
  );
}

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const tone =
    pct >= 80
      ? "bg-emerald-100 text-emerald-800"
      : pct >= 60
        ? "bg-amber-100 text-amber-800"
        : "bg-red-100 text-red-800";
  return (
    <span
      className={"rounded-full px-2 py-0.5 text-xs font-medium " + tone}
      title="Model-reported confidence; not a calibrated probability."
    >
      Confidence {pct}%
    </span>
  );
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const tone =
    severity === "severe"
      ? "bg-red-100 text-red-800"
      : severity === "moderate"
        ? "bg-amber-100 text-amber-800"
        : severity === "minor"
          ? "bg-emerald-100 text-emerald-800"
          : "bg-slate-100 text-slate-700";
  return (
    <span
      className={
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize " +
        tone
      }
    >
      {severity}
    </span>
  );
}

function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value}`;
  }
}
