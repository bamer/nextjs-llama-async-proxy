interface FormConfig {
   llamaServer?: Record<string, unknown>;
   modelDefaults?: Record<string, unknown>;
   baseModelsPath?: string;
   logLevel?: string;
   maxConcurrentModels?: number;
   autoUpdate?: boolean;
   notificationsEnabled?: boolean;
   llamaServerPath?: string;
   host?: string;
   port?: number;
   serverPath?: string;
   ctx_size?: number;
   batch_size?: number;
   threads?: number;
   gpu_layers?: number;
}

interface FieldErrors {
  general: Record<string, string>;
  llamaServer: Record<string, string>;
  logger: Record<string, string>;
}

export function createConfigHandlers(
  setFormConfig: React.Dispatch<React.SetStateAction<FormConfig>>,
  setFieldErrors: React.Dispatch<React.SetStateAction<FieldErrors>>,
  setClearedFields: React.Dispatch<React.SetStateAction<Set<string>>>,
) {
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    return newValue;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormConfig((prev: any) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : (type === "number" ? parseFloat(value) : value),
    }));

    const llamaServerFields = ["host", "port", "baseModelsPath", "serverPath", "ctx_size", "batch_size", "threads", "gpu_layers"];
    const isLlamaServerField = llamaServerFields.includes(name);

    setFieldErrors((prev) => ({
      ...prev,
      [isLlamaServerField ? "llamaServer" : "general"]: {
        ...prev[isLlamaServerField ? "llamaServer" : "general"],
        [name]: "",
      },
    }));

    setClearedFields((prev) => new Set(prev).add(name));
  };

  const handleLlamaServerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const fieldName = name.split(".")[1];
    
    setFormConfig((prev: any) => {
      // Ensure llamaServer object exists
      const existingLlamaServer = prev.llamaServer || {};
      
      return {
        ...prev,
        llamaServer: {
          ...existingLlamaServer,
          [fieldName]: type === "number" ? parseFloat(value) : value,
        },
      };
    });
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
