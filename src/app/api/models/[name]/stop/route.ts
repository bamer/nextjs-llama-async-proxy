import { NextResponse } from 'next/server';
import { stopModel } from '@/lib/ollama';

interface ModelStopResponse {
  success: boolean;
  modelName: string;
  message?: string;
  error?: string;
}

export async function POST(request: { nextUrl: { pathname: string } }) {
  try {
    const pathname = request.nextUrl.pathname;
    const segments = pathname.split('/');
    const rawModelName = segments[segments.length - 2];

    if (!rawModelName) {
      return NextResponse.json(
        { success: false, error: 'Model name is required' },
        { status: 400 }
      );
    }

    // Use the real Ollama client to stop the model
    const result = await stopModel(rawModelName);
    return NextResponse.json({
      success: true,
      modelName: rawModelName,
      ...result,
    } as ModelStopResponse);
  } catch (error: any) {
    console.error('Error stopping model:', error);
    return NextResponse.json(
      {
        success: false,
        modelName: rawModelName || 'unknown',
        error: 'Failed to execute stop command',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET is not supported for stopping models
export async function GET() {
  return NextResponse.json(
    { error: 'Only POST method is supported for stopping models' },
    { status: 405 }
  );
}
