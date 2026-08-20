import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false,
  poweredByHeader: false, // remove o X-Powered-By: Next.js (fingerprint)
  experimental: {
    optimizePackageImports: ["lucide-react"],
    webpackMemoryOptimizations: true,
  },
  async headers() {
    // Headers de segurança aplicados a todas as rotas.
    // CSP fica de fora de propósito: as imagens vêm de domínios de notícia arbitrários
    // e uma política restritiva quebraria o feed sem uma allowlist que não dá para prever.
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" }, // anti-clickjacking
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
