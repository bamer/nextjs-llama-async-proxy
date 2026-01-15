/**
 * Command Palette - Global command launcher (Ctrl+K)
 * Provides keyboard-first navigation and actions
 */

class CommandPalette extends Component {
  constructor(props) {
    super(props);
    this.commands = this._buildCommands();
    this.filteredCommands = [...this.commands];
    this.selectedIndex = 0;
    this.query = "";
  }

  /**
   * Build the list of available commands
   */
  _buildCommands() {
    return [
      // Navigation
      { id: "nav:dashboard", category: "Navigation", label: "Go to Dashboard", shortcut: "G D", handler: () => this._navigate("/") },
      { id: "nav:models", category: "Navigation", label: "Go to Models", shortcut: "G M", handler: () => this._navigate("/models") },
      { id: "nav:presets", category: "Navigation", label: "Go to Presets", shortcut: "G P", handler: () => this._navigate("/presets") },
      { id: "nav:monitoring", category: "Navigation", label: "Go to Monitoring", shortcut: "G O", handler: () => this._navigate("/monitoring") },
      { id: "nav:configuration", category: "Navigation", label: "Go to Configuration", shortcut: "G C", handler: () => this._navigate("/configuration") },
      { id: "nav:settings", category: "Navigation", label: "Go to Settings", shortcut: "G S", handler: () => this._navigate("/settings") },
      { id: "nav:logs", category: "Navigation", label: "Go to Logs", shortcut: "G L", handler: () => this._navigate("/logs") },

      // Router Actions
      { id: "router:start", category: "Router", label: "Start Router", shortcut: "R S", handler: () => this._routerAction("start") },
      { id: "router:stop", category: "Router", label: "Stop Router", shortcut: "R T", handler: () => this._routerAction("stop") },
      { id: "router:restart", category: "Router", label: "Restart Router", shortcut: "R R", handler: () => this._routerAction("restart") },
      { id: "router:status", category: "Router", label: "Check Router Status", shortcut: "R ?", handler: () => this._routerStatus() },

      // Model Actions
      { id: "model:scan", category: "Models", label: "Scan Models", shortcut: "M S", handler: () => this._triggerAction("scan") },
      { id: "model:reload", category: "Models", label: "Reload Models List", shortcut: "M R", handler: () => this._triggerAction("reload") },
      { id: "model:load", category: "Models", label: "Load Model...", shortcut: "M L", handler: () => this._triggerAction("load") },
      { id: "model:unload", category: "Models", label: "Unload All Models", shortcut: "M U", handler: () => this._triggerAction("unloadAll") },

      // Preset Actions
      { id: "preset:scan", category: "Presets", label: "Scan Presets", shortcut: "P S", handler: () => this._triggerAction("scanPresets") },
      { id: "preset:reload", category: "Presets", label: "Reload Presets", shortcut: "P R", handler: () => this._triggerAction("reloadPresets") },

      // Settings Actions
      { id: "settings:clear-cache", category: "Settings", label: "Clear Cache", shortcut: "C C", handler: () => this._clearCache() },
      { id: "settings:export-logs", category: "Settings", label: "Export Logs", shortcut: "E L", handler: () => this._exportLogs() },
      { id: "settings:reset-layout", category: "Settings", label: "Reset Dashboard Layout", shortcut: "R L", handler: () => this._resetLayout() },

      // View Actions
      { id: "view:shortcuts", category: "View", label: "Show Keyboard Shortcuts", shortcut: "?", handler: () => this._showShortcuts() },
      { id: "view:theme", category: "View", label: "Toggle Dark Mode", shortcut: "Ctrl T", handler: () => this._toggleTheme() },
      { id: "view:refresh", category: "View", label: "Refresh Page", shortcut: "Ctrl R", handler: () => this._refreshPage() },

      // Quick Actions
      { id: "quick:start-preset", category: "Quick Actions", label: "Start with Preset...", handler: () => this._showPresetSelector() },
      { id: "quick:load-model", category: "Quick Actions", label: "Load Model...", handler: () => this._showModelSelector() },
      { id: "quick:copy-logs", category: "Quick Actions", label: "Copy Recent Logs", handler: () => this._copyLogs() },
    ];
  }

