import { LlamaService } from '@/server/services/LlamaService';
import { setupMocks, mockConfig, mockedSpawn } from './test-utils';

describe('LlamaService - Argument Building', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  describe('argument building', () => {
    it('should build args with model path', () => {
      const llamaService = new LlamaService(mockConfig);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain('-m');
      expect(args).toContain('/path/to/model.gguf');
    });

    it('should build args with models directory when no model path', () => {
      const configWithoutModelPath = { ...mockConfig };
      delete configWithoutModelPath.modelPath;
      const llamaService = new LlamaService(configWithoutModelPath);

      const args = (llamaService as any).buildArgs();

      expect(args).toContain('--models-dir');
      expect(args).toContain('/path/to/models');
    });

    it('should include all configuration options', () => {
      const llamaService = new LlamaService(mockConfig);
      const args = (llamaService as any).buildArgs();

      expect(args).toContain('--host');
      expect(args).toContain('localhost');
      expect(args).toContain('--port');
      expect(args).toContain('8080');
      expect(args).toContain('-c');
      expect(args).toContain('2048');
    });

    it('should handle undefined optional parameters', () => {
      const configWithUndefined = {
        host: 'localhost',
        port: 8080,
        modelPath: '/path/to/model.gguf',
      } as LlamaServerConfig;
      const llamaService = new LlamaService(configWithUndefined);

      const args = (llamaService as any).buildArgs();

      expect(args).not.toContain('-ngl');
      expect(args).not.toContain('--temp');
    });
  });
});
