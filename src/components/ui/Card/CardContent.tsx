"use client";

import MuiCardContent from "@mui/material/CardContent";
import { type ReactNode } from "react";

export interface CardContentProps {
  children: ReactNode;
}

export function CardContent({ children }: CardContentProps) {
  return <MuiCardContent sx={{ padding: "16px" }}>{children}</MuiCardContent>;
}
