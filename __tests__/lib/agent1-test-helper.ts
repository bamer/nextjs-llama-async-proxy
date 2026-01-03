/**
 * AGENT 1: Test Setup Helper
 * ========================================
 * Purpose: Shared test setup utilities for agent1 tests
 */

import { ProcessManager } from '@/lib/process-manager';
import { WebSocketClient } from '@/lib/websocket-client';
import { io, Socket } from 'socket.io-client';
import { spawn } from 'child_process';
import { resolveBinary, binaryExists } from '@/lib/binary-lookup';

jest.mock('child_process');
jest.mock('@/lib/binary-lookup');
jest.mock('socket.io-client');

export const mockedSpawn = spawn as jest.MockedFunction<typeof spawn>;
export const mockedResolveBinary = resolveBinary as jest.MockedFunction<typeof resolveBinary>;
export const mockedBinaryExists = binaryExists as jest.MockedFunction<typeof binaryExists>;
export const mockedIo = io as jest.MockedFunction<typeof io>;

export function createMockedSocket(): jest.Mocked<Socket> {
  return {
    connected: false,
    id: 'test-socket-id',
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  } as unknown as jest.Mocked<Socket>;
}

export function resetProcessManager(): void {
  ProcessManager._reset();
}

export function setupDefaultMocks(): void {
  mockedBinaryExists.mockResolvedValue(true);
  mockedResolveBinary.mockReturnValue('/path/to/model.bin');
}

export function setupWindowLocation(): void {
  (global as any).window = {
    location: { origin: 'http://localhost:3000' },
  };
}
