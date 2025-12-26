// src/server/proxy.js
import axios from 'axios';
import { runtimeConfig } from './runtime-config.js';
import { addLog } from './logs.js';

// Proxy client pour llama-server (llama.cpp) - using runtime config
const getLlamaServerClient = () => {
  const config = runtimeConfig.getLlamaServerConfig();
  return axios.create({
    baseURL: `http://${config.host}:${config.port}`,
    timeout: config.timeout,
  });
};

// Helper function to proxy vers llama-server
export async function proxyToLlamaServer(endpoint, method = 'GET', data = null) {
  try {
    const client = getLlamaServerClient();
    const response = await client.request({
      url: endpoint,
      method,
      data,
    });
    console.debug(`✅ [PROXY] LLAMA_SERVER ${method} ${endpoint} - Success`);
    return { success: true, data: response.data };
  } catch (error) {
    console.debug(`❌ [PROXY] LLAMA_SERVER ${method} ${endpoint} - Failed: ${error.message}`);
    addLog('error', `Llama-server proxy failed: ${method} ${endpoint} - ${error.message}`, { endpoint, method });
    return { success: false, error: error.message };
  }
}

// Convertir les formats pour compatibilité
export function convertToOpenAIFormat(request, type) {
  if (type === 'generate') {
    return {
      model: request.model || 'default',
      prompt: request.prompt,
      max_tokens: request.max_tokens || 100,
      temperature: request.temperature || 0.7,
      stream: request.stream || false
    };
  } else if (type === 'chat') {
    return {
      model: request.model || 'default',
      messages: request.messages || [],
      max_tokens: request.max_tokens || 100,
      temperature: request.temperature || 0.7,
      stream: request.stream || false
    };
  }
  return request;
}