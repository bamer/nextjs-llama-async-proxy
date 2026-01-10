/**
 * Main Application Entry Point - Simplified
 */

(function () {
  "use strict";

  console.log("[App] Initializing...");

  // Global error state
  let hasFatalError = false;
  let fatalError = null;

  // Error boundary - show error UI
  function showErrorBoundary(error) {
    console.error("[App] ERROR BOUNDARY:", error);
    hasFatalError = true;
    fatalError = error;

    const appEl = document.getElementById("app");
    if (appEl) {
      appEl.innerHTML = `
        <div class="error-boundary">
          <div class="error-boundary-content">
            <h1>⚠️ Application Error</h1>
            <p>Something went wrong while initializing the application.</p>
            <div class="error-details">
              <strong>Error:</strong>
              <pre>${error.message || error}</pre>
            </div>
            <button onclick="location.reload()" class="btn btn-primary">Reload Application</button>
          </div>
        </div>
      `;
    }
  }

  // Error handlers with detailed logging
  window.addEventListener("error", (e) => {
    console.error("[App] Error:", e.error);
    console.error("[App] Error stack:", e.error?.stack);
    console.error("[App] Error source:", e.filename, "line:", e.lineno);

    // Show user-friendly error
    const msg = e.error?.message || "An unexpected error occurred";
    showNotification(msg, "error");

    // For critical errors, show error boundary
    if (
      e.error &&
      (e.error.message.includes("Cannot read") || e.error.message.includes("is not a function"))
    ) {
      showErrorBoundary(e.error);
    }
  });

  window.addEventListener("unhandledrejection", (e) => {
    console.error("[App] Rejection:", e.reason);
    console.error("[App] Rejection stack:", e.reason?.stack);

    const msg = e.reason?.message || "An unexpected error occurred";
    showNotification(msg, "error");

    // For critical rejections, show error boundary
    if (e.reason && e.reason.message) {
      showErrorBoundary(e.reason);
    }
  });

  // Initialize services with error handling
  try {
    console.log("[App] Connecting socket...");
    socketClient.connect();
    console.log("[App] Initializing state manager...");
    stateManager.init(socketClient);
    console.log("[App] Services initialized successfully");
  } catch (e) {
    console.error("[App] Service initialization failed:", e);
    showErrorBoundary(e);
    return;
  }

  // Router
  const router = new Router({ root: document.getElementById("app") });

  router.register("/", () => new DashboardController({}));
  router.register("/dashboard", () => new DashboardController({}));
  router.register("/models", () => new ModelsController({}));
  router.register("/presets", () => new PresetsController({}));
  router.register("/settings", () => new SettingsController({}));
  router.register("/logs", () => new LogsController({}));

  // Navigation update
  router.afterEach((path) => {
    document.querySelectorAll(".nav-link").forEach((l) => {
      const h = l.getAttribute("href");
      if (h === path || (path.startsWith(h) && h !== "/")) l.classList.add("active");
      else l.classList.remove("active");
    });
  });

  router.start();
  window.router = router;

  console.log("[App] Ready");
})();

// Notifications
function showNotification(msg, type = "info") {
  const c = document.getElementById("notifications");
  if (!c) return;
  const n = document.createElement("div");
  n.className = `notification notification-${type}`;
  n.innerHTML = `<span>${msg}</span><button onclick="this.parentElement.remove()">×</button>`;
  c.appendChild(n);
  // Remove after 10 seconds (increased for debugging)
  setTimeout(() => {
    if (n.parentElement) n.remove();
  }, 10000);
}

// Utils
window.AppUtils = {
  formatBytes: (b) => FormatUtils.formatBytes(b),
  formatPercent: (v) => FormatUtils.formatPercent(v),
  formatTimestamp: (t) => FormatUtils.formatTimestamp(t),
  formatRelativeTime: (t) => FormatUtils.formatRelativeTime(t),
  debounce: (f, w) => {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => f(...a), w);
    };
  },
  throttle: (f, l) => {
    let t;
    return (...a) => {
      if (!t) {
        f(...a);
        t = setTimeout(() => (t = null), l);
      }
    };
  },
  generateId: () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  deepClone: (o) => JSON.parse(JSON.stringify(o)),
  isEmpty: (o) => !o || (Array.isArray(o) ? o.length : Object.keys(o).length) === 0,
};
