"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";
import type { FitParamsData } from "@/hooks/use-fit-params";
import { getAllParamKeys } from "@/lib/model-fit-params";
import FitParamsHeader from "./fit-params/FitParamsHeader";
import FitParamsContent from "./fit-params/FitParamsContent";
import FitParamsFooter from "./fit-params/FitParamsFooter";

export interface FitParamsDialogProps {
  open: boolean;
  onClose: () => void;
  modelName: string;
  fitParams: FitParamsData | null;
  onApply?: (selectedParams: string[]) => void;
}

export default function FitParamsDialog({
  open,
  onClose,
  modelName,
  fitParams,
  onApply,
}: FitParamsDialogProps): React.ReactElement {
  const { isDark } = useTheme();
  const [selectedParams, setSelectedParams] = useState<Set<string>>(new Set());

  const toggleParam = (paramName: string): void => {
    setSelectedParams((prev) => {
      const next = new Set(prev);
      if (next.has(paramName)) {
        next.delete(paramName);
      } else {
        next.add(paramName);
      }
      return next;
    });
  };

  const handleSelectAll = (): void => {
    const allParams = getAllParamKeys(fitParams);
    setSelectedParams(new Set(allParams));
  };

  const handleClearAll = (): void => {
    setSelectedParams(new Set());
  };

  const handleApply = (): void => {
    const selectedArray = Array.from(selectedParams);
    onApply?.(selectedArray);
    handleClose();
  };

  const handleClose = (): void => {
    setSelectedParams(new Set());
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.98)",
        },
      }}
    >
      <FitParamsHeader modelName={modelName} />

      <DialogContent>
        <FitParamsContent
          fitParams={fitParams}
          selectedParams={selectedParams}
          onToggleParam={toggleParam}
          onSelectAll={handleSelectAll}
          onClearAll={handleClearAll}
        />
      </DialogContent>

      <FitParamsFooter
        onClose={handleClose}
        onApply={handleApply}
        selectedCount={selectedParams.size}
        hasFitParams={fitParams !== null}
        fitParamsSuccess={fitParams?.fit_params_success !== undefined && fitParams?.fit_params_success !== null ? true : null}
      />
    </Dialog>
  );
}
