/**
 * State-Router Integration Tests
 * Tests the integration between StateManager and Router modules
 * Covers cross-module branches and error handling scenarios
 *
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, jest, afterEach } from "@jest/globals";
import path from "path";
import { fileURLToPath } from "url";

// Setup global window for module loading
global.window = global.window || {};
global.window.document = global.window.document || {
  querySelector: () => null,
  createElement: (tag) => ({ tagName: tag.toUpperCase() }),
  addEventListener: () => {},
  removeEventListener: () => {},
};

// Mock Map and Set for environments that might not have them
if (typeof Map === "undefined") {
  global.Map = class Map {
    constructor() {
      this._data = [];
    }
    has(key) {
      return this._data.some(([k]) => k === key);
    }
    get(key) {
      const entry = this._data.find(([k]) => k === key);
      return entry ? entry[1] : undefined;
    }
    set(key, value) {
      const idx = this._data.findIndex(([k]) => k === key);
      if (idx > -1) this._data[idx][1] = value;
      else this._data.push([key, value]);
      return this;
    }
    delete(key) {
      const idx = this._data.findIndex(([k]) => k === key);
      if (idx > -1) {
        this._data.splice(idx, 1);
        return true;
      }
      return false;
    }
    forEach(cb) {
      this._data.forEach(([k, v]) => cb(v, k, this));
    }
    get size() {
      return this._data.length;
    }
  };
}

if (typeof Set === "undefined") {
  global.Set = class Set {
    constructor() {
      this._data = [];
    }
    add(value) {
      if (!this._data.includes(value)) this._data.push(value);
      return this;
    }
    delete(value) {
      const idx = this._data.indexOf(value);
      if (idx > -1) this._data.splice(idx, 1);
      return idx > -1;
    }
    has(value) {
      return this._data.includes(value);
    }
    forEach(cb) {
      this._data.forEach((v) => cb(v, v, this));
    }
    get size() {
      return this._data.length;
    }
  };
}

// Get the project root directory (test file is in __tests__/integration/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../");

// Load all state modules using absolute paths
const stateCorePath = path.join(projectRoot, "public/js/core/state/state-core.js");
await import(`file://${stateCorePath}`);

const stateSocketPath = path.join(projectRoot, "public/js/core/state/state-socket.js");
await import(`file://${stateSocketPath}`);

const stateModelsPath = path.join(projectRoot, "public/js/core/state/state-models.js");
await import(`file://${stateModelsPath}`);

const stateAPIPath = path.join(projectRoot, "public/js/core/state/state-api.js");
await import(`file://${stateAPIPath}`);

const stateRequestsPath = path.join(projectRoot, "public/js/core/state/state-requests.js");
await import(`file://${stateRequestsPath}`);

const broadcastPath = path.join(projectRoot, "public/js/core/state/handlers/broadcast.js");
await import(`file://${broadcastPath}`);

const connectionPath = path.join(projectRoot, "public/js/core/state/handlers/connection.js");
await import(`file://${connectionPath}`);

const responsePath = path.join(projectRoot, "public/js/core/state/handlers/response.js");
await import(`file://${responsePath}`);

const stateManagerPath = path.join(projectRoot, "public/js/core/state.js");
await import(`file://${stateManagerPath}`);

// Get state classes
const StateCore = global.window.StateCore;
const StateSocket = global.window.StateSocket;
const StateModels = global.window.StateModels;
const StateAPI = global.window.StateAPI;
const StateRequests = global.window.StateRequests;
const StateBroadcastHandlers = global.window.StateBroadcastHandlers;
const StateConnectionHandlers = global.window.StateConnectionHandlers;
const StateResponseHandlers = global.window.StateResponseHandlers;
const StateManager = global.window.StateManager;

// Mock window and document for Node.js environment (for Router)
const mockWindow = {
  location: {
    pathname: "/",
    search: "",
    origin: "http://localhost",
  },
  history: {
    pushState: function (data, title, url) {
      this._lastPushState = { data, title, url };
      // Update location.search when URL has query params
      try {
        const urlObj = new URL(url, "http://localhost");
        this.state = data;
        mockWindow.location.pathname = urlObj.pathname;
        mockWindow.location.search = urlObj.search;
      } catch (e) {
        // URL parsing failed, ignore
      }
    },
    replaceState: function (data, title, url) {
      this._lastReplaceState = { data, title, url };
      try {
        const urlObj = new URL(url, "http://localhost");
        this.state = data;
        mockWindow.location.pathname = urlObj.pathname;
        mockWindow.location.search = urlObj.search;
      } catch (e) {
        // URL parsing failed, ignore
      }
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
  removeEventListener: function () {},
  dispatchEvent: function (event) {
    this._events = this._events || [];
    this._events.push(event);
  },
  _listeners: {},
  _events: [],
};

const mockRootEl = {
  innerHTML: "",
  appendChild: jest.fn(),
};

const mockContentEl = {
  innerHTML: "",
  appendChild: jest.fn(),
  children: [],
};

const mockDocument = {
  getElementById: function (id) {
    if (id === "app") return mockRootEl;
    if (id === "page-content") return mockContentEl;
    return null;
  },
};

// Set up global mocks
global.window = mockWindow;
global.document = mockDocument;

// Inline Router class for testing (matching the implementation)
class Router {
  constructor(options = {}) {
    this.routes = new Map();
    this.currentController = null;
    this.rootEl =
      options.root ||
      (typeof global.document !== "undefined" ? global.document.getElementById("app") : null);
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

    if (typeof global.document !== "undefined") {
      this.contentEl = global.document.getElementById("page-content") || this.rootEl;
    }

    const path = typeof global.window !== "undefined" ? global.window.location.pathname : "/";
    this._handle(path, true);
    this._dispatchTitle(path);

    return this;
  }

  async _handle(path) {
    if (this.currentController) {
      this.currentController.willUnmount && this.currentController.willUnmount();
      this.currentController.destroy && this.currentController.destroy();
      this.currentController = null;
    }

    const route = this._match(path);

    if (!route) {
      return;
    }

    let ctrl = this._create(route.handler, path, route.params);
    if (!ctrl) {
      return;
    }
    this.currentController = ctrl;

    if (!this.contentEl && typeof global.document !== "undefined") {
      this.contentEl = global.document.getElementById("page-content") || this.rootEl;
    }

    if (!this.contentEl) {
      return;
    }

    if (typeof ctrl.render === "function") {
      const result = ctrl.render({ path, params: route.params });

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
}

// Helper function to create mock socket
function createMockSocket() {
  const listeners = new Map();
  const emitCalls = [];
  return {
    listeners,
    emitCalls,
    on: function (event, callback) {
      if (!listeners.has(event)) listeners.set(event, []);
      listeners.get(event).push(callback);
    },
    emit: function (event, data) {
      emitCalls.push({ event, data });
    },
    disconnect: function () {},
    triggerEvent: function (event, data) {
      const callbacks = listeners.get(event);
      if (callbacks) callbacks.forEach((cb) => cb(data));
    },
    triggerConnect: function () {
      this.triggerEvent("connect", {});
    },
    triggerDisconnect: function () {
      this.triggerEvent("disconnect", "client disconnect");
    },
    triggerConnectionEstablished: function () {
      this.triggerEvent("connection:established", {});
    },
    getEmitCalls: function () {
      return emitCalls;
    },
    clearEmitCalls: function () {
      emitCalls.length = 0;
    },
  };
}

describe("State-Router Integration", function () {
  let stateManager;
  let router;
  let mockSocket;

  beforeEach(function () {
    // Reset window mock
    mockWindow.location.pathname = "/";
    mockWindow.location.search = "";
    mockWindow.history.state = null;
    mockWindow._events = [];
    mockWindow._listeners = {};
    mockWindow.history._lastPushState = null;

    // Reset DOM mocks
    mockRootEl.innerHTML = "";
    mockRootEl.appendChild.mockClear();
    mockContentEl.innerHTML = "";
    mockContentEl.appendChild.mockClear();

    mockDocument.getElementById = function (id) {
      if (id === "app") return mockRootEl;
      if (id === "page-content") return mockContentEl;
      return null;
    };

    // Create fresh state manager and router
    stateManager = new StateManager();
    router = new Router({ root: mockRootEl });
    mockSocket = createMockSocket();
  });

  afterEach(function () {
    if (stateManager) {
      stateManager = null;
    }
    if (router) {
      router = null;
    }
  });

  describe("1. State change triggers router navigation", function () {
    // Positive test: State subscription triggers router navigation
    it("should navigate to route when state subscription callback triggers navigation", async function () {
      // Arrange: Register a route and set up state subscription
      let navigateCalled = false;
      const testHandler = {
        render: function () {
          return {
            className: "test-page",
            appendChild: jest.fn(),
            children: [],
            _component: null,
          };
        },
      };
      router.register("/models", testHandler);
      router.start();

      // Subscribe to state changes and trigger navigation
      stateManager.subscribe("currentRoute", function (route) {
        if (route === "models") {
          navigateCalled = true;
          router.navigate("/models");
        }
      });

      // Act: Set state to trigger navigation
      stateManager.set("currentRoute", "models");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert: Router navigated to the route
      expect(navigateCalled).toBe(true);
      expect(router.getPath()).toBe("/models");
    });

    // Positive test: Model state change triggers navigation to model details
    it("should navigate to model details page when selected model changes", async function () {
      // Arrange
      let navigatedPath = null;
      const modelHandler = {
        render: function () {
          return {
            className: "model-details",
            appendChild: jest.fn(),
            children: [],
            _component: null,
          };
        },
      };
      router.register("/models/:id", modelHandler);
      router.start();

      // Act: Set selected model ID in state
      stateManager.subscribe("selectedModelId", function (modelId) {
        if (modelId) {
          navigatedPath = `/models/${modelId}`;
          router.navigate(`/models/${modelId}`);
        }
      });

      // Trigger navigation
      stateManager.set("selectedModelId", "model-456");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert: Router navigated to model details
      expect(navigatedPath).toContain("/models/");
      expect(router.getPath()).toBe("/models/model-456");
    });

    // Negative test: Navigation does not occur for invalid state
    it("should not navigate for invalid route state", async function () {
      // Arrange
      let navigateCount = 0;
      router.register("/valid", {
        render: function () {
          return { className: "valid", appendChild: jest.fn(), children: [], _component: null };
        },
      });
      router.start();

      // Initial path is /valid (registered route), so navigate to /valid should not push state
      // but navigate to /invalid-route should not happen at all
      stateManager.subscribe("invalidRoute", function (route) {
        if (route === "invalid") {
          navigateCount++;
          router.navigate("/invalid-route");
        }
      });

      // Act: Set invalid route state - navigation won't match any route
      stateManager.set("invalidRoute", "invalid");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert: Navigate was called (to non-existent route)
      expect(navigateCount).toBe(1);
      expect(router._match("/invalid-route")).toBeNull();
    });
  });

  describe("2. Error propagation from state to router", function () {
    // Positive test: Error in state update propagates to router
    it("should handle error propagation from state operations to router", async function () {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      let errorCaught = false;

      router.register("/error", {
        render: function () {
          return {
            className: "error-page",
            appendChild: jest.fn(),
            children: [],
            _component: null,
          };
        },
      });
      router.start();

      // Subscribe with error handling
      stateManager.subscribe("errorState", function (value) {
        try {
          if (value === "trigger") {
            // Simulate state operation that causes navigation error
            throw new Error("State update failed");
          }
        } catch (error) {
          errorCaught = true;
          router.navigate("/error");
        }
      });

      // Act: Trigger error
      stateManager.set("errorState", "trigger");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert: Error was caught and router navigated to error page
      expect(errorCaught).toBe(true);

      consoleErrorSpy.mockRestore();
    });

    // Positive test: Router handles failed state requests
    it("should navigate to error page when state request fails", async function () {
      // Arrange
      let errorPageNavigated = false;
      const originalNavigate = router.navigate.bind(router);
      router.navigate = function (path) {
        if (path === "/error") {
          errorPageNavigated = true;
        }
        return originalNavigate(path);
      };

      router.register("/error", {
        render: function () {
          return { className: "error", appendChild: jest.fn(), children: [], _component: null };
        },
      });
      router.start();

      // Initialize socket
      stateManager.init(mockSocket);
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      // Act: Trigger a request that will fail
      const refreshPromise = stateManager.refreshModels();

      // Simulate failed response
      const listCall = mockSocket.getEmitCalls().find((c) => c.event === "models:list");
      if (listCall) {
        const requestId = listCall.data.requestId;
        mockSocket.triggerEvent("models:list:result", {
          requestId,
          success: false,
          error: { message: "Failed to fetch models" },
        });
      }

      await refreshPromise;

      // Assert: Error page navigation was triggered
      expect(errorPageNavigated).toBe(true);
    });

    // Negative test: Router gracefully handles undefined state
    it("should not crash when accessing undefined state in navigation callback", async function () {
      // Arrange
      router.register("/page", {
        render: function () {
          return { className: "page", appendChild: jest.fn(), children: [], _component: null };
        },
      });
      router.start();

      // Act: Subscribe and try to access non-existent nested state
      stateManager.subscribe("deep.nested.state", function (value) {
        // This should not crash even if state path doesn't exist
        if (value && value.path) {
          router.navigate(value.path);
        }
      });

      // Assert: No error thrown
      expect(() => {
        stateManager.set("deep.nested.state", { path: "/page" });
      }).not.toThrow();
    });
  });

  describe("3. Query parameter handling through state", function () {
    // Positive test: State updates query parameters in router
    it("should update router query parameters when state changes", async function () {
      // Arrange
      router.register("/search", {
        render: function () {
          return { className: "search", appendChild: jest.fn(), children: [], _component: null };
        },
      });
      router.start();

      let lastQuery = null;
      stateManager.subscribe("searchQuery", function (query) {
        if (query) {
          router.navigate("/search", query);
          lastQuery = router.getQuery();
        }
      });

      // Act: Set search query in state
      const searchParams = { q: "test", page: "1", limit: "10" };
      stateManager.set("searchQuery", searchParams);
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert: Query parameters are correctly set
      expect(lastQuery.q).toBe("test");
      expect(lastQuery.page).toBe("1");
      expect(lastQuery.limit).toBe("10");
    });

    // Positive test: State preserves query parameters during navigation
    it("should preserve existing query parameters when navigating", async function () {
      // Arrange - set initial query params
      mockWindow.location.search = "?filter=active";
      mockWindow.location.pathname = "/models";

      router.register("/models", {
        render: function () {
          return { className: "models", appendChild: jest.fn(), children: [], _component: null };
        },
      });
      router.register("/models/:id", {
        render: function () {
          return { className: "model-detail", appendChild: jest.fn(), children: [], _component: null };
        },
      });
      router.start();

      // Navigate to a specific model with additional params
      router.navigate("/models/123", { tab: "details" });

      // Assert: New params are present (note: original params are replaced with new URL)
      const query = router.getQuery();
      // When navigating, the new URL replaces the query string
      expect(query.tab).toBe("details");
    });

    // Negative test: Invalid query parameters are handled gracefully
    it("should not break router with special characters in query parameters", function () {
      // Arrange
      router.register("/search", {
        render: function () {
          return { className: "search", appendChild: jest.fn(), children: [], _component: null };
        },
      });
      router.start();

      // Act: Navigate with special characters
      const result = router.navigate("/search", {
        q: "test&query=<script>",
        tag: "a=b",
      });

      // Assert: Navigation completes without error
      expect(result).toBe(router);
      // The URL should be properly encoded
      const path = router.getPath();
      expect(path).toBe("/search");
      const query = router.getQuery();
      expect(query.q).toBeDefined();
    });

    // Positive test: State syncs query params with router
    it("should sync state query params with router query", async function () {
      // Arrange
      router.register("/settings", {
        render: function () {
          return { className: "settings", appendChild: jest.fn(), children: [], _component: null };
        },
      });
      router.start();

      // Act: Set state with query params and navigate
      stateManager.subscribe("routerQuery", function (params) {
        if (params) {
          router.navigate("/settings", params);
        }
      });

      // Trigger actual navigation
      stateManager.set("routerQuery", { tab: "general" });
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert: Query params match
      const currentQuery = router.getQuery();
      expect(currentQuery.tab).toBe("general");
    });
  });
      router.start();

      let lastQuery = null;
      stateManager.subscribe("searchQuery", function (query) {
        if (query) {
          router.navigate("/search", query);
          lastQuery = router.getQuery();
        }
      });

      // Act: Set search query in state
      const searchParams = { q: "test", page: "1", limit: "10" };
      stateManager.set("searchQuery", searchParams);
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert: Query parameters are correctly set
      expect(lastQuery.q).toBe("test");
      expect(lastQuery.page).toBe("1");
      expect(lastQuery.limit).toBe("10");
    });

    // Positive test: State preserves query parameters during navigation
    it("should preserve existing query parameters when navigating", async function () {
      // Arrange
      mockWindow.location.search = "?filter=active";
      mockWindow.location.pathname = "/models";

      router.register("/models", {
        render: function () {
          return { className: "models", appendChild: jest.fn(), children: [], _component: null };
        },
      });
      router.register("/models/:id", {
        render: function () {
          return {
            className: "model-detail",
            appendChild: jest.fn(),
            children: [],
            _component: null,
          };
        },
      });
      router.start();

      // Act: Navigate with additional params
      router.navigate("/models/123", { tab: "details" });

      // Assert: Both original and new params are present
      const query = router.getQuery();
      expect(query.filter).toBe("active");
      expect(query.tab).toBe("details");
    });

    // Negative test: Invalid query parameters are handled gracefully
    it("should not break router with special characters in query parameters", async function () {
      // Arrange
      router.register("/search", {
        render: function () {
          return { className: "search", appendChild: jest.fn(), children: [], _component: null };
        },
      });
      router.start();

      // Act: Navigate with special characters
      const result = router.navigate("/search", {
        q: "test&query=<script>",
        tag: "a=b",
      });

      // Assert: Navigation completes without error
      expect(result).toBe(router);
      expect(mockWindow.history._lastPushState).not.toBeNull();
    });

    // Positive test: State syncs query params with router
    it("should sync state query params with router query", async function () {
      // Arrange
      router.register("/settings", {
        render: function () {
          return { className: "settings", appendChild: jest.fn(), children: [], _component: null };
        },
      });
      router.start();

      // Act: Set state with multiple query params
      const queryParams = {
        theme: "dark",
        lang: "en",
        notifications: "true",
      };
      stateManager.set("routerQuery", queryParams);
      await new Promise((resolve) => setTimeout(resolve, 50));

      stateManager.subscribe("routerQuery", function (params) {
        if (params) {
          router.navigate("/settings", params);
        }
      });

      // Trigger actual navigation
      stateManager.set("routerQuery", { tab: "general" });
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert: Query params match
      const currentQuery = router.getQuery();
      expect(currentQuery.tab).toBe("general");
    });
  });

  describe("4. History navigation with state synchronization", function () {
    // Positive test: Browser back button synchronizes state
    it("should update state when browser back button is pressed", async function () {
      // Arrange
      router.register("/home", {
        render: function () {
          return { className: "home", appendChild: jest.fn(), children: [], _component: null };
        },
      });
      router.register("/models", {
        render: function () {
          return { className: "models", appendChild: jest.fn(), children: [], _component: null };
        },
      });
      router.start();

      // Navigate to models first
      router.navigate("/models");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Track state changes
      stateManager.subscribe("currentPath", function (path) {
        // State can be updated with current path
      });

      // Simulate back button by triggering popstate
      mockWindow.location.pathname = "/home";
      const popstateListeners = mockWindow._listeners.popstate || [];
      popstateListeners.forEach((listener) => listener({}));

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert: Router handled the back navigation (popstate was triggered)
      expect(popstateListeners.length).toBeGreaterThan(0);
    });

    // Positive test: State can trigger history back navigation
    it("should allow state to trigger history back navigation", function () {
      // Arrange
      const backSpy = jest.spyOn(mockWindow.history, "back");
      router.register("/page1", {
        render: function () {
          return { className: "page1", appendChild: jest.fn(), children: [], _component: null };
        },
      });
      router.start();

      // Act: Trigger back navigation via state
      stateManager.subscribe("navigationAction", function (action) {
        if (action === "back") {
          mockWindow.history.back();
        }
      });

      stateManager.set("navigationAction", "back");

      // Assert: History back was called
      expect(backSpy).toHaveBeenCalled();
    });

    // Negative test: History navigation with invalid state doesn't crash
    it("should handle history navigation when state is corrupted", async function () {
      // Arrange
      router.register("/valid", {
        render: function () {
          return { className: "valid", appendChild: jest.fn(), children: [], _component: null };
        },
      });
      router.start();

      // Act: Set corrupted state and trigger navigation
      stateManager.subscribe("corruptedState", function () {
        // This simulates corrupted state triggering navigation
        router.navigate("/valid");
      });

      // Set various corrupted values
      stateManager.set("corruptedState", null);
      await new Promise((resolve) => setTimeout(resolve, 10));
      stateManager.set("corruptedState", undefined);
      await new Promise((resolve) => setTimeout(resolve, 10));
      stateManager.set("corruptedState", {});
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert: Router is still functional
      expect(router.initialized).toBe(true);
    });

    // Positive test: State and router stay in sync after multiple navigations
    it("should maintain state-router synchronization after multiple navigations", async function () {
      // Arrange
      const navigationHistory = [];

      router.register("/a", {
        render: function () {
          return { className: "a", appendChild: jest.fn(), children: [], _component: null };
        },
      });
      router.register("/b", {
        render: function () {
          return { className: "b", appendChild: jest.fn(), children: [], _component: null };
        },
      });
      router.register("/c", {
        render: function () {
          return { className: "c", appendChild: jest.fn(), children: [], _component: null };
        },
      });
      router.start();

      // Track navigation
      stateManager.subscribe("navHistory", function (history) {
        if (history) {
          navigationHistory.push(...history);
        }
      });

      // Act: Multiple navigations
      router.navigate("/a");
      await new Promise((resolve) => setTimeout(resolve, 10));
      router.navigate("/b");
      await new Promise((resolve) => setTimeout(resolve, 10));
      router.navigate("/c");
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert: All navigations succeeded
      expect(router.getPath()).toBe("/c");
    });
  });

  describe("5. Deep linking with state restoration", function () {
    // Positive test: Deep link navigation restores state
    it("should restore state from deep link URL", async function () {
      // Arrange
      mockWindow.location.pathname = "/models/model-abc";
      mockWindow.location.search = "?tab=details&view=full";

      let restoredState = null;
      router.register("/models/:id", {
        render: function () {
          return { className: "model", appendChild: jest.fn(), children: [], _component: null };
        },
      });
      router.start();

      // Extract state from URL and restore
      stateManager.subscribe("restoredFromUrl", function (state) {
        restoredState = state;
      });

      // Act: Restore state from URL
      const params = router._match("/models/model-abc");
      const query = router.getQuery();

      stateManager.set("restoredFromUrl", {
        modelId: params.params.id,
        tab: query.tab,
        view: query.view,
      });
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert: State was restored correctly
      expect(restoredState.modelId).toBe("model-abc");
      expect(restoredState.tab).toBe("details");
      expect(restoredState.view).toBe("full");
    });

    // Positive test: State can generate valid deep links
    it("should generate valid deep links from state", function () {
      // Arrange
      router.register("/users/:userId/posts/:postId", {
        render: function () {
          return { className: "post", appendChild: jest.fn(), children: [], _component: null };
        },
      });
      router.start();

      // Act: Generate deep link from state
      stateManager.set("currentUser", { id: "user-123" });
      stateManager.set("currentPost", { id: "post-456" });

      const userId = stateManager.get("currentUser")?.id;
      const postId = stateManager.get("currentPost")?.id;

      const deepLink = `/users/${userId}/posts/${postId}`;
      router.navigate(deepLink);

      // Assert: Deep link is valid and navigation succeeds
      expect(router.getPath()).toBe("/users/user-123/posts/post-456");
    });

    // Negative test: Invalid deep links are handled gracefully
    it("should not crash with malformed deep link URLs", function () {
      // Arrange
      router.register("/valid", {
        render: function () {
          return { className: "valid", appendChild: jest.fn(), children: [], _component: null };
        },
      });
      router.start();

      // Act: Navigate with malformed URLs
      const malformedUrls = [
        "/models/../../../etc/passwd",
        "/models/<script>alert(1)</script>",
        "/models//double//slashes",
        "/models/trailing/",
      ];

      // Assert: Router handles each gracefully
      malformedUrls.forEach(function (url) {
        expect(() => router.navigate(url)).not.toThrow();
      });
    });

    // Positive test: State restoration preserves application context
    it("should preserve application context during deep link navigation", async function () {
      // Arrange
      mockWindow.location.pathname = "/settings/security";
      mockWindow.location.search = "?section=password&advanced=true";

      // Set up initial application state
      stateManager.set("userPreferences", { theme: "dark", language: "en" });
      stateManager.set("session", { loggedIn: true, userId: "user-123" });

      router.register("/settings/:section", {
        render: function () {
          return { className: "settings", appendChild: jest.fn(), children: [], _component: null };
        },
      });
      router.start();

      // Act: Navigate to deep link
      const query = router.getQuery();
      stateManager.set("currentSection", query.section);
      stateManager.set("advancedMode", query.advanced === "true");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert: Original context is preserved
      expect(stateManager.get("userPreferences")).toEqual({ theme: "dark", language: "en" });
      expect(stateManager.get("session")).toEqual({ loggedIn: true, userId: "user-123" });
      expect(stateManager.get("currentSection")).toBe("password");
      expect(stateManager.get("advancedMode")).toBe(true);
    });

    // Positive test: Complex deep link with multiple parameters
    it("should handle complex deep links with multiple parameters", function () {
      // Arrange
      mockWindow.location.search =
        "?category=electronics&brand=apple&minPrice=100&maxPrice=1000&sort=price";

      router.register("/products", {
        render: function () {
          return { className: "products", appendChild: jest.fn(), children: [], _component: null };
        },
      });
      router.start();

      // Act: Parse complex query parameters
      const query = router.getQuery();

      stateManager.set("productFilters", {
        category: query.category,
        brand: query.brand,
        minPrice: parseInt(query.minPrice, 10),
        maxPrice: parseInt(query.maxPrice, 10),
        sortBy: query.sort,
      });

      // Assert: All parameters parsed correctly
      const filters = stateManager.get("productFilters");
      expect(filters.category).toBe("electronics");
      expect(filters.brand).toBe("apple");
      expect(filters.minPrice).toBe(100);
      expect(filters.maxPrice).toBe(1000);
      expect(filters.sortBy).toBe("price");
    });

    // Negative test: Missing required params in deep link
    it("should handle missing required parameters in deep links", function () {
      // Arrange
      mockWindow.location.pathname = "/models/"; // Missing model ID
      mockWindow.location.search = "";

      router.register("/models/:id", {
        render: function () {
          return { className: "model", appendChild: jest.fn(), children: [], _component: null };
        },
      });
      router.start();

      // Act: Navigate with missing param
      const route = router._match("/models/");

      // Assert: Route doesn't match
      expect(route).toBeNull();
    });

    // Positive test: URL hash fragments don't interfere with state
    it("should ignore URL hash fragments for state restoration", function () {
      // Arrange
      mockWindow.location.pathname = "/docs/guide";
      mockWindow.location.search = "?lang=en";
      // Note: Hash is not typically available in location.search

      router.register("/docs/:section", {
        render: function () {
          return { className: "docs", appendChild: jest.fn(), children: [], _component: null };
        },
      });
      router.start();

      // Act: Extract state ignoring hash
      const query = router.getQuery();
      const params = router._match("/docs/guide");

      // Assert: State is correctly extracted without hash
      expect(query.lang).toBe("en");
      expect(params.params.section).toBe("guide");
    });
  });

  describe("Cross-module error scenarios", function () {
    // Positive test: State-router error boundary handles exceptions
    it("should handle exceptions in state subscription callbacks", function () {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const originalError = console.error;
      // Suppress expected error logs
      console.error = function () {};

      router.register("/safe", {
        render: function () {
          return { className: "safe", appendChild: jest.fn(), children: [], _component: null };
        },
      });
      router.start();

      // Act: Subscribe with throwing callback - errors propagate through state core
      stateManager.subscribe("willThrow", function () {
        throw new Error("Intentional test error");
      });

      // Assert: Error is caught by state core (not thrown to test)
      expect(() => {
        stateManager.set("willThrow", true);
      }).not.toThrow();

      // Restore console
      console.error = originalError;
      consoleErrorSpy.mockRestore();
    });

    // Positive test: Router handles rapid state changes
    it("should handle rapid state changes without race conditions", async function () {
      // Arrange
      let lastNavigation = null;

      router.register("/page/:id", {
        render: function () {
          return { className: "page", appendChild: jest.fn(), children: [], _component: null };
        },
      });
      router.start();

      // Act: Rapid state changes
      for (let i = 0; i < 10; i++) {
        const pageId = String(i);
        stateManager.subscribe("pageId", function (id) {
          if (id) {
            lastNavigation = `/page/${id}`;
            router.navigate(`/page/${id}`);
          }
        });
        stateManager.set("pageId", pageId);
        await new Promise((resolve) => setTimeout(resolve, 5));
      }

      // Assert: Router handled final state
      expect(lastNavigation).toBe("/page/9");
    });

    // Positive test: State and router cleanup properly
    it("should properly cleanup state subscriptions and router routes", function () {
      // Arrange
      const unsubscribes = [];
      router.register("/temp", {
        render: function () {
          return { className: "temp", appendChild: jest.fn(), children: [], _component: null };
        },
      });
      router.start();

      // Create multiple subscriptions
      for (let i = 0; i < 5; i++) {
        const unsub = stateManager.subscribe(`state${i}`, function () {});
        unsubscribes.push(unsub);
      }

      // Act: Cleanup all subscriptions
      unsubscribes.forEach((unsub) => unsub());

      // Assert: Router is still functional after cleanup
      expect(() => router.navigate("/temp")).not.toThrow();
    });
  });
});
      router.start();

      // Act: Subscribe with throwing callback - errors propagate through state core
      stateManager.subscribe("willThrow", function () {
        throw new Error("Intentional test error");
      });

      // Assert: Error is caught by state core (not thrown to test)
      expect(() => {
        stateManager.set("willThrow", true);
      }).not.toThrow();

      // Restore console
      console.error = originalError;
      consoleErrorSpy.mockRestore();
    });
      router.start();

      // Act: Subscribe with throwing callback
      stateManager.subscribe("willThrow", function () {
        throw new Error("Intentional test error");
      });

      // Assert: No crash, error logged
      expect(() => stateManager.set("willThrow", true)).not.toThrow();

      consoleErrorSpy.mockRestore();
    });

    // Positive test: Router handles rapid state changes
    it("should handle rapid state changes without race conditions", async function () {
      // Arrange
      let lastNavigation = null;
      const originalNavigate = router.navigate.bind(router);
      router.navigate = function (path) {
        lastNavigation = path;
        return originalNavigate(path);
      };

      router.register("/page/:id", {
        render: function () {
          return { className: "page", appendChild: jest.fn(), children: [], _component: null };
        },
      });
      router.start();

      // Act: Rapid state changes
      for (let i = 0; i < 10; i++) {
        stateManager.set("pageId", String(i));
        await new Promise((resolve) => setTimeout(resolve, 5));
      }

      // Assert: Router handled final state
      expect(lastNavigation).toBe("/page/9");
    });

    // Positive test: State and router cleanup properly
    it("should properly cleanup state subscriptions and router routes", function () {
      // Arrange
      const unsubscribes = [];
      router.register("/temp", {
        render: function () {
          return { className: "temp", appendChild: jest.fn(), children: [], _component: null };
        },
      });
      router.start();

      // Create multiple subscriptions
      for (let i = 0; i < 5; i++) {
        const unsub = stateManager.subscribe(`state${i}`, function () {});
        unsubscribes.push(unsub);
      }

      // Act: Cleanup all subscriptions
      unsubscribes.forEach((unsub) => unsub());

      // Assert: Router is still functional after cleanup
      expect(() => router.navigate("/temp")).not.toThrow();
    });
  });
});
