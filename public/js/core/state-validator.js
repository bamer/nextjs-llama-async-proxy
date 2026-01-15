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
   * Register a validation schema for a key
   * @param {string} key - State key to associate schema with
   * @param {Object} schema - Validation schema object
   * @returns {StateValidator} this for chaining
   */
  registerSchema(key, schema) {
    this.schemas.set(key, schema);
    console.log("[DEBUG] StateValidator: Schema registered:", key, schema);
    return this;
  }

  /**
   * Register multiple schemas at once
   * @param {Object} schemas - Object mapping keys to schemas
   * @returns {StateValidator} this for chaining
   */
  registerSchemas(schemas) {
    Object.entries(schemas).forEach(([key, schema]) => {
      this.registerSchema(key, schema);
    });
    return this;
  }

  /**
   * Validate a value against a schema
   * @param {string} key - State key (for schema lookup and error reporting)
   * @param {*} value - Value to validate
   * @param {Object} [schema=null] - Optional inline schema to use
   * @returns {Object} Validation result { valid: boolean, errors: Array }
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
   * Validate multiple values at once
   * @param {Object} values - Object mapping keys to values to validate
   * @returns {Object} Result { allValid: boolean, results: Object }
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
   * Enable or disable strict validation mode
   * @param {boolean} strict - True to throw on validation errors
   * @returns {StateValidator} this for chaining
   */
  setStrictMode(strict) {
    this.strict = strict;
    return this;
  }

  /**
   * Get all accumulated validation errors
   * @returns {Array} Array of error objects { path, message }
   */
  getErrors() {
    return [...this.errors];
  }

  /**
   * Clear all accumulated validation errors
   */
  clearErrors() {
    this.errors = [];
  }

  /**
   * Internal method to validate a value against a schema
   * @param {*} value - Value to validate
   * @param {Object} schema - Validation schema
   * @param {string} [path=""] - Current path for error reporting
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
   * Check if a value matches an expected type
   * @param {*} value - Value to check
   * @param {string} type - Expected type name
   * @returns {boolean} True if value matches type
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
   * Validate object properties against schema
   * @param {Object} obj - Object to validate
   * @param {Object} schema - Object schema with properties
   * @param {string} path - Current path for error reporting
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
   * Validate array items against schema
   * @param {Array} arr - Array to validate
   * @param {Object} schema - Array schema with items definition
   * @param {string} path - Current path for error reporting
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
   * Create a string validator schema
   * @param {Object} [options={}] - Validation options
   * @param {number} [options.minLength] - Minimum string length
   * @param {number} [options.maxLength] - Maximum string length
   * @param {RegExp} [options.pattern] - Regex pattern to match
   * @returns {Object} String validator schema
   */
  string(options = {}) {
    return { type: "string", ...options };
  },

  /**
   * Create a number validator schema
   * @param {Object} [options={}] - Validation options
   * @param {number} [options.min] - Minimum value (inclusive)
   * @param {number} [options.max] - Maximum value (inclusive)
   * @returns {Object} Number validator schema
   */
  number(options = {}) {
    return { type: "number", ...options };
  },

  /**
   * Create a boolean validator schema
   * @param {Object} [options={}] - Validation options
   * @returns {Object} Boolean validator schema
   */
  boolean(options = {}) {
    return { type: "boolean", ...options };
  },

  /**
   * Create an array validator schema
   * @param {Object} itemSchema - Schema for array items
   * @param {Object} [options={}] - Validation options
   * @param {number} [options.minLength] - Minimum array length
   * @param {number} [options.maxLength] - Maximum array length
   * @returns {Object} Array validator schema
   */
  array(itemSchema, options = {}) {
    return { type: "array", items: itemSchema, ...options };
  },

  /**
   * Create an object validator schema
   * @param {Object} properties - Object property schemas
   * @param {Object} [options={}] - Validation options
   * @param {Array<string>} [options.required] - Required property names
   * @returns {Object} Object validator schema
   */
  object(properties, options = {}) {
    return { type: "object", properties, ...options };
  },

  /**
   * Create an enum validator schema (value must be one of specified values)
   * @param {Array} values - Allowed values
   * @param {Object} [options={}] - Validation options
   * @returns {Object} Enum validator schema
   */
  enum(values, options = {}) {
    return { enum: values, ...options };
  },

  /**
   * Create a custom validator schema
   * @param {Function} validatorFn - Custom validation function
   * @param {Object} [options={}] - Validation options
   * @returns {Object} Custom validator schema
   */
  custom(validatorFn, options = {}) {
    return { validator: validatorFn, ...options };
  },

  /**
   * Mark a field as required
   * @param {Object} schema - Schema to make required
   * @returns {Object} Required schema
   */
  required(schema) {
    return { ...schema, required: true };
  },

  /**
   * Mark a field as optional
   * @param {Object} schema - Schema to make optional
   * @returns {Object} Optional schema
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

  // Logs schema - very lenient validation since logs are display-only
  logs: ValidationHelpers.array(
    ValidationHelpers.object({
      level: ValidationHelpers.optional(ValidationHelpers.string()),
      message: ValidationHelpers.string(),
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
