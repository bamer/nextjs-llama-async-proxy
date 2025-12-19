// nextjs-llama-async-proxy/src/app/api/models/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { listModels } from '@/lib/ollama';
import { ProcessManagerAPI } from '@/lib/process-manager';
import { withAuthAndPermission } from '@/lib/auth';
import { Permission } from '@/lib/types';

interface Model {
  name: string;
  description: string;
  status: 'running' | 'stopped' | 'loading';
  version: string;
  path?: string;
}

// Configuration file path
const MODELS_CONFIG_FILE = path.join(process.cwd(), 'src/config/models_config.json');

// Fetch models from a real Ollama backend
const fetchModelsFromBackend = async (): Promise<Model[]> => {
  try {
    // Fetch models from Ollama API
    const modelsData = await listModels();

    // Get running processes from ProcessManager
    const runningModels = new Set(
      Object.keys(ProcessManagerAPI.getInfo ? {} : {}).map(model => model)
    );

    // Convert Ollama's model format to our Model interface
    return modelsData.models.map((model: any) => ({
      name: model.name,
      description: model.description || 'No description provided',
      status: runningModels.has(model.name) ? 'running' : 'stopped',
      version: model.modified_at || '1.0',
      path: model.path
    }));
  } catch (error) {
    console.error('Failed to fetch models from Ollama API:', error);
    // Fallback: Try to read from local config file
    try {
      const configData = fs.readFileSync(MODELS_CONFIG_FILE, 'utf8');
      const config = JSON.parse(configData);

      if (config.models && Object.keys(config.models).length > 0) {
        return Object.entries(config.models).map(([name, modelConfig]: [string, any]) => ({
          name,
          description: modelConfig.description || 'No description',
          status: modelConfig.status || 'stopped',
          version: modelConfig.version || '1.0',
          path: modelConfig.path
        }));
      }
    } catch (configError) {
      console.error('Failed to read local config:', configError);
      return [];
    }
    return [];
  }
};

// GET /api/models
// Returns a list of available models from the backend
export const GET = withAuthAndPermission(Permission.MODELS_READ, async () => {
  try {
    const models = await fetchModelsFromBackend();
    return NextResponse.json({
      count: models.length,
      models
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models from backend' },
      { status: 500 }
    );
  }
});

// POST /api/models/discover
// Simulate discovering models in a local directory
// In a real implementation, this would scan the filesystem for model files
export const POST = withAuthAndPermission(Permission.MODELS_CREATE, async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { paths } = body;

    // Validate paths
    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json(
        { error: 'Invalid paths provided' },
        { status: 400 }
      );
    }

    // Read current config
    let config: { models: Record<string, any> } = { models: {} };
    try {
      const configData = fs.readFileSync(MODELS_CONFIG_FILE, 'utf8');
      config = JSON.parse(configData);
    } catch {
      // Config doesn't exist, use default
    }

    // For each path, simulate discovering models
    // In a real implementation, this would scan the filesystem for model files
    for (const path of paths) {
      try {
        // Check if path exists
        const pathExists = fs.existsSync(path);

        if (pathExists) {
          // Simulate discovering models in this path
          // In a real implementation, this serait une logique de découverte réelle
          const simulatedModels = [
            { name: 'llama3-8b', description: 'Llama 3 8B model', status: 'stopped', version: '3.0', path },
            { name: 'mistral-7b', description: 'Mistral 7B model', status: 'stopped', version: '1.0', path },
          ];

          // Add discovered models to config
          for (const model of simulatedModels) {
            config.models[model.name] = model;
          }
        }
      } catch (error) {
        console.error(`Failed to process path ${path}:`, error);
      }
    }

    // Write back to file
    fs.writeFileSync(MODELS_CONFIG_FILE, JSON.stringify(config, null, 2));

    // Return discovered models
    const discovered = Object.entries(config.models).map(([name, modelConfig]: [string, any]) => ({
      name,
      description: modelConfig.description || 'No description',
      status: modelConfig.status || 'stopped',
      version: modelConfig.version || '1.0',
      path: modelConfig.path
    }));

    return NextResponse.json({
      discovered,
      paths,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error discovering models:', error);
    return NextResponse.json(
      { error: 'Failed to discover models' },
      { status: 500 }
    );
  }
});