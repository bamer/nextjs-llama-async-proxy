"use client";

import { DialogActions, Button } from "@mui/material";
import {
  Check as CheckIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

export interface FitParamsFooterProps {
  onClose: () => void;
  onApply: () => void;
  selectedCount: number;
  hasFitParams: boolean;
  fitParamsSuccess?: boolean | null;
}

export default function FitParamsFooter({
  onClose,
  onApply,
  selectedCount,
  hasFitParams,
  fitParamsSuccess,
}: FitParamsFooterProps): React.ReactElement {
  const isApplyDisabled =
    !hasFitParams ||
    selectedCount === 0 ||
    fitParamsSuccess === false;

  return (
    <DialogActions sx={{ justifyContent: "space-between" }}>
      <Button onClick={onClose} startIcon={<CloseIcon />}>
        Cancel
      </Button>
      <Button
        variant="contained"
        color="primary"
        onClick={onApply}
        startIcon={<CheckIcon />}
        disabled={isApplyDisabled}
      >
        Apply {selectedCount} Selected
      </Button>
    </DialogActions>
  );
}
