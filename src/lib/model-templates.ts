import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getLogger } from '../lib/logger';

const logger = getLogger();

const MODEL_TEMPLATES_FILE = join(process.cwd(), 'model-templates.json');

export interface ModelTemplate {
  name: string;
  template: string;
}

const DEFAULT_TEMPLATES: ModelTemplate[] = [
  { name: 'llama2-7b', template: 'llama-2-7b' },
  { name: 'llama2-13b', template: 'llama-2-13b' },
  { name: 'llama3-8b', template: 'llama-3-8b' },
  { name: 'llama3-70b', template: 'llama-3-70b' },
  { name: 'mistral-7b', template: 'mistral-7b' },
  { name: 'mistral-7b-instruct', template: 'mistral-7b-instruct' },
  { name: 'mistral-7b-uncensored', template: 'mistral-7b-uncensored' },
];

let cachedTemplates: Record<string, string> = {};

function loadTemplatesFile(): Record<string, string> {
  try {
    if (existsSync(MODEL_TEMPLATES_FILE)) {
      const data = readFileSync(MODEL_TEMPLATES_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      logger.info('[ModelTemplates] Templates loaded from file');
      return parsed.model_templates || {};
    }
  } catch (error) {
    logger.error('[ModelTemplates] Failed to load templates file:', error);
  }
  return {};
}

function saveTemplatesFile(templates: Record<string, string>): void {
  try {
    const config = { model_templates: templates };
    writeFileSync(MODEL_TEMPLATES_FILE, JSON.stringify(config, null, 2), 'utf-8');
    logger.info('[ModelTemplates] Templates saved to file');
  } catch (error) {
    logger.error('[ModelTemplates] Failed to save templates file:', error);
  }
}

export function loadModelTemplates(): Record<string, string> {
  const fileTemplates = loadTemplatesFile();
  cachedTemplates = { ...DEFAULT_TEMPLATES.reduce((acc, t) => ({ ...acc, [t.name]: t.template }), {}), ...fileTemplates };
  return cachedTemplates;
}

export function saveModelTemplate(modelName: string, template: string): void {
  cachedTemplates[modelName] = template;
  saveTemplatesFile(cachedTemplates);
}

export function getModelTemplate(modelName: string): string | undefined {
  if (!cachedTemplates[modelName]) {
    cachedTemplates = loadModelTemplates();
  }
  return cachedTemplates[modelName];
}

export function getModelTemplates(): Record<string, string> {
  if (Object.keys(cachedTemplates).length === 0) {
    cachedTemplates = loadModelTemplates();
  }
  return cachedTemplates;
}
