/**
 * State Validation System
 * Prevents invalid state from corrupting the application
 */

class StateValidator {
  constructor() {
    this.schemas = new Map();
    this.errors = [];
    this.strict = true; // Throw on validation errors if true
  }

  /**
   * Register a validation schema
   */
  registerSchema(key, schema) {
    this.schemas.set(key, schema);
    console.log("[DEBUG] StateValidator: Schema registered:", key, schema);
    return this;
  }

  /**
   * Register multiple schemas
   */
  registerSchemas(schemas) {
    Object.entries(schemas).forEach(([key, schema]) => {
      this.registerSchema(key, schema);
    });
    return this;
  }

  /**
   * Validate a value against a schema
   */
  validate(key, value, schema = null) {
    this.errors = [];
    const actualSchema = schema || this.schemas.get(key);

    if (!actualSchema) {
      // No schema registered, always valid
      return { valid: true, errors: [] };
    }

    this._validateValue(value, actualSchema, key);

    const result = {
      valid: this.errors.length === 0,
      errors: this.errors,
    };

    if (!result.valid && this.strict) {
      console.error("[StateValidator] Validation failed:", {
        key,
        value,
        errors: result.errors,
      });
    }

    return result;
  }

  /**
   * Validate multiple values
   */
  validateAll(values) {
    const results = {};

    for (const [key, value] of Object.entries(values)) {
      results[key] = this.validate(key, value);
    }

    const allValid = Object.values(results).every((r) => r.valid);

    if (!allValid) {
      console.error("[StateValidator] Validation failed for:", results);
    }

    return { allValid, results };
  }

  /**
   * Set strict mode
   */
  setStrictMode(strict) {
    this.strict = strict;
    return this;
  }

  /**
   * Get all validation errors
   */
  getErrors() {
    return [...this.errors];
  }

  /**
   * Clear all errors
   */
  clearErrors() {
    this.errors = [];
  }

  /**
   * Internal validation method
   */
  _validateValue(value, schema, path = "") {
    // Check required
    if (schema.required && (value === undefined || value === null)) {
      this.errors.push({
        path,
        message: `${path} is required but was ${value}`,
      });
      return;
    }

    // Allow null/undefined if not required
    if (value === null || value === undefined) {
      return;
    }

    // Check type
    if (schema.type) {
      if (!this._checkType(value, schema.type)) {
        this.errors.push({
          path,
          message: `${path} should be ${schema.type}, got ${typeof value}`,
        });
        return;
      }
    }

    // Check enum values
    if (schema.enum && !schema.enum.includes(value)) {
      this.errors.push({
        path,
        message: `${path} should be one of ${schema.enum.join(", ")}, got ${value}`,
      });
      return;
    }

    // Check min/max for numbers
    if (typeof value === "number") {
      if (schema.min !== undefined && value < schema.min) {
        this.errors.push({
          path,
          message: `${path} should be >= ${schema.min}, got ${value}`,
        });
      }
      if (schema.max !== undefined && value > schema.max) {
        this.errors.push({
          path,
          message: `${path} should be <= ${schema.max}, got ${value}`,
        });
      }
    }

    // Check min/max length for strings and arrays
    if (typeof value === "string" || Array.isArray(value)) {
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        this.errors.push({
          path,
          message: `${path} should have min length ${schema.minLength}, got ${value.length}`,
        });
      }
      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        this.errors.push({
          path,
          message: `${path} should have max length ${schema.maxLength}, got ${value.length}`,
        });
      }
    }

    // Check regex pattern for strings
    if (typeof value === "string" && schema.pattern) {
      if (!schema.pattern.test(value)) {
        this.errors.push({
          path,
          message: `${path} does not match pattern ${schema.pattern}`,
        });
      }
    }

    // Check object properties
    if (typeof value === "object" && !Array.isArray(value) && schema.properties) {
      this._validateObject(value, schema, path);
    }

    // Check array items
    if (Array.isArray(value) && schema.items) {
      this._validateArray(value, schema, path);
    }

    // Custom validator
    if (schema.validator && typeof schema.validator === "function") {
      const customResult = schema.validator(value);
      if (customResult !== true) {
        this.errors.push({
          path,
          message: customResult || `${path} failed custom validation`,
        });
      }
    }
  }

  /**
   * Check if value matches type
   */
  _checkType(value, type) {
    switch (type) {
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && !isNaN(value);
    case "boolean":
      return typeof value === "boolean";
    case "object":
      return typeof value === "object" && value !== null && !Array.isArray(value);
    case "array":
      return Array.isArray(value);
    case "null":
      return value === null;
    default:
      return true;
    }
  }

  /**
   * Validate object properties
   */
  _validateObject(obj, schema, path) {
    const { properties, required = [] } = schema;

    for (const [prop, propSchema] of Object.entries(properties)) {
      this._validateValue(obj[prop], propSchema, `${path}.${prop}`);
    }

    // Check required fields
    for (const req of required) {
      if (!(req in obj)) {
        this.errors.push({
          path,
          message: `${path}.${req} is required but missing`,
        });
      }
    }
  }

  /**
   * Validate array items
   */
  _validateArray(arr, schema, path) {
    arr.forEach((item, index) => {
      this._validateValue(item, schema.items, `${path}[${index}]`);
    });
  }
}

