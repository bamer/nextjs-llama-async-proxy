import axios from 'axios';
import { HealthChecker } from '@/server/services/llama/healthCheck';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HealthChecker', () => {
  let healthChecker: HealthChecker;

  beforeEach(() => {
    jest.clearAllMocks();
    healthChecker = new HealthChecker('localhost', 8080, 5000, 1000, 60);
  });

  describe('constructor', () => {
    it('should create axios client with correct config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:8080',
        timeout: 5000,
        validateStatus: expect.any(Function),
      });
    });

    it('should use custom timeout', () => {
      new HealthChecker('localhost', 8080, 10000, 1000, 60);

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:8080',
        timeout: 10000,
        validateStatus: expect.any(Function),
      });
    });

    it('should use custom interval', () => {
      new HealthChecker('localhost', 8080, 5000, 2000, 60);

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:8080',
        timeout: 5000,
        validateStatus: expect.any(Function),
      });
    });

    it('should use custom max checks', () => {
      new HealthChecker('localhost', 8080, 5000, 1000, 30);

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:8080',
        timeout: 5000,
        validateStatus: expect.any(Function),
      });
    });

    it('should use default values when not provided', () => {
      const checker = new HealthChecker('localhost', 8080);

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:8080',
        timeout: 5000,
        validateStatus: expect.any(Function),
      });
    });
  });

  describe('check', () => {
    it('should return true when health endpoint returns 200', async () => {
      const mockClient = {
        get: jest.fn().mockResolvedValue({ status: 200 }),
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const result = await healthChecker.check();

      expect(result).toBe(true);
      expect(mockClient.get).toHaveBeenCalledWith('/health');
    });

    it('should return false when health endpoint returns non-200 status', async () => {
      const mockClient = {
        get: jest.fn().mockResolvedValue({ status: 503 }),
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const result = await healthChecker.check();

      expect(result).toBe(false);
    });

    it('should return false when health endpoint throws error', async () => {
      const mockClient = {
        get: jest.fn().mockRejectedValue(new Error('Connection refused')),
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const result = await healthChecker.check();

      expect(result).toBe(false);
    });

    it('should handle timeout errors', async () => {
      const mockClient = {
        get: jest.fn().mockRejectedValue(new Error('timeout of 5000ms exceeded')),
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const result = await healthChecker.check();

      expect(result).toBe(false);
    });
  });

  describe('waitForReady', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return immediately when server is ready', async () => {
      const mockClient = {
        get: jest.fn().mockResolvedValue({ status: 200 }),
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const promise = healthChecker.waitForReady();

      await Promise.race([promise, new Promise((resolve) => setTimeout(resolve, 100))]);

      expect(mockClient.get).toHaveBeenCalledTimes(1);
    });

    it('should retry until server is ready', async () => {
      const mockClient = {
        get: jest.fn()
          .mockRejectedValueOnce(new Error('Not ready'))
          .mockRejectedValueOnce(new Error('Not ready'))
          .mockResolvedValue({ status: 200 }),
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const promise = healthChecker.waitForReady();

      jest.advanceTimersByTime(2000);
      await promise;

      expect(mockClient.get).toHaveBeenCalledTimes(3);
    });

    it('should wait between retries', async () => {
      const mockClient = {
        get: jest.fn()
          .mockRejectedValueOnce(new Error('Not ready'))
          .mockResolvedValue({ status: 200 }),
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const promise = healthChecker.waitForReady();

      await jest.advanceTimersByTimeAsync(1000);
      await promise;

      expect(mockClient.get).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max attempts', async () => {
      const mockClient = {
        get: jest.fn().mockRejectedValue(new Error('Not ready')),
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const promise = healthChecker.waitForReady();

      jest.advanceTimersByTime(60000);

      await expect(promise).rejects.toThrow('Server did not respond after 60s');

      expect(mockClient.get).toHaveBeenCalledTimes(60);
    });

    it('should respect custom max health checks', () => {
      const checker = new HealthChecker('localhost', 8080, 5000, 1000, 10);
      const mockClient = {
        get: jest.fn().mockRejectedValue(new Error('Not ready')),
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const promise = checker.waitForReady();

      jest.advanceTimersByTime(10000);

      return expect(promise).rejects.toThrow('Server did not respond after 10s');
    });

    it('should respect custom interval', async () => {
      const checker = new HealthChecker('localhost', 8080, 5000, 2000, 5);
      const mockClient = {
        get: jest.fn()
          .mockRejectedValueOnce(new Error('Not ready'))
          .mockResolvedValue({ status: 200 }),
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const promise = checker.waitForReady();

      jest.advanceTimersByTime(2000);
      await promise;

      expect(mockClient.get).toHaveBeenCalledTimes(2);
    });

    it('should handle network errors gracefully', async () => {
      const mockClient = {
        get: jest.fn().mockImplementation(() => {
          throw new Error('ECONNREFUSED');
        }),
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const promise = healthChecker.waitForReady();

      jest.advanceTimersByTime(60000);

      await expect(promise).rejects.toThrow('Server did not respond after 60s');
    });

    it('should return on first successful health check', async () => {
      const mockClient = {
        get: jest.fn()
          .mockResolvedValueOnce({ status: 503 })
          .mockResolvedValue({ status: 200 }),
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const promise = healthChecker.waitForReady();

      jest.advanceTimersByTime(1000);
      await promise;

      expect(mockClient.get).toHaveBeenCalledTimes(2);
    });

    it('should handle mixed successes and failures', async () => {
      const mockClient = {
        get: jest.fn()
          .mockResolvedValueOnce({ status: 503 })
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValue({ status: 200 }),
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const promise = healthChecker.waitForReady();

      jest.advanceTimersByTime(2000);
      await promise;

      expect(mockClient.get).toHaveBeenCalledTimes(3);
    });
  });
});
