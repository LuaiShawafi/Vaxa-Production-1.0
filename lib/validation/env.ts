import { z } from "zod";

/**
 * Server-side environment contract. Kept separate from domain validation so a
 * misconfigured deployment fails with a clear message instead of a driver
 * error at the first query.
 */
export const serverEnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine(
      (value) =>
        value.startsWith("postgresql://") || value.startsWith("postgres://"),
      "DATABASE_URL must be a PostgreSQL connection string",
    ),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(
  source: Record<string, string | undefined> = process.env,
): ServerEnv {
  return serverEnvSchema.parse({ DATABASE_URL: source.DATABASE_URL });
}
