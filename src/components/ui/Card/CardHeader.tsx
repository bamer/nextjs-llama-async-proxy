"use client";

import MuiCardHeader from "@mui/material/CardHeader";
import MuiAvatar from "@mui/material/Avatar";
import MuiTypography from "@mui/material/Typography";
import { type ReactNode } from "react";

export interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  avatar?: ReactNode;
}

export function CardHeader({ title, subtitle, action, avatar }: CardHeaderProps) {
  return (
    <MuiCardHeader
      avatar={avatar ? <MuiAvatar>{avatar}</MuiAvatar> : undefined}
      title={<MuiTypography variant="h6">{title}</MuiTypography>}
      subheader={subtitle && <MuiTypography variant="body2">{subtitle}</MuiTypography>}
      action={action}
      sx={{ padding: "8px 16px" }}
    />
  );
}
