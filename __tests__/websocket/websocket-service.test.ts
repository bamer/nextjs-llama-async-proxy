/**
 * WebSocket Service Tests
 * 
 * Tests for the WebSocket service functionality
 * Demonstrates how to test real-time features without authentication
 */

import { websocketService } from '../../src/services/websocket-service';
import { useStore } from '../../src/lib/store';

// Mock the Socket.IO client
jest.mock('socket.io-client', () => ({
  io: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
    id: 'test-socket-id'
  })),
}));

describe('WebSocketService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Reset the websocket service
    websocketService.disconnect();
  });

  describe('Connection Management', () => {
    it('should connect to WebSocket server', () => {
      const connectSpy = jest.spyOn(websocketService, 'connect');
      
      websocketService.connect();
      
      expect(connectSpy).toHaveBeenCalled();
      expect(websocketService.isConnected()).toBe(true);
    });

    it('should handle multiple connection attempts', () => {
      websocketService.connect(); // First connection
      websocketService.connect(); // Second connection (should be ignored)
      
      // Should still be connected
      expect(websocketService.isConnected()).toBe(true);
    });

    it('should disconnect from WebSocket server', () => {
      websocketService.connect();
      expect(websocketService.isConnected()).toBe(true);
      
      const disconnectSpy = jest.spyOn(websocketService, 'disconnect');
      websocketService.disconnect();
      
      expect(disconnectSpy).toHaveBeenCalled();
      expect(websocketService.isConnected()).toBe(false);
    });
  });

  describe('Message Handling', () => {
    it('should send messages when connected', () => {
      websocketService.connect();
      
      const emitSpy = jest.fn();
      // Mock the socket emit method
      const mockSocket = {
        emit: emitSpy,
        connected: true
      };
      // @ts-ignore - override private property for testing
      websocketService['socket'] = mockSocket;
      
      websocketService.sendMessage('testEvent', { data: 'test' });
      
      expect(emitSpy).toHaveBeenCalledWith('testEvent', expect.objectContaining({
        type: 'testEvent',
        data: { data: 'test' }
      }));
    });

    it('should not send messages when disconnected', () => {
      // Ensure disconnected state
      websocketService.disconnect();
      
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      websocketService.sendMessage('testEvent', { data: 'test' });
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'WebSocket not connected, cannot send message'
      );
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Data Request Methods', () => {
    it('should request metrics', () => {
      const sendMessageSpy = jest.spyOn(websocketService, 'sendMessage');
      
      websocketService.connect();
      websocketService.requestMetrics();
      
      expect(sendMessageSpy).toHaveBeenCalledWith('getMetrics');
    });

    it('should request logs', () => {
      const sendMessageSpy = jest.spyOn(websocketService, 'sendMessage');
      
      websocketService.connect();
      websocketService.requestLogs();
      
      expect(sendMessageSpy).toHaveBeenCalledWith('getLogs');
    });

    it('should request models', () => {
      const sendMessageSpy = jest.spyOn(websocketService, 'sendMessage');
      
      websocketService.connect();
      websocketService.requestModels();
      
      expect(sendMessageSpy).toHaveBeenCalledWith('getModels');
    });
  });

  describe('Model Management', () => {
    it('should send start model command', () => {
      const sendMessageSpy = jest.spyOn(websocketService, 'sendMessage');
      
      websocketService.connect();
      websocketService.startModel('test-model-id');
      
      expect(sendMessageSpy).toHaveBeenCalledWith('startModel', {
        modelId: 'test-model-id'
      });
    });

    it('should send stop model command', () => {
      const sendMessageSpy = jest.spyOn(websocketService, 'sendMessage');
      
      websocketService.connect();
      websocketService.stopModel('test-model-id');
      
      expect(sendMessageSpy).toHaveBeenCalledWith('stopModel', {
        modelId: 'test-model-id'
      });
    });

    it('should send update model config command', () => {
      const sendMessageSpy = jest.spyOn(websocketService, 'sendMessage');
      
      websocketService.connect();
      websocketService.updateModelConfig('test-model-id', { 
        temperature: 0.7, 
        maxTokens: 100 
      });
      
      expect(sendMessageSpy).toHaveBeenCalledWith('updateModelConfig', {
        modelId: 'test-model-id',
        config: { temperature: 0.7, maxTokens: 100 }
      });
    });
  });

  describe('Event Listener Management', () => {
    it('should add event listeners', () => {
      const testCallback = jest.fn();
      
      websocketService.on('testEvent', testCallback);
      
      // Trigger the event (simulating internal triggerEvent call)
      // @ts-ignore - access private method for testing
      websocketService['triggerEvent']('testEvent', { data: 'test' });
      
      expect(testCallback).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should remove event listeners', () => {
      const testCallback = jest.fn();
      
      // Add listener
      websocketService.on('testEvent', testCallback);
      
      // Remove listener
      websocketService.off('testEvent', testCallback);
      
      // Trigger the event
      // @ts-ignore - access private method for testing
      websocketService['triggerEvent']('testEvent', { data: 'test' });
      
      // Callback should not be called
      expect(testCallback).not.toHaveBeenCalled();
    });
  });

  describe('Connection State', () => {
    it('should return correct connection state', () => {
      expect(websocketService.isConnected()).toBe(false);
      
      websocketService.connect();
      expect(websocketService.isConnected()).toBe(true);
      
      websocketService.disconnect();
      expect(websocketService.isConnected()).toBe(false);
    });

    it('should return socket ID when connected', () => {
      websocketService.connect();
      
      const socketId = websocketService.getSocketId();
      expect(socketId).toBeDefined();
      expect(typeof socketId).toBe('string');
    });

    it('should return undefined socket ID when disconnected', () => {
      websocketService.disconnect();
      
      const socketId = websocketService.getSocketId();
      expect(socketId).toBeUndefined();
    });
  });
});

/**
 * Integration Test Example
 * 
 * This shows how to test the WebSocket service in a more realistic scenario
 */
describe('WebSocketService Integration', () => {
  it('should handle complete connection lifecycle', () => {
    // Connect
    websocketService.connect();
    expect(websocketService.isConnected()).toBe(true);
    
    // Request data
    const sendMessageSpy = jest.spyOn(websocketService, 'sendMessage');
    websocketService.requestMetrics();
    expect(sendMessageSpy).toHaveBeenCalledWith('getMetrics');
    
    // Disconnect
    websocketService.disconnect();
    expect(websocketService.isConnected()).toBe(false);
  });

  it('should manage multiple data requests', () => {
    websocketService.connect();
    
    const sendMessageSpy = jest.spyOn(websocketService, 'sendMessage');
    
    // Make multiple requests
    websocketService.requestMetrics();
    websocketService.requestLogs();
    websocketService.requestModels();
    
    // Verify all requests were sent
    expect(sendMessageSpy).toHaveBeenCalledTimes(3);
    expect(sendMessageSpy).toHaveBeenCalledWith('getMetrics');
    expect(sendMessageSpy).toHaveBeenCalledWith('getLogs');
    expect(sendMessageSpy).toHaveBeenCalledWith('getModels');
  });
});