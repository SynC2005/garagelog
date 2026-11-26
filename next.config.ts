import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentUpgrade: "security",
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;

