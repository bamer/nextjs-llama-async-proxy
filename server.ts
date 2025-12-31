import { createServer } from 'http';
import next from 'next';
import { Server } from 'socket.io';
import express from 'express';
import LlamaServerIntegration from './src/server/services/LlamaServerIntegration.ts';
import { registry } from './src/server/ServiceRegistry.ts';
import { loadConfig } from './src/lib/server-config.ts';
import { setSocketIOInstance, getLogger } from './src/lib/logger.ts';
import {
  getModels,
  saveModel,
  getModelById,
  updateModel,
  deleteModel,
  getModelSamplingConfig,
  saveModelSamplingConfig,
  getModelMemoryConfig,
  saveModelMemoryConfig,
  getModelGpuConfig,
  saveModelGpuConfig,
  getModelAdvancedConfig,
  saveModelAdvancedConfig,
  getModelLoraConfig,
  saveModelLoraConfig,
  getModelMultimodalConfig,
  saveModelMultimodalConfig,
} from './src/lib/database.ts';

const logger = getLogger();

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const nextHandler = app.getRequestHandler()
const hostname = 'localhost';
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Make registry available globally for API routes
global.registry = registry;

logger.info('🚀 [SOCKET.IO] Initializing Socket.IO server...');

app.prepare().then(() => {
  logger.info('✅ [SOCKET.IO] Next.js app prepared, starting HTTP server...');

  const expressApp = express();
  const server = createServer(expressApp);

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    },
    path: '/llamaproxws',
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e8,
    transports: ['websocket'],
  });

  logger.info('🔧 [SOCKET.IO] Socket.IO server configured with path: /llamaproxws');

  // Set Socket.IO instance in Winston logger for real-time log streaming
  setSocketIOInstance(io);
  logger.info('🔧 [LOGGER] Socket.IO instance registered for WebSocket transport');

  const llamaIntegration = new LlamaServerIntegration(io);

  const clients = new Map();

  io.on('connection', (socket) => {
    const clientId = socket.id;
    clients.set(clientId, socket);

    logger.info(`🔌 [SOCKET.IO] New client connected (ID: ${clientId}) - Total clients: ${clients.size}`);

    socket.emit('message', {
      type: 'connection',
      clientId,
      message: 'Connected to Socket.IO server',
      timestamp: new Date().toISOString()
    });

    llamaIntegration.setupWebSocketHandlers(socket);

  // Load models from database as source of truth
  socket.on('load_models', async () => {
    try {
      logger.info('📚 [SOCKET.IO] Loading models from database...');

      let dbModels = [];
      let loadError = null;

       try {
         dbModels = getModels();
         logger.info(`[DEBUG] getModels() returned ${dbModels.length} models`);
       } catch (getDbError) {
         const errorMsg = getDbError instanceof Error ? getDbError.message : String(getDbError);
         loadError = `Failed to get models: ${errorMsg}`;
         logger.error(`[ERROR] ${loadError}`);
         throw new Error(loadError);
       }

      // Load complete model configs for each model
      const modelsWithConfigs = dbModels.map(model => {
        logger.info(`[DEBUG] Processing model ${model.id}: ${model.name}`);

        // Load each config type with individual error handling
        const configs = {
          sampling: null as any,
          memory: null as any,
          gpu: null as any,
          advanced: null as any,
          lora: null as any,
          multimodal: null as any,
        };

        // Try to load each config type separately
        try {
          configs.sampling = getModelSamplingConfig(model.id);
          logger.info(`[DEBUG]   - sampling config: ${configs.sampling ? 'loaded' : 'none'}`);
         } catch (e) {
           const msg = e instanceof Error ? e.message : String(e);
           logger.warn(`[WARN] Failed to load sampling config for ${model.id}: ${msg}`);
         }

        try {
          configs.memory = getModelMemoryConfig(model.id);
          logger.info(`[DEBUG]   - memory config: ${configs.memory ? 'loaded' : 'none'}`);
         } catch (e) {
           const msg = e instanceof Error ? e.message : String(e);
           logger.warn(`[WARN] Failed to load memory config for ${model.id}: ${msg}`);
         }

         try {
           configs.gpu = getModelGpuConfig(model.id);
           logger.info(`[DEBUG]   - gpu config: ${configs.gpu ? 'loaded' : 'none'}`);
         } catch (e) {
           const msg = e instanceof Error ? e.message : String(e);
           logger.warn(`[WARN] Failed to load gpu config for ${model.id}: ${msg}`);
         }

         try {
           configs.advanced = getModelAdvancedConfig(model.id);
           logger.info(`[DEBUG]   - advanced config: ${configs.advanced ? 'loaded' : 'none'}`);
         } catch (e) {
           const msg = e instanceof Error ? e.message : String(e);
           logger.warn(`[WARN] Failed to load advanced config for ${model.id}: ${msg}`);
         }

         try {
           configs.lora = getModelLoraConfig(model.id);
           logger.info(`[DEBUG]   - lora config: ${configs.lora ? 'loaded' : 'none'}`);
         } catch (e) {
           const msg = e instanceof Error ? e.message : String(e);
           logger.warn(`[WARN] Failed to load lora config for ${model.id}: ${msg}`);
         }

         try {
           configs.multimodal = getModelMultimodalConfig(model.id);
           logger.info(`[DEBUG]   - multimodal config: ${configs.multimodal ? 'loaded' : 'none'}`);
         } catch (e) {
           const msg = e instanceof Error ? e.message : String(e);
           logger.warn(`[WARN] Failed to load multimodal config for ${model.id}: ${msg}`);
         }

        return {
          id: model.id,
          name: model.name,
          parameters: {
            // Include existing parameters
            ...(model.ctx_size? || {}),
            // Add loaded configs to parameters object
            sampling: configs.sampling,
            memory: configs.memory,
            gpu: configs.gpu,
            advanced: configs.advanced,
            lora: configs.lora,
            multimodal: configs.multimodal,
          },

        };
      });

      logger.info(`[DEBUG] Built ${modelsWithConfigs.length} models with configs`);
      logger.info(`[DEBUG] Emitting models_loaded event...`);

      socket.emit('models_loaded', {
        success: true,
        data: modelsWithConfigs,
        timestamp: new Date().toISOString(),
      });

      logger.info(`✅ [SOCKET.IO] Loaded ${modelsWithConfigs.length} models from database`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error || 'Unknown error');
      logger.error(`❌ [SOCKET.IO] Error loading models from database: ${errorMessage}`);
      if (error instanceof Error && error.stack) {
        logger.error(`[ERROR] Stack trace: ${error.stack}`);
      }
      socket.emit('models_loaded', {
        success: false,
        error: { code: 'LOAD_MODELS_FAILED', message: errorMessage },
        timestamp: new Date().toISOString(),
      });
    }
  });

    // Handle load_config messages
    socket.on('load_config', async (data) => {
      try {
        logger.info(`📝 [SOCKET.IO] Loading config for model ${data.id}, type: ${data.type}`);

         const configMap = {
           sampling: getModelSamplingConfig,
           memory: getModelMemoryConfig,
           gpu: getModelGpuConfig,
           advanced: getModelAdvancedConfig,
           lora: getModelLoraConfig,
           multimodal: getModelMultimodalConfig,
         };

         const getFunc = configMap[data.type];
         if (!getFunc) {
           throw new Error(`Invalid config type: ${data.type}`);
         }

         const config = getFunc(data.id);

         // If config is null, return empty config (no defaults - let user set what they want)
         if (!config) {
           logger.info(`ℹ️ [WS] No existing ${data.type} config found, returning empty config`);
         }

          socket.emit('config_loaded', {
            success: true,
            data: { id: data.id, type: data.type, config: config || {} },
            timestamp: new Date().toISOString(),
          });

         logger.info(`✅ [SOCKET.IO] Config loaded: ${data.type} for model ${data.id}`);
       } catch (error) {
        logger.info(`💾 [SOCKET.IO] Saving config for model ${data.id}, type: ${data.type}`);
        
        let result;
        const configMap = {
          sampling: saveModelSamplingConfig,
          memory: saveModelMemoryConfig,
          gpu: saveModelGpuConfig,
          advanced: saveModelAdvancedConfig,
          lora: saveModelLoraConfig,
          multimodal: saveModelMultimodalConfig,
        };
        
        const saveFunc = configMap[data.type];
        if (!saveFunc) {
          throw new Error(`Invalid config type: ${data.type}`);
        }
        
        result = saveFunc(data.id, data.config);
        
        socket.emit('config_saved', {
          success: true,
          data: { id: data.id, type: data.type, config: result },
          timestamp: new Date().toISOString(),
        });
        
        logger.info(`✅ [SOCKET.IO] Config saved: ${data.type} for model ${data.id}`);
      } catch (error) {
        logger.error(`❌ [SOCKET.IO] Error saving config: ${error.message}`);
        socket.emit('config_saved', {
          success: false,
