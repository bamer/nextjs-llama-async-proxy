/**
 * App Init - Application initialization
 * Part of app.js refactoring (≤200 lines)
 */

/* global KeyboardShortcutsHelp, ChartLoader */

(function () {
  "use strict";

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

    if (e.error && (e.error.message.includes("Cannot read") || e.error.message.includes("is not a function"))) {
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

  // Initialize socket connection immediately (before DOMContentLoaded)
  // This allows requests to be queued while socket establishes
  function initializeSocket() {
    try {
      console.log("[App] Initializing socket connection with Socket.IO...");
      // Use Socket.IO directly (no wrapper)
      const socket = io(window.location.origin, { 
        path: "/llamaproxws", 
        transports: ["websocket"] 
      });
      
      socket.on("connect", () => {
        console.log("[App] Socket.IO connected, socket ID:", socket.id);
      });
      
      stateManager.init(socket);
      window.stateLlamaServer = new window.StateLlamaServer(
        stateManager.core,
        stateManager.socket
      );
      console.log("[App] Socket and state manager initialized");
    } catch (e) {
      console.error("[App] Service initialization failed:", e);
      showErrorBoundary(e);
    }
  }

  // Initialize socket as soon as possible
  if (document.readyState === "loading") {
    // Still loading, wait for DOMContentLoaded but don't block
    document.addEventListener("DOMContentLoaded", initializeSocket);
  } else {
    // Already loaded, initialize immediately
    initializeSocket();
  }

  window.showErrorBoundary = showErrorBoundary;
})();
