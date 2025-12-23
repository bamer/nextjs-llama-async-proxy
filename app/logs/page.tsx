"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { useStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { Card, CardContent, Typography, Box, Chip, TextField, InputAdornment, IconButton, Pagination } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";
import { Search, FilterList, Refresh, Delete, Download } from "@mui/icons-material";

export default function LogsPage() {
  const logs = useStore((state) => state.logs);
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [page, setPage] = useState(1);
  const logsPerPage = 20;

  // Mock data if no logs available
  useEffect(() => {
    if (logs.length === 0) {
      const mockLogs = [
        {
          level: 'info',
          message: 'System initialized successfully',
          timestamp: Date.now(),
          source: 'system'
        },
        {
          level: 'debug',
          message: 'WebSocket connection established',
          timestamp: Date.now() - 60000,
          source: 'websocket'
        },
        {
          level: 'warn',
          message: 'High memory usage detected',
          timestamp: Date.now() - 120000,
          source: 'monitoring'
        },
        {
          level: 'error',
          message: 'Failed to load model: llama-13b',
          timestamp: Date.now() - 300000,
          source: 'model-manager'
        },
        {
          level: 'info',
          message: 'Dashboard loaded',
          timestamp: Date.now() - 60000,
          source: 'ui'
        },
        {
          level: 'debug',
          message: 'API request completed',
          timestamp: Date.now() - 90000,
          source: 'api'
        }
      ];
      
      useStore.getState().setLogs(mockLogs);
    }
  }, [logs.length]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'error';
      case 'warn': return 'warning';
      case 'info': return 'info';
      case 'debug': return 'default';
      default: return 'default';
    }
  };

  const filteredLogs = logs.filter(log => {
    // Filter by search term
    const matchesSearch = searchTerm === '' || 
                         log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.source.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by level
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    
    return matchesSearch && matchesLevel;
  });

  const paginatedLogs = filteredLogs.slice((page - 1) * logsPerPage, page * logsPerPage);

  const handleClearLogs = () => {
    useStore.getState().clearLogs();
  };

  const handleRefresh = () => {
    console.log('Refreshing logs');
    // In a real app, this would fetch fresh logs from the server
  };

  const handleDownload = () => {
    console.log('Downloading logs');
    // In a real app, this would download logs as a file
  };

  const getLogTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <MainLayout>
      <Box sx={{ p: 4 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <div>
            <Typography variant="h3" component="h1" fontWeight="bold">
              System Logs
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Real-time activity monitoring and diagnostics
            </Typography>
          </div>
          <Box display="flex" gap={1}>
            <IconButton onClick={handleRefresh} color="primary">
              <Refresh />
            </IconButton>
            <IconButton onClick={handleDownload} color="primary">
              <Download />
            </IconButton>
            <IconButton onClick={handleClearLogs} color="error">
              <Delete />
            </IconButton>
          </Box>
        </Box>

        {/* Controls */}
        <Card sx={{ mb: 3, background: isDark ? 'rgba(30, 41, 59, 0.3)' : 'rgba(248, 250, 252, 0.5)', backdropFilter: 'blur(10px)' }}>
          <CardContent>
            <Box display="flex" gap={2} alignItems="center">
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1); // Reset to first page when searching
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                select
                SelectProps={{ native: true }}
                variant="outlined"
                size="small"
                value={filterLevel}
                onChange={(e) => {
                  setFilterLevel(e.target.value);
                  setPage(1); // Reset to first page when filtering
                }}
                sx={{ minWidth: 120 }}
              >
                <option value="all">All Levels</option>
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </TextField>
            </Box>
          </CardContent>
        </Card>

        {/* Logs Display */}
        <Card sx={{ background: isDark ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)', boxShadow: isDark ? '0 8px 30px rgba(0, 0, 0, 0.3)' : '0 8px 30px rgba(0, 0, 0, 0.1)' }}>
          <CardContent>
            {filteredLogs.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No logs found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm || filterLevel !== 'all' ? 'Try adjusting your filters' : 'System logs will appear here'}
                </Typography>
              </Box>
            ) : (
              <Box>
                <Box sx={{ maxHeight: '60vh', overflowY: 'auto', pr: 2 }}>
                  {paginatedLogs.map((log, index) => (
                    <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}` }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Chip 
                          label={log.level}
                          color={getLevelColor(log.level) as any}
                          size="small"
                          variant="filled"
                        />
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            {getLogTime(log.timestamp)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            {log.source}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.primary">
                        {log.message}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                
                {/* Pagination */}
                {filteredLogs.length > logsPerPage && (
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                    <Pagination
                      count={Math.ceil(filteredLogs.length / logsPerPage)}
                      page={page}
                      onChange={(e, value) => setPage(value)}
                      color="primary"
                      shape="rounded"
                    />
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
        
        {/* Summary */}
        <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Card sx={{ flex: 1, minWidth: 200, background: isDark ? 'rgba(30, 41, 59, 0.3)' : 'rgba(248, 250, 252, 0.5)', backdropFilter: 'blur(10px)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Total Logs
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {filteredLogs.length}
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ flex: 1, minWidth: 200, background: isDark ? 'rgba(30, 41, 59, 0.3)' : 'rgba(248, 250, 252, 0.5)', backdropFilter: 'blur(10px)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Errors
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="error">
                {logs.filter(l => l.level === 'error').length}
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ flex: 1, minWidth: 200, background: isDark ? 'rgba(30, 41, 59, 0.3)' : 'rgba(248, 250, 252, 0.5)', backdropFilter: 'blur(10px)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Warnings
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="warning">
                {logs.filter(l => l.level === 'warn').length}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </MainLayout>
  );
}
