/**
 * Web Worker for heavy computations
 * Handles validation, formatting, and data processing off the main thread
 */

// Message handler
self.onmessage = async (e) => {
  const { type, payload, id } = e.data;

  try {
    let result;

    switch (type) {
    case "validate:preset":
      result = await _validatePreset(payload);
      break;

    case "validate:parameters":
      result = await _validateParameters(payload);
      break;

    case "validate:value":
      result = _validateValue(payload.value, payload.type, payload.options);
      break;

    case "format:bytes":
      result = _formatBytes(payload);
      break;

    case "format:percent":
      result = _formatPercent(payload);
      break;

    case "format:timestamp":
      result = _formatTimestamp(payload);
      break;

    case "format:relative":
      result = _formatRelativeTime(payload);
      break;

    case "parse:ini":
      result = _parseIni(payload);
      break;

    case "parse:json":
      result = _parseJson(payload);
      break;

    case "generate:id":
      result = _generateId();
      break;

    case "deep:clone":
      result = _deepClone(payload);
      break;

    case "debounce":
      result = { message: "debounce is a function factory, not a value" };
      break;

    case "throttle":
      result = { message: "throttle is a function factory, not a value" };
      break;

    case "is:empty":
      result = _isEmpty(payload);
      break;

    case "hash:simple":
      result = _simpleHash(payload);
      break;

    default:
      throw new Error(`Unknown operation: ${type}`);
    }

    self.postMessage({ success: true, result, id });
  } catch (error) {
    self.postMessage({ success: false, error: error.message, id });
  }
};

/**
 * Validate a single value by type
 */
function _validateValue(value, type, options = {}) {
  switch (type) {
  case "string":
    return typeof value === "string" && value.trim().length > 0;

  case "number":
    if (typeof value !== "number" || isNaN(value) || !isFinite(value)) return false;
    if (options.min !== undefined && value < options.min) return false;
    if (options.max !== undefined && value > options.max) return false;
    return true;

  case "integer":
    return Number.isInteger(value) && !isNaN(value);

  case "positive":
    return typeof value === "number" && value > 0 && Number.isInteger(value);

  case "email":
    if (typeof value !== "string") return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);

  case "url":
    if (typeof value !== "string") return false;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }

  case "ipv4":
    if (typeof value !== "string") return false;
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipv4Regex.test(value)) return false;
    const parts = value.split(".").map(Number);
    return parts.every((part) => part >= 0 && part <= 255);

  case "port":
    return _validateValue(value, "number", { min: 1, max: 65535 });

  case "modelName":
    if (typeof value !== "string") return false;
    if (value.trim().length === 0 || value.trim().length > 100) return false;
    return /^[a-zA-Z0-9_\-./]+$/.test(value);

  default:
    return false;
  }
}

/**
 * Check if value is empty
 */
function _isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === "object" && Object.keys(value).length === 0) return true;
  return false;
}

/**
 * Simple hash function for strings
 */
function _simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Validate preset configuration
 */
async function _validatePreset(preset) {
  const errors = [];

  if (!preset.name || preset.name.trim() === "") {
    errors.push({ field: "name", message: "Preset name is required" });
  }

  // Validate parameters
  if (preset.parameters) {
    const paramErrors = _validateParameterValues(preset.parameters);
    errors.push(...paramErrors);
  }

  // Validate model configurations
  if (preset.models) {
    for (const [modelName, modelConfig] of Object.entries(preset.models)) {
      if (modelName === "*") continue; // Skip defaults section

      if (!modelConfig || typeof modelConfig !== "object") {
        errors.push({ field: `models.${modelName}`, message: "Invalid model configuration" });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate parameters
 */
async function _validateParameters(params) {
  const errors = [];

  for (const [key, value] of Object.entries(params)) {
    const paramDef = _findParamDefinition(key);
    if (!paramDef) continue;

    // Type validation
    if (paramDef.type === "number") {
      const num = Number(value);
      if (isNaN(num)) {
        errors.push({ field: key, message: `Expected number, got ${typeof value}` });
      } else {
        if (paramDef.min !== undefined && num < paramDef.min) {
          errors.push({ field: key, message: `Value ${num} is below minimum ${paramDef.min}` });
        }
        if (paramDef.max !== undefined && num > paramDef.max) {
          errors.push({ field: key, message: `Value ${num} exceeds maximum ${paramDef.max}` });
        }
      }
    }

    if (paramDef.type === "boolean") {
      if (typeof value !== "boolean" && value !== "true" && value !== "false") {
        errors.push({ field: key, message: "Expected boolean value" });
      }
    }

    if (paramDef.type === "select") {
      if (paramDef.options && !paramDef.options.includes(value)) {
        errors.push({ field: key, message: `Value must be one of: ${paramDef.options.join(", ")}` });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate parameter values
 */
function _validateParameterValues(parameters) {
  const errors = [];

  // Check for required parameters
  // Check value types and ranges

  return errors;
}

/**
 * Find parameter definition
 */
function _findParamDefinition(key) {
  // LLAMA_PARAMS is available via importScripts if needed
  // For now, return null to skip
  return null;
}

/**
 * Format bytes to human readable
 */
function _formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format percentage
 */
function _formatPercent(value) {
  if (value === null || value === undefined) return "N/A";
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Format timestamp to HH:MM:SS
 */
function _formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Format relative time (e.g., "2h ago")
 */
function _formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 0) {
    return "in the future";
  }

  const seconds = Math.trunc(diff / 1000);
  const minutes = Math.trunc(seconds / 60);
  const hours = Math.trunc(minutes / 60);
  const days = Math.trunc(hours / 24);
  const weeks = Math.trunc(days / 7);
  const months = Math.trunc(days / 30);
  const years = Math.trunc(days / 365);

  if (years > 0) return `${years}y ago`;
  if (months > 0) return `${months}mo ago`;
  if (weeks > 0) return `${weeks}w ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

/**
 * Parse INI-style configuration
 */
function _parseIni(content) {
  const result = {};
  let currentSection = null;

  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith(";")) continue;

    // Section header
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      currentSection = trimmed.slice(1, -1).trim();
      result[currentSection] = {};
      continue;
    }

    // Key-value pair
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();

      if (currentSection) {
        result[currentSection][key] = value;
      } else {
        result[key] = value;
      }
    }
  }

  return result;
}

/**
 * Parse JSON string
 */
function _parseJson(content) {
  try {
    return JSON.parse(content);
  } catch (e) {
    return { error: e.message, value: content };
  }
}

/**
 * Generate unique ID
 */
function _generateId() {
  const now = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${now}_${random}`;
}

/**
 * Deep clone object
 */
function _deepClone(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map((item) => _deepClone(item));
  if (obj instanceof Map) {
    return new Map(Array.from(obj.entries(), ([k, v]) => [k, _deepClone(v)]));
  }
  if (obj instanceof Set) {
    return new Set(Array.from(obj.values()).map((v) => _deepClone(v)));
  }

  const cloned = {};
  for (const key of Object.keys(obj)) {
    cloned[key] = _deepClone(obj[key]);
  }
  return cloned;
}
