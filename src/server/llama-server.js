// src/server/llama-server.js
import { spawn } from 'child_process';
import { addLog } from './logs.js';

let llamaServerProcess = null;
let currentModelPath = null;
let autoStarted = false;

export function getLlamaServerStatus() {
  return {
    running: llamaServerProcess && !llamaServerProcess.killed,
    currentModel: currentModelPath,
    autoStarted,
    pid: llamaServerProcess?.pid || null
  };
}

export function startLlamaServer(modelPath, config = {}, serverPath) {
  return new Promise((resolve, reject) => {
    if (llamaServerProcess) {
      addLog('warn', 'Llama-server already running, stopping first');
      stopLlamaServer();
    }

    // Build command line arguments from config
    const args = ['-m', modelPath];

    // Use custom server path if provided
    const executable = serverPath || 'llama-server';

    // Server options
    if (config.host) args.push('--host', config.host);
    if (config.port) args.push('--port', config.port.toString());

    // Context and memory
    if (config.n_ctx) args.push('--ctx-size', config.n_ctx.toString());
    if (config.n_batch) args.push('--batch-size', config.n_batch.toString());
    if (config.n_ubatch) args.push('--ubatch-size', config.n_ubatch.toString());

    // GPU options
    if (config.n_gpu_layers) args.push('--n-gpu-layers', config.n_gpu_layers.toString());
    if (config.main_gpu) args.push('--main-gpu', config.main_gpu.toString());
    if (config.tensor_split) args.push('--tensor-split', config.tensor_split);

    // CPU options
    if (config.n_threads && config.n_threads !== -1) args.push('--threads', config.n_threads.toString());
    if (config.n_threads_batch && config.n_threads_batch !== -1) args.push('--threads-batch', config.n_threads_batch.toString());

    // Sampling options
    if (config.temperature !== undefined) args.push('--temp', config.temperature.toString());
    if (config.top_k) args.push('--top-k', config.top_k.toString());
    if (config.top_p !== undefined) args.push('--top-p', config.top_p.toString());
    if (config.min_p !== undefined) args.push('--min-p', config.min_p.toString());
    if (config.xtc_probability !== undefined) args.push('--xtc-probability', config.xtc_probability.toString());
    if (config.xtc_threshold !== undefined) args.push('--xtc-threshold', config.xtc_threshold.toString());
    if (config.typical_p !== undefined) args.push('--typical-p', config.typical_p.toString());
    if (config.repeat_last_n) args.push('--repeat-last-n', config.repeat_last_n.toString());
    if (config.repeat_penalty !== undefined) args.push('--repeat-penalty', config.repeat_penalty.toString());
    if (config.presence_penalty !== undefined) args.push('--presence-penalty', config.presence_penalty.toString());
    if (config.frequency_penalty !== undefined) args.push('--frequency-penalty', config.frequency_penalty.toString());

    // Generation options
    if (config.max_tokens) args.push('--max-tokens', config.max_tokens.toString());
    if (config.seed && config.seed !== -1) args.push('--seed', config.seed.toString());

    // Model options
    if (config.embedding) args.push('--embedding');
    if (config.memory_f16) args.push('--memory-f16');
    if (config.memory_f32) args.push('--memory-f32');
    if (config.vocab_only) args.push('--vocab-only');

    // RoPE options
    if (config.rope_freq_base !== undefined) args.push('--rope-freq-base', config.rope_freq_base.toString());
    if (config.rope_freq_scale !== undefined) args.push('--rope-freq-scale', config.rope_freq_scale.toString());

    // YaRN options
    if (config.yarn_ext_factor !== undefined) args.push('--yarn-ext-factor', config.yarn_ext_factor.toString());
    if (config.yarn_attn_factor !== undefined) args.push('--yarn-attn-factor', config.yarn_attn_factor.toString());
    if (config.yarn_beta_fast !== undefined) args.push('--yarn-beta-fast', config.yarn_beta_fast.toString());
    if (config.yarn_beta_slow !== undefined) args.push('--yarn-beta-slow', config.yarn_beta_slow.toString());

    // Server options
    if (config.api_keys) args.push('--api-key', config.api_keys);
    if (config.cors_allow_origins) args.push('--cors-allow-origins', config.cors_allow_origins);
    if (config.system_prompt) args.push('--system-prompt', config.system_prompt);
    if (config.chat_template) args.push('--chat-template', config.chat_template);

    // Logging options
    if (config.log_format) args.push('--log-format', config.log_format);
    if (config.log_level) args.push('--log-level', config.log_level);
    if (config.log_colors === false) args.push('--no-log-colors');
    if (config.log_verbose) args.push('--log-verbose');

    // Other options
    if (config.cache_reuse) args.push('--cache-reuse', config.cache_reuse.toString());
    if (config.cache_type_k) args.push('--cache-type-k', config.cache_type_k);
    if (config.cache_type_v) args.push('--cache-type-v', config.cache_type_v);
    if (config.ml_lock) args.push('--mlock');
    if (config.no_kv_offload) args.push('--no-kv-offload');

    addLog('info', `Starting llama-server with model: ${modelPath}`, { args, config });

    llamaServerProcess = spawn(executable, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false
    });

    currentModelPath = modelPath;

    let startupTimeout = setTimeout(() => {
      addLog('error', 'Llama-server startup timeout');
      reject(new Error('Startup timeout'));
    }, 30000);

    llamaServerProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.debug(`[LLAMA-SERVER] ${output}`);

      if (output.includes('HTTP server listening') || output.includes('listening on')) {
        clearTimeout(startupTimeout);
        addLog('info', 'Llama-server started successfully', { model: modelPath });
        resolve(llamaServerProcess);
      }
    });

    llamaServerProcess.stderr.on('data', (data) => {
      const error = data.toString();
      console.error(`[LLAMA-SERVER ERROR] ${error}`);
      addLog('error', `Llama-server error: ${error}`, { error });
    });

    llamaServerProcess.on('close', (code) => {
      addLog('info', `Llama-server exited with code ${code}`, { code });
      llamaServerProcess = null;
      currentModelPath = null;
      autoStarted = false;
    });

    llamaServerProcess.on('error', (error) => {
      addLog('error', `Failed to start llama-server: ${error.message}`, { error: error.message });
      reject(error);
    });
  });
}

export function stopLlamaServer() {
  if (llamaServerProcess) {
    addLog('info', 'Stopping llama-server');
    llamaServerProcess.kill('SIGTERM');
    llamaServerProcess = null;
    currentModelPath = null;
    autoStarted = false;
  }
}

// This function will be implemented in server.js to avoid circular dependencies

export function cleanupLlamaServer() {
  stopLlamaServer();
}