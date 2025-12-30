import { promises as fs } from "fs";
import * as path from "path";
import { ModelDiscoveryService } from "@/lib/services/ModelDiscoveryService";

// Mock fs
jest.mock("fs", () => ({
  promises: {
    readdir: jest.fn(),
    stat: jest.fn(),
    readFile: jest.fn(),
  },
}));

// Mock path
jest.mock("path", () => ({
  resolve: jest.fn(),
  join: jest.fn(),
  extname: jest.fn(),
  basename: jest.fn(),
  dirname: jest.fn(),
  format: jest.fn(),
}));

// Mock logger
jest.mock("@/lib/logger", () => ({
  getLogger: jest.fn(() => ({
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

describe("ModelDiscoveryService", () => {
  let service: ModelDiscoveryService;
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockPath = path as jest.Mocked<typeof path>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ModelDiscoveryService("/base/path");

    // Default path mocks
    mockPath.resolve.mockImplementation((p) => p);
    mockPath.join.mockImplementation((...args) => args.join("/"));
    mockPath.extname.mockImplementation((p) => {
      const parts = p.split(".");
      return parts.length > 1 ? "." + parts[parts.length - 1] : "";
    });
    mockPath.basename.mockImplementation((p, ext) => {
      const base = p.split("/").pop() || p;
      return ext ? base.replace(ext, "") : base;
    });
    mockPath.dirname.mockImplementation((p) => {
      const parts = p.split("/");
      parts.pop();
      return parts.join("/");
    });
    mockPath.format.mockImplementation((obj) => {
      return `${obj.dir}/${obj.name}${obj.ext}`;
    });
  });

  describe("discoverModels", () => {
    it("should discover model files recursively", async () => {
      // Mock directory structure
      mockFs.readdir
        .mockResolvedValueOnce([
          { name: "subdir", isDirectory: () => true },
          { name: "model1.bin", isDirectory: () => false },
          { name: "model2.quant.bin", isDirectory: () => false },
          { name: "notamodel.txt", isDirectory: () => false },
        ] as any)
        .mockResolvedValueOnce([
          { name: "model3.bin", isDirectory: () => false },
        ] as any);

      // Mock stats
      mockFs.stat
        .mockResolvedValueOnce({ size: 1000, isDirectory: () => false } as any) // model1.bin
        .mockResolvedValueOnce({ size: 2000, isDirectory: () => false } as any) // model2.quant.bin
        .mockResolvedValueOnce({ size: 500, isDirectory: () => false } as any) // notamodel.txt
        .mockResolvedValueOnce({ size: 1500, isDirectory: () => false } as any); // model3.bin

      // Mock metadata file read
      mockFs.readFile.mockResolvedValue(JSON.stringify({ custom: "data" }));

      const result = await service.discoverModels("/scan/path");

      expect(result).toHaveLength(3);
      expect(result).toEqual(
        expect.arrayContaining([
          {
            name: "model1",
            path: "/scan/path/model1.bin",
            size: 1000,
            format: "llama",
            quantized: false,
            custom: "data",
          },
          {
            name: "model2",
            path: "/scan/path/model2.quant.bin",
            size: 2000,
            format: "gguf",
            quantized: true,
            custom: "data",
          },
          {
            name: "model3",
            path: "/scan/path/subdir/model3.bin",
            size: 1500,
            format: "llama",
            quantized: false,
            custom: "data",
          },
        ])
      );
    });

    it("should handle missing metadata file gracefully", async () => {
      mockFs.readdir.mockResolvedValue([
        { name: "model.bin", isDirectory: () => false },
      ] as any);

      mockFs.stat.mockResolvedValue({ size: 1000, isDirectory: () => false } as any);
      mockFs.readFile.mockRejectedValue(new Error("File not found"));

      const result = await service.discoverModels("/scan/path");

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: "model",
        path: "/scan/path/model.bin",
        size: 1000,
        format: "llama",
        quantized: false,
      });
    });

    it("should respect max depth", async () => {
      mockFs.readdir
        .mockResolvedValueOnce([
          { name: "subdir", isDirectory: () => true },
        ] as any)
        .mockResolvedValueOnce([
          { name: "deep.bin", isDirectory: () => false },
        ] as any);

      mockFs.stat.mockResolvedValue({ size: 1000, isDirectory: () => false } as any);

      const result = await service.discoverModels("/scan/path", 0); // maxDepth = 0

      expect(result).toHaveLength(0); // Should not scan subdir
    });

    it("should handle scan errors gracefully", async () => {
      mockFs.readdir.mockRejectedValue(new Error("Permission denied"));

      const result = await service.discoverModels("/scan/path");

      expect(result).toEqual([]);
    });

    it("should skip files that can't be stat'ed", async () => {
      mockFs.readdir.mockResolvedValue([
        { name: "model.bin", isDirectory: () => false },
      ] as any);

      mockFs.stat.mockRejectedValue(new Error("Stat failed"));

      const result = await service.discoverModels("/scan/path");

      expect(result).toHaveLength(0);
    });
  });

  describe("getDefaultParameters", () => {
    it("should return default parameters", () => {
      const params = service.getDefaultParameters();

      expect(params).toEqual({
        temperature: 0.7,
        top_p: 0.9,
        repeat_penalty: 1.1,
        max_tokens: 2048,
        presence_penalty: 0.0,
        frequency_penalty: 0.0,
      });
    });
  });

  describe("validateModelConfig", () => {
    it("should validate valid config", () => {
      const config = {
        name: "test-model",
        path: "/path/to/model.bin",
      };

      const result = service.validateModelConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it("should reject config without name", () => {
      const config = {
        path: "/path/to/model.bin",
      };

      const result = service.validateModelConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Model name is required");
    });

    it("should reject config without path", () => {
      const config = {
        name: "test-model",
      };

      const result = service.validateModelConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Model path is required");
    });

    it("should reject config with non-string path", () => {
      const config = {
        name: "test-model",
        path: 123,
      };

      const result = service.validateModelConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Model path must be a string");
    });

    it("should handle multiple validation errors", () => {
      const config = {};

      const result = service.validateModelConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });
});