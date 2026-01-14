/**
 * Debug Logger - Configurable debug logging
 * Provides consistent [DEBUG] [Module] message format
 */

const DebugLogger = {
  enabled: process.env.NODE_ENV !== "production",
  
  /**
   * Enable/disable debug logging
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  },
  
  /**
   * Log debug message
   */
  log(module, message, data) {
    if (!this.enabled) return;
    
    if (data !== undefined) {
      console.log(`[DEBUG] [${module}] ${message}:`, data);
    } else {
      console.log(`[DEBUG] [${module}] ${message}`);
    }
  },
  
  /**
   * Log error in debug mode
   */
  error(module, message, error) {
    if (!this.enabled) return;
    
    if (error) {
      console.error(`[DEBUG] [${module}] ${message}:`, error.message || error);
    } else {
      console.error(`[DEBUG] [${module}] ${message}`);
    }
  },
  
  /**
   * Log warning in debug mode
   */
  warn(module, message, data) {
    if (!this.enabled) return;
    
    if (data !== undefined) {
      console.warn(`[DEBUG] [${module}] ${message}:`, data);
    } else {
      console.warn(`[DEBUG] [${module}] ${message}`);
    }
  },
};

window.DebugLogger = DebugLogger;
