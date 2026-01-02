import {
  generalSettingsSchema,
  llamaServerSettingsSchema,
} from "@/lib/validators";

interface FieldErrors {
  general: Record<string, string>;
  llamaServer: Record<string, string>;
  logger: Record<string, string>;
}

interface FormConfig {
  llamaServer?: {
    host?: string;
    port?: number;
    basePath?: string;
    serverPath?: string;
    ctx_size?: number;
    batch_size?: number;
    threads?: number;
    gpu_layers?: number;
  };
  basePath?: string;
  logLevel?: string;
  maxConcurrentModels?: number;
  autoUpdate?: boolean;
  notificationsEnabled?: boolean;
  llamaServerPath?: string;
}

interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export function validateConfig(
  configToValidate: FormConfig,
  clearedFields: Set<string>,
): { validationResult: ValidationResult; fieldErrors: FieldErrors } {
  const errors: string[] = [];
  const newFieldErrors: FieldErrors = {
    general: {},
    llamaServer: {},
    logger: {},
  };

  const generalSettings = {
    basePath: configToValidate.basePath || "",
    logLevel: (configToValidate.logLevel || "info") as "error" | "warn" | "info" | "debug",
    maxConcurrentModels: configToValidate.maxConcurrentModels || 1,
    autoUpdate: configToValidate.autoUpdate || false,
    notificationsEnabled: configToValidate.notificationsEnabled !== undefined ? configToValidate.notificationsEnabled : true,
    llamaServerPath: configToValidate.llamaServerPath || "",
  };

  const generalResult = generalSettingsSchema.safeParse(generalSettings);
  if (!generalResult.success) {
    generalResult.error.issues.forEach((error: any) => {
      const fieldName = error.path[0] as string;
      newFieldErrors.general[fieldName] = error.message;
      errors.push(`General Settings: ${fieldName} - ${error.message}`);
    });
  }

  const llamaServer = configToValidate.llamaServer;
  const llamaServerSettings = {
    host: llamaServer?.host || "",
    port: llamaServer?.port || 8080,
    basePath: llamaServer?.basePath || "",
    serverPath: llamaServer?.serverPath || configToValidate.llamaServerPath || "",
    ctx_size: llamaServer?.ctx_size || 0,
    batch_size: llamaServer?.batch_size || 512,
    threads: llamaServer?.threads || -1,
    gpu_layers: llamaServer?.gpu_layers || -1,
  };

  const llamaServerResult = llamaServerSettingsSchema.safeParse(llamaServerSettings);
  if (!llamaServerResult.success) {
    llamaServerResult.error.issues.forEach((error: any) => {
      const fieldName = error.path[0] as string;
      newFieldErrors.llamaServer[fieldName] = error.message;
      errors.push(`Llama Server Settings: ${fieldName} - ${error.message}`);
    });
  }

  const clearedFieldErrors = { ...newFieldErrors };
  clearedFields.forEach(field => {
    if (field in clearedFieldErrors.general) {
      delete clearedFieldErrors.general[field];
    }
    if (field in clearedFieldErrors.llamaServer) {
      delete clearedFieldErrors.llamaServer[field];
    }
  });

  return {
    validationResult: {
      valid: errors.length === 0,
      errors,
    },
    fieldErrors: clearedFieldErrors,
  };
}
