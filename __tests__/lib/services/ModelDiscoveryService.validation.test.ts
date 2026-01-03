import { ModelDiscoveryService } from "@/lib/services/ModelDiscoveryService";
import { setupModelDiscoveryService } from "./ModelDiscoveryService.setup";

describe("ModelDiscoveryService - Parameters & Validation", () => {
  let service: ModelDiscoveryService;

  beforeEach(() => {
    setupModelDiscoveryService();
    service = new ModelDiscoveryService("/models");
  });

  describe("getDefaultParameters", () => {
    // Objective: Verify default parameters are correct
    it("should return default parameters", () => {
      // Arrange & Act
      const params = service.getDefaultParameters();

      // Assert
      expect(params).toEqual({
        temperature: 0.7,
        top_p: 0.9,
        repeat_penalty: 1.1,
        max_tokens: 2048,
        presence_penalty: 0.0,
        frequency_penalty: 0.0,
      });
    });

    // Objective: Ensure parameters object structure is correct
    it("should return parameters with correct types", () => {
      // Arrange & Act
      const params = service.getDefaultParameters();

      // Assert
      expect(typeof params.temperature).toBe("number");
      expect(typeof params.top_p).toBe("number");
      expect(typeof params.repeat_penalty).toBe("number");
      expect(typeof params.max_tokens).toBe("number");
      expect(typeof params.presence_penalty).toBe("number");
      expect(typeof params.frequency_penalty).toBe("number");
    });
  });

  describe("validateModelConfig", () => {
    // Objective: Test positive case - valid configuration
    it("should validate a valid configuration", () => {
      // Arrange
      const config = {
        name: "Test Model",
        path: "/path/to/model.gguf",
      };

      // Act
      const result = service.validateModelConfig(config);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    // Objective: Test negative case - missing name
    it("should reject configuration without name", () => {
      // Arrange
      const config = {
        path: "/path/to/model.gguf",
      };

      // Act
      const result = service.validateModelConfig(config);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Model name is required");
    });

    // Objective: Test negative case - missing path
    it("should reject configuration without path", () => {
      // Arrange
      const config = {
        name: "Test Model",
      };

      // Act
      const result = service.validateModelConfig(config);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Model path is required");
    });

    // Objective: Test negative case - non-string path
    it("should reject configuration with non-string path", () => {
      // Arrange
      const config = {
        name: "Test Model",
        path: 123,
      };

      // Act
      const result = service.validateModelConfig(config);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Model path must be a string");
    });

    // Objective: Test negative case - empty string path
    it("should reject configuration with empty string path", () => {
      // Arrange
      const config = {
        name: "Test Model",
        path: "",
      };

      // Act
      const result = service.validateModelConfig(config);

      // Assert
      expect(result.valid).toBe(true);
    });

    // Objective: Test negative case - multiple errors
    it("should return multiple errors for invalid configuration", () => {
      // Arrange
      const config = {};

      // Act
      const result = service.validateModelConfig(config);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain("Model name is required");
      expect(result.errors).toContain("Model path is required");
    });

    // Objective: Test validation with undefined properties
    it("should handle undefined properties in config", () => {
      // Arrange
      const config = {
        name: undefined,
        path: undefined,
      };

      // Act
      const result = service.validateModelConfig(config);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });

    // Objective: Test validation with null properties
    it("should handle null properties in config", () => {
      // Arrange
      const config = {
        name: null,
        path: null,
      };

      // Act
      const result = service.validateModelConfig(config);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Model path must be a string");
    });

    // Objective: Test validation returns errors array
    it("should return errors as array when invalid", () => {
      // Arrange
      const config = {};

      // Act
      const result = service.validateModelConfig(config);

      // Assert
      expect(result.valid).toBe(false);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    // Objective: Test valid configuration with additional properties
    it("should accept valid configuration with additional properties", () => {
      // Arrange
      const config = {
        name: "Test Model",
        path: "/path/to/model.gguf",
        additionalProp: "some value",
        anotherProp: 123,
      };

      // Act
      const result = service.validateModelConfig(config);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });
  });
});
