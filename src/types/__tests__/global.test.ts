import type {
  Nullable,
  Optional,
  AsyncReturnType,
  ApiResponse,
  PaginatedResponse,
  WebSocketMessage,
  ModelConfig,
  SystemMetrics,
  LogEntry,
} from '@/types/global';

describe('Global Types', () => {
  describe('Nullable', () => {
    it('allows null value', () => {
      const value: Nullable<string> = null;

      expect(value).toBe(null);
    });

    it('allows non-null value', () => {
      const value: Nullable<string> = 'test';

      expect(value).toBe('test');
    });

    it('allows number with null', () => {
      const value: Nullable<number> = 42;

      expect(value).toBe(42);
    });

    it('allows object with null', () => {
      const value: Nullable<{ id: number }> = { id: 1 };

      expect(value).toEqual({ id: 1 });
    });

    it('allows null object', () => {
      const value: Nullable<{ id: number }> = null;

      expect(value).toBe(null);
    });

    it('allows undefined if explicitly typed', () => {
      const value: Nullable<string | undefined> = undefined;

      expect(value).toBe(undefined);
    });
  });

  describe('Optional', () => {
    it('allows undefined value', () => {
      const value: Optional<string> = undefined;

      expect(value).toBe(undefined);
    });

    it('allows defined value', () => {
      const value: Optional<string> = 'test';

      expect(value).toBe('test');
    });

    it('allows number with undefined', () => {
      const value: Optional<number> = 42;

      expect(value).toBe(42);
    });

    it('allows object with undefined', () => {
      const value: Optional<{ id: number }> = { id: 1 };

      expect(value).toEqual({ id: 1 });
    });

    it('allows undefined object', () => {
      const value: Optional<{ id: number }> = undefined;

      expect(value).toBe(undefined);
    });

    it('does not allow null', () => {
      const value: Optional<string> = undefined;

      expect(value).toBeNull();
    });
  });

  describe('AsyncReturnType', () => {
    it('infers return type of async function', () => {
      async function asyncFunction(): Promise<string> {
        return 'test';
      }

      type Result = AsyncReturnType<typeof asyncFunction>;

      const result: Result = 'test';

      expect(typeof result).toBe('string');
    });

    it('infers return type of async function with object', () => {
      async function asyncFunction(): Promise<{ id: number; name: string }> {
        return { id: 1, name: 'test' };
      }

      type Result = AsyncReturnType<typeof asyncFunction>;

      const result: Result = { id: 1, name: 'test' };

      expect(result).toEqual({ id: 1, name: 'test' });
    });

    it('infers return type of async function with number', () => {
      async function asyncFunction(): Promise<number> {
        return 42;
      }

      type Result = AsyncReturnType<typeof asyncFunction>;

      const result: Result = 42;

      expect(result).toBe(42);
    });

    it('infers return type of async function with boolean', () => {
      async function asyncFunction(): Promise<boolean> {
        return true;
      }

      type Result = AsyncReturnType<typeof asyncFunction>;

      const result: Result = true;

      expect(result).toBe(true);
    });

    it('infers return type of async function with array', () => {
      async function asyncFunction(): Promise<number[]> {
        return [1, 2, 3];
      }

      type Result = AsyncReturnType<typeof asyncFunction>;

      const result: Result = [1, 2, 3];

      expect(result).toEqual([1, 2, 3]);
    });

    it('handles non-async function (returns never)', () => {
      function syncFunction(): string {
        return 'test';
      }

      type Result = AsyncReturnType<typeof syncFunction>;

      const neverCheck: Result = undefined as never;

      expect(neverCheck).toBe(undefined);
    });
  });

  describe('ApiResponse', () => {
    it('creates successful response', () => {
      const response: ApiResponse<string> = {
        success: true,
        data: 'test',
        timestamp: new Date().toISOString(),
      };

      expect(response.success).toBe(true);
      expect(response.data).toBe('test');
      expect(response.timestamp).toBeDefined();
    });

    it('creates error response', () => {
      const response: ApiResponse<string> = {
        success: false,
        error: {
          code: 'ERROR_CODE',
          message: 'Error occurred',
          details: { field: 'value' },
        },
        timestamp: new Date().toISOString(),
      };

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe('ERROR_CODE');
      expect(response.error?.message).toBe('Error occurred');
      expect(response.error?.details).toEqual({ field: 'value' });
    });

    it('allows optional details in error', () => {
      const response: ApiResponse<string> = {
        success: false,
        error: {
          code: 'ERROR_CODE',
          message: 'Error occurred',
        },
        timestamp: new Date().toISOString(),
      };

      expect(response.error?.details).toBeUndefined();
    });

    it('allows object data type', () => {
      interface TestData {
        id: number;
        name: string;
      }

      const response: ApiResponse<TestData> = {
        success: true,
        data: { id: 1, name: 'test' },
        timestamp: new Date().toISOString(),
      };

      expect(response.data).toEqual({ id: 1, name: 'test' });
    });

    it('allows array data type', () => {
      const response: ApiResponse<number[]> = {
        success: true,
        data: [1, 2, 3],
        timestamp: new Date().toISOString(),
      };

      expect(response.data).toEqual([1, 2, 3]);
    });

    it('handles ISO timestamp format', () => {
      const timestamp = new Date().toISOString();
      const response: ApiResponse<string> = {
        success: true,
        data: 'test',
        timestamp,
      };

      expect(() => new Date(response.timestamp)).not.toThrow();
    });

    it('allows data to be omitted in error response', () => {
      const response: ApiResponse<string> = {
        success: false,
        error: {
          code: 'ERROR_CODE',
          message: 'Error occurred',
        },
        timestamp: new Date().toISOString(),
      };

      expect(response.data).toBeUndefined();
    });

    it('allows error to be omitted in success response', () => {
      const response: ApiResponse<string> = {
        success: true,
        data: 'test',
        timestamp: new Date().toISOString(),
      };

      expect(response.error).toBeUndefined();
    });
  });

  describe('PaginatedResponse', () => {
    it('creates paginated response', () => {
      const response: PaginatedResponse<string> = {
        data: ['item1', 'item2', 'item3'],
        page: 1,
        limit: 10,
        total: 30,
        totalPages: 3,
      };

      expect(response.data).toHaveLength(3);
      expect(response.page).toBe(1);
      expect(response.limit).toBe(10);
      expect(response.total).toBe(30);
      expect(response.totalPages).toBe(3);
    });

    it('allows object data type', () => {
      interface Item {
        id: number;
        name: string;
      }

      const response: PaginatedResponse<Item> = {
        data: [
          { id: 1, name: 'item1' },
          { id: 2, name: 'item2' },
        ],
        page: 1,
        limit: 10,
        total: 20,
        totalPages: 2,
      };

      expect(response.data[0].id).toBe(1);
    });

    it('handles empty data array', () => {
      const response: PaginatedResponse<string> = {
        data: [],
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      };

      expect(response.data).toHaveLength(0);
      expect(response.totalPages).toBe(0);
    });

    it('handles single page', () => {
      const response: PaginatedResponse<string> = {
        data: ['item1'],
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      };

      expect(response.totalPages).toBe(1);
    });

    it('handles multiple pages', () => {
      const response: PaginatedResponse<string> = {
        data: ['item1'],
        page: 5,
        limit: 10,
        total: 50,
        totalPages: 5,
      };

      expect(response.page).toBe(5);
      expect(response.totalPages).toBe(5);
    });
  });

  describe('WebSocketMessage', () => {
    it('creates WebSocket message', () => {
      const message: WebSocketMessage<string> = {
        type: 'test',
        data: 'test data',
        timestamp: Date.now(),
      };

      expect(message.type).toBe('test');
      expect(message.data).toBe('test data');
      expect(typeof message.timestamp).toBe('number');
    });

    it('includes optional requestId', () => {
      const message: WebSocketMessage<string> = {
        type: 'test',
        data: 'test data',
        timestamp: Date.now(),
        requestId: 'request-123',
      };

      expect(message.requestId).toBe('request-123');
    });

    it('allows object data type', () => {
      const message: WebSocketMessage<{ id: number; value: string }> = {
        type: 'test',
        data: { id: 1, value: 'test' },
        timestamp: Date.now(),
      };

      expect(message.data.id).toBe(1);
    });

    it('allows array data type', () => {
      const message: WebSocketMessage<number[]> = {
        type: 'test',
        data: [1, 2, 3],
        timestamp: Date.now(),
      };

      expect(message.data).toEqual([1, 2, 3]);
    });

    it('handles number timestamp', () => {
      const message: WebSocketMessage<string> = {
        type: 'test',
        data: 'test',
        timestamp: 1234567890,
      };

      expect(message.timestamp).toBe(1234567890);
    });

    it('handles Date.now() timestamp', () => {
      const now = Date.now();
      const message: WebSocketMessage<string> = {
        type: 'test',
        data: 'test',
        timestamp: now,
      };

      expect(message.timestamp).toBe(now);
    });
  });

  describe('ModelConfig', () => {
    it('creates valid model config', () => {
      const config: ModelConfig = {
        id: 'model-1',
        name: 'Test Model',
        type: 'llama',
        parameters: { temperature: 0.7 },
        status: 'idle',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      expect(config.id).toBe('model-1');
      expect(config.name).toBe('Test Model');
      expect(config.type).toBe('llama');
      expect(config.status).toBe('idle');
    });

    it('allows all valid types', () => {
      const types: Array<ModelConfig['type']> = ['llama', 'mistral', 'other'];

      types.forEach((type) => {
        const config: ModelConfig = {
          id: 'model-1',
          name: 'Test Model',
          type,
          parameters: {},
          status: 'idle',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        expect(config.type).toBe(type);
      });
    });

    it('allows all valid statuses', () => {
      const statuses: Array<ModelConfig['status']> = ['idle', 'loading', 'running', 'error'];

      statuses.forEach((status) => {
        const config: ModelConfig = {
          id: 'model-1',
          name: 'Test Model',
          type: 'llama',
          parameters: {},
          status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        expect(config.status).toBe(status);
      });
    });

    it('allows complex parameters object', () => {
      const config: ModelConfig = {
        id: 'model-1',
        name: 'Test Model',
        type: 'llama',
        parameters: {
          temperature: 0.7,
          maxTokens: 2048,
          topP: 0.9,
          frequencyPenalty: 0.5,
          presencePenalty: 0.5,
        },
        status: 'idle',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(config.parameters.temperature).toBe(0.7);
      expect(config.parameters.maxTokens).toBe(2048);
    });

    it('allows empty parameters', () => {
      const config: ModelConfig = {
        id: 'model-1',
        name: 'Test Model',
        type: 'llama',
        parameters: {},
        status: 'idle',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(Object.keys(config.parameters)).toHaveLength(0);
    });

    it('requires ISO date strings', () => {
      const createdAt = new Date().toISOString();
      const updatedAt = new Date().toISOString();

      const config: ModelConfig = {
        id: 'model-1',
        name: 'Test Model',
        type: 'llama',
        parameters: {},
        status: 'idle',
        createdAt,
        updatedAt,
      };

      expect(() => new Date(config.createdAt)).not.toThrow();
      expect(() => new Date(config.updatedAt)).not.toThrow();
    });
  });

  describe('SystemMetrics', () => {
    it('creates valid system metrics', () => {
      const metrics: SystemMetrics = {
        cpuUsage: 45,
        memoryUsage: 60,
        diskUsage: 70,
        activeModels: 3,
        totalRequests: 1000,
        avgResponseTime: 150,
        uptime: 3600,
        timestamp: new Date().toISOString(),
      };

      expect(metrics.cpuUsage).toBe(45);
      expect(metrics.memoryUsage).toBe(60);
      expect(metrics.diskUsage).toBe(70);
    });

    it('includes optional GPU metrics', () => {
      const metrics: SystemMetrics = {
        cpuUsage: 45,
        memoryUsage: 60,
        diskUsage: 70,
        activeModels: 3,
        totalRequests: 1000,
        avgResponseTime: 150,
        uptime: 3600,
        timestamp: new Date().toISOString(),
        gpuUsage: 80,
        gpuMemoryUsage: 50,
        gpuMemoryTotal: 24000,
        gpuMemoryUsed: 12000,
        gpuPowerUsage: 300,
        gpuPowerLimit: 350,
        gpuTemperature: 75,
        gpuName: 'NVIDIA RTX 4090',
      };

      expect(metrics.gpuUsage).toBe(80);
      expect(metrics.gpuMemoryUsage).toBe(50);
      expect(metrics.gpuName).toBe('NVIDIA RTX 4090');
    });

    it('allows metrics without GPU data', () => {
      const metrics: SystemMetrics = {
        cpuUsage: 45,
        memoryUsage: 60,
        diskUsage: 70,
        activeModels: 3,
        totalRequests: 1000,
        avgResponseTime: 150,
        uptime: 3600,
        timestamp: new Date().toISOString(),
      };

      expect(metrics.gpuUsage).toBeUndefined();
      expect(metrics.gpuName).toBeUndefined();
    });

    it('requires percentage values for usage metrics', () => {
      const metrics: SystemMetrics = {
        cpuUsage: 0,
        memoryUsage: 50,
        diskUsage: 100,
        activeModels: 1,
        totalRequests: 0,
        avgResponseTime: 0,
        uptime: 0,
        timestamp: new Date().toISOString(),
      };

      expect(metrics.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.cpuUsage).toBeLessThanOrEqual(100);
    });

    it('requires ISO timestamp', () => {
      const metrics: SystemMetrics = {
        cpuUsage: 45,
        memoryUsage: 60,
        diskUsage: 70,
        activeModels: 3,
        totalRequests: 1000,
        avgResponseTime: 150,
        uptime: 3600,
        timestamp: new Date().toISOString(),
      };

      expect(() => new Date(metrics.timestamp)).not.toThrow();
    });
  });

  describe('LogEntry', () => {
    it('creates valid log entry', () => {
      const entry: LogEntry = {
        id: 'log-123',
        level: 'info',
        message: 'Test message',
        timestamp: new Date().toISOString(),
      };

      expect(entry.id).toBe('log-123');
      expect(entry.level).toBe('info');
      expect(entry.message).toBe('Test message');
    });

    it('allows all valid log levels', () => {
      const levels: Array<LogEntry['level']> = ['info', 'warn', 'error', 'debug'];

      levels.forEach((level) => {
        const entry: LogEntry = {
          id: 'log-123',
          level,
          message: 'Test message',
          timestamp: new Date().toISOString(),
        };

        expect(entry.level).toBe(level);
      });
    });

    it('allows string message', () => {
      const entry: LogEntry = {
        id: 'log-123',
        level: 'info',
        message: 'String message',
        timestamp: new Date().toISOString(),
      };

      expect(typeof entry.message).toBe('string');
    });

    it('allows object message', () => {
      const entry: LogEntry = {
        id: 'log-123',
        level: 'info',
        message: { data: 'value', nested: { key: 'value' } },
        timestamp: new Date().toISOString(),
      };

      expect(typeof entry.message).toBe('object');
    });

    it('includes optional context', () => {
      const entry: LogEntry = {
        id: 'log-123',
        level: 'info',
        message: 'Test message',
        timestamp: new Date().toISOString(),
        context: { userId: 123, sessionId: 'abc' },
      };

      expect(entry.context).toEqual({ userId: 123, sessionId: 'abc' });
    });

    it('allows empty context', () => {
      const entry: LogEntry = {
        id: 'log-123',
        level: 'info',
        message: 'Test message',
        timestamp: new Date().toISOString(),
        context: {},
      };

      expect(Object.keys(entry.context || {})).toHaveLength(0);
    });

    it('requires ISO timestamp', () => {
      const entry: LogEntry = {
        id: 'log-123',
        level: 'info',
        message: 'Test message',
        timestamp: new Date().toISOString(),
      };

      expect(() => new Date(entry.timestamp)).not.toThrow();
    });
  });

  describe('Type guards and validation', () => {
    it('validates ApiResponse structure', () => {
      const response: unknown = {
        success: true,
        data: 'test',
        timestamp: new Date().toISOString(),
      };

      const isValidResponse =
        typeof response === 'object' &&
        response !== null &&
        'success' in response &&
        'timestamp' in response;

      expect(isValidResponse).toBe(true);
    });

    it('validates ModelConfig structure', () => {
      const config: unknown = {
        id: 'model-1',
        name: 'Test Model',
        type: 'llama',
        parameters: {},
        status: 'idle',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const isValidConfig =
        typeof config === 'object' &&
        config !== null &&
        'id' in config &&
        'name' in config &&
        'type' in config &&
        'status' in config;

      expect(isValidConfig).toBe(true);
    });

    it('validates SystemMetrics structure', () => {
      const metrics: unknown = {
        cpuUsage: 45,
        memoryUsage: 60,
        diskUsage: 70,
        activeModels: 3,
        totalRequests: 1000,
        avgResponseTime: 150,
        uptime: 3600,
        timestamp: new Date().toISOString(),
      };

      const isValidMetrics =
        typeof metrics === 'object' &&
        metrics !== null &&
        'cpuUsage' in metrics &&
        'memoryUsage' in metrics &&
        'timestamp' in metrics;

      expect(isValidMetrics).toBe(true);
    });

    it('validates LogEntry structure', () => {
      const entry: unknown = {
        id: 'log-123',
        level: 'info',
        message: 'Test message',
        timestamp: new Date().toISOString(),
      };

      const isValidEntry =
        typeof entry === 'object' &&
        entry !== null &&
        'id' in entry &&
        'level' in entry &&
        'message' in entry &&
        'timestamp' in entry;

      expect(isValidEntry).toBe(true);
    });
  });

  describe('Edge cases and special scenarios', () => {
    it('handles Nullable with complex types', () => {
      interface ComplexType {
        id: number;
        nested: { value: string };
      }

      const value: Nullable<ComplexType> = { id: 1, nested: { value: 'test' } };

      expect(value.nested.value).toBe('test');
    });

    it('handles AsyncReturnType with multiple async functions', () => {
      async function func1(): Promise<number> {
        return 1;
      }

      async function func2(): Promise<string> {
        return 'test';
      }

      type Result1 = AsyncReturnType<typeof func1>;
      type Result2 = AsyncReturnType<typeof func2>;

      const result1: Result1 = 1;
      const result2: Result2 = 'test';

      expect(result1).toBe(1);
      expect(result2).toBe('test');
    });

    it('handles ApiResponse with nested generics', () => {
      const response: ApiResponse<PaginatedResponse<string>> = {
        success: true,
        data: {
          data: ['item1', 'item2'],
          page: 1,
          limit: 10,
          total: 20,
          totalPages: 2,
        },
        timestamp: new Date().toISOString(),
      };

      expect(response.data?.data).toHaveLength(2);
    });

    it('handles WebSocketMessage with complex data', () => {
      interface ComplexData {
        items: Array<{ id: number; value: string }>;
        metadata: { count: number; total: number };
      }

      const message: WebSocketMessage<ComplexData> = {
        type: 'update',
        data: {
          items: [{ id: 1, value: 'test' }],
          metadata: { count: 1, total: 10 },
        },
        timestamp: Date.now(),
      };

      expect(message.data.items[0].id).toBe(1);
    });
  });
});
