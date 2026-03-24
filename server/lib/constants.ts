// server/lib/constants.ts
// Shared backend constants — single source of truth for values used across routes.

export const FACTOR_TYPES = [
  "Institutional",
  "Technical",
  "Infrastructure",
  "Learning Resources",
  "Environmental",
  "Others",
] as const;

export type FactorType = typeof FACTOR_TYPES[number];
