import { apiService } from "@/services/api-service";
import { mockApiClient, setupMockStore } from "./test-utils";

describe("api-service-coverage - AI Operations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMockStore();
  });

  describe("generateText", () => {
    it("should generate text successfully", async () => {
      const mockResponse = {
        success: true,
        data: {
          text: "Generated text response",
          model: "llama-2-7b",
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.generateText({
        prompt: "Hello, world!",
        model: "llama-2-7b",
        max_tokens: 100,
      });

      expect(mockApiClient.post).toHaveBeenCalledWith("/api/generate", {
        prompt: "Hello, world!",
        model: "llama-2-7b",
        max_tokens: 100,
      });
      expect(result).toEqual(mockResponse);
    });

    it("should generate text with only prompt", async () => {
      const mockResponse = {
        success: true,
        data: { text: "Generated text" },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.generateText({
        prompt: "Test prompt",
      });

      expect(mockApiClient.post).toHaveBeenCalledWith("/api/generate", {
        prompt: "Test prompt",
      });
      expect(result).toEqual(mockResponse);
    });

    it("should return error response without throwing", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "Failed to generate text",
          details: {},
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.generateText({ prompt: "Test" });

      expect(result).toEqual(mockResponse);
    });
  });

  describe("chat", () => {
    it("should handle chat successfully", async () => {
      const mockResponse = {
        success: true,
        data: {
          message: {
            role: "assistant",
            content: "Chat response",
          },
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const messages = [
        { role: "user" as const, content: "Hello!" },
        { role: "assistant" as const, content: "Hi there!" },
      ];

      const result = await apiService.chat({
        messages,
        model: "llama-2-7b",
        max_tokens: 150,
      });

      expect(mockApiClient.post).toHaveBeenCalledWith("/api/chat", {
        messages,
        model: "llama-2-7b",
        max_tokens: 150,
      });
      expect(result).toEqual(mockResponse);
    });

    it("should handle chat with only messages", async () => {
      const mockResponse = {
        success: true,
        data: { message: { role: "assistant" as const, content: "Response" } },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.chat({
        messages: [{ role: "user" as const, content: "Test" }],
      });

      expect(mockApiClient.post).toHaveBeenCalledWith("/api/chat", {
        messages: [{ role: "user" as const, content: "Test" }],
      });
      expect(result).toEqual(mockResponse);
    });

    it("should return error response without throwing", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "500",
          message: "Failed to chat",
          details: {},
        },
        timestamp: new Date().toISOString(),
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiService.chat({ messages: [] });

      expect(result).toEqual(mockResponse);
    });
  });
});
