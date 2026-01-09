/**
 * Presets Components Index
 * Re-exports all presets components for easy importing
 */

// Load dependencies first
require("./validation");
require("./parameters");

// Load components
require("./parameter-input");
require("./parameter-section");
require("./parameter-form");

// Export reference (for debugging)
window.PresetsComponents = {
  ParameterForm: window.ParameterForm,
  ParameterSection: window.ParameterSection,
  ParameterInput: window.ParameterInput,
  ParameterCategories: window.ParameterCategories,
  ValidationRules: window.ValidationRules,
  validateParameter: window.validateParameter,
  validateAll: window.validateAll,
  getAllParameters: window.getAllParameters,
  getCategoryInfo: window.getCategoryInfo,
  buildCliArgs: window.buildCliArgs,
};
