import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Artists upload mixes and photos through Server Actions.
      bodySizeLimit: "30mb",
    },
  },
};

export default nextConfig;
