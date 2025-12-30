"use client";

import React from "react";
import { Box, Divider, Grid, Typography } from "@mui/material";

export interface FormSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  spacing?: number;
  divider?: boolean;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  icon,
  children,
  spacing = 2,
  divider = true,
}) => {
  return (
    <Grid container spacing={spacing}>
      <Grid size={{ xs: 12 }}>
        <Typography
          variant="subtitle2"
          fontWeight="bold"
          sx={{ mb: 2, mt: 2, color: "primary.main" }}
        >
          {icon && <Box sx={{ mr: 1, display: "inline-flex" }}>{icon}</Box>}
          {title}
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Grid container spacing={spacing}>
          {children}
        </Grid>
      </Grid>
      {divider && (
        <Grid size={{ xs: 12 }}>
          <Divider sx={{ mt: 3 }} />
        </Grid>
      )}
    </Grid>
  );
};

export default FormSection;
