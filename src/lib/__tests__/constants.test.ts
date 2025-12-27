import {
  MODEL_NAME_REGEX,
  DEFAULT_LAUNCH_TIMEOUT_MS,
  STATE_FILE_NAME,
  LOG_DIR,
} from '@/lib/constants';

describe('constants', () => {
  describe('MODEL_NAME_REGEX', () => {
    it('should be exported as a RegExp', () => {
      expect(MODEL_NAME_REGEX).toBeInstanceOf(RegExp);
    });

    it('should accept valid model names with letters only', () => {
      expect(MODEL_NAME_REGEX.test('llama')).toBe(true);
      expect(MODEL_NAME_REGEX.test('Llama')).toBe(true);
      expect(MODEL_NAME_REGEX.test('LLAMA')).toBe(true);
    });

    it('should accept valid model names with numbers', () => {
      expect(MODEL_NAME_REGEX.test('llama2')).toBe(true);
      expect(MODEL_NAME_REGEX.test('model123')).toBe(true);
      expect(MODEL_NAME_REGEX.test('42test')).toBe(true);
    });

    it('should accept valid model names with underscores', () => {
      expect(MODEL_NAME_REGEX.test('llama_2')).toBe(true);
      expect(MODEL_NAME_REGEX.test('my_model_name')).toBe(true);
      expect(MODEL_NAME_REGEX.test('_model')).toBe(true);
      expect(MODEL_NAME_REGEX.test('model_')).toBe(true);
    });

    it('should accept valid model names with hyphens', () => {
      expect(MODEL_NAME_REGEX.test('llama-2')).toBe(true);
      expect(MODEL_NAME_REGEX.test('my-model-name')).toBe(true);
      expect(MODEL_NAME_REGEX.test('-model')).toBe(true);
      expect(MODEL_NAME_REGEX.test('model-')).toBe(true);
    });

    it('should accept mixed valid characters', () => {
      expect(MODEL_NAME_REGEX.test('llama-2_chat')).toBe(true);
      expect(MODEL_NAME_REGEX.test('Model_42_v1')).toBe(true);
      expect(MODEL_NAME_REGEX.test('test-model-2_test')).toBe(true);
    });

    it('should reject model names with spaces', () => {
      expect(MODEL_NAME_REGEX.test('llama 2')).toBe(false);
      expect(MODEL_NAME_REGEX.test('my model')).toBe(false);
      expect(MODEL_NAME_REGEX.test(' test')).toBe(false);
      expect(MODEL_NAME_REGEX.test('test ')).toBe(false);
    });

    it('should reject model names with special characters', () => {
      expect(MODEL_NAME_REGEX.test('llama@2')).toBe(false);
      expect(MODEL_NAME_REGEX.test('model#1')).toBe(false);
      expect(MODEL_NAME_REGEX.test('test.model')).toBe(false);
      expect(MODEL_NAME_REGEX.test('model/test')).toBe(false);
      expect(MODEL_NAME_REGEX.test('test$')).toBe(false);
      expect(MODEL_NAME_REGEX.test('test%')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(MODEL_NAME_REGEX.test('')).toBe(false);
    });

    it('should reject dot and double dot', () => {
      expect(MODEL_NAME_REGEX.test('.')).toBe(false);
      expect(MODEL_NAME_REGEX.test('..')).toBe(false);
    });
  });

  describe('DEFAULT_LAUNCH_TIMEOUT_MS', () => {
    it('should be exported as a number', () => {
      expect(typeof DEFAULT_LAUNCH_TIMEOUT_MS).toBe('number');
    });

    it('should be 30_000 milliseconds', () => {
      expect(DEFAULT_LAUNCH_TIMEOUT_MS).toBe(30000);
    });
  });

  describe('STATE_FILE_NAME', () => {
    it('should be exported as a string', () => {
      expect(typeof STATE_FILE_NAME).toBe('string');
    });

    it('should be models-state.json', () => {
      expect(STATE_FILE_NAME).toBe('models-state.json');
    });
  });

  describe('LOG_DIR', () => {
    it('should be exported as a string', () => {
      expect(typeof LOG_DIR).toBe('string');
    });

    it('should include project working directory', () => {
      expect(LOG_DIR).toContain(process.cwd());
    });

    it('should end with logs directory', () => {
      expect(LOG_DIR).toContain('logs');
    });
  });
});
