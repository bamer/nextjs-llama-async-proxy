// nextjs-llama-async-proxy/src/app/api/models/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MODELS_CONFIG_FILE = path.join(process.cwd(), 'src/config/models_config.json');

// Mock models data
const mockModels = [
  { name: 'llama-2-7b-chat', description: 'Chat model for Llama 2', status: 'running', version: '2.0' },
  { name: 'llama-3-8b', description: 'Base language model', status: 'stopped', version: '3.0' },
  { name: 'gpt-3.5-turbo', description: 'OpenAI GPT-3.5 model', status: 'running', version: '1.0' },
  { name: 'mistral-7b', description: 'Mistral model', status: 'stopped', version: '2.1' }
];

export async function GET() {
  try {
    // Try to read from config file
    let models = mockModels;
    try {
      const configData = fs.readFileSync(MODELS_CONFIG_FILE, 'utf8');
      const config = JSON.parse(configData);
      if (config.models && Object.keys(config.models).length > 0) {
        models = Object.entries(config.models).map(([name, modelConfig]: [string, any]) => ({
          name,
          description: modelConfig.description || 'No description',
          status: modelConfig.status || 'stopped',
          version: modelConfig.version || '1.0',
          path: modelConfig.path
        }));
      }
    } catch (error) {
      // Use mock data if config file doesn't exist or is invalid
      console.log('Using mock models data');
    }

    return NextResponse.json({
      count: models.length,
      models
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { models: newModels } = await request.json();

    if (!Array.isArray(newModels)) {
      return NextResponse.json({ error: 'Models must be an array' }, { status: 400 });
    }

    // Read current config
    let config: { models: Record<string, any> } = { models: {} };
    try {
      const configData = fs.readFileSync(MODELS_CONFIG_FILE, 'utf8');
      config = JSON.parse(configData);
    } catch {
      // Config doesn't exist, use default
    }

    // Add new models
    for (const model of newModels) {
      config.models[model.name] = {
        ...model,
        status: 'stopped',
        registered: new Date().toISOString()
      };
    }

    // Write back to file
    fs.writeFileSync(MODELS_CONFIG_FILE, JSON.stringify(config, null, 2));

    return NextResponse.json({
      message: 'Models registered successfully',
      registered: newModels.length
    });
  } catch (error) {
    console.error('Error registering models:', error);
    return NextResponse.json({ error: 'Failed to register models' }, { status: 500 });
  }
}