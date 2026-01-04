import { ApiClient } from '@/utils/api-client';
import axios from 'axios';

jest.mock('axios');

describe('ApiClient POST Errors', () => {
  let apiClient: ApiClient;
  let mockedAxios: jest.Mocked<typeof axios>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    mockedAxios = axios as jest.Mocked<typeof axios>;
    apiClient = new ApiClient();
  });

  it('handles POST 400 Bad Request', async () => {
    const mockPost = jest.fn().mockRejectedValue({
      message: 'Bad Request',
      response: { status: 400, statusText: 'Bad Request', data: { error: 'Validation failed' } },
    });
    mockedAxios.create.mockReturnValue({ post: mockPost } as any);

    const result = await apiClient.post('/test', { invalid: 'data' });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('400');
  });

  it('handles POST 409 Conflict', async () => {
    const mockPost = jest.fn().mockRejectedValue({
      message: 'Conflict',
      response: { status: 409, statusText: 'Conflict', data: { error: 'Resource already exists' } },
    });
    mockedAxios.create.mockReturnValue({ post: mockPost } as any);

    const result = await apiClient.post('/test', { id: '123' });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('409');
  });

  it('handles POST 422 Unprocessable Entity', async () => {
    const mockPost = jest.fn().mockRejectedValue({
      message: 'Unprocessable Entity',
      response: { status: 422, statusText: 'Unprocessable Entity', data: { error: 'Invalid data format' } },
    });
    mockedAxios.create.mockReturnValue({ post: mockPost } as any);

    const result = await apiClient.post('/test', {});
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('422');
  });
});
