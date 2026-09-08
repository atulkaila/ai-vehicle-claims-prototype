/**
 * Phase 1: Assessment response contract.
 *
 * TypeScript representation of the JSON response shape defined in
 * docs/Spec.md (sections 6 and 7). Used by the mocked Phase 1 data and
 * by the results UI. Phase 2 will populate the same shape from the
 * real /api/analyse endpoint, so this file is the future frontend contract.
 */

export type Severity = "minor" | "moderate" | "severe" | "unknown";

export interface Vehicle {
  make: string;
  model: string;
  color: string;
  confidence: number;
}

export interface Damage {
  summary: string;
  severity: Severity;
  affectedAreas: string[];
  confidence: number;
}

export interface CostRange {
  min: number;
  max: number;
  currency: string;
}

export interface RepairEstimate {
  costRange: CostRange;
  assumptions: string[];
  confidence: number;
}

export interface Assessment {
  vehicle: Vehicle;
  damage: Damage;
  repairEstimate: RepairEstimate;
  reviewRequired: boolean;
  warnings: string[];
}
