'use client';

import React, { useState } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { SettingsAppearance } from './settings/SettingsAppearance';
import { SettingsSystem } from './settings/SettingsSystem';
import { SettingsFeatures } from './settings/SettingsFeatures';

export function SettingsPage() {
  const { settings, updateSettings, isLoading } = useSettings();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updateSettings({ theme });
    handleSave();
  };

  const handleToggle = (key: 'autoUpdate' | 'notificationsEnabled') => {
    updateSettings({ [key]: !settings[key] });
    handleSave();
  };

  const handleSlider = (
    key: 'maxConcurrentModels' | 'refreshInterval',
    value: number
  ) => {
    updateSettings({ [key]: value });
    handleSave();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Customize your application
        </p>
      </div>

      {/* Success Message */}
      {saved && (
        <div className="rounded-lg border border-green-300 bg-green-50 dark:bg-green-950 dark:border-green-800 p-4 flex items-center gap-3">
          <span className="text-2xl">✓</span>
          <span className="font-medium text-green-700 dark:text-green-400">
            Settings saved
          </span>
        </div>
      )}

      {/* Settings Sections */}
      <div className="grid gap-8">
        <SettingsAppearance
          settings={settings}
          onThemeChange={handleThemeChange}
        />
        <SettingsSystem
          settings={settings}
          onSliderChange={handleSlider}
        />
        <SettingsFeatures settings={settings} onToggle={handleToggle} />
      </div>

      {/* Info Box */}
      <div className="rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 p-4">
        <p className="text-sm text-blue-700 dark:text-blue-400">
          ℹ️ Your settings are automatically saved to browser storage and
          persist across sessions.
        </p>
      </div>
    </div>
  );
}
