import { ModelDiscoveryService } from "@/lib/services/ModelDiscoveryService";
import { setupModelDiscoveryService } from "./ModelDiscoveryService.setup";

describe("ModelDiscoveryService - Recursive Scanning", () => {
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

  describe("discoverModels - Recursion", () => {
    // Objective: Test recursive directory scanning
    it("should recursively scan subdirectories", async () => {
      // Arrange
      const subDirDirent = {
        name: "subdir",
        isDirectory: jest.fn().mockReturnValue(true),
      };
      const modelDirent = {
        name: "submodel.bin",
        isDirectory: jest.fn().mockReturnValue(false),
      };

      mockedFsPromises.readdir
        .mockResolvedValueOnce([subDirDirent] as any)
        .mockResolvedValueOnce([modelDirent] as any);

      mockedFsPromises.stat
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(true),
        } as any)
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          size: 2000000000,
        } as any);

      // Act
      const models = await service.discoverModels("/models", 2);

      // Assert
      expect(models).toHaveLength(1);
      expect(models[0].name).toBe("submodel");
    });

    // Objective: Test maxDepth parameter limits recursion
    it("should respect maxDepth parameter", async () => {
      // Arrange
      const subDirDirent = {
        name: "subdir",
        isDirectory: jest.fn().mockReturnValue(true),
      };

      mockedFsPromises.readdir.mockResolvedValue([subDirDirent] as any);
      mockedFsPromises.stat.mockResolvedValue({
        isDirectory: jest.fn().mockReturnValue(true),
      } as any);

      // Act
      const models = await service.discoverModels("/models", 0);

      // Assert
      expect(models).toHaveLength(0);
    });

    // Objective: Test different maxDepth values
    it("should handle different maxDepth values", async () => {
      // Arrange
      const subDir = {
        name: "subdir",
        isDirectory: jest.fn().mockReturnValue(true),
      };

      const mockDirent = {
        name: "model.bin",
        isDirectory: jest.fn().mockReturnValue(false),
      };

      // Test with maxDepth = 0 (should not scan subdirectories)
      mockedFsPromises.readdir.mockResolvedValue([subDir] as any);
      mockedFsPromises.stat.mockResolvedValue({
        isDirectory: jest.fn().mockReturnValue(true),
      } as any);

      let models = await service.discoverModels("/models", 0);
      expect(models).toHaveLength(0);

      // Test with maxDepth = 1 (should scan one level deep)
      jest.clearAllMocks();
      mockedFsPromises.readdir
        .mockResolvedValueOnce([subDir] as any)
        .mockResolvedValueOnce([mockDirent] as any);
      mockedFsPromises.stat
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(true),
        } as any)
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          size: 1000000000,
        } as any);

      models = await service.discoverModels("/models", 1);
      expect(models).toHaveLength(1);
    });

    // Objective: Test default maxDepth (Infinity)
    it("should use Infinity as default maxDepth", async () => {
      // Arrange
      const subDir = {
        name: "subdir",
        isDirectory: jest.fn().mockReturnValue(true),
      };
      const modelDirent = {
        name: "model.bin",
        isDirectory: jest.fn().mockReturnValue(false),
      };

      mockedFsPromises.readdir
        .mockResolvedValueOnce([subDir] as any)
        .mockResolvedValueOnce([modelDirent] as any);
      mockedFsPromises.stat
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(true),
        } as any)
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          size: 1000000000,
        } as any);

      // Act (no maxDepth parameter, should use Infinity)
      const models = await service.discoverModels("/models");

      // Assert
      expect(models).toHaveLength(1);
      expect(models[0].name).toBe("model");
    });
  });
});
