import type { Socket } from "socket.io";
import { getLogger } from "../../../lib/logger";
import {
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
} from "../../../lib/database";
import { CONFIG_TYPES } from "../server.constants";

const logger = getLogger();

export function setupConfigHandlers(socket: Socket): void {
  const configLoaders: Record<string, (id: number) => any> = {
    [CONFIG_TYPES.SAMPLING]: getModelSamplingConfig,
    [CONFIG_TYPES.MEMORY]: getModelMemoryConfig,
    [CONFIG_TYPES.GPU]: getModelGpuConfig,
    [CONFIG_TYPES.ADVANCED]: getModelAdvancedConfig,
    [CONFIG_TYPES.LORA]: getModelLoraConfig,
    [CONFIG_TYPES.MULTIMODAL]: getModelMultimodalConfig,
  };

  const configSavers: Record<string, (id: number, config: any) => any> = {
    [CONFIG_TYPES.SAMPLING]: saveModelSamplingConfig,
    [CONFIG_TYPES.MEMORY]: saveModelMemoryConfig,
    [CONFIG_TYPES.GPU]: saveModelGpuConfig,
    [CONFIG_TYPES.ADVANCED]: saveModelAdvancedConfig,
    [CONFIG_TYPES.LORA]: saveModelLoraConfig,
    [CONFIG_TYPES.MULTIMODAL]: saveModelMultimodalConfig,
  };

  socket.on("load_config", async (data: { id: number; type: string }) => {
    try {
      const loader = configLoaders[data.type];
      if (!loader) {
        throw new Error(`Invalid config type: ${data.type}`);
      }

      const config = loader(data.id);

      socket.emit("config_loaded", {
        success: true,
        data: { id: data.id, type: data.type, config: config || {} },
        timestamp: Date.now(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      socket.emit("config_loaded", {
        success: false,
        error: { code: "LOAD_CONFIG_FAILED", message },
        timestamp: Date.now(),
      });
    }
  });

  socket.on("save_config", async (data: { id: number; type: string; config: any }) => {
    try {
      const saver = configSavers[data.type];
      if (!saver) {
        throw new Error(`Invalid config type: ${data.type}`);
      }

      const result = saver(data.id, data.config);

      socket.emit("config_saved", {
        success: true,
        data: { id: data.id, type: data.type, config: result },
        timestamp: Date.now(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      socket.emit("config_saved", {
        success: false,
        error: { code: "SAVE_CONFIG_FAILED", message },
        timestamp: Date.now(),
      });
    }
  });
}
