/**
 * Validation Utilities for Parameter Inputs
 * Provides validation rules, error messages, and validation helpers
 */

const ValidationRules = {
  /**
   * Required field validation
   */
  required: {
    validate: (value) => {
      if (value === null || value === undefined) return false;
      if (typeof value === "string") return value.trim().length > 0;
      if (typeof value === "number") return !isNaN(value);
      if (typeof value === "boolean") return true;
      if (Array.isArray(value)) return value.length > 0;
      return !!value;
    },
    message: "This field is required",
  },

  /**
   * String length validation
   */
  minLength: {
    validate: (value, min) => {
      return typeof value === "string" && value.length >= min;
    },
    message: (min) => `Must be at least ${min} characters`,
  },

  maxLength: {
    validate: (value, max) => {
      return typeof value === "string" && value.length <= max;
    },
    message: (max) => `Must be at most ${max} characters`,
  },

  /**
   * Number range validation
   */
  min: {
    validate: (value, min) => {
      return typeof value === "number" && value >= min;
    },
    message: (min) => `Must be at least ${min}`,
  },

  max: {
    validate: (value, max) => {
      return typeof value === "number" && value <= max;
    },
    message: (max) => `Must be at most ${max}`,
  },

  /**
   * Integer validation
   */
  integer: {
    validate: (value) => {
      return typeof value === "number" && Number.isInteger(value);
    },
    message: "Must be a whole number",
  },

  /**
   * Positive number validation
   */
  positive: {
    validate: (value) => {
      return typeof value === "number" && value > 0;
    },
    message: "Must be a positive number",
  },

  /**
   * Non-negative number validation
   */
  nonNegative: {
    validate: (value) => {
      return typeof value === "number" && value >= 0;
    },
    message: "Must be a non-negative number",
  },

  /**
   * Enum validation
   */
  enum: {
    validate: (value, allowedValues) => {
      return allowedValues.includes(value);
    },
    message: (allowedValues) => `Must be one of: ${allowedValues.join(", ")}`,
  },

  /**
   * Pattern validation (regex)
   */
  pattern: {
    validate: (value, pattern) => {
      if (typeof value !== "string") return false;
      if (pattern instanceof RegExp) return pattern.test(value);
      return new RegExp(pattern).test(value);
    },
    message: "Invalid format",
  },

  /**
   * Array validation
   */
  array: {
    validate: (value) => Array.isArray(value),
    message: "Must be a list",
  },

  arrayNotEmpty: {
    validate: (value) => Array.isArray(value) && value.length > 0,
    message: "Must select at least one option",
  },

  /**
   * Tensor split format validation (comma-separated numbers)
   */
  tensorSplit: {
    validate: (value) => {
      if (typeof value !== "string") return false;
      const parts = value.split(",").map((s) => s.trim());
      if (parts.length === 0) return false;
      return parts.every((p) => {
        const num = parseFloat(p);
        return !isNaN(num) && num >= 0 && num <= 1;
      });
    },
    message: "Must be comma-separated values between 0 and 1 (e.g., 0.5,0.5)",
  },

  /**
   * File path validation
   */
  filePath: {
    validate: (value) => {
      if (typeof value !== "string") return false;
      // Basic path validation - not empty and no null bytes
      return value.length > 0 && !value.includes("\0");
    },
    message: "Invalid file path",
  },
};

/**
 * Validate a single value against parameter rules
 */
