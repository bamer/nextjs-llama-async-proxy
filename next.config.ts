import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "api.example.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
  },
  async redirects() {
    return [
      {
        source: "/old-path",
        destination: "/new-path",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [];
  },
  experimental: {
    optimizeCss: false,
    scrollRestoration: true,
    optimizePackageImports: [
      "@mui/material",
      "@mui/icons-material",
      "@mui/x-charts",
      "lucide-react",
      "framer-motion",
      "@tanstack/react-query",
    ],
  },
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  staticPageGenerationTimeout: 120,
  output: "standalone",
  transpilePackages: ["@mui/material", "@mui/icons-material"],
  compiler: {
    emotion: true,
    styledComponents: true,
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error"],
    } : false,
  },
  headers: async () => {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
