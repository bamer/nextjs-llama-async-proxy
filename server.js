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
} from './src/lib/database.js';

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
        const dbModels = getModels();
        const storeModels = dbModels.map(model => ({
          id: model.id,
          name: model.name,
          path: model.path,
          size: model.size,
          architecture: model.architecture,
          parameters: model.parameters,
          quantization: model.quantization,
          rope_freq_scale: model.rope_freq_scale,
        }));

        socket.emit('models_loaded', {
          success: true,
          data: storeModels,
          timestamp: new Date().toISOString(),
        });

        logger.info(`✅ [SOCKET.IO] Loaded ${storeModels.length} models from database`);
      } catch (error) {
        logger.error(`❌ [SOCKET.IO] Error loading models from database: ${error.message}`);
        socket.emit('models_loaded', {
          success: false,
          error: { code: 'LOAD_MODELS_FAILED', message: error.message },
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Handle load_config messages
    socket.on('load_config', async (data) => {
      try {
        logger.info(`📝 [SOCKET.IO] Loading config for model ${data.id}, type: ${data.type}`);
        
        let config;
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
        
        config = getFunc(data.id);
        
        socket.emit('config_loaded', {
          success: true,
          data: { id: data.id, type: data.type, config },
          timestamp: new Date().toISOString(),
        });
        
        logger.info(`✅ [SOCKET.IO] Config loaded: ${data.type} for model ${data.id}`);
      } catch (error) {
        logger.error(`❌ [SOCKET.IO] Error loading config: ${error.message}`);
        socket.emit('config_loaded', {
          success: false,
          error: { code: 'LOAD_CONFIG_FAILED', message: error.message },
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Handle save_config messages
    socket.on('save_config', async (data) => {
      try {
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
          error: { code: 'SAVE_CONFIG_FAILED', message: error.message },
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Handle save_model messages
    socket.on('save_model', async (data) => {
      try {
        logger.info(`💾 [SOCKET.IO] Saving model: ${data.name}`);
        
        const model = saveModel(data);
        
        socket.emit('model_saved', {
          success: true,
          data: model,
          timestamp: new Date().toISOString(),
        });
        
        logger.info(`✅ [SOCKET.IO] Model saved: ${model.name} (ID: ${model.id})`);
      } catch (error) {
        logger.error(`❌ [SOCKET.IO] Error saving model: ${error.message}`);
        socket.emit('model_saved', {
          success: false,
          error: { code: 'SAVE_MODEL_FAILED', message: error.message },
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Handle update_model messages
    socket.on('update_model', async (data) => {
      try {
        logger.info(`✏️  [SOCKET.IO] Updating model ${data.id}`);
        
        const updated = updateModel(data.id, data.updates);
        
        socket.emit('model_updated', {
          success: true,
          data: updated,
          timestamp: new Date().toISOString(),
        });
        
        logger.info(`✅ [SOCKET.IO] Model updated: ${updated.id}`);
      } catch (error) {
        logger.error(`❌ [SOCKET.IO] Error updating model: ${error.message}`);
        socket.emit('model_updated', {
          success: false,
          error: { code: 'UPDATE_MODEL_FAILED', message: error.message },
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Handle delete_model messages
    socket.on('delete_model', async (data) => {
      try {
        logger.info(`🗑️ [SOCKET.IO] Deleting model: ${data.id}`);
        
        // Delete model from database
        deleteModel(data.id);
        
        socket.emit('model_deleted', {
          success: true,
          data: { id: data.id },
          timestamp: new Date().toISOString(),
        });
        
        logger.info(`✅ [SOCKET.IO] Model deleted: ${data.id}`);
      } catch (error) {
        logger.error(`❌ [SOCKET.IO] Error deleting model: ${error.message}`);
        socket.emit('model_deleted', {
          success: false,
          error: { code: 'DELETE_MODEL_FAILED', message: error.message },
          timestamp: new Date().toISOString(),
        });
      }
    });

    socket.on('import_models_from_llama', async () => {
      try {
        logger.info(`📥 [SOCKET.IO] Importing models from llama-server into database...`);
        
        // Get all models from llama-server
        const llamaModels = await llamaIntegration.getModels();
        logger.info(`[SOCKET.IO] Found ${llamaModels.length} models in llama-server`);
        
        // Get existing models from database
        const existingModels = getModels();
        logger.info(`[SOCKET.IO] Found ${existingModels.length} models in database`);
        
        let importedCount = 0;
        let skippedCount = 0;
        const importedModels = [];
        
        // Import each model if it doesn't already exist
        for (const llamaModel of llamaModels) {
          // Check if model already exists in database (by name)
          const existingModel = existingModels.find((m) => m.name === llamaModel.name);
          
          if (existingModel) {
            logger.info(`[SOCKET.IO] Skipping existing model: ${llamaModel.name}`);
            skippedCount++;
            continue;
          }
          
          // Create model record for database
          const modelRecord = {
            name: llamaModel.name,
            type: llamaModel.type === 'mistral' ? 'mistral' : 'llama', // Normalize type
            status: 'idle',
            model_path: llamaModel.parameters?.model_path || llamaModel.name,
            model_url: llamaModel.parameters?.model_url || '',
            ctx_size: llamaModel.parameters?.ctx_size || 2048,
            batch_size: llamaModel.parameters?.batch_size || 512,
            threads: llamaModel.parameters?.threads || 4,
            created_at: Math.floor(Date.now() / 1000),
            updated_at: Math.floor(Date.now() / 1000)
          };
          
          // Save to database
          const dbId = saveModel(modelRecord);
          logger.info(`[SOCKET.IO] Imported model: ${llamaModel.name} (DB ID: ${dbId})`);
          importedCount++;
          importedModels.push({ ...modelRecord, id: dbId });
        }
        
        socket.emit('models_imported', {
          success: true,
          data: {
            totalFound: llamaModels.length,
            imported: importedCount,
            skipped: skippedCount,
            models: importedModels
          },
          message: `Successfully imported ${importedCount} models from llama-server (${skippedCount} already existed)`,
          timestamp: new Date().toISOString()
        });
        
        logger.info(`✅ [SOCKET.IO] Models import complete: ${importedCount} imported, ${skippedCount} skipped`);
      } catch (error) {
        logger.error(`❌ [SOCKET.IO] Error importing models: ${error.message}`);
        socket.emit('models_imported', {
          success: false,
          error: { code: 'IMPORT_MODELS_FAILED', message: error.message },
          timestamp: new Date().toISOString()
        });
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info(`🔴 [SOCKET.IO] Client disconnected (ID: ${clientId}) | Reason: ${reason} - Remaining clients: ${clients.size - 1}`);
      clients.delete(clientId);
    });

    socket.on('connect_error', (error) => {
      logger.error(`❌ [SOCKET.IO] Connection error for client ${clientId}: ${error.message}`);
    });
  });

  expressApp.use((req, res) => {
    return nextHandler(req, res)
  });

  server.listen(port, async (err) => {
    if (err) throw err
    logger.info(`> Ready on http://${hostname}:${port}`);
    logger.info(`🚀 [SOCKET.IO] Server listening at http://${hostname}:${port}`);
    logger.info('🚀 [SOCKET.IO] Socket.IO server is ready');

    // Load configuration from llama-server-config.json
    let llamaConfig;
    try {
      const loadedConfig = loadConfig();
      llamaConfig = {
        host: process.env.LLAMA_SERVER_HOST || loadedConfig.host,
        port: parseInt(process.env.LLAMA_SERVER_PORT || String(loadedConfig.port), 10),
        basePath: process.env.MODELS_PATH || loadedConfig.basePath,
        serverPath: loadedConfig.serverPath,
        ctx_size: loadedConfig.ctx_size,
        batch_size: loadedConfig.batch_size,
        threads: loadedConfig.threads,
        gpu_layers: loadedConfig.gpu_layers,
      };
      logger.info('📝 [CONFIG] Configuration loaded from llama-server-config.json');
    } catch (error) {
      logger.warn(`⚠️ [CONFIG] Failed to load config file, using defaults: ${error.message}`);
      llamaConfig = {
        host: process.env.LLAMA_SERVER_HOST || 'localhost',
        port: parseInt(process.env.LLAMA_SERVER_PORT || '8134', 10),
        basePath: process.env.MODELS_PATH || '/models',
        serverPath: '/home/bamer/llama.cpp/build/bin/llama-server',
        ctx_size: 8192,
        batch_size: 512,
        threads: -1,
        gpu_layers: -1,
      };
    }

    try {
      logger.info('🦙 Initializing LlamaServer integration...');
      logger.info(`📋 [CONFIG] Llama server path: ${llamaConfig.serverPath}`);
      logger.info(`📋 [CONFIG] Host: ${llamaConfig.host}:${llamaConfig.port}`);
      logger.info(`📋 [CONFIG] Base path: ${llamaConfig.basePath}`);
      logger.info(`📋 [CONFIG] ctx_size: ${llamaConfig.ctx_size}, batch_size: ${llamaConfig.batch_size}, threads: ${llamaConfig.threads}`);
      await llamaIntegration.initialize(llamaConfig);

      registry.register('llamaService', llamaIntegration.getLlamaService());
      logger.info('✅ LlamaServer integration initialized successfully');

      // Auto-import models if database is empty (with retry logic)
      const tryAutoImport = async (retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const dbModels = getModels();
            logger.info(`[AUTO-IMPORT] Check ${i + 1}/${retries}: Database has ${dbModels.length} models`);

            if (dbModels.length === 0) {
              logger.info('📥 [AUTO-IMPORT] Database is empty, importing from llama-server...');

              const llamaService = llamaIntegration.getLlamaService();
              if (!llamaService) {
                logger.warn(`[AUTO-IMPORT] Retry ${i + 1}/${retries}: LlamaService not available yet, waiting...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                continue;
              }

              const llamaModels = llamaService.getState().models;
              logger.info(`[AUTO-IMPORT] Found ${llamaModels.length} models from llama-server`);

              if (llamaModels.length === 0) {
                logger.warn(`[AUTO-IMPORT] Retry ${i + 1}/${retries}: No models found in llama-server`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                continue;
              }

              for (const llamaModel of llamaModels) {
                try {
                  // Validate required fields
                  if (!llamaModel.name || typeof llamaModel.name !== 'string') {
                    logger.warn(`[AUTO-IMPORT] Skipping model with invalid name:`, llamaModel);
                    continue;
                  }

                  const modelRecord = {
                    name: llamaModel.name.trim(),
                    type: 'llama',
                    status: 'stopped',
                    model_path: llamaModel.id || llamaModel.name,
                    model_url: '',
                    ctx_size: llamaConfig.ctx_size,
                    batch_size: llamaConfig.batch_size,
                    threads: llamaConfig.threads,
                    file_size_bytes: llamaModel.size || 0,
                  };

                  const dbId = saveModel(modelRecord);
                  logger.info(`[AUTO-IMPORT] Imported model: ${modelRecord.name} (DB ID: ${dbId})`);
                } catch (error) {
                  const message = error instanceof Error ? error.message : String(error);
                  const modelName = llamaModel?.name || 'unknown';
                  logger.error(`[AUTO-IMPORT] Failed to import model ${modelName}: ${message}`);
                }
              }

              logger.info('✅ [AUTO-IMPORT] Models import completed');
              return true; // Success
            } else {
              logger.info('[AUTO-IMPORT] Database already has models, skipping import');
              return true; // Success - no import needed
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            logger.warn(`[AUTO-IMPORT] Retry ${i + 1}/${retries} failed: ${message}`);
            if (i < retries - 1) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }
        return false; // All retries failed
      };

      try {
        await tryAutoImport(5);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.warn(`⚠️ [AUTO-IMPORT] Failed to check/import models after all retries: ${message}`);
      }
    } catch (error) {
      logger.error(`❌ Failed to initialize LlamaServer integration: ${error.message}`);
      logger.warn('⚠️ Server will continue running, but model management may not work');
    }
  });

  server.on('error', (error) => {
    logger.error(`❌ [SOCKET.IO] HTTP Server error: ${error.message}`);
    if (error.code === 'EADDRINUSE') {
      logger.error(`🔥 [SOCKET.IO] Port ${port} is already in use!`);
    }
  });

  io.engine.on('connection_error', (err) => {
    logger.error(`❌ [SOCKET.IO] Connection error: ${err.message}`);
  });

  const cleanup = async () => {
    logger.info('👋 [SHUTDOWN] Starting graceful shutdown...');
    io.disconnectSockets();
    await llamaIntegration.stop();
    server.close(() => {
      logger.info('👋 [SHUTDOWN] Server shutdown complete');
      process.exit(0);
    });
  };

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
process.on('exit', (code) => {
  logger.info(`👋 [SHUTDOWN] Server exited with code ${code}`);
});

process.on('uncaughtException', (error) => {
  logger.error('❌ [UNCAUGHT EXCEPTION]', error);
  cleanup();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ [UNHANDLED REJECTION]', reason);
  cleanup();
});

}).catch((error) => {
  logger.error(`❌ [SOCKET.IO] Failed to prepare Next.js app: ${error.message}`);
  process.exit(1);
});
