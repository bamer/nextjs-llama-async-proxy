// Mock fs
jest.mock("fs", () => ({
  readFileSync: jest.fn(),
}));

// Mock path
jest.mock("path", () => ({
  join: jest.fn(),
}));

import fs from "fs";
import path from "path";
import { ParameterService, parameterService } from "@/lib/services/parameterService";

// Mock console
const mockConsole = {
  error: jest.fn(),
};
global.console = mockConsole as any;

describe("ParameterService", () => {
  const mockConfig = {
    llama_options: {
      generation: {
        temperature: {
          type: "number",
          default: 0.7,
          min: 0,
          max: 1,
          description: "Temperature for sampling",
        },
        top_p: {
          type: "number",
          default: 0.9,
          min: 0,
          max: 1,
          description: "Top-p sampling",
        },
      },
      context: {
        ctx_size: {
          type: "number",
          default: 2048,
          min: 1,
          description: "Context size",
        },
        model_type: {
          type: "select",
          options: ["llama", "mistral", "gpt"],
          default: "llama",
          description: "Model type",
        },
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (path.join as jest.Mock).mockReturnValue("/mock/config/path.json");
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));
  });

  describe("constructor and loading", () => {
    it("should load parameters on construction", () => {
      const service = new ParameterService();

      expect(path.join).toHaveBeenCalledWith(
        process.cwd(),
        "src",
        "config",
        "llama_options_reference.json"
      );
      expect(fs.readFileSync).toHaveBeenCalledWith("/mock/config/path.json", "utf-8");
      expect(service.countOptions()).toBe(4); // 4 parameters in mock config
    });

    it("should handle file read errors gracefully", () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error("File not found");
      });

      const service = new ParameterService();

      expect(service.countOptions()).toBe(0);
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it("should handle JSON parse errors", () => {
      (fs.readFileSync as jest.Mock).mockReturnValue("invalid json");

      const service = new ParameterService();

      expect(service.countOptions()).toBe(0);
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it("should handle missing llama_options", () => {
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({}));

      const service = new ParameterService();

      expect(service.countOptions()).toBe(0);
    });
  });

  describe("getOptionsByCategoryForUI", () => {
    it("should return parameters organized by category", () => {
      const service = new ParameterService();
      const options = service.getOptionsByCategoryForUI();

      expect(options).toEqual(mockConfig.llama_options);
      expect(options).not.toBe(mockConfig.llama_options); // Should be a copy
    });
  });

  describe("countOptions", () => {
    it("should count total number of options", () => {
      const service = new ParameterService();

      expect(service.countOptions()).toBe(4);
    });
  });

  describe("getCategory", () => {
    it("should return parameters for a category", () => {
      const service = new ParameterService();
      const category = service.getCategory("generation");

      expect(category).toEqual(mockConfig.llama_options.generation);
      expect(category).not.toBe(mockConfig.llama_options.generation); // Should be a copy
    });

    it("should return empty object for unknown category", () => {
      const service = new ParameterService();
      const category = service.getCategory("unknown");

      expect(category).toEqual({});
    });
  });

  describe("getOption", () => {
    it("should return specific parameter option", () => {
      const service = new ParameterService();
      const option = service.getOption("generation", "temperature");

      expect(option).toEqual(mockConfig.llama_options.generation.temperature);
      expect(option).not.toBe(mockConfig.llama_options.generation.temperature); // Should be a copy
    });

    it("should return null for unknown category", () => {
      const service = new ParameterService();
      const option = service.getOption("unknown", "temperature");

      expect(option).toBeNull();
    });

    it("should return null for unknown parameter", () => {
      const service = new ParameterService();
      const option = service.getOption("generation", "unknown");

      expect(option).toBeNull();
    });
  });

  describe("getParameterInfo", () => {
    it("should return detailed parameter information", () => {
      const service = new ParameterService();
      const info = service.getParameterInfo("temperature");

      expect(info).toEqual({
        ...mockConfig.llama_options.generation.temperature,
        category: "generation",
        name: "temperature",
      });
    });

    it("should return null for unknown parameter", () => {
      const service = new ParameterService();
      const info = service.getParameterInfo("unknown");

      expect(info).toBeNull();
    });
  });

  describe("validateParameter", () => {
    let service: ParameterService;

    beforeEach(() => {
      service = new ParameterService();
    });

    it("should validate unknown parameter", () => {
      const result = service.validateParameter("unknown", 123);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Unknown parameter: unknown");
    });

    it("should validate number type correctly", () => {
      const result = service.validateParameter("temperature", 0.5);

      expect(result.valid).toBe(true);
    });

    it("should reject invalid number type", () => {
      const result = service.validateParameter("temperature", "not-a-number");

      expect(result.valid).toBe(false);
      expect(result.error).toBe("temperature must be a number");
    });

    it("should validate number min constraint", () => {
      const result = service.validateParameter("temperature", -1);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("temperature must be >= 0");
    });

    it("should validate number max constraint", () => {
      const result = service.validateParameter("temperature", 2);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("temperature must be <= 1");
    });

    it("should validate string type", () => {
      const result = service.validateParameter("ctx_size", "invalid");

      expect(result.valid).toBe(false);
      expect(result.error).toBe("ctx_size must be a number");
    });

    it("should validate select type", () => {
      const result = service.validateParameter("model_type", "llama");

      expect(result.valid).toBe(true);
    });

    it("should reject invalid select value", () => {
      const result = service.validateParameter("model_type", "invalid");

      expect(result.valid).toBe(false);
      expect(result.error).toBe("model_type must be one of: llama, mistral, gpt");
    });
  });

  describe("singleton instance", () => {
    it("should export a singleton instance", () => {
      expect(parameterService).toBeInstanceOf(ParameterService);
    });
  });
});