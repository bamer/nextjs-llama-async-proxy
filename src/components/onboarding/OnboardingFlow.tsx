"use client";

import { useState, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  LinearProgress,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { OnboardingStep } from "./OnboardingFlow.types";
import { WelcomeStep } from "./WelcomeStep";
import { ScanStep } from "./ScanStep";
import { ConfigureStep } from "./ConfigureStep";
import { CompleteStep } from "./CompleteStep";

const STEPS: OnboardingStep[] = ["welcome", "scan", "configure", "complete"];

interface OnboardingConfig {
  modelName: string;
  maxTokens: string;
  temperature: string;
  enableStreaming: boolean;
  contextSize: number;
  gpuLayers: number;
  serverPort: string;
}

interface OnboardingFlowProps {
  open: boolean;
  onComplete?: (config: OnboardingConfig) => void;
  onSkip?: () => void;
}

export function OnboardingFlow({ open, onComplete, onSkip }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
  const [config, setConfig] = useState<OnboardingConfig>({
    modelName: "",
    maxTokens: "2048",
    temperature: "0.7",
    enableStreaming: true,
    contextSize: 4096,
    gpuLayers: 0,
    serverPort: "8080",
  });

  const currentStepIndex = STEPS.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const handleNext = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    } else {
      onComplete?.(config);
    }
  }, [currentStepIndex, config, onComplete]);

  const handleBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  }, [currentStepIndex]);

  const handleClose = useCallback(() => {
    onSkip?.();
  }, [onSkip]);

  const handleConfigChange = useCallback((newConfig: OnboardingConfig) => {
    setConfig(newConfig);
  }, []);

  const stepTitles: Record<OnboardingStep, string> = {
    welcome: "Welcome",
    scan: "Discover Models",
    configure: "Configuration",
    complete: "Complete",
  };

  const renderStep = () => {
    switch (currentStep) {
      case "welcome":
        return <WelcomeStep onNext={handleNext} />;
      case "scan":
        return <ScanStep onNext={handleNext} onBack={handleBack} />;
      case "configure":
        return (
          <ConfigureStep
            config={config}
            onConfigChange={handleConfigChange}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case "complete":
        return <CompleteStep onFinish={handleNext} />;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: "520px",
          maxHeight: "85vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
          px: 3,
          pt: 3,
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          {stepTitles[currentStep]}
        </Typography>
        <IconButton onClick={handleClose} size="small" sx={{ color: "text.secondary" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {currentStep !== "complete" && (
        <Box sx={{ px: 3, pt: 1 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: "action.hover",
              "& .MuiLinearProgress-bar": {
                borderRadius: 3,
                transition: "transform 0.4s ease",
              },
            }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 0.5, textAlign: "right" }}
          >
            Step {currentStepIndex + 1} of {STEPS.length - 1}
          </Typography>
        </Box>
      )}

      <DialogContent
        dividers
        sx={{
          px: 3,
          py: 2,
          "&:last-child": { borderBottom: "none" },
        }}
      >
        <AnimatePresence mode="wait">
          <m.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {renderStep()}
          </m.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
