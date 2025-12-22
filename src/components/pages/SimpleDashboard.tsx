'use client';

import { useEffect, useState } from 'react';
import { useSystemMetrics } from '@/hooks/useSystemMetrics';
import { useWebSocket } from "@/hooks/use-websocket";

export default function SimpleDashboard() {
  const { metrics } = useSystemMetrics();
  const { isConnected } = useWebSocket();
  const [localTime, setLocalTime] = useState('');

  useEffect(() => {
    setLocalTime(new Date().toLocaleTimeString());
    const timer = setInterval(() => {
      setLocalTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Real-time system monitoring</p>
      </div>

      {/* Status Bar */}
      <div className="rounded-lg border bg-white dark:bg-gray-900 p-4 flex items-center justify-between" style={{borderColor: 'hsl(214.3 31.8% 91.4%)'}}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
          <span className="font-medium text-gray-900 dark:text-white">{isConnected ? '✓ Connected' : '✗ Disconnected'}</span>
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400" suppressHydrationWarning>
          {localTime}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Usage */}
        <div className="rounded-lg border bg-white dark:bg-gray-900 p-6" style={{borderColor: 'hsl(214.3 31.8% 91.4%)'}}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">CPU Usage</h3>
            <span className="text-2xl">📊</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{metrics?.cpuUsage.toFixed(1) || '0'}%</div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(metrics?.cpuUsage || 0, 100)}%` }}
            />
          </div>
        </div>

        {/* Memory */}
        <div className="rounded-lg border bg-white dark:bg-gray-900 p-6" style={{borderColor: 'hsl(214.3 31.8% 91.4%)'}}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Memory</h3>
            <span className="text-2xl">💾</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{metrics?.memoryUsage.toFixed(1) || '0'}%</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            {metrics?.memoryUsed} / {metrics?.memoryTotal} MB
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(metrics?.memoryUsage || 0, 100)}%` }}
            />
          </div>
        </div>

        {/* Uptime */}
        <div className="rounded-lg border bg-white dark:bg-gray-900 p-6" style={{borderColor: 'hsl(214.3 31.8% 91.4%)'}}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Uptime</h3>
            <span className="text-2xl">⏱️</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatUptime(metrics?.uptime || 0)}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">System running</div>
        </div>

        {/* CPU Cores */}
        <div className="rounded-lg border bg-white dark:bg-gray-900 p-6" style={{borderColor: 'hsl(214.3 31.8% 91.4%)'}}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">CPU Cores</h3>
            <span className="text-2xl">⚙️</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{metrics?.cpuCores || '?'}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">Available</div>
        </div>
      </div>

      {/* System Info */}
      {metrics && (
        <div className="rounded-lg border bg-white dark:bg-gray-900 p-6" style={{borderColor: 'hsl(214.3 31.8% 91.4%)'}}>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">System Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">CPU Usage</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.cpuUsage.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Memory</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.memoryUsage.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Memory Used</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.memoryUsed} MB</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Memory</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.memoryTotal} MB</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">CPU Cores</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.cpuCores}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">{formatUptime(metrics.uptime)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Load Average */}
      {metrics?.loadAverage && (
        <div className="rounded-lg border bg-white dark:bg-gray-900 p-6" style={{borderColor: 'hsl(214.3 31.8% 91.4%)'}}>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Load Average</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{metrics.loadAverage[0].toFixed(2)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">1 minute</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{metrics.loadAverage[1].toFixed(2)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">5 minutes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{metrics.loadAverage[2].toFixed(2)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">15 minutes</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
