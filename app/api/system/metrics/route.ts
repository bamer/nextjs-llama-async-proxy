import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  try {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    // Get CPU usage (approximate)
    const cpus = os.cpus();
    const cpuUsage = process.cpuUsage();
    const estimatedCpuPercent = Math.min(
      (cpuUsage.user + cpuUsage.system) / 1000000,
      100
    );

    const metrics = {
      cpuUsage: Math.round(estimatedCpuPercent * 10) / 10,
      memoryUsage: Math.round(memoryUsagePercent * 10) / 10,
      memoryTotal: Math.round(totalMemory / 1024 / 1024), // MB
      memoryUsed: Math.round(usedMemory / 1024 / 1024), // MB
      memoryFree: Math.round(freeMemory / 1024 / 1024), // MB
      uptime: process.uptime(),
      cpuCores: cpus.length,
      loadAverage: os.loadavg(),
      timestamp: Date.now(),
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