// Common validation helpers
const ValidationHelpers = {
  /**
   * Create a string validator
   */
  string(options = {}) {
    return { type: "string", ...options };
  },

  /**
   * Create a number validator
   */
  number(options = {}) {
    return { type: "number", ...options };
  },

  /**
   * Create a boolean validator
   */
  boolean(options = {}) {
    return { type: "boolean", ...options };
  },

  /**
   * Create an array validator
   */
  array(itemSchema, options = {}) {
    return { type: "array", items: itemSchema, ...options };
  },

  /**
   * Create an object validator
   */
  object(properties, options = {}) {
    return { type: "object", properties, ...options };
  },

  /**
   * Create an enum validator
   */
  enum(values, options = {}) {
    return { enum: values, ...options };
  },

  /**
   * Create a custom validator
   */
  custom(validatorFn, options = {}) {
    return { validator: validatorFn, ...options };
  },

  /**
   * Create a required field
   */
  required(schema) {
    return { ...schema, required: true };
  },

  /**
   * Create an optional field
   */
  optional(schema) {
    return { ...schema, required: false };
  },
};

// Global validator instance
const stateValidator = new StateValidator();

// Register common schemas for the application
stateValidator.registerSchemas({
  // Model status schema
  modelStatus: ValidationHelpers.enum([
    "loaded",
    "loading",
    "unloaded",
    "error",
    "running",
    "idle",
  ]),

  // Models array schema
  models: ValidationHelpers.array(
    ValidationHelpers.object({
      id: ValidationHelpers.string(),
      name: ValidationHelpers.string({ required: true }),
      status: ValidationHelpers.required(
        ValidationHelpers.enum(["loaded", "loading", "unloaded", "error", "running", "idle"])
      ),
      type: ValidationHelpers.optional(ValidationHelpers.string()),
      params: ValidationHelpers.optional(ValidationHelpers.string()),
      quantization: ValidationHelpers.optional(ValidationHelpers.string()),
      ctx_size: ValidationHelpers.optional(ValidationHelpers.number()),
      embedding_size: ValidationHelpers.optional(ValidationHelpers.number()),
      block_count: ValidationHelpers.optional(ValidationHelpers.number()),
      head_count: ValidationHelpers.optional(ValidationHelpers.number()),
      file_size: ValidationHelpers.optional(ValidationHelpers.number()),
    })
  ),

  // Router status schema
  routerStatus: ValidationHelpers.optional(
    ValidationHelpers.object({
      status: ValidationHelpers.enum(["running", "stopped", "error"]),
      port: ValidationHelpers.number({ min: 1, max: 65535 }),
      models: ValidationHelpers.optional(
        ValidationHelpers.array(
          ValidationHelpers.object({
            id: ValidationHelpers.string(),
            name: ValidationHelpers.string(),
            state: ValidationHelpers.enum(["loaded", "loading", "unloaded"]),
          })
        )
      ),
    })
  ),

  // Logs schema
  logs: ValidationHelpers.array(
    ValidationHelpers.object({
      id: ValidationHelpers.optional(ValidationHelpers.string()),
      level: ValidationHelpers.enum(["info", "warn", "error", "debug"]),
      message: ValidationHelpers.required(ValidationHelpers.string()),
      source: ValidationHelpers.optional(ValidationHelpers.string()),
      timestamp: ValidationHelpers.number(),
    })
  ),

  // Config schema
  config: ValidationHelpers.object({
    port: ValidationHelpers.number({ min: 1, max: 65535 }),
    host: ValidationHelpers.string(),
    modelsDir: ValidationHelpers.string(),
    modelsMax: ValidationHelpers.number({ min: 1 }),
  }),
});

window.StateValidator = StateValidator;
window.stateValidator = stateValidator;
window.ValidationHelpers = ValidationHelpers;
