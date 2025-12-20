import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { listModels } from '@/lib/ollama';
import { ProcessManagerAPI } from '@/lib/process-manager';
import { ModelDiscoveryService } from '@/lib/services/ModelDiscoveryService';

interface Model {
  name: string;
  description: string;
  status: 'running' | 'stopped' | 'loading';
  version: string;
  path?: string;
}

const MODELS_CONFIG_FILE = path.join(process.cwd(), 'src/config/models_config.json');

const fetchModelsFromBackend = async (): Promise<Model[]> => {
  try {
    const modelsData = await listModels();
    const runningModels = new Set(
      Object.keys(ProcessManagerAPI.getInfo ? ProcessManagerAPI.getInfo : {}).map(model => model)
    );
    return modelsData.models.map((model: any) => ({
      name: model.name,
      description: model.description || 'No description provided',
      status: runningModels.has(model.name) ? 'running' : 'stopped',
      version: model.modified_at || '1.0',
      path: model.path
    }));
  } catch (error) {
    console.error('Failed to fetch models from Ollama API:', error);
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

export async function GET() {
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
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paths } = body;

    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json(
        { error: 'Invalid paths provided' },
        { status: 400 }
      );
    }

    const discoveredModels: Model[] = [];

    for (const path of paths) {
      try {
        const service = new ModelDiscoveryService(path);
        const results = await service.discoverModels(path);
        for (const model of results) {
          discoveredModels.push({
            name: model.name,
            description: model.description || 'No description',
            status: 'stopped',
            version: model.version || '1.0',
            path: model.path,
          });
        }
      } catch (error) {
        console.error(`Failed to discover models in path ${path}:`, error);
      }
    }

    return NextResponse.json({
      discovered: discoveredModels,
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
}