import { NextRequest, NextResponse } from 'next/server';
import monitor from '@/lib/monitor';

/**
 * GET /api/monitoring
 * Returns real-time system metrics (CPU, memory, uptime)
 */
export async function GET_monitoring(req: NextRequest) {
  try {
    const metrics = monitor.captureMetrics();
    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error('Error fetching monitoring data:', error);
    return NextResponse.json({ error: 'Failed to fetch monitoring data' }, { status: 500 });
  }
}

/**
 * GET /api/monitoring/history
 * Returns historical system metrics (paged by limit)
 */
export async function GET_monitoring_history(req: NextRequest) {
  try {
    const limitParam = req.nextUrl.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 60;
    const history = monitor.readHistory();
    const limitedHistory = limit > 0 ? history.slice(-limit) : history;
    return NextResponse.json(limitedHistory);
  } catch (error: any) {
    console.error('Error fetching monitoring history:', error);
    return NextResponse.json({ error: 'Failed to fetch monitoring history' }, { status: 500 });
  }
}