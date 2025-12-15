'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../websocket/WebSocketManager';

interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: number;
}

const MonitoringPage = () => {
  const { isConnected, lastMessage } = useWebSocket();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [metrics, setMetrics] = useState({
    systemMetrics: [
      { name: 'CPU Usage', value: '45%' },
      { name: 'Memory Used', value: '1.2 GB' },
      { name: 'Disk Usage', value: '8.5 GB' },
      { name: 'Network In', value: '2.4 Mbps' },
      { name: 'Network Out', value: '1.7 Mbps' }
    ],
    modelMetrics: [
      { name: 'Active Models', value: '3' },
      { name: 'Model Load Time', value: '2.1s' },
      { name: 'GPU Usage', value: '65%' },
      { name: 'Memory Allocation', value: '7.8 GB' }
    ]
  });

  // Update metrics when WebSocket data arrives or fetch real monitoring data
  const fetchMonitoringData = async () => {
    try {
      const response = await fetch('/api/monitoring');
      if (response.ok) {
        const data = await response.json();
        setMetrics({
          systemMetrics: [
            { name: 'CPU Usage', value: `${data.system.cpu.usage.toFixed(1)}%` },
            { name: 'Memory Used', value: `${data.system.memory.used} GB` },
            { name: 'Disk Usage', value: `${data.system.disk.used} GB` },
            { name: 'Network RX', value: `${(data.system.network.rx / 1000000).toFixed(2)} MB` },
            { name: 'Network TX', value: `${(data.system.network.tx / 1000000).toFixed(2)} MB` }
          ],
          modelMetrics: [
            { name: 'Active Models', value: data.models.filter((m: any) => m.status === 'running').length.toString() },
            { name: 'Total Memory', value: `${data.models.reduce((sum: number, m: any) => sum + m.memory, 0).toFixed(1)} GB` },
            { name: 'Total Requests', value: data.models.reduce((sum: number, m: any) => sum + m.requests, 0).toString() },
            { name: 'Uptime', value: `${Math.floor(data.system.uptime / 3600)}h ${Math.floor((data.system.uptime % 3600) / 60)}m` }
          ]
        });
      }
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    }
  };

  useEffect(() => {
    // Fetch data immediately and then every 30 seconds
    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-500';
      case 'warn': return 'text-yellow-500';
      case 'info': return 'text-blue-500';
      case 'debug': return 'text-gray-500';
      default: return 'text-foreground';
    }
  };

  return (
    <div className="monitoring-page">
      <h1 className="text-3xl font-bold mb-8 text-foreground">Real-time Monitoring</h1>
       
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-300">
          <h2 className="text-xl font-bold mb-6 text-foreground">System Metrics</h2>
          <div className="flex flex-col gap-4">
            {metrics.systemMetrics.map((metric, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-border last:border-b-0">
                <span className="text-muted-foreground font-medium">{metric.name}</span>
                <span className="font-mono text-foreground font-bold">{metric.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-300">
          <h2 className="text-xl font-bold mb-6 text-foreground">Model Performance</h2>
          <div className="flex flex-col gap-4">
            {metrics.modelMetrics.map((metric, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-border last:border-b-0">
                <span className="text-muted-foreground font-medium">{metric.name}</span>
                <span className="font-mono text-foreground font-bold">{metric.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-300">
          <h2 className="text-xl font-bold mb-6 text-foreground">Connection Status</h2>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-4 h-4 rounded-full ${isConnected ? 'bg-success' : 'bg-danger'}`}></div>
            <span className="text-foreground font-medium">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Last update: {lastMessage ? new Date(lastMessage.timestamp).toLocaleTimeString() : 'Never'}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-300">
        <h2 className="text-2xl font-bold mb-6 text-foreground">Live Logs</h2>
        <div className="bg-muted rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">No logs available...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className={`mb-2 ${getLogLevelColor(log.level)}`}>
                <span className="text-muted-foreground">
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>
                <span className="ml-3">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MonitoringPage;