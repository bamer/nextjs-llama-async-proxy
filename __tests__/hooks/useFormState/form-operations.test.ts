import { useFormState, TestFormValues, initialValues, updateField, setError, resetForm } from "./test-utils";
import { renderHook, act } from "@testing-library/react";

describe("useFormState - setIsSubmitting", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sets submitting state to true", () => {
    const { result } = renderHook(() =>
      useFormState<TestFormValues>(initialValues)
    );

    act(() => {
      result.current.setIsSubmitting(true);
    });

    expect(result.current.isSubmitting).toBe(true);
  });

  it("sets submitting state to false", () => {
    const { result } = renderHook(() =>
      useFormState<TestFormValues>(initialValues)
    );

    act(() => {
      result.current.setIsSubmitting(true);
    });

    expect(result.current.isSubmitting).toBe(true);

    act(() => {
      result.current.setIsSubmitting(false);
    });

    expect(result.current.isSubmitting).toBe(false);
  });

  it("toggles submitting state", () => {
    const { result } = renderHook(() =>
      useFormState<TestFormValues>(initialValues)
    );

    expect(result.current.isSubmitting).toBe(false);

    act(() => {
      result.current.setIsSubmitting(true);
    });

    expect(result.current.isSubmitting).toBe(true);

    act(() => {
      result.current.setIsSubmitting(false);
    });

    expect(result.current.isSubmitting).toBe(false);
  });
});

describe("useFormState - resetForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("resets values to initial values", () => {
    const { result } = renderHook(() =>
      useFormState<TestFormValues>(initialValues)
    );

    updateField(result, "username", "john_doe");
    updateField(result, "email", "john@example.com");

    expect(result.current.values.username).toBe("john_doe");
    expect(result.current.values.email).toBe("john@example.com");

    resetForm(result);

    expect(result.current.values).toEqual(initialValues);
  });

  it("resets errors to empty object", () => {
    const { result } = renderHook(() =>
      useFormState<TestFormValues>(initialValues)
    );

    setError(result, { username: "Error", email: "Invalid" });

    expect(result.current.errors.username).toBe("Error");

    resetForm(result);

    expect(result.current.errors).toEqual({});
  });

  it("resets isSubmitting to false", () => {
    const { result } = renderHook(() =>
      useFormState<TestFormValues>(initialValues)
    );

    act(() => {
      result.current.setIsSubmitting(true);
    });

    expect(result.current.isSubmitting).toBe(true);

    resetForm(result);

    expect(result.current.isSubmitting).toBe(false);
  });

  it("resets touched to empty object", () => {
    const { result } = renderHook(() =>
      useFormState<TestFormValues>(initialValues)
    );

    updateField(result, "username", "john_doe");

    expect(result.current.touched.username).toBe(true);

    resetForm(result);

    expect(result.current.touched).toEqual({});
  });

  it("preserves initial values reference", () => {
    const { result } = renderHook(() =>
      useFormState<TestFormValues>(initialValues)
    );

    updateField(result, "username", "modified");

    resetForm(result);

    expect(result.current.values).toBe(initialValues);
    expect(result.current.values.username).toBe("");
  });
});

describe("useFormState - Complex Scenarios", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles form submission flow", () => {
    const { result } = renderHook(() =>
      useFormState<TestFormValues>(initialValues)
    );

    updateField(result, "username", "john_doe");
    updateField(result, "email", "john@example.com");
    updateField(result, "age", 25);
    updateField(result, "active", true);

    expect(result.current.values).toEqual({
      username: "john_doe",
      email: "john@example.com",
      age: 25,
      active: true,
    });

    setError(result, { email: "Invalid format" });

    expect(result.current.errors.email).toBe("Invalid format");

    updateField(result, "email", "john.doe@example.com");

    expect(result.current.errors.email).toBeUndefined();

    act(() => {
      result.current.setIsSubmitting(true);
    });

    expect(result.current.isSubmitting).toBe(true);

    act(() => {
      result.current.setIsSubmitting(false);
      resetForm(result);
    });

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.values).toEqual(initialValues);
  });

  it("tracks touched fields across multiple updates", () => {
    const { result } = renderHook(() =>
      useFormState<TestFormValues>(initialValues)
    );

    updateField(result, "username", "john");
    updateField(result, "email", "john@example.com");
    updateField(result, "age", 25);

    expect(result.current.touched).toEqual({
      username: true,
      email: true,
      age: true,
    });
  });
});
