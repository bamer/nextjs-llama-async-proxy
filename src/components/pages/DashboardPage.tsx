'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '../websocket/WebSocketManager';
import { RealTimeStatusBadge } from '@/components/ui/RealTimeStatusBadge';
import { TimeSeriesChart } from '@/components/ui/Charts';
import { MetricCard, NotificationCard, UserCard, ChartContainer } from '@/components/ui';

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
          <MetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            unit={metric.unit}
            icon={<span className="text-2xl">{metric.icon}</span>}
            trend={metric.trend}
            color={index === 0 ? 'primary' : index === 1 ? 'info' : index === 2 ? 'warning' : 'success'}
          />
        ))}
      </div>

      {/* Real-time Charts */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-foreground">Real-time Performance</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartContainer
            title="System Uptime (%)"
            subtitle={`Current: ${cpuHistory[cpuHistory.length - 1]?.value.toFixed(1) || '0.0'}%`}
            height={280}
          >
            <TimeSeriesChart data={cpuHistory} color="hsl(var(--primary))" height={200} />
          </ChartContainer>

          <ChartContainer
            title="Storage Used (%)"
            subtitle={`Current: ${memoryHistory[memoryHistory.length - 1]?.value.toFixed(1) || '0.0'}%`}
            height={280}
          >
            <TimeSeriesChart data={memoryHistory} color="hsl(var(--success))" height={200} />
          </ChartContainer>

          <ChartContainer
            title="Requests/min"
            subtitle={`Current: ${requestsHistory[requestsHistory.length - 1]?.value || 0}`}
            height={280}
          >
            <TimeSeriesChart data={requestsHistory} color="hsl(var(--warning))" height={200} />
          </ChartContainer>
        </div>
      </div>

      {/* Users Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-foreground">Active Users</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.slice(0, 6).map((user) => (
            <UserCard
              key={user.id}
              id={user.id}
              name={user.name}
              status={user.status}
              lastSeen={user.lastSeen}
              activity={user.activity}
            />
          ))}
        </div>
      </div>

      {/* Notifications Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-foreground">Notifications</h2>
        <div className="space-y-4">
          {notifications.slice(0, 5).map((notification) => (
            <NotificationCard
              key={notification.id}
              id={notification.id}
              type={notification.type}
              title={notification.title}
              message={notification.message}
              timestamp={notification.timestamp}
              read={notification.read}
            />
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