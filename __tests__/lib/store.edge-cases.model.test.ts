import { useStore, selectActiveModel } from '@/lib/store';
import { act } from '@testing-library/react';
import { ModelConfig } from '@/types/global';

describe('store edge cases - Model management', () => {
  beforeEach(() => {
    // Reset store state
    act(() => {
      useStore.setState({
        models: [],
        activeModelId: null,
        metrics: null,
        logs: [],
        settings: {
          theme: 'system' as const,
          notifications: true,
          autoRefresh: true,
        },
        status: {
          isLoading: false,
          error: null,
        },
        chartHistory: {
          cpu: [],
          memory: [],
          requests: [],
          gpuUtil: [],
          power: [],
        },
      });
    });
  });

  // Helper function to create a complete ModelConfig
  const createModelConfig = (overrides?: Partial<ModelConfig>): ModelConfig => ({
    id: 'model-1',
    name: 'Test Model',
    type: 'llama',
    parameters: {},
    status: 'idle',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  describe('ModelConfig completeness', () => {
    it('should accept complete ModelConfig with all required properties', () => {
      const model: ModelConfig = createModelConfig({
        id: 'model-1',
        name: 'Llama 2 7B',
        type: 'llama',
        parameters: { temperature: 0.7, maxTokens: 2048 },
        status: 'idle',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });

      act(() => {
        useStore.getState().setModels([model]);
      });

      expect(useStore.getState().models).toHaveLength(1);
      expect(useStore.getState().models[0]).toEqual(model);
    });

    it('should handle models with different types', () => {
      const llamaModel: ModelConfig = createModelConfig({
        id: 'llama-1',
        name: 'Llama 2',
        type: 'llama',
      });
      const mistralModel: ModelConfig = createModelConfig({
        id: 'mistral-1',
        name: 'Mistral 7B',
        type: 'mistral',
      });
      const otherModel: ModelConfig = createModelConfig({
        id: 'other-1',
        name: 'GPT-4',
        type: 'other',
      });

      act(() => {
        useStore.getState().addModel(llamaModel);
        useStore.getState().addModel(mistralModel);
        useStore.getState().addModel(otherModel);
      });

      expect(useStore.getState().models[0].type).toBe('llama');
      expect(useStore.getState().models[1].type).toBe('mistral');
      expect(useStore.getState().models[2].type).toBe('other');
    });

    it('should handle models with all possible statuses', () => {
      const statuses: Array<'idle' | 'loading' | 'running' | 'error'> = ['idle', 'loading', 'running', 'error'];

      statuses.forEach((status, index) => {
        const model: ModelConfig = createModelConfig({
          id: `model-${index}`,
          name: `Model ${status}`,
          status,
        });

        act(() => {
          useStore.getState().addModel(model);
        });
      });

      expect(useStore.getState().models).toHaveLength(4);
      expect(useStore.getState().models[0].status).toBe('idle');
      expect(useStore.getState().models[1].status).toBe('loading');
      expect(useStore.getState().models[2].status).toBe('running');
      expect(useStore.getState().models[3].status).toBe('error');
    });
  });

  describe('setModels edge cases', () => {
    it('should handle empty array', () => {
      act(() => {
        useStore.getState().setModels([]);
      });

      expect(useStore.getState().models).toEqual([]);
    });

    it('should handle single model', () => {
      const model: ModelConfig = createModelConfig();

      act(() => {
        useStore.getState().setModels([model]);
      });

      expect(useStore.getState().models).toHaveLength(1);
    });

    it('should handle large number of models', () => {
      const models: ModelConfig[] = Array.from({ length: 1000 }, (_, i) =>
        createModelConfig({
          id: `model-${i}`,
          name: `Model ${i}`,
        })
      );

      act(() => {
        useStore.getState().setModels(models);
      });

      expect(useStore.getState().models).toHaveLength(1000);
    });

    it('should replace existing models completely', () => {
      const initialModels: ModelConfig[] = [
        createModelConfig({ id: 'model-1' }),
        createModelConfig({ id: 'model-2' }),
      ];

      act(() => {
        useStore.getState().setModels(initialModels);
      });

      const newModels: ModelConfig[] = [createModelConfig({ id: 'model-3' })];

      act(() => {
        useStore.getState().setModels(newModels);
      });

      expect(useStore.getState().models).toHaveLength(1);
      expect(useStore.getState().models[0].id).toBe('model-3');
    });
  });

  describe('addModel edge cases', () => {
    it('should handle adding model with duplicate id', () => {
      const model: ModelConfig = createModelConfig({ id: 'duplicate-id' });

      act(() => {
        useStore.getState().addModel(model);
        useStore.getState().addModel(model);
      });

      expect(useStore.getState().models).toHaveLength(2);
      expect(useStore.getState().models[0].id).toBe('duplicate-id');
      expect(useStore.getState().models[1].id).toBe('duplicate-id');
    });

    it('should handle model with complex parameters', () => {
      const model: ModelConfig = createModelConfig({
        parameters: {
          temperature: 0.7,
          topP: 0.9,
          maxTokens: 2048,
          presencePenalty: 0.5,
          frequencyPenalty: 0.5,
          stopSequences: ['\n', '###'],
        },
      });

      act(() => {
        useStore.getState().addModel(model);
      });

      expect(useStore.getState().models[0].parameters).toEqual(model.parameters);
    });

    it('should maintain insertion order', () => {
      const models: ModelConfig[] = [
        createModelConfig({ id: 'model-1', name: 'First' }),
        createModelConfig({ id: 'model-2', name: 'Second' }),
        createModelConfig({ id: 'model-3', name: 'Third' }),
      ];

      act(() => {
        models.forEach((model) => useStore.getState().addModel(model));
      });

      expect(useStore.getState().models[0].name).toBe('First');
      expect(useStore.getState().models[1].name).toBe('Second');
      expect(useStore.getState().models[2].name).toBe('Third');
    });
  });

  describe('updateModel edge cases', () => {
    it('should update multiple properties at once', () => {
      const model: ModelConfig = createModelConfig({ id: 'model-1' });

      act(() => {
        useStore.getState().addModel(model);
        useStore.getState().updateModel('model-1', {
          name: 'Updated Model',
          status: 'running',
          parameters: { temperature: 0.8 },
        });
      });

      expect(useStore.getState().models[0].name).toBe('Updated Model');
      expect(useStore.getState().models[0].status).toBe('running');
      expect(useStore.getState().models[0].parameters.temperature).toBe(0.8);
    });

    it('should handle updating createdAt and updatedAt', () => {
      const model: ModelConfig = createModelConfig({
        id: 'model-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });

      act(() => {
        useStore.getState().addModel(model);
        useStore.getState().updateModel('model-1', {
          updatedAt: '2024-12-27T00:00:00Z',
        });
      });

      expect(useStore.getState().models[0].createdAt).toBe('2024-01-01T00:00:00Z');
      expect(useStore.getState().models[0].updatedAt).toBe('2024-12-27T00:00:00Z');
    });

    it('should not modify other models when updating one', () => {
      const model1: ModelConfig = createModelConfig({
        id: 'model-1',
        name: 'Model 1',
        status: 'idle',
      });
      const model2: ModelConfig = createModelConfig({
        id: 'model-2',
        name: 'Model 2',
        status: 'idle',
      });
      const model3: ModelConfig = createModelConfig({
        id: 'model-3',
        name: 'Model 3',
        status: 'idle',
      });

      act(() => {
        useStore.getState().addModel(model1);
        useStore.getState().addModel(model2);
        useStore.getState().addModel(model3);
        useStore.getState().updateModel('model-2', { status: 'running' });
      });

      expect(useStore.getState().models[0].status).toBe('idle');
      expect(useStore.getState().models[1].status).toBe('running');
      expect(useStore.getState().models[2].status).toBe('idle');
    });

    it('should handle updating model type', () => {
      const model: ModelConfig = createModelConfig({ type: 'llama' });

      act(() => {
        useStore.getState().addModel(model);
        useStore.getState().updateModel(model.id, { type: 'mistral' });
      });

      expect(useStore.getState().models[0].type).toBe('mistral');
    });
  });

  describe('removeModel edge cases', () => {
    it('should handle removing non-existent model', () => {
      act(() => {
        useStore.getState().removeModel('non-existent-id');
      });

      expect(useStore.getState().models).toEqual([]);
    });

    it('should handle removing from empty models array', () => {
      act(() => {
        useStore.getState().removeModel('model-1');
      });

      expect(useStore.getState().models).toEqual([]);
    });

    it('should correctly clear activeModelId when removing active model', () => {
      const model1: ModelConfig = createModelConfig({ id: 'model-1' });
      const model2: ModelConfig = createModelConfig({ id: 'model-2' });

      act(() => {
        useStore.getState().addModel(model1);
        useStore.getState().addModel(model2);
        useStore.getState().setActiveModel('model-1');
        useStore.getState().removeModel('model-1');
      });

      expect(useStore.getState().activeModelId).toBeNull();
    });

    it('should preserve activeModelId when removing different model', () => {
      const model1: ModelConfig = createModelConfig({ id: 'model-1' });
      const model2: ModelConfig = createModelConfig({ id: 'model-2' });

      act(() => {
        useStore.getState().addModel(model1);
        useStore.getState().addModel(model2);
        useStore.getState().setActiveModel('model-1');
        useStore.getState().removeModel('model-2');
      });

      expect(useStore.getState().activeModelId).toBe('model-1');
    });

    it('should handle removing multiple models', () => {
      const models: ModelConfig[] = [
        createModelConfig({ id: 'model-1' }),
        createModelConfig({ id: 'model-2' }),
        createModelConfig({ id: 'model-3' }),
      ];

      act(() => {
        models.forEach((model) => useStore.getState().addModel(model));
        useStore.getState().removeModel('model-1');
        useStore.getState().removeModel('model-3');
      });

      expect(useStore.getState().models).toHaveLength(1);
      expect(useStore.getState().models[0].id).toBe('model-2');
    });
  });

  describe('setActiveModel edge cases', () => {
    it('should handle setting active model to id that does not exist', () => {
      act(() => {
        useStore.getState().setActiveModel('non-existent-id');
      });

      expect(useStore.getState().activeModelId).toBe('non-existent-id');
    });

    it('should handle switching between active models', () => {
      const model1: ModelConfig = createModelConfig({ id: 'model-1' });
      const model2: ModelConfig = createModelConfig({ id: 'model-2' });

      act(() => {
        useStore.getState().addModel(model1);
        useStore.getState().addModel(model2);
        useStore.getState().setActiveModel('model-1');
        useStore.getState().setActiveModel('model-2');
      });

      expect(useStore.getState().activeModelId).toBe('model-2');
    });

    it('should handle setting same active model multiple times', () => {
      act(() => {
        useStore.getState().setActiveModel('model-1');
        useStore.getState().setActiveModel('model-1');
        useStore.getState().setActiveModel('model-1');
      });

      expect(useStore.getState().activeModelId).toBe('model-1');
    });

    it('selectActiveModel should return null when models array is empty', () => {
      act(() => {
        useStore.getState().setActiveModel('model-1');
      });

      const activeModel = selectActiveModel(useStore.getState());
      expect(activeModel).toBeNull();
    });

    it('selectActiveModel should return null when activeModelId is null', () => {
      const model: ModelConfig = createModelConfig();
      act(() => {
        useStore.getState().addModel(model);
      });

      const activeModel = selectActiveModel(useStore.getState());
      expect(activeModel).toBeNull();
    });

    it('selectActiveModel should return null when activeModelId does not match any model', () => {
      const model: ModelConfig = createModelConfig({ id: 'model-1' });
      act(() => {
        useStore.getState().addModel(model);
        useStore.getState().setActiveModel('non-existent');
      });

      const activeModel = selectActiveModel(useStore.getState());
      expect(activeModel).toBeNull();
    });
  });
});
