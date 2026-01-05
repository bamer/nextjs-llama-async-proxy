"use client";

import { motion } from "framer-motion";
import { SVGPath } from "./types";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showAxis?: boolean;
}

function generatePath(data: number[], width: number, height: number): string {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data.map((value, index) => ({
    x: index * step,
    y: height - ((value - min) / range) * height,
  }));

  const pathData = points.reduce<string>((acc, point, i) => {
    return acc + (i === 0 ? `M ${point.x},${point.y}` : ` L ${point.x},${point.y}`);
  }, "");

  return pathData;
}

export function Sparkline({
  data,
  width = 100,
  height = 30,
  color = "#10b981",
  showAxis = false,
}: SparklineProps) {
  const path = generatePath(data, width, height);
  const min = Math.min(...data);
  const max = Math.max(...data);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      {showAxis && (
        <>
          <line x1={0} y1={0} x2={0} y2={height} stroke="#e5e7eb" strokeWidth={1} />
          <line x1={0} y1={height} x2={width} y2={height} stroke="#e5e7eb" strokeWidth={1} />
        </>
      )}
      <motion.path
        d={path}
        stroke={color}
        strokeWidth={1.5}
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      {showAxis && (
        <>
          <text x={-2} y={5} fontSize={8} fill="#6b7280" textAnchor="end">
            {max}
          </text>
          <text x={-2} y={height - 2} fontSize={8} fill="#6b7280" textAnchor="end">
            {min}
          </text>
        </>
      )}
    </svg>
  );
}
