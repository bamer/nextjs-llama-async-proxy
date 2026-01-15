/**
 * App Loader - Loads all app modules in correct order
 * Replaces app.js with proper module loading
 */

(function () {
  "use strict";

  console.log("[App] Starting application initialization...");

  // ========================================
  // PHASE 1: Initialization & Error Handling
  // ========================================

  // Error boundary
  function showErrorBoundary(error) {
    const appEl = document.getElementById("app");
    if (appEl) {
      appEl.innerHTML = `
        <div class="error-boundary">
          <div class="error-boundary-content">
            <h1>Application Error</h1>
            <p>Something went wrong while initializing the application.</p>
            <div class="error-details">
              <strong>Error:</strong>
              <pre>${error?.message || error}</pre>
            </div>
            <button onclick="location.reload()" class="btn btn-primary">Reload Application</button>
          </div>
        </div>
      `;
    }
  }

  // Error handlers
  window.addEventListener("error", (e) => {
    const msg = e.error?.message || "An unexpected error occurred";
    if (typeof showNotification === "function") {
      showNotification(msg, "error");
    }

    if (e.error && (e.error.message.includes("Cannot read") || e.error.message.includes("is not a function"))) {
      showErrorBoundary(e.error);
    }
  });

  window.addEventListener("unhandledrejection", (e) => {
    const msg = e.reason?.message || "An unexpected error occurred";
    if (typeof showNotification === "function") {
      showNotification(msg, "error");
    }

    if (e.reason && e.reason.message) {
      showErrorBoundary(e.reason);
    }
  });

  console.log("[App] Error handling configured");

  // ========================================
  // PHASE 2: Initialize Services
  // ========================================

  document.addEventListener("DOMContentLoaded", () => {
    try {
      console.log("[App] Initializing services...");

      if (typeof socketClient !== "undefined") {
        socketClient.connect();
        console.log("[App] Socket.IO connected");
      }

      if (typeof stateManager !== "undefined") {
        stateManager.init(socketClient);
        window.stateLlamaServer = new window.StateLlamaServer(stateManager.core, stateManager.socket);
        console.log("[App] State manager initialized");
      }

      console.log("[App] Services initialized successfully");
    } catch (e) {
      console.error("[App] Service initialization failed:", e);
      showErrorBoundary(e);
      return;
    }

    // PHASE 2.5: Initialize and Mount Main Layout
    try {
      console.log("[App] Initializing main layout...");
      if (typeof Layout !== "undefined") {
        const appEl = document.getElementById("app");
        if (appEl) {
          const layout = new Layout({});
          layout.mount(appEl);
          window.appLayout = layout; // Store reference if needed globally
          console.log("[App] Main layout mounted.");
        }
      } else {
        console.warn("[App] Layout component not found. Skipping layout mounting.");
      }
    } catch (e) {
      console.error("[App] Layout initialization failed:", e);
      showErrorBoundary(e);
      return;
    }

    // ========================================
    // PHASE 3: Initialize Router & Routes
    // ========================================

    try {
      console.log("[App] Setting up router...");

      const router = new Router({ root: document.getElementById("app") });

      // Register routes
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

      console.log("[App] Router initialized and started");

    } catch (e) {
      console.error("[App] Router initialization failed:", e);
      showErrorBoundary(e);
      return;
    }
  });

  window.showErrorBoundary = showErrorBoundary;
  console.log("[App] Application loader complete");

})();
