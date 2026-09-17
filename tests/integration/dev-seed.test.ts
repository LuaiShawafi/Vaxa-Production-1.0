import { execSync } from "node:child_process";
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("dev seed (prisma/seed.ts)", () => {
  const prisma = new PrismaClient();

  it("does not create legacy demo-only SKUs after import", async () => {
    execSync("npm run db:seed", {
      stdio: "pipe",
      env: process.env,
    });

    const mustard = await prisma.sku.findUnique({
      where: { code: "PU_MUSTARD" },
    });
    expect(mustard === null || mustard.active === false).toBe(true);

    const activeSkuCount = await prisma.sku.count({ where: { active: true } });
    expect(activeSkuCount).toBe(41);

    const red = await prisma.sku.findUnique({
      where: { code: "PU_RED_RADISH" },
    });
    expect(red).not.toBeNull();

    const bom = await prisma.bom.findFirst({
      where: { skuId: red!.id, type: "PROD", active: true },
    });
    expect(bom).not.toBeNull();
    expect(bom!.ready).toBe(true);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
