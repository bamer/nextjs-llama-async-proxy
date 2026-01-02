import { APP_CONFIG, type AppConfig } from '@/config/app.config';

describe('General Config Tests', () => {
  describe('APP_CONFIG basic properties', () => {
    it('has correct name', () => {
      expect(APP_CONFIG.name).toBe('Llama Runner Pro');
    });

    it('has correct version', () => {
      expect(APP_CONFIG.version).toBe('2.0.0');
    });

    it('has description', () => {
      expect(APP_CONFIG.description).toBe('Advanced Llama Model Management System');
    });

    it('conforms to AppConfig type', () => {
      const config: AppConfig = APP_CONFIG;

      expect(config).toBeDefined();
    });

    it('is read-only (frozen)', () => {
      expect(() => {
        (APP_CONFIG as any).name = 'Modified';
      }).toThrow();
    });
  });

  describe('APP_CONFIG API configuration', () => {
    it('has API configuration', () => {
      expect(APP_CONFIG.api).toBeDefined();
      expect(APP_CONFIG.api.baseUrl).toBeDefined();
      expect(APP_CONFIG.api.websocketUrl).toBeDefined();
      expect(APP_CONFIG.api.timeout).toBeDefined();
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

    it('API baseUrl uses environment variable or default', () => {
      const isDefault = APP_CONFIG.api.baseUrl.includes('localhost:3000');
      const hasEnvVar = process.env.NEXT_PUBLIC_API_URL === APP_CONFIG.api.baseUrl;

      expect(isDefault || hasEnvVar).toBe(true);
    });

    it('API websocketUrl uses environment variable or default', () => {
      const isDefault = APP_CONFIG.api.websocketUrl.includes('ws://localhost:3000');
      const hasEnvVar = process.env.NEXT_PUBLIC_WS_URL === APP_CONFIG.api.websocketUrl;

      expect(isDefault || hasEnvVar).toBe(true);
    });
  });

  describe('APP_CONFIG feature flags', () => {
    it('has feature flags', () => {
      expect(APP_CONFIG.features).toBeDefined();
      expect(APP_CONFIG.features.analytics).toBeDefined();
      expect(APP_CONFIG.features.realtimeMonitoring).toBeDefined();
      expect(APP_CONFIG.features.modelManagement).toBeDefined();
      expect(APP_CONFIG.features.authentication).toBeDefined();
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
  });

  describe('APP_CONFIG theme', () => {
    it('has theme configuration', () => {
      expect(APP_CONFIG.theme).toBeDefined();
      expect(APP_CONFIG.theme.default).toBeDefined();
      expect(APP_CONFIG.theme.dark).toBeDefined();
      expect(APP_CONFIG.theme.light).toBeDefined();
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
  });

  describe('APP_CONFIG cache', () => {
    it('has cache configuration', () => {
      expect(APP_CONFIG.cache).toBeDefined();
      expect(APP_CONFIG.cache.ttl).toBeDefined();
      expect(APP_CONFIG.cache.maxEntries).toBeDefined();
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
  });

  describe('APP_CONFIG Sentry', () => {
    it('has Sentry configuration', () => {
      expect(APP_CONFIG.sentry).toBeDefined();
      expect(APP_CONFIG.sentry.dsn).toBeDefined();
      expect(APP_CONFIG.sentry.environment).toBeDefined();
      expect(APP_CONFIG.sentry.tracesSampleRate).toBeDefined();
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

    it('Sentry.dsn uses environment variable or empty string', () => {
      const isEmpty = APP_CONFIG.sentry.dsn === '';
      const hasEnvVar = process.env.NEXT_PUBLIC_SENTRY_DSN === APP_CONFIG.sentry.dsn;

      expect(isEmpty || hasEnvVar).toBe(true);
    });

    it('Sentry.environment uses NODE_ENV or development', () => {
      const isDevelopment = APP_CONFIG.sentry.environment === 'development';
      const hasEnvVar = process.env.NODE_ENV === APP_CONFIG.sentry.environment;

      expect(isDevelopment || hasEnvVar).toBe(true);
    });
  });
});
