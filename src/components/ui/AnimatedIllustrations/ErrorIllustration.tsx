"use client";

import { Box } from "@mui/material";

export function ErrorIllustration({ size = 120 }: { size?: number }) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        position: "relative",
      }}
    >
      <svg width={size} height={size} viewBox="0 0 120 120">
        {/* Background circle */}
        <circle cx="60" cy="60" r="55" fill="rgba(244, 67, 54, 0.1)" />

        {/* Error circle */}
        <circle cx="60" cy="60" r="45" fill="#3D1B1B" stroke="#F44336" strokeWidth="2" />

        {/* X mark */}
        <g stroke="#F44336" strokeWidth="4" strokeLinecap="round">
          <line x1="42" y1="42" x2="78" y2="78">
            <animate
              attributeName="stroke-dasharray"
              values="0,60;60,0;0,60"
              dur="0.6s"
              fill="freeze"
            />
          </line>
          <line x1="78" y1="42" x2="42" y2="78">
            <animate
              attributeName="stroke-dasharray"
              values="0,60;60,0;0,60"
              dur="0.6s"
              begin="0.2s"
              fill="freeze"
            />
          </line>
        </g>

        {/* Pulse ring */}
        <circle cx="60" cy="60" r="45" fill="none" stroke="#F44336" strokeWidth="2" opacity="0">
          <animate
            attributeName="r"
            values="45;60;45"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.6;0;0.6"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Floating particles */}
        <circle cx="35" cy="35" r="2" fill="#F44336" opacity="0.6">
          <animate
            attributeName="cy"
            values="35;25;35"
            dur="3s"
            repeatCount="indefinite"
          />
          <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="85" cy="30" r="1.5" fill="#F44336" opacity="0.5">
          <animate
            attributeName="cy"
            values="30;20;30"
            dur="2.5s"
            begin="0.5s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="30" cy="75" r="2" fill="#F44336" opacity="0.4">
          <animate
            attributeName="cx"
            values="30;25;30"
            dur="2.8s"
            begin="1s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </Box>
  );
}
