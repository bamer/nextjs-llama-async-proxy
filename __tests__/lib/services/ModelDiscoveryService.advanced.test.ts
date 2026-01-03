import { ModelDiscoveryService } from "@/lib/services/ModelDiscoveryService";
import { setupModelDiscoveryService } from "./ModelDiscoveryService.setup";

describe("ModelDiscoveryService - Advanced Scenarios", () => {
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

  describe("discoverModels - Advanced", () => {
    // Objective: Test case-insensitive file extension matching
    it("should handle case-insensitive extensions", async () => {
      // Arrange
      const mockDirent1 = {
        name: "MODEL.BIN",
        isDirectory: jest.fn().mockReturnValue(false),
      };
      const mockDirent2 = {
        name: "model.QUANT.BIN",
        isDirectory: jest.fn().mockReturnValue(false),
      };

      mockedFsPromises.readdir.mockResolvedValue(
        [mockDirent1, mockDirent2] as any
      );
      mockedFsPromises.stat
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          size: 1000000000,
        } as any)
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          size: 2000000000,
        } as any);

      // Act
      const models = await service.discoverModels("/models");

      // Assert
      expect(models).toHaveLength(2);
    });

    // Objective: Test complex nested directory structure
    it("should handle complex nested directory structure", async () => {
      // Arrange
      const dir1Dirent = {
        name: "level1",
        isDirectory: jest.fn().mockReturnValue(true),
      };
      const dir2Dirent = {
        name: "level2",
        isDirectory: jest.fn().mockReturnValue(true),
      };
      const modelDirent = {
        name: "deepmodel.bin",
        isDirectory: jest.fn().mockReturnValue(false),
      };

      mockedFsPromises.readdir
        .mockResolvedValueOnce([dir1Dirent] as any)
        .mockResolvedValueOnce([dir2Dirent] as any)
        .mockResolvedValueOnce([modelDirent] as any);

      mockedFsPromises.stat
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(true),
        } as any)
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(true),
        } as any)
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          size: 3000000000,
        } as any);

      // Act
      const models = await service.discoverModels("/models", 5);

      // Assert
      expect(models).toHaveLength(1);
      expect(models[0].name).toBe("deepmodel");
    });

    // Objective: Test mixed file types in same directory
    it("should handle mixed file types in same directory", async () => {
      // Arrange
      const modelDirent1 = {
        name: "model1.bin",
        isDirectory: jest.fn().mockReturnValue(false),
      };
      const modelDirent2 = {
        name: "model2.quant.bin",
        isDirectory: jest.fn().mockReturnValue(false),
      };
      const readmeDirent = {
        name: "README.md",
        isDirectory: jest.fn().mockReturnValue(false),
      };
      const configDirent = {
        name: "config.json",
        isDirectory: jest.fn().mockReturnValue(false),
      };

      mockedFsPromises.readdir.mockResolvedValue([
        modelDirent1,
        modelDirent2,
        readmeDirent,
        configDirent,
      ] as any);
      mockedFsPromises.stat
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          size: 1000000000,
        } as any)
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          size: 2000000000,
        } as any)
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          size: 100,
        } as any)
        .mockResolvedValueOnce({
          isDirectory: jest.fn().mockReturnValue(false),
          size: 500,
        } as any);

      // Act
      const models = await service.discoverModels("/models");

      // Assert
      expect(models).toHaveLength(2);
      expect(models[0].name).toBe("model1");
      expect(models[1].name).toBe("model2.quant");
    });

    // Objective: Test permission errors at different levels
    it("should handle permission errors at different levels", async () => {
      // Arrange
      const subDir = {
        name: "restricted",
        isDirectory: jest.fn().mockReturnValue(true),
      };

      mockedFsPromises.readdir
        .mockResolvedValueOnce([subDir] as any)
        .mockRejectedValueOnce(new Error("EACCES: permission denied"));

      mockedFsPromises.stat.mockResolvedValue({
        isDirectory: jest.fn().mockReturnValue(true),
      } as any);

      // Act
      const models = await service.discoverModels("/models");

      // Assert
      // Should handle permission errors gracefully
      expect(models).toBeDefined();
    });
  });
});
