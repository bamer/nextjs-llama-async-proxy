"use client";

import { memo } from "react";
import { Button as MuiButton, CircularProgress, Tooltip, Box } from "@mui/material";
import { designColors } from "@/styles/theme-colors";

type ButtonVariant = "primary" | "secondary";

export interface QuickActionButtonProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  tooltip?: string;
  danger?: boolean;
  fullWidth?: boolean;
}

const sizeMap = {
  small: { px: 12, py: 6, fontSize: 13, height: 32 },
  medium: { px: 20, py: 10, fontSize: 14, height: 40 },
  large: { px: 28, py: 14, fontSize: 16, height: 48 },
};

export const QuickActionButton = memo(function QuickActionButton({
  label,
  icon,
  onClick,
  variant = "primary",
  disabled = false,
  loading = false,
  tooltip,
  danger = false,
  fullWidth = false,
}: QuickActionButtonProps) {
  const isLoading = loading;
  const loadingSize = 20;
  const s = sizeMap.medium;

  const getStyles = () => {
    if (danger) {
      return {
        background: `linear-gradient(135deg, ${designColors.error[500] || "#ef4444"} 0%, ${designColors.error[600] || "#dc2626"} 100%)`,
        color: "#ffffff",
        "&:hover": {
          background: `linear-gradient(135deg, ${designColors.error[600] || "#dc2626"} 0%, ${designColors.error[700] || "#b91c1c"} 100%)`,
        },
        "&:disabled": { background: designColors.gray[300], transform: "none" },
      };
    }
    if (variant === "primary") {
      return {
        background: `linear-gradient(135deg, ${designColors.primary[500]} 0%, ${designColors.primary[600]} 100%)`,
        color: "#ffffff",
        boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
        "&:hover": {
          background: `linear-gradient(135deg, ${designColors.primary[600]} 0%, ${designColors.primary[700]} 100%)`,
          boxShadow: "0 6px 20px rgba(59, 130, 246, 0.5)",
          transform: "translateY(-2px)",
        },
        "&:disabled": { background: designColors.gray[300], boxShadow: "none", transform: "none" },
      };
    }
    return {
      background: "transparent",
      color: "#1e293b",
      border: `1px solid ${designColors.gray[300]}`,
      "&:hover": { background: designColors.gray[100], borderColor: designColors.primary[700] },
    };
  };

  const muiVariant = variant === "primary" ? "contained" : "text";

  const button = (
    <MuiButton
      variant={muiVariant}
      disabled={disabled || isLoading}
      onClick={onClick}
      fullWidth={fullWidth}
      startIcon={!isLoading && icon}
      sx={{
        ...getStyles(),
        px: s.px,
        py: s.py,
        fontSize: s.fontSize,
        height: s.height,
        minWidth: "auto",
        fontWeight: 600,
        borderRadius: "8px",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {isLoading && (
        <CircularProgress
          size={loadingSize}
          color="inherit"
          sx={{ mr: 1 }}
        />
      )}
      {label}
    </MuiButton>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip} arrow>
        <Box display="inline-block">{button}</Box>
      </Tooltip>
    );
  }

  return button;
});

export default QuickActionButton;
