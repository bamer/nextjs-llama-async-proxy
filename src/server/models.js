// src/server/models.js
import { MODEL_PATHS } from './config.js';
import { addLog } from './logs.js';
import fs from 'fs';
import path from 'path';

const modelConfigs = new Map(); // id -> config
const loadedModels = new Map(); // id -> status

export function getModelConfigs() {
  return Array.from(modelConfigs.entries());
}

export function getLoadedModels() {
  return Array.from(loadedModels.entries());
}

export function scanLocalModels() {
  try {
    if (!fs.existsSync(MODEL_PATHS.modelsDir)) {
      addLog('warn', `Models directory not found: ${MODEL_PATHS.modelsDir}`);
      return [];
    }

    const files = fs.readdirSync(MODEL_PATHS.modelsDir);
    const modelFiles = files.filter(file =>
      file.endsWith('.gguf') || file.endsWith('.bin')
    );

    return modelFiles.map(file => {
      const fullPath = path.join(MODEL_PATHS.modelsDir, file);
      const stats = fs.statSync(fullPath);
      return {
        id: file,
        name: file.replace(/\.(gguf|bin)$/i, ''),
        path: fullPath,
        size: stats.size,
        modified: stats.mtime.toISOString(),
        type: 'llama',
        status: 'available',
        createdAt: stats.birthtime.toISOString(),
        updatedAt: stats.mtime.toISOString(),
        backend: 'llama-server'
      };
    });
  } catch (error) {
    addLog('error', `Error scanning models directory: ${error.message}`, { dir: MODEL_PATHS.modelsDir });
    return [];
  }
}

export function loadModel(id, config) {
  modelConfigs.set(id, config);
  loadedModels.set(id, { status: 'loading', config });

  addLog('info', `Model ${id} load requested`, { modelId: id, config });

  // Simuler le chargement
  setTimeout(() => {
    loadedModels.set(id, { status: 'loaded', config });
    addLog('info', `Model ${id} loaded successfully`, { modelId: id });
  }, 2000);
}

export function unloadModel(id) {
  loadedModels.set(id, { status: 'unloaded' });
  addLog('info', `Model ${id} unloaded`, { modelId: id });
}

export function getModelStatus(id) {
  return loadedModels.get(id) || { status: 'unknown' };
}