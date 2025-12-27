import { apiClient } from '@/utils/api-client';
import axios from 'axios';

jest.mock('axios');

describe('ApiClient', () => {
  let mockedAxios: jest.Mocked<typeof axios>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the axios instance by re-importing
    jest.resetModules();
    mockedAxios = axios as jest.Mocked<typeof axios>;
  });

  describe('get', () => {
    it('returns success response on successful request', async () => {
      const mockData = { data: 'test' };
      const mockGet = jest.fn().mockResolvedValue({ data: mockData });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
      } as any);

      const { apiClient: freshClient } = await import('@/utils/api-client');
      const result = await freshClient.get('/test');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(result.timestamp).toBeDefined();
      expect(mockGet).toHaveBeenCalledWith('/test', undefined);
    });

    it('returns error response on network error', async () => {
      const mockGet = jest.fn().mockRejectedValue({ message: 'Network error', request: {} });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
      } as any);

      const { apiClient: freshClient } = await import('@/utils/api-client');
      const result = await freshClient.get('/test');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
    });

    it('returns error response on 404', async () => {
      const mockGet = jest.fn().mockRejectedValue({
        message: 'Not Found',
        response: { status: 404, statusText: 'Not Found', data: {} },
      });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
      } as any);

      const { apiClient: freshClient } = await import('@/utils/api-client');
      const result = await freshClient.get('/test');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('404');
    });
  });

  describe('post', () => {
    it('returns success response on successful request', async () => {
      const mockData = { id: '123' };
      const mockPost = jest.fn().mockResolvedValue({ data: mockData });
      mockedAxios.create.mockReturnValue({
        post: mockPost,
      } as any);

      const { apiClient: freshClient } = await import('@/utils/api-client');
      const result = await freshClient.post('/test', mockData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(result.timestamp).toBeDefined();
      expect(mockPost).toHaveBeenCalledWith('/test', mockData, undefined);
    });

    it('handles network error', async () => {
      const mockPost = jest.fn().mockRejectedValue({ message: 'Network error', request: {} });
      mockedAxios.create.mockReturnValue({
        post: mockPost,
      } as any);

      const { apiClient: freshClient } = await import('@/utils/api-client');
      const result = await freshClient.post('/test', {});
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
    });
  });

  describe('put', () => {
    it('returns success response on successful request', async () => {
      const mockData = { id: '123', updated: true };
      const mockPut = jest.fn().mockResolvedValue({ data: mockData });
      mockedAxios.create.mockReturnValue({
        put: mockPut,
      } as any);

      const { apiClient: freshClient } = await import('@/utils/api-client');
      const result = await freshClient.put('/test/123', mockData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
    });
  });

  describe('delete', () => {
    it('returns success response on successful request', async () => {
      const mockDelete = jest.fn().mockResolvedValue({ data: { deleted: true } });
      mockedAxios.create.mockReturnValue({
        delete: mockDelete,
      } as any);

      const { apiClient: freshClient } = await import('@/utils/api-client');
      const result = await freshClient.delete('/test/123');
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ deleted: true });
    });
  });

  describe('patch', () => {
    it('returns success response on successful request', async () => {
      const mockData = { id: '123', patched: true };
      const mockPatch = jest.fn().mockResolvedValue({ data: mockData });
      mockedAxios.create.mockReturnValue({
        patch: mockPatch,
      } as any);

      const { apiClient: freshClient } = await import('@/utils/api-client');
      const result = await freshClient.patch('/test/123', mockData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
    });
  });
});
