"use client";

import MuiCardActions from "@mui/material/CardActions";
import MuiDivider from "@mui/material/Divider";
import MuiButton from "@mui/material/Button";
import { type ReactNode } from "react";

export interface CardFooterAction {
  label: string;
  onClick?: () => void;
  variant?: "text" | "outlined" | "contained";
  disabled?: boolean;
}

export interface CardFooterProps {
  actions?: CardFooterAction[];
  divider?: boolean;
  children?: ReactNode;
}

export function CardFooter({ actions, divider = false, children }: CardFooterProps) {
  return (
    <>
      {divider && <MuiDivider />}
      <MuiCardActions sx={{ padding: "8px 16px", justifyContent: "flex-end", gap: 1 }}>
        {actions?.map((action, index) => (
          <MuiButton
            key={index}
            size="small"
            variant={action.variant || "text"}
            onClick={action.onClick}
            disabled={Boolean(action.disabled)}
          >
            {action.label}
          </MuiButton>
        ))}
        {children}
      </MuiCardActions>
    </>
  );
}
