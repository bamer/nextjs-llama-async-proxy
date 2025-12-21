'use client';

import React, { useEffect, useState } from 'react';
import { useSystemMetrics } from '@/hooks/useSystemMetrics';
import { useWebSocket } from '../websocket/WebSocketManager';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MetricPoint {
  timestamp: number;
  value: number;
}

export default function DashboardPageV2() {
  const { metrics } = useSystemMetrics();
  const { isConnected } = useWebSocket();
  const [history, setHistory] = useState<MetricPoint[]>([]);

  useEffect(() => {
    if (metrics) {
      setHistory((prev) => {
        const updated = [...prev, { timestamp: metrics.timestamp, value: metrics.cpuUsage }];
        return updated.slice(-60); // Keep last 60 data points
      });
    }
  }, [metrics]);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  const chartData = history.map((point) => ({
    time: new Date(point.timestamp).toLocaleTimeString(),
    cpu: point.value,
  }));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold gradient-text">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Real-time system monitoring and analytics</p>
      </div>

      {/* Status Bar */}
      <div className="rounded-lg border bg-white dark:bg-gray-900 p-4 flex items-center justify-between" style={{borderColor: 'hsl(214.3 31.8% 91.4%)'}}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
          <span className="font-medium">{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        <span className="text-sm" style={{color: 'hsl(215.4 16.3% 46.9%)'}} suppressHydrationWarning>
          {new Date().toLocaleTimeString()}
        </span>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Usage */}
        <div className="rounded-lg border bg-white dark:bg-gray-900 p-6 space-y-4" style={{borderColor: 'hsl(214.3 31.8% 91.4%)'}}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{color: 'hsl(215.4 16.3% 46.9%)'}}>CPU Usage</h3>
            <span className="text-2xl">📊</span>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold">{metrics?.cpuUsage.toFixed(1) || '0'}%</div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(metrics?.cpuUsage || 0, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="rounded-lg border bg-white dark:bg-gray-900 p-6 space-y-4" style={{borderColor: 'hsl(214.3 31.8% 91.4%)'}}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{color: 'hsl(215.4 16.3% 46.9%)'}}>Memory</h3>
            <span className="text-2xl">💾</span>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold">{metrics?.memoryUsage.toFixed(1) || '0'}%</div>
            <div className="text-xs" style={{color: 'hsl(215.4 16.3% 46.9%)'}}>
              {metrics?.memoryUsed} / {metrics?.memoryTotal} MB
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(metrics?.memoryUsage || 0, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Uptime */}
        <div className="rounded-lg border bg-white dark:bg-gray-900 p-6 space-y-4" style={{borderColor: 'hsl(214.3 31.8% 91.4%)'}}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{color: 'hsl(215.4 16.3% 46.9%)'}}>Uptime</h3>
            <span className="text-2xl">⏱️</span>
          </div>
          <div className="space-y-2">
            <div className="text-lg font-bold">{formatUptime(metrics?.uptime || 0)}</div>
            <div className="text-xs" style={{color: 'hsl(215.4 16.3% 46.9%)'}}>System running</div>
          </div>
        </div>

        {/* CPU Cores */}
        <div className="rounded-lg border bg-white dark:bg-gray-900 p-6 space-y-4" style={{borderColor: 'hsl(214.3 31.8% 91.4%)'}}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{color: 'hsl(215.4 16.3% 46.9%)'}}>CPU Cores</h3>
            <span className="text-2xl">⚙️</span>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold">{metrics?.cpuCores || '?'}</div>
            <div className="text-xs" style={{color: 'hsl(215.4 16.3% 46.9%)'}}>Available cores</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Usage Chart */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">CPU Usage Over Time</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCpu)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">Loading chart data...</div>
          )}
        </div>

        {/* System Info */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold mb-4">System Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-sm text-muted-foreground">CPU Usage</span>
              <span className="font-semibold">{metrics?.cpuUsage.toFixed(1) || '0'}%</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-sm text-muted-foreground">Memory Usage</span>
              <span className="font-semibold">{metrics?.memoryUsage.toFixed(1) || '0'}%</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-sm text-muted-foreground">Memory Used</span>
              <span className="font-semibold">{metrics?.memoryUsed} MB</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-sm text-muted-foreground">Memory Total</span>
              <span className="font-semibold">{metrics?.memoryTotal} MB</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-sm text-muted-foreground">CPU Cores</span>
              <span className="font-semibold">{metrics?.cpuCores}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">System Uptime</span>
              <span className="font-semibold">{formatUptime(metrics?.uptime || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Load Average */}
      {metrics?.loadAverage && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Load Average</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics.loadAverage[0].toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">1 min</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{metrics.loadAverage[1].toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">5 min</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{metrics.loadAverage[2].toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">15 min</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
