import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false,
  experimental: {
    optimizePackageImports: ["lucide-react"],
    webpackMemoryOptimizations: true,
  },
};

export default nextConfig;
