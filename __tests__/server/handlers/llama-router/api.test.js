/**
 * @jest-environment node
 */

import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";

// Create mock functions
const mockRequestInstance = {
  on: jest.fn(),
  write: jest.fn(),
  end: jest.fn(),
  destroy: jest.fn(),
  setTimeout: jest.fn(),
};

const mockResponse = {
  on: jest.fn(),
  statusCode: 200,
};

const mockRequest = jest.fn().mockImplementation((options, callback) => {
  callback(mockResponse);
  return mockRequestInstance;
});

describe("Llama Router API - llamaApiRequest", () => {
  let llamaApiRequest;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock the http module
    jest.unstable_mockModule("http", () => ({
      default: {
        request: mockRequest,
      },
    }));

    // Import the module after mocking
    const apiModule = await import("../../../../server/handlers/llama-router/api.js");
    llamaApiRequest = apiModule.llamaApiRequest;

    // Reset mock implementations
    mockRequest.mockImplementation((options, callback) => {
      callback(mockResponse);
      return mockRequestInstance;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("positive tests - successful API requests", () => {
    /**
     * Objective: Verify that GET requests to /models endpoint work correctly
     * This test validates the primary use case of fetching models list
     */
    test("should successfully make GET request to /models endpoint", async () => {
      // Arrange
      const endpoint = "/models";
      const method = "GET";
      const llamaServerUrl = "http://localhost:8080";
      const expectedResponse = { models: ["model1.gguf", "model2.gguf"] };

      mockResponse.on.mockImplementation((event, handler) => {
        if (event === "data") {
          handler(JSON.stringify(expectedResponse));
        }
        if (event === "end") {
          handler();
        }
      });

      // Act
      const result = await llamaApiRequest(endpoint, method, null, llamaServerUrl);

      // Assert
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          hostname: "localhost",
          port: "8080",
          path: "/models",
          method: "GET",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
        expect.any(Function)
      );
      expect(result).toEqual(expectedResponse);
    });

    /**
     * Objective: Verify that POST requests with body payload work correctly
     * This test validates the ability to send data to the API
     */
    test("should successfully make POST request with body payload", async () => {
      // Arrange
      const endpoint = "/models/load";
      const method = "POST";
      const body = { model: "llama-2-7b.gguf" };
      const llamaServerUrl = "http://localhost:8080";
      const expectedResponse = { status: "loading", model: "llama-2-7b.gguf" };

      mockResponse.on.mockImplementation((event, handler) => {
        if (event === "data") {
          handler(JSON.stringify(expectedResponse));
        }
        if (event === "end") {
          handler();
        }
      });

      // Act
      const result = await llamaApiRequest(endpoint, method, body, llamaServerUrl);

      // Assert
      expect(mockRequest).toHaveBeenCalled();
      expect(mockRequestInstance.write).toHaveBeenCalledWith(JSON.stringify(body));
      expect(mockRequestInstance.end).toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
    });

    /**
     * Objective: Verify that different endpoints can be accessed
     * This test validates routing to various API endpoints
     */
    test("should successfully make request to different endpoints", async () => {
      // Arrange
      const endpoints = ["/models", "/models/unload", "/completion", "/embeddings"];
      const llamaServerUrl = "http://localhost:8080";

      mockResponse.on.mockImplementation((event, handler) => {
        if (event === "end") {
          handler();
        }
      });

      // Act & Assert
      for (const endpoint of endpoints) {
        jest.clearAllMocks();
        mockResponse.on.mockImplementation((ev, handler) => {
          if (ev === "end") {
            handler();
          }
        });

        await llamaApiRequest(endpoint, "GET", null, llamaServerUrl);

        expect(mockRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            path: endpoint,
          }),
          expect.any(Function)
        );
      }
    });

    /**
     * Objective: Verify that various HTTP methods are supported
     * This test validates the method parameter is properly used
     */
    test("should support various HTTP methods", async () => {
      // Arrange
      const endpoint = "/test";
      const llamaServerUrl = "http://localhost:8080";
      const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];

      mockResponse.on.mockImplementation((event, handler) => {
        if (event === "end") {
          handler();
        }
      });

      // Act & Assert
      for (const method of methods) {
        jest.clearAllMocks();
        mockResponse.on.mockImplementation((ev, handler) => {
          if (ev === "end") {
            handler();
          }
        });

        await llamaApiRequest(endpoint, method, null, llamaServerUrl);

        expect(mockRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            method: method,
          }),
          expect.any(Function)
        );
      }
    });

    /**
     * Objective: Verify that non-JSON responses are handled gracefully
     * This test validates fallback to raw string when JSON parsing fails
     */
    test("should handle non-JSON responses gracefully", async () => {
      // Arrange
      const endpoint = "/health";
      const method = "GET";
      const llamaServerUrl = "http://localhost:8080";
      const nonJsonResponse = "OK";

      mockResponse.on.mockImplementation((event, handler) => {
        if (event === "data") {
          handler(nonJsonResponse);
        }
        if (event === "end") {
          handler();
        }
      });

      // Act
      const result = await llamaApiRequest(endpoint, method, null, llamaServerUrl);

      // Assert
      expect(result).toBe(nonJsonResponse);
    });

    /**
     * Objective: Verify default method is GET when not specified
     * This test validates the default parameter behavior
     */
    test("should use GET as default method when not specified", async () => {
      // Arrange
      const endpoint = "/models";
      const llamaServerUrl = "http://localhost:8080";

      mockResponse.on.mockImplementation((event, handler) => {
        if (event === "end") {
          handler();
        }
      });

      // Act
      await llamaApiRequest(endpoint, undefined, null, llamaServerUrl);

      // Assert
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
        }),
        expect.any(Function)
      );
    });

    /**
     * Objective: Verify timeout configuration is set to 30 seconds
     * This test validates the timeout parameter is properly configured
     */
    test("should set 30 second timeout for requests", async () => {
      // Arrange
      const endpoint = "/models";
      const method = "GET";
      const llamaServerUrl = "http://localhost:8080";

      mockResponse.on.mockImplementation((event, handler) => {
        if (event === "end") {
          handler();
        }
      });

      // Act
      await llamaApiRequest(endpoint, method, null, llamaServerUrl);

      // Assert
      expect(mockRequestInstance.setTimeout).toHaveBeenCalledWith(30000, expect.any(Function));
    });

    /**
     * Objective: Verify URL is correctly parsed with different base URLs
     * This test validates URL construction handles various server configurations
     */
    test("should correctly parse URL with different server configurations", async () => {
      // Arrange
      const testCases = [
        { url: "http://localhost:8080", hostname: "localhost", port: "8080" },
        { url: "http://127.0.0.1:3000", hostname: "127.0.0.1", port: "3000" },
        { url: "https://llama-server:8443", hostname: "llama-server", port: "8443" },
      ];

      mockResponse.on.mockImplementation((event, handler) => {
        if (event === "end") {
          handler();
        }
      });

      // Act & Assert
      for (const testCase of testCases) {
        jest.clearAllMocks();
        mockResponse.on.mockImplementation((ev, handler) => {
          if (ev === "end") {
            handler();
          }
        });

        await llamaApiRequest("/test", "GET", null, testCase.url);

        expect(mockRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            hostname: testCase.hostname,
            port: testCase.port,
          }),
          expect.any(Function)
        );
      }
    });
  });

  describe("negative tests - error handling", () => {
    /**
     * Objective: Verify that missing llamaServerUrl throws proper error
     * This test validates input validation for required parameter
     */
    test("should throw error when llamaServerUrl is not provided", async () => {
      // Arrange
      const endpoint = "/models";
      const method = "GET";

      // Act & Assert
      await expect(llamaApiRequest(endpoint, method, null, undefined)).rejects.toThrow(
        "llama-server not running"
      );
      await expect(llamaApiRequest(endpoint, method, null, null)).rejects.toThrow(
        "llama-server not running"
      );
      await expect(llamaApiRequest(endpoint, method, null, "")).rejects.toThrow(
        "llama-server not running"
      );
    });

    /**
     * Objective: Verify that network errors are properly propagated
     * This test validates error handling for network failures
     */
    test("should handle network errors gracefully", async () => {
      // Arrange
      const endpoint = "/models";
      const method = "GET";
      const llamaServerUrl = "http://localhost:8080";
      const networkError = new Error("ECONNREFUSED");

      // Create a mock that triggers error event
      mockRequest.mockReset();
      mockRequest.mockImplementation(() => {
        const errorReq = {
          on: jest.fn((event, handler) => {
            if (event === "error") {
              handler(networkError);
            }
            return errorReq;
          }),
          write: jest.fn(),
          end: jest.fn(),
          destroy: jest.fn(),
          setTimeout: jest.fn(),
        };
        return errorReq;
      });

      // Re-mock and re-import
      jest.unstable_mockModule("http", () => ({
        default: {
          request: mockRequest,
        },
      }));

      const apiModule = await import("../../../../server/handlers/llama-router/api.js");
      llamaApiRequest = apiModule.llamaApiRequest;

      // Act & Assert
      await expect(llamaApiRequest(endpoint, method, null, llamaServerUrl)).rejects.toThrow(
        "ECONNREFUSED"
      );
    });

    /**
     * Objective: Verify that request timeout is handled properly
     * This test validates the 30-second timeout functionality
     */
    test("should handle request timeout after 30 seconds", async () => {
      // Arrange
      const endpoint = "/models";
      const method = "GET";
      const llamaServerUrl = "http://localhost:8080";
      let timeoutCallback = null;

      // Create a mock that triggers timeout
      mockRequest.mockReset();
      mockRequest.mockImplementation(() => {
        const timeoutReq = {
          on: jest.fn((event, handler) => {
            if (event === "error") {
              // Don't call error handler for timeout
            }
            return timeoutReq;
          }),
          write: jest.fn(),
          end: jest.fn(),
          destroy: jest.fn(),
          setTimeout: jest.fn((timeout, callback) => {
            if (timeout === 30000) {
              timeoutCallback = callback;
            }
          }),
        };
        return timeoutReq;
      });

      // Re-mock and re-import
      jest.unstable_mockModule("http", () => ({
        default: {
          request: mockRequest,
        },
      }));

      const apiModule = await import("../../../../server/handlers/llama-router/api.js");
      llamaApiRequest = apiModule.llamaApiRequest;

      // Act
      const promise = llamaApiRequest(endpoint, method, null, llamaServerUrl);

      // Trigger timeout
      expect(timeoutCallback).not.toBeNull();
      timeoutCallback();

      // Assert
      await expect(promise).rejects.toThrow("Request timeout");
    });

    /**
     * Objective: Verify that empty body does not cause write operation
     * This test validates that null/undefined body doesn't trigger write
     */
    test("should not write to request when body is null", async () => {
      // Arrange
      const endpoint = "/models";
      const method = "GET";
      const llamaServerUrl = "http://localhost:8080";

      mockResponse.on.mockImplementation((event, handler) => {
        if (event === "end") {
          handler();
        }
      });

      // Act
      await llamaApiRequest(endpoint, method, null, llamaServerUrl);

      // Assert
      expect(mockRequestInstance.write).not.toHaveBeenCalled();
      expect(mockRequestInstance.end).toHaveBeenCalled();
    });

    /**
     * Objective: Verify that complex JSON bodies are properly stringified
     * This test validates nested object serialization
     */
    test("should properly stringify complex JSON bodies", async () => {
      // Arrange
      const endpoint = "/completion";
      const method = "POST";
      const complexBody = {
        prompt: "Test prompt",
        options: {
          temperature: 0.7,
          max_tokens: 100,
          stop: ["\n", "##"],
        },
        stream: false,
      };
      const llamaServerUrl = "http://localhost:8080";

      mockResponse.on.mockImplementation((event, handler) => {
        if (event === "end") {
          handler();
        }
      });

      // Act
      await llamaApiRequest(endpoint, method, complexBody, llamaServerUrl);

      // Assert
      expect(mockRequestInstance.write).toHaveBeenCalledWith(JSON.stringify(complexBody));
    });

    /**
     * Objective: Verify response data chunks are accumulated correctly
     * This test validates chunked response handling
     */
    test("should accumulate multiple data chunks correctly", async () => {
      // Arrange
      const endpoint = "/completion";
      const method = "POST";
      const llamaServerUrl = "http://localhost:8080";
      const chunks = ['{"res', 'ponse": "da', 'ta"}'];

      mockResponse.on.mockImplementation((event, handler) => {
        if (event === "data") {
          chunks.forEach((chunk) => handler(chunk));
        }
        if (event === "end") {
          handler();
        }
      });

      // Act
      const result = await llamaApiRequest(endpoint, method, null, llamaServerUrl);

      // Assert
      expect(result).toEqual({ response: "data" });
    });

    /**
     * Objective: Verify that invalid JSON response falls back to raw string
     * This test validates the catch block in JSON parsing
     */
    test("should fall back to raw string when JSON parsing fails", async () => {
      // Arrange
      const endpoint = "/health";
      const method = "GET";
      const llamaServerUrl = "http://localhost:8080";
      const invalidJson = "Not valid JSON { broken";

      mockResponse.on.mockImplementation((event, handler) => {
        if (event === "data") {
          handler(invalidJson);
        }
        if (event === "end") {
          handler();
        }
      });

      // Act
      const result = await llamaApiRequest(endpoint, method, null, llamaServerUrl);

      // Assert
      expect(result).toBe(invalidJson);
    });

    /**
     * Objective: Verify that Content-Type header is always set
     * This test validates the header configuration
     */
    test("should always set Content-Type header to application/json", async () => {
      // Arrange
      const endpoint = "/models";
      const llamaServerUrl = "http://localhost:8080";

      mockResponse.on.mockImplementation((event, handler) => {
        if (event === "end") {
          handler();
        }
      });

      // Act
      await llamaApiRequest(endpoint, "GET", null, llamaServerUrl);

      // Assert
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
        expect.any(Function)
      );
    });

    /**
     * Objective: Verify promise rejection on immediate error
     * This test validates synchronous error handling
     */
    test("should reject promise when request errors immediately", async () => {
      // Arrange
      const endpoint = "/models";
      const method = "GET";
      const llamaServerUrl = "http://localhost:8080";
      const immediateError = new Error("Immediate connection error");

      // Create a mock that throws immediately
      mockRequest.mockReset();
      mockRequest.mockImplementation(() => {
        throw immediateError;
      });

      // Re-mock and re-import
      jest.unstable_mockModule("http", () => ({
        default: {
          request: mockRequest,
        },
      }));

      const apiModule = await import("../../../../server/handlers/llama-router/api.js");
      llamaApiRequest = apiModule.llamaApiRequest;

      // Act & Assert
      await expect(llamaApiRequest(endpoint, method, null, llamaServerUrl)).rejects.toThrow(
        "Immediate connection error"
      );
    });

    /**
     * Objective: Verify pathname is correctly extracted from URL
     * This test validates URL path handling
     */
    test("should correctly extract pathname from URL", async () => {
      // Arrange
      const endpoint = "/models/list";
      const llamaServerUrl = "http://localhost:8080/v1";

      mockResponse.on.mockImplementation((event, handler) => {
        if (event === "end") {
          handler();
        }
      });

      // Act
      await llamaApiRequest(endpoint, "GET", null, llamaServerUrl);

      // Assert - When endpoint starts with "/", it replaces the base path
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          path: "/models/list",
        }),
        expect.any(Function)
      );
    });
  });
});
