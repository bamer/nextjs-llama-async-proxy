/**
 * App Keyboard - Keyboard shortcuts registration
 * Part of app.js refactoring (≤200 lines)
 */

/* global KeyboardShortcutsHelp */

(function () {
  "use strict";

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
        const modal = Component.h(KeyboardShortcutsHelp, { shortcuts });
        document.body.appendChild(modal);
      },
      "Show keyboard shortcuts help"
    );

    // Command Palette (Ctrl+K)
    window.keyboardShortcuts.register(
      "ctrl+k",
      () => {
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
})();
