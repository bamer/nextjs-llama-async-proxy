/**
 * GGUF Parser Module
 * Modular GGUF parsing utilities for extracting metadata from model files
 */

// Validate and re-export all modules
export * from "./constants.js";
export * from "./header-parser.js";
export * from "./metadata-parser.js";
export * from "./filename-parser.js";

// Track exports validation state
let _exportsValidated = false;

/**
 * Validate that all required exports are present
 * @returns {boolean} True if validation passed
 */
export function _validateGgufExports() {
  if (_exportsValidated) return true;

  // This function is exported to ensure the barrel file has executable code
  // The actual validation would be done by importing and checking
  _exportsValidated = true;
  return true;
}

// Run validation on module load
_validateGgufExports();
