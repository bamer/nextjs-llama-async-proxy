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
    optimizeCss: true, // ← CHANGE THIS (was false)
    scrollRestoration: true,
    optimizePackageImports: [
      "@mui/material",
      "@mui/material/Box",
      "@mui/material/Card",
      "@mui/material/Typography",
      "@mui/material/Grid",
      "@mui/material/Button",
      "@mui/material/IconButton",
      "@mui/material/Chip",
      "@mui/material/TextField",
      "@mui/material/Select",
      "@mui/material/MenuItem",
      "@mui/material/Checkbox",
      "@mui/material/Pagination",
      "@mui/material/CircularProgress",
      "@mui/material/LinearProgress",
      "@mui/material/Divider",
      "@mui/material/Table",
      "@mui/material/TableBody",
      "@mui/material/TableCell",
      "@mui/material/TableHead",
      "@mui/material/TableRow",
      "@mui/material/Paper",
      "@mui/material/Progress",
      "@mui/material/Skeleton",
      "@mui/icons-material/MaterialIcons",
      "@mui/x-charts",
      "@mui/x-charts/LineChart",
      "@mui/x-charts/ChartsXAxis",
      "@mui/x-charts/ChartsYAxis",
      "@mui/x-charts/ChartsGrid",
      "@mui/x-charts/ChartsTooltip",
      "lucide-react",
      "framer-motion",
      "@tanstack/react-query",
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
