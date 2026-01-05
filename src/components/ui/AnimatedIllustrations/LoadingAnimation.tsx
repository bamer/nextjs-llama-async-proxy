"use client";

import { Box } from "@mui/material";

interface LoadingAnimationProps {
  size?: number;
  color?: string;
}

export function LoadingAnimation({ size = 60, color = "#4A90D9" }: LoadingAnimationProps) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        position: "relative",
        animation: "pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "@keyframes pulse-ring": {
          "0%": { transform: "scale(0.8)", opacity: 1 },
          "50%": { transform: "scale(1)", opacity: 0.5 },
          "100%": { transform: "scale(0.8)", opacity: 1 },
        },
      }}
    >
      <svg width={size} height={size} viewBox="0 0 60 60">
        <circle
          cx="30"
          cy="30"
          r="25"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="40 140"
          transform="rotate(-90 30 30)"
        >
          <animate
            attributeName="stroke-dasharray"
            values="40 140;120 60;40 140"
            dur="1.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-dashoffset"
            values="0;-100;0"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </Box>
  );
}

export function DotsLoading({ color = "#4A90D9" }: { color?: string }) {
  return (
    <Box sx={{ display: "flex", gap: 0.5 }}>
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: color,
            animation: "bounce 1.4s ease-in-out infinite",
            animationDelay: `${i * 0.16}s`,
            "@keyframes bounce": {
              "0%, 80%, 100%": { transform: "scale(0.6)", opacity: 0.4 },
              "40%": { transform: "scale(1)", opacity: 1 },
            },
          }}
        />
      ))}
    </Box>
  );
}

export function WaveformLoading({ color = "#4A90D9" }: { color?: string }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        height: 32,
      }}
    >
      {[0.5, 1, 0.7, 1.2, 0.9, 1, 0.6].map((height, i) => (
        <Box
          key={i}
          sx={{
            width: 4,
            borderRadius: 2,
            backgroundColor: color,
            animation: "wave 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.1}s`,
            height: `${height * 12}px`,
            "@keyframes wave": {
              "0%, 100%": { transform: "scaleY(0.5)" },
              "50%": { transform: "scaleY(1)" },
            },
          }}
        />
      ))}
    </Box>
  );
}
