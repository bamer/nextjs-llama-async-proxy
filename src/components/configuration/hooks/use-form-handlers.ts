import type { FormConfig, FieldErrors } from "./use-form-state";

interface UseFormHandlersProps {
  setActiveTab: (tab: number) => void;
  setFormConfig: (config: FormConfig | ((prev: FormConfig) => FormConfig)) => void;
  setFieldErrors: (errors: FieldErrors | ((prev: FieldErrors) => FieldErrors)) => void;
  setClearedFields: (fields: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
}

export function useFormHandlers({
  setActiveTab,
  setFormConfig,
  setFieldErrors,
  setClearedFields,
}: UseFormHandlersProps) {
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const processedValue = type === "checkbox" ? checked : (type === "number" ? parseFloat(value) : value);

    // Check if field is a llama server field
    const llamaServerFields = ["host", "port", "basePath", "serverPath", "ctx_size", "batch_size", "threads", "gpu_layers"];
    const isLlamaServerField = llamaServerFields.includes(name);

    setFormConfig((prev: any) => {
      if (isLlamaServerField) {
        return {
          ...prev,
          llamaServer: {
            ...prev.llamaServer,
            [name]: processedValue,
          },
        };
      } else {
        return {
          ...prev,
          [name]: processedValue,
        };
      }
    });

    setFieldErrors((prev) => ({
      ...prev,
      [isLlamaServerField ? "llamaServer" : "general"]: {
        ...prev[isLlamaServerField ? "llamaServer" : "general"],
        [name]: "",
      },
    }));
    // Track this field as explicitly cleared by user to avoid re-validation
    setClearedFields((prev) => new Set(prev).add(name));
  };

  const handleLlamaServerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const fieldName = name.split(".")[1];
    setFormConfig((prev: any) => ({
      ...prev,
      llamaServer: {
        ...prev.llamaServer,
        [fieldName]: type === "number" ? parseFloat(value) : value,
      },
    }));
    // Clear field error for this field on change
    setFieldErrors((prev) => ({
      ...prev,
      llamaServer: {
        ...prev.llamaServer,
        [fieldName]: "",
      },
    }));
    // Track this field as explicitly cleared by user to avoid re-validation
    setClearedFields((prev) => new Set(prev).add(fieldName));
  };

  const handleModelDefaultsChange = (field: string, value: number) => {
    setFormConfig((prev: any) => ({
      ...prev,
      modelDefaults: {
        ...prev.modelDefaults,
        [field]: value,
      },
    }));
  };

  return {
    handleTabChange,
    handleInputChange,
    handleLlamaServerChange,
    handleModelDefaultsChange,
  };
}