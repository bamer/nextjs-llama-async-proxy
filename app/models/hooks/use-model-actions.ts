import { useState } from "react";
import { useFitParams, FitParamsData } from "@/hooks/use-fit-params";

interface UseModelActionsParams {
  setError: (error: string) => void;
  onAnalyzeStart?: () => void;
  onAnalyzeComplete?: () => void;
}

interface UseModelActionsReturn {
  analyzingModelId: string | null;
  fitParamsDialogOpen: boolean;
  currentFitParams: FitParamsData | null;
  anchorEl: HTMLElement | null;
  selectedModelId: string | null;
  setFitParamsDialogOpen: (open: boolean) => void;
  setCurrentFitParams: (params: FitParamsData | null) => void;
  handleAnalyze: (modelName: string) => Promise<void>;
  handleMenuClick: (event: React.MouseEvent<HTMLElement>, modelId: string) => void;
  handleMenuClose: () => void;
  handleDeleteClick: (onDelete: (modelId: string) => void) => void;
}

export function useModelActions({
  setError,
  onAnalyzeStart,
  onAnalyzeComplete,
}: UseModelActionsParams): UseModelActionsReturn {
  const [analyzingModelId, setAnalyzingModelId] = useState<string | null>(null);
  const [fitParamsDialogOpen, setFitParamsDialogOpen] = useState(false);
  const [currentFitParams, setCurrentFitParams] = useState<FitParamsData | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  const fitParamsHook = useFitParams(analyzingModelId);

  const handleAnalyze = async (modelName: string) => {
    setAnalyzingModelId(modelName);
    setCurrentFitParams(null);
    setFitParamsDialogOpen(true);
    onAnalyzeStart?.();

    try {
      await fitParamsHook.analyze();

      if (fitParamsHook.error) {
        setError(`Analysis failed: ${fitParamsHook.error}`);
      }

      if (fitParamsHook.data) {
        setCurrentFitParams(fitParamsHook.data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(`Analysis error: ${message}`);
    }

    setAnalyzingModelId(null);
    onAnalyzeComplete?.();
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, modelId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedModelId(modelId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedModelId(null);
  };

  const handleDeleteClick = (onDelete: (modelId: string) => void) => {
    if (selectedModelId) {
      onDelete(selectedModelId);
    }
    handleMenuClose();
  };

  return {
    analyzingModelId,
    fitParamsDialogOpen,
    currentFitParams,
    anchorEl,
    selectedModelId,
    setFitParamsDialogOpen,
    setCurrentFitParams,
    handleAnalyze,
    handleMenuClick,
    handleMenuClose,
    handleDeleteClick,
  };
}
