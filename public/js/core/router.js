/**
 * Simple Router - History API based routing
 */

class Router {
  constructor(options = {}) {
    this.routes = new Map();
    this.currentController = null;
    this.rootEl = options.root || document.getElementById("app");
    this.contentEl = null;
    this.layout = null;
    this.initialized = false;
    this.afterHooks = [];

    window.addEventListener("popstate", () => this._handle(window.location.pathname, false));
  }

  register(path, handler) {
    const pattern = this._toRegex(path);
    this.routes.set(pattern, {
      path,
      handler: typeof handler === "function" ? { render: handler } : handler,
    });
    return this;
  }

  afterEach(hook) {
    this.afterHooks.push(hook);
    return this;
  }

  navigate(path, data = {}) {
    const url = new URL(path, window.location.origin);
    Object.entries(data).forEach(([k, v]) => url.searchParams.set(k, v));
    const newPath = url.pathname + url.search;
    if (newPath !== window.location.pathname + window.location.search) {
      window.history.pushState(data, "", newPath);
    }
    this._handle(newPath, false);
    this._dispatchTitle(newPath);
    return this;
  }

  getPath() {
    return window.location.pathname;
  }
  getQuery() {
    return Object.fromEntries(new URLSearchParams(window.location.search));
  }

  start() {
    if (this.initialized) return this;
    this.rootEl.innerHTML = "";

    this.layout = new Layout({});
    const layoutEl = this.layout.render();
    this.rootEl.appendChild(layoutEl);
    this.layout.bindEvents();
    if (this.layout.didMount) this.layout.didMount();
    this._callDidMount(layoutEl);

    this.contentEl = document.getElementById("page-content") || this.rootEl;
    this.initialized = true;

    const path = window.location.pathname;
    this._handle(path, true);
    this._dispatchTitle(path);

    return this;
  }

  async _handle(path) {
    const route = this._match(path);

    if (this.currentController) {
      this.currentController.willUnmount && this.currentController.willUnmount();
      this.currentController.destroy && this.currentController.destroy();
      this.currentController = null;
    }

    if (!route) return;

    this.currentController = this._create(route.handler, path, route.params);

    if (!this.contentEl) return;
    this.contentEl.innerHTML = "";
    const el = this.currentController.render();
    this.contentEl.appendChild(el);
    this._callDidMount(el);
    this.currentController.didMount && this.currentController.didMount();

    // Run after hooks
    this.afterHooks.forEach((h) => h(path, route));
  }

  _create(handler, path, params) {
    let ctrl;
    if (typeof handler === "function") {
      ctrl = handler({ path, params });
    } else if (handler.render && typeof handler.render === "function") {
      ctrl = handler.render({ path, params });
    } else if (handler.controller) {
      ctrl = new handler.controller(handler.options || {});
    } else {
      return null;
    }
    ctrl.router = this;
    ctrl.path = path;
    ctrl.params = params;
    ctrl.query = this.getQuery();
    return ctrl;
  }

  _match(path) {
    for (const [pattern, route] of this.routes) {
      const m = pattern.exec(path);
      if (m) {
        const params = {};
        route.path.split("/").forEach((seg, i) => {
          if (seg.startsWith(":")) {
            params[seg.slice(1)] = m[i + 1];
          }
        });
        return { ...route, params };
      }
    }
    return null;
  }

  _toRegex(path) {
    const rx = path
      .replace(/\//g, "\\/")
      .replace(/:([^/]+)/g, "([^/]+)")
      .replace(/\*$/, "(.*)");
    return new RegExp(`^${rx}$`);
  }

  _callDidMount(el) {
    if (!el) return;
    if (el._component && el._component.didMount && !el._component._mounted) {
      el._component._mounted = true;
      el._component.didMount();
    }
    if (el.children) {
      Array.from(el.children).forEach((c) => this._callDidMount(c));
    }
  }

  _dispatchTitle(path) {
    window.dispatchEvent(new CustomEvent("routechange", { detail: { path } }));
  }
}

window.Router = Router;
