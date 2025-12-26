// src/server/metrics.js
import { cpus, totalmem, freemem } from 'os';
import { generateLogs } from './logs.js';
import { proxyToLlamaServer } from './proxy.js';
import { scanLocalModels, getLoadedModels } from './models.js';
import { loadavg } from 'os';

export async function generateMetrics() {
  const totalMemory = totalmem();
  const freeMemory = freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsagePercent = Math.round((usedMemory / totalMemory) * 100);

    // Simple CPU usage estimation
    const cpuCount = cpus().length;
    const loadAvg = loadavg()[0]; // 1 minute load average
    const cpuUsagePercent = Math.min(Math.round((loadAvg / cpuCount) * 100), 100);

  // Compter les modèles actifs
  const loadedModels = getLoadedModels();
  const activeModels = loadedModels.filter(([_, status]) => status.status === 'loaded').length;

  // Essayer d'obtenir des métriques de llama-server
  let llamaServerMetrics = {};
  try {
    const healthResult = await proxyToLlamaServer('/health');
    if (healthResult.success) {
      llamaServerMetrics = { llama_server_status: 'connected' };
    } else {
      llamaServerMetrics = { llama_server_status: 'disconnected' };
    }
  } catch (error) {
    llamaServerMetrics = { llama_server_status: 'error' };
  }

  return {
    activeModels: Math.max(activeModels, 1), // Au moins 1 si des modèles sont chargés
    totalRequests: generateLogs().filter(log => log.context?.endpoint).length, // Compter les vraies requêtes
    avgResponseTime: 150, // TODO: calculer le vrai temps de réponse moyen
    memoryUsage: memoryUsagePercent,
    cpuUsage: cpuUsagePercent,
    uptime: Math.floor(process.uptime()),
    lastUpdated: new Date().toISOString(),
    ...llamaServerMetrics
  };
}