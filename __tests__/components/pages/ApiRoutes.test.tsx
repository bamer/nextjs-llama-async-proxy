/**
 * Unit tests for ApiRoutes component functions
 */

import { NextRequest } from 'next/server';
import { GET_monitoring, GET_monitoring_history } from '../../../src/components/pages/ApiRoutes';

// Mock the monitor module
jest.mock('@/lib/monitor', () => ({
  captureMetrics: jest.fn(),
  readHistory: jest.fn(),
}));

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      data,
      status: options?.status || 200,
    })),
  },
}));

describe('ApiRoutes', () => {
  const mockMonitor = require('@/lib/monitor');
  const mockNextResponse = require('next/server').NextResponse;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET_monitoring', () => {
    it('should return monitoring metrics successfully', async () => {
      const mockMetrics = {
        cpu: 45,
        memory: 60,
        uptime: 3600,
      };

      mockMonitor.captureMetrics.mockReturnValue(mockMetrics);
      mockNextResponse.json.mockReturnValue({ data: mockMetrics });

      const result = await GET_monitoring();

      expect(mockMonitor.captureMetrics).toHaveBeenCalledTimes(1);
      expect(mockNextResponse.json).toHaveBeenCalledWith(mockMetrics);
      expect(result).toEqual({ data: mockMetrics });
    });

    it('should handle errors and return 500 status', async () => {
      const mockError = new Error('Failed to capture metrics');
      mockMonitor.captureMetrics.mockImplementation(() => {
        throw mockError;
      });

      const errorResponse = { error: 'Failed to fetch monitoring data', status: 500 };
      mockNextResponse.json.mockReturnValue(errorResponse);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await GET_monitoring();

      expect(mockMonitor.captureMetrics).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching monitoring data:', mockError);
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: 'Failed to fetch monitoring data' },
        { status: 500 }
      );
      expect(result).toEqual(errorResponse);

      consoleSpy.mockRestore();
    });

    it('should handle non-Error exceptions', async () => {
      mockMonitor.captureMetrics.mockImplementation(() => {
        throw 'String error';
      });

      const errorResponse = { error: 'Failed to fetch monitoring data', status: 500 };
      mockNextResponse.json.mockReturnValue(errorResponse);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await GET_monitoring();

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching monitoring data:', 'String error');
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: 'Failed to fetch monitoring data' },
        { status: 500 }
      );

      consoleSpy.mockRestore();
    });
  });

  describe('GET_monitoring_history', () => {
    it('should return monitoring history with default limit', async () => {
      const mockHistory = [
        { timestamp: '2023-01-01T00:00:00.000Z', cpu: 45 },
        { timestamp: '2023-01-01T00:00:30.000Z', cpu: 50 },
        { timestamp: '2023-01-01T00:01:00.000Z', cpu: 55 },
      ];

      mockMonitor.readHistory.mockReturnValue(mockHistory);
      mockNextResponse.json.mockReturnValue({ data: mockHistory });

      const mockReq = {
        nextUrl: {
          searchParams: new URLSearchParams(),
        },
      } as NextRequest;

      const result = await GET_monitoring_history(mockReq);

      expect(mockMonitor.readHistory).toHaveBeenCalledTimes(1);
      expect(mockNextResponse.json).toHaveBeenCalledWith(mockHistory);
      expect(result).toEqual({ data: mockHistory });
    });

    it('should return monitoring history with custom limit', async () => {
      const mockHistory = Array.from({ length: 100 }, (_, i) => ({
        timestamp: `2023-01-01T00:${i.toString().padStart(2, '0')}:00.000Z`,
        cpu: 40 + i,
      }));

      mockMonitor.readHistory.mockReturnValue(mockHistory);
      mockNextResponse.json.mockReturnValue({ data: mockHistory.slice(-10) });

      const mockReq = {
        nextUrl: {
          searchParams: new URLSearchParams('limit=10'),
        },
      } as NextRequest;

      const result = await GET_monitoring_history(mockReq);

      expect(mockMonitor.readHistory).toHaveBeenCalledTimes(1);
      expect(mockNextResponse.json).toHaveBeenCalledWith(mockHistory.slice(-10));
      expect(result).toEqual({ data: mockHistory.slice(-10) });
    });

    it('should handle invalid limit parameter', async () => {
      const mockHistory = [
        { timestamp: '2023-01-01T00:00:00.000Z', cpu: 45 },
        { timestamp: '2023-01-01T00:00:30.000Z', cpu: 50 },
      ];

      mockMonitor.readHistory.mockReturnValue(mockHistory);
      mockNextResponse.json.mockReturnValue({ data: mockHistory });

      const mockReq = {
        nextUrl: {
          searchParams: new URLSearchParams('limit=invalid'),
        },
      } as NextRequest;

      const result = await GET_monitoring_history(mockReq);

      // parseInt('invalid', 10) returns NaN, so limit becomes 60 (default)
      expect(mockMonitor.readHistory).toHaveBeenCalledTimes(1);
      expect(mockNextResponse.json).toHaveBeenCalledWith(mockHistory);
    });

    it('should return all history when limit is 0', async () => {
      const mockHistory = [
        { timestamp: '2023-01-01T00:00:00.000Z', cpu: 45 },
        { timestamp: '2023-01-01T00:00:30.000Z', cpu: 50 },
      ];

      mockMonitor.readHistory.mockReturnValue(mockHistory);
      mockNextResponse.json.mockReturnValue({ data: mockHistory });

      const mockReq = {
        nextUrl: {
          searchParams: new URLSearchParams('limit=0'),
        },
      } as NextRequest;

      const result = await GET_monitoring_history(mockReq);

      expect(mockMonitor.readHistory).toHaveBeenCalledTimes(1);
      expect(mockNextResponse.json).toHaveBeenCalledWith(mockHistory);
    });

    it('should handle errors and return 500 status', async () => {
      const mockError = new Error('Failed to read history');
      mockMonitor.readHistory.mockImplementation(() => {
        throw mockError;
      });

      const errorResponse = { error: 'Failed to fetch monitoring history', status: 500 };
      mockNextResponse.json.mockReturnValue(errorResponse);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockReq = {
        nextUrl: {
          searchParams: new URLSearchParams(),
        },
      } as NextRequest;

      const result = await GET_monitoring_history(mockReq);

      expect(mockMonitor.readHistory).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching monitoring history:', mockError);
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: 'Failed to fetch monitoring history' },
        { status: 500 }
      );
      expect(result).toEqual(errorResponse);

      consoleSpy.mockRestore();
    });
  });
});