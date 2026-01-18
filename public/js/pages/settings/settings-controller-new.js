/**
 * Settings Controller - Socket-First Architecture
 *
 * Socket contracts:
 * - config:get              GET configuration
 * - config:update           POST update configuration
 * - router:restart          POST restart router
 * - presets:list            GET all presets
 * - config:updated          [BROADCAST] Config changed
 * - presets:updated         [BROADCAST] Presets changed
 */

class SettingsController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.comp = null;
    this.socketUnsubscribers = [];
  }

  init() {
    // No action event subscriptions needed
    // Components call socket directly
  }

  willUnmount() {
    if (this.socketUnsubscribers) {
      this.socketUnsubscribers.forEach((unsub) => unsub?.());
      this.socketUnsubscribers = [];
    }
    this.comp?.destroy?.();
  }

  destroy() {
    this.willUnmount();
  }

  async render() {
    console.log("[SETTINGS] Render - creating page component...");

    this.comp = new window.SettingsPage({});

    const el = this.comp.render();
    this.comp._el = el;
    el._component = this.comp;
    this.comp.bindEvents();

    // Mount component
    this.comp.didMount?.();

    // Load data in background (non-blocking)
    this._loadDataAsync();

    return el;
  }

  /**
   * Load configuration data via socket
   */
  async _loadDataAsync() {
    try {
      console.log("[SETTINGS] Loading configuration...");

      const [configRes, presetsRes] = await Promise.all([
        socketClient.request("config:get", {}),
        socketClient.request("presets:list", {}),
      ]);

      if (configRes.success) {
        const config = configRes.data.config || {};
        // Store in local component state instead of stateManager
        if (this.comp) {
          this.comp.routerConfig = config;
        }
        console.log("[SETTINGS] Config loaded");
      } else {
        console.error("[SETTINGS] Failed to load config:", configRes.error);
      }

      if (presetsRes.success) {
        const presets = presetsRes.data.presets || [];
        // Store in local component state instead of stateManager
        if (this.comp) {
          this.comp.presets = presets;
        }
        console.log("[SETTINGS] Presets loaded");
      } else {
        console.error("[SETTINGS] Failed to load presets:", presetsRes.error);
      }
    } catch (e) {
      console.error("[SETTINGS] Data load failed:", e);
      showNotification("Failed to load settings", "error");
    }
  }

  didMount() {
    console.log("[SETTINGS] didMount");
    if (this.comp && this.comp.didMount) {
      this.comp.didMount();
    }
  }
}

window.SettingsController = SettingsController;
