"use client";

import { createContext, useContext, ReactNode, useState, useCallback } from "react";

interface LoadingState {
  loading: boolean;
  message?: string;
  setLoading: (loading: boolean, message?: string) => void;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
}

const LoadingContext = createContext<LoadingState | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loading, setLoadingState] = useState(false);
  const [message, setMessage] = useState<string>();

  const setLoading = useCallback((isLoading: boolean, msg?: string) => {
    setLoadingState(isLoading);
    setMessage(msg);
  }, []);

  const startLoading = useCallback((msg?: string) => {
    setLoadingState(true);
    setMessage(msg);
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingState(false);
    setMessage(undefined);
  }, []);

  return (
    <LoadingContext.Provider value={{
      loading,
      ...(message !== undefined && { message }),
      setLoading,
      startLoading,
      stopLoading
    }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoadingState() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoadingState must be used within a LoadingProvider");
  }
  return context;
}
