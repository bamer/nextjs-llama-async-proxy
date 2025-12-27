import axios from "axios";
import { HealthChecker } from "@/server/services/llama/healthCheck";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("HealthChecker", () => {
  let healthChecker: HealthChecker;
  let mockClient: jest.Mocked<Awaited<ReturnType<typeof axios.create>>>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      get: jest.fn(),
    } as any;
    mockedAxios.create.mockReturnValue(mockClient as any);
    healthChecker = new HealthChecker("localhost", 8080, 5000, 1000, 60);
  });

  describe("constructor", () => {
    it("should create axios client with correct config", () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: "http://localhost:8080",
        timeout: 5000,
        validateStatus: expect.any(Function),
      });
    });

    it("should use custom timeout", () => {
      new HealthChecker("localhost", 8080, 10000, 1000, 60);

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: "http://localhost:8080",
        timeout: 10000,
        validateStatus: expect.any(Function),
      });
    });

    it("should use custom interval", () => {
      new HealthChecker("localhost", 8080, 5000, 2000, 60);

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: "http://localhost:8080",
        timeout: 5000,
        validateStatus: expect.any(Function),
      });
    });

    it("should use custom max checks", () => {
      new HealthChecker("localhost", 8080, 5000, 1000, 30);

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: "http://localhost:8080",
        timeout: 5000,
        validateStatus: expect.any(Function),
      });
    });

    it("should use default values when not provided", () => {
      const checker = new HealthChecker("localhost", 8080);

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: "http://localhost:8080",
        timeout: 5000,
        validateStatus: expect.any(Function),
      });
    });
  });

  describe("check", () => {
    it("should return true when health endpoint returns 200", async () => {
      mockClient.get.mockResolvedValue({ status: 200 });

      const result = await healthChecker.check();

      expect(result).toBe(true);
      expect(mockClient.get).toHaveBeenCalledWith("/health");
    });

    it("should return false when health endpoint returns non-200 status", async () => {
      mockClient.get.mockResolvedValue({ status: 503 });

      const result = await healthChecker.check();

      expect(result).toBe(false);
    });

    it("should return false when health endpoint throws error", async () => {
      mockClient.get.mockRejectedValue(new Error("Connection refused"));

      const result = await healthChecker.check();

      expect(result).toBe(false);
    });

    it("should handle timeout errors", async () => {
      mockClient.get.mockRejectedValue(new Error("timeout of 5000ms exceeded"));

      const result = await healthChecker.check();

      expect(result).toBe(false);
    });
  });

  describe("waitForReady", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should return immediately when server is ready", async () => {
      mockClient.get.mockResolvedValue({ status: 200 });

      const promise = healthChecker.waitForReady();
      await jest.runAllTimersAsync();
      await promise;

      expect(mockClient.get).toHaveBeenCalledTimes(1);
    });

    it("should retry until server is ready", async () => {
      mockClient.get
        .mockRejectedValueOnce(new Error("Not ready"))
        .mockRejectedValueOnce(new Error("Not ready"))
        .mockResolvedValue({ status: 200 });

      const promise = healthChecker.waitForReady();
      await jest.runAllTimersAsync();
      await promise;

      expect(mockClient.get).toHaveBeenCalledTimes(3);
    });

    it("should wait between retries", async () => {
      mockClient.get
        .mockRejectedValueOnce(new Error("Not ready"))
        .mockResolvedValue({ status: 200 });

      const promise = healthChecker.waitForReady();
      await jest.advanceTimersByTimeAsync(1000);
      await promise;

      expect(mockClient.get).toHaveBeenCalledTimes(2);
    });

    it("should throw error after max attempts", async () => {
      mockClient.get.mockRejectedValue(new Error("Not ready"));

      const promise = healthChecker.waitForReady();

      // Catch the rejection
      const error = promise.catch((e) => e);

      // Run all timers
      await jest.runAllTimersAsync();

      const actualError = await error;
      expect(actualError.message).toBe("Server did not respond after 60s");
      expect(mockClient.get).toHaveBeenCalledTimes(60);
    });

    it("should respect custom max health checks", async () => {
      const customMockClient = {
        get: jest.fn().mockRejectedValue(new Error("Not ready")),
      } as any;
      mockedAxios.create.mockReturnValue(customMockClient as any);
      const checker = new HealthChecker("localhost", 8080, 5000, 1000, 10);

      const promise = checker.waitForReady();

      // Catch the rejection
      const error = promise.catch((e) => e);

      // Run all timers
      await jest.runAllTimersAsync();

      const actualError = await error;
      expect(actualError.message).toBe("Server did not respond after 10s");
      expect(customMockClient.get).toHaveBeenCalledTimes(10);
    });

    it("should respect custom interval", async () => {
      const customMockClient = {
        get: jest.fn()
          .mockRejectedValueOnce(new Error("Not ready"))
          .mockResolvedValue({ status: 200 }),
      } as any;
      mockedAxios.create.mockReturnValue(customMockClient as any);
      const checker = new HealthChecker("localhost", 8080, 5000, 2000, 5);

      const promise = checker.waitForReady();
      await jest.advanceTimersByTimeAsync(2000);
      await promise;

      expect(customMockClient.get).toHaveBeenCalledTimes(2);
    });

    it("should handle network errors gracefully", async () => {
      mockClient.get.mockImplementation(() => {
        throw new Error("ECONNREFUSED");
      });

      const promise = healthChecker.waitForReady();

      // Catch the rejection
      const error = promise.catch((e) => e);

      // Run all timers
      await jest.runAllTimersAsync();

      const actualError = await error;
      expect(actualError.message).toBe("Server did not respond after 60s");
      expect(mockClient.get).toHaveBeenCalledTimes(60);
    });

    it("should return on first successful health check", async () => {
      mockClient.get
        .mockResolvedValueOnce({ status: 503 })
        .mockResolvedValue({ status: 200 });

      const promise = healthChecker.waitForReady();
      await jest.advanceTimersByTimeAsync(1000);
      await promise;

      expect(mockClient.get).toHaveBeenCalledTimes(2);
    });

    it("should handle mixed successes and failures", async () => {
      mockClient.get
        .mockResolvedValueOnce({ status: 503 })
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValue({ status: 200 });

      const promise = healthChecker.waitForReady();
      await jest.advanceTimersByTimeAsync(2000);
      await promise;

      expect(mockClient.get).toHaveBeenCalledTimes(3);
    });
  });
});
