"use client";

import { Box } from "@mui/material";

export function SuccessIllustration({ size = 120 }: { size?: number }) {
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
        <circle cx="60" cy="60" r="55" fill="rgba(76, 175, 80, 0.1)" />

        {/* Success circle */}
        <circle cx="60" cy="60" r="45" fill="#1B3D1E" stroke="#4CAF50" strokeWidth="2" />

        {/* Checkmark */}
        <polyline
          points="40,60 52,72 80,44"
          fill="none"
          stroke="#4CAF50"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="60"
          strokeDashoffset="60"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="60;0;0"
            dur="0.8s"
            fill="freeze"
          />
        </polyline>

        {/* Particle effects */}
        <circle cx="30" cy="35" r="3" fill="#4CAF50" opacity="0">
          <animate
            attributeName="opacity"
            values="0;1;0"
            dur="1.5s"
            begin="0.6s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="cx"
            values="30;20;10"
            dur="1.5s"
            begin="0.6s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="cy"
            values="35;25;15"
            dur="1.5s"
            begin="0.6s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="90" cy="30" r="2" fill="#4CAF50" opacity="0">
          <animate
            attributeName="opacity"
            values="0;1;0"
            dur="1.5s"
            begin="0.8s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="cx"
            values="90;100;110"
            dur="1.5s"
            begin="0.8s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="cy"
            values="30;25;20"
            dur="1.5s"
            begin="0.8s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="95" cy="80" r="2.5" fill="#4CAF50" opacity="0">
          <animate
            attributeName="opacity"
            values="0;1;0"
            dur="1.5s"
            begin="1s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="cx"
            values="95;105;115"
            dur="1.5s"
            begin="1s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="cy"
            values="80;85;90"
            dur="1.5s"
            begin="1s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Ring effect */}
        <circle cx="60" cy="60" r="55" fill="none" stroke="#4CAF50" strokeWidth="2" opacity="0">
          <animate
            attributeName="r"
            values="55;70;55"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.5;0;0.5"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </Box>
  );
}
