/**
 * Router - History API based routing with persistent Layout
 */

class Router {
  constructor(options = {}) {
    this.routes = new Map();
    this.currentRoute = null;
    this.currentController = null;
    this.rootElement = options.root || document.getElementById('app');
    this.contentElement = null;
    this.layoutComponent = null;
    this.beforeHooks = [];
    this.afterHooks = [];
    this.notFoundHandler = null;
    this.initialized = false;

    // Bind popstate
    window.addEventListener('popstate', (event) => {
      this._handleRouteChange(window.location.pathname, false);
    });
  }

  /**
   * Register a route
   * @param {string} path - Route path (e.g., '/dashboard', '/models/:id')
   * @param {Function|Object} handler - Controller or options
   */
  register(path, handler) {
    const pattern = this._pathToRegex(path);
    this.routes.set(pattern, {
      path,
      pattern,
      handler: typeof handler === 'function' ? { render: handler } : handler
    });
    return this;
  }

  /**
   * Register not found handler
   */
  notFound(handler) {
    this.notFoundHandler = typeof handler === 'function' ? { render: handler } : handler;
    return this;
  }

  /**
   * Add before navigation hook
   */
  beforeEach(hook) {
    this.beforeHooks.push(hook);
    return this;
  }

  /**
   * Add after navigation hook
   */
  afterEach(hook) {
    this.afterHooks.push(hook);
    return this;
  }

  /**
   * Navigate to a path
   * @param {string} path - Path to navigate to
   * @param {Object} data - Route data (query params)
   */
  navigate(path, data = {}) {
    const url = new URL(path, window.location.origin);
    Object.entries(data).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const newPath = url.pathname + url.search;

    if (newPath === window.location.pathname + window.location.search) {
      // Same route - just update data
      if (this.currentController && this.currentController.updateData) {
        this.currentController.updateData(data);
      }
      return this;
    }

    window.history.pushState(data, '', newPath);
    this._handleRouteChange(newPath, false);
    this._dispatchTitleUpdate(newPath);
    return this;
  }

  /**
   * Navigate and replace current history entry
   */
  replace(path, data = {}) {
    const url = new URL(path, window.location.origin);
    Object.entries(data).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    window.history.replaceState(data, '', url);
    this._handleRouteChange(url.pathname + url.search, false);
    this._dispatchTitleUpdate(url.pathname + url.search);
    return this;
  }

  /**
   * Get current path
   */
  getPath() {
    return window.location.pathname;
  }

  /**
   * Get query params
   */
  getQuery() {
    return Object.fromEntries(new URLSearchParams(window.location.search));
  }

  /**
   * Get route params
   */
  getParams() {
    return this.currentRoute?.params || {};
  }

  /**
   * Start the router - mounts Layout and initial route
   */
  start() {
    if (this.initialized) return this;

    // Create and mount the Layout component
    this.layoutComponent = new Layout({});
    const layoutElement = this.layoutComponent.render();
    this.rootElement.appendChild(layoutElement);

    // Get reference to the content area
    this.contentElement = document.getElementById('page-content');

    if (!this.contentElement) {
      console.error('[Router] Content element #page-content not found');
      // Fallback: use rootElement
      this.contentElement = this.rootElement;
    }

    this.initialized = true;

    // Navigate to initial path
    const initialPath = window.location.pathname;
    this._handleRouteChange(initialPath, true);
    this._dispatchTitleUpdate(initialPath);

    return this;
  }

  /**
   * Handle route change
   */
  async _handleRouteChange(path, isInitial = false) {
    const route = this._matchRoute(path);

    // Run before hooks
    for (const hook of this.beforeHooks) {
      const result = await hook(path, route);
      if (result === false) {
        return; // Navigation cancelled
      }
    }

    // Destroy current controller
    if (this.currentController) {
      if (this.currentController.willUnmount) {
        this.currentController.willUnmount();
      }
      if (this.currentController.destroy) {
        this.currentController.destroy();
      }
      this.currentController = null;
    }

    // Handle not found
    if (!route && this.notFoundHandler) {
      this.currentRoute = { path, params: {}, route: null };
      this.currentController = this._createController(this.notFoundHandler, path, {});
      this._renderControllerToContent();
      return;
    }

    if (!route) {
      console.warn(`No route found for: ${path}`);
      return;
    }

    // Create controller
    this.currentRoute = route;
    this.currentController = this._createController(route.handler, path, route.params);

    this._renderControllerToContent();

    // Run after hooks
    for (const hook of this.afterHooks) {
      await hook(path, route);
    }
  }

  /**
   * Render current controller to the content area
   */
  _renderControllerToContent() {
    if (!this.contentElement || !this.currentController) return;

    // Clear content area
    this.contentElement.innerHTML = '';

    // Render controller to content area
    const element = this.currentController.render();
    this.contentElement.appendChild(element);

    if (this.currentController.didMount) {
      this.currentController.didMount();
    }
  }

  /**
   * Create a controller instance
   */
  _createController(handler, path, params) {
    let controller;

    if (typeof handler === 'function') {
      controller = handler({ path, params });
    } else if (typeof handler === 'object') {
      if (handler.render && typeof handler.render === 'function') {
        controller = handler.render({ path, params });
      } else if (handler.controller) {
        controller = new handler.controller(handler.options || {});
      } else {
        console.error('[Router] Invalid handler - missing render or controller:', handler);
        return null;
      }
    } else {
      console.error('[Router] Invalid handler:', handler);
      return null;
    }

    controller.router = this;
    controller.path = path;
    controller.params = params;
    controller.query = this.getQuery();

    return controller;
  }

  /**
   * Match path to route
   */
  _matchRoute(path) {
    for (const [pattern, route] of this.routes) {
      const match = pattern.exec(path);
      if (match) {
        const params = {};
        route.path.split('/').forEach((segment, i) => {
          if (segment.startsWith(':')) {
            params[segment.slice(1)] = match[i + 1];
          }
        });
        return { ...route, params };
      }
    }
    return null;
  }

  /**
   * Convert path to regex
   */
  _pathToRegex(path) {
    const regexPath = path
      .replace(/\//g, '\\/')
      .replace(/:([^/]+)/g, '([^/]+)')
      .replace(/\*$/, '(.*)');
    return new RegExp(`^${regexPath}$`);
  }

  /**
   * Dispatch title update event
   */
  _dispatchTitleUpdate(path) {
    console.log('[Router] Dispatching routechange event for:', path);
    const event = new CustomEvent('routechange', { detail: { path } });
    window.dispatchEvent(event);
  }
}

// Export
window.Router = Router;
