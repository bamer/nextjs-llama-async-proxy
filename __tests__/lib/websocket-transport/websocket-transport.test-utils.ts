import { WebSocketTransport } from "@/lib/websocket-transport";
import { Server } from "socket.io";
import winston from "winston";

jest.mock("socket.io");

export const createMockIo = () => ({
  emit: jest.fn(),
} as unknown as jest.Mocked<Server>);

export const createTransport = () => new WebSocketTransport();

export const mockLogInfo = {
  level: "info",
  message: "Test message",
  timestamp: "2024-01-01T00:00:00Z",
};

export const waitForAsync = (callback: () => void) => {
  return new Promise<void>((resolve) => {
    setImmediate(() => {
      callback();
      resolve();
    });
  });
};