  _routerStatus() {
    const status = stateManager.get("routerStatus") || "unknown";
    ToastManager.info(`Router Status: ${status}`, 3000);
    console.log("[CommandPalette] Router status:", status);
  }

  _clearCache() {
    if (window.CacheService) {
      window.CacheService.clear();
      ToastManager.success("Cache cleared successfully", 3000);
    } else {
      ToastManager.error("Cache service not available", 3000);
    }
    this._close();
  }

  _exportLogs() {
    ToastManager.info("Exporting logs...", 2000);
    // Trigger log export through state manager
    stateManager.request("logs:export").then(() => {
      ToastManager.success("Logs exported successfully", 3000);
    }).catch((e) => {
      ToastManager.error(`Export failed: ${e.message}`, 3000);
    });
    this._close();
  }

  _resetLayout() {
    localStorage.removeItem("dashboardLayout");
    ToastManager.info("Layout reset. Refreshing...", 2000);
    setTimeout(() => window.location.reload(), 500);
    this._close();
  }

  _refreshPage() {
    window.location.reload();
  }

  _copyLogs() {
    const logs = document.querySelector(".logs-content, .log-container");
    if (logs) {
      navigator.clipboard.writeText(logs.textContent).then(() => {
        ToastManager.success("Logs copied to clipboard", 2000);
      }).catch(() => {
        ToastManager.error("Failed to copy logs", 2000);
      });
    } else {
      ToastManager.info("No logs found to copy", 2000);
    }
    this._close();
  }

  _navigate(path) {
    window.router.navigate(path);
    this._close();
  }

  _routerAction(action) {
    stateManager.request("llama:action", { action }).catch((e) => {
      ToastManager.error(`Failed to ${action} router: ${e.message}`);
    });
  }

  _triggerAction(action) {
    // Find the current page controller and trigger the action
    const modelsPage = document.querySelector(".models-page");
    const presetsPage = document.querySelector(".presets-page");

    switch (action) {
    case "scan":
      const scanBtn = document.querySelector("[data-action=scan]");
      if (scanBtn) scanBtn.click();
      else ToastManager.info("Use Models page to scan", 2000);
      break;
    case "reload":
      stateManager.getModels().then(() => {
        ToastManager.success("Models reloaded", 2000);
      }).catch((e) => {
        ToastManager.error(`Failed: ${e.message}`, 3000);
      });
      break;
    case "load":
      const loadBtn = document.querySelector("[data-action=load]");
      if (loadBtn) loadBtn.click();
      else ToastManager.info("Use Models page to load", 2000);
      break;
    case "unloadAll":
      stateManager.request("models:unloadAll").then(() => {
        ToastManager.success("All models unloaded", 2000);
      }).catch((e) => {
        ToastManager.error(`Failed: ${e.message}`, 3000);
      });
      break;
    case "scanPresets":
    case "reloadPresets":
      stateManager.getPresets().then(() => {
        ToastManager.success("Presets reloaded", 2000);
      }).catch((e) => {
        ToastManager.error(`Failed: ${e.message}`, 3000);
      });
      break;
    }
    this._close();
  }

  _showShortcuts() {
    this._close();
    const shortcuts = window.keyboardShortcuts?.getAllShortcuts() || [];
    const modal = Component.h(KeyboardShortcutsHelp, { shortcuts }).render();
    document.body.appendChild(modal);
  }

  _toggleTheme() {
    const html = document.documentElement;
    const isDark = html.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", isDark);
  }

  _showPresetSelector() {
    // Trigger preset selector on dashboard
    const presetSelect = document.querySelector("#router-preset-select");
    if (presetSelect) {
      presetSelect.focus();
    }
  }

  _showModelSelector() {
    // Trigger model selector
    const modelSelect = document.querySelector(".model-select");
    if (modelSelect) {
      modelSelect.focus();
    }
  }

