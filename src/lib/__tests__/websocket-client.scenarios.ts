import { WebSocketClient } from '@/lib/websocket-client';

export function describeConstructorScenarios(): void {
  it('should create a new WebSocketClient instance', () => {
    const client = new WebSocketClient();
    expect(client).toBeInstanceOf(WebSocketClient);
  });

  it('should initialize with null socket', () => {
    const client = new WebSocketClient();
    expect((client as any).socket).toBeNull();
    expect((client as any).socketId).toBeNull();
  });
}

export function describeConnectScenarios(
  setupClient: () => WebSocketClient,
  simulateConnectEvent: (client: WebSocketClient) => void,
  simulateMessageEvent: (client: WebSocketClient, eventName: string, data: unknown) => void,
  mockedIo: jest.Mock,
  mockedSocket: any,
  EXPECTED_CONNECTION_OPTIONS: object
) {
  it('should connect to Socket.IO server', () => {
    const client = setupClient();
    client.connect();

    expect(mockedIo).toHaveBeenCalledWith('http://localhost:3000', EXPECTED_CONNECTION_OPTIONS);
  });

  it('should not connect if already connected', () => {
    const client = setupClient();
    mockedSocket.connected = true;
    (client as any).socket = mockedSocket;

    client.connect();

    expect(mockedIo).not.toHaveBeenCalled();
  });

  it('should handle connect event', () => {
    const client = setupClient();
    const connectCallback = jest.fn();
    client.on('connect', connectCallback);

    client.connect();
    simulateConnectEvent(client);

    expect(connectCallback).toHaveBeenCalled();
    expect((client as any).socketId).toBe('test-socket-id');
  });

  it('should handle message events', () => {
    const client = setupClient();
    const messageCallback = jest.fn();
    client.on('message', messageCallback);

    client.connect();
    simulateMessageEvent(client, 'message', { type: 'test', data: 'test-data' });

    expect(messageCallback).toHaveBeenCalledWith({
      type: 'test',
      data: 'test-data',
    });
  });

  it('should handle connection message and set socketId', () => {
    const client = setupClient();
    client.connect();

    simulateMessageEvent(client, 'message', {
      type: 'connection',
      clientId: 'custom-client-id',
    });

    expect((client as any).socketId).toBe('custom-client-id');
  });

  it('should handle metrics events', () => {
    const client = setupClient();
    const messageCallback = jest.fn();
    client.on('message', messageCallback);

    client.connect();
    simulateMessageEvent(client, 'metrics', { data: { cpu: 50, memory: 60 } });

    expect(messageCallback).toHaveBeenCalledWith({
      type: 'metrics',
      data: { cpu: 50, memory: 60 },
    });
  });

  it('should handle models events', () => {
    const client = setupClient();
    const messageCallback = jest.fn();
    client.on('message', messageCallback);

    client.connect();
    simulateMessageEvent(client, 'models', { data: [{ id: '1', name: 'model-1' }] });

    expect(messageCallback).toHaveBeenCalledWith({
      type: 'models',
      data: [{ id: '1', name: 'model-1' }],
    });
  });

  it('should handle logs events', () => {
    const client = setupClient();
    const messageCallback = jest.fn();
    client.on('message', messageCallback);

    client.connect();
    simulateMessageEvent(client, 'logs', { data: [{ id: '1', message: 'log-entry' }] });

    expect(messageCallback).toHaveBeenCalledWith({
      type: 'logs',
      data: [{ id: '1', message: 'log-entry' }],
    });
  });

  it('should handle log events', () => {
    const client = setupClient();
    const messageCallback = jest.fn();
    client.on('message', messageCallback);

    client.connect();
    simulateMessageEvent(client, 'log', { data: { id: '1', message: 'single-log' } });

    expect(messageCallback).toHaveBeenCalledWith({
      type: 'log',
      data: { id: '1', message: 'single-log' },
    });
  });

  it('should handle connect_error events', () => {
    const client = setupClient();
    const errorCallback = jest.fn();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    client.on('connect_error', errorCallback);
    client.connect();

    const onMock = mockedSocket.on as jest.Mock;
    const errorHandler = onMock.mock.calls.find(
      (call) => call[0] === 'connect_error'
    )?.[1];

    if (errorHandler) {
      errorHandler(new Error('Connection failed'));
    }

    expect(errorCallback).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Socket.IO connection error:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('should handle disconnect events', () => {
    const client = setupClient();
    const disconnectCallback = jest.fn();
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    client.on('disconnect', disconnectCallback);
    client.connect();

    const onMock = mockedSocket.on as jest.Mock;
    const disconnectHandler = onMock.mock.calls.find(
      (call) => call[0] === 'disconnect'
    )?.[1];

    if (disconnectHandler) {
      disconnectHandler('io server disconnect');
    }

    expect(disconnectCallback).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Socket.IO disconnected:',
      'io server disconnect'
    );

    consoleLogSpy.mockRestore();
  });

  it('should handle connection errors during socket creation', () => {
    mockedIo.mockImplementation(() => {
      throw new Error('Socket creation failed');
    });

    const client = setupClient();
    const errorCallback = jest.fn();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    client.on('connect_error', errorCallback);
    client.connect();

    expect(errorCallback).toHaveBeenCalledWith(expect.any(Error));
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to create Socket.IO connection:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('should use window.location.origin when available', () => {
    (global as any).window = {
      location: {
        origin: 'https://example.com',
      },
    };

    const client = setupClient();
    client.connect();

    expect(mockedIo).toHaveBeenCalledWith('https://example.com', expect.any(Object));
  });

  it('should use default URL when window is not available', () => {
    (global as any).window = undefined;

    const client = setupClient();
    client.connect();

    expect(mockedIo).toHaveBeenCalledWith('http://localhost:3000', expect.any(Object));
  });
}

export function describeDisconnectScenarios(setupClient: () => WebSocketClient, mockedSocket: any) {
  it('should disconnect the socket', () => {
    const client = setupClient();
    (client as any).socket = mockedSocket;

    client.disconnect();

    expect(mockedSocket.disconnect).toHaveBeenCalled();
    expect((client as any).socket).toBeNull();
  });

  it('should do nothing if socket is null', () => {
    const client = setupClient();
    client.disconnect();

    expect(mockedSocket.disconnect).not.toHaveBeenCalled();
  });
}

export function describeSendMessageScenarios(setupConnectedClient: () => WebSocketClient, mockedSocket: any) {
  it('should send message when connected', () => {
    const client = setupConnectedClient();
    client.sendMessage('testEvent', { data: 'test' });

    expect(mockedSocket.emit).toHaveBeenCalledWith('testEvent', { data: 'test' });
  });

  it('should not send message when not connected', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const client = setupConnectedClient();
    mockedSocket.connected = false;

    client.sendMessage('testEvent', { data: 'test' });

    expect(mockedSocket.emit).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith('Socket.IO is not connected');

    consoleWarnSpy.mockRestore();
  });

  it('should send message without data', () => {
    const client = setupConnectedClient();
    client.sendMessage('testEvent');

    expect(mockedSocket.emit).toHaveBeenCalledWith('testEvent', undefined);
  });
}

export function describeRequestMethodsScenarios(setupConnectedClient: () => WebSocketClient, mockedSocket: any) {
  it('should request metrics', () => {
    const client = setupConnectedClient();
    client.requestMetrics();

    expect(mockedSocket.emit).toHaveBeenCalledWith('requestMetrics');
  });

  it('should request logs', () => {
    const client = setupConnectedClient();
    client.requestLogs();

    expect(mockedSocket.emit).toHaveBeenCalledWith('requestLogs');
  });

  it('should request models', () => {
    const client = setupConnectedClient();
    client.requestModels();

    expect(mockedSocket.emit).toHaveBeenCalledWith('requestModels');
  });

  it('should request llama status', () => {
    const client = setupConnectedClient();
    client.requestLlamaStatus();

    expect(mockedSocket.emit).toHaveBeenCalledWith('requestLlamaStatus');
  });

  it('should rescan models', () => {
    const client = setupConnectedClient();
    client.rescanModels();

    expect(mockedSocket.emit).toHaveBeenCalledWith('rescanModels');
  });

  it('should start model', () => {
    const client = setupConnectedClient();
    client.startModel('model-123');

    expect(mockedSocket.emit).toHaveBeenCalledWith('startModel', {
      modelId: 'model-123',
    });
  });

  it('should stop model', () => {
    const client = setupConnectedClient();
    client.stopModel('model-123');

    expect(mockedSocket.emit).toHaveBeenCalledWith('stopModel', {
      modelId: 'model-123',
    });
  });
}

export function describeGetConnectionStateScenarios(setupClient: () => WebSocketClient, mockedSocket: any) {
  it('should return connected when socket is connected', () => {
    const client = setupClient();
    mockedSocket.connected = true;
    (client as any).socket = mockedSocket;

    const state = client.getConnectionState();

    expect(state).toBe('connected');
  });

  it('should return disconnected when socket is not connected', () => {
    const client = setupClient();
    mockedSocket.connected = false;
    (client as any).socket = mockedSocket;

    const state = client.getConnectionState();

    expect(state).toBe('disconnected');
  });

  it('should return disconnected when socket is null', () => {
    const client = setupClient();
    const state = client.getConnectionState();

    expect(state).toBe('disconnected');
  });
}

export function describeGetSocketIdScenarios(setupClient: () => WebSocketClient) {
  it('should return socketId when set', () => {
    const client = setupClient();
    (client as any).socketId = 'test-id-123';

    const socketId = client.getSocketId();

    expect(socketId).toBe('test-id-123');
  });

  it('should return null when socketId is not set', () => {
    const client = setupClient();
    const socketId = client.getSocketId();

    expect(socketId).toBeNull();
  });
}

export function describeGetSocketScenarios(setupClient: () => WebSocketClient, mockedSocket: any) {
  it('should return socket instance', () => {
    const client = setupClient();
    (client as any).socket = mockedSocket;

    const socket = client.getSocket();

    expect(socket).toBe(mockedSocket);
  });

  it('should return null when socket is not set', () => {
    const client = setupClient();
    const socket = client.getSocket();

    expect(socket).toBeNull();
  });
}

export function describeSingletonScenarios() {
  const { websocketServer } = require('@/lib/websocket-client');

  it('should export a singleton WebSocketClient instance', () => {
    expect(websocketServer).toBeInstanceOf(WebSocketClient);
  });

  it('should be the same instance across multiple imports', () => {
    const websocketServer2 = require('@/lib/websocket-client').websocketServer;

    expect(websocketServer).toBe(websocketServer2);
  });
}
