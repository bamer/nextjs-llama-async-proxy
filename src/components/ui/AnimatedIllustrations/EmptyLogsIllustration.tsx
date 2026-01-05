"use client";

import { Box } from "@mui/material";

export function EmptyLogsIllustration() {
  return (
    <Box
      sx={{
        width: 200,
        height: 200,
        position: "relative",
        animation: "float 3s ease-in-out infinite",
        "@keyframes float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      }}
    >
      {/* Document icon */}
      <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
        {/* Background circle */}
        <circle cx="100" cy="100" r="90" fill="rgba(144, 202, 249, 0.1)" />
        <circle cx="100" cy="100" r="75" fill="rgba(144, 202, 249, 0.15)" />

        {/* Document body */}
        <rect
          x="60"
          y="45"
          width="80"
          height="110"
          rx="8"
          fill="#1E3A5F"
          stroke="#4A90D9"
          strokeWidth="2"
        />

        {/* Document lines - animated */}
        <rect x="72" y="65" width="40" height="4" rx="2" fill="#4A90D9">
          <animate
            attributeName="opacity"
            values="0.5;1;0.5"
            dur="2s"
            repeatCount="indefinite"
          />
        </rect>
        <rect x="72" y="77" width="56" height="4" rx="2" fill="#4A90D9">
          <animate
            attributeName="opacity"
            values="0.5;1;0.5"
            dur="2s"
            begin="0.2s"
            repeatCount="indefinite"
          />
        </rect>
        <rect x="72" y="89" width="48" height="4" rx="2" fill="#4A90D9">
          <animate
            attributeName="opacity"
            values="0.5;1;0.5"
            dur="2s"
            begin="0.4s"
            repeatCount="indefinite"
          />
        </rect>
        <rect x="72" y="101" width="52" height="4" rx="2" fill="#4A90D9">
          <animate
            attributeName="opacity"
            values="0.5;1;0.5"
            dur="2s"
            begin="0.6s"
            repeatCount="indefinite"
          />
        </rect>
        <rect x="72" y="113" width="36" height="4" rx="2" fill="#4A90D9">
          <animate
            attributeName="opacity"
            values="0.5;1;0.5"
            dur="2s"
            begin="0.8s"
            repeatCount="indefinite"
          />
        </rect>

        {/* Search icon hint */}
        <circle cx="130" cy="135" r="18" fill="#2E5A8B" />
        <circle cx="130" cy="135" r="8" fill="none" stroke="#4A90D9" strokeWidth="2" />
        <line
          x1="136"
          y1="141"
          x2="142"
          y2="147"
          stroke="#4A90D9"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <animate
            attributeName="stroke-dasharray"
            values="0,100;10,100;0,100"
            dur="3s"
            repeatCount="indefinite"
          />
        </line>

        {/* Floating particles */}
        <circle cx="45" cy="60" r="3" fill="#4A90D9" opacity="0.6">
          <animate
            attributeName="cy"
            values="60;50;60"
            dur="4s"
            repeatCount="indefinite"
          />
          <animate attributeName="opacity" values="0.6;1;0.6" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="155" cy="70" r="2" fill="#4A90D9" opacity="0.4">
          <animate
            attributeName="cy"
            values="70;55;70"
            dur="3s"
            begin="1s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="50" cy="140" r="2.5" fill="#4A90D9" opacity="0.5">
          <animate
            attributeName="cy"
            values="140;130;140"
            dur="3.5s"
            begin="0.5s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </Box>
  );
}
