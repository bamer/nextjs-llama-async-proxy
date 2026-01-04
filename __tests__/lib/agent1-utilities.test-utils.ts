import { renderHook, waitFor } from "@testing-library/react";
import { readHistory, writeHistory, captureMetrics, startPeriodicRecording, monitor } from '@/lib/monitor';
import { useSystemMetrics } from '@/hooks/useSystemMetrics';
import fs from 'fs';
import path from 'path';
import os from 'os';

jest.mock('fs');

export const mockedFs = fs as jest.Mocked<typeof fs>;

export const createMockHistory = () => [
  { cpuUsage: 50, memoryUsage: 60, timestamp: '2024-01-01T00:00:00Z', id: 1 },
  { cpuUsage: 55, memoryUsage: 65, timestamp: '2024-01-01T00:00:30Z', id: 2 },
];

export const createMockMetrics = () => ({
  cpuUsage: 50,
  memoryUsage: 60,
  memoryUsed: 8000000000,
  memoryTotal: 16000000000,
  uptime: 86400,
  cpuCores: 4,
  timestamp: 1704067200000,
});

export const setupFsMocks = () => {
  mockedFs.existsSync.mockReturnValue(false);
  mockedFs.readFileSync.mockReturnValue('[]');
  mockedFs.writeFileSync.mockImplementation(() => undefined);
  mockedFs.renameSync.mockImplementation(() => undefined);
};
