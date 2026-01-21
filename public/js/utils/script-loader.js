/**
 * Script Lazy Loader - Loads heavy scripts on demand
 */

window.ScriptLoader = {
  loadedScripts: new Map(),
  loadingPromises: new Map(),

  /**
   * Load a script dynamically with caching
   * @param {string} src - Script URL
   * @param {object} options - Loading options
   * @returns {Promise<void>}
   */
  load(src, options = {}) {
    const { attributes = {}, priority = "low" } = options;

    // Check if already loaded
    if (this.loadedScripts.has(src)) {
      return Promise.resolve();
    }

    // Check if currently loading
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src);
    }

    // Create loading promise
    const loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = false;

      // Set attributes
      Object.entries(attributes).forEach(([key, value]) => {
        script[key] = value;
      });

      script.onload = () => {
        this.loadedScripts.set(src, Date.now());
        console.log(`[SCRIPT-LOADER] Loaded: ${src}`);
        resolve();
      };

      script.onerror = () => {
        console.error(`[SCRIPT-LOADER] Failed to load: ${src}`);
        reject(new Error(`Failed to load script: ${src}`));
      };

      document.head.appendChild(script);
    });

    this.loadingPromises.set(src, loadPromise);
    return loadPromise;
  },

  /**
   * Load multiple scripts in parallel
   * @param {string[]} srcs - Array of script URLs
   * @param {object} options - Loading options
   * @returns {Promise<void[]>}
   */
  loadMany(srcs, options = {}) {
    return Promise.all(srcs.map((src) => this.load(src, options)));
  },

  /**
   * Check if a script is loaded
   */
  isLoaded(src) {
    return this.loadedScripts.has(src);
  },

  /**
   * Preload scripts (fetch but don't execute)
   */
  preload(src) {
    if (this.loadedScripts.has(src) || this.loadingPromises.has(src)) {
      return;
    }
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "script";
    link.href = src;
    document.head.appendChild(link);
  }
};

// Chart.js lazy loader - only loads when dashboard is accessed
window.ChartLoader = {
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

  loaded: false,
  loading: null,

  /**
   * Load chart scripts - returns promise that resolves when ready
   */
  load() {
    if (this.loaded) {
      return Promise.resolve();
    }

    if (this.loading) {
      return this.loading;
    }

    this.loading = (async () => {
      console.log("[CHART-LOADER] Starting lazy load of chart scripts");

      try {
        await ScriptLoader.loadMany(this.scripts, { priority: "high" });
        this.loaded = true;
        this.loading = null;
        console.log("[CHART-LOADER] Chart scripts loaded successfully");
      } catch (error) {
        this.loading = null;
        console.error("[CHART-LOADER] Failed to load chart scripts:", error);
        throw error;
      }
    })();

    return this.loading;
  },

  /**
   * Prefetch chart scripts (prepare but don't execute)
   */
  prefetch() {
    if (this.loaded || this.loading) {
      return;
    }
    this.scripts.forEach((src) => ScriptLoader.preload(src));
    console.log("[CHART-LOADER] Chart scripts prefetched");
  }
};
