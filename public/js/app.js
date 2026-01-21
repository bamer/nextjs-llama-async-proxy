/**
 * Main Application Entry Point - Simplified
 * Refactored to use separate modules (≤200 lines)
 */

(function () {
  "use strict";

  // Execute initialization modules (they handle their own setup)
  if (typeof window.initializeApp === "function") {
    window.initializeApp();
  }

  // Initialize router after layout is ready
  function initRouter() {
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
  }

  // Wait for app-init to complete before initializing router
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRouter);
  } else {
    initRouter();
  }
})();
