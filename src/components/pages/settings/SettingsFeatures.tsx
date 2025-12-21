import React from 'react';

interface SettingsFeaturesProps {
  settings: any;
  onToggle: (key: 'autoUpdate' | 'notificationsEnabled') => void;
}

export function SettingsFeatures({
  settings,
  onToggle,
}: SettingsFeaturesProps) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Features
      </h2>

      <div className="space-y-4">
        {/* Auto Update */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div>
            <label className="font-medium text-gray-900 dark:text-white block">
              Auto Update
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Auto-update models and dependencies
            </p>
          </div>
          <button
            onClick={() => onToggle('autoUpdate')}
            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
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
            <label className="font-medium text-gray-900 dark:text-white block">
              Notifications
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Receive system alerts
            </p>
          </div>
          <button
            onClick={() => onToggle('notificationsEnabled')}
            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
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
  );
}
