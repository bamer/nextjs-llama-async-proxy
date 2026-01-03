import '@testing-library/jest-dom';
import { loadModelTemplates, __resetCache__ } from '@/lib/client-model-templates';
import { setupDashboardTest, cleanupDashboardTest } from './dashboard-test-helpers';

/**
 * LoadModelTemplates Performance Tests
 *
 * Tests verify API deduplication and caching optimizations.
 */
describe('LoadModelTemplates Performance', () => {
  beforeEach(() => {
    setupDashboardTest();
    __resetCache__();
  });

  afterEach(() => {
    cleanupDashboardTest();
    __resetCache__();
  });

  it('should not make duplicate API calls', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: { model_templates: { 'test-model': 'test-template' } },
      }),
    });
    global.fetch = mockFetch as never;

    const promises = [
      loadModelTemplates(),
      loadModelTemplates(),
      loadModelTemplates(),
    ];

    await Promise.all(promises);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should return cached templates on subsequent calls', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: { model_templates: { 'cached-model': 'cached-template' } },
      }),
    });
    global.fetch = mockFetch as never;

    const result1 = await loadModelTemplates();
    expect(result1['cached-model']).toBe('cached-template');
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const result2 = await loadModelTemplates();
    expect(result2['cached-model']).toBe('cached-template');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should handle API failure gracefully with fallback', async () => {
    const mockFetch = jest.fn().mockRejectedValue(new Error('API Error'));
    global.fetch = mockFetch as never;

    const result = await loadModelTemplates();

    expect(result).toBeDefined();
    expect(Object.keys(result).length).toBeGreaterThan(0);
  });

  it('should reset cache correctly', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: { model_templates: { 'test-model': 'test-template' } },
      }),
    });
    global.fetch = mockFetch as never;

    await loadModelTemplates();
    expect(mockFetch).toHaveBeenCalledTimes(1);

    __resetCache__();

    await loadModelTemplates();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
