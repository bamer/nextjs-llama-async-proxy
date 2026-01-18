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

    window.addEventListener("popstate", () => {
      this._handle(window.location.pathname);
    });
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
    this._handle(newPath);
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

    // Check if layout already exists
    const existingLayout = this.rootEl.querySelector(".layout");
    if (existingLayout) {
      this.layout = window.appLayout;
      this.contentEl = document.getElementById("page-content") || this.rootEl.querySelector(".main-content");
    } else {
      this.layout = new Layout({});
      this.layout.mount(this.rootEl);
      this.contentEl = document.getElementById("page-content");
    }

    this.initialized = true;
    this._handle(window.location.pathname);
    return this;
  }

  async _handle(path) {
    // Cleanup previous controller
    if (this.currentController) {
      this.currentController.willUnmount?.();
      this.currentController.destroy?.();
      this.currentController = null;
    }

    const route = this._match(path);
    if (!route) return;

    // Load plugins for route
    if (window.PluginSystem) {
      await PluginSystem.loadForRoute(path);
    }

    this.currentController = this._create(route.handler, path, route.params);
    if (!this.contentEl) return;

    this.contentEl.innerHTML = "";
    const result = this.currentController.render();

    if (result instanceof Promise) {
      const el = await result;
      if (el instanceof Component) {
        el.mount(this.contentEl);
        this._callDidMount(el._el);
      } else if (el) {
        this.contentEl.appendChild(this._htmlToElement(el));
      }
    } else if (result instanceof Component) {
      result.mount(this.contentEl);
      this._callDidMount(result._el);
    } else if (result) {
      this.contentEl.appendChild(this._htmlToElement(result));
    }

    if (this.currentController.didMount) {
      this.currentController.didMount();
    }

    this.afterHooks.forEach((h) => h(path, route));
  }

  _create(handler, path, params) {
    let ctrl;
    if (typeof handler === "function") {
      ctrl = handler({ path, params });
    } else if (handler.render) {
      ctrl = handler.render({ path, params });
    } else if (handler.controller) {
      ctrl = new handler.controller(handler.options || {});
    }
    if (ctrl) {
      ctrl.router = this;
      ctrl.path = path;
      ctrl.params = params;
      ctrl.query = this.getQuery();
    }
    return ctrl;
  }

  _match(path) {
    for (const [pattern, route] of this.routes) {
      const m = pattern.exec(path);
      if (m) {
        const params = {};
        let paramIndex = 0;
        route.path.split("/").forEach((seg) => {
          if (seg.startsWith(":")) {
            params[seg.slice(1)] = m[paramIndex + 1];
            paramIndex++;
          }
        });
        return { ...route, params };
      }
    }
    return null;
  }

  _toRegex(path) {
    const rx = path.replace(/\//g, "\\/").replace(/:([^/]+)/g, "([^/]+)").replace(/\*$/, "(.*)");
    return new RegExp(`^${rx}$`);
  }

  _callDidMount(el) {
    if (!el) return;
    if (el._component && el._component.didMount && !el._component._mounted) {
      el._component._mounted = true;
      el._component.didMount();
    }
    Array.from(el.children || []).forEach((c) => this._callDidMount(c));
  }

  _dispatchTitle(path) {
    window.dispatchEvent(new CustomEvent("routechange", { detail: { path } }));
  }

  _htmlToElement(html) {
    if (html instanceof Node) return html;
    if (typeof html !== "string") return null;
    const temp = document.createElement("div");
    temp.innerHTML = html.trim();
    return temp.firstElementChild || null;
  }
}

window.Router = Router;
