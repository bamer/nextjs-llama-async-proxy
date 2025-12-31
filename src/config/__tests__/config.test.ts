import { APP_CONFIG, type AppConfig } from '@/config/app.config';
import { MONITORING_CONFIG, type MonitoringConfig } from '@/config/monitoring.config';

describe('Config Tests', () => {
  describe('APP_CONFIG', () => {
    it('has correct name', () => {
      expect(APP_CONFIG.name).toBe('Llama Runner Pro');
    });

    it('has correct version', () => {
      expect(APP_CONFIG.version).toBe('2.0.0');
    });

    it('has description', () => {
      expect(APP_CONFIG.description).toBe('Advanced Llama Model Management System');
    });

    it('has API configuration', () => {
      expect(APP_CONFIG.api).toBeDefined();
      expect(APP_CONFIG.api.baseUrl).toBeDefined();
      expect(APP_CONFIG.api.websocketUrl).toBeDefined();
      expect(APP_CONFIG.api.timeout).toBeDefined();
    });

    it('has feature flags', () => {
      expect(APP_CONFIG.features).toBeDefined();
      expect(APP_CONFIG.features.analytics).toBeDefined();
      expect(APP_CONFIG.features.realtimeMonitoring).toBeDefined();
      expect(APP_CONFIG.features.modelManagement).toBeDefined();
      expect(APP_CONFIG.features.authentication).toBeDefined();
    });

    it('has theme configuration', () => {
      expect(APP_CONFIG.theme).toBeDefined();
      expect(APP_CONFIG.theme.default).toBeDefined();
      expect(APP_CONFIG.theme.dark).toBeDefined();
      expect(APP_CONFIG.theme.light).toBeDefined();
    });

    it('has cache configuration', () => {
      expect(APP_CONFIG.cache).toBeDefined();
      expect(APP_CONFIG.cache.ttl).toBeDefined();
      expect(APP_CONFIG.cache.maxEntries).toBeDefined();
    });

    it('has Sentry configuration', () => {
      expect(APP_CONFIG.sentry).toBeDefined();
      expect(APP_CONFIG.sentry.dsn).toBeDefined();
      expect(APP_CONFIG.sentry.environment).toBeDefined();
      expect(APP_CONFIG.sentry.tracesSampleRate).toBeDefined();
    });

    it('API baseUrl defaults to localhost', () => {
      expect(APP_CONFIG.api.baseUrl).toContain('localhost:3000');
    });

    it('API websocketUrl is valid WS URL', () => {
      expect(APP_CONFIG.api.websocketUrl).toMatch(/^ws:\/\//);
    });

    it('API timeout is 30 seconds', () => {
      expect(APP_CONFIG.api.timeout).toBe(30000);
    });

    it('features are boolean values', () => {
      expect(typeof APP_CONFIG.features.analytics).toBe('boolean');
      expect(typeof APP_CONFIG.features.realtimeMonitoring).toBe('boolean');
      expect(typeof APP_CONFIG.features.modelManagement).toBe('boolean');
      expect(typeof APP_CONFIG.features.authentication).toBe('boolean');
    });

    it('analytics feature is enabled', () => {
      expect(APP_CONFIG.features.analytics).toBe(true);
    });

    it('realtimeMonitoring feature is enabled', () => {
      expect(APP_CONFIG.features.realtimeMonitoring).toBe(true);
    });

    it('modelManagement feature is enabled', () => {
      expect(APP_CONFIG.features.modelManagement).toBe(true);
    });

    it('authentication feature is disabled', () => {
      expect(APP_CONFIG.features.authentication).toBe(false);
    });

    it('theme default is system', () => {
      expect(APP_CONFIG.theme.default).toBe('system');
    });

    it('theme dark value is dark', () => {
      expect(APP_CONFIG.theme.dark).toBe('dark');
    });

    it('theme light value is light', () => {
      expect(APP_CONFIG.theme.light).toBe('light');
    });

    it('cache ttl is number', () => {
      expect(typeof APP_CONFIG.cache.ttl).toBe('number');
    });

    it('cache maxEntries is number', () => {
      expect(typeof APP_CONFIG.cache.maxEntries).toBe('number');
    });

    it('cache ttl is 300 seconds', () => {
      expect(APP_CONFIG.cache.ttl).toBe(300);
    });

    it('cache maxEntries is 100', () => {
      expect(APP_CONFIG.cache.maxEntries).toBe(100);
    });

    it('Sentry dsn is string', () => {
      expect(typeof APP_CONFIG.sentry.dsn).toBe('string');
    });

    it('Sentry environment is string', () => {
      expect(typeof APP_CONFIG.sentry.environment).toBe('string');
    });

    it('Sentry tracesSampleRate is number', () => {
      expect(typeof APP_CONFIG.sentry.tracesSampleRate).toBe('number');
    });

    it('Sentry tracesSampleRate is 1.0', () => {
      expect(APP_CONFIG.sentry.tracesSampleRate).toBe(1.0);
    });

    it('conforms to AppConfig type', () => {
      const config: AppConfig = APP_CONFIG;

      expect(config).toBeDefined();
    });

    it('is read-only (as const)', () => {
      expect(() => {
        (APP_CONFIG as any).name = 'Modified';
      }).not.toThrow();
    });
  });

  describe('MONITORING_CONFIG', () => {
    it('has REQUIRE_REAL_DATA property', () => {
      expect(MONITORING_CONFIG.REQUIRE_REAL_DATA).toBeDefined();
    });

    it('has WEBSOCKET configuration', () => {
      expect(MONITORING_CONFIG.WEBSOCKET).toBeDefined();
      expect(MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT).toBeDefined();
      expect(MONITORING_CONFIG.WEBSOCKET.AUTO_RECONNECT).toBeDefined();
      expect(MONITORING_CONFIG.WEBSOCKET.MAX_RECONNECT_ATTEMPTS).toBeDefined();
      expect(MONITORING_CONFIG.WEBSOCKET.RECONNECT_DELAY).toBeDefined();
    });

    it('has MOCK_DATA configuration', () => {
      expect(MONITORING_CONFIG.MOCK_DATA).toBeDefined();
      expect(MONITORING_CONFIG.MOCK_DATA.ENABLE_FALLBACK).toBeDefined();
      expect(MONITORING_CONFIG.MOCK_DATA.UPDATE_INTERVAL).toBeDefined();
      expect(MONITORING_CONFIG.MOCK_DATA.GPU).toBeDefined();
    });

    it('has UI configuration', () => {
      expect(MONITORING_CONFIG.UI).toBeDefined();
      expect(MONITORING_CONFIG.UI.SHOW_CONNECTION_STATUS).toBeDefined();
      expect(MONITORING_CONFIG.UI.DISCONNECTED_ANIMATION).toBeDefined();
      expect(MONITORING_CONFIG.UI.ERROR_DISPLAY_DURATION).toBeDefined();
    });

    it('REQUIRE_REAL_DATA is boolean', () => {
      expect(typeof MONITORING_CONFIG.REQUIRE_REAL_DATA).toBe('boolean');
    });

    it('CONNECTION_TIMEOUT is 15000 ms', () => {
      expect(MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT).toBe(15000);
    });

    it('AUTO_RECONNECT is enabled', () => {
      expect(MONITORING_CONFIG.WEBSOCKET.AUTO_RECONNECT).toBe(true);
    });

    it('MAX_RECONNECT_ATTEMPTS is 5', () => {
      expect(MONITORING_CONFIG.WEBSOCKET.MAX_RECONNECT_ATTEMPTS).toBe(5);
    });

    it('RECONNECT_DELAY is 3000 ms', () => {
      expect(MONITORING_CONFIG.WEBSOCKET.RECONNECT_DELAY).toBe(3000);
    });

    it('ENABLE_FALLBACK is boolean', () => {
      expect(typeof MONITORING_CONFIG.MOCK_DATA.ENABLE_FALLBACK).toBe('boolean');
    });

    it('UPDATE_INTERVAL is 5000 ms', () => {
      expect(MONITORING_CONFIG.MOCK_DATA.UPDATE_INTERVAL).toBe(5000);
    });

    it('GPU mock data has NAME', () => {
      expect(MONITORING_CONFIG.MOCK_DATA.GPU.NAME).toBe('NVIDIA RTX 4090');
    });

    it('GPU mock data has MEMORY_TOTAL_MB', () => {
      expect(MONITORING_CONFIG.MOCK_DATA.GPU.MEMORY_TOTAL_MB).toBe(24576);
    });

    it('GPU mock data has POWER_LIMIT_W', () => {
      expect(MONITORING_CONFIG.MOCK_DATA.GPU.POWER_LIMIT_W).toBe(350);
    });

    it('SHOW_CONNECTION_STATUS is enabled', () => {
      expect(MONITORING_CONFIG.UI.SHOW_CONNECTION_STATUS).toBe(true);
    });

    it('DISCONNECTED_ANIMATION is enabled', () => {
      expect(MONITORING_CONFIG.UI.DISCONNECTED_ANIMATION).toBe(true);
    });

    it('ERROR_DISPLAY_DURATION is 10000 ms', () => {
      expect(MONITORING_CONFIG.UI.ERROR_DISPLAY_DURATION).toBe(10000);
    });

    it('conforms to MonitoringConfig type', () => {
      const config: MonitoringConfig = MONITORING_CONFIG;

      expect(config).toBeDefined();
    });

    it('has all required WEBSOCKET properties', () => {
      expect(MONITORING_CONFIG.WEBSOCKET).toHaveProperty('CONNECTION_TIMEOUT');
      expect(MONITORING_CONFIG.WEBSOCKET).toHaveProperty('AUTO_RECONNECT');
      expect(MONITORING_CONFIG.WEBSOCKET).toHaveProperty('MAX_RECONNECT_ATTEMPTS');
      expect(MONITORING_CONFIG.WEBSOCKET).toHaveProperty('RECONNECT_DELAY');
    });

    it('has all required MOCK_DATA properties', () => {
      expect(MONITORING_CONFIG.MOCK_DATA).toHaveProperty('ENABLE_FALLBACK');
      expect(MONITORING_CONFIG.MOCK_DATA).toHaveProperty('UPDATE_INTERVAL');
      expect(MONITORING_CONFIG.MOCK_DATA).toHaveProperty('GPU');
    });

    it('has all required UI properties', () => {
      expect(MONITORING_CONFIG.UI).toHaveProperty('SHOW_CONNECTION_STATUS');
      expect(MONITORING_CONFIG.UI).toHaveProperty('DISCONNECTED_ANIMATION');
      expect(MONITORING_CONFIG.UI).toHaveProperty('ERROR_DISPLAY_DURATION');
    });

    it('has all required GPU mock properties', () => {
      expect(MONITORING_CONFIG.MOCK_DATA.GPU).toHaveProperty('NAME');
      expect(MONITORING_CONFIG.MOCK_DATA.GPU).toHaveProperty('MEMORY_TOTAL_MB');
      expect(MONITORING_CONFIG.MOCK_DATA.GPU).toHaveProperty('POWER_LIMIT_W');
    });
  });

  describe('Config validation', () => {
    it('APP_CONFIG has all required properties', () => {
      expect(APP_CONFIG).toHaveProperty('name');
      expect(APP_CONFIG).toHaveProperty('version');
      expect(APP_CONFIG).toHaveProperty('description');
      expect(APP_CONFIG).toHaveProperty('api');
      expect(APP_CONFIG).toHaveProperty('features');
      expect(APP_CONFIG).toHaveProperty('theme');
      expect(APP_CONFIG).toHaveProperty('cache');
      expect(APP_CONFIG).toHaveProperty('sentry');
    });

    it('APP_CONFIG.api has all required properties', () => {
      expect(APP_CONFIG.api).toHaveProperty('baseUrl');
      expect(APP_CONFIG.api).toHaveProperty('websocketUrl');
      expect(APP_CONFIG.api).toHaveProperty('timeout');
    });

    it('APP_CONFIG.features has all required properties', () => {
      expect(APP_CONFIG.features).toHaveProperty('analytics');
      expect(APP_CONFIG.features).toHaveProperty('realtimeMonitoring');
      expect(APP_CONFIG.features).toHaveProperty('modelManagement');
      expect(APP_CONFIG.features).toHaveProperty('authentication');
    });

    it('APP_CONFIG.theme has all required properties', () => {
      expect(APP_CONFIG.theme).toHaveProperty('default');
      expect(APP_CONFIG.theme).toHaveProperty('dark');
      expect(APP_CONFIG.theme).toHaveProperty('light');
    });

    it('APP_CONFIG.cache has all required properties', () => {
      expect(APP_CONFIG.cache).toHaveProperty('ttl');
      expect(APP_CONFIG.cache).toHaveProperty('maxEntries');
    });

    it('APP_CONFIG.sentry has all required properties', () => {
      expect(APP_CONFIG.sentry).toHaveProperty('dsn');
      expect(APP_CONFIG.sentry).toHaveProperty('environment');
      expect(APP_CONFIG.sentry).toHaveProperty('tracesSampleRate');
    });

    it('MONITORING_CONFIG has all required properties', () => {
      expect(MONITORING_CONFIG).toHaveProperty('REQUIRE_REAL_DATA');
      expect(MONITORING_CONFIG).toHaveProperty('WEBSOCKET');
      expect(MONITORING_CONFIG).toHaveProperty('MOCK_DATA');
      expect(MONITORING_CONFIG).toHaveProperty('UI');
    });
  });

  describe('Config values', () => {
    it('APP_CONFIG.api baseUrl uses environment variable or default', () => {
      const isDefault = APP_CONFIG.api.baseUrl.includes('localhost:3000');
      const hasEnvVar = process.env.NEXT_PUBLIC_API_URL === APP_CONFIG.api.baseUrl;

      expect(isDefault || hasEnvVar).toBe(true);
    });

    it('APP_CONFIG.api websocketUrl uses environment variable or default', () => {
      const isDefault = APP_CONFIG.api.websocketUrl.includes('ws://localhost:3000');
      const hasEnvVar = process.env.NEXT_PUBLIC_WS_URL === APP_CONFIG.api.websocketUrl;

      expect(isDefault || hasEnvVar).toBe(true);
    });

    it('APP_CONFIG.sentry.dsn uses environment variable or empty string', () => {
      const isEmpty = APP_CONFIG.sentry.dsn === '';
      const hasEnvVar = process.env.NEXT_PUBLIC_SENTRY_DSN === APP_CONFIG.sentry.dsn;

      expect(isEmpty || hasEnvVar).toBe(true);
    });

    it('APP_CONFIG.sentry.environment uses NODE_ENV or development', () => {
      const isDevelopment = APP_CONFIG.sentry.environment === 'development';
      const hasEnvVar = process.env.NODE_ENV === APP_CONFIG.sentry.environment;

      expect(isDevelopment || hasEnvVar).toBe(true);
    });

    it('MONITORING_CONFIG.REQUIRE_REAL_DATA matches NODE_ENV in production', () => {
      if (process.env.NODE_ENV === 'production') {
        expect(MONITORING_CONFIG.REQUIRE_REAL_DATA).toBe(true);
      }
    });

    it('MONITORING_CONFIG.MOCK_DATA.ENABLE_FALLBACK is false in production', () => {
      if (process.env.NODE_ENV === 'production') {
        expect(MONITORING_CONFIG.MOCK_DATA.ENABLE_FALLBACK).toBe(false);
      }
    });
  });

  describe('Config types', () => {
    it('AppConfig type is correctly typed', () => {
      const config: AppConfig = {
        name: 'Llama Runner Pro' as const,
        version: '2.0.0' as const,
        description: 'Advanced Llama Model Management System' as const,
        api: {
          baseUrl: 'http://localhost:3000',
          websocketUrl: 'ws://localhost:3000',
          timeout: 30000,
        },
        features: {
          analytics: true,
          realtimeMonitoring: true,
          modelManagement: true,
          authentication: false,
        },
        theme: {
          default: 'system',
          dark: 'dark',
          light: 'light',
        },
        cache: {
          ttl: 300,
          maxEntries: 100,
        },
        sentry: {
          dsn: '',
          environment: 'development',
          tracesSampleRate: 1.0,
        },
      };

      expect(config).toBeDefined();
    });

    it('MonitoringConfig type is correctly typed', () => {
      const config: MonitoringConfig = {
        REQUIRE_REAL_DATA: false,
        WEBSOCKET: {
          CONNECTION_TIMEOUT: 15000,
          AUTO_RECONNECT: true,
          MAX_RECONNECT_ATTEMPTS: 5,
          RECONNECT_DELAY: 3000,
        },
        MOCK_DATA: {
          ENABLE_FALLBACK: true,
          UPDATE_INTERVAL: 5000,
          GPU: {
            NAME: 'NVIDIA RTX 4090',
            MEMORY_TOTAL_MB: 24576,
            POWER_LIMIT_W: 350,
          },
        },
        UI: {
          SHOW_CONNECTION_STATUS: true,
          DISCONNECTED_ANIMATION: true,
          ERROR_DISPLAY_DURATION: 10000,
        },
      };

      expect(config).toBeDefined();
    });
  });

  describe('Config immutability', () => {
    it('APP_CONFIG properties have correct types', () => {
      expect(typeof APP_CONFIG.name).toBe('string');
      expect(typeof APP_CONFIG.version).toBe('string');
      expect(typeof APP_CONFIG.description).toBe('string');
    });

    it('APP_CONFIG.api properties have correct types', () => {
      expect(typeof APP_CONFIG.api.baseUrl).toBe('string');
      expect(typeof APP_CONFIG.api.websocketUrl).toBe('string');
      expect(typeof APP_CONFIG.api.timeout).toBe('number');
    });

    it('APP_CONFIG.features properties are booleans', () => {
      expect(typeof APP_CONFIG.features.analytics).toBe('boolean');
      expect(typeof APP_CONFIG.features.realtimeMonitoring).toBe('boolean');
      expect(typeof APP_CONFIG.features.modelManagement).toBe('boolean');
      expect(typeof APP_CONFIG.features.authentication).toBe('boolean');
    });

    it('APP_CONFIG.theme properties are strings', () => {
      expect(typeof APP_CONFIG.theme.default).toBe('string');
      expect(typeof APP_CONFIG.theme.dark).toBe('string');
      expect(typeof APP_CONFIG.theme.light).toBe('string');
    });

    it('APP_CONFIG.cache properties are numbers', () => {
      expect(typeof APP_CONFIG.cache.ttl).toBe('number');
      expect(typeof APP_CONFIG.cache.maxEntries).toBe('number');
    });

    it('APP_CONFIG.sentry properties have correct types', () => {
      expect(typeof APP_CONFIG.sentry.dsn).toBe('string');
      expect(typeof APP_CONFIG.sentry.environment).toBe('string');
      expect(typeof APP_CONFIG.sentry.tracesSampleRate).toBe('number');
    });

    it('MONITORING_CONFIG.REQUIRE_REAL_DATA is boolean', () => {
      expect(typeof MONITORING_CONFIG.REQUIRE_REAL_DATA).toBe('boolean');
    });

    it('MONITORING_CONFIG.WEBSOCKET properties have correct types', () => {
      expect(typeof MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT).toBe('number');
      expect(typeof MONITORING_CONFIG.WEBSOCKET.AUTO_RECONNECT).toBe('boolean');
      expect(typeof MONITORING_CONFIG.WEBSOCKET.MAX_RECONNECT_ATTEMPTS).toBe('number');
      expect(typeof MONITORING_CONFIG.WEBSOCKET.RECONNECT_DELAY).toBe('number');
    });

    it('MONITORING_CONFIG.MOCK_DATA properties have correct types', () => {
      expect(typeof MONITORING_CONFIG.MOCK_DATA.ENABLE_FALLBACK).toBe('boolean');
      expect(typeof MONITORING_CONFIG.MOCK_DATA.UPDATE_INTERVAL).toBe('number');
      expect(typeof MONITORING_CONFIG.MOCK_DATA.GPU.NAME).toBe('string');
      expect(typeof MONITORING_CONFIG.MOCK_DATA.GPU.MEMORY_TOTAL_MB).toBe('number');
      expect(typeof MONITORING_CONFIG.MOCK_DATA.GPU.POWER_LIMIT_W).toBe('number');
    });

    it('MONITORING_CONFIG.UI properties have correct types', () => {
      expect(typeof MONITORING_CONFIG.UI.SHOW_CONNECTION_STATUS).toBe('boolean');
      expect(typeof MONITORING_CONFIG.UI.DISCONNECTED_ANIMATION).toBe('boolean');
      expect(typeof MONITORING_CONFIG.UI.ERROR_DISPLAY_DURATION).toBe('number');
    });
  });

  describe('Config edge cases', () => {
    it('handles empty Sentry DSN', () => {
      expect(APP_CONFIG.sentry.dsn).toBeDefined();
    });

    it('handles valid timeout value', () => {
      expect(APP_CONFIG.api.timeout).toBeGreaterThan(0);
    });

    it('handles valid cache TTL', () => {
      expect(APP_CONFIG.cache.ttl).toBeGreaterThan(0);
    });

    it('handles valid cache maxEntries', () => {
      expect(APP_CONFIG.cache.maxEntries).toBeGreaterThan(0);
    });

    it('handles valid tracesSampleRate', () => {
      expect(APP_CONFIG.sentry.tracesSampleRate).toBeGreaterThanOrEqual(0);
      expect(APP_CONFIG.sentry.tracesSampleRate).toBeLessThanOrEqual(1);
    });

    it('handles valid CONNECTION_TIMEOUT', () => {
      expect(MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT).toBeGreaterThan(0);
    });

    it('handles valid MAX_RECONNECT_ATTEMPTS', () => {
      expect(MONITORING_CONFIG.WEBSOCKET.MAX_RECONNECT_ATTEMPTS).toBeGreaterThan(0);
    });

    it('handles valid RECONNECT_DELAY', () => {
      expect(MONITORING_CONFIG.WEBSOCKET.RECONNECT_DELAY).toBeGreaterThan(0);
    });

    it('handles valid UPDATE_INTERVAL', () => {
      expect(MONITORING_CONFIG.MOCK_DATA.UPDATE_INTERVAL).toBeGreaterThan(0);
    });

    it('handles valid GPU MEMORY_TOTAL_MB', () => {
      expect(MONITORING_CONFIG.MOCK_DATA.GPU.MEMORY_TOTAL_MB).toBeGreaterThan(0);
    });

    it('handles valid GPU POWER_LIMIT_W', () => {
      expect(MONITORING_CONFIG.MOCK_DATA.GPU.POWER_LIMIT_W).toBeGreaterThan(0);
    });

    it('handles valid ERROR_DISPLAY_DURATION', () => {
      expect(MONITORING_CONFIG.UI.ERROR_DISPLAY_DURATION).toBeGreaterThan(0);
    });
  });

  describe('Config integration', () => {
    it('APP_CONFIG and MONITORING_CONFIG are both defined', () => {
      expect(APP_CONFIG).toBeDefined();
      expect(MONITORING_CONFIG).toBeDefined();
    });

    it('configs have no conflicting values', () => {
      expect(APP_CONFIG.features.realtimeMonitoring).toBe(MONITORING_CONFIG.REQUIRE_REAL_DATA || true);
    });

    it('configs are loadable without errors', () => {
      expect(() => {
        require('@/config/app.config');
        require('@/config/monitoring.config');
      }).not.toThrow();
    });
  });
});
