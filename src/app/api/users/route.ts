import logger from '@/lib/logger';
import { spawn } from 'child_process';
import { Buffer } from 'buffer';

const MAX_RETRIES = 7;
const BASE_DELAY_MS = 1000;
const PLATFORM_CMDS: Record<string, string[]> = {
  win32: ['powershell', '-NoProfile', '-Command', 'Get-Process | Select-Object -First 10'],
  linux: ['ps', '-eo', 'pid,user,comm,%cpu,%mem', '--no-headers', 'head', '-n', '10'],
  darwin: ['ps', '-eo', 'pid,user,comm,%cpu,%mem', '--no-headers', 'head', '-n', '10'],
};

const platform = process.platform;
if (!PLATFORM_CMDS[platform]) {
  throw new Error(`Unsupported platform: ${platform}`);
}

type RawProcess = {
  pid: number;
  name: string;
  user: string;
  cpu: number;
  memPercent: number;
  memoryMb: number;
  command: string;
};

type User = {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: string;
  activity: string;
};

/** Minimal fallback data used only when all fetch attempts fail */
const MINIMAL_FALLBACK_USERS: User[] = [
  {
    id: 'fallback',
    name: 'System Data Unavailable',
    status: 'offline',
    lastSeen: new Date().toISOString(),
    activity: 'Unable to fetch real process data after all retries',
  },
];

async function execCommand(args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(args[0], args.slice(1), { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data: string) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data: string) => {
      stderr += data.toString();
    });

    child.on('error', (err: Error) => reject(err));
    child.on('close', (code: number) => {
      if (code !== 0) {
        logger.warn(`Process command exited with code ${code}`);
      }
      resolve({ stdout, stderr });
    });
  });
}

function parseWindows(output: string): RawProcess[] {
  try {
    const processes = JSON.parse(output) as Array<{
      Id: number;
      ProcessName: string;
      CPUUsage: number;
      WorkingSetSize: number;
    }>;
    return processes.map(p => ({
      pid: p.Id,
      name: p.ProcessName,
      user: 'SYSTEM',
      cpu: p.CPUUsage,
      memPercent: 0,
      memoryMb: p.WorkingSetSize / (1024 * 1024),
      command: p.ProcessName,
    }));
  } catch (e) {
    logger.error('Failed to parse Windows process JSON', e);
    return [];
  }
}

function parseUnix(output: string): RawProcess[] {
  const lines = output.trim().split('\n').filter(l => l.trim().length > 0);
  const processes: RawProcess[] = [];

  lines.forEach(line => {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 5) return;
    const pid = parseInt(parts[0], 10);
    const user = parts[1] || 'unknown';
    const cpu = parseFloat(parts[2]) || 0;
    const memPercent = parseFloat(parts[3]) || 0;
    const command = parts.slice(4).join(' ') || 'Unknown';
    const memoryMb = (memPercent * 1024);
    processes.push({
      pid,
      name: command,
      user,
      cpu,
      memPercent,
      memoryMb: memoryMb / 1024,
      command,
    });
  });

  return processes;
}

async function fetchRawProcesses(): Promise<RawProcess[]> {
  const args = PLATFORM_CMDS[platform];
  try {
    const { stdout, stderr } = await execCommand(args);
    if (stderr) {
      logger.warn(`Command stderr on ${platform}: ${stderr}`);
    }
    if (platform === 'win32') {
      return parseWindows(stdout);
    } else {
      return parseUnix(stdout);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`Failed to fetch processes on ${platform}: ${msg}`, err);
    throw err;
  }
}

function mapToUsers(raw: RawProcess[]): User[] {
  return raw.map(p => {
    const status: User['status'] = p.cpu < 0.1 ? 'away' : p.cpu === 0 ? 'offline' : 'online';
    const activity = `PID ${p.pid}: ${p.cpu.toFixed(1)}% CPU, ${p.memoryMb.toFixed(1)} MB`;
    return {
      id: p.pid.toString(),
      name: p.name,
      status,
      lastSeen: new Date().toISOString(),
      activity,
    };
  });
}

async function getSystemUsers(): Promise<User[]> {
  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    try {
      const raw = await fetchRawProcesses();
      if (raw.length > 0) {
        logger.debug(`Successfully fetched ${raw.length} processes on attempt ${attempt + 1}`);
        return mapToUsers(raw);
      }
      logger.warn(`Process fetch returned empty list (attempt ${attempt + 1})`);
    } catch (err) {
      // error already logged inside fetchRawProcesses
    }
    attempt++;
    const jitter = Math.random() * 200;
    const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1) + jitter;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  logger.info('All process fetch attempts exhausted; using minimal fallback');
  return MINIMAL_FALLBACK_USERS;
}

function createSSEChunk(type: string, data: User[], timestamp: number): Buffer {
  const payload = { type, data, timestamp };
  return Buffer.from(`data: ${JSON.stringify(payload)}\n\n`);
}

export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const users = await getSystemUsers();
          const chunk = createSSEChunk('users', users, Date.now());
          controller.enqueue(chunk);
          const interval = 5000 + Math.random() * 5000;
          await new Promise(resolve => setTimeout(resolve, interval));
        }
      } catch (error) {
        logger.error('SSE stream error:', error);
        controller.close();
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}