

interface SettingsAppearanceProps {
  settings: any;
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
}

export function SettingsAppearance({
  settings,
  onThemeChange,
}: SettingsAppearanceProps) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Appearance
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(['light', 'dark', 'system'] as const).map((theme) => (
          <button
            key={theme}
            onClick={() => onThemeChange(theme)}
            className={`p-6 rounded-lg border-2 transition-all text-center font-medium capitalize ${
              settings.theme === theme
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400'
                : 'border-gray-300 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <div className="text-3xl mb-2">
              {theme === 'light' && '☀️'}
              {theme === 'dark' && '🌙'}
              {theme === 'system' && '💻'}
            </div>
            <div>{theme}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
