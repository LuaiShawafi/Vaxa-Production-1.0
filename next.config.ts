import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Prisma on the Node loader path — bundling breaks model delegates (e.g. lotInventoryTransaction).
  serverExternalPackages: ["@prisma/client", "prisma"],
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
