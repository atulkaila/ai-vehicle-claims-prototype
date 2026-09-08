/**
 * Phase 1: Mocked assessment payload.
 *
 * Static example that matches the Assessment contract so the Phase 1 UI
 * can exercise the full results layout without any backend or AI service.
 * Phase 2 replaces this import site with a real fetch call to /api/analyse.
 */
import type { Assessment } from "./types";

export const mockAssessment: Assessment = {
  vehicle: {
    make: "BMW",
    model: "3 Series",
    color: "Black",
    confidence: 0.84,
  },
  damage: {
    summary: "Dent and abrasion to left rear bumper",
    severity: "moderate",
    affectedAreas: ["rear bumper", "left quarter panel"],
    confidence: 0.88,
  },
  repairEstimate: {
    costRange: {
      min: 900,
      max: 1400,
      currency: "GBP",
    },
    assumptions: [
      "No structural damage visible",
      "Estimate based only on visible damage",
    ],
    confidence: 0.58,
  },
  reviewRequired: true,
  warnings: ["Final repair cost requires professional inspection"],
};
