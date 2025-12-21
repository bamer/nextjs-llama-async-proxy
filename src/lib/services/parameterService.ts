import fs from 'fs';
import path from 'path';

export interface ParameterOption {
  short?: string;
  long?: string;
  type: 'number' | 'string' | 'boolean' | 'select';
  default?: any;
  min?: number;
  max?: number;
  step?: number;
  options?: string[] | number[];
  description: string;
  tooltip?: string;
}

export interface SelectParameterOption extends Omit<ParameterOption, 'options'> {
  type: 'select';
  options: string[] | number[];
}

export interface ParameterCategory {
  [paramName: string]: ParameterOption;
}

export interface ParameterCategories {
  [category: string]: ParameterCategory;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface ParameterInfo extends ParameterOption {
  category: string;
  name: string;
}

/**
 * ParameterService provides access to llama.cpp server parameters
 * Reads from configuration files and provides validation and metadata
 */
export class ParameterService {
  private parameters: ParameterCategories = {};
  private parameterMap: Map<string, { category: string; option: ParameterOption }> = new Map();

  constructor() {
    this.loadParameters();
  }

  /**
   * Load parameters from configuration files
   */
  private loadParameters(): void {
    try {
      const configPath = path.join(process.cwd(), 'src', 'config', 'llama_options_reference.json');
      const configData = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configData);

      if (config.llama_options) {
        this.parameters = config.llama_options;
        this.buildParameterMap();
      }
    } catch (error) {
      console.error('Failed to load parameter configuration:', error);
      // Initialize with empty parameters if loading fails
      this.parameters = {};
    }
  }

  /**
   * Build a flat map of parameter name to category and option for quick lookup
   */
  private buildParameterMap(): void {
    this.parameterMap.clear();
    for (const [category, params] of Object.entries(this.parameters)) {
      for (const [paramName, option] of Object.entries(params)) {
        this.parameterMap.set(paramName, { category, option: option as ParameterOption });
      }
    }
  }

  /**
   * Get all parameters organized by category for UI display
   */
  getOptionsByCategoryForUI(): ParameterCategories {
    return { ...this.parameters };
  }

  /**
   * Count total number of parameter options
   */
  countOptions(): number {
    return this.parameterMap.size;
  }

  /**
   * Get all parameters for a specific category
   */
  getCategory(category: string): ParameterCategory {
    const categoryData = this.parameters[category];
    return categoryData ? { ...categoryData } : {};
  }

  /**
   * Get a specific parameter option
   */
  getOption(category: string, paramName: string): ParameterOption | null {
    const categoryParams = this.parameters[category];
    if (!categoryParams) return null;

    const option = categoryParams[paramName];
    return option ? { ...option } : null;
  }

  /**
   * Get detailed information about a parameter
   */
  getParameterInfo(paramName: string): ParameterInfo | null {
    const entry = this.parameterMap.get(paramName);
    if (!entry) return null;

    return {
      ...entry.option,
      category: entry.category,
      name: paramName,
    };
  }

  /**
   * Validate a parameter value against its constraints
   */
  validateParameter(paramName: string, value: any): ValidationResult {
    const info = this.getParameterInfo(paramName);
    if (!info) {
      return { valid: false, error: `Unknown parameter: ${paramName}` };
    }

    const { type, min, max, options } = info;

    // Type validation
    switch (type) {
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return { valid: false, error: `${paramName} must be a number` };
        }
        break;
      case 'string':
        if (typeof value !== 'string') {
          return { valid: false, error: `${paramName} must be a string` };
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          return { valid: false, error: `${paramName} must be a boolean` };
        }
        break;
      case 'select':
        // For select type, options should always be defined
        const opts = options! as any[];
        if (!opts.includes(value)) {
          return { valid: false, error: `${paramName} must be one of: ${opts.join(', ')}` };
        }
        break;
    }

    // Range validation for numbers
    if (type === 'number') {
      if (min !== undefined && value < min) {
        return { valid: false, error: `${paramName} must be >= ${min}` };
      }
      if (max !== undefined && value > max) {
        return { valid: false, error: `${paramName} must be <= ${max}` };
      }
    }

    return { valid: true };
  }
}

// Export a singleton instance
export const parameterService = new ParameterService();