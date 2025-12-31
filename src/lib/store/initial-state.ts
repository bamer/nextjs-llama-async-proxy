/**
 * Store initial state definition
 */

import { APP_CONFIG } from '@/config/app.config';
import { ThemeMode } from '@/contexts/ThemeContext';
import { AppState, ChartHistory } from './types';

export const initialChartHistory: ChartHistory = {
  cpu: [],
  memory: [],
  requests: [],
  gpuUtil: [],
  power: [],
};

export const initialState: AppState = {
  models: [],
  activeModelId: null,
  metrics: null,
  logs: [],
  settings: {
    theme: APP_CONFIG.theme.default as ThemeMode,
    notifications: true,
    autoRefresh: true,
  },
  status: {
    isLoading: false,
    error: null,
    llamaServerStatus: 'unknown',
  },
  chartHistory: initialChartHistory,
};
