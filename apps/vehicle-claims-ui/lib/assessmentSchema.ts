import { z } from "zod";

export const severitySchema = z.enum(["minor", "moderate", "severe", "unknown"]);

export const vehicleSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  color: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export const damageSchema = z.object({
  summary: z.string().min(1),
  severity: severitySchema,
  affectedAreas: z.array(z.string().min(1)),
  confidence: z.number().min(0).max(1),
});

export const costRangeSchema = z
  .object({
    min: z.number().nonnegative(),
    max: z.number().nonnegative(),
    currency: z.string().length(3),
  })
  .refine((c) => c.max >= c.min, { message: "max must be greater than or equal to min" });

export const repairEstimateSchema = z.object({
  costRange: costRangeSchema,
  assumptions: z.array(z.string().min(1)),
  confidence: z.number().min(0).max(1),
});

export const assessmentSchema = z.object({
  vehicle: vehicleSchema,
  damage: damageSchema,
  repairEstimate: repairEstimateSchema,
  reviewRequired: z.boolean(),
  warnings: z.array(z.string()),
});

export type Severity = z.infer<typeof severitySchema>;
export type Vehicle = z.infer<typeof vehicleSchema>;
export type Damage = z.infer<typeof damageSchema>;
export type CostRange = z.infer<typeof costRangeSchema>;
export type RepairEstimate = z.infer<typeof repairEstimateSchema>;
export type Assessment = z.infer<typeof assessmentSchema>;
