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
 * Utility functions - convenience wrappers around FormatUtils
 */
window.AppUtils = {
  formatBytes: FormatUtils.formatBytes.bind(FormatUtils),
  formatPercent: FormatUtils.formatPercent.bind(FormatUtils),
  formatTimestamp: FormatUtils.formatTimestamp.bind(FormatUtils),
  formatRelativeTime: FormatUtils.formatRelativeTime.bind(FormatUtils),
  debounce: function(func, wait) {
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
  throttle: function(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  generateId: function() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
  deepClone: function(obj) {
    return JSON.parse(JSON.stringify(obj));
  },
  isEmpty: ValidationUtils.isEmpty.bind(ValidationUtils)
};
