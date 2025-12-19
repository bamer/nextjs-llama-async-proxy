'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '../websocket/WebSocketManager';
import { RealTimeStatusBadge } from '@/components/ui/RealTimeStatusBadge';

interface User {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: string;
  activity: string;
}

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface AnalyticsData {
  totalUsers: number;
  activeSessions: number;
  requestsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
  bandwidthUsage: number;
  storageUsed: number;
  timestamp: string;
}

const DashboardPage = () => {
  const { isConnected, lastMessage, connectionStatus } = useWebSocket();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [metrics, setMetrics] = useState([
    { title: 'Active Sessions', value: '0', unit: 'Sessions', icon: '👥', trend: 0 },
    { title: 'Requests/min', value: '0', unit: 'req/min', icon: '📊', trend: 0 },
    { title: 'Avg Response Time', value: '0ms', unit: 'ms', icon: '⚡', trend: 0 },
    { title: 'Connection Status', value: connectionStatus, unit: '', icon: isConnected ? '🟢' : '🔴', trend: 0 },
  ]);

  // Real-time chart data
  const [cpuHistory, setCpuHistory] = useState<Array<{name: string, value: number}>>([]);
  const [memoryHistory, setMemoryHistory] = useState<Array<{name: string, value: number}>>([]);
  const [requestsHistory, setRequestsHistory] = useState<Array<{name: string, value: number}>>([]);

  const updateMetrics = useCallback(() => {
    if (analytics) {
      const data = analytics;

      setMetrics([
        { title: 'Active Sessions', value: data.activeSessions?.toString() || '0', unit: 'Sessions', icon: '👥', trend: 0 },
        { title: 'Requests/min', value: data.requestsPerMinute?.toString() || '0', unit: 'req/min', icon: '📊', trend: 0 },
        { title: 'Avg Response Time', value: `${data.averageResponseTime || 0}ms`, unit: 'ms', icon: '⚡', trend: 0 },
        { title: 'Connection Status', value: connectionStatus, unit: '', icon: isConnected ? '🟢' : '🔴', trend: 0 },
      ]);

      const timestamp = new Date().toLocaleTimeString();
      setCpuHistory(prev => [...prev.slice(-19), { name: timestamp, value: data.uptime }]);
      setMemoryHistory(prev => [...prev.slice(-19), { name: timestamp, value: data.storageUsed }]);
      setRequestsHistory(prev => [...prev.slice(-19), { name: timestamp, value: data.requestsPerMinute }]);
    }
  }, [analytics, connectionStatus, isConnected]);

  useEffect(() => {
    updateMetrics();
  }, [updateMetrics]);

  useEffect(() => {
    const analyticsSource = new EventSource('/api/analytics');
    const usersSource = new EventSource('/api/users');
    const notificationsSource = new EventSource('/api/notifications');

    analyticsSource.onmessage = (event) => {
      const parsed = JSON.parse(event.data);
      if (parsed.type === 'analytics') {
        setAnalytics(parsed.data);
      }
    };

    usersSource.onmessage = (event) => {
      const parsed = JSON.parse(event.data);
      if (parsed.type === 'users') {
        setUsers(parsed.data);
      }
    };

    notificationsSource.onmessage = (event) => {
      const parsed = JSON.parse(event.data);
      if (parsed.type === 'notifications') {
        setNotifications(parsed.data);
      }
    };

    return () => {
      analyticsSource.close();
      usersSource.close();
      notificationsSource.close();
    };
  }, []);

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
            <h3 className="text-lg font-semibold mb-4 text-foreground">System Uptime (%)</h3>
            <TimeSeriesChart data={cpuHistory} color="hsl(var(--primary))" height={200} />
            <div className="mt-4 text-sm text-muted-foreground" suppressHydrationWarning>
              Current: {cpuHistory[cpuHistory.length - 1]?.value.toFixed(1) || '0.0'}%
            </div>
          </div>

          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:shadow-2xl transition-all duration-500 animate-fade-in-up shadow-xl hover:-translate-y-1">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Storage Used (%)</h3>
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

      {/* Users Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-foreground">Active Users</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.slice(0, 6).map((user) => (
            <div key={user.id} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:shadow-2xl transition-all duration-500 animate-fade-in-up shadow-xl hover:-translate-y-1">
              <div className="flex items-center gap-4">
                <RealTimeStatusBadge status={user.status} label={user.name} />
                <div>
                  <h3 className="font-semibold text-foreground">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">{user.activity}</p>
                  <p className="text-xs text-muted-foreground">{user.status}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-foreground">Notifications</h2>
        <div className="space-y-4">
          {notifications.slice(0, 5).map((notification) => (
            <div key={notification.id} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:shadow-2xl transition-all duration-500 animate-fade-in-up shadow-xl hover:-translate-y-1 {!notification.read && 'border-l-4 border-l-primary'}">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${notification.type === 'error' ? 'bg-danger/20 text-danger' : notification.type === 'warning' ? 'bg-warning/20 text-warning' : notification.type === 'success' ? 'bg-success/20 text-success' : 'bg-info/20 text-info'}`}>
                      {notification.type}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(notification.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{notification.title}</h3>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                </div>
              </div>
            </div>
          ))}
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
            {analytics ? `Last analytics update: ${new Date(analytics.timestamp).toLocaleTimeString()}` : 'Waiting for data...'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;