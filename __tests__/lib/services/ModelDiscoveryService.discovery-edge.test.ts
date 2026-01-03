import { ModelDiscoveryService } from "@/lib/services/ModelDiscoveryService";
import { setupModelDiscoveryService } from "./ModelDiscoveryService.setup";

describe("ModelDiscoveryService - Discovery Edge Cases", () => {
  let service: ModelDiscoveryService;
  let mockLogger: { warn: jest.Mock; error: jest.Mock };
  let mockedFsPromises: {
    readdir: jest.Mock;
    stat: jest.Mock;
    readFile: jest.Mock;
  };

  beforeEach(() => {
    const setup = setupModelDiscoveryService();
    mockLogger = setup.mockLogger;
    mockedFsPromises = setup.mockedFsPromises;
    service = new ModelDiscoveryService("/models");
  });

  describe("discoverModels", () => {
    // Objective: Test metadata loading from adjacent JSON file
    it("should load metadata from adjacent JSON file", async () => {
      // Arrange
      const mockDirent = {
        name: "model.bin",
        isDirectory: jest.fn().mockReturnValue(false),
      };

      mockedFsPromises.readdir.mockResolvedValue([mockDirent] as any);
      mockedFsPromises.stat.mockResolvedValue({
        isDirectory: jest.fn().mockReturnValue(false),
        size: 1000000000,
      } as any);
      mockedFsPromises.readFile.mockResolvedValue(
        JSON.stringify({ author: "Test Author", version: "1.0" })
      );

      // Act
      const models = await service.discoverModels("/models");

      // Assert
      expect(models[0].author).toBe("Test Author");
      expect(models[0].version).toBe("1.0");
    });

    // Objective: Test graceful handling of missing metadata file
    it("should handle missing or invalid metadata file gracefully", async () => {
      // Arrange
      const mockDirent = {
        name: "model.bin",
        isDirectory: jest.fn().mockReturnValue(false),
      };

      mockedFsPromises.readdir.mockResolvedValue([mockDirent] as any);
      mockedFsPromises.stat.mockResolvedValue({
        isDirectory: jest.fn().mockReturnValue(false),
        size: 1000000000,
      } as any);
      mockedFsPromises.readFile.mockRejectedValue(new Error("File not found"));

      // Act
      const models = await service.discoverModels("/models");

      // Assert
      expect(models).toHaveLength(1);
      expect(models[0].name).toBe("model");
    });

    // Objective: Test handling of files that can't be stat'd
    it("should skip files that cannot be stated", async () => {
      // Arrange
      const mockDirent = {
        name: "model.bin",
        isDirectory: jest.fn().mockReturnValue(false),
      };

      mockedFsPromises.readdir.mockResolvedValue([mockDirent] as any);
      mockedFsPromises.stat.mockRejectedValue(new Error("Permission denied"));

      // Act
      const models = await service.discoverModels("/models");

      // Assert
      expect(models).toHaveLength(0);
    });

    // Objective: Test error handling for directory scan failures
    it("should handle directory scan errors", async () => {
      // Arrange
      mockedFsPromises.readdir.mockRejectedValue(new Error("Permission denied"));

      // Act
      const models = await service.discoverModels("/models");

      // Assert
      expect(models).toHaveLength(0);
    });

    // Objective: Test handling of invalid JSON metadata
    it("should handle invalid JSON metadata gracefully", async () => {
      // Arrange
      const mockDirent = {
        name: "model.bin",
        isDirectory: jest.fn().mockReturnValue(false),
      };

      mockedFsPromises.readdir.mockResolvedValue([mockDirent] as any);
      mockedFsPromises.stat.mockResolvedValue({
        isDirectory: jest.fn().mockReturnValue(false),
        size: 1000000000,
      } as any);
      mockedFsPromises.readFile.mockResolvedValue("invalid json {{{");

      // Act
      const models = await service.discoverModels("/models");

      // Assert
      expect(models).toHaveLength(1);
      expect(models[0].name).toBe("model");
    });
  });
});
