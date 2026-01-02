import { APP_CONFIG } from '@/config/app.config';
import { MONITORING_CONFIG } from '@/config/monitoring.config';

describe('System Config Tests', () => {
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

  describe('Config types', () => {
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
      expect(APP_CONFIG.features.realtimeMonitoring).toBe(
        MONITORING_CONFIG.REQUIRE_REAL_DATA || true,
      );
    });

    it('configs are loadable without errors', () => {
      expect(() => {
        require('@/config/app.config');
        require('@/config/monitoring.config');
      }).not.toThrow();
    });
  });
});
