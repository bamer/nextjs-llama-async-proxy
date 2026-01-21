/**
 * Component Base Class Tests - Event-Driven DOM Updates
 * @jest-environment jsdom
 */

global.window = global.window || {};

const componentPath = new URL("../../../public/js/core/component.js", import.meta.url);
await import(componentPath.href);

const Component = global.window.Component;

import { describe, it, expect, beforeEach } from "@jest/globals";

function createMockFn() {
  const fn = function (...args) {
    fn.mock.calls.push(args);
    if (fn._mockReturnValue !== undefined) return fn._mockReturnValue;
    if (fn._mockImplementation) return fn._mockImplementation(...args);
  };
  fn.mock = { calls: [] };
  fn._mockReturnValue = undefined;
  fn._mockImplementation = undefined;
  fn.mockReturnValue = function (v) {
    fn._mockReturnValue = v;
    return fn;
  };
  fn.mockImplementation = function (i) {
    fn._mockImplementation = i;
    return fn;
  };
  return fn;
}

function createMockElement(tag) {
  let _parentNode = null;
  const classList = new Set(); // Mock classList
  const attributes = new Map(); // Mock attributes

  const el = {
    tagName: tag.toUpperCase(),
    className: "",
    style: {},
    dataset: {},
    innerHTML: "",
    firstChild: null,
    children: [],
    nodeValue: null,
    _component: null,
    get parentNode() {
      return _parentNode;
    },
    set parentNode(v) {
      _parentNode = v;
    },
    // Mock classList API
    classList: {
      add: createMockFn().mockImplementation((cls) => classList.add(cls)),
      remove: createMockFn().mockImplementation((cls) => classList.delete(cls)),
      contains: createMockFn().mockImplementation((cls) => classList.has(cls)),
    },
    // Mock attribute API
    setAttribute: createMockFn().mockImplementation((name, value) => attributes.set(name, value)),
    getAttribute: createMockFn().mockImplementation((name) => attributes.get(name)),
    removeAttribute: createMockFn().mockImplementation((name) => attributes.delete(name)),
    hasAttribute: createMockFn().mockImplementation((name) => attributes.has(name)),
    // Mock querySelector for internal querying
    querySelector: createMockFn().mockImplementation((selector) => {
      // A very basic mock querySelector: checks direct children by class name or tag name
      // Not a full CSS selector engine, but enough for basic component.$() functionality
      if (selector.startsWith(".")) {
        const cls = selector.substring(1);
        return el.children.find(c => c.classList?.contains(cls)) || null;
      } else if (selector === tag.toLowerCase()) {
        return el; // Return self if selector matches own tag (e.g. div.$('div'))
      }
      return null; // For other selectors, return null for now
    }),
  };
  el.appendChild = createMockFn();
  el.appendChild.mockImplementation(function (c) {
    el.children.push(c);
    c.parentNode = el;
    return c;
  });
  el.removeChild = createMockFn();
  el.removeChild.mockImplementation(function (c) {
    const i = el.children.indexOf(c);
    if (i > -1) el.children.splice(i, 1);
    c.parentNode = null;
    return c;
  });
  el.replaceWith = createMockFn();
  el.replaceWith.mockImplementation(function (ne) {
    if (el.parentNode && el.parentNode.children) {
      const i = el.parentNode.children.indexOf(el);
      if (i > -1) el.parentNode.children[i] = ne;
    }
    if (ne) ne.parentNode = el.parentNode;
    el.parentNode = null;
  });
  el.addEventListener = createMockFn();
  el.contains = createMockFn().mockReturnValue(true);
  el.closest = createMockFn().mockImplementation(function () {
    return this;
  });
  el.firstChild = null;
  return el;
}

const mockAddEventListener = createMockFn();
const mockRemoveEventListener = createMockFn();

global.document = {
  querySelector: () => null,
  createElement: (tag) => createMockElement(tag),
  addEventListener: mockAddEventListener,
  removeEventListener: mockRemoveEventListener,
};

