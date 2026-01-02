import type {
  ApiResponse,
  PaginatedResponse,
  WebSocketMessage,
} from '@/types/global';

describe('Global Async Types', () => {
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

    it('allows object and array data types', () => {
      interface TestData {
        id: number;
        name: string;
      }

      const objResponse: ApiResponse<TestData> = {
        success: true,
        data: { id: 1, name: 'test' },
        timestamp: new Date().toISOString(),
      };

      const arrResponse: ApiResponse<number[]> = {
        success: true,
        data: [1, 2, 3],
        timestamp: new Date().toISOString(),
      };

      expect(objResponse.data).toEqual({ id: 1, name: 'test' });
      expect(arrResponse.data).toEqual([1, 2, 3]);
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

    it('handles empty and single page', () => {
      const emptyResponse: PaginatedResponse<string> = {
        data: [],
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      };

      const singleResponse: PaginatedResponse<string> = {
        data: ['item1'],
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      };

      expect(emptyResponse.data).toHaveLength(0);
      expect(emptyResponse.totalPages).toBe(0);
      expect(singleResponse.totalPages).toBe(1);
    });
  });

  describe('WebSocketMessage', () => {
    it('creates WebSocket message with requestId', () => {
      const message: WebSocketMessage<string> = {
        type: 'test',
        data: 'test data',
        timestamp: 1234567890,
        requestId: 'request-123',
      };

      expect(message.type).toBe('test');
      expect(message.data).toBe('test data');
      expect(message.timestamp).toBe(1234567890);
      expect(message.requestId).toBe('request-123');
    });

    it('allows object and array data types', () => {
      const objMessage: WebSocketMessage<{ id: number; value: string }> = {
        type: 'test',
        data: { id: 1, value: 'test' },
        timestamp: Date.now(),
      };

      const arrMessage: WebSocketMessage<number[]> = {
        type: 'test',
        data: [1, 2, 3],
        timestamp: Date.now(),
      };

      expect(objMessage.data.id).toBe(1);
      expect(arrMessage.data).toEqual([1, 2, 3]);
    });
  });
});
