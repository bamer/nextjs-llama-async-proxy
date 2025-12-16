// nextjs-llama-async-proxy/src/app/api/models/[name]/stop/route.ts
import { NextResponse } from 'next/server';

interface ModelStopResponse {
  success: boolean;
  modelName: string;
  message?: string;
  error?: string;
}

export async function POST(request: { nextUrl: { pathname: string } }) {
  const modelName = request.nextUrl.pathname.split('/').pop() || '';
  
  if (!modelName) {
    return NextResponse.json(
      { success: false, error: 'Model name is required' },
      { status: 400 }
    );
  }
  
  try {
    // Simulate stopping the model via backend
    // In a real implementation, this would call:
    // `ollama stop ${modelName}` or interact with the backend API
    return NextResponse.json({
      success: true,
      modelName,
      message: 'Model stop request processed successfully',
    } as ModelStopResponse);
  } catch (error) {
    console.error('Error stopping model:', error);
    return NextResponse.json(
      {
        success: false,
        modelName: modelName || 'unknown',
        error: 'Failed to execute command: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
}

// GET /api/models/[name]/stop
// Returns the status of the model stop request
export async function GET() {
  return NextResponse.json(
    { error: 'Only POST method is supported for stopping models' },
    { status: 405 }
  );
}