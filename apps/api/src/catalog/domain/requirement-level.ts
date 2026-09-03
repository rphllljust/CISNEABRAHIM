export const REQUIREMENT_LEVELS = ['REQUIRED', 'OPTIONAL', 'CONDITIONAL'] as const;
export type RequirementLevel = (typeof REQUIREMENT_LEVELS)[number];