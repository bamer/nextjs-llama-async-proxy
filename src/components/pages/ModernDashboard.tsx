'use client';

import { useEffect, useState } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { useStore } from '@/lib/store';
import { MetricsCard } from '@/components/ui/MetricsCard';
import { Card, CardContent, Typography, Box, Grid, Divider, Chip, LinearProgress, Button } from '@mui/material';
import { m } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Refresh } from '@mui/icons-material';
import { MONITORING_CONFIG } from '@/config/monitoring.config';


export default function ModernDashboard() {
  const { requestMetrics, requestModels, requestLogs, isConnected } = useWebSocket();
  const metrics = useStore((state) => state.metrics);
  const models = useStore((state) => state.models);
  const logs = useStore((state) => state.logs);
  const { isDark } = useTheme();
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Request data when WebSocket is connected, or use fallback
    if (isConnected) {
      requestMetrics();
      requestModels();
      requestLogs();
      return;
    }

    // If WebSocket is not connected after a delay, use mock data
    const timeoutId = setTimeout(() => {
      if (!isConnected && loading) {
        console.log('WebSocket not connected, using fallback mock data');
        // Generate mock data if WebSocket fails
        useStore.getState().setMetrics({
          activeModels: Math.floor(Math.random() * 5) + 1,
          totalRequests: Math.floor(Math.random() * 1000) + 500,
          avgResponseTime: Math.floor(Math.random() * 500) + 100,
          memoryUsage: Math.floor(Math.random() * 30) + 50,
          cpuUsage: Math.floor(Math.random() * 20) + 5,
          diskUsage: Math.floor(Math.random() * 40) + 30,
          uptime: Math.floor(Math.random() * 100) + 80,
          timestamp: new Date().toISOString()
        });
        
        useStore.getState().setModels([
          {
            id: 'llama-7b',
            name: 'Llama 7B',
            type: 'llama' as const,
            status: 'running' as const,
            parameters: { temperature: 0.7, maxTokens: 2048, topP: 0.9 },
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 3600000).toISOString()
          }
        ]);
        
        useStore.getState().setLogs([
          {
            id: '1',
            level: 'info' as const,
            message: 'Dashboard initialized with fallback data',
            timestamp: new Date().toISOString(),
            context: { source: 'dashboard' }
          },
          {
            id: '2',
            level: 'warn' as const,
            message: 'WebSocket connection failed, using fallback data',
            timestamp: new Date().toISOString(),
            context: { source: 'websocket' }
          }
        ]);
      }
    }, 2000); // 2 second delay before using fallback
    
    return () => clearTimeout(timeoutId);
  }, [isConnected, requestMetrics, requestModels, requestLogs, loading]);

  // Handle connection timeout based on configuration
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading && (!metrics || models.length === 0 || logs.length === 0)) {
        if (MONITORING_CONFIG.MOCK_DATA.ENABLE_FALLBACK && !isConnected) {
          console.log('WebSocket not connected, using fallback mock data');
          // Generate mock data only if WebSocket is not connected
          useStore.getState().setMetrics({
            activeModels: Math.floor(Math.random() * 5) + 1,
            totalRequests: Math.floor(Math.random() * 1000) + 500,
            avgResponseTime: Math.floor(Math.random() * 500) + 100,
            memoryUsage: Math.floor(Math.random() * 30) + 50,
            cpuUsage: Math.floor(Math.random() * 20) + 5,
            diskUsage: Math.floor(Math.random() * 40) + 30,
            uptime: Math.floor(Math.random() * 100) + 80,
            timestamp: new Date().toISOString(),
            // Add GPU mock data only in development
            gpuUsage: Math.floor(Math.random() * 80) + 10,
            gpuMemoryUsage: Math.floor(Math.random() * 70) + 20,
            gpuMemoryTotal: MONITORING_CONFIG.MOCK_DATA.GPU.MEMORY_TOTAL_MB,
            gpuMemoryUsed: Math.floor(Math.random() * 18000) + 5000,
            gpuPowerUsage: Math.floor(Math.random() * 250) + 80,
            gpuPowerLimit: MONITORING_CONFIG.MOCK_DATA.GPU.POWER_LIMIT_W,
            gpuTemperature: Math.floor(Math.random() * 50) + 40,
            gpuName: MONITORING_CONFIG.MOCK_DATA.GPU.NAME
          });
          
          useStore.getState().setModels([
            {
              id: 'llama-7b',
              name: 'Llama 7B',
              type: 'llama' as const,
              status: 'running' as const,
              parameters: { temperature: 0.7, maxTokens: 2048, topP: 0.9 },
              createdAt: new Date(Date.now() - 86400000).toISOString(),
              updatedAt: new Date(Date.now() - 3600000).toISOString()
            }
          ]);
          
          useStore.getState().setLogs([
            {
              id: '1',
              level: 'info' as const,
              message: 'Model loading completed successfully',
              timestamp: new Date().toISOString(),
              context: { source: 'model-manager' }
            },
            {
              id: '2',
              level: 'warn' as const,
              message: 'Using mock data - WebSocket connection failed',
              timestamp: new Date().toISOString(),
              context: { source: 'dashboard' }
            }
          ]);
        } else {
          console.log('WebSocket connection timeout - no mock data in production mode');
        }
        setLoading(false);
      }
    }, MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT);
    
    return () => clearTimeout(timeoutId);
  }, [loading, metrics, models, logs, isConnected]);

  // Generate chart data with GPU metrics
  useEffect(() => {
    if (metrics && metrics.cpuUsage !== undefined) {
      setChartData(prev => {
        // Only add new data point if metrics have actually changed
        const hasChanged = prev.length === 0 || 
                          prev[prev.length - 1].cpu !== metrics.cpuUsage ||
                          prev[prev.length - 1].memory !== metrics.memoryUsage ||
                          prev[prev.length - 1].requests !== metrics.totalRequests ||
                          (metrics.gpuUsage !== undefined && prev[prev.length - 1]?.gpu !== metrics.gpuUsage);
                          
        if (!hasChanged) {
          return prev; // Return same data if no change to prevent infinite loop
        }
        
        const timestamp = new Date().toLocaleTimeString();
        const newData = [...prev, {
          timestamp,
          cpu: metrics.cpuUsage,
          memory: metrics.memoryUsage,
          requests: metrics.totalRequests,
          gpu: metrics.gpuUsage,
          gpuMemory: metrics.gpuMemoryUsage,
          gpuPower: metrics.gpuPowerUsage
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

  // Show clear error state if no data is available
  if (!metrics || models.length === 0 || logs.length === 0) {
    return (
      <Box sx={{ p: 4 }}>
        <Card sx={{ 
          background: isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(241, 245, 249, 0.8)',
          border: `2px dashed ${isDark ? 'rgba(239, 68, 68, 0.5)' : 'rgba(239, 68, 68, 0.3)'}`
        }}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h5" color="error" gutterBottom sx={{ fontWeight: 'bold' }}>
              {MONITORING_CONFIG.REQUIRE_REAL_DATA ? 'No Real Data Available' : 'Connection Failed'}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {MONITORING_CONFIG.REQUIRE_REAL_DATA ? 
                'This dashboard requires a real WebSocket connection.' : 
                'WebSocket connection failed.'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              {MONITORING_CONFIG.REQUIRE_REAL_DATA ? 
                'Please start the WebSocket server to monitor real data.' : 
                'Mock data is disabled in this configuration.'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => window.location.reload()}
                startIcon={<Refresh />}
              >
                Retry Connection
              </Button>
              {MONITORING_CONFIG.REQUIRE_REAL_DATA && (
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => alert(`To enable mock data for development:
1. Set REQUIRE_REAL_DATA: false in monitoring.config.ts
2. Restart the application`)}
                >
                  Development Mode
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <m.div
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
        </m.div>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            {isConnected ? 'WebSocket Connected' : 'WebSocket Disconnected'}
          </Typography>
          <Chip
            label={isConnected ? 'CONNECTED' : 'DISCONNECTED'}
            color={isConnected ? 'success' : 'error'}
            size="small"
            variant="filled"
            sx={{ 
              fontWeight: 'bold',
              animation: !isConnected ? 'pulse 2s infinite' : 'none',
              '@keyframes pulse': {
                '0%': { boxShadow: '0 0 0 0 rgba(255, 82, 82, 0.7)' },
                '70%': { boxShadow: '0 0 0 10px rgba(255, 82, 82, 0)' },
                '100%': { boxShadow: '0 0 0 0 rgba(255, 82, 82, 0)' }
              }
            }}
          />
        </Box>
      </Box>

      <Divider sx={{ my: 4, borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />

      {/* Key Metrics */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <MetricsCard />
      </m.div>

      <Box sx={{ mt: 6 }} />

      {/* GPU Metrics Section */}
      {metrics?.gpuUsage !== undefined && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Typography variant="h5" fontWeight="bold" mb={3}>
            GPU Performance
          </Typography>
          <Grid container spacing={3} mb={4}>
            {/* GPU Usage Card */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{
                  background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                  height: '100%'
                }}
              >
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    GPU Usage
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {metrics.gpuUsage}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.gpuUsage}
                    color={(metrics.gpuUsage || 0) > 80 ? 'error' : (metrics.gpuUsage || 0) > 60 ? 'warning' : 'success'}
                    sx={{ height: '6px', borderRadius: '3px', mt: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {metrics.gpuName || 'GPU'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* GPU Memory Card */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{
                  background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                  height: '100%'
                }}
              >
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    GPU Memory
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {metrics.gpuMemoryUsed ? (metrics.gpuMemoryUsed / 1024).toFixed(1) : '0'} GB / {metrics.gpuMemoryTotal ? (metrics.gpuMemoryTotal / 1024).toFixed(1) : '0'} GB
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.gpuMemoryUsage || 0}
                    color={(metrics.gpuMemoryUsage || 0) > 90 ? 'error' : (metrics.gpuMemoryUsage || 0) > 70 ? 'warning' : 'success'}
                    sx={{ height: '6px', borderRadius: '3px', mt: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {metrics.gpuMemoryUsage}% used
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* GPU Power Card */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{
                  background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                  height: '100%'
                }}
              >
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    GPU Power
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {metrics.gpuPowerUsage} W / {metrics.gpuPowerLimit} W
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={((metrics.gpuPowerUsage ?? 0) / (metrics.gpuPowerLimit ?? 1)) * 100}
                    color={((metrics.gpuPowerUsage ?? 0) / (metrics.gpuPowerLimit ?? 1)) > 0.9 ? 'error' : ((metrics.gpuPowerUsage ?? 0) / (metrics.gpuPowerLimit ?? 1)) > 0.7 ? 'warning' : 'success'}
                    sx={{ height: '6px', borderRadius: '3px', mt: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {(((metrics.gpuPowerUsage ?? 0) / (metrics.gpuPowerLimit ?? 1)) * 100).toFixed(1)}% of limit
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* GPU Temperature Card */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{
                  background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                  height: '100%'
                }}
              >
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    GPU Temperature
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {metrics.gpuTemperature}°C
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.gpuTemperature || 0}
                    color={(metrics.gpuTemperature || 0) > 85 ? 'error' : (metrics.gpuTemperature || 0) > 70 ? 'warning' : 'success'}
                    sx={{ height: '6px', borderRadius: '3px', mt: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {(metrics.gpuTemperature || 0) < 60 ? 'Normal' : (metrics.gpuTemperature || 0) < 80 ? 'Warm' : 'Hot'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </m.div>
      )}

      <Box sx={{ mt: 6 }} />

      {/* Charts Section */}
      <Grid container spacing={4}>
        {/* CPU & Memory Chart */}
        <Grid key="cpu-chart" size={{ xs: 12, md: 8 }}>
          <m.div
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
          </m.div>
        </Grid>

        {/* System Info */}
        <Grid key="system-info" size={{ xs: 12, md: 4 }}>
          <m.div
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
          </m.div>
        </Grid>
      </Grid>

      {/* GPU Chart Section */}
      {metrics?.gpuUsage !== undefined && (
        <Box sx={{ mt: 4 }}>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12 }}>
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <Card
                  sx={{
                    background: isDark ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                    boxShadow: isDark ? '0 8px 30px rgba(0, 0, 0, 0.3)' : '0 8px 30px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      GPU Performance History
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                      Real-time GPU utilization, memory, and power usage
                    </Typography>
                    {chartData.length > 0 && metrics.gpuUsage !== undefined ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorGpuUsage" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorGpuMemory" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorGpuPower" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"} />
                          <XAxis dataKey="timestamp" stroke={isDark ? "#cbd5e1" : "#64748b"} />
                          <YAxis yAxisId="left" orientation="left" stroke={isDark ? "#cbd5e1" : "#64748b"} />
                          <YAxis yAxisId="right" orientation="right" stroke={isDark ? "#cbd5e1" : "#64748b"} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: isDark ? '#1e293b' : '#ffffff',
                              border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                              borderRadius: '8px',
                              color: isDark ? '#f1f5f9' : '#1e293b'
                            }}
                            labelStyle={{ color: isDark ? '#cbd5e1' : '#64748b' }}
                          />
                          <Legend verticalAlign="top" height={36} />
                          <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="gpu"
                            stroke="#10b981"
                            fillOpacity={1}
                            fill="url(#colorGpuUsage)"
                            name="GPU Usage %"
                          />
                          <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="gpuMemory"
                            stroke="#f59e0b"
                            fillOpacity={1}
                            fill="url(#colorGpuMemory)"
                            name="GPU Memory %"
                          />
                          <Area
                            yAxisId="right"
                            type="monotone"
                            dataKey="gpuPower"
                            stroke="#ef4444"
                            fillOpacity={1}
                            fill="url(#colorGpuPower)"
                            name="GPU Power (W)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography color="text.secondary">No GPU chart data available</Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </m.div>
            </Grid>
          </Grid>
        </Box>
      )}

      <Box sx={{ mt: 6 }} />

      {/* Models Section */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Typography variant="h5" fontWeight="bold" mb={3}>
          Active Models
        </Typography>
        <Grid container spacing={3}>
          {models.slice(0, 4).map((model) => (
            <Grid key={model.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
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
            </Grid>
          ))}
        </Grid>
      </m.div>

      <Box sx={{ mt: 6 }} />

      {/* Recent Logs */}
      <m.div
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
      </m.div>
    </Box>
  );
}
