import { GET } from '@/app/api/monitoring/history/route';
import { NextResponse } from 'next/server';
import * as fs from 'fs';
import { mockDeep } from 'jest-mock-extended';

// Mock the entire fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  existsSync: jest.fn(),
}));

// Import the mocked fs so we can control its behavior
const mockedFs = require('fs') as jest.Mock;

describe('GET /api/monitoring/history', () => {
  const mockResponse = {
    json: jest.fn(),
    status: jest.fn().mockReturnThis(),
  } as unknown as jest.Mocked<NextResponse>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns history slice when limit is valid and file contains data', async () => {
    // Arrange
    const history = [{ cpuUsage: 42, timestamp: '2023-10-01' }, { cpuUsage: 55, timestamp: '2023-10-02' }];
    mockedFs.readFileSync.mockReturnValue(JSON.stringify(history));
    mockedFs.existsSync.mockReturnValue(true);

    // Act
    const request = {
      nextUrl: {
        searchParams: new URLSearchParams('limit=1'),
      },
    } as any;

    // @ts-ignore – we only need the function body for the test
    const handler = GET(request);
    const response = await handler(mockResponse);

    // Assert
    expect(mockedFs.readFileSync).toHaveBeenCalledWith(expect.any(String), 'utf8');
    expect(JSON.parse).toHaveBeenCalledWith(JSON.stringify(history));
    expect(mockResponse.json).toHaveBeenCalledWith(history.slice(0, 1));
    expect(mockResponse.status).not.toHaveBeenCalled(); // success path
  });

  it('generates fallback data when history file is empty', async () => {
    // Arrange
    mockedFs.readFileSync.mockImplementation(() => {
      throw new Error('File not found');
    });
    mockedFs.existsSync.mockReturnValue(true);
    const generateSpy = jest.spyOn(require('@/app/api/monitoring/history/route'), 'generateMetricsHistory').mockImplementation(() => [{ cpuUsage: 10 }]);

    // Act
    const request = {
      nextUrl: { searchParams: new URLSearchParams('limit=5') },
    } as any;
    const handler = GET(request);
    const response = await handler(mockResponse);

    // Assert
    expect(generateSpy).toHaveBeenCalledWith(5);
    expect(mockResponse.json).toHaveBeenCalledWith([{ cpuUsage: 10 }]);
  });

  it('returns 400 for invalid limit parameter', async () => {
    // Arrange
    const invalidRequest = {
      nextUrl: { searchParams: new URLSearchParams('limit=150') },
    } as any;
    const handler = GET(invalidRequest);
    // Act
    const response = await handler(mockResponse);
    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid limit parameter');
    expect(body.details).toContain('must be an integer between 1 and 100');
  });

  it('handles unexpected errors gracefully', async () => {
    // Arrange
    mockedFs.readFileSync.mockImplementation(() => {
      throw new Error('Unexpected failure');
    });
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const handler = GET({} as any);
    // Act
    const response = await handler(mockResponse);
    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    const body = await response.json();
    expect(body.error).toBe('Internal server error');
    expect(body.details).toContain('Unexpected failure');
    consoleErrorSpy.mockRestore();
  });
});
