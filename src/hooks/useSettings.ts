'use client';

import { useState } from 'react';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  maxConcurrentModels: number;
  autoUpdate: boolean;
  notificationsEnabled: boolean;
  refreshInterval: number; // in seconds
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  logLevel: 'info',
  maxConcurrentModels: 3,
  autoUpdate: true,
  notificationsEnabled: true,
  refreshInterval: 2,
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
  };

  return {
    settings,
    updateSettings,
    isLoading,
  };
}
