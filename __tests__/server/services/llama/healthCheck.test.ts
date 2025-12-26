import { HealthChecker } from '@/server/services/llama/healthCheck';
import axios from 'axios';

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('HealthChecker', () => {
  let healthChecker: HealthChecker;

  beforeEach(() => {
    jest.clearAllMocks();
    healthChecker = new HealthChecker('localhost', 8134);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with host and port', () => {
      const checker = new HealthChecker('127.0.0.1', 9000);

      expect(checker).toBeInstanceOf(HealthChecker);
    });

    it('should build correct health URL', () => {
      expect(healthChecker.getHealthUrl()).toBe('http://localhost:8134/health');
    });
  });

  describe('check', () => {
    it('should return true on successful health check', async () => {
      mockAxios.get.mockResolvedValue({ status: 200, data: {} });

      const isHealthy = await healthChecker.check();

      expect(isHealthy).toBe(true);
      expect(mockAxios.get).toHaveBeenCalledWith(
        'http://localhost:8134/health',
        { timeout: 5000, validateStatus: expect.any(Function) }
      );
    });

    it('should return false on 500 status', async () => {
      mockAxios.get.mockResolvedValue({ status: 500, data: {} });

      const isHealthy = await healthChecker.check();

      expect(isHealthy).toBe(false);
    });

    it('should return false on 404 status', async () => {
      mockAxios.get.mockResolvedValue({ status: 404, data: {} });

      const isHealthy = await healthChecker.check();

      expect(isHealthy).toBe(false);
    });

    it('should return false on network error', async () => {
      mockAxios.get.mockRejectedValue(new Error('Network error'));

      const isHealthy = await healthChecker.check();

      expect(isHealthy).toBe(false);
    });

    it('should handle timeout', async () => {
      mockAxios.get.mockRejectedValue({ code: 'ECONNABORTED' });

      const isHealthy = await healthChecker.check();

      expect(isHealthy).toBe(false);
    });
  });

  describe('isHealthy', () => {
    it('should return current health status', async () => {
      mockAxios.get.mockResolvedValue({ status: 200, data: {} });
      await healthChecker.check();

      expect(healthChecker.isHealthy()).toBe(true);
    });

    it('should return false when not checked yet', () => {
      expect(healthChecker.isHealthy()).toBe(false);
    });
  });

  describe('waitForReady', () => {
    it('should wait until server is healthy', async () => {
      mockAxios.get.mockResolvedValueOnce({ status: 503, data: {} })
                              .mockResolvedValueOnce({ status: 503, data: {} })
                              .mockResolvedValue({ status: 200, data: {} });

      await healthChecker.waitForReady(3);

      expect(mockAxios.get).toHaveBeenCalledTimes(3);
    });

    it('should throw when timeout exceeded', async () => {
      mockAxios.get.mockResolvedValue({ status: 503, data: {} });

      await expect(healthChecker.waitForReady(3)).rejects.toThrow();
    });

    it('should use configured timeout', async () => {
      mockAxios.get.mockResolvedValue({ status: 200, data: {} });

      await healthChecker.waitForReady(1);

      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        { timeout: 5000 }
      );
    });
  });

  describe('integration', () => {
    it('should handle check → isHealthy flow', async () => {
      mockAxios.get.mockResolvedValue({ status: 200, data: {} });

      const healthy = await healthChecker.check();
      const isHealthy = healthChecker.isHealthy();

      expect(healthy).toBe(true);
      expect(isHealthy).toBe(true);
    });

    it('should handle check → waitForReady flow', async () => {
      mockAxios.get.mockResolvedValueOnce({ status: 503, data: {} })
                              .mockResolvedValue({ status: 200, data: {} });

      await healthChecker.check();
      await healthChecker.waitForReady(5);

      expect(healthChecker.isHealthy()).toBe(true);
    });
  });
});
