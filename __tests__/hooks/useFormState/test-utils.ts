/**
 * Shared test utilities for useFormState tests
 */

import { renderHook, act } from "@testing-library/react";
import { useFormState } from "@/hooks/useFormState";

export interface TestFormValues {
  username: string;
  email: string;
  age: number;
  active: boolean;
  [key: string]: unknown;
}

export const initialValues: TestFormValues = {
  username: "",
  email: "",
  age: 0,
  active: false,
};

export function setupFormHook<T = TestFormValues>(
  values: T = initialValues as T
) {
  return renderHook(() => useFormState<T>(values));
}

export function updateField<T = TestFormValues>(
  hook: ReturnType<typeof setupFormHook<T>>,
  field: keyof T,
  value: unknown
): void {
  act(() => {
    hook.result.current.setValue(field as string, value);
  });
}

export function setError<T = TestFormValues>(
  hook: ReturnType<typeof setupFormHook<T>>,
  errors: Partial<Record<string, string>>
): void {
  act(() => {
    hook.result.current.setErrors(errors);
  });
}

export function resetForm<T = TestFormValues>(
  hook: ReturnType<typeof setupFormHook<T>>
): void {
  act(() => {
    hook.result.current.resetForm();
  });
}