  _close() {
    this._emit("close");
  }

  /**
   * Filter commands by query
   */
  _filter(query) {
    this.query = query.toLowerCase();
    this.filteredCommands = this.commands.filter((cmd) => {
      return (
        cmd.label.toLowerCase().includes(this.query) ||
        cmd.category.toLowerCase().includes(this.query) ||
        (cmd.shortcut && cmd.shortcut.toLowerCase().includes(this.query))
      );
    });
    this.selectedIndex = 0;
    this._updateUI();
  }

  /**
   * Navigate selection
   */
  _moveSelection(direction) {
    this.selectedIndex = Math.max(0, Math.min(this.filteredCommands.length - 1, this.selectedIndex + direction));
    this._updateUI();
  }

  /**
   * Execute selected command
   */
  _execute() {
    if (this.filteredCommands[this.selectedIndex]) {
      const cmd = this.filteredCommands[this.selectedIndex];
      if (cmd.handler) {
        cmd.handler();
      }
      this._close();
    }
  }

  /**
   * Update UI to show selection
   */
  _updateUI() {
    const items = this.$all(".command-item");
    items.forEach((item, index) => {
      item.classList.toggle("selected", index === this.selectedIndex);
    });

    // Scroll selected into view
    const selected = items[this.selectedIndex];
    if (selected) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }

  render() {
    return Component.h("div", { className: "command-palette-overlay", onClick: (e) => { if (e.target === e.currentTarget) this._close(); } }, [
      Component.h("div", { className: "command-palette" }, [
        Component.h("div", { className: "command-header" }, [
          Component.h("span", { className: "command-icon" }, "⌘"),
          Component.h("input", {
            type: "text",
            className: "command-input",
            placeholder: "Type a command or search...",
            onInput: (e) => this._filter(e.target.value),
            onKeyDown: (e) => this._handleKeyDown(e),
            autoFocus: true
          }),
          Component.h("button", { className: "command-close", onClick: () => this._close() }, "×")
        ]),
        Component.h("div", { className: "command-list" },
          this.filteredCommands.length > 0
            ? this._renderGroupedCommands()
            : Component.h("div", { className: "command-no-results" }, "No commands found")
        ),
        Component.h("div", { className: "command-footer" }, [
          Component.h("span", {}, Component.h("kbd", {}, "↑↓"), " navigate"),
          Component.h("span", {}, Component.h("kbd", {}, "↵"), " execute"),
          Component.h("span", {}, Component.h("kbd", {}, "esc"), " close")
        ])
      ])
    ]);
  }

  _renderGroupedCommands() {
    // Group by category
    const groups = {};
    this.filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    });

    return Object.entries(groups).map(([category, cmds]) =>
      Component.h("div", { className: "command-group" }, [
        Component.h("div", { className: "command-group-title" }, category),
        ...cmds.map((cmd, index) =>
          Component.h("div", {
            className: `command-item ${this.filteredCommands.indexOf(cmd) === this.selectedIndex ? "selected" : ""}`,
            "data-index": this.filteredCommands.indexOf(cmd),
            onClick: () => {
              this.selectedIndex = this.filteredCommands.indexOf(cmd);
              this._execute();
            }
          }, [
            Component.h("span", { className: "command-label" }, cmd.label),
            cmd.shortcut ? Component.h("span", { className: "command-shortcut" }, cmd.shortcut) : null
          ])
        )
      ])
    );
  }

  _handleKeyDown(e) {
    switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      this._moveSelection(1);
      break;
    case "ArrowUp":
      e.preventDefault();
      this._moveSelection(-1);
      break;
    case "Enter":
      e.preventDefault();
      this._execute();
      break;
    case "Escape":
      e.preventDefault();
      this._close();
      break;
    }
  }

  bindEvents() {
    // Close on escape handled in keydown
  }

  didMount() {
    // Focus input on mount
    const input = this.$(".command-input");
    if (input) input.focus();
  }
}

window.CommandPalette = CommandPalette;
