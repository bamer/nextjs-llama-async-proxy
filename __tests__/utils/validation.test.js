/**
 * Validation Utilities Tests
 * Tests for ValidationUtils - pure JavaScript, no DOM required
 */

import { describe, it, expect } from '@jest/globals';

// Inline ValidationUtils for testing (copied from public/js/utils/validation.js)
const ValidationUtils = {
  isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === 'object' && Object.keys(value).length === 0) return true;
    return false;
  },

  isString(value) {
    return typeof value === 'string' && value.trim().length > 0;
  },

  isNumber(value, min = null, max = null) {
    if (typeof value !== 'number' || isNaN(value)) return false;
    if (min !== null && value < min) return false;
    if (max !== null && value > max) return false;
    return true;
  },

  isInteger(value) {
    return Number.isInteger(value) && !isNaN(value);
  },

  isPositiveInteger(value) {
    return ValidationUtils.isInteger(value) && value > 0;
  },

  isEmail(email) {
    if (typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isUrl(url) {
    if (typeof url !== 'string') return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  isIpv4(ip) {
    if (typeof ip !== 'string') return false;
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipv4Regex.test(ip)) return false;
    const parts = ip.split('.').map(Number);
    return parts.every(part => part >= 0 && part <= 255);
  },

  isPort(port) {
    return ValidationUtils.isNumber(port, 1, 65535);
  },

  isFilePath(path) {
    if (typeof path !== 'string') return false;
    if (path.length === 0) return false;
    if (path.includes('..')) return false;
    return !/[<>:"/\\|?*]/.test(path);
  },

  isModelName(name) {
    if (typeof name !== 'string') return false;
    if (name.trim().length === 0) return false;
    if (name.trim().length > 100) return false;
    return /^[a-zA-Z0-9_\-./]+$/.test(name);
  },

  isJson(str) {
    if (typeof str !== 'string') return false;
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  },

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

  sanitizeString(value, maxLength = 1000) {
    if (typeof value !== 'string') return '';
    return value.trim().substring(0, maxLength);
  },

  hasRequiredKeys(obj, requiredKeys) {
    if (typeof obj !== 'object' || obj === null) return false;
    return requiredKeys.every(key => key in obj);
  },

  validateAllValues(obj, predicate) {
    if (typeof obj !== 'object' || obj === null) return false;
    return Object.values(obj).every(predicate);
  },

  isValidModelStatus(status) {
    const validStatuses = ['idle', 'loading', 'running', 'error', 'stopped'];
    return validStatuses.includes(status);
  },

  isValidLogLevel(level) {
    const validLevels = ['debug', 'info', 'warn', 'error'];
    return validLevels.includes(level);
  }
};

describe('ValidationUtils', () => {
  describe('isEmpty', () => {
    it('should return true for null', () => {
      expect(ValidationUtils.isEmpty(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(ValidationUtils.isEmpty(undefined)).toBe(true);
    });

    it('should return true for empty string', () => {
      expect(ValidationUtils.isEmpty('')).toBe(true);
    });

    it('should return true for whitespace string', () => {
      expect(ValidationUtils.isEmpty('   ')).toBe(true);
    });

    it('should return true for empty array', () => {
      expect(ValidationUtils.isEmpty([])).toBe(true);
    });

    it('should return true for empty object', () => {
      expect(ValidationUtils.isEmpty({})).toBe(true);
    });

    it('should return false for non-empty string', () => {
      expect(ValidationUtils.isEmpty('hello')).toBe(false);
    });

    it('should return false for non-empty array', () => {
      expect(ValidationUtils.isEmpty([1, 2, 3])).toBe(false);
    });

    it('should return false for non-empty object', () => {
      expect(ValidationUtils.isEmpty({ key: 'value' })).toBe(false);
    });
  });

  describe('isString', () => {
    it('should return true for valid string', () => {
      expect(ValidationUtils.isString('hello')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(ValidationUtils.isString('')).toBe(false);
    });

    it('should return false for non-string', () => {
      expect(ValidationUtils.isString(123)).toBe(false);
    });
  });

  describe('isNumber', () => {
    it('should return true for valid number', () => {
      expect(ValidationUtils.isNumber(42)).toBe(true);
    });

    it('should return false for string number', () => {
      expect(ValidationUtils.isNumber('42')).toBe(false);
    });

    it('should return false for NaN', () => {
      expect(ValidationUtils.isNumber(NaN)).toBe(false);
    });

    it('should respect min parameter', () => {
      expect(ValidationUtils.isNumber(5, 10)).toBe(false);
      expect(ValidationUtils.isNumber(15, 10)).toBe(true);
    });

    it('should respect max parameter', () => {
      expect(ValidationUtils.isNumber(100, 0, 50)).toBe(false);
      expect(ValidationUtils.isNumber(30, 0, 50)).toBe(true);
    });
  });

  describe('isInteger', () => {
    it('should return true for integers', () => {
      expect(ValidationUtils.isInteger(42)).toBe(true);
      expect(ValidationUtils.isInteger(-5)).toBe(true);
      expect(ValidationUtils.isInteger(0)).toBe(true);
    });

    it('should return false for floats', () => {
      expect(ValidationUtils.isInteger(3.14)).toBe(false);
    });

    it('should return false for strings', () => {
      expect(ValidationUtils.isInteger('42')).toBe(false);
    });
  });

  describe('isPositiveInteger', () => {
    it('should return true for positive integers', () => {
      expect(ValidationUtils.isPositiveInteger(1)).toBe(true);
      expect(ValidationUtils.isPositiveInteger(100)).toBe(true);
    });

    it('should return false for zero', () => {
      expect(ValidationUtils.isPositiveInteger(0)).toBe(false);
    });

    it('should return false for negative numbers', () => {
      expect(ValidationUtils.isPositiveInteger(-1)).toBe(false);
    });
  });

  describe('isEmail', () => {
    it('should return true for valid emails', () => {
      expect(ValidationUtils.isEmail('test@example.com')).toBe(true);
      expect(ValidationUtils.isEmail('user.name@domain.org')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(ValidationUtils.isEmail('notanemail')).toBe(false);
      expect(ValidationUtils.isEmail('missing@domain')).toBe(false);
      expect(ValidationUtils.isEmail('@nodomain.com')).toBe(false);
    });
  });

  describe('isUrl', () => {
    it('should return true for valid URLs', () => {
      expect(ValidationUtils.isUrl('https://example.com')).toBe(true);
      expect(ValidationUtils.isUrl('http://localhost:3000')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(ValidationUtils.isUrl('not-a-url')).toBe(false);
      expect(ValidationUtils.isUrl('')).toBe(false);
    });
  });

  describe('isIpv4', () => {
    it('should return true for valid IPv4', () => {
      expect(ValidationUtils.isIpv4('192.168.1.1')).toBe(true);
      expect(ValidationUtils.isIpv4('127.0.0.1')).toBe(true);
    });

    it('should return false for invalid IPv4', () => {
      expect(ValidationUtils.isIpv4('256.1.1.1')).toBe(false);
      expect(ValidationUtils.isIpv4('192.168.1')).toBe(false);
      expect(ValidationUtils.isIpv4('not.an.ip')).toBe(false);
    });
  });

  describe('isPort', () => {
    it('should return true for valid ports', () => {
      expect(ValidationUtils.isPort(80)).toBe(true);
      expect(ValidationUtils.isPort(3000)).toBe(true);
      expect(ValidationUtils.isPort(65535)).toBe(true);
    });

    it('should return false for invalid ports', () => {
      expect(ValidationUtils.isPort(0)).toBe(false);
      expect(ValidationUtils.isPort(65536)).toBe(false);
      expect(ValidationUtils.isPort(-1)).toBe(false);
    });
  });

  describe('isFilePath', () => {
    it('should return true for valid file paths', () => {
      expect(ValidationUtils.isFilePath('models/llama-2.bin')).toBe(true);
      expect(ValidationUtils.isFilePath('test_file.txt')).toBe(true);
      expect(ValidationUtils.isFilePath('path/to/model.gguf')).toBe(true);
    });

    it('should return false for invalid file paths', () => {
      expect(ValidationUtils.isFilePath('../etc/passwd')).toBe(false); // Directory traversal
      expect(ValidationUtils.isFilePath('file<>name.txt')).toBe(false); // Invalid chars
      expect(ValidationUtils.isFilePath('file?name.txt')).toBe(false); // Question mark
    });
  });

  describe('isModelName', () => {
    it('should return true for valid model names', () => {
      expect(ValidationUtils.isModelName('llama-2-7b')).toBe(true);
      expect(ValidationUtils.isModelName('mistral-7b-v0.1')).toBe(true);
    });

    it('should return false for invalid model names', () => {
      expect(ValidationUtils.isModelName('')).toBe(false);
      expect(ValidationUtils.isModelName('model with spaces')).toBe(false);
    });
  });

  describe('isJson', () => {
    it('should return true for valid JSON', () => {
      expect(ValidationUtils.isJson('{"key": "value"}')).toBe(true);
      expect(ValidationUtils.isJson('[1, 2, 3]')).toBe(true);
    });

    it('should return false for invalid JSON', () => {
      expect(ValidationUtils.isJson('{invalid: json}')).toBe(false);
      expect(ValidationUtils.isJson('not json')).toBe(false);
    });
  });

  describe('sanitize', () => {
    it('should escape HTML entities', () => {
      expect(ValidationUtils.sanitize('<script>alert("xss")</script>'))
        .toContain('&lt;script&gt;');
    });

    it('should handle normal strings', () => {
      expect(ValidationUtils.sanitize('normal string')).toBe('normal string');
    });
  });

  describe('hasRequiredKeys', () => {
    it('should return true when all keys present', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(ValidationUtils.hasRequiredKeys(obj, ['a', 'b'])).toBe(true);
    });

    it('should return false when key missing', () => {
      const obj = { a: 1, b: 2 };
      expect(ValidationUtils.hasRequiredKeys(obj, ['a', 'c'])).toBe(false);
    });
  });

  describe('isValidModelStatus', () => {
    it('should return true for valid statuses', () => {
      expect(ValidationUtils.isValidModelStatus('idle')).toBe(true);
      expect(ValidationUtils.isValidModelStatus('loading')).toBe(true);
      expect(ValidationUtils.isValidModelStatus('running')).toBe(true);
      expect(ValidationUtils.isValidModelStatus('error')).toBe(true);
      expect(ValidationUtils.isValidModelStatus('stopped')).toBe(true);
    });

    it('should return false for invalid statuses', () => {
      expect(ValidationUtils.isValidModelStatus('unknown')).toBe(false);
      expect(ValidationUtils.isValidModelStatus('')).toBe(false);
    });
  });

  describe('isValidLogLevel', () => {
    it('should return true for valid levels', () => {
      expect(ValidationUtils.isValidLogLevel('debug')).toBe(true);
      expect(ValidationUtils.isValidLogLevel('info')).toBe(true);
      expect(ValidationUtils.isValidLogLevel('warn')).toBe(true);
      expect(ValidationUtils.isValidLogLevel('error')).toBe(true);
    });

    it('should return false for invalid levels', () => {
      expect(ValidationUtils.isValidLogLevel('trace')).toBe(false);
      expect(ValidationUtils.isValidLogLevel('')).toBe(false);
    });
  });
});
