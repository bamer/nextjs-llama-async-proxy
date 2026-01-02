"use client";

import { Box, Chip, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ConfigType } from "@/types/model-config";
import { ConfigTypeData } from "./types";

interface VerticalConfigItemProps {
  data: ConfigTypeData;
  selectedType: ConfigType | null;
  counts?: Record<string, number> | undefined;
  onSelect: (type: ConfigType) => void;
}

export function VerticalConfigItem({
  data,
  selectedType,
  counts,
  onSelect,
}: VerticalConfigItemProps) {
  const theme = useTheme();
  const { type, label, icon, color } = data;

  return (
    <Box
      key={type}
      onClick={() => onSelect(type)}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        p: 1.5,
        borderRadius: 1,
        cursor: "pointer",
        backgroundColor: selectedType === type ? theme.palette[color].main + "15" : "transparent",
        border: `1px solid ${
          selectedType === type ? theme.palette[color].main : theme.palette.divider
        }`,
        transition: "all 0.2s ease",
        "&:hover": {
          backgroundColor: theme.palette[color].main + "10",
          transform: "translateX(4px)",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            borderRadius: 1,
            backgroundColor:
              selectedType === type
                ? theme.palette[color].main
                : theme.palette.mode === "dark"
                  ? "grey.700"
                  : "grey.200",
            color:
              selectedType === type ? theme.palette[color].contrastText : theme.palette.text.primary,
            transition: "all 0.2s ease",
          }}
        >
          {icon}
        </Box>
        <Typography
          variant="body1"
          sx={{
            fontWeight: selectedType === type ? 600 : 400,
            color: selectedType === type ? theme.palette[color].main : theme.palette.text.primary,
          }}
        >
          {label}
        </Typography>
      </Box>
      {counts && counts[type] > 0 && (
        <Chip
          label={counts[type]}
          size="small"
          sx={{
            height: 22,
            minHeight: 22,
            fontSize: "0.75rem",
            fontWeight: 600,
            backgroundColor: theme.palette[color].light,
            color: theme.palette[color].dark,
          }}
        />
      )}
    </Box>
  );
}
