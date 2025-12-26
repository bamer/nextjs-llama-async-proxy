'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useWebSocket } from '@/hooks/use-websocket';
import { getLoggerConfig, updateLoggerConfig, LoggerConfig } from '@/lib/logger';
import { Card, CardContent, Typography, Box, Grid, Divider, 
         TextField, Switch, FormControlLabel, Button, Chip, Slider } from '@mui/material';
import { m } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

export default function LoggingSettings() {
  const { isDark } = useTheme();
  const { sendMessage } = useWebSocket();
  const [config, setConfig] = useState<LoggerConfig>({} as LoggerConfig);
  const [loading, setLoading] = useState(true);
  const logLevels = ['error', 'warn', 'info', 'debug', 'verbose'];

  useEffect(() => {
    // Load current logger configuration
    const currentConfig = getLoggerConfig();
    setConfig(currentConfig);
    setLoading(false);
  }, []);

  const handleConfigChange = (key: keyof LoggerConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveConfig = () => {
    try {
      updateLoggerConfig(config);
      
      // Send configuration to server via WebSocket
      sendMessage('updateLoggerConfig', config);
      
      useStore.getState().setLoading(false);
      useStore.getState().clearError();
      
      // Show success notification
      // TODO: Add notification system
      console.log('Logging configuration updated successfully');
    } catch (error) {
      console.error('Failed to update logging configuration:', error);
      useStore.getState().setError('Failed to update logging configuration');
    }
  };

  const handleResetConfig = () => {
    const defaultConfig: LoggerConfig = {
      consoleLevel: 'debug',
      fileLevel: 'info',
      errorLevel: 'error',
      maxFileSize: '20m',
      maxFiles: '30d',
      enableFileLogging: true,
      enableConsoleLogging: true,
    };

    setConfig(defaultConfig);
    updateLoggerConfig(defaultConfig);
    sendMessage('updateLoggerConfig', defaultConfig);
  };

  const getLogLevelValue = (level: string) => {
    const levels = ['error', 'warn', 'info', 'debug', 'verbose'];
    return levels.indexOf(level);
  };

  const getLogLevelLabel = (value: number) => {
    const levels = ['error', 'warn', 'info', 'debug', 'verbose'];
    return levels[value] || 'info';
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>Loading Logging Configuration...</Typography>
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
            Logging Configuration
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Advanced Logging System with File Rotation
          </Typography>
        </m.div>
      </Box>

      <Divider sx={{ my: 4, borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />

      {/* Logging Configuration Cards */}
      <Grid container spacing={4}>
        {/* Console Logging */}
        <Grid size={{ xs: 12, md: 6 }}>
          <m.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
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
                  Console Logging
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Configure console output logging
                </Typography>

                <Box sx={{ spaceY: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.enableConsoleLogging}
                        onChange={(e) => handleConfigChange('enableConsoleLogging', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Enable Console Logging"
                  />

                  {config.enableConsoleLogging && (
                    <>
                      <Typography variant="subtitle2" fontWeight="medium" mb={1}>
                        Console Log Level
                      </Typography>
                      <Slider
                        value={getLogLevelValue(config.consoleLevel)}
                        onChange={(_, value) => {
                          const level = getLogLevelLabel(value as number);
                          handleConfigChange('consoleLevel', level);
                        }}
                        min={0}
                        max={4}
                        step={1}
                        marks={logLevels.map((level, index) => ({ value: index, label: level }))}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => getLogLevelLabel(value)}
                      />
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          </m.div>
        </Grid>

        {/* File Logging */}
        <Grid size={{ xs: 12, md: 6 }}>
          <m.div
            initial={{ opacity: 0, x: 20 }}
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
                  File Logging
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Configure file logging with rotation
                </Typography>

                <Box sx={{ spaceY: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.enableFileLogging}
                        onChange={(e) => handleConfigChange('enableFileLogging', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Enable File Logging"
                  />

                  {config.enableFileLogging && (
                    <>
                      <Typography variant="subtitle2" fontWeight="medium" mb={1}>
                        File Log Level
                      </Typography>
                      <Slider
                        value={getLogLevelValue(config.fileLevel)}
                        onChange={(_, value) => {
                          const level = getLogLevelLabel(value as number);
                          handleConfigChange('fileLevel', level);
                        }}
                        min={0}
                        max={4}
                        step={1}
                        marks={logLevels.map((level, index) => ({ value: index, label: level }))}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => getLogLevelLabel(value)}
                      />

                      <Typography variant="subtitle2" fontWeight="medium" mb={1}>
                        Error Log Level
                      </Typography>
                      <Slider
                        value={getLogLevelValue(config.errorLevel)}
                        onChange={(_, value) => {
                          const level = getLogLevelLabel(value as number);
                          handleConfigChange('errorLevel', level);
                        }}
                        min={0}
                        max={4}
                        step={1}
                        marks={logLevels.map((level, index) => ({ value: index, label: level }))}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => getLogLevelLabel(value)}
                      />

                      <TextField
                        label="Max File Size"
                        value={config.maxFileSize}
                        onChange={(e) => handleConfigChange('maxFileSize', e.target.value)}
                        fullWidth
                        helperText="e.g., 20m, 1g"
                      />

                      <TextField
                        label="Max Files"
                        value={config.maxFiles}
                        onChange={(e) => handleConfigChange('maxFiles', e.target.value)}
                        fullWidth
                        helperText="e.g., 30d, 7d"
                      />
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          </m.div>
        </Grid>
      </Grid>

      <Box sx={{ mt: 6 }} />

      {/* Actions */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Card
          sx={{ 
            background: isDark ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
            boxShadow: isDark ? '0 8px 30px rgba(0, 0, 0, 0.3)' : '0 8px 30px rgba(0, 0, 0, 0.1)'
          }}
        >
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Logging Configuration Actions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Save or reset your logging configuration
                </Typography>
              </Box>
              <Box display="flex" gap={2}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleResetConfig}
                  disabled={loading}
                >
                  Reset to Defaults
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveConfig}
                  disabled={loading}
                >
                  Save Configuration
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </m.div>

      <Box sx={{ mt: 4 }} />

      {/* Current Configuration */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
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
              Current Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Preview of your current logging settings
            </Typography>

            <Box sx={{ spaceY: 2 }}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Console Logging</Typography>
                <Chip
                  label={config.enableConsoleLogging ? 'Enabled' : 'Disabled'}
                  color={config.enableConsoleLogging ? 'success' : 'default'}
                  size="small"
                />
              </Box>

              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Console Level</Typography>
                <Chip
                  label={config.consoleLevel}
                  color="primary"
                  size="small"
                />
              </Box>

              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">File Logging</Typography>
                <Chip
                  label={config.enableFileLogging ? 'Enabled' : 'Disabled'}
                  color={config.enableFileLogging ? 'success' : 'default'}
                  size="small"
                />
              </Box>

              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">File Level</Typography>
                <Chip
                  label={config.fileLevel}
                  color="primary"
                  size="small"
                />
              </Box>

              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Error Level</Typography>
                <Chip
                  label={config.errorLevel}
                  color="error"
                  size="small"
                />
              </Box>

              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Max File Size</Typography>
                <Chip
                  label={config.maxFileSize}
                  color="default"
                  size="small"
                />
              </Box>

              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Max Files</Typography>
                <Chip
                  label={config.maxFiles}
                  color="default"
                  size="small"
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </m.div>
    </Box>
  );
}