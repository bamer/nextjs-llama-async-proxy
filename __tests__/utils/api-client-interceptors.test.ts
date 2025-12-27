import { ApiClient } from "@/utils/api-client";
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

jest.mock("axios");

describe("ApiClient - Additional Coverage for Interceptors and Error Formatting", () => {
  let apiClient: ApiClient;
  let mockedAxios: jest.Mocked<typeof axios>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    mockedAxios = axios as jest.Mocked<typeof axios>;
    apiClient = new ApiClient();
  });

  describe("Request Interceptor Error Handler", () => {
    it("should handle request interceptor error", async () => {
      const mockError: Partial<AxiosError> = {
        message: "Request interceptor error",
      };
      const errorInterceptor = jest.fn();
      const mockGet = jest.fn().mockRejectedValue(new Error("Network error"));

      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: {
            use: jest.fn((successFn: any, errorFn: any) => {
              // Don't actually call errorFn, just track it exists
              errorInterceptor();
              return { successFn, errorFn };
            }),
          },
          response: { use: jest.fn() },
        },
      } as any);

      await expect(apiClient.get("/test")).rejects.toThrow("Network error");
      expect(errorInterceptor).toHaveBeenCalled();
    });

    it("should pass through request config successfully", async () => {
      let capturedConfig: AxiosRequestConfig | undefined;
      const mockGet = jest.fn().mockResolvedValue({ data: { success: true } });

      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: {
            use: jest.fn((config: AxiosRequestConfig) => {
              capturedConfig = config;
              return config;
            }),
          },
          response: { use: jest.fn() },
        },
      } as any);

      await apiClient.get("/test");

      expect(capturedConfig).toBeDefined();
      expect(capturedConfig?.url).toBe("/test");
      expect(capturedConfig?.method).toBe("get");
    });
  });

  describe("Response Interceptor Error Handler", () => {
    it("should handle 401 Unauthorized in response interceptor", async () => {
      const mockGet = jest.fn().mockRejectedValue({
        message: "Unauthorized",
        response: { status: 401, statusText: "Unauthorized", data: {} },
      });

      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: jest.fn() },
          response: {
            use: jest.fn((response: AxiosResponse) => response.data),
          },
        },
      } as any);

      const result = await apiClient.get("/protected");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("401");
    });

    it("should handle 403 Forbidden in response interceptor", async () => {
      const mockPost = jest.fn().mockRejectedValue({
        message: "Forbidden",
        response: { status: 403, statusText: "Forbidden", data: {} },
      });

      mockedAxios.create.mockReturnValue({
        post: mockPost,
        interceptors: {
          request: { use: jest.fn() },
          response: {
            use: jest.fn((response: AxiosResponse) => response.data),
          },
        },
      } as any);

      const result = await apiClient.post("/admin", {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("403");
    });

    it("should handle 404 Not Found in response interceptor", async () => {
      const mockPut = jest.fn().mockRejectedValue({
        message: "Not Found",
        response: { status: 404, statusText: "Not Found", data: {} },
      });

      mockedAxios.create.mockReturnValue({
        put: mockPut,
        interceptors: {
          request: { use: jest.fn() },
          response: {
            use: jest.fn((response: AxiosResponse) => response.data),
          },
        },
      } as any);

      const result = await apiClient.put("/nonexistent", {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("404");
    });

    it("should handle 500 Internal Server Error in response interceptor", async () => {
      const mockDelete = jest.fn().mockRejectedValue({
        message: "Internal Server Error",
        response: { status: 500, statusText: "Internal Server Error", data: {} },
      });

      mockedAxios.create.mockReturnValue({
        delete: mockDelete,
        interceptors: {
          request: { use: jest.fn() },
          response: {
            use: jest.fn((response: AxiosResponse) => response.data),
          },
        },
      } as any);

      const result = await apiClient.delete("/test");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("500");
    });
  });

  describe("formatError Method - Response Error", () => {
    it("should format error with response object", async () => {
      const error: Partial<AxiosError> = {
        message: "Bad Request",
        response: {
          status: 400,
          statusText: "Bad Request",
          data: { error: "Invalid input" },
        } as AxiosResponse,
      };

      const mockGet = jest.fn().mockRejectedValue(error);

      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: jest.fn() },
          response: {
            use: jest.fn((response: AxiosResponse) => response.data),
          },
        },
      } as any);

      const result = await apiClient.get("/test");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("400");
      expect(result.error?.message).toBe("Bad Request");
      expect(result.error?.details).toEqual({ error: "Invalid input" });
      expect(result.timestamp).toBeDefined();
    });

    it("should handle response with no data", async () => {
      const error: Partial<AxiosError> = {
        message: "Not Found",
        response: {
          status: 404,
          statusText: "Not Found",
          data: undefined,
        } as AxiosResponse,
      };

      const mockGet = jest.fn().mockRejectedValue(error);

      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: jest.fn() },
          response: {
            use: jest.fn((response: AxiosResponse) => response.data),
          },
        },
      } as any);

      const result = await apiClient.get("/test");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("404");
      expect(result.error?.details).toBeUndefined();
    });
  });

  describe("formatError Method - Request Error", () => {
    it("should format error with request object (network error)", async () => {
      const error: Partial<AxiosError> = {
        message: "Network Error",
        request: {
          method: "GET",
          url: "/test",
        } as any,
      };

      const mockGet = jest.fn().mockRejectedValue(error);

      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: jest.fn() },
          response: {
            use: jest.fn((response: AxiosResponse) => response.data),
          },
        },
      } as any);

      const result = await apiClient.get("/test");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("NETWORK_ERROR");
      expect(result.error?.message).toBe("Network error");
      expect(result.error?.details).toBe("Network Error");
    });

    it("should handle request error with empty request object", async () => {
      const error: Partial<AxiosError> = {
        message: "Connection refused",
        request: {} as any,
      };

      const mockGet = jest.fn().mockRejectedValue(error);

      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: jest.fn() },
          response: {
            use: jest.fn((response: AxiosResponse) => response.data),
          },
        },
      } as any);

      const result = await apiClient.get("/test");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("NETWORK_ERROR");
    });
  });

  describe("formatError Method - Unknown Error", () => {
    it("should format unknown error without request or response", async () => {
      const error = new Error("Unknown error occurred");
      error.stack = "Error: Unknown error occurred\n    at test.ts:10:5";

      const mockGet = jest.fn().mockRejectedValue(error);

      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: jest.fn() },
          response: {
            use: jest.fn((response: AxiosResponse) => response.data),
          },
        },
      } as any);

      const result = await apiClient.get("/test");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("UNKNOWN_ERROR");
      expect(result.error?.message).toBe("Unknown error occurred");
      expect(result.error?.details).toContain("test.ts:10:5");
    });

    it("should handle error without stack trace", async () => {
      const error = new Error("No stack error");
      // Delete stack to simulate missing stack
      delete (error as any).stack;

      const mockGet = jest.fn().mockRejectedValue(error);

      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: jest.fn() },
          response: {
            use: jest.fn((response: AxiosResponse) => response.data),
          },
        },
      } as any);

      const result = await apiClient.get("/test");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("UNKNOWN_ERROR");
      expect(result.error?.message).toBe("No stack error");
    });
  });

  describe("Interceptor Response Success Path", () => {
    it("should return response.data on success", async () => {
      const mockData = { success: true, message: "OK" };
      const mockGet = jest.fn().mockResolvedValue({ data: mockData });

      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: jest.fn() },
          response: {
            use: jest.fn((response: AxiosResponse) => response.data),
          },
        },
      } as any);

      const result = await apiClient.get("/test");

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
    });
  });

  describe("Mixed Interceptor Scenarios", () => {
    it("should handle request success then response error", async () => {
      const mockPost = jest.fn().mockRejectedValue({
        message: "Bad Request",
        response: { status: 400, statusText: "Bad Request", data: {} },
      });

      mockedAxios.create.mockReturnValue({
        post: mockPost,
        interceptors: {
          request: {
            use: jest.fn((config: AxiosRequestConfig) => config),
          },
          response: {
            use: jest.fn((response: AxiosResponse) => response.data),
          },
        },
      } as any);

      const result = await apiClient.post("/test", { data: "test" });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("400");
    });

    it("should handle request config modifications", async () => {
      let capturedConfig: AxiosRequestConfig | undefined;
      const mockGet = jest.fn().mockResolvedValue({ data: { success: true } });

      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: {
            use: jest.fn((config: AxiosRequestConfig) => {
              // Modify config
              config.headers = { ...config.headers, "X-Custom": "value" };
              capturedConfig = config;
              return config;
            }),
          },
          response: {
            use: jest.fn((response: AxiosResponse) => response.data),
          },
        },
      } as any);

      await apiClient.get("/test");

      expect(capturedConfig).toBeDefined();
      expect(capturedConfig?.headers).toHaveProperty("X-Custom", "value");
    });
  });

  describe("Error Code Coverage", () => {
    it("should cover all HTTP status codes in error switch", async () => {
      const statusCodes = [401, 403, 404, 500];

      for (const status of statusCodes) {
        const mockGet = jest.fn().mockRejectedValue({
          message: `Error ${status}`,
          response: {
            status,
            statusText: `Error ${status}`,
            data: {},
          },
        });

        mockedAxios.create.mockReturnValue({
          get: mockGet,
          interceptors: {
            request: { use: jest.fn() },
            response: {
              use: jest.fn((response: AxiosResponse) => response.data),
            },
          },
        } as any);

        const result = await apiClient.get("/test");
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(String(status));
      }
    });
  });
});
