import { LlamaService } from '@/server/services/LlamaService';
import { setupMocks, mockConfig, mockedAxios } from './test-utils';

describe('LlamaService - Model Loading', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  describe('model loading', () => {
    it('should load models from server API', async () => {
      const llamaService = new LlamaService(mockConfig);
      const modelsResponse = {
        status: 200,
        data: {
          data: [
            {
              id: 'model1',
              name: 'Test Model 1',
              size: 1000000000,
              type: 'gguf',
            },
          ],
        },
      };

      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockResolvedValue(modelsResponse);

      await (llamaService as any).loadModels();

      const state = llamaService.getState();
      expect(state.models).toHaveLength(1);
    });

    it('should handle empty models list from server', async () => {
      const llamaService = new LlamaService(mockConfig);
      const emptyResponse = {
        status: 200,
        data: { data: [] },
      };

      const getCall = mockedAxios.create.mock.results[0].value.get as jest.MockedFunction<any>;
      getCall.mockResolvedValue(emptyResponse);

      await (llamaService as any).loadModels();

      const state = llamaService.getState();
      expect(state.models).toHaveLength(0);
    });
  });
});
