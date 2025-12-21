import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Return mock models data for now
    return NextResponse.json({
      models: [
        { name: 'llama2', status: 'running', size: '7B' },
        { name: 'mistral', status: 'stopped', size: '7B' },
      ],
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ success: true, data: body });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
