"use client";

import React from "react";
import { Chip } from "@mui/material";

export interface ModelTypeChipProps {
  modelType: "llama" | "mistral" | "other";
}

export const ModelTypeChip: React.FC<ModelTypeChipProps> = ({ modelType }) => {
  const getColor = (): "success" | "primary" | "default" => {
    if (modelType === "llama") return "success";
    if (modelType === "mistral") return "primary";
    return "default";
  };

  return (
    <Chip
      label={modelType.toUpperCase()}
      color={getColor()}
      size="small"
      sx={{ fontWeight: 600, height: 24, fontSize: "0.7rem" }}
    />
  );
};
