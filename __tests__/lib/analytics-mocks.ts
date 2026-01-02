import fs from 'fs';

jest.mock('@/lib/monitor');
jest.mock('fs');

export const mockedFsPromises = {
  access: jest.fn(),
  readdir: jest.fn(),
  stat: jest.fn(),
} as any;

(fs as any).promises = mockedFsPromises;

// Helper to reset fs mocks to default state
export function resetFsMocks() {
  mockedFsPromises.access.mockReset();
  mockedFsPromises.readdir.mockReset();
  mockedFsPromises.stat.mockReset();
}
