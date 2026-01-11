/**
 * Plugin System - Generic module loader with dependency management
 * Enables lazy loading of feature modules on demand
 */

window.PluginSystem = {
  // Registered plugins
  plugins: new Map(),
  // Loaded plugins cache
  loadedPlugins: new Map(),
  // Pending loads
  loadingPromises: new Map(),

  /**
   * Register a plugin
   * @param {string} name - Plugin identifier
   * @param {object} config - Plugin configuration
   */
  register(name, config) {
    this.plugins.set(name, {
      name,
      scripts: config.scripts || [],
      styles: config.styles || [],
      deps: config.deps || [],
      routes: config.routes || [],
      lazy: config.lazy !== false,
      ...config
    });
    console.log(`[PLUGIN] Registered: ${name}`);
  },

  /**
   * Load a plugin and its dependencies
   * @param {string} name - Plugin name
   * @returns {Promise<void>}
   */
  async load(name) {
    // Already loaded?
    if (this.loadedPlugins.has(name)) {
      return;
    }

    // Currently loading?
    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name);
    }

    const plugin = this.plugins.get(name);
    if (!plugin) {
      console.warn(`[PLUGIN] Plugin not found: ${name}`);
      return;
    }

    // Load dependencies first
    if (plugin.deps && plugin.deps.length > 0) {
      await Promise.all(plugin.deps.map((dep) => this.load(dep)));
    }

    // Create loading promise
    const loadPromise = (async () => {
      console.log(`[PLUGIN] Loading: ${name}`);

      try {
        // Load styles
        for (const style of plugin.styles) {
          await this._loadStyle(style);
        }

        // Load scripts
        for (const script of plugin.scripts) {
          await ScriptLoader.load(script);
        }

        this.loadedPlugins.set(name, { loadedAt: Date.now() });
        console.log(`[PLUGIN] Loaded: ${name}`);
      } catch (error) {
        console.error(`[PLUGIN] Failed to load ${name}:`, error);
        throw error;
      }
    })();

    this.loadingPromises.set(name, loadPromise);
    return loadPromise;
  },

  /**
   * Load multiple plugins in parallel
   * @param {string[]} names - Plugin names
   * @returns {Promise<void[]>}
   */
  async loadMany(names) {
    return Promise.all(names.map((name) => this.load(name)));
  },

  /**
   * Check if a plugin is loaded
   */
  isLoaded(name) {
    return this.loadedPlugins.has(name);
  },

  /**
   * Load plugin for a route
   * @param {string} path - Current route path
   */
  async loadForRoute(path) {
    const toLoad = [];

    for (const [name, plugin] of this.plugins) {
      if (plugin.lazy && plugin.routes && plugin.routes.some((r) => this._matchesRoute(path, r))) {
        if (!this.isLoaded(name)) {
          toLoad.push(name);
        }
      }
    }

    if (toLoad.length > 0) {
      console.log(`[PLUGIN] Loading plugins for ${path}:`, toLoad);
      await this.loadMany(toLoad);
    }
  },

  /**
   * Check if a route matches a pattern
   */
  _matchesRoute(path, pattern) {
    if (typeof pattern === "string") {
      return path === pattern || path.startsWith(pattern);
    }
    if (pattern instanceof RegExp) {
      return pattern.test(path);
    }
    if (pattern.test) {
      return pattern.test(path);
    }
    return false;
  },

  /**
   * Load a CSS file
   */
  _loadStyle(href) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`link[href="${href}"]`)) {
        resolve();
        return;
      }

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`));
      document.head.appendChild(link);
    });
  },

  /**
   * Get loaded plugins info
   */
  getLoadedPlugins() {
    return Array.from(this.loadedPlugins.entries()).map(([name, info]) => ({ name, ...info }));
  },

  /**
   * Unload a plugin (remove from cache)
   */
  unload(name) {
    const plugin = this.plugins.get(name);
    if (plugin) {
      // Note: We can't easily remove script tags or styles
      // But we can remove from loaded cache
      this.loadedPlugins.delete(name);
      console.log(`[PLUGIN] Unloaded: ${name}`);
    }
  }
};

// Chart.js lazy loader using PluginSystem
window.ChartLoader = {
  get pluginConfig() {
    return {
      name: "charts",
      scripts: [
        "/js/libs/chart.min.js",
        "/js/utils/dashboard-utils.js",
        "/js/components/dashboard/charts/chart-utils.js",
        "/js/components/dashboard/charts/chart-colors.js",
        "/js/components/dashboard/charts/chart-config.js",
        "/js/components/dashboard/charts/chart-usage.js",
        "/js/components/dashboard/charts/chart-memory.js",
        "/js/components/dashboard/chart-manager.js"
      ],
      routes: ["/", "/dashboard"],
      deps: []
    };
  },

  load() {
    if (!PluginSystem.isLoaded("charts")) {
      PluginSystem.register("charts", this.pluginConfig);
    }
    return PluginSystem.load("charts");
  },

  prefetch() {
    PluginSystem.register("charts", this.pluginConfig);
    PluginSystem.plugins.get("charts").scripts.forEach((src) => ScriptLoader.preload(src));
  }
};

// Monitoring page plugin
window.MonitoringLoader = {
  get pluginConfig() {
    return {
      name: "monitoring",
      scripts: [
        "/js/pages/monitoring.js",
        "/js/utils/monitoring-utils.js"
      ],
      routes: ["/monitoring"],
      deps: []
    };
  },

  load() {
    if (!PluginSystem.isLoaded("monitoring")) {
      PluginSystem.register("monitoring", this.pluginConfig);
    }
    return PluginSystem.load("monitoring");
  },

  prefetch() {
    PluginSystem.register("monitoring", this.pluginConfig);
    PluginSystem.plugins.get("monitoring").scripts.forEach((src) => ScriptLoader.preload(src));
  }
};

// Models page plugin
window.ModelsLoader = {
  get pluginConfig() {
    return {
      name: "models",
      scripts: [
        "/js/pages/models/page.js"
      ],
      routes: ["/models"],
      deps: []
    };
  },

  load() {
    if (!PluginSystem.isLoaded("models")) {
      PluginSystem.register("models", this.pluginConfig);
    }
    return PluginSystem.load("models");
  },

  prefetch() {
    PluginSystem.register("models", this.pluginConfig);
    PluginSystem.plugins.get("models").scripts.forEach((src) => ScriptLoader.preload(src));
  }
};

// Presets page plugin
window.PresetsLoader = {
  get pluginConfig() {
    return {
      name: "presets",
      scripts: [
        "/js/pages/presets.js"
      ],
      routes: ["/presets"],
      deps: []
    };
  },

  load() {
    if (!PluginSystem.isLoaded("presets")) {
      PluginSystem.register("presets", this.pluginConfig);
    }
    return PluginSystem.load("presets");
  },

  prefetch() {
    PluginSystem.register("presets", this.pluginConfig);
    PluginSystem.plugins.get("presets").scripts.forEach((src) => ScriptLoader.preload(src));
  }
};

// Configuration page plugin
window.ConfigurationLoader = {
  get pluginConfig() {
    return {
      name: "configuration",
      scripts: [
        "/js/pages/configuration.js"
      ],
      routes: ["/configuration"],
      deps: []
    };
  },

  load() {
    if (!PluginSystem.isLoaded("configuration")) {
      PluginSystem.register("configuration", this.pluginConfig);
    }
    return PluginSystem.load("configuration");
  },

  prefetch() {
    PluginSystem.register("configuration", this.pluginConfig);
    PluginSystem.plugins.get("configuration").scripts.forEach((src) => ScriptLoader.preload(src));
  }
};

// Settings page plugin
window.SettingsLoader = {
  get pluginConfig() {
    return {
      name: "settings",
      scripts: [
        "/js/pages/settings.js"
      ],
      routes: ["/settings"],
      deps: []
    };
  },

  load() {
    if (!PluginSystem.isLoaded("settings")) {
      PluginSystem.register("settings", this.pluginConfig);
    }
    return PluginSystem.load("settings");
  },

  prefetch() {
    PluginSystem.register("settings", this.pluginConfig);
    PluginSystem.plugins.get("settings").scripts.forEach((src) => ScriptLoader.preload(src));
  }
};

// Logs page plugin
window.LogsLoader = {
  get pluginConfig() {
    return {
      name: "logs",
      scripts: [
        "/js/pages/logs.js"
      ],
      routes: ["/logs"],
      deps: []
    };
  },

  load() {
    if (!PluginSystem.isLoaded("logs")) {
      PluginSystem.register("logs", this.pluginConfig);
    }
    return PluginSystem.load("logs");
  },

  prefetch() {
    PluginSystem.register("logs", this.pluginConfig);
    PluginSystem.plugins.get("logs").scripts.forEach((src) => ScriptLoader.preload(src));
  }
};
