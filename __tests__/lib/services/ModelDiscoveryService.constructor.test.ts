import { ModelDiscoveryService } from "@/lib/services/ModelDiscoveryService";
import { setupModelDiscoveryService } from "./ModelDiscoveryService.setup";

describe("ModelDiscoveryService - Constructor", () => {
  describe("constructor", () => {
    // Objective: Verify service initializes correctly
    it("should initialize with base path", () => {
      // Arrange & Act
      setupModelDiscoveryService();
      const testService = new ModelDiscoveryService("/models");

      // Assert
      expect(testService).toBeInstanceOf(ModelDiscoveryService);
    });
  });
});
