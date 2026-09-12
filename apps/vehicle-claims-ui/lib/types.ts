// Assessment types are inferred from the Zod schema so runtime validation and TypeScript stay in sync.
export type {
  Assessment,
  CostRange,
  Damage,
  RepairEstimate,
  Severity,
  Vehicle,
} from "./assessmentSchema";
