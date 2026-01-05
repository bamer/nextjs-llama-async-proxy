/**
 * Validation Utilities
 * Input validation and sanitization helpers
 */

const ValidationUtils = {
  /**
   * Check if value is empty (null, undefined, empty string, empty array, empty object)
   * @param {any} value - Value to check
   * @returns {boolean} True if empty
   */
  isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === 'object' && Object.keys(value).length === 0) return true;
    return false;
  },

  /**
   * Check if value is a valid string (not empty)
   * @param {any} value - Value to check
   * @returns {boolean} True if valid string
   */
  isString(value) {
    return typeof value === 'string' && value.trim().length > 0;
  },

  /**
   * Check if value is a valid number
   * @param {any} value - Value to check
   * @param {number} min - Minimum value (optional)
   * @param {number} max - Maximum value (optional)
   * @returns {boolean} True if valid number
   */
  isNumber(value, min = null, max = null) {
    if (typeof value !== 'number' || isNaN(value)) return false;
    if (min !== null && value < min) return false;
    if (max !== null && value > max) return false;
    return true;
  },

  /**
   * Check if value is a valid integer
   * @param {any} value - Value to check
   * @returns {boolean} True if valid integer
   */
  isInteger(value) {
    return Number.isInteger(value) && !isNaN(value);
  },

  /**
   * Check if value is a valid positive integer
   * @param {any} value - Value to check
   * @returns {boolean} True if valid positive integer
   */
  isPositiveInteger(value) {
    return ValidationUtils.isInteger(value) && value > 0;
  },

  /**
   * Check if value is a valid email
   * @param {string} email - Email to check
   * @returns {boolean} True if valid email
   */
  isEmail(email) {
    if (typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Check if value is a valid URL
   * @param {string} url - URL to check
   * @returns {boolean} True if valid URL
   */
  isUrl(url) {
    if (typeof url !== 'string') return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Check if value is a valid IP address (IPv4)
   * @param {string} ip - IP address to check
   * @returns {boolean} True if valid IPv4 address
   */
  isIpv4(ip) {
    if (typeof ip !== 'string') return false;
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipv4Regex.test(ip)) return false;
    const parts = ip.split('.').map(Number);
    return parts.every(part => part >= 0 && part <= 255);
  },

  /**
   * Check if value is a valid port number
   * @param {number} port - Port number to check
   * @returns {boolean} True if valid port
   */
  isPort(port) {
    return ValidationUtils.isNumber(port, 1, 65535);
  },

  /**
   * Check if value is a valid file path
   * @param {string} path - File path to check
   * @returns {boolean} True if valid file path
   */
  isFilePath(path) {
    if (typeof path !== 'string') return false;
    if (path.length === 0) return false;
    if (path.includes('..')) return false; // Prevent directory traversal
    // Allow alphanumeric, underscores, hyphens, dots, forward slashes
    // Forward slash doesn't need escaping in character class
    // Using regex that matches valid filename characters plus /
    return /^[\w\-./]+$/.test(path);
  },

  /**
   * Check if value is a valid model name
   * @param {string} name - Model name to check
   * @returns {boolean} True if valid model name
   */
  isModelName(name) {
    if (typeof name !== 'string') return false;
    if (name.trim().length === 0) return false;
    if (name.trim().length > 100) return false;
    // Allow alphanumeric, underscores, hyphens, dots, and slashes for paths
    return /^[a-zA-Z0-9_\-./]+$/.test(name);
  },

  /**
   * Check if value is a valid JSON string
   * @param {string} str - String to check
   * @returns {boolean} True if valid JSON
   */
  isJson(str) {
    if (typeof str !== 'string') return false;
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Sanitize string to prevent XSS
   * @param {string} str - String to sanitize
   * @returns {string} Sanitized string
   */
  sanitize(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  /**
   * Trim and validate string input
   * @param {any} value - Value to process
   * @param {number} maxLength - Maximum length
   * @returns {string} Trimmed string or empty string
   */
  sanitizeString(value, maxLength = 1000) {
    if (typeof value !== 'string') return '';
    return value.trim().substring(0, maxLength);
  },

  /**
   * Validate object has required keys
   * @param {Object} obj - Object to validate
   * @param {string[]} requiredKeys - Keys that must be present
   * @returns {boolean} True if all required keys present
   */
  hasRequiredKeys(obj, requiredKeys) {
    if (typeof obj !== 'object' || obj === null) return false;
    return requiredKeys.every(key => key in obj);
  },

  /**
   * Validate that all values in object match a predicate
   * @param {Object} obj - Object to validate
   * @param {Function} predicate - Function that returns true for valid values
   * @returns {boolean} True if all values valid
   */
  validateAllValues(obj, predicate) {
    if (typeof obj !== 'object' || obj === null) return false;
    return Object.values(obj).every(predicate);
  },

  /**
   * Check if model status is valid
   * @param {string} status - Status to check
   * @returns {boolean} True if valid status
   */
  isValidModelStatus(status) {
    const validStatuses = ['idle', 'loading', 'running', 'error', 'stopped'];
    return validStatuses.includes(status);
  },

  /**
   * Check if log level is valid
   * @param {string} level - Level to check
   * @returns {boolean} True if valid level
   */
  isValidLogLevel(level) {
    const validLevels = ['debug', 'info', 'warn', 'error'];
    return validLevels.includes(level);
  }
};

// Export for use in other modules
window.ValidationUtils = ValidationUtils;
