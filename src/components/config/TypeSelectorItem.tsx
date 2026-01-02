"use client";

import { Box, Chip, Typography } from "@mui/material";
import { memo } from "react";
import { useTheme } from "@mui/material/styles";

interface TypeSelectorItemProps {
  label: string;
  icon: React.ReactNode;
  color: "primary" | "secondary" | "success" | "warning" | "info" | "error";
  isSelected: boolean;
  onSelect: () => void;
  count?: number | undefined;
}

const TypeSelectorItem = memo(({
  label,
  icon,
  color,
  isSelected,
  onSelect,
  count,
}: TypeSelectorItemProps) => {
  const theme = useTheme();

  return (
    <Box
      onClick={onSelect}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        p: 1.5,
        borderRadius: 1,
        cursor: "pointer",
        backgroundColor: isSelected ? theme.palette[color].main + "15" : "transparent",
        border: `1px solid ${
          isSelected
            ? theme.palette[color].main
            : theme.palette.divider
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
              isSelected ? theme.palette[color].main : theme.palette.mode === "dark" ? "grey.700" : "grey.200",
            color: isSelected ? theme.palette[color].contrastText : theme.palette.text.primary,
            transition: "all 0.2s ease",
          }}
        >
          {icon}
        </Box>
        <Typography
          variant="body1"
          sx={{
            fontWeight: isSelected ? 600 : 400,
            color: isSelected ? theme.palette[color].main : theme.palette.text.primary,
          }}
        >
          {label}
        </Typography>
      </Box>
      {count && count > 0 && (
        <Chip
          label={count}
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
});

TypeSelectorItem.displayName = "TypeSelectorItem";

export default TypeSelectorItem;
