import { z, ZodSchema, ZodError } from "zod";
import { getLogger } from "./logger";

const logger = getLogger();

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

/**
 * Format Zod errors into user-friendly error messages
 */
function formatZodErrors(error: ZodError): string[] {
  return error.issues.map((e) => {
    const path = e.path.length > 0 ? `${e.path.join(".")}: ` : "";
    return `${path}${e.message}`;
  });
}

/**
 * Validate request body against a Zod schema
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns ValidationResult with data or errors
 */
export function validateRequestBody<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const result = schema.parse(data);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatZodErrors(error);
      logger.error("[Validation] Request body validation failed:", errors);
      return {
        success: false,
        errors,
      };
    }
    logger.error("[Validation] Unexpected error during validation:", error);
    return {
      success: false,
      errors: ["Validation failed due to an unexpected error"],
    };
  }
}

/**
 * Validate configuration against a Zod schema
 * @param schema - Zod schema to validate against
 * @param config - Configuration to validate
 * @param configName - Name of the config file (for logging)
 * @returns ValidationResult with data or errors
 */
export function validateConfig<T>(
  schema: ZodSchema<T>,
  config: unknown,
  configName: string = "configuration"
): ValidationResult<T> {
  try {
    const result = schema.parse(config);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatZodErrors(error);
      logger.error(`[Validation] ${configName} validation failed:`, errors);
      return {
        success: false,
        errors,
      };
    }
    logger.error(`[Validation] Unexpected error validating ${configName}:`, error);
    return {
      success: false,
      errors: [`Validation failed for ${configName} due to an unexpected error`],
    };
  }
}

/**
 * Safely validate and return default on failure
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param defaultValue - Default value to return on validation failure
 * @returns Validated data or default
 */
export function validateWithDefault<T>(
  schema: ZodSchema<T>,
  data: unknown,
  defaultValue: T
): T {
  const result = validateConfig(schema, data);
  if (result.success && result.data) {
    return result.data;
  }
  return defaultValue;
}
