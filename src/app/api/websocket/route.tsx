import { NextRequest, NextResponse } from 'next/server';
import { captureMetrics } from '@/lib/monitor';
import { ProcessManagerAPI } from '@/lib/process-manager';

interface LogMessage {
  level: string;
  message: string;
  timestamp: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'status':
      return NextResponse.json({
        connected: true,
        clients: 1,
        uptime: process.uptime(),
        timestamp: Date.now()
      });

    case 'metrics':
      const systemMetrics = captureMetrics();
      const activeModels = Object.keys(ProcessManagerAPI.getInfo ? {} : {}).length;

      return NextResponse.json({
        type: 'metrics',
        data: {
          activeModels,
          totalRequests: 0,
          avgResponseTime: 0,
          memoryUsage: systemMetrics.memoryUsage,
          cpuUsage: systemMetrics.cpuUsage,
          lastUpdated: new Date().toISOString()
        },
        timestamp: Date.now()
      });

    case 'logs':
      const mockLog: LogMessage = {
        level: 'info',
        message: 'WebSocket endpoint started',
        timestamp: Date.now() - 1000
      };

      return NextResponse.json({
        type: 'logs',
        data: [mockLog],
        timestamp: Date.now()
      });

    default:
      return NextResponse.json({
        message: 'WebSocket endpoint available',
        features: [
          'real-time metrics updates',
          'model status monitoring',
          'live logs updates',
          'connection management',
          'backend service integration'
        ],
        endpoints: {
          status: '/api/websocket?action=status',
          metrics: '/api/websocket?action=metrics',
          logs: '/api/websocket?action=logs'
        }
      });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('WebSocket message received:', body);
    return NextResponse.json({
      type: 'echo',
      original: body,
      response: 'Message received',
      timestamp: Date.now()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON payload' },
      { status: 400 }
    );
  }
}