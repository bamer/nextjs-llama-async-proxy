// src/server/runtime-config.js
import fs from 'fs';
import path from 'path';
import { createBackendConfig, createDefaultLlamaConfig, createModelPaths, createUpdateConfig } from './config.js';

class RuntimeConfig {
  constructor() {
    this.configFile = path.join(process.cwd(), '.llama-proxy-config.json');
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configFile)) {
        const data = fs.readFileSync(this.configFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading runtime config:', error);
    }
    return {};
  }

  saveConfig() {
    try {
      fs.writeFileSync(this.configFile, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Error saving runtime config:', error);
    }
  }

  get(key, defaultValue) {
    return this.config[key] !== undefined ? this.config[key] : defaultValue;
  }

  set(key, value) {
    this.config[key] = value;
    this.saveConfig();
  }

  getAll() {
    return { ...this.config };
  }

  // Configuration spécialisée pour llama-server
  getLlamaServerConfig() {
    const baseConfig = createDefaultLlamaConfig();
    const runtimeConfig = {
      host: this.get('llama_server_host', baseConfig.host),
      port: this.get('llama_server_port', baseConfig.port),
      timeout: this.get('llama_server_timeout', baseConfig.timeout),
    };

    return {
      ...baseConfig,
      ...runtimeConfig,
      // Runtime overrides
      ...this.get('llama_config', {})
    };
  }

  setLlamaServerConfig(config) {
    this.set('llama_config', config);
    this.set('llama_server_host', config.host);
    this.set('llama_server_port', config.port);
    this.set('llama_server_timeout', config.timeout);
  }

  // Configuration des chemins
  getModelPaths() {
    const basePaths = createModelPaths();
    return {
      ...basePaths,
      modelsDir: this.get('models_dir', basePaths.modelsDir),
      defaultModel: this.get('default_model', basePaths.defaultModel)
    };
  }

  setModelPaths(paths) {
    this.set('models_dir', paths.modelsDir);
    this.set('default_model', paths.defaultModel);
  }

  reset() {
    this.config = {};
    this.saveConfig();
  }
}

export const runtimeConfig = new RuntimeConfig();