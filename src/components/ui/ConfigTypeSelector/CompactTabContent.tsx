"use client";

import { Box, Chip, Typography, Tab } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ConfigType } from "@/types/model-config";

interface CompactTabContentProps {
  type: ConfigType;
  label: string;
  icon: React.ReactNode;
  color: "primary" | "secondary" | "success" | "warning" | "info" | "error";
  selectedType: ConfigType | null;
  counts?: Record<string, number> | undefined;
}

export function CompactTabContent({
  type,
  label,
  icon,
  color,
  selectedType,
  counts,
}: CompactTabContentProps) {
  const theme = useTheme();

  return (
    <Tab
      key={type}
      value={type}
      label={
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Box
            sx={{
              color:
                (selectedType === type ? theme.palette[color].dark : theme.palette.text.secondary) +
                "!important",
            }}
          >
            {icon}
          </Box>
          <Typography
            variant="body2"
            sx={{
              fontWeight: selectedType === type ? 600 : 500,
            }}
          >
            {label}
          </Typography>
          {counts && counts[type] > 0 && (
            <Chip
              label={counts[type]}
              size="small"
              sx={{
                height: 18,
                minHeight: 18,
                fontSize: "0.65rem",
                fontWeight: 600,
                backgroundColor: theme.palette[color].light,
                color: theme.palette[color].dark,
                ml: 0.5,
              }}
            />
          )}
        </Box>
      }
    />
  );
}
