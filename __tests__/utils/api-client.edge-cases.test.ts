import { ApiClient } from '@/utils/api-client';
import axios, { AxiosRequestConfig } from 'axios';

jest.mock('axios');

describe('ApiClient Edge Cases', () => {
  let apiClient: ApiClient;
  let mockedAxios: jest.Mocked<typeof axios>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    mockedAxios = axios as jest.Mocked<typeof axios>;
    apiClient = new ApiClient();
  });

  describe('HTTP Method Error Scenarios', () => {
    describe('GET method errors', () => {
      it('handles 400 Bad Request', async () => {
        const mockGet = jest.fn().mockRejectedValue({
          message: 'Bad Request',
          response: { status: 400, statusText: 'Bad Request', data: { error: 'Invalid input' } },
        });
        mockedAxios.create.mockReturnValue({
          get: mockGet,
        } as any);

        const result = await apiClient.get('/test');
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('400');
        expect(result.error?.message).toBe('Bad Request');
        expect(result.error?.details).toEqual({ error: 'Invalid input' });
      });

      it('handles 401 Unauthorized', async () => {
        const mockGet = jest.fn().mockRejectedValue({
          message: 'Unauthorized',
          response: { status: 401, statusText: 'Unauthorized', data: { error: 'Invalid token' } },
        });
        mockedAxios.create.mockReturnValue({
          get: mockGet,
        } as any);

        const result = await apiClient.get('/protected');
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('401');
      });

      it('handles 403 Forbidden', async () => {
        const mockGet = jest.fn().mockRejectedValue({
          message: 'Forbidden',
          response: { status: 403, statusText: 'Forbidden', data: { error: 'Access denied' } },
        });
        mockedAxios.create.mockReturnValue({
          get: mockGet,
        } as any);

        const result = await apiClient.get('/admin');
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('403');
      });

      it('handles 404 Not Found', async () => {
        const mockGet = jest.fn().mockRejectedValue({
          message: 'Not Found',
          response: { status: 404, statusText: 'Not Found', data: {} },
        });
        mockedAxios.create.mockReturnValue({
          get: mockGet,
        } as any);

        const result = await apiClient.get('/nonexistent');
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('404');
      });

      it('handles 500 Internal Server Error', async () => {
        const mockGet = jest.fn().mockRejectedValue({
          message: 'Internal Server Error',
          response: { status: 500, statusText: 'Internal Server Error', data: { error: 'Server crash' } },
        });
        mockedAxios.create.mockReturnValue({
          get: mockGet,
        } as any);

        const result = await apiClient.get('/test');
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('500');
      });

      it('handles 502 Bad Gateway', async () => {
        const mockGet = jest.fn().mockRejectedValue({
          message: 'Bad Gateway',
          response: { status: 502, statusText: 'Bad Gateway', data: {} },
        });
        mockedAxios.create.mockReturnValue({
          get: mockGet,
        } as any);

        const result = await apiClient.get('/test');
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('502');
      });

      it('handles 503 Service Unavailable', async () => {
        const mockGet = jest.fn().mockRejectedValue({
          message: 'Service Unavailable',
          response: { status: 503, statusText: 'Service Unavailable', data: {} },
        });
        mockedAxios.create.mockReturnValue({
          get: mockGet,
        } as any);

        const result = await apiClient.get('/test');
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('503');
      });

      it('handles timeout errors', async () => {
        const mockGet = jest.fn().mockRejectedValue({
          message: 'timeout of 5000ms exceeded',
          code: 'ECONNABORTED',
        });
        mockedAxios.create.mockReturnValue({
          get: mockGet,
        } as any);

        const result = await apiClient.get('/slow');
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('NETWORK_ERROR');
      });

      it('handles network errors with request object', async () => {
        const mockGet = jest.fn().mockRejectedValue({
          message: 'Network Error',
          request: { method: 'GET', url: '/test' },
        });
        mockedAxios.create.mockReturnValue({
          get: mockGet,
        } as any);

        const result = await apiClient.get('/test');
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('NETWORK_ERROR');
      });
    });

    describe('POST method errors', () => {
      it('handles POST 400 Bad Request', async () => {
        const mockPost = jest.fn().mockRejectedValue({
          message: 'Bad Request',
          response: { status: 400, statusText: 'Bad Request', data: { error: 'Validation failed' } },
        });
        mockedAxios.create.mockReturnValue({
          post: mockPost,
        } as any);

        const result = await apiClient.post('/test', { invalid: 'data' });
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('400');
      });

      it('handles POST 409 Conflict', async () => {
        const mockPost = jest.fn().mockRejectedValue({
          message: 'Conflict',
          response: { status: 409, statusText: 'Conflict', data: { error: 'Resource already exists' } },
        });
        mockedAxios.create.mockReturnValue({
          post: mockPost,
        } as any);

        const result = await apiClient.post('/test', { id: '123' });
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('409');
      });

      it('handles POST 422 Unprocessable Entity', async () => {
        const mockPost = jest.fn().mockRejectedValue({
          message: 'Unprocessable Entity',
          response: { status: 422, statusText: 'Unprocessable Entity', data: { error: 'Invalid data format' } },
        });
        mockedAxios.create.mockReturnValue({
          post: mockPost,
        } as any);

        const result = await apiClient.post('/test', {});
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('422');
      });
    });

    describe('PUT method errors', () => {
      it('handles PUT 404 Not Found', async () => {
        const mockPut = jest.fn().mockRejectedValue({
          message: 'Not Found',
          response: { status: 404, statusText: 'Not Found', data: {} },
        });
        mockedAxios.create.mockReturnValue({
          put: mockPut,
        } as any);

        const result = await apiClient.put('/nonexistent/123', { name: 'test' });
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('404');
      });

      it('handles PUT 409 Conflict', async () => {
        const mockPut = jest.fn().mockRejectedValue({
          message: 'Conflict',
          response: { status: 409, statusText: 'Conflict', data: { error: 'Version conflict' } },
        });
        mockedAxios.create.mockReturnValue({
          put: mockPut,
        } as any);

        const result = await apiClient.put('/test/123', { version: 2 });
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('409');
      });
    });

    describe('DELETE method errors', () => {
      it('handles DELETE 404 Not Found', async () => {
        const mockDelete = jest.fn().mockRejectedValue({
          message: 'Not Found',
          response: { status: 404, statusText: 'Not Found', data: {} },
        });
        mockedAxios.create.mockReturnValue({
          delete: mockDelete,
        } as any);

        const result = await apiClient.delete('/nonexistent/123');
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('404');
      });

      it('handles DELETE 403 Forbidden', async () => {
        const mockDelete = jest.fn().mockRejectedValue({
          message: 'Forbidden',
          response: { status: 403, statusText: 'Forbidden', data: { error: 'Cannot delete protected resource' } },
        });
        mockedAxios.create.mockReturnValue({
          delete: mockDelete,
        } as any);

        const result = await apiClient.delete('/protected/123');
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('403');
      });
    });

    describe('PATCH method errors', () => {
      it('handles PATCH 400 Bad Request', async () => {
        const mockPatch = jest.fn().mockRejectedValue({
          message: 'Bad Request',
          response: { status: 400, statusText: 'Bad Request', data: { error: 'Invalid patch data' } },
        });
        mockedAxios.create.mockReturnValue({
          patch: mockPatch,
        } as any);

        const result = await apiClient.patch('/test/123', { invalid: 'field' });
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('400');
      });

      it('handles PATCH 404 Not Found', async () => {
        const mockPatch = jest.fn().mockRejectedValue({
          message: 'Not Found',
          response: { status: 404, statusText: 'Not Found', data: {} },
        });
        mockedAxios.create.mockReturnValue({
          patch: mockPatch,
        } as any);

        const result = await apiClient.patch('/nonexistent/123', {});
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('404');
      });
    });
  });

  describe('Request/Response Interceptors', () => {
    it('initializes request interceptor on first request', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: { success: true } });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any);

      await apiClient.get('/test');

      const mockInstance = mockedAxios.create.mock.results[0].value as any;
      expect(mockInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockInstance.interceptors.response.use).toHaveBeenCalled();
    });

    it('passes through request interceptor', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: { success: true } });
      let capturedConfig: any;
      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: {
            use: jest.fn((config: any) => {
              capturedConfig = config;
              return config;
            }),
          },
          response: { use: jest.fn() },
        },
      } as any);

      await apiClient.get('/test');

      expect(capturedConfig).toBeDefined();
      expect(capturedConfig.url).toBe('/test');
    });

    it('handles request interceptor errors', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: { success: true } });
      const requestUseMock = jest.fn();
      requestUseMock.mockImplementation((successFn: any, errorFn: any) => {
        return { successFn, errorFn };
      });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
        interceptors: {
          request: {
            use: requestUseMock,
          },
          response: { use: jest.fn() },
        },
      } as any);

      const result = await apiClient.get('/test');
      // Should still make the request successfully
      expect(result.success).toBe(true);
    });
  });

  describe('Timeout Handling', () => {
    it('uses default timeout from config', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: { success: true } });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
      } as any);

      await apiClient.get('/test');

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: expect.any(Number),
        })
      );
    });

    it('handles timeout error from axios', async () => {
      const mockGet = jest.fn().mockRejectedValue({
        message: 'timeout of 5000ms exceeded',
        code: 'ECONNABORTED',
      });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
      } as any);

      const result = await apiClient.get('/slow-endpoint');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
    });

    it('handles ECONNABORTED error code', async () => {
      const mockPost = jest.fn().mockRejectedValue({
        message: 'Request aborted',
        code: 'ECONNABORTED',
      });
      mockedAxios.create.mockReturnValue({
        post: mockPost,
      } as any);

      const result = await apiClient.post('/test', {});
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
    });
  });

  describe('Retry Logic', () => {
    it('does not retry on network errors by default', async () => {
      const mockGet = jest.fn().mockRejectedValue({
        message: 'Network Error',
        request: {},
      });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
      } as any);

      const result = await apiClient.get('/test');
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(false);
    });

    it('handles transient 503 errors', async () => {
      const mockGet = jest.fn().mockRejectedValue({
        message: 'Service Unavailable',
        response: { status: 503, statusText: 'Service Unavailable', data: {} },
      });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
      } as any);

      const result = await apiClient.get('/test');
      expect(mockGet).toHaveBeenCalledTimes(1); // No retry by default
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('503');
    });
  });

  describe('Cancellation Handling', () => {
    it('handles CancelError from axios', async () => {
      const CancelError = new Error('Request canceled');
      (CancelError as any).code = 'ERR_CANCELED';

      const mockGet = jest.fn().mockRejectedValue(CancelError);
      mockedAxios.create.mockReturnValue({
        get: mockGet,
      } as any);

      const result = await apiClient.get('/test');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
    });
  });

  describe('Unknown Errors', () => {
    it('handles errors without request or response', async () => {
      const mockGet = jest.fn().mockRejectedValue({
        message: 'Unknown error occurred',
      });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
      } as any);

      const result = await apiClient.get('/test');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
      expect(result.error?.message).toBe('Unknown error occurred');
    });

    it('handles errors with stack trace', async () => {
      const error = new Error('Custom error');
      error.stack = 'Error: Custom error\n    at test.ts:10:5';
      const mockPost = jest.fn().mockRejectedValue(error);
      mockedAxios.create.mockReturnValue({
        post: mockPost,
      } as any);

      const result = await apiClient.post('/test', {});
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
      expect(result.error?.details).toContain('test.ts:10:5');
    });
  });

  describe('Edge Cases with Config', () => {
    it('handles empty config parameter', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: { success: true } });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
      } as any);

      const result = await apiClient.get('/test', {} as AxiosRequestConfig);
      expect(result.success).toBe(true);
      expect(mockGet).toHaveBeenCalledWith('/test', {});
    });

    it('handles custom config with headers', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: { success: true } });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
      } as any);

      const config = {
        headers: { 'X-Custom-Header': 'value' },
      } as AxiosRequestConfig;
      const result = await apiClient.get('/test', config);
      expect(result.success).toBe(true);
      expect(mockGet).toHaveBeenCalledWith('/test', config);
    });
  });

  describe('Data Type Handling', () => {
    it('handles empty response data', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: null });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
      } as any);

      const result = await apiClient.get('/test');
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('handles array response data', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: [1, 2, 3] });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
      } as any);

      const result = await apiClient.get('/test');
      expect(result.success).toBe(true);
      expect(result.data).toEqual([1, 2, 3]);
    });

    it('handles complex nested object response', async () => {
      const mockData = {
        user: {
          id: 1,
          profile: {
            name: 'Test',
            preferences: { theme: 'dark' },
          },
        },
      };
      const mockGet = jest.fn().mockResolvedValue({ data: mockData });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
      } as any);

      const result = await apiClient.get('/test');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
    });
  });

  describe('Timestamp Generation', () => {
    it('generates valid ISO timestamp on success', async () => {
      const beforeTime = new Date().toISOString();
      const mockGet = jest.fn().mockResolvedValue({ data: { success: true } });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
      } as any);

      const result = await apiClient.get('/test');
      const afterTime = new Date().toISOString();

      expect(result.success).toBe(true);
      expect(result.timestamp).toBeDefined();
      expect(result.timestamp >= beforeTime).toBe(true);
      expect(result.timestamp <= afterTime).toBe(true);
    });

    it('generates valid ISO timestamp on error', async () => {
      const beforeTime = new Date().toISOString();
      const mockGet = jest.fn().mockRejectedValue({
        message: 'Error',
        response: { status: 500, statusText: 'Error', data: {} },
      });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
      } as any);

      const result = await apiClient.get('/test');
      const afterTime = new Date().toISOString();

      expect(result.success).toBe(false);
      expect(result.timestamp).toBeDefined();
      expect(result.timestamp >= beforeTime).toBe(true);
      expect(result.timestamp <= afterTime).toBe(true);
    });
  });

  describe('Lazy Initialization', () => {
    it('creates axios instance only when needed', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: { success: true } });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
      } as any);

      // Client created but not used
      const client = new ApiClient();
      expect(mockedAxios.create).not.toHaveBeenCalled();

      // Now use it
      await client.get('/test');
      expect(mockedAxios.create).toHaveBeenCalledTimes(1);
    });

    it('reuses same instance for multiple requests', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: { success: true } });
      const mockPost = jest.fn().mockResolvedValue({ data: { success: true } });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
        post: mockPost,
      } as any);

      await apiClient.get('/test');
      await apiClient.post('/test', {});
      await apiClient.get('/test');

      expect(mockedAxios.create).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledTimes(2);
      expect(mockPost).toHaveBeenCalledTimes(1);
    });
  });

  describe('Base URL Configuration', () => {
    it('configures base URL from APP_CONFIG', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: { success: true } });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
      } as any);

      await apiClient.get('/test');

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: expect.any(String),
        })
      );
    });
  });

  describe('Default Headers', () => {
    it('includes Content-Type and Accept headers', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: { success: true } });
      mockedAxios.create.mockReturnValue({
        get: mockGet,
      } as any);

      await apiClient.get('/test');

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        })
      );
    });
  });
});
