"use client";

import { Box, Chip } from "@mui/material";
import { Check, Storage } from "@mui/icons-material";
import { formatFileSize } from "../utils/model-utils";

interface ModelMetadataProps {
  parameters?: {
    fit_params_available?: boolean;
    file_size_bytes?: number;
    quantization_type?: string;
    parameter_count?: string;
  };
}

export function ModelMetadata({ parameters }: ModelMetadataProps) {
  return (
    <>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2 }}>
        {parameters?.fit_params_available ? (
          <Chip
            icon={<Check sx={{ fontSize: 12 }} />}
            label="Fit-Params Analyzed"
            size="small"
            color="success"
            variant="outlined"
          />
        ) : null}
        {parameters?.file_size_bytes ? (
          <Chip
            icon={<Storage sx={{ fontSize: 12 }} />}
            label={formatFileSize(parameters.file_size_bytes as number)}
            size="small"
            variant="outlined"
          />
        ) : null}
        {parameters?.quantization_type ? (
          <Chip label={`${parameters.quantization_type}`} size="small" variant="outlined" />
        ) : null}
        {parameters?.parameter_count ? (
          <Chip label={`${parameters.parameter_count}B`} size="small" variant="outlined" />
        ) : null}
      </Box>
    </>
  );
}