describe("Component - Event-Driven DOM Updates", function () {
  beforeEach(function () {
    mockAddEventListener.mock.calls = [];
    mockRemoveEventListener.mock.calls = [];
  });

  describe("constructor", function () {
    it("should initialize with empty props", function () {
      const c = new Component();
      expect(c.props).toEqual({});
      expect(c._el).toBeNull();
    });
    it("should initialize with provided props", function () {
      const c = new Component({ id: "test" });
      expect(c.props.id).toBe("test");
    });
  });

  describe("render", function () {
    it("should throw on base Component", function () {
      const c = new Component();
      expect(function () {
        c.render();
      }).toThrow("render() must be implemented");
    });
  });

  describe("mount", function () {
    it("should mount with HTMLElement parent", function () {
      class T extends Component {
        render() {
          return "<div>X</div>";
        }
      }
      const p = {
        appendChild: createMockFn(),
        children: [],
        get parentNode() {
          return null;
        },
      };
      const c = new T();
      c.mount(p);
      expect(p.appendChild.mock.calls.length).toBeGreaterThanOrEqual(1);
      expect(c._el).not.toBeNull();
    });
    it("should throw error when parent is null", function () {
      const c = new Component();
      expect(function () {
        c.mount(null);
      }).toThrow("[Component] Parent not found"); // Expect the error message from component-base.js
    });
    it("should call onMount lifecycle method", function () {
      let called = false;
      class L extends Component {
        onMount() {
          called = true;
        }
        render() {
          return "<div>X</div>";
        }
      }
      const p = {
        appendChild: createMockFn(),
        children: [],
        get parentNode() {
          return null;
        },
      };
      const c = new L();
      c.mount(p);
      expect(called).toBe(true);
    });
  });

  describe("bindEvents", function () {
    it("should be callable", function () {
      class T extends Component {
        bindEvents() {}
        render() {
          return "<div>X</div>";
        }
      }
      const c = new T();
      expect(typeof c.bindEvents).toBe("function");
    });
  });

  describe("destroy", function () {
    it("should clear _component reference", function () {
      class T extends Component {
        render() {
          return "<div>X</div>";
        }
      }
      const c = new T();
      const el = createMockElement("div");
      el.remove = createMockFn();
      c._el = el;
      c.destroy();
      expect(c._el).toBeNull();
    });
  });

  describe("DOM helpers", function () {
    it("$ should query element", function () {
      class T extends Component {
        render() {
          return "<div><span class=\"test\">X</span></div>";
        }
      }
      const c = new T();
      c.mount({ appendChild: createMockFn(), children: [] });
      expect(c.$(".test")).not.toBeNull();
    });

    it("setText should update text content", function () {
      class T extends Component {
        render() {
          return "<div><span class=\"label\">X</span></div>";
        }
      }
      const c = new T();
      c.mount({ appendChild: createMockFn(), children: [] });
      c.setText(".label", "New Text");
      expect(c.$(".label").textContent).toBe("New Text");
    });

    it("setHTML should update innerHTML", function () {
      class T extends Component {
        render() {
          return "<div><div class=\"content\">X</div></div>";
        }
      }
      const c = new T();
      c.mount({ appendChild: createMockFn(), children: [] });
      c.setHTML(".content", "<span>Y</span>");
      expect(c.$(".content").innerHTML).toBe("<span>Y</span>");
    });

    it("toggleClass should add/remove class", function () {
      class T extends Component {
        render() {
          return "<div><span class=\"box\">X</span></div>";
        }
      }
      const c = new T();
      c.mount({ appendChild: createMockFn(), children: [] });
      c.toggleClass(".box", "active", true);
      expect(c.$(".box").classList.contains("active")).toBe(true);
      c.toggleClass(".box", "active", false);
      expect(c.$(".box").classList.contains("active")).toBe(false);
    });

    it("show/hide should toggle hidden class", function () {
      class T extends Component {
        render() {
          return "<div><span class=\"item\">X</span></div>";
        }
      }
      const c = new T();
      c.mount({ appendChild: createMockFn(), children: [] });
      c.hide(".item");
      expect(c.$(".item").classList.contains("hidden")).toBe(true);
      c.show(".item");
      expect(c.$(".item").classList.contains("hidden")).toBe(false);
    });
  });

  describe("on - event delegation", function () {
    it("should add event listener", function () {
      class T extends Component {
        render() {
          return "<div><button data-action=\"test\">X</button></div>";
        }
      }
      const c = new T();
      const appendFn = createMockFn();
      c.mount({ appendChild: appendFn, children: [] });
      const mountedEl = appendFn.mock.calls[0][0];
      const addEventListenerFn = createMockFn();
      mountedEl.addEventListener = addEventListenerFn;
      c.on("click", "[data-action=test]", function () {});
      expect(addEventListenerFn.mock.calls.length).toBe(1);
    });
  });

  describe("Component.h", function () {
    it("should create element with basic tag", function () {
      expect(Component.h("div").tagName).toBe("DIV");
    });
    it("should set className", function () {
      expect(Component.h("div", { className: "c" }).className).toBe("c");
    });
    it("should handle Component classes", function () {
      class M extends Component {
        render() {
          return Component.h("section", { className: "s" }, "X");
        }
      }
      const e = Component.h(M, { id: "t" });
      expect(e.tagName).toBe("SECTION");
    });
  });

  describe("Edge cases", function () {
    it("should throw error when render returns null", function () {
      class F extends Component {
        render() {
          return null;
        }
      }
      const p = {
        appendChild: createMockFn(),
        children: [],
        get parentNode() {
          return null;
        },
      };
      const c = new F();
      expect(() => c.mount(p)).toThrow("[Component] render() must return an HTML string or a DOM Node, received: object undefined");
    });
  });
});
