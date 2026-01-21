import axios from 'axios';

const OLLAMA_BASE_URL = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_TIMEOUT = 30_000; // 30 seconds

const api = axios.create({
  baseURL: OLLAMA_BASE_URL,
  timeout: OLLAMA_TIMEOUT,
});

/**
 * List all locally available Ollama models.
 */
export async function listModels() {
  const response = await api.get('/api/tags');
  return response.data;
}

/**
 * Pull (download) a model if it is not present.
 * Returns the full model info from the response.
 */
export async function pullModel(name: string) {
  const response = await api.post('/api/pull', { name });
  return response.data;
}

/**
 * Stop a running Ollama model.
 * @param name Model name as stored in Ollama.
 */
export async function stopModel(name: string) {
  const response = await api.post(`/api/models/${encodeURIComponent(name)}/stop`);
  return response.data;
}

/**
 * Ensure a model is present locally; if not, pull it.
 * This can be considered the “start” step for our API.
 */
export async function ensureModel(name: string) {
  // First check if the model already exists
  const tags = await listModels();
  const existing = tags.models.some((t: any) => t.name === name);
  if (existing) return { status: 'present' };

  // If not present, pull it
  await pullModel(name);
  return { status: 'pulled' };
}
