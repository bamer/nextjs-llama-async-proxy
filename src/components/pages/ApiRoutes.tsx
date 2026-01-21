import { NextRequest, NextResponse } from 'next/server';

// Import services (these will be implemented separately)
const ParameterService = require('../../backend/src/services/ParameterService');
const ModelDiscoveryService = require('../../backend/src/services/ModelDiscoveryService');
const BackupService = require('../../backend/src/services/BackupService');

// Mock services for now - we'll implement real ones later
let parameterService = new ParameterService();
let discoveryService = new ModelDiscoveryService();
let backupService = new BackupService();

// Mock metrics service
let metricsService = {
  getMetrics: () => ({ uptime: Date.now(), cpu: 0.5, memory: 0.3 }),
  getMetricsHistory: (limit: number) => [],
  getModelStats: (modelName: string) => null,
  updateModelStatus: (modelName: string, status: string) => {},
};

// Mock app config
interface ModelsConfig {
  models: Record<string, any>;
}

let modelsConfig: ModelsConfig = {
  models: {}
};

// Initialize services with mock data
function initializeServices() {
  // In a real implementation, these would be properly connected to backend services
}

// ==================== MONITORING ====================
export async function GET_monitoring(req: NextRequest) {
  try {
    const metrics = metricsService.getMetrics();
    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error('Error fetching monitoring data:', error);
    return NextResponse.json({ error: 'Failed to fetch monitoring data' }, { status: 500 });
  }
}

export async function GET_monitoring_history(req: NextRequest) {
  try {
    const limit = req.nextUrl.searchParams.get('limit') ? parseInt(req.nextUrl.searchParams.get('limit')!) : 60;
    const history = metricsService.getMetricsHistory(limit);
    return NextResponse.json(history);
  } catch (error: any) {
    console.error('Error fetching monitoring history:', error);
    return NextResponse.json({ error: 'Failed to fetch monitoring history' }, { status: 500 });
  }
}

// ==================== PARAMETERS & OPTIONS ====================
export async function GET_parameters(req: NextRequest) {
  try {
    const parameters = parameterService.getOptionsByCategoryForUI();
    return NextResponse.json({
      success: true,
      count: parameterService.countOptions(),
      parameters
    });
  } catch (error: any) {
    console.error('Error fetching parameters:', error);
    return NextResponse.json({ error: 'Failed to fetch parameters' }, { status: 500 });
  }
}

export async function GET_parameters_category(req: NextRequest, { params }: { params: { category: string } }) {
  try {
    const categoryParams = parameterService.getCategory(params.category);
    
    if (Object.keys(categoryParams).length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      category: params.category,
      parameters: categoryParams
    });
  } catch (error: any) {
    console.error('Error fetching category parameters:', error);
    return NextResponse.json({ error: 'Failed to fetch category parameters' }, { status: 500 });
  }
}

export async function GET_parameters_category_paramName(req: NextRequest, { params }: { params: { category: string; paramName: string } }) {
  try {
    const param = parameterService.getOption(params.category, params.paramName);
    
    if (!param) {
      return NextResponse.json({ error: 'Parameter not found' }, { status: 404 });
    }

    const info = parameterService.getParameterInfo(params.paramName);
    return NextResponse.json({
      success: true,
      parameter: params.paramName,
      category: params.category,
      ...param,
      ...info
    });
  } catch (error: any) {
    console.error('Error fetching parameter info:', error);
    return NextResponse.json({ error: 'Failed to fetch parameter info' }, { status: 500 });
  }
}

export async function POST_parameters_validate(req: NextRequest) {
  try {
    const { parameters } = await req.json();
    
    if (!parameters || typeof parameters !== 'object') {
      return NextResponse.json({ error: 'Parameters object required' }, { status: 400 });
    }

    const validation: Record<string, any> = {};
    const errors: Array<{ parameter: string; error: string }> = [];

    for (const [paramName, value] of Object.entries(parameters)) {
      const result = parameterService.validateParameter(paramName, value);
      validation[paramName] = result;
      if (!result.valid) {
        errors.push({ parameter: paramName, error: result.error });
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      validation,
      errors
    });
  } catch (error: any) {
    console.error('Error validating parameters:', error);
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
  }
}

