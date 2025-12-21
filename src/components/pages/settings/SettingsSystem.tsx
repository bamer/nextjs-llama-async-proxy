import React from 'react';

interface SettingsSystemProps {
  settings: any;
  onSliderChange: (
    key: 'maxConcurrentModels' | 'refreshInterval',
    value: number
  ) => void;
}

export function SettingsSystem({
  settings,
  onSliderChange,
}: SettingsSystemProps) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
        System Settings
      </h2>

      <div className="space-y-8">
        {/* Max Concurrent Models */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="font-medium text-gray-900 dark:text-white">
              Max Concurrent Models
            </label>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {settings.maxConcurrentModels}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={settings.maxConcurrentModels}
            onChange={(e) =>
              onSliderChange(
                'maxConcurrentModels',
                parseInt(e.target.value)
              )
            }
            className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>1 model</span>
            <span>10 models</span>
          </div>
        </div>

        {/* Refresh Interval */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="font-medium text-gray-900 dark:text-white">
              Refresh Interval (seconds)
            </label>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {settings.refreshInterval}s
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={settings.refreshInterval}
            onChange={(e) =>
              onSliderChange('refreshInterval', parseInt(e.target.value))
            }
            className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>1 second</span>
            <span>10 seconds</span>
          </div>
        </div>
      </div>
    </div>
  );
}
