"use server";

import {
  generalSettingsSchema,
  llamaServerSettingsSchema,
  loggerSettingsSchema,
  modelConfigSchema,
  type GeneralSettings,
  type LlamaServerSettings,
  type LoggerSettings,
  type ModelConfig,
} from "@/lib/validators";

// ============================================================================
// 1. ValidationResult Interface
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  fieldErrors: Record<string, string>;
}

// ============================================================================
// 2. FieldValidationRules Types
// ============================================================================

export interface NumberRule {
  min?: number;
  max?: number;
  int?: boolean;
}

export interface StringRule {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}

export interface GeneralSettingsRules {
  maxConcurrentModels: NumberRule;
  logLevel: ["error" | "warn" | "info" | "debug"];
}

export interface LlamaServerSettingsRules {
  host: StringRule;
  port: NumberRule;
  ctx_size: NumberRule;
  batch_size: NumberRule;
  threads: NumberRule;
  gpu_layers: NumberRule;
}

export interface LoggerSettingsRules {
  consoleLevel: ["error" | "warn" | "info" | "debug"];
  fileLevel: ["error" | "warn" | "info" | "debug"];
  maxFileSize: RegExp;
}

export interface ModelConfigRules {
  temperature: NumberRule;
  top_k: NumberRule;
  top_p: NumberRule;
}

// ============================================================================
// 3. FormValidator Class
// ============================================================================

export class FormValidator {
  validateGeneralSettings(settings: GeneralSettings): ValidationResult {
    return this.toValidationResult(generalSettingsSchema.safeParse(settings));
  }

  validateLlamaServerSettings(settings: LlamaServerSettings): ValidationResult {
    return this.toValidationResult(llamaServerSettingsSchema.safeParse(settings));
  }

  validateLoggerSettings(settings: LoggerSettings): ValidationResult {
    return this.toValidationResult(loggerSettingsSchema.safeParse(settings));
  }

  validateModelConfig(config: ModelConfig): ValidationResult {
    return this.toValidationResult(modelConfigSchema.safeParse(config));
  }

  validateAll(config: Record<string, unknown>): { valid: boolean; errors: string[]; fieldErrors: Record<string, string> } {
    const errors: string[] = [];
    const fieldErrors: Record<string, string> = {};

    if (config.general || config.basePath) {
      const general = (config.general as GeneralSettings) || ({
        basePath: config.basePath as string,
        logLevel: config.logLevel as "error" | "warn" | "info" | "debug",
        maxConcurrentModels: config.maxConcurrentModels as number,
        autoUpdate: config.autoUpdate as boolean,
        notificationsEnabled: config.notificationsEnabled as boolean,
        llamaServerPath: config.llamaServerPath as string,
      } satisfies GeneralSettings);
      const result = this.validateGeneralSettings(general);
      errors.push(...result.errors);
      Object.assign(fieldErrors, result.fieldErrors);
    }

    if (config.llamaServer || config.host) {
      const server = (config.llamaServer as LlamaServerSettings) || ({
        host: config.host as string,
        port: config.port as number,
        basePath: config.basePath as string,
        serverPath: config.serverPath as string,
        ctx_size: config.ctx_size as number,
        batch_size: config.batch_size as number,
        threads: config.threads as number,
        gpu_layers: config.gpu_layers as number,
      } satisfies LlamaServerSettings);
      const result = this.validateLlamaServerSettings(server);
      errors.push(...result.errors);
      Object.assign(fieldErrors, result.fieldErrors);
    }

    if (config.logger) {
      const result = this.validateLoggerSettings(config.logger as LoggerSettings);
      errors.push(...result.errors);
      Object.assign(fieldErrors, result.fieldErrors);
    }

    if (config.modelDefaults) {
      const result = this.validateModelConfig({
        id: "default",
        name: "Default Model",
        type: "llama",
        parameters: config.modelDefaults as Record<string, unknown>,
        status: "idle",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      errors.push(...result.errors);
      Object.assign(fieldErrors, result.fieldErrors);
    }

    return { valid: errors.length === 0, errors, fieldErrors };
  }

  private toValidationResult(result: { success: boolean; error?: { issues: any[] } }): ValidationResult {
    if (result.success) {
      return { valid: true, errors: [], fieldErrors: {} };
    }

    const errors: string[] = [];
    const fieldErrors: Record<string, string> = {};

    result.error?.issues.forEach((issue) => {
      const field = issue.path.join(".");
      const message = issue.message;
      errors.push(`${field}: ${message}`);
      fieldErrors[field] = message;
    });

    return { valid: false, errors, fieldErrors };
  }
}

// ============================================================================
// 4. Exported Utility Functions
// ============================================================================

export function isValidNumber(value: number, min?: number, max?: number): boolean {
  if (typeof value !== "number" || isNaN(value)) return false;
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
}

export function isValidPort(port: number): boolean {
  return isValidNumber(port, 1, 65535) && Number.isInteger(port);
}

export function isValidPath(path: string): boolean {
  return typeof path === "string" && path.length > 0;
}

export function isRequired(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string" && value.trim().length === 0) return false;
  if (typeof value === "number" && value === 0) return false;
  return true;
}

export const formValidator = new FormValidator();
