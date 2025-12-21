import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      websocket: {
        connected: true,
        clients: 0,
        uptime: process.uptime(),
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.error('Error fetching websocket status:', error);
    return NextResponse.json({ error: 'Failed to fetch websocket status' }, { status: 500 });
  }
}
