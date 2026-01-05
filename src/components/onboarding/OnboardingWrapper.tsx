"use client";

import React, { useEffect } from "react";
import { useOnboarding } from "@/hooks/use-onboarding";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import type { OnboardingConfig } from "@/components/onboarding/OnboardingFlow.types";

interface OnboardingWrapperProps {
  children: React.ReactNode;
}

export function OnboardingWrapper({ children }: OnboardingWrapperProps) {
  const {
    hasSeenOnboarding,
    markAsSeen,
    isOnboardingOpen,
  } = useOnboarding();

  useEffect(() => {
    if (!hasSeenOnboarding && !isOnboardingOpen) {
      // Auto-open onboarding if not seen before - handled by useOnboarding hook
    }
  }, [hasSeenOnboarding, isOnboardingOpen]);

  const handleOnboardingComplete = (config: OnboardingConfig) => {
    // Save configuration to localStorage or send to server
    if (config.modelName) {
      localStorage.setItem("onboarding-model-name", config.modelName);
    }
    if (config.serverPort) {
      localStorage.setItem("onboarding-server-port", config.serverPort);
    }
    localStorage.setItem("onboarding-config", JSON.stringify(config));
    markAsSeen();
  };

  const handleOnboardingSkip = () => {
    markAsSeen();
  };

  return (
    <>
      {children}
      <OnboardingFlow
        open={isOnboardingOpen && !hasSeenOnboarding}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    </>
  );
}
