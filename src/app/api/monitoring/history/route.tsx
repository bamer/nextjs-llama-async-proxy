// app/api/monitoring/history/route.ts
import { NextRequest } from 'next/server';

// Mock services (these would be properly connected in a real implementation)
let metricsService = {
  getMetricsHistory: (limit: number) => []
};

export async function GET(req: NextRequest) {
  try {
    const limit = req.nextUrl.searchParams.get('limit') ? parseInt(req.nextUrl.searchParams.get('limit')!) : 60;
    const history = metricsService.getMetricsHistory(limit);
    return Response.json(history);
  } catch (error) {
    console.error('Error fetching monitoring history:', error);
    return Response.json({ error: 'Failed to fetch monitoring history' }, { status: 500 });
  }
}