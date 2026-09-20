/** V1 production-floor quantity unit for seeding. */
export const PRODUCTION_UOM = "trays";

export const TEAM_402_NAME = "402";

/** V1 allowed PlanItem.destinationIdentity values (no Destination table). */
export const ALLOWED_DESTINATIONS = [
  "402",
  "406",
  "408",
  "410",
  "412",
  "414",
  "416",
  "418",
  "420",
  "422",
] as const;

export type AllowedDestination = (typeof ALLOWED_DESTINATIONS)[number];
