import { MONITORING_CONFIG, type MonitoringConfig } from '@/config/monitoring.config';

describe('Monitoring Config Tests', () => {
  describe('MONITORING_CONFIG basic properties', () => {
    it('has REQUIRE_REAL_DATA property', () => {
      expect(MONITORING_CONFIG.REQUIRE_REAL_DATA).toBeDefined();
    });

    it('REQUIRE_REAL_DATA is boolean', () => {
      expect(typeof MONITORING_CONFIG.REQUIRE_REAL_DATA).toBe('boolean');
    });

    it('REQUIRE_REAL_DATA matches NODE_ENV in production', () => {
      if (process.env.NODE_ENV === 'production') {
        expect(MONITORING_CONFIG.REQUIRE_REAL_DATA).toBe(true);
      }
    });

    it('conforms to MonitoringConfig type', () => {
      const config: MonitoringConfig = MONITORING_CONFIG;

      expect(config).toBeDefined();
    });
  });

  describe('MONITORING_CONFIG WEBSOCKET', () => {
    it('has WEBSOCKET configuration', () => {
      expect(MONITORING_CONFIG.WEBSOCKET).toBeDefined();
      expect(MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT).toBeDefined();
      expect(MONITORING_CONFIG.WEBSOCKET.AUTO_RECONNECT).toBeDefined();
      expect(MONITORING_CONFIG.WEBSOCKET.MAX_RECONNECT_ATTEMPTS).toBeDefined();
      expect(MONITORING_CONFIG.WEBSOCKET.RECONNECT_DELAY).toBeDefined();
    });

    it('has all required WEBSOCKET properties', () => {
      expect(MONITORING_CONFIG.WEBSOCKET).toHaveProperty('CONNECTION_TIMEOUT');
      expect(MONITORING_CONFIG.WEBSOCKET).toHaveProperty('AUTO_RECONNECT');
      expect(MONITORING_CONFIG.WEBSOCKET).toHaveProperty('MAX_RECONNECT_ATTEMPTS');
      expect(MONITORING_CONFIG.WEBSOCKET).toHaveProperty('RECONNECT_DELAY');
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
  });

  describe('MONITORING_CONFIG MOCK_DATA', () => {
    it('has MOCK_DATA configuration', () => {
      expect(MONITORING_CONFIG.MOCK_DATA).toBeDefined();
      expect(MONITORING_CONFIG.MOCK_DATA.ENABLE_FALLBACK).toBeDefined();
      expect(MONITORING_CONFIG.MOCK_DATA.UPDATE_INTERVAL).toBeDefined();
      expect(MONITORING_CONFIG.MOCK_DATA.GPU).toBeDefined();
    });

    it('has all required MOCK_DATA properties', () => {
      expect(MONITORING_CONFIG.MOCK_DATA).toHaveProperty('ENABLE_FALLBACK');
      expect(MONITORING_CONFIG.MOCK_DATA).toHaveProperty('UPDATE_INTERVAL');
      expect(MONITORING_CONFIG.MOCK_DATA).toHaveProperty('GPU');
    });

    it('has all required GPU mock properties', () => {
      expect(MONITORING_CONFIG.MOCK_DATA.GPU).toHaveProperty('NAME');
      expect(MONITORING_CONFIG.MOCK_DATA.GPU).toHaveProperty('MEMORY_TOTAL_MB');
      expect(MONITORING_CONFIG.MOCK_DATA.GPU).toHaveProperty('POWER_LIMIT_W');
    });

    it('ENABLE_FALLBACK is boolean', () => {
      expect(typeof MONITORING_CONFIG.MOCK_DATA.ENABLE_FALLBACK).toBe('boolean');
    });

    it('ENABLE_FALLBACK is false in production', () => {
      if (process.env.NODE_ENV === 'production') {
        expect(MONITORING_CONFIG.MOCK_DATA.ENABLE_FALLBACK).toBe(false);
      }
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
  });

  describe('MONITORING_CONFIG UI', () => {
    it('has UI configuration', () => {
      expect(MONITORING_CONFIG.UI).toBeDefined();
      expect(MONITORING_CONFIG.UI.SHOW_CONNECTION_STATUS).toBeDefined();
      expect(MONITORING_CONFIG.UI.DISCONNECTED_ANIMATION).toBeDefined();
      expect(MONITORING_CONFIG.UI.ERROR_DISPLAY_DURATION).toBeDefined();
    });

    it('has all required UI properties', () => {
      expect(MONITORING_CONFIG.UI).toHaveProperty('SHOW_CONNECTION_STATUS');
      expect(MONITORING_CONFIG.UI).toHaveProperty('DISCONNECTED_ANIMATION');
      expect(MONITORING_CONFIG.UI).toHaveProperty('ERROR_DISPLAY_DURATION');
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
  });
});