function validateValue(paramId, value, paramConfig) {
  const errors = [];
  const warnings = [];
  const rules = paramConfig.validation || {};

  // Type validation
  if (rules.type === "number" && typeof value !== "number") {
    errors.push("Must be a number");
  } else if (rules.type === "string" && typeof value !== "string") {
    errors.push("Must be text");
  } else if (rules.type === "boolean" && typeof value !== "boolean") {
    errors.push("Must be a yes/no value");
  } else if (rules.type === "array" && !Array.isArray(value)) {
    errors.push("Must be a list");
  }

  // Required validation
  if (rules.required) {
    const isEmpty = value === null || value === undefined || value === "";
    if (isEmpty && rules.required !== false) {
      errors.push(ValidationRules.required.message);
    }
  }

  // Number range validation
  if (typeof value === "number" && !isNaN(value)) {
    if (rules.min !== undefined && !ValidationRules.min.validate(value, rules.min)) {
      if (value < rules.min) {
        errors.push(ValidationRules.min.message(rules.min));
      }
    }
    if (rules.max !== undefined && !ValidationRules.max.validate(value, rules.max)) {
      if (value > rules.max) {
        errors.push(ValidationRules.max.message(rules.max));
      }
    }
  }

  // String length validation
  if (typeof value === "string") {
    if (
      rules.minLength !== undefined &&
      !ValidationRules.minLength.validate(value, rules.minLength)
    ) {
      warnings.push(ValidationRules.minLength.message(rules.minLength));
    }
    if (
      rules.maxLength !== undefined &&
      !ValidationRules.maxLength.validate(value, rules.maxLength)
    ) {
      errors.push(ValidationRules.maxLength.message(rules.maxLength));
    }
  }

  // Enum validation
  if (rules.values && !ValidationRules.enum.validate(value, rules.values)) {
    errors.push(ValidationRules.enum.message(rules.values));
  }

  // Custom tensor split validation
  if (rules.type === "tensorSplit" && !ValidationRules.tensorSplit.validate(value)) {
    errors.push(ValidationRules.tensorSplit.message);
  }

  // Pattern validation
  if (rules.pattern && !ValidationRules.pattern.validate(value, rules.pattern)) {
    errors.push(ValidationRules.pattern.message);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate multiple values
 */
function validateAll(config, parameters) {
  const allParams = window.getAllParameters();
  const result = {
    valid: true,
    errors: {},
    warnings: {},
  };

  Object.entries(config).forEach(([paramId, value]) => {
    const paramConfig = allParams[paramId];
    if (!paramConfig) return;

    const validation = validateValue(paramId, value, paramConfig);
    if (!validation.valid) {
      result.valid = false;
      result.errors[paramId] = validation.errors;
    }
    if (validation.warnings.length > 0) {
      result.warnings[paramId] = validation.warnings;
    }
  });

  return result;
}

/**
 * Validate a single parameter by ID
 */
function validateParameter(paramId, value) {
  const allParams = window.getAllParameters();
  const paramConfig = allParams[paramId];

  if (!paramConfig) {
    return {
      valid: false,
      errors: ["Unknown parameter"],
      warnings: [],
    };
  }

  return validateValue(paramId, value, paramConfig);
}

/**
 * Check if a value has changed from default
 */
function hasChanged(value, defaultValue) {
  if (Array.isArray(value) && Array.isArray(defaultValue)) {
    if (value.length !== defaultValue.length) return true;
    return value.some((v, i) => v !== defaultValue[i]);
  }
  return value !== defaultValue;
}

/**
 * Debounce validation for real-time feedback
 */
function debouncedValidate(paramId, value, delay = 300) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const result = validateParameter(paramId, value);
      resolve(result);
    }, delay);
  });
}

/**
 * Get validation status for display
 */
function getValidationStatus(validation) {
  if (!validation) return "idle";
  if (validation.errors.length > 0) return "error";
  if (validation.warnings.length > 0) return "warning";
  return "valid";
}

/**
 * Format validation message for display
 */
function formatValidationMessage(validation) {
  if (!validation || validation.valid) return "";
  const allMessages = [...validation.errors, ...validation.warnings];
  return allMessages.join("; ");
}

/**
 * Create validation summary
 */
function createValidationSummary(validationResult) {
  const summary = {
    errorCount: 0,
    warningCount: 0,
    errorFields: [],
    warningFields: [],
  };

  if (validationResult.errors) {
    Object.entries(validationResult.errors).forEach(([field, errors]) => {
      if (errors.length > 0) {
        summary.errorCount += errors.length;
        summary.errorFields.push(field);
      }
    });
  }

  if (validationResult.warnings) {
    Object.entries(validationResult.warnings).forEach(([field, warnings]) => {
      if (warnings.length > 0) {
        summary.warningCount += warnings.length;
        summary.warningFields.push(field);
      }
    });
  }

  summary.hasErrors = summary.errorCount > 0;
  summary.hasWarnings = summary.warningCount > 0;
  summary.isValid = !summary.hasErrors;

  return summary;
}

// Export validation utilities
window.ValidationRules = ValidationRules;
window.validateValue = validateValue;
window.validateAll = validateAll;
window.validateParameter = validateParameter;
window.hasChanged = hasChanged;
window.debouncedValidate = debouncedValidate;
window.getValidationStatus = getValidationStatus;
window.formatValidationMessage = formatValidationMessage;
window.createValidationSummary = createValidationSummary;
