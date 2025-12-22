'use client';

import { useState } from 'react';
import { useSettings } from '@/hooks/useSettings';

export default function SettingsPageV2() {
  const { settings, updateSettings, isLoading } = useSettings();
  const [saved, setSaved] = useState(false);

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updateSettings({ theme });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogLevelChange = (logLevel: 'debug' | 'info' | 'warn' | 'error') => {
    updateSettings({ logLevel });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleToggle = (key: 'autoUpdate' | 'notificationsEnabled') => {
    updateSettings({ [key]: !settings[key] });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSlider = (key: 'maxConcurrentModels' | 'refreshInterval', value: number) => {
    updateSettings({ [key]: value });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold gradient-text">Settings</h1>
        <p className="text-muted-foreground mt-2">Customize your application preferences</p>
      </div>

      {/* Success Message */}
      {saved && (
        <div className="card p-4 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 flex items-center gap-3 animate-in fade-in">
          <span className="text-2xl">✓</span>
          <span className="text-sm font-medium text-green-700 dark:text-green-400">Settings saved successfully</span>
        </div>
      )}

      {/* Theme Settings */}
      <div className="card p-6 space-y-4">
        <h2 className="text-xl font-semibold">Appearance</h2>

        <div className="space-y-3">
          <label className="text-sm font-medium">Theme</label>
          <div className="grid grid-cols-3 gap-3">
            {(['light', 'dark', 'system'] as const).map((theme) => (
              <button
                key={theme}
                onClick={() => handleThemeChange(theme)}
                className={`p-4 rounded-lg border-2 transition-all capitalize font-medium ${
                  settings.theme === theme
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                {theme === 'light' && '☀️'}
                {theme === 'dark' && '🌙'}
                {theme === 'system' && '💻'}
                <div className="mt-2 text-sm">{theme}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* System Settings */}
      <div className="card p-6 space-y-6">
        <h2 className="text-xl font-semibold">System Settings</h2>

        {/* Log Level */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Log Level</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['debug', 'info', 'warn', 'error'] as const).map((level) => (
              <button
                key={level}
                onClick={() => handleLogLevelChange(level)}
                className={`p-3 rounded-lg border-2 transition-all capitalize font-medium text-sm ${
                  settings.logLevel === level
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Max Concurrent Models */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Max Concurrent Models</label>
            <span className="text-lg font-bold text-primary">{settings.maxConcurrentModels}</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={settings.maxConcurrentModels}
            onChange={(e) => handleSlider('maxConcurrentModels', parseInt(e.target.value))}
            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 model</span>
            <span>10 models</span>
          </div>
        </div>

        {/* Refresh Interval */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Refresh Interval</label>
            <span className="text-lg font-bold text-primary">{settings.refreshInterval}s</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={settings.refreshInterval}
            onChange={(e) => handleSlider('refreshInterval', parseInt(e.target.value))}
            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 second</span>
            <span>10 seconds</span>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="card p-6 space-y-4">
        <h2 className="text-xl font-semibold">Features</h2>

        <div className="space-y-4">
          {/* Auto Update */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
            <div className="space-y-1">
              <label className="text-sm font-medium">Auto Update</label>
              <p className="text-xs text-muted-foreground">Automatically update models and dependencies</p>
            </div>
            <button
              onClick={() => handleToggle('autoUpdate')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.autoUpdate ? 'bg-primary' : 'bg-secondary'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.autoUpdate ? 'translate-x-6' : 'translate-x-1'
                }`}
              ></div>
            </button>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
            <div className="space-y-1">
              <label className="text-sm font-medium">Notifications</label>
              <p className="text-xs text-muted-foreground">Receive system alerts and notifications</p>
            </div>
            <button
              onClick={() => handleToggle('notificationsEnabled')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.notificationsEnabled ? 'bg-primary' : 'bg-secondary'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              ></div>
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="card p-6 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-400">
          ℹ️ Your settings are automatically saved to your browser's local storage. They will persist across sessions.
        </p>
      </div>
    </div>
  );
}
