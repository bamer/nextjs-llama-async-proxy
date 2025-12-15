'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useWebSocket } from '../websocket/WebSocketManager';

import { TimeSeriesChart, MetricCard } from '../ui/Charts';

// Ensure this is an ES module

const DashboardPage = () => {
  const { isConnected, lastMessage, connectionStatus } = useWebSocket();
  const [metrics, setMetrics] = useState([
    { title: 'Active Models', value: '0', unit: 'Models', icon: '🤖', trend: 0 },
    { title: 'Total Requests', value: '0', unit: 'Requests', icon: '📊', trend: 0 },
    { title: 'Avg Response Time', value: '0ms', unit: 'ms', icon: '⚡', trend: 0 },
    { title: 'Connection Status', value: connectionStatus, unit: '', icon: isConnected ? '🟢' : '🔴', trend: 0 },
  ]);

  // Real-time chart data
  const [cpuHistory, setCpuHistory] = useState<Array<{name: string, value: number}>>([]);
  const [memoryHistory, setMemoryHistory] = useState<Array<{name: string, value: number}>>([]);
  const [requestsHistory, setRequestsHistory] = useState<Array<{name: string, value: number}>>([]);

  // Update metrics when WebSocket data arrives
  const updateMetrics = useCallback(() => {
    if (lastMessage && lastMessage.type === 'status' && lastMessage.data) {
      const data = lastMessage.data;

      // Update metrics
      setMetrics([
        { title: 'Active Models', value: data.activeModels?.toString() || '0', unit: 'Models', icon: '🤖', trend: 0 },
        { title: 'Total Requests', value: data.totalRequests?.toString() || '0', unit: 'Requests', icon: '📊', trend: 0 },
        { title: 'Avg Response Time', value: `${data.avgResponseTime || 0}ms`, unit: 'ms', icon: '⚡', trend: 0 },
        { title: 'Connection Status', value: connectionStatus, unit: '', icon: isConnected ? '🟢' : '🔴', trend: 0 },
      ]);

      // Update real-time charts with simulated data
      const cpuUsage = data.cpuUsage || 0;
      const memoryUsage = data.memoryUsage || 0;
      const requests = data.totalRequests || 0;

      const timestamp = new Date().toLocaleTimeString();
      setCpuHistory(prev => [...prev.slice(-19), { name: timestamp, value: cpuUsage }]);
      setMemoryHistory(prev => [...prev.slice(-19), { name: timestamp, value: memoryUsage }]);
      setRequestsHistory(prev => [...prev.slice(-19), { name: timestamp, value: requests }]);
    }
  }, [lastMessage, connectionStatus, isConnected]);

  useEffect(() => {
    updateMetrics();
  }, [updateMetrics]);

  return (
    <div className="dashboard-page">
      <h1 className="text-3xl font-bold mb-8 text-foreground">Dashboard</h1>
       
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
           <div key={index} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:shadow-2xl transition-all duration-500 animate-fade-in-up shadow-xl hover:-translate-y-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-foreground">{metric.title}</h3>
              <span className="text-2xl">{metric.icon}</span>
            </div>
            <div className="mb-4">
              <p className="text-3xl font-bold text-foreground">{metric.value}</p>
              <p className="text-sm text-muted-foreground">{metric.unit}</p>
            </div>
             <div className="flex justify-between items-center">
               <span className={`text-sm ${metric.trend > 0 ? 'text-success' : metric.trend < 0 ? 'text-danger' : 'text-muted-foreground'}`}>
                 {metric.trend > 0 ? '+' : ''}{metric.trend}
               </span>
               <span className="text-xs text-muted-foreground">Trend</span>
             </div>
          </div>
        ))}
      </div>

      {/* Real-time Charts */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-foreground">Real-time Performance</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:shadow-2xl transition-all duration-500 animate-fade-in-up shadow-xl hover:-translate-y-1">
             <h3 className="text-lg font-semibold mb-4 text-foreground">CPU Usage (%)</h3>
             <TimeSeriesChart data={cpuHistory} color="hsl(var(--primary))" height={200} />
              <div className="mt-4 text-sm text-muted-foreground" suppressHydrationWarning>
                Current: {cpuHistory[cpuHistory.length - 1]?.value.toFixed(1) || '0.0'}%
              </div>
           </div>

            <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:shadow-2xl transition-all duration-500 animate-fade-in-up shadow-xl hover:-translate-y-1">
             <h3 className="text-lg font-semibold mb-4 text-foreground">Memory Usage (%)</h3>
             <TimeSeriesChart data={memoryHistory} color="hsl(var(--success))" height={200} />
              <div className="mt-4 text-sm text-muted-foreground" suppressHydrationWarning>
                Current: {memoryHistory[memoryHistory.length - 1]?.value.toFixed(1) || '0.0'}%
              </div>
           </div>

            <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:shadow-2xl transition-all duration-500 animate-fade-in-up shadow-xl hover:-translate-y-1">
             <h3 className="text-lg font-semibold mb-4 text-foreground">Requests/min</h3>
             <TimeSeriesChart data={requestsHistory} color="hsl(var(--warning))" height={200} />
              <div className="mt-4 text-sm text-muted-foreground" suppressHydrationWarning>
                Current: {requestsHistory[requestsHistory.length - 1]?.value || 0}
              </div>
           </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-foreground">Recent Activity</h2>
         <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:shadow-2xl transition-all duration-500 animate-fade-in-up shadow-xl hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <span className="text-foreground font-medium">Real-time Activity Feed</span>
             <div className="flex items-center gap-2">
               <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-danger'}`}></span>
               <span className="text-sm text-muted-foreground">
                 {isConnected ? 'Connected' : 'Disconnected'}
               </span>
             </div>
          </div>
           <div className="mt-4 text-sm text-muted-foreground" suppressHydrationWarning>
             {lastMessage ? `Last update: ${new Date(lastMessage.timestamp).toLocaleTimeString()}` : 'Waiting for data...'}
           </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;