// ==================== MODELS - DISCOVERY & LISTING ====================
export async function GET_models(req: NextRequest) {
  try {
    const models = Object.keys(modelsConfig.models || {}).map((name) => ({
      name,
      ...modelsConfig.models[name],
    }));

    return NextResponse.json({
      count: models.length,
      models: models,
    });
  } catch (error: any) {
    console.error('Error fetching models:', error);
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
  }
}

export async function POST_models_discover(req: NextRequest) {
  try {
    const { path: scanPath, maxDepth } = await req.json();

    if (!scanPath) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    console.log(`🔍 Starting model discovery in: ${scanPath}`);
    const discoveredModels = await discoveryService.discoverModels(
      scanPath,
      maxDepth || 3
    );

    return NextResponse.json({
      success: true,
      count: discoveredModels.length,
      models: discoveredModels,
    });
  } catch (error: any) {
    console.error('Discovery error:', error);
    return NextResponse.json({
      error: 'Discovery failed',
      message: error.message,
    }, { status: 500 });
  }
}

export async function POST_models_register(req: NextRequest) {
  try {
    const { models } = await req.json();

    if (!Array.isArray(models)) {
      return NextResponse.json({ error: 'Models must be an array' }, { status: 400 });
    }

    const defaultParams = discoveryService.getDefaultParameters();
    
    let registered = 0;

    for (const model of models) {
      const modelConfig = {
        name: model.name,
        path: model.path,
        filename: model.filename,
        format: model.format,
        size: model.size,
        sizeGB: model.sizeGB,
        status: 'ready',
        discovered_at: new Date().toISOString(),
        ...defaultParams,
      };

      try {
        // In a real implementation, this would save the config to file
        registered++;
        console.log(`✅ Registered model: ${model.name}`);
      } catch (err: any) {
        console.error(`Error registering ${model.name}:`, err.message);
      }
    }

    return NextResponse.json({
      success: true,
      registered,
      models: Object.keys(modelsConfig.models || {}),
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({
      error: 'Registration failed',
      message: error.message,
    }, { status: 500 });
  }
}

export async function GET_models_modelName(req: NextRequest, { params }: { params: { modelName: string } }) {
  try {
    const modelConfig = modelsConfig.models?.[params.modelName];

    if (!modelConfig) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    const stats = metricsService.getModelStats(params.modelName);

    return NextResponse.json({
      name: params.modelName,
      config: modelConfig,
      stats,
    });
  } catch (error: any) {
    console.error('Error fetching model:', error);
    return NextResponse.json({ error: 'Failed to fetch model' }, { status: 500 });
  }
}

export async function PUT_models_modelName(req: NextRequest, { params }: { params: { modelName: string } }) {
  try {
    const updates = await req.json();
    const modelConfig = modelsConfig.models?.[params.modelName];

    if (!modelConfig) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    // Validate updates
    const updatedConfig = { ...modelConfig, ...updates };
    const validation = discoveryService.validateModelConfig(updatedConfig);

    if (!validation.valid) {
      return NextResponse.json({
        error: 'Validation failed',
        errors: validation.errors,
      }, { status: 400 });
    }

    // In a real implementation, this would save the config to file
    modelsConfig.models[params.modelName] = updatedConfig;

    return NextResponse.json({
      success: true,
      model: params.modelName,
      config: updatedConfig,
    });
  } catch (error: any) {
    console.error('Error updating model:', error);
    return NextResponse.json({
      error: 'Failed to update model',
      message: error.message,
    }, { status: 500 });
  }
}

export async function DELETE_models_modelName(req: NextRequest, { params }: { params: { modelName: string } }) {
  try {
    if (!modelsConfig.models?.[params.modelName]) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    delete modelsConfig.models[params.modelName];

    return NextResponse.json({
      success: true,
      message: `Model ${params.modelName} removed`,
    });
  } catch (error: any) {
    console.error('Error deleting model:', error);
    return NextResponse.json({
      error: 'Failed to delete model',
      message: error.message,
    }, { status: 500 });
  }
}

export async function POST_models_modelName_start(req: NextRequest, { params }: { params: { modelName: string } }) {
  try {
    metricsService.updateModelStatus(params.modelName, 'running');
    return NextResponse.json({ status: 'success', model: params.modelName, action: 'start' });
  } catch (error: any) {
    console.error('Error starting model:', error);
    return NextResponse.json({ error: 'Failed to start model' }, { status: 500 });
  }
}

export async function POST_models_modelName_stop(req: NextRequest, { params }: { params: { modelName: string } }) {
  try {
    metricsService.updateModelStatus(params.modelName, 'stopped');
    return NextResponse.json({ status: 'success', model: params.modelName, action: 'stop' });
  } catch (error: any) {
    console.error('Error stopping model:', error);
    return NextResponse.json({ error: 'Failed to stop model' }, { status: 500 });
  }
}

// ==================== CONFIGURATION ====================
export async function GET_config(req: NextRequest) {
  try {
    return NextResponse.json(modelsConfig);
  } catch (error: any) {
    console.error('Error fetching config:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

export async function GET_config_defaults(req: NextRequest) {
  try {
    const defaults = discoveryService.getDefaultParameters();
    return NextResponse.json(defaults);
  } catch (error: any) {
    console.error('Error fetching defaults:', error);
    return NextResponse.json({ error: 'Failed to fetch defaults' }, { status: 500 });
  }
}

export async function POST_config_paths(req: NextRequest) {
  try {
    const { modelsPath } = await req.json();

    if (!modelsPath) {
      return NextResponse.json({ error: 'Models path is required' }, { status: 400 });
    }

    // In a real implementation, this would save to file
    return NextResponse.json({
      success: true,
      modelsPath,
    });
  } catch (error: any) {
    console.error('Error updating paths:', error);
    return NextResponse.json({
      error: 'Failed to update paths',
      message: error.message,
    }, { status: 500 });
  }
}

export async function POST_config(req: NextRequest) {
  try {
    const updates = await req.json();
    Object.assign(modelsConfig, updates);

    // In a real implementation, this would save to file
    return NextResponse.json({ status: 'success', config: modelsConfig });
  } catch (error: any) {
    console.error('Error updating config:', error);
    return NextResponse.json({
      error: 'Failed to update config',
      message: error.message,
    }, { status: 500 });
  }
}

// ==================== BACKUPS ====================
export async function GET_backups(req: NextRequest) {
  try {
    const filename = req.nextUrl.searchParams.get('filename');
    const backups = backupService.listBackups(filename || 'models_config.json');
    return NextResponse.json({
      success: true,
      backups
    });
  } catch (error: any) {
    console.error('Error listing backups:', error);
    return NextResponse.json({ error: 'Failed to list backups' }, { status: 500 });
  }
}

export async function POST_backups_restore(req: NextRequest) {
  try {
    const { backupName, filename } = await req.json();
    
    if (!backupName || !filename) {
      return NextResponse.json({ error: 'backupName and filename required' }, { status: 400 });
    }

    // In a real implementation, this would restore from backup
    // Reload config would happen here

    return NextResponse.json({
      success: true,
      message: `Restored from ${backupName}`
    });
  } catch (error: any) {
    console.error('Error restoring backup:', error);
    return NextResponse.json({ error: 'Failed to restore backup', message: error.message }, { status: 500 });
  }
}

// ==================== LOGS ====================
export async function GET_logs(req: NextRequest) {
  try {
    const limit = req.nextUrl.searchParams.get('limit') ? parseInt(req.nextUrl.searchParams.get('limit')!) : 100;
    
    // Mock logs since we don't have real logs in this context
    return NextResponse.json({ 
      logs: [], 
      total: 0 
    });
  } catch (error: any) {
    console.error('Error reading logs:', error);
    return NextResponse.json({ error: 'Failed to read logs' }, { status: 500 });
  }
}

// ==================== HEALTH ====================
export async function GET_health(req: NextRequest) {
  try {
    return NextResponse.json({
      status: 'healthy',
      timestamp: Date.now(),
      uptime: metricsService.getMetrics().uptime,
    });
  } catch (error: any) {
    console.error('Error fetching health:', error);
    return NextResponse.json({ error: 'Failed to fetch health' }, { status: 500 });
  }
}