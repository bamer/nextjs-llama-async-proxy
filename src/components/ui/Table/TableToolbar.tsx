"use client";

import { Box, Typography, Stack, TextField, InputAdornment } from "@mui/material";
import { ReactNode } from "react";

export interface TableToolbarProps {
  title: string;
  selectedCount?: number;
  actions?: ReactNode;
  filters?: ReactNode;
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
}

export function TableToolbar({
  title,
  selectedCount = 0,
  actions,
  filters,
  search,
}: TableToolbarProps) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 2,
        mb: 2,
      }}
    >
      <Typography variant="h6" component="div">
        {title}
        {selectedCount > 0 && (
          <Typography
            component="span"
            variant="body2"
            color="text.secondary"
            sx={{ ml: 1 }}
          >
            ({selectedCount} selected)
          </Typography>
        )}
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        {search && (
          <TextField
            size="small"
            placeholder={search.placeholder ?? "Search..."}
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">🔍</InputAdornment>
              ),
            }}
          />
        )}
        {filters}
        {selectedCount > 0 && actions}
      </Stack>
    </Box>
  );
}
