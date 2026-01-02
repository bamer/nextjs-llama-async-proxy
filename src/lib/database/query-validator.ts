import fs from "fs";

/**
 * Validate that a file path exists
 * @param filePath - Path to file
 * @returns True if file exists, false otherwise
 */
export function validateFileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Validate metadata key is a non-empty string
 * @param key - Metadata key to validate
 * @returns True if valid, false otherwise
 */
export function validateMetadataKey(key: unknown): boolean {
  return typeof key === "string" && key.length > 0;
}

/**
 * Validate metadata value is a string
 * @param value - Metadata value to validate
 * @returns True if valid, false otherwise
 */
export function validateMetadataValue(value: unknown): boolean {
  return typeof value === "string";
}

/**
 * Validate database instance
 * @param db - Database instance
 * @returns True if valid database instance
 */
export function validateDatabase(db: unknown): boolean {
  return db !== null && db !== undefined && typeof db === "object";
}

/**
 * Validate file path for import/export operations
 * @param filePath - Path to validate
 * @returns Object with isValid flag and error message
 */
export function validateFilePath(filePath: unknown): {
  isValid: boolean;
  error?: string;
} {
  if (typeof filePath !== "string") {
    return { isValid: false, error: "File path must be a string" };
  }

  if (filePath.trim().length === 0) {
    return { isValid: false, error: "File path cannot be empty" };
  }

  return { isValid: true };
}

/**
 * Validate import operation prerequisites
 * @param filePath - Path to import file
 * @returns Object with isValid flag and error message
 */
export function validateImportOperation(filePath: string): {
  isValid: boolean;
  error?: string;
} {
  const pathValidation = validateFilePath(filePath);
  if (!pathValidation.isValid) {
    return pathValidation;
  }

  if (!validateFileExists(filePath)) {
    return {
      isValid: false,
      error: `Import file does not exist: ${filePath}`,
    };
  }

  return { isValid: true };
}

/**
 * Validate export operation prerequisites
 * @param filePath - Path to export file
 * @returns Object with isValid flag and error message
 */
export function validateExportOperation(filePath: string): {
  isValid: boolean;
  error?: string;
} {
  const pathValidation = validateFilePath(filePath);
  if (!pathValidation.isValid) {
    return pathValidation;
  }

  return { isValid: true };
}
