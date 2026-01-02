import { APP_CONFIG } from '@/config/app.config';

jest.mock('axios', () => ({
  create: jest.fn(),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
}));

jest.mock('@/config/app.config');

describe('ApiClient', () => {
  describe('singleton exports', () => {
    it('exports apiClient instance', () => {
      const { apiClient } = require('@/utils/api-client');
      expect(apiClient).toBeDefined();
      expect(typeof apiClient.get).toBe('function');
      expect(typeof apiClient.post).toBe('function');
      expect(typeof apiClient.put).toBe('function');
      expect(typeof apiClient.delete).toBe('function');
      expect(typeof apiClient.patch).toBe('function');
    });
  });
});
