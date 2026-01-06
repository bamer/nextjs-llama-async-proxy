/**
 * Validation Utilities Tests
 * Tests for ValidationUtils - pure JavaScript, no DOM required
 */

import { describe, it, expect } from "@jest/globals";

// Inline ValidationUtils for testing (copied from public/js/utils/validation.js)
const ValidationUtils = {
  isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === "string" && value.trim() === "") return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === "object" && Object.keys(value).length === 0) return true;
    return false;
  },

  isString(value) {
    return typeof value === "string" && value.trim().length > 0;
  },

  isNumber(value, min = null, max = null) {
    if (typeof value !== "number" || isNaN(value) || !isFinite(value)) return false;
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
    if (typeof email !== "string") return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isUrl(url) {
    if (typeof url !== "string") return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  isIpv4(ip) {
    if (typeof ip !== "string") return false;
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipv4Regex.test(ip)) return false;
    const parts = ip.split(".").map(Number);
    return parts.every((part) => part >= 0 && part <= 255);
  },

  isPort(port) {
    return ValidationUtils.isNumber(port, 1, 65535);
  },

  isFilePath(path) {
    if (typeof path !== "string") return false;
    if (path.length === 0) return false;
    if (path.includes("..")) return false;
    // Allow alphanumeric, underscores, hyphens, dots, forward slashes
    return /^[\w\-./]+$/.test(path);
  },

  isModelName(name) {
    if (typeof name !== "string") return false;
    if (name.trim().length === 0) return false;
    if (name.trim().length > 100) return false;
    return /^[a-zA-Z0-9_\-./]+$/.test(name);
  },

  isJson(str) {
    if (typeof str !== "string") return false;
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  },

  sanitize(str) {
    if (typeof str !== "string") return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  },

  sanitizeString(value, maxLength = 1000) {
    if (typeof value !== "string") return "";
    return value.trim().substring(0, maxLength);
  },

  hasRequiredKeys(obj, requiredKeys) {
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return false;
    if (!Array.isArray(requiredKeys)) return false;
    return requiredKeys.every((key) => key in obj);
  },

  validateAllValues(obj, predicate) {
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return false;
    if (typeof predicate !== "function") return false;
    return Object.values(obj).every(predicate);
  },

  isValidModelStatus(status) {
    const validStatuses = ["idle", "loading", "running", "error", "stopped"];
    return validStatuses.includes(status);
  },

  isValidLogLevel(level) {
    const validLevels = ["debug", "info", "warn", "error"];
    return validLevels.includes(level);
  },
};

