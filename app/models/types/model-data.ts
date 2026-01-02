import { ModelConfig } from "./model-config";
import {
  ModelSamplingConfig,
  ModelMemoryConfig,
  ModelGpuConfig,
  ModelAdvancedConfig,
  ModelLoraConfig,
  ModelMultimodalConfig,
} from "./model-config-types";

export interface ModelData extends ModelConfig {
  parameters?: {
    sampling?: ModelSamplingConfig;
    memory?: ModelMemoryConfig;
    gpu?: ModelGpuConfig;
    advanced?: ModelAdvancedConfig;
    lora?: ModelLoraConfig;
    multimodal?: ModelMultimodalConfig;
    fit_params_available?: boolean;
    file_size_bytes?: number;
    quantization_type?: string;
    parameter_count?: string;
    ctx_size?: number;
    batch_size?: number;
    threads?: number;
    model_path?: string;
    model_url?: string;
  };
  sampling?: ModelSamplingConfig;
  memory?: ModelMemoryConfig;
  gpu?: ModelGpuConfig;
  advanced?: ModelAdvancedConfig;
  lora?: ModelLoraConfig;
  multimodal?: ModelMultimodalConfig;
  _configsLoading?: Set<string>;
}
