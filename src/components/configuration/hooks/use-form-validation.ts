import {
  generalSettingsSchema,
  llamaServerSettingsSchema,
} from "@/lib/validators";
import type { FormConfig, FieldErrors, ValidationResult } from "./use-form-state";

interface UseFormValidationProps {
  setFieldErrors: (errors: FieldErrors) => void;
  clearedFields: Set<string>;
}

export function useFormValidation({
  setFieldErrors,
  clearedFields,
}: UseFormValidationProps) {
  const validateConfig = (configToValidate: FormConfig): ValidationResult => {
    const errors: string[] = [];
    const newFieldErrors: FieldErrors = {
      general: {},
      llamaServer: {},
      logger: {},
    };

    // Validate General Settings using Zod
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

    // Validate Llama Server Settings using Zod
    // Support both nested llamaServer object and legacy direct properties
    const llamaServer = configToValidate.llamaServer;
    // Determine which llama server fields are set directly (legacy) vs in nested object
    const llamaServerFieldNames = ["host", "port", "serverPath", "ctx_size", "batch_size", "threads", "gpu_layers"];
    const hasLegacyLlamaServerProps = llamaServerFieldNames.some(
      field => configToValidate[field as keyof FormConfig] !== undefined && field !== "basePath"
    );

    // Note: basePath is a general setting, not a llama server field
    const llamaServerSettings = {
      host: llamaServer?.host || configToValidate.host || "",
      port: llamaServer?.port || configToValidate.port || 8080,
      basePath: llamaServer?.basePath || "",
      serverPath: llamaServer?.serverPath || configToValidate.serverPath || "",
      ctx_size: llamaServer?.ctx_size || configToValidate.ctx_size || 0,
      batch_size: llamaServer?.batch_size || configToValidate.batch_size || 512,
      threads: llamaServer?.threads || configToValidate.threads || -1,
      gpu_layers: llamaServer?.gpu_layers || configToValidate.gpu_layers || -1,
    };

    const llamaServerResult = llamaServerSettingsSchema.safeParse(llamaServerSettings);
    if (!llamaServerResult.success) {
      llamaServerResult.error.issues.forEach((error: any) => {
        const fieldName = error.path[0] as string;
        newFieldErrors.llamaServer[fieldName] = error.message;
        errors.push(`Llama Server Settings: ${fieldName} - ${error.message}`);
      });
    }

    // Clear errors for fields that were explicitly cleared by user input to avoid re-validation
    // This allows users to clear a field error by typing without triggering re-validation
    const clearedFieldErrors = { ...newFieldErrors };
    clearedFields.forEach(field => {
      if (field in clearedFieldErrors.general) {
        delete clearedFieldErrors.general[field];
      }
      if (field in clearedFieldErrors.llamaServer) {
        delete clearedFieldErrors.llamaServer[field];
      }
    });

    setFieldErrors(clearedFieldErrors);

    return {
      valid: errors.length === 0,
      errors,
    };
  };

  return {
    validateConfig,
  };
}