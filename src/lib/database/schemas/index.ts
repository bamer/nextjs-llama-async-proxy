/**
 * Combined database schemas from all modules
 */
import { METRICS_SCHEMAS } from './metrics-schemas';
import { MODEL_SCHEMAS } from './model-schemas';
import { SYSTEM_SCHEMAS } from './system-schemas';

/**
 * Database schema constants
 * Exported for reuse in tests and migrations
 */
export const TABLE_SCHEMAS = {
  ...METRICS_SCHEMAS,
  ...MODEL_SCHEMAS,
  ...SYSTEM_SCHEMAS,
} as const;