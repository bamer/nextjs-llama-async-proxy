'use client';

import { useEffect, useState } from 'react';

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('app-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (e) {
        console.error('Failed to parse settings:', e);
        setSettings(DEFAULT_SETTINGS);
      }
    }
    setIsLoading(false);
  }, []);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('app-settings', JSON.stringify(updated));
  };

  return {
    settings,
    updateSettings,
    isLoading,
  };
}
