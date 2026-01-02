/**
 * Model type detection utilities
 */

export type ModelType = 'llama' | 'mistral' | 'other';

/**
 * Detect the type of model based on its name
 */
export function detectModelType(modelName: string): ModelType {
  const nameLower = modelName.toLowerCase();
  if (nameLower.includes('llama') || nameLower.includes('codellama') ||
      nameLower.includes('gemma') || nameLower.includes('granite')) {
    return 'llama';
  }
  if (nameLower.includes('mistral') || nameLower.includes('qwen') ||
      nameLower.includes('nemotron') || nameLower.includes('magnus') ||
      nameLower.includes('fluently')) {
    return 'mistral';
  }
  return 'other';
}

/**
 * Get templates filtered by model type
 */
export function getModelTypeTemplates(
  modelType: ModelType,
  allTemplates: Record<string, string>
): string[] {
  const templateValues = Object.values(allTemplates) as string[];
  if (modelType === 'other') {
    return templateValues;
  }
  return templateValues.filter(t => {
    const template = t.toLowerCase();
    if (modelType === 'llama') {
      return template.includes('llama') || template.includes('chat') ||
             template.includes('instruct');
    }
    return template.includes('mistral');
  });
}

/**
 * Get status color for MUI Chip
 */
export function getStatusColor(
  status: string
): 'default' | 'error' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' {
  switch (status) {
    case 'running': return 'success';
    case 'loading': return 'warning';
    case 'error': return 'error';
    default: return 'default';
  }
}

/**
 * Get status label for display
 */
export function getStatusLabel(status: string, progress?: number): string {
  switch (status) {
    case 'running': return 'RUNNING';
    case 'loading': return progress !== undefined ? `Loading... ${progress}%` : 'LOADING';
    case 'error': return 'ERROR';
    default: return 'STOPPED';
  }
}
