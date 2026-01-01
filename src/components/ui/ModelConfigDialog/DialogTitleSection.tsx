"use client";

import { Box, Typography, Chip } from "@mui/material";
import { Edit as EditIcon } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";

interface DialogTitleSectionProps {
  configTitle: string;
  modelId: number | undefined;
  hasChanges: boolean;
}

export const DialogTitleSection = ({
  configTitle,
  modelId,
  hasChanges,
}: DialogTitleSectionProps) => {
  const theme = useTheme();

  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Configurer {configTitle}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.9 }}>
          Modèle {modelId}
        </Typography>
      </Box>
      {hasChanges && (
        <Chip
          icon={<EditIcon />}
          label="Modifications Non Sauvegardées"
          size="small"
          color="warning"
          sx={{ backgroundColor: "warning.light", color: "warning.dark" }}
        />
      )}
    </Box>
  );
};
