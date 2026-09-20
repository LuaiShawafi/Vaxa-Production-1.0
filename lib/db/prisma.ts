import "server-only";
import { PrismaClient } from "@prisma/client";

/*
 * Single server-side Prisma client. Next.js dev hot reload re-evaluates
 * modules, so the client is cached on globalThis to avoid opening a new
 * connection pool per reload. "server-only" makes an import from a client
 * component a build error.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });
}

/** Dev hot reload can keep an old client from before `prisma generate`. */
function isClientInSyncWithSchema(client: PrismaClient): boolean {
  return typeof client.lotInventoryTransaction?.findMany === "function";
}

let cached = globalForPrisma.prisma;
if (cached && !isClientInSyncWithSchema(cached)) {
  cached = undefined;
  globalForPrisma.prisma = undefined;
}

export const prisma = cached ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
