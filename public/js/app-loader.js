/**
 * App Loader - Simplified initialization
 */

(function () {
  "use strict";

  // Show errors in UI
  function showErrorBoundary(error) {
    const appEl = document.getElementById("app");
    const msg = error?.message || error || "Unknown error";
    console.error("[App] Error:", msg);
    if (appEl) {
      appEl.innerHTML = `<div style="padding:2rem;color:red;"><h1>Error</h1><p>${msg}</p><button onclick="location.reload()">Reload</button></div>`;
    }
  }

  window.addEventListener("error", (e) => showErrorBoundary(e.error || e.message));
  window.addEventListener("unhandledrejection", (e) => showErrorBoundary(e.reason));

  document.addEventListener("DOMContentLoaded", () => {
    socketClient?.connect();

    const router = new Router({ root: document.getElementById("app") });
    router.register("/", () => new DashboardController({}));
    router.register("/dashboard", () => new DashboardController({}));
    router.register("/models", () => new ModelsController({}));
    router.register("/presets", () => new PresetsController({}));
    router.register("/settings", () => new SettingsController({}));
    router.register("/logs", () => new LogsController({}));

    router.afterEach((path) => {
      document.querySelectorAll(".nav-link").forEach((l) => {
        const h = l.getAttribute("href");
        if (h === path || (path.startsWith(h) && h !== "/")) l.classList.add("active");
        else l.classList.remove("active");
      });
    });

    router.start();
    window.router = router;
  });
})();
