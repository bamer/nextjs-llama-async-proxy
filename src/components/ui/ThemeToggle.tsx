'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button, Tooltip } from '@mui/material';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { mode, setMode } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10" />;
  }

  const getThemeIcon = () => {
    switch (mode) {
      case 'light':
        return <Sun className="h-5 w-5 text-yellow-500" />;
      case 'dark':
        return <Moon className="h-5 w-5 text-blue-400" />;
      case 'system':
        return <Monitor className="h-5 w-5 text-gray-500" />;
      default:
        return <Sun className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getThemeLabel = () => {
    switch (mode) {
      case 'light':
        return 'Light Mode';
      case 'dark':
        return 'Dark Mode';
      case 'system':
        return 'System Mode';
      default:
        return 'Toggle Theme';
    }
  };

  const cycleTheme = () => {
    if (mode === 'light') {
      setMode('dark');
    } else if (mode === 'dark') {
      setMode('system');
    } else {
      setMode('light');
    }
  };

  return (
    <Tooltip title={getThemeLabel()} arrow>
      <Button
        onClick={cycleTheme}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Toggle theme"
        sx={{ minWidth: 'auto' }}
      >
        {getThemeIcon()}
      </Button>
    </Tooltip>
  );
}