describe("ValidationUtils", () => {
  describe("isEmpty", () => {
    // Positive tests - covers null, undefined, empty string, whitespace, empty array, empty object
    it("should return true for null", () => {
      expect(ValidationUtils.isEmpty(null)).toBe(true);
    });

    it("should return true for undefined", () => {
      expect(ValidationUtils.isEmpty(undefined)).toBe(true);
    });

    it("should return true for empty string", () => {
      expect(ValidationUtils.isEmpty("")).toBe(true);
    });

    it("should return true for whitespace string", () => {
      expect(ValidationUtils.isEmpty("   ")).toBe(true);
    });

    it("should return true for empty array", () => {
      expect(ValidationUtils.isEmpty([])).toBe(true);
    });

    it("should return true for empty object", () => {
      expect(ValidationUtils.isEmpty({})).toBe(true);
    });

    // Negative tests - covers non-empty values
    it("should return false for non-empty string", () => {
      expect(ValidationUtils.isEmpty("hello")).toBe(false);
    });

    it("should return false for non-empty array", () => {
      expect(ValidationUtils.isEmpty([1, 2, 3])).toBe(false);
    });

    it("should return false for non-empty object", () => {
      expect(ValidationUtils.isEmpty({ key: "value" })).toBe(false);
    });
  });

  describe("isString", () => {
    // Positive test - valid string
    it("should return true for valid string", () => {
      expect(ValidationUtils.isString("hello")).toBe(true);
    });

    // Negative tests - empty and non-string
    it("should return false for empty string", () => {
      expect(ValidationUtils.isString("")).toBe(false);
    });

    it("should return false for whitespace-only string", () => {
      expect(ValidationUtils.isString("   ")).toBe(false);
    });

    it("should return false for number", () => {
      expect(ValidationUtils.isString(123)).toBe(false);
    });

    it("should return false for null", () => {
      expect(ValidationUtils.isString(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(ValidationUtils.isString(undefined)).toBe(false);
    });

    it("should return false for array", () => {
      expect(ValidationUtils.isString(["hello"])).toBe(false);
    });

    it("should return false for object", () => {
      expect(ValidationUtils.isString({ value: "hello" })).toBe(false);
    });
  });

  describe("isNumber", () => {
    // Positive tests - valid numbers within bounds
    it("should return true for valid number", () => {
      expect(ValidationUtils.isNumber(42)).toBe(true);
    });

    it("should return true for zero", () => {
      expect(ValidationUtils.isNumber(0)).toBe(true);
    });

    it("should return true for negative number", () => {
      expect(ValidationUtils.isNumber(-5)).toBe(true);
    });

    it("should return true for decimal number", () => {
      expect(ValidationUtils.isNumber(3.14)).toBe(true);
    });

    // Boundary tests for min/max
    it("should return true at exact min boundary", () => {
      expect(ValidationUtils.isNumber(10, 10)).toBe(true);
    });

    it("should return true at exact max boundary", () => {
      expect(ValidationUtils.isNumber(50, 0, 50)).toBe(true);
    });

    it("should return true for number at both min and max boundaries", () => {
      expect(ValidationUtils.isNumber(5, 5, 5)).toBe(true);
    });

    // Negative tests - invalid types and out of bounds
    it("should return false for string number", () => {
      expect(ValidationUtils.isNumber("42")).toBe(false);
    });

    it("should return false for NaN", () => {
      expect(ValidationUtils.isNumber(NaN)).toBe(false);
    });

    it("should return false for null", () => {
      expect(ValidationUtils.isNumber(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(ValidationUtils.isNumber(undefined)).toBe(false);
    });

    it("should return false for Infinity", () => {
      expect(ValidationUtils.isNumber(Infinity)).toBe(false);
    });

    it("should return false for -Infinity", () => {
      expect(ValidationUtils.isNumber(-Infinity)).toBe(false);
    });

    it("should return false when below min", () => {
      expect(ValidationUtils.isNumber(5, 10)).toBe(false);
    });

    it("should return false when above max", () => {
      expect(ValidationUtils.isNumber(100, 0, 50)).toBe(false);
    });

    it("should return false for array", () => {
      expect(ValidationUtils.isNumber([1, 2, 3])).toBe(false);
    });

    it("should return false for object", () => {
      expect(ValidationUtils.isNumber({ value: 42 })).toBe(false);
    });
  });

  describe("isInteger", () => {
    // Positive tests - valid integers
    it("should return true for positive integers", () => {
      expect(ValidationUtils.isInteger(42)).toBe(true);
    });

    it("should return true for negative integers", () => {
      expect(ValidationUtils.isInteger(-5)).toBe(true);
    });

    it("should return true for zero", () => {
      expect(ValidationUtils.isInteger(0)).toBe(true);
    });

    // Negative tests - non-integers and invalid types
    it("should return false for floats", () => {
      expect(ValidationUtils.isInteger(3.14)).toBe(false);
    });

    it("should return false for string numbers", () => {
      expect(ValidationUtils.isInteger("42")).toBe(false);
    });

    it("should return false for NaN", () => {
      expect(ValidationUtils.isInteger(NaN)).toBe(false);
    });

    it("should return false for null", () => {
      expect(ValidationUtils.isInteger(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(ValidationUtils.isInteger(undefined)).toBe(false);
    });
  });

  describe("isPositiveInteger", () => {
    // Positive tests - valid positive integers
    it("should return true for positive integers", () => {
      expect(ValidationUtils.isPositiveInteger(1)).toBe(true);
    });

    it("should return true for large positive integers", () => {
      expect(ValidationUtils.isPositiveInteger(100)).toBe(true);
    });

    // Negative tests - zero, negative, and invalid types
    it("should return false for zero", () => {
      expect(ValidationUtils.isPositiveInteger(0)).toBe(false);
    });

    it("should return false for negative numbers", () => {
      expect(ValidationUtils.isPositiveInteger(-1)).toBe(false);
    });

    it("should return false for positive floats", () => {
      expect(ValidationUtils.isPositiveInteger(3.14)).toBe(false);
    });

    it("should return false for string", () => {
      expect(ValidationUtils.isPositiveInteger("5")).toBe(false);
    });

    it("should return false for null", () => {
      expect(ValidationUtils.isPositiveInteger(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(ValidationUtils.isPositiveInteger(undefined)).toBe(false);
    });
  });

  describe("isEmail", () => {
    // Positive tests - valid emails
    it("should return true for valid email with .com", () => {
      expect(ValidationUtils.isEmail("test@example.com")).toBe(true);
    });

    it("should return true for valid email with dots in username", () => {
      expect(ValidationUtils.isEmail("user.name@domain.org")).toBe(true);
    });

    it("should return true for email with plus sign", () => {
      expect(ValidationUtils.isEmail("user+tag@example.com")).toBe(true);
    });

    it("should return true for email with underscore", () => {
      expect(ValidationUtils.isEmail("user_name@domain.com")).toBe(true);
    });

    // Negative tests - invalid emails and edge cases
    it("should return false for non-string", () => {
      expect(ValidationUtils.isEmail(123)).toBe(false);
    });

    it("should return false for null", () => {
      expect(ValidationUtils.isEmail(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(ValidationUtils.isEmail(undefined)).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(ValidationUtils.isEmail("")).toBe(false);
    });

    it("should return false for string without @", () => {
      expect(ValidationUtils.isEmail("notanemail")).toBe(false);
    });

    it("should return false for string without domain TLD", () => {
      expect(ValidationUtils.isEmail("missing@domain")).toBe(false);
    });

    it("should return false for string starting with @", () => {
      expect(ValidationUtils.isEmail("@nodomain.com")).toBe(false);
    });

    it("should return false for string with spaces", () => {
      expect(ValidationUtils.isEmail("test @example.com")).toBe(false);
    });

    it("should return false for array", () => {
      expect(ValidationUtils.isEmail(["test@example.com"])).toBe(false);
    });
  });

  describe("isUrl", () => {
    // Positive tests - valid URLs
    it("should return true for valid https URL", () => {
      expect(ValidationUtils.isUrl("https://example.com")).toBe(true);
    });

    it("should return true for valid http URL with port", () => {
      expect(ValidationUtils.isUrl("http://localhost:3000")).toBe(true);
    });

    it("should return true for URL with path", () => {
      expect(ValidationUtils.isUrl("https://example.com/path/to/resource")).toBe(true);
    });

    it("should return true for URL with query params", () => {
      expect(ValidationUtils.isUrl("https://example.com?key=value")).toBe(true);
    });

    // Negative tests - invalid URLs and edge cases
    it("should return false for non-string", () => {
      expect(ValidationUtils.isUrl(123)).toBe(false);
    });

    it("should return false for null", () => {
      expect(ValidationUtils.isUrl(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(ValidationUtils.isUrl(undefined)).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(ValidationUtils.isUrl("")).toBe(false);
    });

    it("should return false for invalid URL format", () => {
      expect(ValidationUtils.isUrl("not-a-url")).toBe(false);
    });

    it("should return false for just domain", () => {
      expect(ValidationUtils.isUrl("example.com")).toBe(false);
    });

    it("should return false for array", () => {
      expect(ValidationUtils.isUrl(["https://example.com"])).toBe(false);
    });

    it("should return false for object", () => {
      expect(ValidationUtils.isUrl({ url: "https://example.com" })).toBe(false);
    });
  });

  describe("isIpv4", () => {
    // Positive tests - valid IPv4 addresses
    it("should return true for private network IP", () => {
      expect(ValidationUtils.isIpv4("192.168.1.1")).toBe(true);
    });

    it("should return true for localhost", () => {
      expect(ValidationUtils.isIpv4("127.0.0.1")).toBe(true);
    });

    it("should return true for boundary values 0", () => {
      expect(ValidationUtils.isIpv4("0.0.0.0")).toBe(true);
    });

    it("should return true for boundary values 255", () => {
      expect(ValidationUtils.isIpv4("255.255.255.255")).toBe(true);
    });

    it("should return true for mixed boundary values", () => {
      expect(ValidationUtils.isIpv4("0.255.0.255")).toBe(true);
    });

    // Negative tests - invalid IPv4 addresses
    it("should return false for non-string", () => {
      expect(ValidationUtils.isIpv4(123)).toBe(false);
    });

    it("should return false for null", () => {
      expect(ValidationUtils.isIpv4(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(ValidationUtils.isIpv4(undefined)).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(ValidationUtils.isIpv4("")).toBe(false);
    });

    it("should return false when octet exceeds 255", () => {
      expect(ValidationUtils.isIpv4("256.1.1.1")).toBe(false);
    });

    it("should return false when all octets exceed 255", () => {
      expect(ValidationUtils.isIpv4("300.400.500.600")).toBe(false);
    });

    it("should return false for incomplete IP", () => {
      expect(ValidationUtils.isIpv4("192.168.1")).toBe(false);
    });

    it("should return false for too many octets", () => {
      expect(ValidationUtils.isIpv4("192.168.1.1.1")).toBe(false);
    });

    it("should return false for non-numeric octets", () => {
      expect(ValidationUtils.isIpv4("not.an.ip")).toBe(false);
    });

    it("should return false for IP with letters", () => {
      expect(ValidationUtils.isIpv4("192.168.1a.1")).toBe(false);
    });

    it("should return false for array", () => {
      expect(ValidationUtils.isIpv4(["192.168.1.1"])).toBe(false);
    });

    it("should return false for object", () => {
      expect(ValidationUtils.isIpv4({ ip: "192.168.1.1" })).toBe(false);
    });
  });

  describe("isPort", () => {
    // Positive tests - valid ports
    it("should return true for common port 80", () => {
      expect(ValidationUtils.isPort(80)).toBe(true);
    });

    it("should return true for application port 3000", () => {
      expect(ValidationUtils.isPort(3000)).toBe(true);
    });

    it("should return true for max port 65535", () => {
      expect(ValidationUtils.isPort(65535)).toBe(true);
    });

    it("should return true for min port 1", () => {
      expect(ValidationUtils.isPort(1)).toBe(true);
    });

    // Negative tests - invalid ports
    it("should return false for port 0", () => {
      expect(ValidationUtils.isPort(0)).toBe(false);
    });

    it("should return false for port 65536", () => {
      expect(ValidationUtils.isPort(65536)).toBe(false);
    });

    it("should return false for negative port", () => {
      expect(ValidationUtils.isPort(-1)).toBe(false);
    });

    it("should return false for string port", () => {
      expect(ValidationUtils.isPort("3000")).toBe(false);
    });

    it("should return false for null", () => {
      expect(ValidationUtils.isPort(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(ValidationUtils.isPort(undefined)).toBe(false);
    });
  });

  describe("isFilePath", () => {
    // Positive tests - valid file paths
    it("should return true for path with directories", () => {
      expect(ValidationUtils.isFilePath("models/llama-2.bin")).toBe(true);
    });

    it("should return true for simple file name", () => {
      expect(ValidationUtils.isFilePath("test_file.txt")).toBe(true);
    });

    it("should return true for nested path", () => {
      expect(ValidationUtils.isFilePath("path/to/model.gguf")).toBe(true);
    });

    it("should return true for path with hyphens", () => {
      expect(ValidationUtils.isFilePath("my-model-file.bin")).toBe(true);
    });

    it("should return true for path with dots", () => {
      expect(ValidationUtils.isFilePath("model.v1.0.gguf")).toBe(true);
    });

    it("should return true for root level file", () => {
      expect(ValidationUtils.isFilePath("file.txt")).toBe(true);
    });

    // Negative tests - invalid file paths
    it("should return false for null", () => {
      expect(ValidationUtils.isFilePath(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(ValidationUtils.isFilePath(undefined)).toBe(false);
    });

    it("should return false for non-string", () => {
      expect(ValidationUtils.isFilePath(123)).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(ValidationUtils.isFilePath("")).toBe(false);
    });

    it("should return false for directory traversal", () => {
      expect(ValidationUtils.isFilePath("../etc/passwd")).toBe(false);
    });

    it("should return false for directory traversal in middle", () => {
      expect(ValidationUtils.isFilePath("models/../etc/passwd")).toBe(false);
    });

    it("should return false for path with angle brackets", () => {
      expect(ValidationUtils.isFilePath("file<>name.txt")).toBe(false);
    });

    it("should return false for path with question mark", () => {
      expect(ValidationUtils.isFilePath("file?name.txt")).toBe(false);
    });

    it("should return false for path with spaces", () => {
      expect(ValidationUtils.isFilePath("file name.txt")).toBe(false);
    });

    it("should return false for array", () => {
      expect(ValidationUtils.isFilePath(["models/file.txt"])).toBe(false);
    });
  });

  describe("isModelName", () => {
    // Helper to create a string of exactly 100 characters
    const createString100Chars = () => "a".repeat(100);
    const createString101Chars = () => "a".repeat(101);

    // Positive tests - valid model names
    it("should return true for valid model name with hyphens", () => {
      expect(ValidationUtils.isModelName("llama-2-7b")).toBe(true);
    });

    it("should return true for model name with dots", () => {
      expect(ValidationUtils.isModelName("mistral-7b-v0.1")).toBe(true);
    });

    it("should return true for model name with underscores", () => {
      expect(ValidationUtils.isModelName("my_model_name")).toBe(true);
    });

    it("should return true for model name with slashes", () => {
      expect(ValidationUtils.isModelName("models/llama")).toBe(true);
    });

    it("should return true for model name at exact 100 char limit", () => {
      expect(ValidationUtils.isModelName(createString100Chars())).toBe(true);
    });

    // Negative tests - invalid model names
    it("should return false for null", () => {
      expect(ValidationUtils.isModelName(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(ValidationUtils.isModelName(undefined)).toBe(false);
    });

    it("should return false for non-string", () => {
      expect(ValidationUtils.isModelName(123)).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(ValidationUtils.isModelName("")).toBe(false);
    });

    it("should return false for whitespace-only string", () => {
      expect(ValidationUtils.isModelName("   ")).toBe(false);
    });

    it("should return false for model name over 100 chars", () => {
      expect(ValidationUtils.isModelName(createString101Chars())).toBe(false);
    });

    it("should return false for model with spaces", () => {
      expect(ValidationUtils.isModelName("model with spaces")).toBe(false);
    });

    it("should return false for model with special chars", () => {
      expect(ValidationUtils.isModelName("model@name")).toBe(false);
    });

    it("should return false for array", () => {
      expect(ValidationUtils.isModelName(["llama-2-7b"])).toBe(false);
    });

    it("should return false for object", () => {
      expect(ValidationUtils.isModelName({ name: "llama-2-7b" })).toBe(false);
    });
  });

  describe("isJson", () => {
    // Positive tests - valid JSON strings
    it("should return true for valid JSON object", () => {
      expect(ValidationUtils.isJson('{"key": "value"}')).toBe(true);
    });

    it("should return true for valid JSON array", () => {
      expect(ValidationUtils.isJson("[1, 2, 3]")).toBe(true);
    });

    it("should return true for nested JSON", () => {
      expect(ValidationUtils.isJson('{"nested": {"key": "value"}}')).toBe(true);
    });

    it("should return true for JSON with numbers", () => {
      expect(ValidationUtils.isJson('{"number": 42, "float": 3.14}')).toBe(true);
    });

    it("should return true for JSON with booleans", () => {
      expect(ValidationUtils.isJson('{"true": true, "false": false}')).toBe(true);
    });

    it("should return true for JSON null", () => {
      expect(ValidationUtils.isJson("null")).toBe(true);
    });

    // Negative tests - invalid JSON and edge cases
    it("should return false for non-string", () => {
      expect(ValidationUtils.isJson(123)).toBe(false);
    });

    it("should return false for null", () => {
      expect(ValidationUtils.isJson(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(ValidationUtils.isJson(undefined)).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(ValidationUtils.isJson("")).toBe(false);
    });

    it("should return false for invalid JSON syntax", () => {
      expect(ValidationUtils.isJson("{invalid: json}")).toBe(false);
    });

    it("should return false for unquoted string", () => {
      expect(ValidationUtils.isJson("{key: value}")).toBe(false);
    });

    it("should return false for plain text", () => {
      expect(ValidationUtils.isJson("not json")).toBe(false);
    });

    it("should return false for trailing comma", () => {
      expect(ValidationUtils.isJson("[1, 2, 3,]")).toBe(false);
    });

    it("should return false for array input", () => {
      expect(ValidationUtils.isJson([1, 2, 3])).toBe(false);
    });

    it("should return false for object input", () => {
      expect(ValidationUtils.isJson({ key: "value" })).toBe(false);
    });
  });

  describe("sanitize", () => {
    // Positive tests - strings that need escaping
    it("should escape ampersand", () => {
      expect(ValidationUtils.sanitize("AT&T")).toBe("AT&amp;T");
    });

    it("should escape less than", () => {
      expect(ValidationUtils.sanitize("a < b")).toBe("a &lt; b");
    });

    it("should escape greater than", () => {
      expect(ValidationUtils.sanitize("a > b")).toBe("a &gt; b");
    });

    it("should escape double quotes", () => {
      expect(ValidationUtils.sanitize('say "hello"')).toBe("say &quot;hello&quot;");
    });

    it("should escape single quotes", () => {
      expect(ValidationUtils.sanitize("it's")).toBe("it&#x27;s");
    });

    it("should escape forward slash", () => {
      expect(ValidationUtils.sanitize("path/to/file")).toBe("path&#x2F;to&#x2F;file");
    });

    it("should escape XSS script tag", () => {
      expect(ValidationUtils.sanitize('<script>alert("xss")</script>')).toContain("&lt;script&gt;");
    });

    // Negative tests - non-string and empty inputs
    it("should return empty string for null", () => {
      expect(ValidationUtils.sanitize(null)).toBe("");
    });

    it("should return empty string for undefined", () => {
      expect(ValidationUtils.sanitize(undefined)).toBe("");
    });

    it("should return empty string for non-string", () => {
      expect(ValidationUtils.sanitize(123)).toBe("");
    });

    it("should return empty string for empty string input", () => {
      expect(ValidationUtils.sanitize("")).toBe("");
    });

    it("should return empty string for array input", () => {
      expect(ValidationUtils.sanitize(["script"])).toBe("");
    });

    it("should return empty string for object input", () => {
      expect(ValidationUtils.sanitize({ value: "test" })).toBe("");
    });

    // Positive test - normal strings should pass through
    it("should handle normal strings without changes", () => {
      expect(ValidationUtils.sanitize("normal string")).toBe("normal string");
    });

    // Positive test - combination of special chars
    it("should escape all special characters in combination", () => {
      const input = '<script>alert("test\'s & "/test");</script>';
      const result = ValidationUtils.sanitize(input);
      expect(result).toContain("&lt;script&gt;");
      expect(result).toContain("&#x27;");
      expect(result).toContain("&amp;");
      expect(result).toContain("&quot;");
    });
  });

  describe("sanitizeString", () => {
    // Positive tests - valid string sanitization
    it("should trim and return string within default max length", () => {
      expect(ValidationUtils.sanitizeString("  hello world  ")).toBe("hello world");
    });

    it("should respect custom max length", () => {
      expect(ValidationUtils.sanitizeString("hello world", 5)).toBe("hello");
    });

    it("should return empty string for whitespace-only within max length", () => {
      expect(ValidationUtils.sanitizeString("   ", 10)).toBe("");
    });

    it("should handle string exactly at max length", () => {
      expect(ValidationUtils.sanitizeString("hello", 5)).toBe("hello");
    });

    // Negative tests - non-string and edge cases
    it("should return empty string for null", () => {
      expect(ValidationUtils.sanitizeString(null)).toBe("");
    });

    it("should return empty string for undefined", () => {
      expect(ValidationUtils.sanitizeString(undefined)).toBe("");
    });

    it("should return empty string for non-string", () => {
      expect(ValidationUtils.sanitizeString(123)).toBe("");
    });

    it("should return empty string for empty string input", () => {
      expect(ValidationUtils.sanitizeString("")).toBe("");
    });

    it("should return empty string for array input", () => {
      expect(ValidationUtils.sanitizeString(["test"])).toBe("");
    });

    it("should return empty string for object input", () => {
      expect(ValidationUtils.sanitizeString({ value: "test" })).toBe("");
    });

    // Positive test - truncate long strings
    it("should truncate string longer than max length", () => {
      const longString = "a".repeat(2000);
      expect(ValidationUtils.sanitizeString(longString, 100)).toBe("a".repeat(100));
    });

    it("should handle zero max length", () => {
      expect(ValidationUtils.sanitizeString("hello", 0)).toBe("");
    });
  });

  describe("hasRequiredKeys", () => {
    // Positive tests - object has all required keys
    it("should return true when all keys present", () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(ValidationUtils.hasRequiredKeys(obj, ["a", "b"])).toBe(true);
    });

    it("should return true when checking single key that exists", () => {
      const obj = { name: "test" };
      expect(ValidationUtils.hasRequiredKeys(obj, ["name"])).toBe(true);
    });

    it("should return true when checking multiple keys that all exist", () => {
      const obj = { id: 1, name: "test", active: true };
      expect(ValidationUtils.hasRequiredKeys(obj, ["id", "name", "active"])).toBe(true);
    });

    it("should return true when requiredKeys is empty array", () => {
      const obj = { a: 1 };
      expect(ValidationUtils.hasRequiredKeys(obj, [])).toBe(true);
    });

    it("should return true when object has inherited properties but required key exists", () => {
      const parent = { inherited: true };
      const child = Object.create(parent);
      child.own = "value";
      expect(ValidationUtils.hasRequiredKeys(child, ["own"])).toBe(true);
    });

    // Negative tests - missing keys and invalid inputs
    it("should return false when key missing", () => {
      const obj = { a: 1, b: 2 };
      expect(ValidationUtils.hasRequiredKeys(obj, ["a", "c"])).toBe(false);
    });

    it("should return false when null object", () => {
      expect(ValidationUtils.hasRequiredKeys(null, ["key"])).toBe(false);
    });

    it("should return false when undefined object", () => {
      expect(ValidationUtils.hasRequiredKeys(undefined, ["key"])).toBe(false);
    });

    it("should return false when non-object", () => {
      expect(ValidationUtils.hasRequiredKeys("string", ["key"])).toBe(false);
    });

    it("should return false when object is array", () => {
      expect(ValidationUtils.hasRequiredKeys([1, 2, 3], ["0"])).toBe(false);
    });

    it("should return false when object is number", () => {
      expect(ValidationUtils.hasRequiredKeys(123, ["key"])).toBe(false);
    });

    it("should return false when requiredKeys is null", () => {
      const obj = { a: 1 };
      expect(ValidationUtils.hasRequiredKeys(obj, null)).toBe(false);
    });

    it("should return false when requiredKeys is undefined", () => {
      const obj = { a: 1 };
      expect(ValidationUtils.hasRequiredKeys(obj, undefined)).toBe(false);
    });

    it("should return false when requiredKeys is string", () => {
      const obj = { a: 1 };
      expect(ValidationUtils.hasRequiredKeys(obj, "a")).toBe(false);
    });

    it("should return false when requiredKeys is number", () => {
      const obj = { a: 1 };
      expect(ValidationUtils.hasRequiredKeys(obj, 123)).toBe(false);
    });
  });

  describe("validateAllValues", () => {
    // Helper predicates for testing
    const isNumber = (val) => typeof val === "number";
    const isString = (val) => typeof val === "string";
    const isPositive = (val) => typeof val === "number" && val > 0;

    // Positive tests - all values pass predicate
    it("should return true when all values pass predicate", () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(ValidationUtils.validateAllValues(obj, isNumber)).toBe(true);
    });

    it("should return true for empty object", () => {
      const obj = {};
      expect(ValidationUtils.validateAllValues(obj, isNumber)).toBe(true);
    });

    it("should return true when checking all strings", () => {
      const obj = { name: "test", type: "model" };
      expect(ValidationUtils.validateAllValues(obj, isString)).toBe(true);
    });

    it("should return true when checking all positive numbers", () => {
      const obj = { a: 1, b: 2, c: 100 };
      expect(ValidationUtils.validateAllValues(obj, isPositive)).toBe(true);
    });

    // Negative tests - some values fail predicate
    it("should return false when some values fail predicate", () => {
      const obj = { a: 1, b: "two", c: 3 };
      expect(ValidationUtils.validateAllValues(obj, isNumber)).toBe(false);
    });

    it("should return false when all values fail predicate", () => {
      const obj = { a: "one", b: "two", c: "three" };
      expect(ValidationUtils.validateAllValues(obj, isNumber)).toBe(false);
    });

    // Negative tests - invalid inputs
    it("should return false for null object", () => {
      expect(ValidationUtils.validateAllValues(null, isNumber)).toBe(false);
    });

    it("should return false for undefined object", () => {
      expect(ValidationUtils.validateAllValues(undefined, isNumber)).toBe(false);
    });

    it("should return false for non-object", () => {
      expect(ValidationUtils.validateAllValues("string", isNumber)).toBe(false);
    });

    it("should return false for array", () => {
      expect(ValidationUtils.validateAllValues([1, 2, 3], isNumber)).toBe(false);
    });

    it("should return false for number", () => {
      expect(ValidationUtils.validateAllValues(123, isNumber)).toBe(false);
    });

    it("should return false for string predicate", () => {
      const obj = { a: 1 };
      expect(ValidationUtils.validateAllValues(obj, "not a function")).toBe(false);
    });
  });

  describe("isValidModelStatus", () => {
    // Positive tests - valid statuses
    it("should return true for idle status", () => {
      expect(ValidationUtils.isValidModelStatus("idle")).toBe(true);
    });

    it("should return true for loading status", () => {
      expect(ValidationUtils.isValidModelStatus("loading")).toBe(true);
    });

    it("should return true for running status", () => {
      expect(ValidationUtils.isValidModelStatus("running")).toBe(true);
    });

    it("should return true for error status", () => {
      expect(ValidationUtils.isValidModelStatus("error")).toBe(true);
    });

    it("should return true for stopped status", () => {
      expect(ValidationUtils.isValidModelStatus("stopped")).toBe(true);
    });

    // Negative tests - invalid statuses and edge cases
    it("should return false for unknown status", () => {
      expect(ValidationUtils.isValidModelStatus("unknown")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(ValidationUtils.isValidModelStatus("")).toBe(false);
    });

    it("should return false for null", () => {
      expect(ValidationUtils.isValidModelStatus(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(ValidationUtils.isValidModelStatus(undefined)).toBe(false);
    });

    it("should return false for number", () => {
      expect(ValidationUtils.isValidModelStatus(123)).toBe(false);
    });

    it("should return false for array", () => {
      expect(ValidationUtils.isValidModelStatus(["idle"])).toBe(false);
    });

    it("should return false for object", () => {
      expect(ValidationUtils.isValidModelStatus({ status: "idle" })).toBe(false);
    });

    it("should return false for case variation", () => {
      expect(ValidationUtils.isValidModelStatus("IDLE")).toBe(false);
    });

    it("should return false for whitespace variation", () => {
      expect(ValidationUtils.isValidModelStatus(" idle ")).toBe(false);
    });
  });

  describe("isValidLogLevel", () => {
    // Positive tests - valid log levels
    it("should return true for debug level", () => {
      expect(ValidationUtils.isValidLogLevel("debug")).toBe(true);
    });

    it("should return true for info level", () => {
      expect(ValidationUtils.isValidLogLevel("info")).toBe(true);
    });

    it("should return true for warn level", () => {
      expect(ValidationUtils.isValidLogLevel("warn")).toBe(true);
    });

    it("should return true for error level", () => {
      expect(ValidationUtils.isValidLogLevel("error")).toBe(true);
    });

    // Negative tests - invalid log levels and edge cases
    it("should return false for trace level", () => {
      expect(ValidationUtils.isValidLogLevel("trace")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(ValidationUtils.isValidLogLevel("")).toBe(false);
    });

    it("should return false for null", () => {
      expect(ValidationUtils.isValidLogLevel(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(ValidationUtils.isValidLogLevel(undefined)).toBe(false);
    });

    it("should return false for number", () => {
      expect(ValidationUtils.isValidLogLevel(123)).toBe(false);
    });

    it("should return false for array", () => {
      expect(ValidationUtils.isValidLogLevel(["debug"])).toBe(false);
    });

    it("should return false for object", () => {
      expect(ValidationUtils.isValidLogLevel({ level: "debug" })).toBe(false);
    });

    it("should return false for case variation", () => {
      expect(ValidationUtils.isValidLogLevel("DEBUG")).toBe(false);
    });

    it("should return false for verbose", () => {
      expect(ValidationUtils.isValidLogLevel("verbose")).toBe(false);
    });
  });
});
