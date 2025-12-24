/**
 * Monitoring Configuration
 * 
 * This file controls the behavior of the monitoring dashboard
 * and whether to use mock data or require real WebSocket connection
 */

export const MONITORING_CONFIG = {
  // Set to true to require real WebSocket connection (production mode)
  // Set to false to allow mock data for development/testing
  REQUIRE_REAL_DATA: process.env.NODE_ENV === 'production',
  
  // WebSocket connection settings
  WEBSOCKET: {
    // Timeout before considering connection failed (in ms)
    // Increased to 15 seconds to allow Socket.IO to connect and receive initial data
    CONNECTION_TIMEOUT: 15000,
    
    // Automatic reconnection settings
    AUTO_RECONNECT: true,
    MAX_RECONNECT_ATTEMPTS: 5,
    RECONNECT_DELAY: 3000,
  },
  
  // Mock data settings (only used if REQUIRE_REAL_DATA is false)
  MOCK_DATA: {
    // Enable mock data fallback when WebSocket fails
    ENABLE_FALLBACK: process.env.NODE_ENV !== 'production',
    
    // Mock data update interval (in ms)
    UPDATE_INTERVAL: 5000,
    
    // Mock GPU data (example values)
    GPU: {
      NAME: 'NVIDIA RTX 4090',
      MEMORY_TOTAL_MB: 24576, // 24GB
      POWER_LIMIT_W: 350,
    }
  },
  
  // UI Settings
  UI: {
    // Show connection status prominently
    SHOW_CONNECTION_STATUS: true,
    
    // Animation for disconnected state
    DISCONNECTED_ANIMATION: true,
    
    // Error display timeout (in ms)
    ERROR_DISPLAY_DURATION: 10000,
  }
};

export type MonitoringConfig = typeof MONITORING_CONFIG;