// src/server/logs.js
export const recentLogs = [];
const MAX_LOGS = parseInt(process.env.MAX_LOGS || '50');

export function addLog(level, message, context = {}) {
  const logEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    level,
    message,
    timestamp: new Date().toISOString(),
    context
  };

  recentLogs.unshift(logEntry);
  if (recentLogs.length > MAX_LOGS) {
    recentLogs.pop();
  }
}

export function generateLogs() {
  if (recentLogs.length === 0) {
    // Fallback mock logs if no real logs yet
    const logLevels = ['info', 'debug', 'warn', 'error'];
    const logs = [];
    const now = Date.now();

    for (let i = 0; i < 5; i++) {
      const level = logLevels[Math.floor(Math.random() * logLevels.length)];
      logs.push({
        id: `log-${now}-${i}`,
        level,
        message: `System initialized - ${level} message ${i + 1}`,
        timestamp: new Date(now - Math.floor(Math.random() * 300000)).toISOString(),
        context: { source: 'system' }
      });
    }
    return logs;
  }

  return recentLogs.slice(0, 20); // Return up to 20 most recent logs
}

addLog('info', 'Server initialization started', { phase: 'startup' });