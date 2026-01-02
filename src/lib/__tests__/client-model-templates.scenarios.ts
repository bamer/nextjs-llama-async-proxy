import { loadModelTemplates, saveTemplatesFile, saveModelTemplate, getModelTemplate, getModelTemplates, getModelTemplatesSync, __resetCache__ } from '@/lib/client-model-templates';
import { getDefaultTemplates, setupMocks, mockSuccessApiResponse, mockFetchError, mockAbortError, expectDefaultTemplates, verifyFetchCalledWith } from './client-model-templates.utils';

export function describeLoadModelTemplatesScenarios(): void {
  it('should return cached templates if already loaded', async () => {
    setupMocks();
    const apiResponse = {
      success: true,
      data: { model_templates: { test: 'template' } },
    };
    mockSuccessApiResponse(apiResponse);

    const expectedResult = {
      ...getDefaultTemplates(),
      test: 'template',
    };

    const result1 = await loadModelTemplates();
    expect(result1).toEqual(expectedResult);
    expect((global.fetch as jest.Mock)).toHaveBeenCalledTimes(1);

    const result2 = await loadModelTemplates();
    expect(result2).toEqual(expectedResult);
    expect((global.fetch as jest.Mock)).toHaveBeenCalledTimes(1);
  });

  it('should load templates from API successfully', async () => {
    setupMocks();
    const apiResponse = {
      success: true,
      data: {
        model_templates: {
          custom1: 'template1',
          custom2: 'template2',
        },
      },
    };

    mockSuccessApiResponse(apiResponse);

    const result = await loadModelTemplates();

    const expected = {
      ...getDefaultTemplates(),
      custom1: 'template1',
      custom2: 'template2',
    };

    expect(result).toEqual(expected);
    verifyFetchCalledWith(['/api/model-templates', { signal: expect.any(AbortSignal) }]);
  });

  it('should handle API failure and return defaults', async () => {
    setupMocks();
    const apiResponse = {
      success: false,
      error: 'API error',
    };

    mockSuccessApiResponse(apiResponse);

    const result = await loadModelTemplates();

    expect(result).toEqual(getDefaultTemplates());
    expect((global.console.error as jest.Mock)).toHaveBeenCalledWith('Failed to load templates:', 'API error');
  });

  it('should handle fetch error and return defaults', async () => {
    setupMocks();
    mockFetchError();

    const result = await loadModelTemplates();

    expect(result).toEqual(getDefaultTemplates());
    expect((global.console.error as jest.Mock)).toHaveBeenCalledWith('Failed to load templates from API:', expect.any(Error));
  });

  it('should handle timeout', async () => {
    setupMocks();
    const mockController = {
      signal: {},
      abort: jest.fn(),
    };
    jest.spyOn(global, 'AbortController').mockImplementation(() => mockController as any);
    mockAbortError();

    const result = await loadModelTemplates();

    expect(result).toEqual(getDefaultTemplates());
    expect((global.console.error as jest.Mock)).toHaveBeenCalledWith('loadModelTemplates timed out after 30 seconds');
  }, 10000);

  it('should deduplicate concurrent requests', async () => {
    setupMocks();
    const apiResponse = {
      success: true,
      data: { model_templates: { test: 'template' } },
    };

    mockSuccessApiResponse(apiResponse);

    const promise1 = loadModelTemplates();
    const promise2 = loadModelTemplates();

    const [result1, result2] = await Promise.all([promise1, promise2]);

    expect(result1).toEqual(result2);
    expect((global.fetch as jest.Mock)).toHaveBeenCalledTimes(1);
  }, 10000);
}

export function describeSaveTemplatesFileScenarios(): void {
  it('should save templates successfully', async () => {
    setupMocks();
    const templates = { model1: 'temp1', model2: 'temp2' };
    const apiResponse = { success: true };

    mockSuccessApiResponse(apiResponse);

    await saveTemplatesFile(templates);

    verifyFetchCalledWith([
      '/api/model-templates',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_templates: templates }),
      },
    ]);

    expect(getModelTemplatesSync()).toEqual(templates);
  });

  it('should throw error on API failure', async () => {
    setupMocks();
    const templates = { test: 'template' };
    const apiResponse = { success: false, error: 'Save failed' };

    mockSuccessApiResponse(apiResponse);

    await expect(saveTemplatesFile(templates)).rejects.toThrow();
    expect((global.console.error as jest.Mock)).toHaveBeenCalledWith('Failed to save templates:', expect.any(Error));
  });

  it('should throw error on network failure', async () => {
    setupMocks();
    const templates = { test: 'template' };

    mockFetchError();

    await expect(saveTemplatesFile(templates)).rejects.toThrow();
    expect((global.console.error as jest.Mock)).toHaveBeenCalledWith('Failed to save templates:', expect.any(Error));
  });
}

