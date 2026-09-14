import { describe, expect, it } from "vitest";
import { parseServerEnv, serverEnvSchema } from "@/lib/validation/env";

describe("serverEnvSchema", () => {
  it("accepts a PostgreSQL connection string", () => {
    const env = parseServerEnv({
      DATABASE_URL: "postgresql://user:pw@127.0.0.1:5433/db?schema=public",
    });

    expect(env.DATABASE_URL).toContain("127.0.0.1:5433");
  });

  it("rejects a non-PostgreSQL connection string", () => {
    const result = serverEnvSchema.safeParse({
      DATABASE_URL: "mysql://user:pw@127.0.0.1:3306/db",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a missing DATABASE_URL", () => {
    expect(() => parseServerEnv({})).toThrow();
  });
});
