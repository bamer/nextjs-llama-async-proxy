"use client";

import { Box, IconButton, CircularProgress } from "@mui/material";
import { Refresh, Delete, Download } from "@mui/icons-material";

interface LogsControlsProps {
  refreshing: boolean;
  onRefresh: () => void;
  onClear: () => void;
  downloading: boolean;
  onDownload: () => void;
}

export function LogsControls({
  refreshing,
  onRefresh,
  onClear,
  downloading,
  onDownload,
}: LogsControlsProps) {
  return (
    <Box sx={{ display: "flex", gap: 2 }}>
      <IconButton
        onClick={onRefresh}
        color="primary"
        size="small"
        disabled={refreshing}
        title="Refresh logs"
      >
        {refreshing ? <CircularProgress size={16} /> : <Refresh fontSize="small" />}
      </IconButton>
      <IconButton
        onClick={onClear}
        color="error"
        size="small"
        title="Clear logs"
      >
        <Delete fontSize="small" />
      </IconButton>
      <IconButton
        onClick={onDownload}
        color="info"
        size="small"
        disabled={downloading}
        title="Download logs"
      >
        {downloading ? <CircularProgress size={16} /> : <Download fontSize="small" />}
      </IconButton>
    </Box>
  );
}
