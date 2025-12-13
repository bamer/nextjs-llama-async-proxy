// app/api/monitoring/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as os from 'os';
import * as fs from 'fs';

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    usage: number;
    free: number;
  };
  disk: {
    used: number;
    total: number;
    usage: number;
    free: number;
  };
  network: {
    rx: number;
    tx: number;
    interfaces: string[];
  };
  uptime: number;
  platform: string;
  arch: string;
}

interface ModelMetrics {
  name: string;
  status: 'running' | 'stopped' | 'loading' | 'error' | 'idle';
  memory: number;
  requests: number;
  lastActivity: number;
}

let previousCpuUsage = process.cpuUsage();
let previousTime = process.hrtime.bigint();

function getCpuUsage(): number {
  try {
    const currentCpuUsage = process.cpuUsage();
    const currentTime = process.hrtime.bigint();

    const cpuTimeDiff = (currentCpuUsage.user + currentCpuUsage.system) - (previousCpuUsage.user + previousCpuUsage.system);
    const timeDiff = Number(currentTime - previousTime) / 1000000; // Convert to milliseconds

    const cpuUsagePercent = (cpuTimeDiff / timeDiff / 1000) * 100; // Percentage

    previousCpuUsage = currentCpuUsage;
    previousTime = currentTime;

    return Math.min(100, Math.max(0, cpuUsagePercent));
  } catch (error) {
    return 0;
  }
}

function getMemoryUsage(): { used: number; total: number; usage: number; free: number } {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const usagePercent = (usedMemory / totalMemory) * 100;

  return {
    used: Math.round(usedMemory / 1024 / 1024 / 1024 * 100) / 100, // GB
    total: Math.round(totalMemory / 1024 / 1024 / 1024 * 100) / 100, // GB
    usage: Math.round(usagePercent * 100) / 100,
    free: Math.round(freeMemory / 1024 / 1024 / 1024 * 100) / 100 // GB
  };
}

function getDiskUsage(): { used: number; total: number; usage: number; free: number } {
  try {
    // Get disk usage for the current working directory
    const stats = fs.statSync('.');
    // Mock realistic values - in production, use system calls or external libraries
    const total = 500; // GB
    const used = Math.random() * 200 + 100; // 100-300 GB used
    const usage = (used / total) * 100;

    return {
      used: Math.round(used * 100) / 100,
      total: total,
      usage: Math.round(usage * 100) / 100,
      free: Math.round((total - used) * 100) / 100
    };
  } catch (error) {
    return {
      used: 120,
      total: 500,
      usage: 24,
      free: 380
    };
  }
}

function getNetworkStats(): { rx: number; tx: number; interfaces: string[] } {
  const interfaces = Object.keys(os.networkInterfaces());
  // Mock network stats - in production, track actual network usage over time
  return {
    rx: Math.floor(Math.random() * 1000000) + 500000,
    tx: Math.floor(Math.random() * 800000) + 200000,
    interfaces
  };
}

function getModelMetrics(): ModelMetrics[] {
  // Mock model metrics - in production, query actual running model processes
  return [
    {
      name: 'llama-2-7b-chat',
      status: 'running',
      memory: 3.2,
      requests: 45,
      lastActivity: Date.now() - 30000
    },
    {
      name: 'mistral-7b',
      status: 'idle',
      memory: 0,
      requests: 12,
      lastActivity: Date.now() - 300000
    }
  ];
}

export async function GET(req: NextRequest) {
  try {
    const metrics = {
      system: {
        cpu: {
          usage: getCpuUsage(),
          cores: os.cpus().length,
          loadAverage: os.loadavg()
        },
        memory: getMemoryUsage(),
        disk: getDiskUsage(),
        network: getNetworkStats(),
        uptime: os.uptime(),
        platform: os.platform(),
        arch: os.arch()
      },
      models: getModelMetrics(),
      timestamp: Date.now()
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Monitoring error:', error);
    return NextResponse.json({ error: 'Failed to fetch monitoring data' }, { status: 500 });
  }
}