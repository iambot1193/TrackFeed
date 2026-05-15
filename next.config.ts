import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false,
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
