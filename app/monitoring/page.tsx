"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { useStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { Card, CardContent, Typography, Box, Grid, LinearProgress, Chip, IconButton, Tooltip, Divider } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";
import { Refresh, Warning, CheckCircle, Info, Memory, Storage, Timer, NetworkCheck, Computer } from "@mui/icons-material";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

export default function MonitoringPage() {
  const metrics = useStore((state) => state.metrics);
  const { isDark } = useTheme();
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data if no metrics available
  useEffect(() => {
    if (!metrics) {
      const mockMetrics = {
        activeModels: Math.floor(Math.random() * 5) + 1,
        totalRequests: Math.floor(Math.random() * 1000) + 500,
        avgResponseTime: Math.floor(Math.random() * 500) + 100,
        memoryUsage: Math.floor(Math.random() * 30) + 50,
        cpuUsage: Math.floor(Math.random() * 20) + 5,
        diskUsage: Math.floor(Math.random() * 40) + 30,
        uptime: Math.floor(Math.random() * 100) + 80,
        timestamp: new Date().toISOString()
      };
      
      useStore.getState().setMetrics(mockMetrics);
    }
  }, [metrics]);

  // Generate chart data
  useEffect(() => {
    if (metrics) {
      const now = Date.now();
      const newChartData = Array.from({ length: 10 }, (_, i) => ({
        time: new Date(now - (10 - i) * 60000).toLocaleTimeString(),
        cpu: Math.max(5, Math.min(95, metrics.cpuUsage + Math.floor(Math.random() * 20) - 10)),
        memory: Math.max(30, Math.min(90, metrics.memoryUsage + Math.floor(Math.random() * 30) - 15)),
        requests: Math.max(100, metrics.totalRequests - Math.floor(Math.random() * 200))
      }));
      
      setChartData(newChartData);
      setLoading(false);
    }
  }, [metrics]);

  const getStatusColor = (value: number, threshold: number = 80) => {
    if (value > threshold) return 'error';
    if (value > threshold * 0.7) return 'warning';
    return 'success';
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  const handleRefresh = () => {
    console.log('Refreshing monitoring data');
    // In a real app, this would fetch fresh metrics from the server
    if (metrics) {
      // Simulate data refresh
      const updatedMetrics = {
        ...metrics,
        cpuUsage: Math.max(5, Math.min(95, metrics.cpuUsage + Math.floor(Math.random() * 10) - 5)),
        memoryUsage: Math.max(30, Math.min(90, metrics.memoryUsage + Math.floor(Math.random() * 15) - 7)),
        totalRequests: metrics.totalRequests + Math.floor(Math.random() * 50),
        timestamp: new Date().toISOString()
      };
      useStore.getState().setMetrics(updatedMetrics);
    }
  };

  if (loading || !metrics) {
    return (
      <MainLayout>
        <Box sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>Loading Monitoring Data...</Typography>
          <LinearProgress />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ p: 4 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <div>
            <Typography variant="h3" component="h1" fontWeight="bold">
              System Monitoring
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Real-time performance and health monitoring
            </Typography>
          </div>
          <Tooltip title="Refresh metrics">
            <IconButton onClick={handleRefresh} color="primary" size="large">
              <Refresh fontSize="large" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Key Metrics Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ 
              background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Memory color="primary" sx={{ mr: 1, fontSize: '2rem' }} />
                  <Typography variant="h6" fontWeight="bold">Memory Usage</Typography>
                </Box>
                <Typography variant="h3" fontWeight="bold" mb={1}>
                  {metrics.memoryUsage}%
                </Typography>
                <LinearProgress 
                  variant="determinate"
                  value={metrics.memoryUsage}
                  color={getStatusColor(metrics.memoryUsage, 85)}
                  sx={{ height: '8px', borderRadius: '4px', mb: 1 }}
                />
                <Chip 
                  label={metrics.memoryUsage > 85 ? 'High' : metrics.memoryUsage > 70 ? 'Medium' : 'Normal'}
                  color={getStatusColor(metrics.memoryUsage, 85) as any}
                  size="small"
                />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ 
              background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Computer color="secondary" sx={{ mr: 1, fontSize: '2rem' }} />
                  <Typography variant="h6" fontWeight="bold">CPU Usage</Typography>
                </Box>
                <Typography variant="h3" fontWeight="bold" mb={1}>
                  {metrics.cpuUsage}%
                </Typography>
                <LinearProgress 
                  variant="determinate"
                  value={metrics.cpuUsage}
                  color={getStatusColor(metrics.cpuUsage, 90)}
                  sx={{ height: '8px', borderRadius: '4px', mb: 1 }}
                />
                <Chip 
                  label={metrics.cpuUsage > 90 ? 'High' : metrics.cpuUsage > 60 ? 'Medium' : 'Normal'}
                  color={getStatusColor(metrics.cpuUsage, 90) as any}
                  size="small"
                />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ 
              background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Storage color="success" sx={{ mr: 1, fontSize: '2rem' }} />
                  <Typography variant="h6" fontWeight="bold">Disk Usage</Typography>
                </Box>
                <Typography variant="h3" fontWeight="bold" mb={1}>
                  {metrics.diskUsage}%
                </Typography>
                <LinearProgress 
                  variant="determinate"
                  value={metrics.diskUsage}
                  color={getStatusColor(metrics.diskUsage, 95)}
                  sx={{ height: '8px', borderRadius: '4px', mb: 1 }}
                />
                <Chip 
                  label={metrics.diskUsage > 95 ? 'Critical' : metrics.diskUsage > 80 ? 'High' : 'Normal'}
                  color={getStatusColor(metrics.diskUsage, 95) as any}
                  size="small"
                />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ 
              background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <NetworkCheck color="info" sx={{ mr: 1, fontSize: '2rem' }} />
                  <Typography variant="h6" fontWeight="bold">Active Models</Typography>
                </Box>
                <Typography variant="h3" fontWeight="bold" mb={1}>
                  {metrics.activeModels}
                </Typography>
                <LinearProgress 
                  variant="determinate"
                  value={(metrics.activeModels / 10) * 100}
                  color="info"
                  sx={{ height: '8px', borderRadius: '4px', mb: 1 }}
                />
                <Chip 
                  label={`${metrics.activeModels}/10 models active`}
                  color="info"
                  size="small"
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Performance Charts */}
        <Card sx={{ mb: 4, background: isDark ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)', boxShadow: isDark ? '0 8px 30px rgba(0, 0, 0, 0.3)' : '0 8px 30px rgba(0, 0, 0, 0.1)' }}>
          <CardContent>
            <Typography variant="h5" fontWeight="bold" mb={3}>
              Performance Metrics Over Time
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
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
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"} />
                <XAxis dataKey="time" stroke={isDark ? "#cbd5e1" : "#64748b"} />
                <YAxis stroke={isDark ? "#cbd5e1" : "#64748b"} />
                <RechartsTooltip 
                  contentStyle={{
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                    borderRadius: '8px',
                    color: isDark ? '#f1f5f9' : '#1e293b'
                  }}
                  labelStyle={{ color: isDark ? '#cbd5e1' : '#64748b' }}
                />
                <Legend verticalAlign="top" height={36} />
                <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCpu)" name="CPU Usage %" />
                <Area type="monotone" dataKey="memory" stroke="#a855f7" fillOpacity={1} fill="url(#colorMemory)" name="Memory Usage %" />
                <Area type="monotone" dataKey="requests" stroke="#22c55e" fillOpacity={1} fill="url(#colorRequests)" name="Total Requests" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* System Health Summary */}
        <Card sx={{ background: isDark ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)', boxShadow: isDark ? '0 8px 30px rgba(0, 0, 0, 0.3)' : '0 8px 30px rgba(0, 0, 0, 0.1)' }}>
          <CardContent>
            <Typography variant="h5" fontWeight="bold" mb={3}>
              System Health Summary
            </Typography>
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Timer color="success" sx={{ mr: 1, fontSize: '1.5rem' }} />
                  <Typography variant="subtitle1" fontWeight="medium">System Uptime</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="success.main" mb={2}>
                  {formatUptime(metrics.uptime)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle color="success" />
                  <Typography variant="body2" color="text.secondary">
                    System is running smoothly
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <NetworkCheck color="info" sx={{ mr: 1, fontSize: '1.5rem' }} />
                  <Typography variant="subtitle1" fontWeight="medium">Performance Status</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="info.main" mb={2}>
                  {metrics.avgResponseTime}ms avg
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Info color="info" />
                  <Typography variant="body2" color="text.secondary">
                    {metrics.totalRequests} requests processed
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3, borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
            
            {/* Health Indicators */}
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Health Indicators
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {metrics.memoryUsage > 85 ? <Warning color="error" /> : <CheckCircle color="success" />}
                  <Typography variant="body2">Memory: {metrics.memoryUsage}%</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {metrics.cpuUsage > 90 ? <Warning color="error" /> : <CheckCircle color="success" />}
                  <Typography variant="body2">CPU: {metrics.cpuUsage}%</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {metrics.diskUsage > 95 ? <Warning color="error" /> : <CheckCircle color="success" />}
                  <Typography variant="body2">Disk: {metrics.diskUsage}%</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle color="success" />
                  <Typography variant="body2">Models: {metrics.activeModels} active</Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </MainLayout>
  );
}
