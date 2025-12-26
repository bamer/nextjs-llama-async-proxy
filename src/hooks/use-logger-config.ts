import { useState, useEffect } from 'react';

interface LoggerConfig {
  consoleLevel: string;
  fileLevel: string;
  errorLevel: string;
  maxFileSize: string;
  maxFiles: string;
  enableFileLogging: boolean;
  enableConsoleLogging: boolean;
}

const STORAGE_KEY = 'logger-config';

const DEFAULT_CONFIG: LoggerConfig = {
  consoleLevel: 'info',
  fileLevel: 'info',
  errorLevel: 'error',
  maxFileSize: '20m',
  maxFiles: '30d',
  enableFileLogging: true,
  enableConsoleLogging: true,
};

export function useLoggerConfig() {
  const [config, setConfig] = useState<LoggerConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setConfig(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load logger config:', error);
    }
  }, []);

  const updateConfig = (updates: Partial<LoggerConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch (error) {
      console.error('Failed to save logger config:', error);
    }
  };

  const resetConfig = () => {
    const newConfig = { ...DEFAULT_CONFIG };
    setConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch (error) {
      console.error('Failed to reset logger config:', error);
    }
  };

  const applyToLogger = () => {
    fetch('/api/logger/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    }).catch(error => {
      console.error('Failed to apply logger config to server:', error);
    });
  };

  return {
    loggerConfig: config,
    updateConfig,
    resetConfig,
    applyToLogger,
    loading,
  };
}
