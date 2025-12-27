"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { useStore } from "@/lib/store";
import { useWebSocket } from "@/hooks/use-websocket";
import { useEffect, useState } from "react";
import { Card, CardContent, Typography, Box, Chip, TextField, InputAdornment, IconButton, Pagination, Grid, CircularProgress } from "@mui/material";
import { MultiSelect, MultiSelectOption, SkeletonLogEntry } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { Search, Refresh, Delete, Download } from "@mui/icons-material";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { LogsFallback } from "@/components/ui/error-fallbacks";

export default function LogsPage() {
  const logs = useStore((state) => state.logs);
  const { isDark } = useTheme();
  const { requestLogs, isConnected } = useWebSocket();
  const [searchTerm, setSearchTerm] = useState('');
  // Ensure selectedLevels is always initialized with all levels
  const [selectedLevels, setSelectedLevels] = useState<Set<string>>(() => new Set(['error', 'warn', 'info', 'debug']));
  const [page, setPage] = useState(1);
  const logsPerPage = 20;
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasLoadedLogs, setHasLoadedLogs] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Request logs on mount and periodically to ensure fresh data
  useEffect(() => {
    const loadLogs = () => {
      if (isConnected) {
        // Initial request
        requestLogs();
        setIsInitialLoad(false);
        setHasLoadedLogs(true);
        return undefined;
      }
      // Try again after a delay if not connected yet
      if (isInitialLoad) {
        const retryTimer = setTimeout(() => {
          if (isConnected) {
            requestLogs();
            setIsInitialLoad(false);
            setHasLoadedLogs(true);
          }
        }, 1000);
        return () => clearTimeout(retryTimer);
      }
      return undefined;
    };

    const cleanup = loadLogs();
    return cleanup;
  }, [isConnected, requestLogs, isInitialLoad]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedLevels]);

  // Refresh logs every 15 seconds to keep data current
  useEffect(() => {
    if (!isConnected) {
      return undefined;
    }

    const refreshInterval = setInterval(() => {
      requestLogs();
    }, 15000);

    return () => clearInterval(refreshInterval);
  }, [isConnected, requestLogs]);

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

    // Handle log level filtering - check if log level is in selected levels
    // Normalize log level to lowercase for comparison
    const logLevel = log.level?.toLowerCase() || 'info';
    const matchesLevel = selectedLevels.has(logLevel);

    return matchesSearch && matchesLevel;
  });

  const paginatedLogs = filteredLogs.slice((page - 1) * logsPerPage, page * logsPerPage);

  const handleClearLogs = () => {
    useStore.getState().clearLogs();
    setHasLoadedLogs(false);
  };

  const logLevelOptions: MultiSelectOption[] = [
    { value: 'error', label: 'Error', color: '#f44336' },
    { value: 'warn', label: 'Warning', color: '#ff9800' },
    { value: 'info', label: 'Info', color: '#2196f3' },
    { value: 'debug', label: 'Debug', color: '#4caf50' },
  ];

  // Get status message based on connection and logs state
  const getStatusMessage = () => {
    if (selectedLevels.size === 0) {
      return 'No log levels selected';
    }
    if (!isConnected && logs.length === 0) {
      return 'Connecting to server...';
    }
    if (logs.length === 0) {
      return hasLoadedLogs ? 'No logs available' : 'Loading logs...';
    }
    return '';
  };

  const handleRefresh = () => {
    if (isConnected) {
      setRefreshing(true);
      requestLogs();
      setHasLoadedLogs(true);
      setTimeout(() => setRefreshing(false), 800);
    } else {
      // Warn user that connection is not available
      console.warn('Cannot refresh logs: WebSocket not connected');
    }
  };

  const handleDownload = () => {
    // Download logs as JSON file
    setDownloading(true);
    const logsToDownload = filteredLogs;
    const dataStr = JSON.stringify(logsToDownload, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs-${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setTimeout(() => setDownloading(false), 800);
  };

  const getLogTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <MainLayout>
      <ErrorBoundary fallback={<LogsFallback />}>
        <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" fontWeight="bold">
            Logs
          </Typography>
        </Box>

        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'nowrap' }}>
          <TextField
            id="logs-search-input"
            name="logs-search-input"
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
            sx={{
              background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
              flex: 1,
            }}
          />

          <Box sx={{ width: 220, flexShrink: 0 }}>
            <MultiSelect
              options={logLevelOptions}
              selected={selectedLevels}
              onChange={setSelectedLevels}
              placeholder="Log Levels"
              showSelectAll={true}
              maxSelectedDisplay={3}
              size="small"
              fullWidth={true}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <IconButton
            onClick={handleRefresh}
            color="primary"
            size="small"
            disabled={refreshing}
            title="Refresh logs"
          >
            {refreshing ? <CircularProgress size={16} /> : <Refresh fontSize="small" />}
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
            disabled={downloading}
            title="Download logs"
          >
            {downloading ? <CircularProgress size={16} /> : <Download fontSize="small" />}
          </IconButton>
        </Box>

        {/* Show skeleton during initial load */}
        {isInitialLoad && !hasLoadedLogs && filteredLogs.length === 0 ? (
          <Box
            sx={{
              mt: 4,
              background: isDark ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
              borderRadius: 2,
              boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.3)' : '0 8px 30px rgba(0,0,0,0.1)',
              p: 4,
            }}
          >
            <SkeletonLogEntry count={10} />
          </Box>
        ) : filteredLogs.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, mt: 4 }}>
            <Typography variant="body2" color="text.secondary">
              {getStatusMessage()}
            </Typography>
            {!isConnected && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Waiting for WebSocket connection...
              </Typography>
            )}
          </Box>
        ) : (
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
               {paginatedLogs.map((log, index) => {
                const levelColor = getLevelColor(log.level);
                // Use log.id with index as fallback to ensure uniqueness
                const uniqueKey = log.id ? `${log.id}-${index}` : `log-${index}`;
                return (
                  <Grid size={{ xs: 12 }} key={uniqueKey} sx={{ fontSize: '0.75rem' }}>
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
      </ErrorBoundary>
    </MainLayout>
  );
}
