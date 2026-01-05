"use client";

import MuiCard from "@mui/material/Card";
import { type ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  variant?: "elevated" | "outlined" | "flat";
  size?: "small" | "medium" | "large";
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

const sizeStyles = {
  small: { borderRadius: "8px", padding: "12px" },
  medium: { borderRadius: "12px", padding: "16px" },
  large: { borderRadius: "12px", padding: "24px" },
};

export function Card({
  children,
  variant = "elevated",
  size = "medium",
  hoverable = false,
  clickable = false,
  onClick,
}: CardProps) {
  const cardStyles = {
    ...sizeStyles[size],
    boxShadow: variant === "elevated" ? 2 : variant === "outlined" ? 0 : 0,
    border: variant === "outlined" ? "1px solid" : "none",
    borderColor: "divider",
    cursor: clickable ? "pointer" : "default",
    transition: "box-shadow 0.2s ease-in-out",
    ...(hoverable && {
      "&:hover": {
        boxShadow: variant === "elevated" ? 4 : variant === "outlined" ? 2 : 1,
      },
    }),
  };

  return (
    <MuiCard sx={cardStyles} onClick={onClick}>
      {children}
    </MuiCard>
  );
}
