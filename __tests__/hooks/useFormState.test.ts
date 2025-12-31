import { renderHook, act } from "@testing-library/react";
import { useFormState } from "@/hooks/useFormState";

interface TestFormValues {
  username: string;
  email: string;
  age: number;
  active: boolean;
  [key: string]: unknown;
}

const initialValues: TestFormValues = {
  username: "",
  email: "",
  age: 0,
  active: false,
};

describe("useFormState Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initialization", () => {
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

  describe("setValue", () => {
    it("updates a single field value", () => {
      const { result } = renderHook(() =>
        useFormState<TestFormValues>(initialValues)
      );

      act(() => {
        result.current.setValue("username", "john_doe");
      });

      expect(result.current.values.username).toBe("john_doe");
    });

    it("updates multiple fields", () => {
      const { result } = renderHook(() =>
        useFormState<TestFormValues>(initialValues)
      );

      act(() => {
        result.current.setValue("username", "john_doe");
        result.current.setValue("email", "john@example.com");
      });

      expect(result.current.values.username).toBe("john_doe");
      expect(result.current.values.email).toBe("john@example.com");
    });

    it("marks field as touched", () => {
      const { result } = renderHook(() =>
        useFormState<TestFormValues>(initialValues)
      );

      act(() => {
        result.current.setValue("username", "john_doe");
      });

      expect(result.current.touched.username).toBe(true);
    });

    it("clears error when setting value", () => {
      const { result } = renderHook(() =>
        useFormState<TestFormValues>(initialValues)
      );

      // Set an error first
      act(() => {
        result.current.setErrors({ username: "Required" });
      });

      expect(result.current.errors.username).toBe("Required");

      // Set value to clear error
      act(() => {
        result.current.setValue("username", "john_doe");
      });

      expect(result.current.errors.username).toBeUndefined();
    });

    it("updates boolean value", () => {
      const { result } = renderHook(() =>
        useFormState<TestFormValues>(initialValues)
      );

      act(() => {
        result.current.setValue("active", true);
      });

      expect(result.current.values.active).toBe(true);
    });

    it("updates number value", () => {
      const { result } = renderHook(() =>
        useFormState<TestFormValues>(initialValues)
      );

      act(() => {
        result.current.setValue("age", 25);
      });

      expect(result.current.values.age).toBe(25);
    });

    it("updates string value", () => {
      const { result } = renderHook(() =>
        useFormState<TestFormValues>(initialValues)
      );

      act(() => {
        result.current.setValue("email", "test@example.com");
      });

      expect(result.current.values.email).toBe("test@example.com");
    });
  });

  describe("clearError", () => {
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

  describe("setErrors", () => {
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

  describe("setIsSubmitting", () => {
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

  describe("resetForm", () => {
    it("resets values to initial values", () => {
      const { result } = renderHook(() =>
        useFormState<TestFormValues>(initialValues)
      );

      act(() => {
        result.current.setValue("username", "john_doe");
        result.current.setValue("email", "john@example.com");
      });

      expect(result.current.values.username).toBe("john_doe");
      expect(result.current.values.email).toBe("john@example.com");

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.values).toEqual(initialValues);
    });

    it("resets errors to empty object", () => {
      const { result } = renderHook(() =>
        useFormState<TestFormValues>(initialValues)
      );

      act(() => {
        result.current.setErrors({ username: "Error", email: "Invalid" });
      });

      expect(result.current.errors.username).toBe("Error");

      act(() => {
        result.current.resetForm();
      });

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

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.isSubmitting).toBe(false);
    });

    it("resets touched to empty object", () => {
      const { result } = renderHook(() =>
        useFormState<TestFormValues>(initialValues)
      );

      act(() => {
        result.current.setValue("username", "john_doe");
      });

      expect(result.current.touched.username).toBe(true);

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.touched).toEqual({});
    });

    it("preserves initial values reference", () => {
      const { result } = renderHook(() =>
        useFormState<TestFormValues>(initialValues)
      );

      act(() => {
        result.current.setValue("username", "modified");
      });

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.values).toBe(initialValues);
      expect(result.current.values.username).toBe("");
    });
  });

  describe("Complex Scenarios", () => {
    it("handles form submission flow", () => {
      const { result } = renderHook(() =>
        useFormState<TestFormValues>(initialValues)
      );

      // User fills form
      act(() => {
        result.current.setValue("username", "john_doe");
        result.current.setValue("email", "john@example.com");
        result.current.setValue("age", 25);
        result.current.setValue("active", true);
      });

      expect(result.current.values).toEqual({
        username: "john_doe",
        email: "john@example.com",
        age: 25,
        active: true,
      });

      // Validate
      act(() => {
        result.current.setErrors({ email: "Invalid format" });
      });

      expect(result.current.errors.email).toBe("Invalid format");

      // User fixes error
      act(() => {
        result.current.setValue("email", "john.doe@example.com");
      });

      expect(result.current.errors.email).toBeUndefined();

      // Submit
      act(() => {
        result.current.setIsSubmitting(true);
      });

      expect(result.current.isSubmitting).toBe(true);

      // Submit completes
      act(() => {
        result.current.setIsSubmitting(false);
        result.current.resetForm();
      });

      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.values).toEqual(initialValues);
    });

    it("tracks touched fields across multiple updates", () => {
      const { result } = renderHook(() =>
        useFormState<TestFormValues>(initialValues)
      );

      act(() => {
        result.current.setValue("username", "john");
        result.current.setValue("email", "john@example.com");
        result.current.setValue("age", 25);
      });

      expect(result.current.touched).toEqual({
        username: true,
        email: true,
        age: true,
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles null values", () => {
      interface NullForm {
        field: string | null;
        [key: string]: unknown;
      }
      const { result } = renderHook(() =>
        useFormState<NullForm>({ field: null })
      );

      act(() => {
        result.current.setValue("field", null);
      });

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

      act(() => {
        result.current.setValue("field", undefined);
      });

      expect(result.current.values.field).toBeUndefined();
    });

    it("handles empty string values", () => {
      const { result } = renderHook(() =>
        useFormState<TestFormValues>(initialValues)
      );

      act(() => {
        result.current.setValue("username", "");
      });

      expect(result.current.values.username).toBe("");
    });

    it("handles zero number values", () => {
      const { result } = renderHook(() =>
        useFormState<TestFormValues>(initialValues)
      );

      act(() => {
        result.current.setValue("age", 0);
      });

      expect(result.current.values.age).toBe(0);
    });

    it("handles negative number values", () => {
      const { result } = renderHook(() =>
        useFormState<TestFormValues>(initialValues)
      );

      act(() => {
        result.current.setValue("age", -5);
      });

      expect(result.current.values.age).toBe(-5);
    });
  });

  describe("Type Safety", () => {
    it("only allows setting valid field names", () => {
      const { result } = renderHook(() =>
        useFormState<TestFormValues>(initialValues)
      );

      expect(() => {
        act(() => {
          result.current.setValue("invalidField", "value");
        });
      }).not.toThrow();
    });
  });
});
