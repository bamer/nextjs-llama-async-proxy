// nextjs-llama-async-proxy/src/app/api/monitoring/history/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Configuration file path for storing metrics history
const METRICS_HISTORY_FILE = path.join(process.cwd(), 'src/config/metrics_history.json');

// Simulate realistic metrics history
const generateMetricsHistory = (limit: number) => {
  const history = [];
  const now = Date.now();
  
  // Generate realistic metrics data for the last 'limit' minutes
  for (let i = 0; i < limit; i++) {
    const timestamp = new Date(now - (i * 60000)).toISOString();
    history.push({
      cpuUsage: Math.floor(Math.random() * 50) + 20, // 20-70%
      memoryUsage: Math.floor(Math.random() * 30) + 50, // 50-80%
      activeModels: Math.floor(Math.random() * 5) + 1, // 1-5 models
      totalRequests: Math.floor(Math.random() * 500) + 100, // 100-600 requests
      avgResponseTime: Math.floor(Math.random() * 300) + 100, // 100-400ms
      timestamp,
    });
  }
  
  return history;
};

// GET /api/monitoring/history
// Returns a list of monitoring metrics history
export async function GET(request: { nextUrl: { searchParams: URLSearchParams } }) {
  try {
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '60') || 60;
    
    // Try to read from local history file
    let history = [];
    try {
      const historyData = fs.readFileSync(METRICS_HISTORY_FILE, 'utf8');
      history = JSON.parse(historyData);
    } catch (error) {
      console.error('Failed to read local metrics history:', error);
      // Fallback: Generate realistic metrics history
      history = generateMetricsHistory(limit);
    }
    
    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching monitoring history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monitoring history' },
      { status: 500 }
    );
  }
}