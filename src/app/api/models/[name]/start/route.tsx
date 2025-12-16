// nextjs-llama-async-proxy/src/app/api/models/[name]/start/route.ts
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ModelStartResponse {
  success: boolean;
  modelName: string;
  message?: string;
  error?: string;
}

export async function POST(request: { nextUrl: { pathname: string } }) {
  try {
    const modelName = request.nextUrl.pathname.split('/').pop() || '';
    
    if (!modelName) {
      return NextResponse.json(
        { success: false, error: 'Model name is required' },
        { status: 400 }
      );
    }
    
    // Execute command to start the model (e.g., ollama run)
    const { stdout, stderr } = await execAsync(`ollama run ${modelName}`);
    
    if (stderr && stderr.includes('error')) {
      return NextResponse.json(
        { 
          success: false,
          modelName,
          error: stderr || 'Failed to start model'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      modelName,
      message: 'Model started successfully',
    } as ModelStartResponse);
  } catch (error) {
    console.error('Error starting model:', error);
    return NextResponse.json(
      { 
        success: false,
        modelName: modelName || 'unknown',
        error: 'Failed to execute command: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}

// GET /api/models/[name]/start
// Returns the status of the model start request
export async function GET(request: { nextUrl: { pathname: string } }) {
  return NextResponse.json(
    { error: 'Only POST method is supported for starting models' },
    { status: 405 }
  );
}