export function describeSaveModelTemplateScenarios(): void {
  it('should save new template', async () => {
    setupMocks();
    const loadResponse = {
      success: true,
      data: { model_templates: {} },
    };
    const saveResponse = { success: true };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: () => Promise.resolve(loadResponse),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve(saveResponse),
      });

    await saveModelTemplate('newModel', 'newTemplate');

    expect((global.fetch as jest.Mock)).toHaveBeenCalledTimes(2);
    const secondCall = (global.fetch as jest.Mock).mock.calls[1];
    expect(secondCall).toEqual([
      '/api/model-templates',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    ]);
    const body = JSON.parse(secondCall[1].body);
    expect(body.model_templates).toHaveProperty('newModel', 'newTemplate');
  }, 10000);

  it('should delete template when null', async () => {
    setupMocks();
    const loadResponse = {
      success: true,
      data: { model_templates: { model1: 'template1' } },
    };
    const saveResponse = { success: true };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: () => Promise.resolve(loadResponse),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve(saveResponse),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve(saveResponse),
      });

    await saveModelTemplate('model1', 'template1');

    await saveModelTemplate('model1', null);

    expect((global.fetch as jest.Mock)).toHaveBeenCalledTimes(3);
    const thirdCall = (global.fetch as jest.Mock).mock.calls[2];
    expect(thirdCall).toEqual([
      '/api/model-templates',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    ]);
    const body = JSON.parse(thirdCall[1].body);
    expect(body.model_templates).not.toHaveProperty('model1');
    expect(body.model_templates).toHaveProperty('llama2-7b');
  }, 10000);

  it('should load templates if not cached', async () => {
    setupMocks();
    const loadResponse = {
      success: true,
      data: { model_templates: { existing: 'template' } },
    };

    const saveResponse = { success: true };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: () => Promise.resolve(loadResponse),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve(saveResponse),
      });

    await saveModelTemplate('newModel', 'newTemplate');

    expect((global.fetch as jest.Mock)).toHaveBeenCalledTimes(2);
  }, 10000);
}

export function describeGetModelTemplateScenarios(): void {
  it('should return cached template', async () => {
    setupMocks();
    const apiResponse = {
      success: true,
      data: { model_templates: { test: 'cached' } },
    };

    mockSuccessApiResponse(apiResponse);

    const result = await getModelTemplate('test');

    expect(result).toBe('cached');
  }, 10000);

  it('should load templates if not cached', async () => {
    setupMocks();
    const apiResponse = {
      success: true,
      data: { model_templates: { test: 'loaded' } },
    };

    mockSuccessApiResponse(apiResponse);

    const result = await getModelTemplate('test');

    expect(result).toBe('loaded');
    expect((global.fetch as jest.Mock)).toHaveBeenCalledTimes(1);
  }, 10000);
}

export function describeGetModelTemplatesScenarios(): void {
  it('should return cached templates', async () => {
    setupMocks();
    const apiResponse = {
      success: true,
      data: { model_templates: { test: 'template' } },
    };

    mockSuccessApiResponse(apiResponse);

    const result = await getModelTemplates();

    expect(result).toEqual({
      ...getDefaultTemplates(),
      test: 'template',
    });
  }, 10000);

  it('should load templates if not initialized', async () => {
    setupMocks();
    const apiResponse = {
      success: true,
      data: { model_templates: { test: 'template' } },
    };

    mockSuccessApiResponse(apiResponse);

    const result = await getModelTemplates();

    expect((global.fetch as jest.Mock)).toHaveBeenCalledTimes(1);
    expect(result).toHaveProperty('test', 'template');
    expectDefaultTemplates(result);
  }, 10000);
}

export function describeGetModelTemplatesSyncScenarios(): void {
  it('should return current cache', async () => {
    setupMocks();
    const apiResponse = {
      success: true,
      data: { model_templates: { sync: 'template' } },
    };

    mockSuccessApiResponse(apiResponse);

    await loadModelTemplates();

    const result = getModelTemplatesSync();

    expect(result).toHaveProperty('sync', 'template');
    expectDefaultTemplates(result);
  });
}

export function describeResetCacheScenarios(): void {
  it('should reset cache for testing', async () => {
    setupMocks();
    const apiResponse = {
      success: true,
      data: { model_templates: { test: 'template' } },
    };

    mockSuccessApiResponse(apiResponse);

    await loadModelTemplates();

    expect(getModelTemplatesSync()).toHaveProperty('test');

    __resetCache__();

    expect(getModelTemplatesSync()).toEqual({});
  });
}
