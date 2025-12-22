'use client';

import { useEffect, useState } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { useStore } from '@/lib/store';
import { MetricsCard } from '@/components/ui/MetricsCard';
import { WebSocketStatus } from '@/components/ui/WebSocketStatus';
import { Card, CardContent, Typography, Box, GridLegacy, Divider, Chip, LinearProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


export default function ModernDashboard() {
  const { requestMetrics, requestModels, requestLogs, isConnected } = useWebSocket();
  const metrics = useStore((state) => state.metrics);
  const models = useStore((state) => state.models);
  const logs = useStore((state) => state.logs);
  const { isDark } = useTheme();
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial data load
    requestMetrics();
    requestModels();
    requestLogs();
    
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, [requestMetrics, requestModels, requestLogs]);

  useEffect(() => {
    if (metrics) {
      setChartData(prev => {
        const timestamp = new Date().toLocaleTimeString();
        const newData = [...prev, {
          timestamp,
          cpu: metrics.cpuUsage,
          memory: metrics.memoryUsage,
          requests: metrics.totalRequests
        }];
        return newData.slice(-20); // Keep last 20 data points
      });
    }
  }, [metrics]);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'success';
      case 'loading': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>Loading Dashboard...</Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h3" component="h1" fontWeight="bold">
            Llama Runner Pro Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Real-time AI Model Management & Monitoring
          </Typography>
        </motion.div>
        <WebSocketStatus />
      </Box>

      <Divider sx={{ my: 4, borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <MetricsCard />
      </motion.div>

      <Box sx={{ mt: 6 }} />

      {/* Charts Section */}
      <GridLegacy container spacing={4}>
        {/* CPU & Memory Chart */}
        <GridLegacy item key="cpu-chart" xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Card
              sx={{ 
                height: '100%',
                background: isDark ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                boxShadow: isDark ? '0 8px 30px rgba(0, 0, 0, 0.3)' : '0 8px 30px rgba(0, 0, 0, 0.1)'
              }}
            >
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  System Performance
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Real-time CPU and Memory usage
                </Typography>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"} />
                      <XAxis dataKey="timestamp" stroke={isDark ? "#cbd5e1" : "#64748b"} />
                      <YAxis stroke={isDark ? "#cbd5e1" : "#64748b"} />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: isDark ? '#1e293b' : '#ffffff',
                          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                          borderRadius: '8px',
                          color: isDark ? '#f1f5f9' : '#1e293b'
                        }}
                        labelStyle={{ color: isDark ? '#cbd5e1' : '#64748b' }}
                      />
                      <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCpu)" name="CPU Usage" />
                      <Area type="monotone" dataKey="memory" stroke="#a855f7" fillOpacity={1} fill="url(#colorMemory)" name="Memory Usage" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="text.secondary">No chart data available</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </GridLegacy>

        {/* System Info */}
        <GridLegacy item key="system-info" xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Card
              sx={{ 
                height: '100%',
                background: isDark ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                boxShadow: isDark ? '0 8px 30px rgba(0, 0, 0, 0.3)' : '0 8px 30px rgba(0, 0, 0, 0.1)'
              }}
            >
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  System Information
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Current system status
                </Typography>
                <Box sx={{ spaceY: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Connection Status</Typography>
                    <Chip 
                      label={isConnected ? 'Connected' : 'Disconnected'}
                      color={isConnected ? 'success' : 'error'}
                      size="small"
                      variant="filled"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Uptime</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {metrics ? formatUptime(metrics.uptime) : 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Active Models</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {metrics ? metrics.activeModels : '0'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Total Requests</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {metrics ? metrics.totalRequests : '0'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </GridLegacy>
      </GridLegacy>

      <Box sx={{ mt: 6 }} />

      {/* Models Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Typography variant="h5" fontWeight="bold" mb={3}>
          Active Models
        </Typography>
        <GridLegacy container spacing={3}>
          {models.slice(0, 4).map((model) => (
            <GridLegacy item key={model.id} xs={12} sm={6} md={4} lg={3}>
              <Card
                sx={{ 
                  height: '100%',
                  background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: isDark ? '0 12px 24px rgba(0, 0, 0, 0.2)' : '0 12px 24px rgba(0, 0, 0, 0.1)'
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {model.name}
                    </Typography>
                    <Chip 
                      label={model.status}
                      color={getStatusColor(model.status) as any}
                      size="small"
                      variant="filled"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {model.type}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Created: {new Date(model.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate"
                    value={model.status === 'running' ? 100 : model.status === 'loading' ? 50 : 0}
                    color={getStatusColor(model.status) as any}
                    sx={{ height: '4px', borderRadius: '2px' }}
                  />
                </CardContent>
              </Card>
            </GridLegacy>
          ))}
        </GridLegacy>
      </motion.div>

      <Box sx={{ mt: 6 }} />

      {/* Recent Logs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Typography variant="h5" fontWeight="bold" mb={3}>
          Recent Activity
        </Typography>
        <Card
          sx={{ 
            background: isDark ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
            boxShadow: isDark ? '0 8px 30px rgba(0, 0, 0, 0.3)' : '0 8px 30px rgba(0, 0, 0, 0.1)'
          }}
        >
          <CardContent>
            {logs.length > 0 ? (
              <Box sx={{ maxHeight: 300, overflowY: 'auto', pr: 2 }}>
                {logs.slice(0, 10).map((log, index) => (
                  <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Chip 
                        label={log.level}
                        color={log.level === 'error' ? 'error' : log.level === 'warn' ? 'warning' : log.level === 'info' ? 'info' : 'default'}
                        size="small"
                        variant="filled"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.primary">
                      {log.message}
                    </Typography>
                    {log.context && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        {JSON.stringify(log.context)}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography color="text.secondary" textAlign="center" py={4}>
                No recent activity
              </Typography>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
}
