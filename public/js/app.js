/**
 * Main Application Entry Point
 * Initializes all services and starts the router
 */

(function() {
  'use strict';

  console.log('[App] Initializing application...');

  // Initialize Socket.IO client
  socketClient.connect();

  // Initialize state manager with socket
  stateManager.init(socketClient);

  // Setup global error handler
  window.addEventListener('error', handleGlobalError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);

  // Initialize router
  const router = new Router({ root: document.getElementById('app') });

  // Register routes
  router.register('/', () => new DashboardController({}));
  router.register('/dashboard', () => new DashboardController({}));
  router.register('/models', () => new ModelsController({}));
  router.register('/monitoring', () => new MonitoringController({}));
  router.register('/configuration', () => new ConfigurationController({}));
  router.register('/settings', () => new SettingsController({}));
  router.register('/logs', () => new LogsController({}));

  // Not found handler
  router.notFound(() => new NotFoundController({}));

  // Global before hook - check connection
  router.beforeEach(async (path, route) => {
    if (socketClient.isConnected) {
      return true;
    }
    // Wait for connection
    return new Promise((resolve) => {
      const checkConnection = setInterval(() => {
        if (socketClient.isConnected) {
          clearInterval(checkConnection);
          resolve(true);
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkConnection);
        console.warn('[App] Connection timeout, proceeding anyway...');
        resolve(true);
      }, 10000);
    });
  });

  // Global after hook - log navigation
  router.afterEach((path, route) => {
    console.log(`[App] Navigated to: ${path}`);
    updateActiveNav(path);
  });

  // Start router
  router.start();

  // Expose router globally for navigation
  window.router = router;

  console.log('[App] Application initialized');
})();

/**
 * Update active navigation state
 */
function updateActiveNav(path) {
  const navLinks = document.querySelectorAll('.nav-link, .sidebar-link');
  navLinks.forEach(link => {
    const href = link.getAttribute('href') || link.dataset.href;
    if (href === path || (path.startsWith(href) && href !== '/')) {
      link.classList.add('active');
    } else if (href === '/' && path === '/dashboard') {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/**
 * Global error handler
 */
function handleGlobalError(event) {
  console.error('[App] Global error:', event.error);
  showNotification('An error occurred. Please check the console.', 'error');
}

/**
 * Unhandled promise rejection handler
 */
function handleUnhandledRejection(event) {
  console.error('[App] Unhandled promise rejection:', event.reason);
  showNotification('An error occurred. Please check the console.', 'error');
}

/**
 * Show notification (simple implementation)
 */
function showNotification(message, type = 'info') {
  const container = document.getElementById('notifications');
  if (!container) return;

  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <span class="notification-message">${message}</span>
    <button class="notification-close">&times;</button>
  `;

  container.appendChild(notification);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.classList.add('notification-hiding');
    setTimeout(() => notification.remove(), 300);
  }, 5000);

  // Close button
  notification.querySelector('.notification-close').addEventListener('click', () => {
    notification.classList.add('notification-hiding');
    setTimeout(() => notification.remove(), 300);
  });
}

/**
 * Utility functions
 */
window.AppUtils = {
  // Format bytes to human readable
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Format percentage
  formatPercent(value, decimals = 1) {
    return (value * 100).toFixed(decimals) + '%';
  },

  // Format timestamp
  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  },

  // Format relative time
  formatRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  },

  // Debounce function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function
  throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Generate unique ID
  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // Deep clone object
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  // Check if object is empty
  isEmpty(obj) {
    if (!obj) return true;
    if (Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return false;
  }
};
