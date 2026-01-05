"use client";

import { useState, useCallback } from "react";

interface UseOnboardingReturn {
  hasSeenOnboarding: boolean;
  markAsSeen: () => void;
  resetOnboarding: () => void;
  isOnboardingOpen: boolean;
  openOnboarding: () => void;
  closeOnboarding: () => void;
}

const ONBOARDING_STORAGE_KEY = "llama-async-proxy-onboarding-seen";

export function useOnboarding(): UseOnboardingReturn {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const initialize = useCallback(() => {
    if (typeof window !== "undefined" && !isInitialized) {
      const seen = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      setHasSeenOnboarding(!!seen);
      if (!seen) {
        setIsOnboardingOpen(true);
      }
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Initialize on mount
  if (typeof window !== "undefined" && !isInitialized) {
    initialize();
  }

  const markAsSeen = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    }
    setHasSeenOnboarding(true);
    setIsOnboardingOpen(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    }
    setHasSeenOnboarding(false);
    setIsOnboardingOpen(true);
  }, []);

  const openOnboarding = useCallback(() => {
    setIsOnboardingOpen(true);
  }, []);

  const closeOnboarding = useCallback(() => {
    setIsOnboardingOpen(false);
  }, []);

  return {
    hasSeenOnboarding,
    markAsSeen,
    resetOnboarding,
    isOnboardingOpen,
    openOnboarding,
    closeOnboarding,
  };
}
