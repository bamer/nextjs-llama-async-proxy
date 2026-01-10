/**
 * Request Validation Helper
 * Provides schema validation for socket request handlers
 */

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

/**
 * Validate required fields in request object
 * @param {Object} req - Request object
 * @param {Array<string>} requiredFields - Required field names
 * @throws {ValidationError} If validation fails
 */
export function validateRequired(req, requiredFields) {
  const errors = [];

  for (const field of requiredFields) {
    if (req === null || req === undefined) {
      errors.push(`Request is missing`);
      continue;
    }

    if (!(field in req) || req[field] === null || req[field] === undefined) {
      errors.push(`Required field '${field}' is missing`);
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(", "));
  }
}

/**
 * Validate field types
 * @param {Object} req - Request object
 * @param {Object} typeSchema - Schema mapping fields to types
 * @throws {ValidationError} If validation fails
 */
export function validateTypes(req, typeSchema) {
  const errors = [];

  for (const [field, expectedType] of Object.entries(typeSchema)) {
    if (!(field in req)) continue;

    const value = req[field];
    const actualType = Array.isArray(value) ? "array" : typeof value;

    if (actualType !== expectedType) {
      errors.push(`Field '${field}' expected type '${expectedType}', got '${actualType}'`);
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(", "));
  }
}

/**
 * Validate field values match a pattern
 * @param {Object} req - Request object
 * @param {Object} patternSchema - Schema mapping fields to regex patterns
 * @throws {ValidationError} If validation fails
 */
export function validatePatterns(req, patternSchema) {
  const errors = [];

  for (const [field, pattern] of Object.entries(patternSchema)) {
    if (!(field in req) || req[field] === null || req[field] === undefined) continue;

    const value = req[field];
    if (typeof value === "string" && !pattern.test(value)) {
      errors.push(`Field '${field}' does not match required pattern`);
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(", "));
  }
}

/**
 * Validate field values within a range
 * @param {Object} req - Request object
 * @param {Object} rangeSchema - Schema mapping fields to min/max values
 * @throws {ValidationError} If validation fails
 */
export function validateRanges(req, rangeSchema) {
  const errors = [];

  for (const [field, range] of Object.entries(rangeSchema)) {
    if (!(field in req) || req[field] === null || req[field] === undefined) continue;

    const value = req[field];
    if (typeof value === "number") {
      if (range.min !== undefined && value < range.min) {
        errors.push(`Field '${field}' must be >= ${range.min}`);
      }
      if (range.max !== undefined && value > range.max) {
        errors.push(`Field '${field}' must be <= ${range.max}`);
      }
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(", "));
  }
}

/**
 * Validate enum values
 * @param {Object} req - Request object
 * @param {Object} enumSchema - Schema mapping fields to allowed value arrays
 * @throws {ValidationError} If validation fails
 */
export function validateEnums(req, enumSchema) {
  const errors = [];

  for (const [field, allowedValues] of Object.entries(enumSchema)) {
    if (!(field in req) || req[field] === null || req[field] === undefined) continue;

    const value = req[field];
    if (!allowedValues.includes(value)) {
      errors.push(
        `Field '${field}' must be one of: ${allowedValues.map((v) => JSON.stringify(v)).join(", ")}`
      );
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(", "));
  }
}

/**
 * Validate request against a complete schema
 * @param {Object} req - Request object
 * @param {Object} schema - Schema object with optional/required fields and validators
 * @throws {ValidationError} If validation fails
 */
export function validateRequest(req, schema) {
  if (!req || typeof req !== "object") {
    throw new ValidationError("Request must be an object");
  }

  // Validate required fields
  if (schema.required) {
    validateRequired(req, schema.required);
  }

  // Validate types
  if (schema.types) {
    validateTypes(req, schema.types);
  }

  // Validate patterns
  if (schema.patterns) {
    validatePatterns(req, schema.patterns);
  }

  // Validate ranges
  if (schema.ranges) {
    validateRanges(req, schema.ranges);
  }

  // Validate enums
  if (schema.enums) {
    validateEnums(req, schema.enums);
  }

  console.log("[DEBUG] Validation passed for request:", { schema: schema.name || "unnamed" });
}

/**
 * Safe validation wrapper that returns error instead of throwing
 * @param {Object} req - Request object
 * @param {Object} schema - Validation schema
 * @returns {Object} Validation result with success/error
 */
export function safeValidate(req, schema) {
  try {
    validateRequest(req, schema);
    return { success: true, error: null };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { success: false, error: error.message, field: error.field };
    }
    return { success: false, error: error.message, field: null };
  }
}

/**
 * Common validation schemas
 */
export const schemas = {
  models: {
    name: "models",
    required: ["modelId"],
    types: { modelId: "string" },
    patterns: { modelId: /^[a-zA-Z0-9._-]+$/ },
  },

  config: {
    name: "config",
    types: {
      baseModelsPath: "string",
      port: "number",
      host: "string",
      ctxSize: "number",
    },
    ranges: { port: { min: 1, max: 65535 }, ctxSize: { min: 512, max: 131072 } },
  },

  logs: {
    name: "logs",
    types: { limit: "number", offset: "number" },
    ranges: { limit: { min: 1, max: 1000 }, offset: { min: 0 } },
  },

  router: {
    name: "router",
    types: { action: "string" },
    enums: { action: ["start", "stop", "restart"] },
  },
};
