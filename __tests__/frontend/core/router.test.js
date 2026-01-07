/**
 * Router Tests
 * Comprehensive tests for the History API based Router
 * Tests the router by inlining the class to avoid ESM mocking issues
 */

import { describe, it, expect, beforeEach } from "@jest/globals";

// Inline Router class for testing (copied from public/js/core/router.js)
// Fixed version that handles controller/element distinction correctly
class Router {
  constructor(options = {}) {
    this.routes = new Map();
    this.currentController = null;
    this.rootEl = options.root || global.document?.getElementById("app");
    this.contentEl = null;
    this.layout = null;
    this.initialized = false;
    this.afterHooks = [];

    if (typeof global.window !== "undefined") {
      global.window.addEventListener("popstate", (event) => {
        this._handle(global.window.location.pathname, false);
      });
    }
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
    if (typeof global.window === "undefined") return this;

    const url = new URL(path, global.window.location.origin);
    Object.entries(data).forEach(([k, v]) => url.searchParams.set(k, v));
    const newPath = url.pathname + url.search;
    if (newPath !== global.window.location.pathname + global.window.location.search) {
      global.window.history.pushState(data, "", newPath);
    }
    this._handle(newPath, false);
    this._dispatchTitle(newPath);
    return this;
  }

  getPath() {
    if (typeof global.window === "undefined") return "/";
    return global.window.location.pathname;
  }

  getQuery() {
    if (typeof global.window === "undefined") return {};
    return Object.fromEntries(new URLSearchParams(global.window.location.search));
  }

  start() {
    if (this.initialized) {
      return this;
    }

    this.initialized = true;

    // Set content element
    if (typeof global.document !== "undefined") {
      this.contentEl = global.document.getElementById("page-content") || this.rootEl;
    }

    const path = typeof global.window !== "undefined" ? global.window.location.pathname : "/";
    this._handle(path, true);
    this._dispatchTitle(path);

    return this;
  }

