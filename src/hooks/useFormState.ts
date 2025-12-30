"use client";

import { useState, useCallback, useRef } from "react";

export function useFormState<T extends Record<string, unknown>>(
  initialValues: T,
): {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
  touched: Partial<Record<keyof T, boolean>>;
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  clearError: <K extends keyof T>(field: K) => void;
  setErrors: (errors: Partial<Record<keyof T, string>>) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  resetForm: () => void;
} {
  const initialValuesRef = useRef<T>(initialValues);

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmittingState] = useState<boolean>(false);
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearError = useCallback(<K extends keyof T>(field: K) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const setIsSubmitting = useCallback((isSubmitting: boolean) => {
    setIsSubmittingState(isSubmitting);
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValuesRef.current);
    setErrors({});
    setIsSubmittingState(false);
    setTouched({});
  }, []);

  return {
    values,
    errors,
    isSubmitting,
    touched,
    setValue,
    clearError,
    setErrors,
    setIsSubmitting,
    resetForm,
  };
}
