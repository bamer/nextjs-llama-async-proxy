import { useFormState, TestFormValues, initialValues, updateField } from "./test-utils";
import { renderHook, act } from "@testing-library/react";

describe("useFormState - setValue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates a single field value", () => {
    const { result } = renderHook(() =>
      useFormState<TestFormValues>(initialValues)
    );

    updateField(result, "username", "john_doe");

    expect(result.current.values.username).toBe("john_doe");
  });

  it("updates multiple fields", () => {
    const { result } = renderHook(() =>
      useFormState<TestFormValues>(initialValues)
    );

    updateField(result, "username", "john_doe");
    updateField(result, "email", "john@example.com");

    expect(result.current.values.username).toBe("john_doe");
    expect(result.current.values.email).toBe("john@example.com");
  });

  it("marks field as touched", () => {
    const { result } = renderHook(() =>
      useFormState<TestFormValues>(initialValues)
    );

    updateField(result, "username", "john_doe");

    expect(result.current.touched.username).toBe(true);
  });

  it("clears error when setting value", () => {
    const { result } = renderHook(() =>
      useFormState<TestFormValues>(initialValues)
    );

    act(() => {
      result.current.setErrors({ username: "Required" });
    });

    expect(result.current.errors.username).toBe("Required");

    updateField(result, "username", "john_doe");

    expect(result.current.errors.username).toBeUndefined();
  });

  it("updates boolean value", () => {
    const { result } = renderHook(() =>
      useFormState<TestFormValues>(initialValues)
    );

    updateField(result, "active", true);

    expect(result.current.values.active).toBe(true);
  });

  it("updates number value", () => {
    const { result } = renderHook(() =>
      useFormState<TestFormValues>(initialValues)
    );

    updateField(result, "age", 25);

    expect(result.current.values.age).toBe(25);
  });

  it("updates string value", () => {
    const { result } = renderHook(() =>
      useFormState<TestFormValues>(initialValues)
    );

    updateField(result, "email", "test@example.com");

    expect(result.current.values.email).toBe("test@example.com");
  });
});

describe("useFormState - clearError", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("clears a specific field error", () => {
    const { result } = renderHook(() =>
      useFormState<TestFormValues>(initialValues)
    );

    act(() => {
      result.current.setErrors({ username: "Required", email: "Invalid" });
    });

    expect(result.current.errors.username).toBe("Required");
    expect(result.current.errors.email).toBe("Invalid");

    act(() => {
      result.current.clearError("username");
    });

    expect(result.current.errors.username).toBeUndefined();
    expect(result.current.errors.email).toBe("Invalid");
  });

  it("handles clearing non-existent error", () => {
    const { result } = renderHook(() =>
      useFormState<TestFormValues>(initialValues)
    );

    expect(() => {
      act(() => {
        result.current.clearError("username");
      });
    }).not.toThrow();
  });
});

describe("useFormState - setErrors", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sets multiple errors", () => {
    const { result } = renderHook(() =>
      useFormState<TestFormValues>(initialValues)
    );

    act(() => {
      result.current.setErrors({
        username: "Required",
        email: "Invalid",
      });
    });

    expect(result.current.errors.username).toBe("Required");
    expect(result.current.errors.email).toBe("Invalid");
  });

  it("replaces existing errors", () => {
    const { result } = renderHook(() =>
      useFormState<TestFormValues>(initialValues)
    );

    act(() => {
      result.current.setErrors({ username: "Error 1" });
    });

    act(() => {
      result.current.setErrors({ username: "Error 2", email: "Invalid" });
    });

    expect(result.current.errors.username).toBe("Error 2");
    expect(result.current.errors.email).toBe("Invalid");
  });

  it("handles empty errors object", () => {
    const { result } = renderHook(() =>
      useFormState<TestFormValues>(initialValues)
    );

    act(() => {
      result.current.setErrors({ username: "Error" });
    });

    expect(result.current.errors.username).toBe("Error");

    act(() => {
      result.current.setErrors({});
    });

    expect(result.current.errors).toEqual({});
  });
});
