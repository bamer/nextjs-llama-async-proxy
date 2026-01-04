import { LlamaService } from '@/server/services/LlamaService';
import { setupMocks, mockConfig, mockProcess, mockedSpawn, mockedAxios } from './test-utils';

describe('LlamaService - Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  describe('start', () => {
    it('should return immediately if already ready', async () => {
      const llamaService = new LlamaService(mockConfig);
      (llamaService as any).state.status = 'ready';

      await llamaService.start();

      expect(mockedSpawn).not.toHaveBeenCalled();
    });

    it('should return immediately if already starting', async () => {
      const llamaService = new LlamaService(mockConfig);
      (llamaService as any).state.status = 'starting';

      await llamaService.start();

      expect(mockedSpawn).not.toHaveBeenCalled();
    });

    it('should handle start errors', async () => {
      const llamaService = new LlamaService(mockConfig);
      mockedSpawn.mockImplementation(() => {
        throw new Error('Failed to start server');
      });

      await expect(llamaService.start()).rejects.toThrow('Failed to start server');

      const state = llamaService.getState();
      expect(state.status).toBe('error');
      expect(state.lastError).toBe('Failed to start server');
    });
  });

  describe('stop', () => {
    it('should stop running process gracefully', async () => {
      const llamaService = new LlamaService(mockConfig);
      (llamaService as any).process = mockProcess;

      const stopPromise = llamaService.stop();

      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');

      await stopPromise;

      const state = llamaService.getState();
      expect(state.status).toBe('initial');
    });

    it('should handle stop when no process running', async () => {
      const llamaService = new LlamaService(mockConfig);
      (llamaService as any).process = null;

      await llamaService.stop();

      expect(mockProcess.kill).not.toHaveBeenCalled();
    });
  });

  describe('healthCheck', () => {
    it('should return true when health endpoint responds with 200', async () => {
      const llamaService = new LlamaService(mockConfig);
      const healthCheckCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      healthCheckCall.mockResolvedValue({ status: 200 });

      const result = await (llamaService as any).healthCheck();

      expect(result).toBe(true);
      expect(healthCheckCall).toHaveBeenCalledWith('/health');
    });

    it('should return false when health endpoint returns error', async () => {
      const llamaService = new LlamaService(mockConfig);
      const healthCheckCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      healthCheckCall.mockRejectedValue(new Error('Connection refused'));

      const result = await (llamaService as any).healthCheck();

      expect(result).toBe(false);
    });
  });
});
