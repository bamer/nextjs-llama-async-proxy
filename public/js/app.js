/**
 * Main Application Entry Point - Simplified
 */

/* global ToastManager, KeyboardShortcutsHelp, ChartLoader */

(function () {
  "use strict";

  // Error boundary - show error UI
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
              <pre>${error.message || error}</pre>
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
    showNotification(msg, "error");

    if (
      e.error &&
      (e.error.message.includes("Cannot read") || e.error.message.includes("is not a function"))
    ) {
      showErrorBoundary(e.error);
    }
  });

  window.addEventListener("unhandledrejection", (e) => {
    const msg = e.reason?.message || "An unexpected error occurred";
    showNotification(msg, "error");

    if (e.reason && e.reason.message) {
      showErrorBoundary(e.reason);
    }
  });

  // Initialize keyboard shortcuts
  try {
    window.keyboardShortcuts.init();

    window.keyboardShortcuts.register(
      "ctrl+l",
      () => {
        const currentPath = window.router.getPath();
        if (currentPath === "/models") {
          const loadBtn = document.querySelector("[data-action=load]");
          if (loadBtn) loadBtn.click();
        }
      },
      "Load selected model (on Models page)"
    );

    window.keyboardShortcuts.register(
      "ctrl+s",
      () => {
        const currentPath = window.router.getPath();
        if (currentPath === "/models") {
          const scanBtn = document.querySelector("[data-action=scan]");
          if (scanBtn) scanBtn.click();
        } else if (currentPath === "/settings") {
          const saveBtn = document.querySelector("[data-action=save]");
          if (saveBtn) saveBtn.click();
        }
      },
      "Scan models (on Models) or Save settings (on Settings)"
    );

    window.keyboardShortcuts.register(
      "escape",
      () => {
        document.querySelectorAll(".modal.active").forEach((modal) => {
          modal.classList.remove("active");
        });
      },
      "Close modals/dropdowns"
    );

    window.keyboardShortcuts.register(
      "ctrl+d",
      () => {
        window.router.navigate("/dashboard");
      },
      "Navigate to Dashboard"
    );

    window.keyboardShortcuts.register(
      "ctrl+m",
      () => {
        window.router.navigate("/models");
      },
      "Navigate to Models"
    );

    window.keyboardShortcuts.register(
      "ctrl+p",
      () => {
        window.router.navigate("/presets");
      },
      "Navigate to Presets"
    );

    window.keyboardShortcuts.register(
      "ctrl+g",
      () => {
        window.router.navigate("/settings");
      },
      "Navigate to Settings"
    );

    window.keyboardShortcuts.register(
      "ctrl+h",
      () => {
        const shortcuts = window.keyboardShortcuts?.getAllShortcuts() || [];
        const modal = Component.h(KeyboardShortcutsHelp, { shortcuts }).render();
        document.body.appendChild(modal);
      },
      "Show keyboard shortcuts help"
    );

    // Command Palette (Ctrl+K)
    window.keyboardShortcuts.register(
      "ctrl+k",
      () => {
        // Close any existing modals first
        document.querySelectorAll(".modal.active, .command-palette-overlay").forEach((m) => {
          m.remove();
        });
        const palette = new CommandPalette({});
        const el = palette.render();
        document.body.appendChild(el);
        palette.bindEvents();
        if (palette.didMount) palette.didMount();
      },
      "Open command palette"
    );

    window.keyboardShortcuts.register(
      "ctrl+l",
      () => {
        window.router.navigate("/logs");
      },
      "Navigate to Logs"
    );
  } catch (e) {
    console.error("[App] Keyboard shortcuts initialization failed:", e);
  }

  // Initialize services with error handling
  document.addEventListener("DOMContentLoaded", () => {
    try {
      socketClient.connect();
      stateManager.init(socketClient);
      window.stateLlamaServer = new window.StateLlamaServer(stateManager.core, stateManager.socket);
    } catch (e) {
      console.error("[App] Service initialization failed:", e);
      showErrorBoundary(e);
      return;
    }
  });

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
})();

// Notifications - Enhanced toast system
function showNotification(msg, type = "info") {
  return ToastManager.show(msg, { type });
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
