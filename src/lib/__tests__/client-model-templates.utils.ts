import { loadModelTemplates, saveTemplatesFile, saveModelTemplate, getModelTemplate, getModelTemplates, getModelTemplatesSync, __resetCache__ } from '@/lib/client-model-templates';

export const DEFAULT_TEMPLATES = [
  { name: 'llama2-7b', template: 'llama-2-7b' },
  { name: 'llama2-13b', template: 'llama-2-13b' },
  { name: 'llama3-8b', template: 'llama-3-8b' },
  { name: 'llama3-70b', template: 'llama-3-70b' },
  { name: 'mistral-7b', template: 'mistral-7b' },
  { name: 'mistral-7b-instruct', template: 'mistral-7b-instruct' },
  { name: 'mistral-7b-uncensored', template: 'mistral-7b-uncensored' },
];

export function getDefaultTemplates(): Record<string, string> {
  return DEFAULT_TEMPLATES.reduce((acc, t) => ({ ...acc, [t.name]: t.template }), {});
}

export function setupMocks(): void {
  jest.clearAllMocks();
  __resetCache__();
  jest.useRealTimers();

  // Mock console error
  global.console.error = jest.fn();
}

export function cleanupMocks(): void {
  jest.useRealTimers();
}

export function mockSuccessApiResponse(data: unknown): void {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    json: () => Promise.resolve(data),
  });
}

export function mockFetchError(): void {
  (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
}

export function mockAbortError(): void {
  const abortError = new Error('Request aborted');
  (abortError as any).name = 'AbortError';
  (global.fetch as jest.Mock).mockRejectedValueOnce(abortError);
}

export function expectDefaultTemplates(result: Record<string, string>): void {
  const defaults = getDefaultTemplates();
  Object.entries(defaults).forEach(([name, template]) => {
    expect(result).toHaveProperty(name, template);
  });
}

export function verifyFetchCalledWith(expectedArgs: unknown[]): void {
  expect(global.fetch).toHaveBeenCalledWith(...expectedArgs);
}

export function verifyConsoleErrorCalled(expectedMessage: string): void {
  expect(global.console.error).toHaveBeenCalledWith(expectedMessage, expect.any(Error));
}
