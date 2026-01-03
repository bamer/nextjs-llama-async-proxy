import { ModelDiscoveryService } from "@/lib/services/ModelDiscoveryService";
import { setupModelDiscoveryService } from "./ModelDiscoveryService.setup";

describe("ModelDiscoveryService - Basic Discovery", () => {
  let service: ModelDiscoveryService;
  let mockedFsPromises: {
    readdir: jest.Mock;
    stat: jest.Mock;
    readFile: jest.Mock;
  };

  beforeEach(() => {
    const setup = setupModelDiscoveryService();
    mockedFsPromises = setup.mockedFsPromises;
    service = new ModelDiscoveryService("/models");
  });

  describe("discoverModels", () => {
    // Objective: Test model discovery for .bin files
    it("should discover .bin model files", async () => {
      // Arrange
      const mockDirent = {
        name: "model.bin",
        isDirectory: jest.fn().mockReturnValue(false),
      };

      mockedFsPromises.readdir.mockResolvedValue([mockDirent] as any);
      mockedFsPromises.stat.mockResolvedValue({
        isDirectory: jest.fn().mockReturnValue(false),
        size: 750000000,
      } as any);

      // Act
      const models = await service.discoverModels("/models");

      // Assert
      expect(models).toHaveLength(1);
      expect(models[0].name).toBe("model");
      expect(models[0].path).toContain("model.bin");
      expect(models[0].size).toBe(750000000);
      expect(models[0].format).toBe("llama");
      expect(models[0].quantized).toBe(false);
    });

    // Objective: Test model discovery for .quant.bin files
    it("should discover .quant.bin model files", async () => {
      // Arrange
      const mockDirent = {
        name: "model.quant.bin",
        isDirectory: jest.fn().mockReturnValue(false),
      };

      mockedFsPromises.readdir.mockResolvedValue([mockDirent] as any);
      mockedFsPromises.stat.mockResolvedValue({
        isDirectory: jest.fn().mockReturnValue(false),
        size: 500000000,
      } as any);

      // Act
      const models = await service.discoverModels("/models");

      // Assert
      expect(models).toHaveLength(1);
      expect(models[0].name).toBe("model.quant");
      expect(models[0].format).toBe("llama");
      expect(models[0].quantized).toBe(false);
    });

    // Objective: Test filtering of non-model files
    it("should handle non-model files", async () => {
      // Arrange
      const mockDirent = {
        name: "readme.txt",
        isDirectory: jest.fn().mockReturnValue(false),
      };

      mockedFsPromises.readdir.mockResolvedValue([mockDirent] as any);
      mockedFsPromises.stat.mockResolvedValue({
        isDirectory: jest.fn().mockReturnValue(false),
        size: 1000,
      } as any);

      // Act
      const models = await service.discoverModels("/models");

      // Assert
      expect(models).toHaveLength(0);
    });

    // Objective: Test handling of special characters in filenames
    it("should handle special characters in filenames", async () => {
      // Arrange
      const mockDirent = {
        name: "model_v2.0-test.bin",
        isDirectory: jest.fn().mockReturnValue(false),
      };

      mockedFsPromises.readdir.mockResolvedValue([mockDirent] as any);
      mockedFsPromises.stat.mockResolvedValue({
        isDirectory: jest.fn().mockReturnValue(false),
        size: 1000000000,
      } as any);

      // Act
      const models = await service.discoverModels("/models");

      // Assert
      expect(models).toHaveLength(1);
      expect(models[0].name).toBe("model_v2.0-test");
    });

    // Objective: Test handling of empty directories
    it("should handle empty directories", async () => {
      // Arrange
      mockedFsPromises.readdir.mockResolvedValue([]);

      // Act
      const models = await service.discoverModels("/models");

      // Assert
      expect(models).toHaveLength(0);
    });
  });
});
