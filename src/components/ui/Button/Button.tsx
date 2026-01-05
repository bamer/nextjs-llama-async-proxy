"use client";

import { Button as MuiButton, ButtonProps, CircularProgress } from "@mui/material";
import { designColors } from "@/styles/theme-colors";
import { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "icon";
type ButtonSize = "small" | "medium" | "large";

interface ButtonPropsEx extends Omit<ButtonProps, "variant" | "size"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  children?: ReactNode;
}

const sizeMap: Record<ButtonSize, { px: number; py: number; fontSize: number; height: number }> = {
  small: { px: 12, py: 6, fontSize: 13, height: 32 },
  medium: { px: 20, py: 10, fontSize: 14, height: 40 },
  large: { px: 28, py: 14, fontSize: 16, height: 48 },
};

export function Button({
  variant = "primary",
  size = "medium",
  loading = false,
  fullWidth = false,
  startIcon,
  endIcon,
  disabled,
  children,
  sx,
  ...props
}: ButtonPropsEx) {
  const iconOnly = variant === "icon" && !children;
  const loadingSize = size === "small" ? 16 : size === "medium" ? 20 : 24;
  const s = sizeMap[size];

  const getStyles = () => {
    if (variant === "primary") {
      return {
        background: `linear-gradient(135deg, ${designColors.primary[500]} 0%, ${designColors.primary[600]} 100%)`,
        color: "#ffffff",
        boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
        "&:hover": { background: `linear-gradient(135deg, ${designColors.primary[600]} 0%, ${designColors.primary[700]} 100%)`, boxShadow: "0 6px 20px rgba(59, 130, 246, 0.5)", transform: "translateY(-2px)" },
        "&:disabled": { background: designColors.gray[300], boxShadow: "none", transform: "none" },
      };
    }
    if (variant === "secondary") {
      return {
        background: "transparent",
        color: "#1e293b",
        border: `1px solid ${designColors.gray[300]}`,
        "&:hover": { background: designColors.gray[100], borderColor: designColors.primary[700] },
      };
    }
    return { background: "transparent", color: "#64748b", "&:hover": { background: designColors.gray[100] } };
  };

  const muiVariant = variant === "primary" ? "contained" : "text";

  return (
    <MuiButton variant={muiVariant} disabled={disabled || loading} fullWidth={fullWidth} startIcon={!loading && startIcon} endIcon={!loading && endIcon}
      sx={{
        ...getStyles(),
        px: iconOnly ? 0 : s.px,
        py: s.py,
        fontSize: s.fontSize,
        height: s.height,
        width: iconOnly ? s.height : (fullWidth ? "100%" : "auto"),
        minWidth: iconOnly ? s.height : "auto",
        fontWeight: 600,
        borderRadius: variant === "icon" ? "50%" : "8px",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        ...sx,
      }} {...props}>
      {loading && <CircularProgress size={loadingSize} color="inherit" sx={{ mr: (startIcon || endIcon) ? 1 : 0 }} />}
      {children}
    </MuiButton>
  );
}

export type { ButtonPropsEx };
