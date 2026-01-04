import { useFormState, TestFormValues, initialValues } from "./test-utils";
import { renderHook } from "@testing-library/react";

describe("useFormState - Initialization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("initializes with provided values", () => {
    const { result } = renderHook(() =>
      useFormState<TestFormValues>(initialValues)
    );

    expect(result.current.values).toEqual(initialValues);
  });

  it("initializes errors as empty object", () => {
    const { result } = renderHook(() =>
      useFormState<TestFormValues>(initialValues)
    );

    expect(result.current.errors).toEqual({});
  });

  it("initializes isSubmitting as false", () => {
    const { result } = renderHook(() =>
      useFormState<TestFormValues>(initialValues)
    );

    expect(result.current.isSubmitting).toBe(false);
  });

  it("initializes touched as empty object", () => {
    const { result } = renderHook(() =>
      useFormState<TestFormValues>(initialValues)
    );

    expect(result.current.touched).toEqual({});
  });
});
