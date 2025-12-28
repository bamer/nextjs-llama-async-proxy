"use client";

import { memo, useMemo } from "react";
import { Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import { GaugeContainer, GaugeReferenceArc, GaugeValueArc, GaugeValueText, gaugeClasses } from "@mui/x-charts/Gauge";

interface CircularGaugeProps {
  value: number;
  min?: number;
  max?: number;
  size?: number;
  unit?: string;
  label?: string;
  threshold?: number;
  isDark?: boolean;
}

const MemoizedCircularGauge = memo(function CircularGauge({
  value,
  min = 0,
  max = 100,
  size = 150,
  unit = "",
  label = "",
  threshold = 80,
  isDark = false
}: CircularGaugeProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Calculate percentage (clamped to 0-100)
  const percentage = useMemo(() => {
    const normalizedValue = Math.max(min, Math.min(max, value));
    return ((normalizedValue - min) / (max - min)) * 100;
  }, [value, min, max]);

  // Determine color based on threshold
  const getColor = useMemo((): string => {
    if (percentage > threshold) {
      return theme.palette.error.main;
    }
    if (percentage > threshold * 0.7) {
      return theme.palette.warning.main;
    }
    return theme.palette.success.main;
  }, [percentage, threshold, theme.palette]);

  // Background circle color
  const getBackgroundColor = useMemo((): string => {
    return isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";
  }, [isDark]);

  // Text color
  const getTextColor = useMemo((): string => {
    return isDark ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.9)";
  }, [isDark]);

  // Adjust size for mobile
  const adjustedSize = useMemo(() => (isMobile ? size * 0.8 : size), [size, isMobile]);

  // Format value for display
  const formattedValue = useMemo(() => {
    if (Number.isInteger(value)) return String(value);
    return value.toFixed(1);
  }, [value]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
      }}
    >
      <Box
        sx={{
          width: adjustedSize,
          height: adjustedSize,
        }}
      >
        <GaugeContainer
          width={adjustedSize}
          height={adjustedSize}
          startAngle={-110}
          endAngle={110}
          value={value}
          valueMin={min}
          valueMax={max}
          sx={{
            [`& .${gaugeClasses.valueText}`]: {
              fontSize: adjustedSize * 0.25,
              fontWeight: "bold",
              fill: getColor,
            },
            [`& .${gaugeClasses.valueArc}`]: {
              fill: getColor,
            },
            [`& .${gaugeClasses.referenceArc}`]: {
              fill: getBackgroundColor,
            },
          }}
        >
          <GaugeReferenceArc />
          <GaugeValueArc />
          <GaugeValueText
            text={() => formattedValue}
          />
        </GaugeContainer>
      </Box>
      {/* Unit and label on same line */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          mt: 0.5,
        }}
      >
        {unit && (
          <Typography
            variant="caption"
            sx={{
              color: getTextColor,
              fontSize: adjustedSize * 0.12, // 1.5x bigger (was 0.08)
              fontWeight: 600,
            }}
          >
            {unit}
          </Typography>
        )}
        {label && (
          <Typography
            variant="caption"
            sx={{
              color: getTextColor,
              fontSize: adjustedSize * 0.09, // 1.5x bigger (was 0.06)
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              opacity: 0.8,
            }}
          >
            {label}
          </Typography>
        )}
      </Box>
    </Box>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for fine-grained control
  // Only re-render if critical props change
  return (
    prevProps.value === nextProps.value &&
    prevProps.min === nextProps.min &&
    prevProps.max === nextProps.max &&
    prevProps.size === nextProps.size &&
    prevProps.unit === nextProps.unit &&
    prevProps.label === nextProps.label &&
    prevProps.threshold === nextProps.threshold &&
    prevProps.isDark === nextProps.isDark
  );
});

MemoizedCircularGauge.displayName = "CircularGauge";

export { MemoizedCircularGauge as CircularGauge };
