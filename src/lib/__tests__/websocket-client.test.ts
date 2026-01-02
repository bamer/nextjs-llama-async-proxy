import { WebSocketClient, websocketServer } from '@/lib/websocket-client';
import {
  setupClient,
  setupConnectedClient,
  getSocketMock,
  getIoMock,
  simulateConnectEvent,
  simulateMessageEvent,
  EXPECTED_CONNECTION_OPTIONS,
} from './websocket-client.utils';
import {
  describeConstructorScenarios,
  describeConnectScenarios,
  describeDisconnectScenarios,
  describeSendMessageScenarios,
  describeRequestMethodsScenarios,
  describeGetConnectionStateScenarios,
  describeGetSocketIdScenarios,
  describeGetSocketScenarios,
  describeSingletonScenarios,
} from './websocket-client.scenarios';

describe('websocket-client', () => {
  let client: WebSocketClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = setupClient();
  });

  describe('constructor', () => {
    describeConstructorScenarios();
  });

  describe('connect', () => {
    describeConnectScenarios(
      () => client,
      simulateConnectEvent,
      simulateMessageEvent,
      getIoMock(),
      getSocketMock(),
      EXPECTED_CONNECTION_OPTIONS
    );
  });

  describe('disconnect', () => {
    describeDisconnectScenarios(() => client, getSocketMock());
  });

  describe('sendMessage', () => {
    beforeEach(() => {
      client = setupConnectedClient();
    });

    describeSendMessageScenarios(() => client, getSocketMock());
  });

  describe('request methods', () => {
    beforeEach(() => {
      client = setupConnectedClient();
    });

    describeRequestMethodsScenarios(() => client, getSocketMock());
  });

  describe('getConnectionState', () => {
    describeGetConnectionStateScenarios(() => client, getSocketMock());
  });

  describe('getSocketId', () => {
    describeGetSocketIdScenarios(() => client);
  });

  describe('getSocket', () => {
    describeGetSocketScenarios(() => client, getSocketMock());
  });

  describe('websocketServer singleton', () => {
    describeSingletonScenarios();
  });
});
