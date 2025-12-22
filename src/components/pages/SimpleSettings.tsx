'use client';

import { useState } from 'react';
import { useSettings } from '@/hooks/useSettings';

export default function SimpleSettings() {
  const { settings, updateSettings, isLoading } = useSettings();
  const [saved, setSaved] = useState(false);

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updateSettings({ theme });
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
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Customize your application</p>
      </div>

      {/* Success Message */}
      {saved && (
        <div className="rounded-lg border bg-green-50 dark:bg-green-950 p-4 flex items-center gap-3" style={{borderColor: 'hsl(142.1 71.8% 29.2%)'}}>
          <span className="text-2xl">✓</span>
          <span className="font-medium text-green-700 dark:text-green-400">Settings saved</span>
        </div>
      )}

      {/* Theme */}
      <div className="rounded-lg border bg-white dark:bg-gray-900 p-6" style={{borderColor: 'hsl(214.3 31.8% 91.4%)'}}>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Appearance</h2>
        <div className="grid grid-cols-3 gap-3">
          {(['light', 'dark', 'system'] as const).map((theme) => (
            <button
              key={theme}
              onClick={() => handleThemeChange(theme)}
              className={`p-4 rounded-lg border-2 transition-all font-medium capitalize ${
                settings.theme === theme
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
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

      {/* System Settings */}
      <div className="rounded-lg border bg-white dark:bg-gray-900 p-6" style={{borderColor: 'hsl(214.3 31.8% 91.4%)'}}>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">System Settings</h2>

        <div className="space-y-6">
          {/* Max Concurrent Models */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="font-medium text-gray-900 dark:text-white">Max Concurrent Models</label>
              <span className="text-lg font-bold text-blue-600">{settings.maxConcurrentModels}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={settings.maxConcurrentModels}
              onChange={(e) => handleSlider('maxConcurrentModels', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{accentColor: '#3b82f6'}}
            />
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>1 model</span>
              <span>10 models</span>
            </div>
          </div>

          {/* Refresh Interval */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="font-medium text-gray-900 dark:text-white">Refresh Interval (seconds)</label>
              <span className="text-lg font-bold text-blue-600">{settings.refreshInterval}s</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={settings.refreshInterval}
              onChange={(e) => handleSlider('refreshInterval', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{accentColor: '#3b82f6'}}
            />
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>1 second</span>
              <span>10 seconds</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="rounded-lg border bg-white dark:bg-gray-900 p-6" style={{borderColor: 'hsl(214.3 31.8% 91.4%)'}}>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Features</h2>

        <div className="space-y-4">
          {/* Auto Update */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div>
              <label className="font-medium text-gray-900 dark:text-white">Auto Update</label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Auto-update models and dependencies</p>
            </div>
            <button
              onClick={() => handleToggle('autoUpdate')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.autoUpdate ? 'bg-blue-500' : 'bg-gray-400'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.autoUpdate ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div>
              <label className="font-medium text-gray-900 dark:text-white">Notifications</label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Receive system alerts</p>
            </div>
            <button
              onClick={() => handleToggle('notificationsEnabled')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.notificationsEnabled ? 'bg-blue-500' : 'bg-gray-400'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-lg border bg-blue-50 dark:bg-blue-950 p-4" style={{borderColor: 'hsl(211 100% 50%)'}}>
        <p className="text-sm text-blue-700 dark:text-blue-400">
          ℹ️ Your settings are automatically saved to browser storage and persist across sessions.
        </p>
      </div>
    </div>
  );
}
