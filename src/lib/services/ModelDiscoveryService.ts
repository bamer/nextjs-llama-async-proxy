import { promises as fs } from 'fs';
import * as path from 'path';
import { getLogger } from '../logger';

const logger = getLogger();

export interface ModelMetadata {
  /** Human readable model name */
  name: string;
  /** Absolute path to the model file */
  path: string;
  /** Size in bytes */
  size: number;
  /** File format identifier */
  format: 'llama' | 'gguf';
  /** Whether the model is quantized (if detectable) */
  quantized?: boolean;
  /** Additional metadata parsed from adjacent JSON file */
  [key: string]: any;
}

export interface DiscoveredModel extends ModelMetadata {
  // Additional properties can be added here if needed
}

export class ModelDiscoveryService {
  // private basePath: string;

  constructor(_basePath: string) {
    // this.basePath = path.resolve(basePath);
  }

  /**
   * Recursively scan a directory for *.bin and *quant.bin files
   * @param scanPath Root directory to scan
   * @param maxDepth Maximum recursion depth (default: Infinity)
   * @returns Array of discovered model metadata
   */
  async discoverModels(scanPath: string, maxDepth: number = Infinity): Promise<DiscoveredModel[]> {
    const startPath = scanPath;
    const maxDepthUsed = maxDepth;
    const resolvedPath = path.resolve(startPath);
    const results: DiscoveredModel[] = [];

    /**
     * Internal recursive directory scanner
     */
    const scan = async (currentPath: string, depth: number): Promise<void> => {
      if (depth > maxDepthUsed) return;
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      for (const entry of entries) {
        if (typeof entry === 'object' && 'name' in entry) {
          const fullPath = path.join(currentPath, entry.name);
          const stat = await fs.stat(fullPath);
          if (stat.isDirectory()) {
            // Recurse into subdirectory
            await scan(fullPath, depth + 1);
          } else if (/\.(bin|quant\.bin)$/i.test(entry.name)) {
            // Potential model file found
            try {
              const size = stat.size;
              const ext = path.extname(entry.name).toLowerCase();
              const format: ModelMetadata['format'] = ext === '.quant.bin' ? 'gguf' : 'llama';
              const quantized = ext === '.quant.bin';

              // Extract a clean name from the filename (remove extension)
              const name = path.basename(entry.name, ext);

              // Attempt to load adjacent metadata file
              const metadataPath = path.format({
                dir: path.dirname(fullPath),
                name: path.basename(entry.name, ext),
                ext: '.json',
              });
              let extraMetadata: Record<string, any> = {};
              try {
                const raw = await fs.readFile(metadataPath, 'utf-8');
                extraMetadata = JSON.parse(raw);
              } catch (e) {
                // Metadata file is optional; ignore if missing or invalid
                logger.warn(`Metadata file not found or invalid: ${metadataPath}`);
              }

              results.push({
                name,
                path: fullPath,
                size,
                format,
                quantized,
                ...extraMetadata,
              });
            } catch (statError) {
              // Skip files we can't stat
              logger.warn(`Unable to stat file ${fullPath}:`, (statError as Error).message);
            }
          }
        }
      }
    };

    try {
      await scan(resolvedPath, 0);
      return results;
    } catch (error) {
      logger.error(`Failed to scan directory ${resolvedPath}:`, (error as Error).message);
      return [];
    }
  }

  /**
   * Get default parameter values for model configuration
   * @returns Record of default parameter categories
   */
  getDefaultParameters(): Record<string, any> {
    // Default parameters used across the application
    return {
      temperature: 0.7,
      top_p: 0.9,
      repeat_penalty: 1.1,
      max_tokens: 2048,
      presence_penalty: 0.0,
      frequency_penalty: 0.0,
    };
  }

  /**
   * Validate a model configuration object against expected schema
   * @param config Configuration object to validate
   * @returns Validation result with validity flag and error messages
   */
  validateModelConfig(config: any): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    // Basic validation checks
    if (config.name === undefined) {
      errors.push('Model name is required');
    }
    if (config.path === undefined) {
      errors.push('Model path is required');
    } else if (typeof config.path !== 'string') {
      errors.push('Model path must be a string');
    }

    // Add more validation rules as needed
    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true };
  }
}