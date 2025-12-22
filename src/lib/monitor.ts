/**
 * Real‑time monitoring utilities for the Next.js server.
 * - Captures CPU / memory usage every 30 seconds.
 * - Persists the data to `data/monitoring-history.json`.
 * - Starts automatically when the module is first imported (server‑only).
 */
import fs from 'fs';
import path from 'path';
import os from 'os';

// Path to the persisted history file
const HISTORY_FILE = path.join(process.cwd(), 'data', 'monitoring-history.json');

/**
 * Reads the history file. Returns an empty array if the file does not exist
 * or cannot be parsed.
 */
function readHistory(): any[] {
  try {
    if (!fs.existsSync(HISTORY_FILE)) return [];
    const raw = fs.readFileSync(HISTORY_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Writes the given array to the history file (atomic write).
 */
function writeHistory(history: any[]) {
  try {
    const tmp = HISTORY_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(history, null, 2), 'utf8');
    fs.renameSync(tmp, HISTORY_FILE);
  } catch (e) {
    console.error('Failed to persist monitoring history:', e);
  }
}

/**
 * Captures a snapshot of system metrics.
 */
export function captureMetrics() {
  // Simple CPU utilisation (user + sys time) averaged across cores
  const cpus = os.cpus();
  const idle = cpus.reduce((acc, cpu) => acc + idleCpu(cpu), 0) / cpus.length;
  const total = cpus.reduce((acc, cpu) => acc + (cpu.times.user + cpu.times.sys), 0);
  const cpuUsage = Math.round(((total - idle) / total) * 100);

  // Memory usage %
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memoryUsage = Math.round((usedMem / totalMem) * 100);

  return {
    cpuUsage,
    memoryUsage,
    // Additional useful context
    uptimeSeconds: Math.round(os.uptime()),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Helper – calculates idle time for a single CPU core.
 */
function idleCpu(cpu: any) {
  // The `times` object contains user, sys, idle, etc. We sum user+sys to get
  // non‑idle time, then compare with total elapsed time to derive usage.
  const idle = cpu.times.idle;
  // const total = cpu.times.user + cpu.times.sys + idle;
  // This simple approach works for a single snapshot; the caller will compute
  // the delta over time if needed.
  return idle;
}

// -------------------------------------------------------------------
// Auto‑start the periodic recording when this module is first loaded.
// -------------------------------------------------------------------
const RECORDING_INTERVAL_MS = 30_000; // 30 seconds
let recordingInterval: NodeJS.Timeout | undefined;

function startPeriodicRecording() {
  if (recordingInterval) return; // already running
  recordingInterval = setInterval(() => {
    const metrics = captureMetrics();
    const history = readHistory();
    history.push({ ...metrics, id: Date.now() });
    writeHistory(history);
  }, RECORDING_INTERVAL_MS);
}

// Start recording as soon as the module is imported (server side only)
if (typeof window === 'undefined') {
  // Only on Node.js (i.e., server)
  startPeriodicRecording();
}

export default {
  captureMetrics,
  startPeriodicRecording,
  readHistory,
  writeHistory,
};
