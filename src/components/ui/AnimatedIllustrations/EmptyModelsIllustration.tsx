"use client";

import { Box } from "@mui/material";

export function EmptyModelsIllustration() {
  return (
    <Box
      sx={{
        width: 200,
        height: 200,
        position: "relative",
      }}
    >
      <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
        {/* Background circle */}
        <circle cx="100" cy="100" r="90" fill="rgba(129, 199, 132, 0.1)" />
        <circle cx="100" cy="100" r="75" fill="rgba(129, 199, 132, 0.15)" />

        {/* Brain/Chip icon base */}
        <rect x="55" y="55" width="90" height="90" rx="12" fill="#1B3D1E" stroke="#4CAF50" strokeWidth="2" />

        {/* Neural network nodes */}
        {[
          { x: 78, y: 78 },
          { x: 122, y: 78 },
          { x: 78, y: 122 },
          { x: 122, y: 122 },
          { x: 100, y: 100 },
        ].map((node, i) => (
          <circle key={i} cx={node.x} cy={node.y} r="8" fill="#2E7D32">
            <animate
              attributeName="r"
              values="8;10;8"
              dur="2s"
              begin={`${i * 0.2}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="fill"
              values="#2E7D32;#4CAF50;#2E7D32"
              dur="2s"
              begin={`${i * 0.2}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}

        {/* Neural connections */}
        <line x1="78" y1="78" x2="122" y2="78" stroke="#4CAF50" strokeWidth="1.5" opacity="0.5">
          <animate
            attributeName="stroke-dasharray"
            values="0,50;50,0;0,50"
            dur="3s"
            repeatCount="indefinite"
          />
        </line>
        <line x1="78" y1="122" x2="122" y2="122" stroke="#4CAF50" strokeWidth="1.5" opacity="0.5">
          <animate
            attributeName="stroke-dasharray"
            values="0,50;50,0;0,50"
            dur="3s"
            begin="0.5s"
            repeatCount="indefinite"
          />
        </line>
        <line x1="100" y1="100" x2="78" y2="78" stroke="#4CAF50" strokeWidth="1.5" opacity="0.5">
          <animate
            attributeName="stroke-dasharray"
            values="0,35;35,0;0,35"
            dur="2.5s"
            repeatCount="indefinite"
          />
        </line>
        <line x1="100" y1="100" x2="122" y2="78" stroke="#4CAF50" strokeWidth="1.5" opacity="0.5">
          <animate
            attributeName="stroke-dasharray"
            values="0,35;35,0;0,35"
            dur="2.5s"
            begin="0.3s"
            repeatCount="indefinite"
          />
        </line>
        <line x1="100" y1="100" x2="78" y2="122" stroke="#4CAF50" strokeWidth="1.5" opacity="0.5">
          <animate
            attributeName="stroke-dasharray"
            values="0,35;35,0;0,35"
            dur="2.5s"
            begin="0.6s"
            repeatCount="indefinite"
          />
        </line>
        <line x1="100" y1="100" x2="122" y2="122" stroke="#4CAF50" strokeWidth="1.5" opacity="0.5">
          <animate
            attributeName="stroke-dasharray"
            values="0,35;35,0;0,35"
            dur="2.5s"
            begin="0.9s"
            repeatCount="indefinite"
          />
        </line>

        {/* Plus icon hint */}
        <g transform="translate(135, 135)">
          <circle r="18" fill="#2E5A2E" />
          <line x1="-8" y1="0" x2="8" y2="0" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round">
            <animate
              attributeName="stroke-dasharray"
              values="0,20;20,0;0,20"
              dur="2s"
              repeatCount="indefinite"
            />
          </line>
          <line x1="0" y1="-8" x2="0" y2="8" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round">
            <animate
              attributeName="stroke-dasharray"
              values="0,20;20,0;0,20"
              dur="2s"
              begin="0.5s"
              repeatCount="indefinite"
            />
          </line>
        </g>

        {/* Floating particles */}
        <circle cx="40" cy="50" r="3" fill="#4CAF50" opacity="0.5">
          <animate
            attributeName="cx"
            values="40;55;40"
            dur="5s"
            repeatCount="indefinite"
          />
          <animate attributeName="opacity" values="0.5;1;0.5" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx="160" cy="150" r="2" fill="#4CAF50" opacity="0.4">
          <animate
            attributeName="cx"
            values="160;145;160"
            dur="4s"
            begin="1s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </Box>
  );
}
