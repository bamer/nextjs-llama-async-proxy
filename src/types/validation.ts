/**
 * Centralized type definitions for validation
 * Extracted from src/lib/validation-utils.ts and src/components/configuration/hooks/useConfigurationForm.ts
 */

export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: string[];
}

export interface ValidationResultLegacy {
  valid: boolean;
  errors?: string[];
}

export interface FieldErrors {
  general: Record<string, string>;
  llamaServer: Record<string, string>;
  logger: Record<string, string>;
}

export interface ValidationError {
  path: string[];
  message: string;
  code?: string;
}

export interface FormValidation<T = unknown> {
  isValid: boolean;
  errors: ValidationError[];
  data?: T;
}


export type ValidationRule<T = unknown> = (value: T) => string | null;
export type FieldValidationRules<T extends Record<string, unknown> = Record<string, unknown>> = {
  [K in keyof T]?: ValidationRule<T[K]>[];
}
