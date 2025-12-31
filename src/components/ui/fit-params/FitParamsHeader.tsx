"use client";

import { Typography, DialogTitle } from "@mui/material";

export interface FitParamsHeaderProps {
  modelName: string;
}

export default function FitParamsHeader({ modelName }: FitParamsHeaderProps): React.ReactElement {
  return (
    <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Typography variant="h6" fontWeight="bold">
        Llama-Fit Parameters for {modelName}
      </Typography>
    </DialogTitle>
  );
}
