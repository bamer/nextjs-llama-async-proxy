import fs from 'fs';
import path from 'path';
import { ParameterService } from '@/lib/services/parameterService';

jest.mock('fs');
jest.mock('path');

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedPath = path as jest.Mocked<typeof path>;

describe('ParameterService', () => {
  let service: ParameterService;

  beforeEach(() => {
    jest.clearAllMocks();

    mockedPath.join.mockImplementation((...args: string[]) => args.join('/'));
    mockedPath.resolve.mockImplementation((p: string) => p);
    mockedFs.readFileSync.mockReturnValue(
      JSON.stringify({
        llama_options: {
          sampling: {
            temperature: {
              type: 'number',
              default: 0.7,
              min: 0,
              max: 2,
              step: 0.1,
              description: 'Sampling temperature',
            },
            top_k: {
              type: 'number',
              default: 40,
              min: 1,
              max: 100,
              description: 'Top-k sampling',
            },
          },
          context: {
            ctx_size: {
              type: 'number',
              default: 2048,
              min: 512,
              max: 8192,
              step: 512,
              description: 'Context size',
            },
          },
        },
      })
    );

    service = new ParameterService();
  });

  describe('constructor', () => {
    it('should load parameters from config file', () => {
      expect(mockedFs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('llama_options_reference.json'),
        'utf-8'
      );
    });

    it('should handle missing config file gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const newService = new ParameterService();

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(newService.getOptionsByCategoryForUI()).toEqual({});

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getOptionsByCategoryForUI', () => {
    it('should return all parameters organized by category', () => {
      const options = service.getOptionsByCategoryForUI();

      expect(options).toHaveProperty('sampling');
      expect(options).toHaveProperty('context');
      expect(options.sampling.temperature).toBeDefined();
      expect(options.context.ctx_size).toBeDefined();
    });

    it('should return a copy of the parameters', () => {
      const options1 = service.getOptionsByCategoryForUI();
      const options2 = service.getOptionsByCategoryForUI();

      expect(options1).not.toBe(options2);
      expect(options1).toEqual(options2);
    });
  });

  describe('countOptions', () => {
    it('should return the total number of parameters', () => {
      const count = service.countOptions();

      expect(count).toBeGreaterThan(0);
    });

    it('should count parameters across all categories', () => {
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify({
          llama_options: {
            cat1: {
              param1: { type: 'number', description: 'Param 1' },
              param2: { type: 'string', description: 'Param 2' },
            },
            cat2: {
              param3: { type: 'boolean', description: 'Param 3' },
            },
          },
        })
      );

      service = new ParameterService();

      expect(service.countOptions()).toBe(3);
    });
  });

  describe('getCategory', () => {
    it('should return parameters for a valid category', () => {
      const category = service.getCategory('sampling');

      expect(category).toHaveProperty('temperature');
      expect(category).toHaveProperty('top_k');
    });

    it('should return empty object for non-existent category', () => {
      const category = service.getCategory('nonexistent');

      expect(category).toEqual({});
    });

    it('should return a copy of the category', () => {
      const category1 = service.getCategory('sampling');
      const category2 = service.getCategory('sampling');

      expect(category1).not.toBe(category2);
      expect(category1).toEqual(category2);
    });
  });

  describe('getOption', () => {
    it('should return a valid parameter option', () => {
      const option = service.getOption('sampling', 'temperature');

      expect(option).toBeDefined();
      expect(option?.type).toBe('number');
      expect(option?.default).toBe(0.7);
      expect(option?.description).toBe('Sampling temperature');
    });

    it('should return null for non-existent category', () => {
      const option = service.getOption('nonexistent', 'temperature');

      expect(option).toBeNull();
    });

    it('should return null for non-existent parameter', () => {
      const option = service.getOption('sampling', 'nonexistent');

      expect(option).toBeNull();
    });

    it('should return a copy of the option', () => {
      const option1 = service.getOption('sampling', 'temperature');
      const option2 = service.getOption('sampling', 'temperature');

      expect(option1).not.toBe(option2);
      expect(option1).toEqual(option2);
    });
  });

  describe('getParameterInfo', () => {
    it('should return detailed information about a parameter', () => {
      const info = service.getParameterInfo('temperature');

      expect(info).toBeDefined();
      expect(info?.name).toBe('temperature');
      expect(info?.category).toBe('sampling');
      expect(info?.type).toBe('number');
      expect(info?.min).toBe(0);
      expect(info?.max).toBe(2);
      expect(info?.step).toBe(0.1);
    });

    it('should return null for unknown parameter', () => {
      const info = service.getParameterInfo('nonexistent');

      expect(info).toBeNull();
    });
  });

  describe('validateParameter', () => {
    describe('number type validation', () => {
      it('should validate a valid number', () => {
        const result = service.validateParameter('temperature', 0.8);

        expect(result.valid).toBe(true);
      });

      it('should reject non-number values', () => {
        const result = service.validateParameter('temperature', 'not a number');

        expect(result.valid).toBe(false);
        expect(result.error).toContain('must be a number');
      });

      it('should reject NaN values', () => {
        const result = service.validateParameter('temperature', NaN);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('must be a number');
      });

      it('should enforce minimum value', () => {
        const result = service.validateParameter('temperature', -1);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('>= 0');
      });

      it('should enforce maximum value', () => {
        const result = service.validateParameter('temperature', 3);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('<= 2');
      });
    });

    describe('string type validation', () => {
      beforeEach(() => {
        mockedFs.readFileSync.mockReturnValue(
          JSON.stringify({
            llama_options: {
              general: {
                model_name: {
                  type: 'string',
                  default: 'default-model',
                  description: 'Model name',
                },
              },
            },
          })
        );
        service = new ParameterService();
      });

      it('should validate a valid string', () => {
        const result = service.validateParameter('model_name', 'test-model');

        expect(result.valid).toBe(true);
      });

      it('should reject non-string values', () => {
        const result = service.validateParameter('model_name', 123);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('must be a string');
      });
    });

    describe('boolean type validation', () => {
      beforeEach(() => {
        mockedFs.readFileSync.mockReturnValue(
          JSON.stringify({
            llama_options: {
              general: {
                verbose: {
                  type: 'boolean',
                  default: false,
                  description: 'Verbose output',
                },
              },
            },
          })
        );
        service = new ParameterService();
      });

      it('should validate a valid boolean', () => {
        const result1 = service.validateParameter('verbose', true);
        const result2 = service.validateParameter('verbose', false);

        expect(result1.valid).toBe(true);
        expect(result2.valid).toBe(true);
      });

      it('should reject non-boolean values', () => {
        const result = service.validateParameter('verbose', 'true');

        expect(result.valid).toBe(false);
        expect(result.error).toContain('must be a boolean');
      });
    });

    describe('select type validation', () => {
      beforeEach(() => {
        mockedFs.readFileSync.mockReturnValue(
          JSON.stringify({
            llama_options: {
              general: {
                cache_type: {
                  type: 'select',
                  default: 'f16',
                  options: ['f16', 'q8_0', 'q4_0'],
                  description: 'Cache type',
                },
              },
            },
          })
        );
        service = new ParameterService();
      });

      it('should validate a valid option', () => {
        const result = service.validateParameter('cache_type', 'q8_0');

        expect(result.valid).toBe(true);
      });

      it('should reject invalid options', () => {
        const result = service.validateParameter('cache_type', 'invalid');

        expect(result.valid).toBe(false);
        expect(result.error).toContain('must be one of');
        expect(result.error).toContain('f16');
        expect(result.error).toContain('q8_0');
        expect(result.error).toContain('q4_0');
      });
    });

    describe('unknown parameter validation', () => {
      it('should reject unknown parameters', () => {
        const result = service.validateParameter('unknown_param', 'value');

        expect(result.valid).toBe(false);
        expect(result.error).toContain('Unknown parameter');
      });
    });
  });
});
