import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CRITICAL FIX #1: DISABLE EXCESSIVE NEXT.JS LOGGING
  devIndicators: false, // ↓ DISABLE Next.js debug logging

  // CRITICAL FIX #2: ENABLE REACT STRICT MODE FOR BETTER PERFORMANCE
  reactStrictMode: true, // ↓ ENABLE STRICT MODE (better error detection & performance)
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
    // Turbopack file system caching for faster startup and rebuild times
    turbopackFileSystemCacheForDev: true, // Cache dev builds to disk for faster restarts
    turbopackFileSystemCacheForBuild: true, // Cache production builds to disk for faster rebuilds

    optimizeCss: true, // Optimize CSS imports and remove unused styles

    scrollRestoration: true, // Preserve scroll position between page navigations

    // Simplified package imports: Only top-level packages for better tree-shaking
    // Turbopack will automatically tree-shake individual components at build time
    optimizePackageImports: [
      "@mui/material", // All MUI Material components (Box, Card, Typography, etc.)
      "@mui/x-charts", // All MUI Charts components (LineChart, BarChart, etc.)
      "lucide-react", // All Lucide icons
      "framer-motion", // All Framer Motion animation utilities
      "@tanstack/react-query", // All React Query hooks and utilities
    ],
  },
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  staticPageGenerationTimeout: 120,
  output: "standalone",
  transpilePackages: [], // ← CHANGE THIS (was ["@mui/material", "@mui/icons-material"])
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