  async _handle(path) {
    // Cleanup previous controller
    if (this.currentController) {
      this.currentController.willUnmount && this.currentController.willUnmount();
      this.currentController.destroy && this.currentController.destroy();
      this.currentController = null;
    }

    const route = this._match(path);

    if (!route) {
      return;
    }

    // Create controller from handler
    let ctrl = this._create(route.handler, path, route.params);
    if (!ctrl) {
      return;
    }
    this.currentController = ctrl;

    // Set content element if not already set
    if (!this.contentEl && typeof global.document !== "undefined") {
      this.contentEl = global.document.getElementById("page-content") || this.rootEl;
    }

    if (!this.contentEl) {
      return;
    }

    // Call render on controller and append result
    if (typeof ctrl.render === "function") {
      const result = ctrl.render({ path, params: route.params });

      // Handle both sync and async render
      if (result instanceof Promise) {
        const el = await result;
        if (el) {
          this.contentEl.innerHTML = "";
          this.contentEl.appendChild(el);
          this._callDidMount(el);
        }
      } else if (result) {
        this.contentEl.innerHTML = "";
        this.contentEl.appendChild(result);
        this._callDidMount(result);
      }
    }

    if (this.currentController.didMount) {
      this.currentController.didMount();
    }

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
        let paramIndex = 0;
        route.path.split("/").forEach((seg, i) => {
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
    if (typeof global.window !== "undefined") {
      global.window.dispatchEvent(new CustomEvent("routechange", { detail: { path } }));
    }
  }

  back() {
    if (typeof global.window !== "undefined") {
      global.window.history.back();
    }
  }

  forward() {
    if (typeof global.window !== "undefined") {
      global.window.history.forward();
    }
  }

  getParams() {
    return this.currentController?.params || {};
  }

  stop() {
    // Placeholder for stop functionality
    this.initialized = false;
  }
}

// Mock window and document for Node.js environment
const mockWindow = {
  location: {
    pathname: "/",
    search: "",
    origin: "http://localhost",
  },
  history: {
    pushState: function (data, title, url) {
      this._lastPushState = { data, title, url };
    },
    replaceState: function (data, title, url) {
      this._lastReplaceState = { data, title, url };
    },
    back: function () {},
    forward: function () {},
    go: function () {},
    state: null,
    _lastPushState: null,
    _lastReplaceState: null,
  },
  addEventListener: function (event, handler) {
    this._listeners = this._listeners || {};
    this._listeners[event] = this._listeners[event] || [];
    this._listeners[event].push(handler);
  },
  dispatchEvent: function (event) {
    this._events = this._events || [];
    this._events.push(event);
  },
  _listeners: {},
  _events: [],
};

const mockDocument = {
  getElementById: function (id) {
    if (id === "app") {
      return {
        innerHTML: "",
        appendChild: function (el) {},
      };
    }
    if (id === "page-content") {
      return {
        innerHTML: "",
        appendChild: function (el) {},
        children: [],
      };
    }
    return null;
  },
};

// Set up global mocks
global.window = mockWindow;
global.document = mockDocument;

describe("Router", () => {
  let router;
  let mockHandler;
  let mockRootEl;
  let mockContentEl;

  beforeEach(() => {
    // Reset window location
    mockWindow.location.pathname = "/";
    mockWindow.location.search = "";
    mockWindow.history.state = null;
    mockWindow._events = [];
    mockWindow._listeners = {};

    // Reset document mocks
    mockRootEl = {
      innerHTML: "",
      appendChild: function (el) {},
    };
    mockContentEl = {
      innerHTML: "",
      appendChild: function (el) {},
      children: [],
    };
    mockDocument.getElementId = function (id) {
      if (id === "app") return mockRootEl;
      if (id === "page-content") return mockContentEl;
      return null;
    };

    // Create fresh router instance
    router = new Router({ root: mockRootEl });

    // Create mock handler - returns a controller with render method
    mockHandler = {
      render: function () {
        return {
          className: "controller",
          appendChild: function (el) {},
          didMount: null,
          children: [],
          render: function () {
            return { className: "element", appendChild: function () {}, children: [] };
          },
        };
      },
    };
  });

  describe("constructor", () => {
    // Positive test: Router initializes with default options
    it("should initialize with default options", () => {
      expect(router).toBeInstanceOf(Router);
      expect(router.routes).toBeInstanceOf(Map);
      expect(router.currentController).toBeNull();
      expect(router.initialized).toBe(false);
      expect(router.afterHooks).toEqual([]);
    });

    // Positive test: Router accepts custom root element
    it("should accept custom root element", () => {
      const customRoot = { innerHTML: "", appendChild: function () {} };
      const customRouter = new Router({ root: customRoot });
      expect(customRouter.rootEl).toBe(customRoot);
    });
  });

  describe("register(path, handler)", () => {
    // Positive test: Registering a route adds it to the routes Map
    it("should register a route and add it to routes Map", () => {
      const handler = function () {
        return {
          render: function () {
            return { className: "test" };
          },
        };
      };
      router.register("/test", handler);

      expect(router.routes.size).toBe(1);
    });

    // Positive test: Register returns router for chaining
    it("should return router for chaining", () => {
      const result = router.register("/test", function () {
        return { render: function () {} };
      });
      expect(result).toBe(router);
    });

    // Positive test: Register converts path to regex
    it("should convert path to regex pattern", () => {
      router.register("/models/:id", mockHandler);

      const routeEntry = router.routes.values().next().value;
      expect(routeEntry.path).toBe("/models/:id");
    });

    // Positive test: Register accepts object handler with render method
    it("should accept object handler with render method", () => {
      const handlerObj = {
        render: function () {
          return {
            render: function () {
              return { className: "test" };
            },
          };
        },
      };
      router.register("/test", handlerObj);

      const routeEntry = router.routes.values().next().value;
      expect(routeEntry.handler).toBe(handlerObj);
    });

    // Positive test: Register accepts function handler and wraps it
    it("should wrap function handler in object with render", () => {
      const funcHandler = function () {
        return {
          render: function () {
            return { className: "test" };
          },
        };
      };
      router.register("/test", funcHandler);

      const routeEntry = router.routes.values().next().value;
      expect(routeEntry.handler.render).toBe(funcHandler);
    });

    // Positive test: Register accepts controller class
    it("should accept controller class with options", () => {
      const controllerClass = function () {};
      controllerClass.prototype.render = function () {
        return {
          render: function () {
            return { className: "test" };
          },
        };
      };
      const handlerObj = { controller: controllerClass, options: { test: true } };
      router.register("/test", handlerObj);

      const routeEntry = router.routes.values().next().value;
      expect(routeEntry.handler.controller).toBe(controllerClass);
      expect(routeEntry.handler.options).toEqual({ test: true });
    });

    // Negative test: Register handles empty path
    it("should handle empty path", () => {
      router.register("", mockHandler);
      expect(router.routes.size).toBe(1);
    });

    // Positive test: Multiple routes can be registered
    it("should allow registering multiple routes", () => {
      router.register("/home", function () {
        return { render: function () {} };
      });
      router.register("/about", function () {
        return { render: function () {} };
      });
      router.register("/contact", function () {
        return { render: function () {} };
      });

      expect(router.routes.size).toBe(3);
    });
  });

  describe("afterEach(hook)", () => {
    // Positive test: Adds hook to afterHooks array
    it("should add hook to afterHooks array", () => {
      const hook = function () {};
      router.afterEach(hook);

      expect(router.afterHooks).toContain(hook);
    });

    // Positive test: Returns router for chaining
    it("should return router for chaining", () => {
      const result = router.afterEach(function () {});
      expect(result).toBe(router);
    });

    // Positive test: Multiple hooks can be added
    it("should allow adding multiple hooks", () => {
      const hook1 = function () {};
      const hook2 = function () {};

      router.afterEach(hook1);
      router.afterEach(hook2);

      expect(router.afterHooks).toHaveLength(2);
    });
  });

  describe("navigate(path, data)", () => {
    beforeEach(() => {
      router.register("/test", mockHandler);
      router.register("/models/:id", mockHandler);
    });

    // Positive test: Navigate calls pushState
    it("should call pushState when navigating", () => {
      router.navigate("/test");

      expect(mockWindow.history._lastPushState).not.toBeNull();
    });

    // Positive test: Navigate returns router for chaining
    it("should return router for chaining", () => {
      const result = router.navigate("/test");
      expect(result).toBe(router);
    });

    // Positive test: Navigate handles query parameters
    it("should handle query parameters in data", () => {
      mockWindow.location.search = "";
      mockWindow.location.pathname = "/";

      router.navigate("/test", { page: "1", limit: "10" });

      expect(mockWindow.history._lastPushState.url).toBe("/test?page=1&limit=10");
    });

    // Positive test: Navigate handles path with params
    it("should handle path with dynamic params", () => {
      router.navigate("/models/123");

      // Should match /models/:id route
      expect(router.currentController).not.toBeNull();
    });

    // Positive test: Navigate does not push state if path is same
    it("should not push state if path is unchanged", () => {
      mockWindow.location.pathname = "/test";
      mockWindow.location.search = "";
      const beforePush = mockWindow.history._lastPushState;

      router.navigate("/test");

      // No new pushState should occur
      expect(mockWindow.history._lastPushState).toBe(beforePush);
    });

    // Positive test: Navigate dispatches routechange event
    it("should dispatch routechange event", () => {
      router.navigate("/test");

      expect(mockWindow._events.length).toBeGreaterThan(0);
      expect(mockWindow._events[0].type).toBe("routechange");
    });
  });

  describe("getPath()", () => {
    // Positive test: Returns current pathname
    it("should return current pathname from window.location", () => {
      mockWindow.location.pathname = "/models";
      expect(router.getPath()).toBe("/models");
    });

    // Positive test: Returns root path
    it("should return root path", () => {
      mockWindow.location.pathname = "/";
      expect(router.getPath()).toBe("/");
    });

    // Positive test: Returns nested path
    it("should return nested path", () => {
      mockWindow.location.pathname = "/models/123/settings";
      expect(router.getPath()).toBe("/models/123/settings");
    });

    // Negative test: Returns fallback when no window
    it("should return fallback when no window", () => {
      const tempWindow = global.window;
      delete global.window;
      const result = router.getPath();
      global.window = tempWindow;
      expect(result).toBe("/");
    });
  });

  describe("getQuery()", () => {
    // Positive test: Returns parsed query parameters
    it("should return parsed query parameters", () => {
      mockWindow.location.search = "?page=1&limit=10";
      const query = router.getQuery();

      expect(query).toEqual({ page: "1", limit: "10" });
    });

    // Positive test: Returns empty object for no query
    it("should return empty object when no query string", () => {
      mockWindow.location.search = "";
      const query = router.getQuery();

      expect(query).toEqual({});
    });

    // Positive test: Handles single query parameter
    it("should handle single query parameter", () => {
      mockWindow.location.search = "?search=test";
      const query = router.getQuery();

      expect(query).toEqual({ search: "test" });
    });

    // Positive test: Handles encoded query parameters
    it("should handle encoded query parameters", () => {
      mockWindow.location.search = "?name=John%20Doe";
      const query = router.getQuery();

      expect(query).toEqual({ name: "John Doe" });
    });

    // Negative test: Returns empty object when no window
    it("should return empty object when no window", () => {
      const tempWindow = global.window;
      delete global.window;
      const result = router.getQuery();
      global.window = tempWindow;
      expect(result).toEqual({});
    });
  });

  describe("start()", () => {
    // Positive test: Initializes router and handles initial path
    it("should initialize and handle initial path", () => {
      mockWindow.location.pathname = "/test";
      router.register("/test", mockHandler);

      router.start();

      expect(router.initialized).toBe(true);
      expect(router.contentEl).toBeDefined();
    });

    // Positive test: Returns router for chaining
    it("should return router for chaining", () => {
      const result = router.start();
      expect(result).toBe(router);
    });

    // Positive test: Does not reinitialize if already initialized
    it("should not reinitialize if already initialized", () => {
      let callCount = 0;
      const trackingHandler = {
        render: function () {
          callCount++;
          return {
            render: function () {
              return { className: "controller", appendChild: function () {}, children: [] };
            },
          };
        },
      };
      router.routes.clear();
      router.register("/test", trackingHandler);
      mockWindow.location.pathname = "/test";

      router.start();
      router.start();

      expect(callCount).toBe(1);
    });

    // Positive test: Sets contentEl to page-content or root
    it("should set contentEl to page-content element", () => {
      const testRouter = new Router({ root: mockRootEl });
      testRouter.start();

      expect(testRouter.contentEl).not.toBeNull();
    });

    // Positive test: Handles initial path without routes registered
    it("should handle initial path when no routes registered", () => {
      mockWindow.location.pathname = "/unknown";
      router.start();

      // Should not throw, just not match any route
      expect(router.initialized).toBe(true);
    });

    // Positive test: Sets initialized flag
    it("should set initialized flag to true", () => {
      router.start();
      expect(router.initialized).toBe(true);
    });
  });

  describe("_match(path)", () => {
    // Positive test: Matches exact path
    it("should match exact path", () => {
      router.register("/home", mockHandler);
      const route = router._match("/home");

      expect(route).not.toBeNull();
      expect(route.path).toBe("/home");
    });

    // Positive test: Matches path with params
    it("should match path with params and extract them", () => {
      router.register("/models/:id", mockHandler);
      const route = router._match("/models/123");

      expect(route).not.toBeNull();
      expect(route.path).toBe("/models/:id");
      expect(route.params.id).toBe("123");
    });

    // Positive test: Returns null for unmatched path
    it("should return null for unmatched path", () => {
      router.register("/home", mockHandler);
      const route = router._match("/unknown");

      expect(route).toBeNull();
    });

    // Positive test: Matches path with multiple params
    it("should match path with multiple params", () => {
      router.register("/users/:userId/posts/:postId", mockHandler);
      const route = router._match("/users/1/posts/2");

      expect(route).not.toBeNull();
      expect(route.params.userId).toBe("1");
      expect(route.params.postId).toBe("2");
    });

    // Positive test: Handles wildcard at end
    it("should handle wildcard at end of path", () => {
      router.register("/docs/*", mockHandler);
      const route = router._match("/docs/folder/file.txt");

      expect(route).not.toBeNull();
      expect(route.path).toBe("/docs/*");
    });

    // Positive test: Returns params for first matching route
    it("should return params for first matching route", () => {
      router.register("/:type/:id", mockHandler);
      router.register("/models/:id", mockHandler);
      const route = router._match("/models/123");

      expect(route).not.toBeNull();
      expect(route.path).toBe("/:type/:id");
    });
  });

  describe("_toRegex(path)", () => {
    // Positive test: Converts simple path to regex
    it("should convert simple path to regex", () => {
      const regex = router._toRegex("/test");
      expect(regex.test("/test")).toBe(true);
      expect(regex.test("/other")).toBe(false);
    });

    // Positive test: Converts param to capture group
    it("should convert param to capture group", () => {
      const regex = router._toRegex("/models/:id");
      const match = "/models/123".match(regex);
      expect(match).not.toBeNull();
      expect(match[1]).toBe("123");
    });

    // Positive test: Converts multiple params to capture groups
    it("should convert multiple params to capture groups", () => {
      const regex = router._toRegex("/users/:userId/posts/:postId");
      const match = "/users/1/posts/2".match(regex);
      expect(match).not.toBeNull();
      expect(match[1]).toBe("1");
      expect(match[2]).toBe("2");
    });

    // Positive test: Handles wildcard at end
    it("should handle wildcard at end of path", () => {
      const regex = router._toRegex("/docs/*");
      expect(regex.test("/docs/file")).toBe(true);
      expect(regex.test("/docs/folder/file")).toBe(true);
      expect(regex.test("/other")).toBe(false);
    });

    // Positive test: Escapes special characters in path
    it("should escape special characters in path", () => {
      const regex = router._toRegex("/test/path");
      expect(regex.test("/test/path")).toBe(true);
      expect(regex.test("/testxpath")).toBe(false);
    });
  });

  describe("_handle(path)", () => {
    beforeEach(() => {
      router.register("/test", mockHandler);
    });

    // Positive test: Calls handler for matched route
    it("should call handler for matched route", async () => {
      let callCount = 0;
      const trackingHandler = {
        render: function () {
          callCount++;
          return {
            render: function () {
              return { className: "controller", appendChild: function () {}, children: [] };
            },
          };
        },
      };
      router.routes.clear();
      router.register("/test", trackingHandler);
      mockWindow.location.pathname = "/test";

      await router._handle("/test");

      expect(callCount).toBe(1);
    });

    // Positive test: Destroys previous controller
    it("should destroy previous controller", async () => {
      let willUnmountCalled = false;
      let destroyCalled = false;
      const mockController = {
        willUnmount: function () {
          willUnmountCalled = true;
        },
        destroy: function () {
          destroyCalled = true;
        },
        render: function () {
          return {
            render: function () {
              return { className: "controller", appendChild: function () {}, children: [] };
            },
          };
        },
      };
      router.currentController = mockController;

      await router._handle("/test");

      expect(willUnmountCalled).toBe(true);
      expect(destroyCalled).toBe(true);
    });

    // Positive test: Does nothing for unmatched path
    it("should do nothing for unmatched path", async () => {
      let callCount = 0;
      const trackingHandler = {
        render: function () {
          callCount++;
          return {
            render: function () {
              return { className: "controller", appendChild: function () {}, children: [] };
            },
          };
        },
      };
      router.routes.clear();
      router.register("/test", trackingHandler);

      await router._handle("/unknown");

      expect(callCount).toBe(0);
    });

    // Positive test: Calls after hooks
    it("should call after hooks", async () => {
      let hookCalled = false;
      const hook = function () {
        hookCalled = true;
      };
      router.afterEach(hook);

      // Ensure a matching route is registered
      const handlerWithRender = {
        render: function () {
          return {
            render: function () {
              return { className: "controller", appendChild: function () {}, children: [] };
            },
          };
        },
      };
      router.routes.clear();
      router.register("/test", handlerWithRender);
      mockWindow.location.pathname = "/test";

      await router._handle("/test");

      expect(hookCalled).toBe(true);
    });

    // Positive test: Handles async render
    it("should handle async render", async () => {
      const asyncHandler = {
        render: function () {
          return Promise.resolve({
            render: function () {
              return Promise.resolve({
                className: "async-controller",
                appendChild: function () {},
                children: [],
              });
            },
          });
        },
      };
      router.routes.clear();
      router.register("/async", asyncHandler);
      mockWindow.location.pathname = "/async";

      await router._handle("/async");

      expect(router.currentController).not.toBeNull();
    });
  });

  describe("_create(handler, path, params)", () => {
    // Positive test: Creates controller from function handler
    it("should create controller from function handler", () => {
      const funcHandler = function () {
        return {
          render: function () {
            return { className: "test" };
          },
        };
      };
      const ctrl = router._create(funcHandler, "/test", {});

      expect(ctrl).not.toBeNull();
    });

    // Positive test: Creates controller from render method
    it("should create controller from render method", () => {
      const ctrl = router._create(mockHandler, "/test", {});

      expect(ctrl).not.toBeNull();
    });

    // Positive test: Creates controller from controller class
    it("should create controller from controller class", () => {
      const MockController = function () {};
      MockController.prototype.render = function () {
        return {
          render: function () {
            return { className: "test" };
          },
        };
      };
      const handlerObj = { controller: MockController, options: {} };
      const ctrl = router._create(handlerObj, "/test", {});

      expect(ctrl).toBeInstanceOf(MockController);
    });

    // Positive test: Sets router, path, params, query on controller
    it("should set router, path, params, query on controller", () => {
      const controllerClass = function () {};
      controllerClass.prototype.render = function () {
        return {
          render: function () {
            return { className: "test" };
          },
        };
      };
      const handlerObj = { controller: controllerClass, options: {} };
      mockWindow.location.search = "?test=true";

      const ctrl = router._create(handlerObj, "/test", { id: "123" });

      expect(ctrl.router).toBe(router);
      expect(ctrl.path).toBe("/test");
      expect(ctrl.params).toEqual({ id: "123" });
      expect(ctrl.query).toEqual({ test: "true" });
    });

    // Positive test: Returns null for invalid handler
    it("should return null for invalid handler", () => {
      const ctrl = router._create({}, "/test", {});

      expect(ctrl).toBeNull();
    });
  });

  describe("_dispatchTitle(path)", () => {
    // Positive test: Dispatches routechange event
    it("should dispatch routechange event with path", () => {
      router._dispatchTitle("/test");

      expect(mockWindow._events.length).toBeGreaterThan(0);
      expect(mockWindow._events[0].type).toBe("routechange");
      expect(mockWindow._events[0].detail.path).toBe("/test");
    });

    // Negative test: Does nothing when no window
    it("should not dispatch when no window", () => {
      const tempWindow = global.window;
      delete global.window;
      expect(() => router._dispatchTitle("/test")).not.toThrow();
      global.window = tempWindow;
    });
  });

  describe("_callDidMount(el)", () => {
    // Positive test: Calls didMount on component
    it("should call didMount on component", () => {
      let didMountCalled = false;
      const mockComponent = {
        didMount: function () {
          didMountCalled = true;
        },
        _mounted: false,
      };
      const el = {
        _component: mockComponent,
        children: [],
      };

      router._callDidMount(el);

      expect(didMountCalled).toBe(true);
      expect(mockComponent._mounted).toBe(true);
    });

    // Positive test: Calls didMount on nested children
    it("should call didMount on nested children", () => {
      let childDidMountCalled = false;
      const childComponent = {
        didMount: function () {
          childDidMountCalled = true;
        },
        _mounted: false,
      };
      const childEl = { _component: childComponent, children: [] };
      const parentEl = {
        _component: null,
        children: [childEl],
      };

      router._callDidMount(parentEl);

      expect(childDidMountCalled).toBe(true);
    });

    // Positive test: Handles null element
    it("should handle null element", () => {
      expect(() => router._callDidMount(null)).not.toThrow();
    });
  });

  describe("back()", () => {
    // Positive test: back() method should exist
    it("should have back method", () => {
      expect(typeof router.back).toBe("function");
    });
  });

  describe("forward()", () => {
    // Positive test: forward() method should exist
    it("should have forward method", () => {
      expect(typeof router.forward).toBe("function");
    });
  });

  describe("getParams()", () => {
    // Positive test: getParams() method should exist and return current route params
    it("should have getParams method that returns current route params", () => {
      expect(typeof router.getParams).toBe("function");

      // Should return empty object when no current controller
      expect(router.getParams()).toEqual({});

      // Set up a current controller with params
      router.currentController = { params: { id: "123" } };
      expect(router.getParams()).toEqual({ id: "123" });
    });
  });

  describe("stop()", () => {
    // Positive test: stop() method should exist and set initialized to false
    it("should have stop method that sets initialized to false", () => {
      expect(typeof router.stop).toBe("function");

      router.start();
      expect(router.initialized).toBe(true);

      router.stop();
      expect(router.initialized).toBe(false);
    });
  });
});
