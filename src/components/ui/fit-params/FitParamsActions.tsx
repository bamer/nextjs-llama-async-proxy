"use client";

import { Box, Button } from "@mui/material";

export interface FitParamsActionsProps {
  selectedCount: number;
  onSelectAll: () => void;
  onClearAll: () => void;
}

export default function FitParamsActions({
  selectedCount,
  onSelectAll,
  onClearAll,
}: FitParamsActionsProps): React.ReactElement {
  return (
    <Box sx={{ mt: 3, display: "flex", gap: 2, justifyContent: "flex-end" }}>
      <Button
        size="small"
        onClick={onSelectAll}
        sx={{ mr: 1 }}
        disabled={selectedCount === 0}
      >
        Select All
      </Button>
      <Button
        size="small"
        onClick={onClearAll}
        disabled={selectedCount === 0}
      >
        Clear All
      </Button>
    </Box>
  );
}
