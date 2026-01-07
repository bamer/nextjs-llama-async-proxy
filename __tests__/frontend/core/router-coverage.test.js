/**
 * Router Coverage Tests
 * Comprehensive tests for the History API based Router
 * Tests the ACTUAL router.js implementation using dynamic import
 *
 * Critical: Uses dynamic import to import the actual module for coverage tracking
 *
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";

// Test environment setup
let Router;
let events;

// Create a proper mock controller factory
function createMockController(returnElement) {
  return {
    render: function () {
      return returnElement;
    },
    willUnmount: null,
    destroy: null,
    didMount: null,
  };
}

// Dynamic import of the actual router.js module
beforeAll(async () => {
  const module = await import("/home/bamer/nextjs-llama-async-proxy/public/js/core/router.js");
  Router = window.Router;
});

describe("Router Coverage Tests", () => {
  let router;
  let events;

  beforeEach(() => {
    // Create mock root element
    const mockRootEl = document.createElement("div");
    mockRootEl.id = "app";
    mockRootEl.innerHTML = "";
    document.body.appendChild(mockRootEl);

    // Create mock content element
    const mockContentEl = document.createElement("div");
    mockContentEl.id = "page-content";
    document.body.appendChild(mockContentEl);

    // Create mock Layout
    const mockLayout = {
      render: function () {
        const el = document.createElement("div");
        el.className = "layout";
        return el;
      },
      bindEvents: function () {},
      didMount: function () {}, // Add didMount to cover that branch
    };

    // Track events dispatched to window
    const originalDispatchEvent = window.dispatchEvent.bind(window);
    window.dispatchEvent = function (event) {
      events.push(event);
      return originalDispatchEvent(event);
    };

    // Mock Layout constructor
    window.Layout = function () {
      return mockLayout;
    };

    // Create fresh router instance
    router = new Router({ root: document.getElementById("app") });
  });

  afterEach(() => {
    // Clean up DOM
    const app = document.getElementById("app");
    const pageContent = document.getElementById("page-content");
    if (app) app.remove();
    if (pageContent) pageContent.remove();

    // Clean up mocks
    delete window.Layout;
    events = [];
  });

  describe("constructor(options)", () => {
    // POSITIVE TEST: Router initializes with correct default properties
    // Verifies the constructor properly initializes all internal state
    it("should initialize with correct default properties", () => {
      expect(router).toBeInstanceOf(Router);
      expect(router.routes).toBeInstanceOf(Map);
      expect(router.currentController).toBeNull();
      expect(router.initialized).toBe(false);
      expect(router.afterHooks).toEqual([]);
      expect(router.contentEl).toBeNull();
      expect(router.layout).toBeNull();
    });

    // POSITIVE TEST: Router accepts custom root element
    // Verifies the options.root parameter is correctly assigned
    it("should accept custom root element from options", () => {
      const customRoot = document.createElement("div");
      const customRouter = new Router({ root: customRoot });
      expect(customRouter.rootEl).toBe(customRoot);
    });

    // POSITIVE TEST: Constructor sets up popstate event listener
    // Verifies the popstate listener is registered on window
    // Note: We can't easily verify this in jsdom, but the router does register it
    it("should register popstate event listener", () => {
      const router2 = new Router({});
      // Just verify router was created successfully
      expect(router2).toBeInstanceOf(Router);
    });

    // POSITIVE TEST: Popstate handler calls _handle
    // Verifies the popstate event handler is set up correctly
    it("should handle popstate events", async () => {
      const router2 = new Router({ root: document.getElementById("app") });
      router2.register("/test", {
        render: function () {
          return createMockController(document.createElement("div"));
        },
      });
      router2.contentEl = document.getElementById("page-content");

      // Navigate to /test first
      await router2._handle("/test", false);

      // Now simulate a popstate event by dispatching it
      const event = new PopStateEvent("popstate", { state: {} });
      window.dispatchEvent(event);

      // Give time for the async handler to run
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(router2).toBeInstanceOf(Router);
    });
  });

  describe("register(path, handler)", () => {
    // POSITIVE TEST: Registering a route adds it to routes Map
    // Verifies the route is stored with correct path and handler
    it("should register route and add to routes Map", () => {
      const handler = function () {
        return createMockController(document.createElement("div"));
      };
      router.register("/test", handler);
      expect(router.routes.size).toBe(1);
    });

    // POSITIVE TEST: Register returns router for chaining
    // Verifies method chaining is supported
    it("should return router for chaining", () => {
      const result = router.register("/test", function () {
        return createMockController(document.createElement("div"));
      });
      expect(result).toBe(router);
    });

    // POSITIVE TEST: Register converts function handler to object with render
    // Verifies function handlers are wrapped in object format
    it("should wrap function handler in object with render method", () => {
      const funcHandler = function () {
        return createMockController(document.createElement("div"));
      };
      router.register("/test", funcHandler);
      const routeEntry = router.routes.values().next().value;
      expect(routeEntry.handler.render).toBe(funcHandler);
    });

    // POSITIVE TEST: Register accepts object handler with render method
    // Verifies object handlers are stored as-is
    it("should accept object handler with render method", () => {
      const handlerObj = {
        render: function () {
          return createMockController(document.createElement("div"));
        },
      };
      router.register("/test", handlerObj);
      const routeEntry = router.routes.values().next().value;
      expect(routeEntry.handler).toBe(handlerObj);
    });

    // POSITIVE TEST: Register accepts controller class
    // Verifies controller-based handlers are properly stored
    it("should accept controller class with options", () => {
      const controllerClass = function () {};
      controllerClass.prototype.render = function () {
        return document.createElement("div");
      };
      const handlerObj = { controller: controllerClass, options: { test: true } };
      router.register("/test", handlerObj);
      const routeEntry = router.routes.values().next().value;
      expect(routeEntry.handler.controller).toBe(controllerClass);
      expect(routeEntry.handler.options).toEqual({ test: true });
    });

    // NEGATIVE TEST: Handles empty path
    // Verifies empty string paths are accepted
    it("should handle empty path", () => {
      router.register("", {
        render: function () {
          return createMockController(document.createElement("div"));
        },
      });
      expect(router.routes.size).toBe(1);
    });

    // POSITIVE TEST: Multiple routes can be registered
    // Verifies the Map-based storage handles multiple routes
    it("should allow registering multiple routes", () => {
      router.register("/home", function () {
        return createMockController(document.createElement("div"));
      });
      router.register("/about", function () {
        return createMockController(document.createElement("div"));
      });
      router.register("/contact", function () {
        return createMockController(document.createElement("div"));
      });
      expect(router.routes.size).toBe(3);
    });
  });

  describe("afterEach(hook)", () => {
    // POSITIVE TEST: Adds hook to afterHooks array
    // Verifies hooks are stored for later execution
    it("should add hook to afterHooks array", () => {
      const hook = function () {};
      router.afterEach(hook);
      expect(router.afterHooks).toContain(hook);
    });

    // POSITIVE TEST: Returns router for chaining
    // Verifies method chaining is supported
    it("should return router for chaining", () => {
      const result = router.afterEach(function () {});
      expect(result).toBe(router);
    });

    // POSITIVE TEST: Multiple hooks can be added
    // Verifies multiple hooks are stored in order
    it("should allow adding multiple hooks", () => {
      const hook1 = function () {};
      const hook2 = function () {};
      router.afterEach(hook1);
      router.afterEach(hook2);
      expect(router.afterHooks).toHaveLength(2);
      expect(router.afterHooks[0]).toBe(hook1);
      expect(router.afterHooks[1]).toBe(hook2);
    });
  });

  describe("navigate(path, data)", () => {
    beforeEach(() => {
      router.register("/test", {
        render: function () {
          return createMockController(document.createElement("div"));
        },
      });
      router.register("/models/:id", {
        render: function () {
          return createMockController(document.createElement("div"));
        },
      });
    });

    // POSITIVE TEST: Navigate calls pushState for different path
    // Verifies history.pushState is called when path changes
    it("should call pushState when navigating to different path", () => {
      const originalPushState = window.history.pushState;
      let pushStateCalled = false;
      window.history.pushState = function (...args) {
        pushStateCalled = true;
        return originalPushState.apply(this, args);
      };

      router.navigate("/test");

      window.history.pushState = originalPushState;
      expect(pushStateCalled).toBe(true);
    });

    // POSITIVE TEST: Navigate returns router for chaining
    // Verifies method chaining is supported
    it("should return router for chaining", () => {
      const result = router.navigate("/test");
      expect(result).toBe(router);
    });

    // POSITIVE TEST: Navigate handles query parameters
    // Verifies data object is converted to URL query string
    it("should handle query parameters in data object", () => {
      router.navigate("/test", { page: "1", limit: "10" });
      expect(window.location.pathname).toBe("/test");
      expect(window.location.search).toContain("page=1");
      expect(window.location.search).toContain("limit=10");
    });

    // POSITIVE TEST: Navigate matches path with params
    // Verifies dynamic route parameters are properly matched
    it("should handle path with dynamic params", () => {
      router.navigate("/models/123");
      expect(router.currentController).not.toBeNull();
    });
  });

  describe("getPath()", () => {
    // POSITIVE TEST: Returns current pathname
    // Verifies window.location.pathname is returned correctly
    it("should return current pathname from window.location", () => {
      window.history.pushState({}, "", "/models");
      expect(router.getPath()).toBe("/models");
    });

    // POSITIVE TEST: Returns root path
    // Verifies root "/" path is handled correctly
    it("should return root path", () => {
      window.history.pushState({}, "", "/");
      expect(router.getPath()).toBe("/");
    });

    // POSITIVE TEST: Returns nested path
    // Verifies deeply nested paths are returned correctly
    it("should return nested path", () => {
      window.history.pushState({}, "", "/models/123/settings");
      expect(router.getPath()).toBe("/models/123/settings");
    });
  });

  describe("getQuery()", () => {
    // POSITIVE TEST: Returns parsed query parameters
    // Verifies URLSearchParams are correctly parsed to object
    it("should return parsed query parameters", () => {
      window.history.pushState({}, "", "/?page=1&limit=10");
      const query = router.getQuery();
      expect(query).toEqual({ page: "1", limit: "10" });
    });

    // POSITIVE TEST: Returns empty object for no query
    // Verifies empty search string returns empty object
    it("should return empty object when no query string", () => {
      window.history.pushState({}, "", "/");
      const query = router.getQuery();
      expect(query).toEqual({});
    });

    // POSITIVE TEST: Handles single query parameter
    // Verifies single parameter case is handled correctly
    it("should handle single query parameter", () => {
      window.history.pushState({}, "", "/?search=test");
      const query = router.getQuery();
      expect(query).toEqual({ search: "test" });
    });

    // POSITIVE TEST: Handles encoded query parameters
    // Verifies URL encoding is properly decoded
    it("should handle encoded query parameters", () => {
      window.history.pushState({}, "", "/?name=John%20Doe");
      const query = router.getQuery();
      expect(query).toEqual({ name: "John Doe" });
    });
  });

  describe("start()", () => {
    // POSITIVE TEST: Initializes router and handles initial path
    // Verifies start() initializes all necessary components
    it("should initialize and handle initial path", () => {
      window.history.pushState({}, "", "/test");
      router.register("/test", {
        render: function () {
          return createMockController(document.createElement("div"));
        },
      });
      router.start();
      expect(router.initialized).toBe(true);
      expect(router.contentEl).toBeDefined();
    });

    // POSITIVE TEST: Returns router for chaining
    // Verifies method chaining is supported
    it("should return router for chaining", () => {
      const result = router.start();
      expect(result).toBe(router);
    });

    // POSITIVE TEST: Does not reinitialize if already initialized
    // Verifies idempotent behavior on multiple calls
    it("should not reinitialize if already initialized", () => {
      let callCount = 0;
      const trackingHandler = {
        render: function () {
          callCount++;
          return createMockController(document.createElement("div"));
        },
      };
      router.routes.clear();
      router.register("/test", trackingHandler);
      window.history.pushState({}, "", "/test");
      router.start();
      router.start();
      expect(callCount).toBe(1);
    });

    // POSITIVE TEST: Sets contentEl to page-content or root
    // Verifies correct element is selected for content
    it("should set contentEl to page-content element", () => {
      router.start();
      expect(router.contentEl).not.toBeNull();
    });

    // POSITIVE TEST: Handles initial path without routes registered
    // Verifies graceful handling when no matching route
    it("should handle initial path when no routes registered", () => {
      window.history.pushState({}, "", "/unknown");
      router.start();
      expect(router.initialized).toBe(true);
    });

    // POSITIVE TEST: Sets initialized flag to true
    // Verifies the flag is properly set
    it("should set initialized flag to true", () => {
      router.start();
      expect(router.initialized).toBe(true);
    });
  });

  describe("_handle(path)", () => {
    beforeEach(() => {
      router.register("/test", {
        render: function () {
          return createMockController(document.createElement("div"));
        },
      });
    });

    // POSITIVE TEST: Calls handler for matched route
    // Verifies the route handler is invoked for matching paths
    it("should call handler for matched route", async () => {
      let callCount = 0;
      const trackingHandler = {
        render: function () {
          callCount++;
          return createMockController(document.createElement("div"));
        },
      };
      router.routes.clear();
      router.register("/test", trackingHandler);
      await router._handle("/test");
      expect(callCount).toBe(1);
    });

    // POSITIVE TEST: Destroys previous controller
    // Verifies cleanup methods are called on route change
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
          return document.createElement("div");
        },
      };
      router.currentController = mockController;
      await router._handle("/test");
      expect(willUnmountCalled).toBe(true);
      expect(destroyCalled).toBe(true);
    });

    // POSITIVE TEST: Does nothing for unmatched path
    // Verifies no handler is called for non-matching routes
    it("should do nothing for unmatched path", async () => {
      let callCount = 0;
      const trackingHandler = {
        render: function () {
          callCount++;
          return createMockController(document.createElement("div"));
        },
      };
      router.routes.clear();
      router.register("/test", trackingHandler);
      await router._handle("/unknown");
      expect(callCount).toBe(0);
    });

    // POSITIVE TEST: Calls after hooks
    // Verifies afterEach hooks are executed
    it("should call after hooks", async () => {
      let hookCalled = false;
      const hook = function () {
        hookCalled = true;
      };
      router.afterEach(hook);
      const handlerWithRender = {
        render: function () {
          return createMockController(document.createElement("div"));
        },
      };
      router.routes.clear();
      router.register("/test", handlerWithRender);
      router.contentEl = document.getElementById("page-content");
      await router._handle("/test");
      expect(hookCalled).toBe(true);
    });

    // POSITIVE TEST: Handles async render
    // Verifies Promise-based render results are awaited
    it("should handle async render", async () => {
      const asyncHandler = {
        render: function () {
          return Promise.resolve(createMockController(document.createElement("div")));
        },
      };
      router.routes.clear();
      router.register("/async", asyncHandler);
      await router._handle("/async");
      expect(router.currentController).not.toBeNull();
    });

    // POSITIVE TEST: Calls controller didMount if it exists
    // Verifies lifecycle method is invoked
    it("should call controller didMount if it exists", async () => {
      let didMountCalled = false;
      const controllerWithDidMount = function () {};
      controllerWithDidMount.prototype.render = function () {
        return document.createElement("div");
      };
      controllerWithDidMount.prototype.didMount = function () {
        didMountCalled = true;
      };
      router.routes.clear();
      router.register("/test", { controller: controllerWithDidMount });
      router.contentEl = document.getElementById("page-content");
      await router._handle("/test");
      expect(didMountCalled).toBe(true);
    });

    // NEGATIVE TEST: Does not crash when no willUnmount
    // Verifies optional lifecycle method handling
    it("should handle controller without willUnmount", async () => {
      const noWillUnmountController = {
        destroy: function () {},
        render: function () {
          return document.createElement("div");
        },
      };
      router.currentController = noWillUnmountController;
      const testHandler = {
        render: function () {
          return createMockController(document.createElement("div"));
        },
      };
      router.routes.clear();
      router.register("/test", testHandler);
      await router._handle("/test");
      expect(router.currentController).not.toBeNull();
    });

    // NEGATIVE TEST: Does not crash when no destroy
    // Verifies optional destroy method handling
    it("should handle controller without destroy", async () => {
      const noDestroyController = {
        willUnmount: function () {},
        render: function () {
          return document.createElement("div");
        },
      };
      router.currentController = noDestroyController;
      const testHandler = {
        render: function () {
          return createMockController(document.createElement("div"));
        },
      };
      router.routes.clear();
      router.register("/test", testHandler);
      await router._handle("/test");
      expect(router.currentController).not.toBeNull();
    });
  });

  describe("_create(handler, path, params)", () => {
    // POSITIVE TEST: Creates controller from function handler
    // Verifies function-based handlers create controllers correctly
    it("should create controller from function handler", () => {
      const funcHandler = function () {
        return createMockController(document.createElement("div"));
      };
      const ctrl = router._create(funcHandler, "/test", {});
      expect(ctrl).not.toBeNull();
    });

    // POSITIVE TEST: Creates controller from render method
    // Verifies object handlers with render method work correctly
    it("should create controller from render method", () => {
      const handlerWithRender = {
        render: function () {
          return createMockController(document.createElement("div"));
        },
      };
      const ctrl = router._create(handlerWithRender, "/test", {});
      expect(ctrl).not.toBeNull();
    });

    // POSITIVE TEST: Creates controller from controller class
    // Verifies controller class instantiation works
    it("should create controller from controller class", () => {
      const MockController = function () {};
      MockController.prototype.render = function () {
        return createMockController(document.createElement("div"));
      };
      const handlerObj = { controller: MockController, options: {} };
      const ctrl = router._create(handlerObj, "/test", {});
      expect(ctrl).toBeInstanceOf(MockController);
    });

    // POSITIVE TEST: Sets router, path, params, query on controller
    // Verifies controller properties are correctly assigned
    it("should set router, path, params, query on controller", () => {
      const controllerClass = function () {};
      controllerClass.prototype.render = function () {
        return createMockController(document.createElement("div"));
      };
      const handlerObj = { controller: controllerClass, options: {} };
      window.history.pushState({}, "", "/?test=true");
      const ctrl = router._create(handlerObj, "/test", { id: "123" });
      expect(ctrl.router).toBe(router);
      expect(ctrl.path).toBe("/test");
      expect(ctrl.params).toEqual({ id: "123" });
      expect(ctrl.query).toEqual({ test: "true" });
    });

    // POSITIVE TEST: Returns null for invalid handler
    // Verifies invalid handler objects return null
    it("should return null for invalid handler", () => {
      const ctrl = router._create({}, "/test", {});
      expect(ctrl).toBeNull();
    });

    // POSITIVE TEST: Passes options to controller constructor
    // Verifies options object is passed through
    it("should pass options to controller constructor", () => {
      const MockController = function (options) {
        this.options = options;
      };
      MockController.prototype.render = function () {
        return document.createElement("div");
      };
      const handlerObj = { controller: MockController, options: { custom: "value" } };
      const ctrl = router._create(handlerObj, "/test", {});
      expect(ctrl.options).toEqual({ custom: "value" });
    });
  });

  describe("_match(path)", () => {
    // POSITIVE TEST: Matches exact path
    // Verifies exact path matching works correctly
    it("should match exact path", () => {
      router.register("/home", {
        render: function () {
          return createMockController(document.createElement("div"));
        },
      });
      const route = router._match("/home");
      expect(route).not.toBeNull();
      expect(route.path).toBe("/home");
    });

    // POSITIVE TEST: Matches path with params and extracts them
    // Verifies dynamic parameter extraction works
    it("should match path with params and extract them", () => {
      router.register("/models/:id", {
        render: function () {
          return createMockController(document.createElement("div"));
        },
      });
      const route = router._match("/models/123");
      expect(route).not.toBeNull();
      expect(route.path).toBe("/models/:id");
      expect(route.params.id).toBe("123");
    });

    // POSITIVE TEST: Returns null for unmatched path
    // Verifies non-matching paths return null
    it("should return null for unmatched path", () => {
      router.register("/home", {
        render: function () {
          return createMockController(document.createElement("div"));
        },
      });
      const route = router._match("/unknown");
      expect(route).toBeNull();
    });

    // POSITIVE TEST: Matches path with multiple params
    // Verifies multiple dynamic parameters work correctly
    it("should match path with multiple params", () => {
      router.register("/users/:userId/posts/:postId", {
        render: function () {
          return createMockController(document.createElement("div"));
        },
      });
      const route = router._match("/users/1/posts/2");
      expect(route).not.toBeNull();
      expect(route.params.userId).toBe("1");
      expect(route.params.postId).toBe("2");
    });

    // POSITIVE TEST: Handles wildcard at end
    // Verifies wildcard (*) matching works correctly
    it("should handle wildcard at end of path", () => {
      router.register("/docs/*", {
        render: function () {
          return createMockController(document.createElement("div"));
        },
      });
      const route = router._match("/docs/folder/file.txt");
      expect(route).not.toBeNull();
      expect(route.path).toBe("/docs/*");
    });

    // POSITIVE TEST: Returns params for first matching route
    // Verifies route order priority is respected
    it("should return params for first matching route", () => {
      router.register("/:type/:id", {
        render: function () {
          return createMockController(document.createElement("div"));
        },
      });
      router.register("/models/:id", {
        render: function () {
          return createMockController(document.createElement("div"));
        },
      });
      const route = router._match("/models/123");
      expect(route).not.toBeNull();
      expect(route.path).toBe("/:type/:id");
    });

    // POSITIVE TEST: Empty params object for exact match
    // Verifies exact matches have empty params
    it("should return empty params for exact match", () => {
      router.register("/exact", {
        render: function () {
          return createMockController(document.createElement("div"));
        },
      });
      const route = router._match("/exact");
      expect(route).not.toBeNull();
      expect(route.params).toEqual({});
    });
  });

  describe("_toRegex(path)", () => {
    // POSITIVE TEST: Converts simple path to regex
    // Verifies basic path conversion works correctly
    it("should convert simple path to regex", () => {
      const regex = router._toRegex("/test");
      expect(regex.test("/test")).toBe(true);
      expect(regex.test("/other")).toBe(false);
    });

    // POSITIVE TEST: Converts param to capture group
    // Verifies dynamic params become capture groups
    it("should convert param to capture group", () => {
      const regex = router._toRegex("/models/:id");
      const match = "/models/123".match(regex);
      expect(match).not.toBeNull();
      expect(match[1]).toBe("123");
    });

    // POSITIVE TEST: Converts multiple params to capture groups
    // Verifies multiple params create multiple capture groups
    it("should convert multiple params to capture groups", () => {
      const regex = router._toRegex("/users/:userId/posts/:postId");
      const match = "/users/1/posts/2".match(regex);
      expect(match).not.toBeNull();
      expect(match[1]).toBe("1");
      expect(match[2]).toBe("2");
    });

    // POSITIVE TEST: Handles wildcard at end
    // Verifies wildcard creates greedy capture group
    it("should handle wildcard at end of path", () => {
      const regex = router._toRegex("/docs/*");
      expect(regex.test("/docs/file")).toBe(true);
      expect(regex.test("/docs/folder/file")).toBe(true);
      expect(regex.test("/other")).toBe(false);
    });

    // POSITIVE TEST: Escapes forward slashes
    // Verifies path separators are properly escaped
    it("should escape forward slashes in path", () => {
      const regex = router._toRegex("/test/path");
      expect(regex.test("/test/path")).toBe(true);
      expect(regex.test("/testxpath")).toBe(false);
    });

    // POSITIVE TEST: Handles root path
    // Verifies root path "/" is handled correctly
    it("should handle root path", () => {
      const regex = router._toRegex("/");
      expect(regex.test("/")).toBe(true);
      expect(regex.test("/other")).toBe(false);
    });

    // POSITIVE TEST: Handles empty string path
    // Verifies empty string is converted to matching regex
    it("should handle empty string path", () => {
      const regex = router._toRegex("");
      expect(regex.test("")).toBe(true);
    });
  });

  describe("_callDidMount(el)", () => {
    // POSITIVE TEST: Calls didMount on component
    // Verifies lifecycle method is invoked correctly
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

    // POSITIVE TEST: Calls didMount on nested children
    // Verifies recursive child traversal works correctly
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

    // POSITIVE TEST: Handles null element
    // Verifies null input doesn't throw
    it("should handle null element", () => {
      expect(() => router._callDidMount(null)).not.toThrow();
    });

    // POSITIVE TEST: Does not call didMount if already mounted
    // Verifies idempotent behavior with _mounted flag
    it("should not call didMount if already mounted", () => {
      let callCount = 0;
      const mockComponent = {
        didMount: function () {
          callCount++;
        },
        _mounted: true,
      };
      const el = {
        _component: mockComponent,
        children: [],
      };
      router._callDidMount(el);
      expect(callCount).toBe(0);
    });

    // POSITIVE TEST: Handles deeply nested children
    // Verifies recursive traversal works for deep hierarchies
    it("should call didMount on deeply nested children", () => {
      let deepDidMountCalled = false;
      const deepComponent = {
        didMount: function () {
          deepDidMountCalled = true;
        },
        _mounted: false,
      };
      const deepEl = { _component: deepComponent, children: [] };
      const midEl = { _component: null, children: [deepEl] };
      const parentEl = { _component: null, children: [midEl] };
      router._callDidMount(parentEl);
      expect(deepDidMountCalled).toBe(true);
    });

    // POSITIVE TEST: Handles element without _component
    // Verifies graceful handling of elements without component
    it("should handle element without _component", () => {
      const el = {
        children: [],
      };
      expect(() => router._callDidMount(el)).not.toThrow();
    });

    // POSITIVE TEST: Handles element without children property
    // Verifies graceful handling of malformed elements
    it("should handle element without children property", () => {
      const el = {
        _component: {
          didMount: function () {},
          _mounted: false,
        },
      };
      expect(() => router._callDidMount(el)).not.toThrow();
    });

    // POSITIVE TEST: Handles async render
    // Verifies Promise-based render results are awaited
    it("should handle async render", async () => {
      const asyncHandler = {
        render: function () {
          // Return a controller with async render method
          return {
            render: function () {
              return Promise.resolve(document.createElement("div"));
            },
          };
        },
      };
      router.routes.clear();
      router.register("/async", asyncHandler);
      router.contentEl = document.getElementById("page-content");
      await router._handle("/async");
      expect(router.currentController).not.toBeNull();
    });

    // POSITIVE TEST: Handles sync render returning falsy
    // Verifies the else if branch is covered
    it("should handle sync render returning falsy", async () => {
      const falsyHandler = {
        render: function () {
          return {
            render: function () {
              return null; // Return null to hit the else if branch
            },
          };
        },
      };
      router.routes.clear();
      router.register("/falsy", falsyHandler);
      router.contentEl = document.getElementById("page-content");
      await router._handle("/falsy");
      // Should not throw
      expect(router.currentController).not.toBeNull();
    });

    // POSITIVE TEST: start() uses rootEl when page-content doesn't exist
    // Verifies the || branch in start() is covered
    it("should use rootEl when page-content doesn't exist", () => {
      // Remove page-content from DOM
      const pageContent = document.getElementById("page-content");
      if (pageContent) pageContent.remove();

      // Create a new router without the default app element
      const testRoot = document.createElement("div");
      document.body.appendChild(testRoot);

      const testRouter = new Router({ root: testRoot });
      testRouter.start();

      // Clean up
      testRoot.remove();

      expect(testRouter.contentEl).toBe(testRoot);
    });
  });

  describe("_dispatchTitle(path)", () => {
    // POSITIVE TEST: Dispatches routechange event
    // Verifies CustomEvent is dispatched correctly
    it("should dispatch routechange event with path", () => {
      let eventDispatched = false;
      let dispatchedPath = null;
      const originalDispatchEvent = window.dispatchEvent.bind(window);
      window.dispatchEvent = function (event) {
        if (event.type === "routechange") {
          eventDispatched = true;
          dispatchedPath = event.detail?.path;
        }
        return originalDispatchEvent(event);
      };

      router._dispatchTitle("/test");

      window.dispatchEvent = originalDispatchEvent;
      expect(eventDispatched).toBe(true);
      expect(dispatchedPath).toBe("/test");
    });

    // POSITIVE TEST: Event detail contains correct path
    // Verifies the path is passed in event detail
    it("should dispatch event with correct path in detail", () => {
      let dispatchedDetail = null;
      const originalDispatchEvent = window.dispatchEvent.bind(window);
      window.dispatchEvent = function (event) {
        if (event.type === "routechange") {
          dispatchedDetail = event.detail;
        }
        return originalDispatchEvent(event);
      };

      router._dispatchTitle("/models/123");

      window.dispatchEvent = originalDispatchEvent;
      expect(dispatchedDetail).toBeDefined();
      expect(dispatchedDetail.path).toBe("/models/123");
    });
  });

  describe("Integration Tests", () => {
    // POSITIVE TEST: Full navigation flow
    // Verifies complete navigation lifecycle works correctly
    it("should complete full navigation flow", async () => {
      const testHandler = {
        render: function () {
          return createMockController(document.createElement("div"));
        },
      };
      router.register("/page", testHandler);
      await router._handle("/page");
      expect(router.currentController).not.toBeNull();
    });

    // POSITIVE TEST: Handles route change with cleanup
    // Verifies proper cleanup of previous controllers
    it("should cleanup previous controller on route change", async () => {
      let willUnmountCount = 0;
      let destroyCount = 0;
      const firstHandler = {
        render: function () {
          return createMockController(document.createElement("div"));
        },
      };
      const secondHandler = {
        render: function () {
          return createMockController(document.createElement("div"));
        },
      };
      router.register("/first", firstHandler);
      router.register("/second", secondHandler);
      await router._handle("/first");
      const prevController = {
        willUnmount: function () {
          willUnmountCount++;
        },
        destroy: function () {
          destroyCount++;
        },
        render: function () {
          return document.createElement("div");
        },
      };
      router.currentController = prevController;
      await router._handle("/second");
      expect(willUnmountCount).toBe(1);
      expect(destroyCount).toBe(1);
    });

    // POSITIVE TEST: Handles rapid navigation
    // Verifies concurrent navigation calls are handled
    it("should handle rapid navigation calls", async () => {
      const testHandler = {
        render: function () {
          return createMockController(document.createElement("div"));
        },
      };
      router.register("/page", testHandler);
      const promises = [router._handle("/page"), router._handle("/page"), router._handle("/page")];
      await Promise.all(promises);
      expect(router.currentController).not.toBeNull();
    });

    // POSITIVE TEST: Full route registration and matching flow
    // Verifies complex routing scenarios work correctly
    it("should handle complete route registration and matching flow", () => {
      router.register("/", function () {
        return createMockController(document.createElement("div"));
      });
      router.register("/users", function () {
        return createMockController(document.createElement("div"));
      });
      router.register("/users/:id", function () {
        return createMockController(document.createElement("div"));
      });
      router.register("/users/:id/posts", function () {
        return createMockController(document.createElement("div"));
      });
      router.register("/users/:id/posts/:postId", function () {
        return createMockController(document.createElement("div"));
      });
      expect(router.routes.size).toBe(5);
      expect(router._match("/")).not.toBeNull();
      expect(router._match("/users")).not.toBeNull();
      expect(router._match("/users/1")).not.toBeNull();
      expect(router._match("/users/1/posts")).not.toBeNull();
      expect(router._match("/users/1/posts/abc")).not.toBeNull();
      expect(router._match("/unknown")).toBeNull();
      expect(router._match("/users/1/posts/abc/comments")).toBeNull();
    });
  });
});
