export interface ModelTemplate {
  name: string;
  template: string;
}

const DEFAULT_TEMPLATES: ModelTemplate[] = [
  { name: "llama2-7b", template: "llama-2-7b" },
  { name: "llama2-13b", template: "llama-2-13b" },
  { name: "llama3-8b", template: "llama-3-8b" },
  { name: "llama3-70b", template: "llama-3-70b" },
  { name: "mistral-7b", template: "mistral-7b" },
  { name: "mistral-7b-instruct", template: "mistral-7b-instruct" },
  { name: "mistral-7b-uncensored", template: "mistral-7b-uncensored" },
];

let cachedTemplates: Record<string, string> = {};
let isInitialized = false;
let loadingPromise: Promise<Record<string, string>> | null = null;

/**
 * Load model templates from API with timeout and deduplication
 * This is a client-side function that makes an API call to server
 */
export async function loadModelTemplates(): Promise<Record<string, string>> {
  // Return cached if available
  if (isInitialized && Object.keys(cachedTemplates).length > 0) {
    return cachedTemplates;
  }

  // Return existing promise if request is in-flight (deduplication)
  if (loadingPromise) {
    return loadingPromise;
  }

  // Start new request
  loadingPromise = (async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds

    try {
      const response = await fetch("/api/model-templates", {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const result = await response.json();
      if (!result.success) {
        console.error("Failed to load templates:", result.error);
        return DEFAULT_TEMPLATES.reduce((acc, t) => ({ ...acc, [t.name]: t.template }), {});
      }

      const apiTemplates = result.data?.model_templates || {};
      cachedTemplates = {
        ...DEFAULT_TEMPLATES.reduce((acc, t) => ({ ...acc, [t.name]: t.template }), {}),
        ...apiTemplates
      };
      isInitialized = true;

      return cachedTemplates;
    } catch (error) {
      clearTimeout(timeoutId);

      const errorObj = error as Error;
      if (errorObj.name === 'AbortError') {
        console.error('loadModelTemplates timed out after 30 seconds');
      } else {
        console.error("Failed to load templates from API:", error);
      }

      return DEFAULT_TEMPLATES.reduce((acc, t) => ({ ...acc, [t.name]: t.template }), {});
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

/**
 * Save templates file via API
 * This is a client-side function that makes an API call to server
 */
export async function saveTemplatesFile(templates: Record<string, string>): Promise<void> {
  try {
    const response = await fetch('/api/model-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_templates: templates }),
    });
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to save templates');
    }
    // Update cache
    cachedTemplates = templates;
    isInitialized = true;
  } catch (error) {
    console.error('Failed to save templates:', error);
    throw error;
  }
}

/**
 * Save a model template via API
 * This is a client-side function that makes an API call to server
 */
export async function saveModelTemplate(modelName: string, template: string | null): Promise<void> {
  try {
    if (!cachedTemplates[modelName] || !isInitialized) {
      cachedTemplates = await loadModelTemplates();
    }

    if (template === null) {
      delete cachedTemplates[modelName];
    } else {
      cachedTemplates[modelName] = template;
    }

    const response = await fetch('/api/model-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_templates: cachedTemplates }),
    });
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to save template');
    }
  } catch (error) {
    console.error('Failed to save model template:', error);
    throw error;
  }
}

/**
 * Get a single model template
 */
export async function getModelTemplate(modelName: string): Promise<string | undefined> {
  if (!cachedTemplates[modelName] || !isInitialized) {
    cachedTemplates = await loadModelTemplates();
  }
  return cachedTemplates[modelName];
}

/**
 * Get all model templates
 */
export async function getModelTemplates(): Promise<Record<string, string>> {
  if (!isInitialized || Object.keys(cachedTemplates).length === 0) {
    cachedTemplates = await loadModelTemplates();
  }
  return cachedTemplates;
}

/**
 * Synchronous version of getModelTemplates for backward compatibility
 * Returns cached templates or empty object if not yet loaded
 */
export function getModelTemplatesSync(): Record<string, string> {
  return cachedTemplates;
}

/**
 * Test-only: Reset cache
 */
export function __resetCache__(): void {
  cachedTemplates = {};
  isInitialized = false;
  loadingPromise = null;
}
