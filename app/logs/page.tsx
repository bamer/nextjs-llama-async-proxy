"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { useStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { Card, CardContent, Typography, Box, Chip, TextField, InputAdornment, IconButton, Pagination, Grid } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";
import { Search, Refresh, Delete, Download } from "@mui/icons-material";

export default function LogsPage() {
  const logs = useStore((state) => state.logs);
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [page, setPage] = useState(1);
  const logsPerPage = 20;

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
    const source = typeof log.context?.source === 'string' ? log.context.source : '';

    // Extract message string - handle both string and Record<string, unknown>
    let messageStr: string;
    if (typeof log.message === 'string') {
      messageStr = log.message;
    } else if (typeof log.message === 'object' && log.message !== null) {
      const msg = log.message as Record<string, unknown>;
      if (msg.message && typeof msg.message === 'string') {
        messageStr = msg.message;
      } else if (msg.error && typeof msg.error === 'string') {
        messageStr = msg.error;
      } else if (msg.text && typeof msg.text === 'string') {
        messageStr = msg.text;
      } else {
        messageStr = String(log.message);
      }
    } else {
      messageStr = String(log.message || '');
    }

    const matchesSearch = searchTerm === '' ||
                          messageStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          source.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    
    return matchesSearch && matchesLevel;
  });

  const paginatedLogs = filteredLogs.slice((page - 1) * logsPerPage, page * logsPerPage);

  const handleClearLogs = () => {
    useStore.getState().clearLogs();
  };

  const handleRefresh = () => {
    console.log('Refreshing logs');
  };

  const handleDownload = () => {
    console.log('Downloading logs');
  };

  const getLogTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <MainLayout>
      <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" fontWeight="bold">
            Logs
          </Typography>
        </Box>

        {filteredLogs.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="body2" color="text.secondary">
              No logs available
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)' }}
              />

              <TextField
                select
                size="small"
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value as any)}
                sx={{ minWidth: 120, background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)' }}
              >
                <option value="all">All Levels</option>
                <option value="error">Error Only</option>
                <option value="info">Error & Info</option>
                <option value="debug">Debug Only</option>
              </TextField>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <IconButton
                onClick={handleRefresh}
                color="primary"
                size="small"
                title="Refresh logs"
              >
                <Refresh fontSize="small" />
              </IconButton>
              <IconButton
                onClick={handleClearLogs}
                color="error"
                size="small"
                title="Clear logs"
              >
                <Delete fontSize="small" />
              </IconButton>
              <IconButton
                onClick={handleDownload}
                color="info"
                size="small"
                title="Download logs"
              >
                <Download fontSize="small" />
              </IconButton>
            </Box>

            <Box
              sx={{
                mt: 4,
                background: isDark ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                borderRadius: 2,
                boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.3)' : '0 8px 30px rgba(0,0,0,0.1)',
                p: 4,
              }}
            >
              <Grid container spacing={2}>
                {filteredLogs.map((log) => {
                  const levelColor = getLevelColor(log.level);
                  return (
                    <Grid size={{ xs: 12 }} key={log.id} sx={{ fontSize: '0.75rem' }}>
                      <Card
                        sx={{
                          mb: 2,
                          background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                          borderRadius: 1,
                          overflow: 'hidden',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: isDark
                              ? '0 12px 40px rgba(0,0,0,0.4)'
                              : '0 4px 12px rgba(0,0,0,0.1)',
                          },
                        }}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex', gap: 1, mb: 1.5 }}>
                            <Chip
                              label={log.level.toUpperCase()}
                              color={levelColor}
                              size="small"
                              sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1, fontSize: '0.7rem' }}>
                              {getLogTime(log.timestamp)}
                            </Typography>
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{
                              wordBreak: 'break-word',
                              whiteSpace: 'pre-wrap',
                              mb: 1.5,
                            }}
                          >
                            {typeof log.message === 'string'
                              ? log.message
                              : typeof log.message === 'object' && log.message !== null
                                ? (() => {
                                    const msg = log.message as Record<string, unknown>;
                                    if (msg.message && typeof msg.message === 'string') {
                                      return msg.message;
                                    } else if (msg.error && typeof msg.error === 'string') {
                                      return msg.error;
                                    } else if (msg.text && typeof msg.text === 'string') {
                                      return msg.text;
                                    } else {
                                      return String(log.message || '');
                                    }
                                  })()
                                : String(log.message || '')
                            }
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={Math.ceil(filteredLogs.length / logsPerPage)}
            page={page}
            onChange={(_e, value) => setPage(value)}
            sx={{ '& .MuiPagination-ul': { justifyContent: 'center' } }}
            color="primary"
            size="small"
          />
        </Box>
      </Box>
    </MainLayout>
  );
}
