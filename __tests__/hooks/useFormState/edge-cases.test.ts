import { useFormState, TestFormValues, initialValues, updateField } from "./test-utils";
import { renderHook } from "@testing-library/react";

describe("useFormState - Edge Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles null values", () => {
    interface NullForm {
      field: string | null;
      [key: string]: unknown;
    }
    const { result } = renderHook(() =>
      useFormState<NullForm>({ field: null })
    );

    updateField(result, "field", null);

    expect(result.current.values.field).toBeNull();
  });

  it("handles undefined values", () => {
    interface UndefinedForm {
      field: string | undefined;
      [key: string]: unknown;
    }
    const { result } = renderHook(() =>
      useFormState<UndefinedForm>({ field: undefined })
    );

    updateField(result, "field", undefined);

    expect(result.current.values.field).toBeUndefined();
  });

  it("handles empty string values", () => {
    const { result } = renderHook(() =>
      useFormState<TestFormValues>(initialValues)
    );

    updateField(result, "username", "");

    expect(result.current.values.username).toBe("");
  });

  it("handles zero number values", () => {
    const { result } = renderHook(() =>
      useFormState<TestFormValues>(initialValues)
    );

    updateField(result, "age", 0);

    expect(result.current.values.age).toBe(0);
  });

  it("handles negative number values", () => {
    const { result } = renderHook(() =>
      useFormState<TestFormValues>(initialValues)
    );

    updateField(result, "age", -5);

    expect(result.current.values.age).toBe(-5);
  });
});

describe("useFormState - Type Safety", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("only allows setting valid field names", () => {
    const { result } = renderHook(() =>
      useFormState<TestFormValues>(initialValues)
    );

    expect(() => {
      updateField(result, "invalidField", "value");
    }).not.toThrow();
  });
});
