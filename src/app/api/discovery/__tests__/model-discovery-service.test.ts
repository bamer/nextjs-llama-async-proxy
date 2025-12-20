import { ModelDiscoveryService } from '../../../lib/services/ModelDiscoveryService';

describe('ModelDiscoveryService', () => {
  let service: ModelDiscoveryService;

  beforeEach(() => {
    service = new ModelDiscoveryService('/api/models');
  });

  it('should create an instance', () => {
    expect(service).toBeDefined();
  });

  it('should return empty array for discoverModels', async () => {
    const result = await service.discoverModels('/some/path');
    expect(result).toEqual([]);
  });

  it('should return default parameters', () => {
    const result = service.getDefaultParameters();
    expect(result).toHaveProperty('temperature');
    expect(result).toHaveProperty('top_p');
    expect(result).toHaveProperty('repeat_penalty');
    expect(result).toHaveProperty('max_tokens');
  });

  it('should validate config as valid', () => {
    const result = service.validateModelConfig({ name: 'test', path: '/test' });
    expect(result).toEqual({ valid: true });
  });
});