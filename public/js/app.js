/**
 * Main Application Entry Point - Simplified
 */

(function () {
  "use strict";

  console.log("[App] Initializing...");

  // Initialize services
  socketClient.connect();
  stateManager.init(socketClient);

  // Error handlers
  window.addEventListener("error", (e) => {
    console.error("[App] Error:", e.error);
    showNotification("An error occurred", "error");
  });
  window.addEventListener("unhandledrejection", (e) => {
    console.error("[App] Rejection:", e.reason);
    showNotification("An error occurred", "error");
  });

  // Router
  const router = new Router({ root: document.getElementById("app") });

  router.register("/", () => new DashboardController({}));
  router.register("/dashboard", () => new DashboardController({}));
  router.register("/models", () => new ModelsController({}));
  router.register("/monitoring", () => new MonitoringController({}));
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
