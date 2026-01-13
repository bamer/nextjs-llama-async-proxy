/**
 * Simple Router - History API based routing - With Debug Logging
 */

class Router {
  constructor(options = {}) {
    console.log("[ROUTER] Router constructor called");
    this.routes = new Map();
    this.currentController = null;
    this.rootEl = options.root || document.getElementById("app");
    this.contentEl = null;
    this.layout = null;
    this.initialized = false;
    this.afterHooks = [];
    console.log("[ROUTER] Router initialized");

    window.addEventListener("popstate", () => {
      console.log("[ROUTER] Popstate event, path:", window.location.pathname);
      this._handle(window.location.pathname, false);
    });
  }

  register(path, handler) {
    console.log("[ROUTER] Registering route:", path);
    const pattern = this._toRegex(path);
    this.routes.set(pattern, {
      path,
      handler: typeof handler === "function" ? { render: handler } : handler,
    });
    return this;
  }

  afterEach(hook) {
    console.log("[ROUTER] Adding afterEach hook");
    this.afterHooks.push(hook);
    return this;
  }

  navigate(path, data = {}) {
    console.log("[ROUTER] navigate() called:", path, data);
    const url = new URL(path, window.location.origin);
    Object.entries(data).forEach(([k, v]) => url.searchParams.set(k, v));
    const newPath = url.pathname + url.search;
    if (newPath !== window.location.pathname + window.location.search) {
      console.log("[ROUTER] Pushing state:", newPath);
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
    console.log("[ROUTER] start() called");
    if (this.initialized) {
      console.log("[ROUTER] Already initialized, skipping");
      return this;
    }

    console.log("[ROUTER] Clearing root element");
    this.rootEl.innerHTML = "";

    console.log("[ROUTER] Creating layout");
    this.layout = new Layout({});
    this.layout.mount(this.rootEl);

    this.contentEl = document.getElementById("page-content") || this.rootEl;
    console.log("[ROUTER] Content element:", this.contentEl?.tagName);

    this.initialized = true;
    console.log("[ROUTER] Router initialized");

    const path = window.location.pathname;
    console.log("[ROUTER] Handling initial path:", path);
    this._handle(path, true);
    this._dispatchTitle(path);

    return this;
  }

  async _handle(path) {
    console.log("[ROUTER] _handle() called with path:", path);

    // Cleanup previous controller with error handling
    if (this.currentController) {
      console.log(
        "[ROUTER] Destroying previous controller:",
        this.currentController?.constructor?.name
      );
      try {
        this.currentController.willUnmount && this.currentController.willUnmount();
        this.currentController.destroy && this.currentController.destroy();
      } catch (e) {
        console.error("[ROUTER] Error during controller cleanup:", e);
        // Continue with navigation despite cleanup error
      }
      this.currentController = null;
    }

    const route = this._match(path);
    console.log("[ROUTER] Matched route:", route?.path || "null");

    if (!route) {
      console.log("[ROUTER] No route found for:", path);
      return;
    }

    // Load plugins for this route
    if (window.PluginSystem) {
      await PluginSystem.loadForRoute(path);
    }

    console.log("[ROUTER] Creating controller for:", route.path);
    this.currentController = this._create(route.handler, path, route.params);

    if (!this.contentEl) {
      console.log("[ROUTER] No content element found");
      return;
    }

    console.log("[ROUTER] Clearing content element");
    this.contentEl.innerHTML = "";

    console.log("[ROUTER] Calling controller.render()");
    const result = this.currentController.render();

    // Handle both sync and async render
    if (result instanceof Promise) {
      console.log("[ROUTER] Render returned Promise, awaiting...");
      const el = await result;
      if (el instanceof Component) {
        console.log("[ROUTER] Mounting component");
        el.mount(this.contentEl);
        this._callDidMount(el._el);
      } else if (el) {
        const domEl = this._htmlToElement(el);
        console.log("[ROUTER] Appending async element:", domEl?.className);
        this.contentEl.appendChild(domEl);
        this._callDidMount(domEl);
      }
    } else if (result instanceof Component) {
      console.log("[ROUTER] Mounting component");
      result.mount(this.contentEl);
      this._callDidMount(result._el);
    } else if (result) {
      const domEl = this._htmlToElement(result);
      console.log("[ROUTER] Appending element:", domEl?.className);
      this.contentEl.appendChild(domEl);
      this._callDidMount(domEl);
    }

    if (this.currentController.didMount) {
      console.log("[ROUTER] Calling didMount");
      this.currentController.didMount();
    }

    // Run after hooks
    console.log("[ROUTER] Running", this.afterHooks.length, "after hooks");
    this.afterHooks.forEach((h) => h(path, route));
    console.log("[ROUTER] _handle() complete");
  }

  _create(handler, path, params) {
    console.log("[ROUTER] _create() called with path:", path, "params:", params);
    let ctrl;

    if (typeof handler === "function") {
      ctrl = handler({ path, params });
      console.log("[ROUTER] Created controller from function:", ctrl?.constructor?.name);
    } else if (handler.render && typeof handler.render === "function") {
      ctrl = handler.render({ path, params });
      console.log("[ROUTER] Created controller from render:", ctrl?.constructor?.name);
    } else if (handler.controller) {
      ctrl = new handler.controller(handler.options || {});
      console.log("[ROUTER] Created controller from class:", ctrl?.constructor?.name);
    } else {
      console.log("[ROUTER] No valid handler found");
      return null;
    }

    ctrl.router = this;
    ctrl.path = path;
    ctrl.params = params;
    ctrl.query = this.getQuery();
    return ctrl;
  }

  _match(path) {
    console.log("[ROUTER] _match() looking for:", path);
    for (const [pattern, route] of this.routes) {
      const m = pattern.exec(path);
      if (m) {
        console.log("[ROUTER] Found match:", route.path);
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
    console.log("[ROUTER] No match found");
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

  _htmlToElement(html) {
    if (typeof html !== "string") return html;
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    return template.content.firstElementChild || null;
  }
}

window.Router = Router;
console.log("[ROUTER] Router class loaded");
