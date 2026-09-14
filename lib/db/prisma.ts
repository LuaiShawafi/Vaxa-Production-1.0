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

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
