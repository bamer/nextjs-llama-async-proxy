/**
 * Component Base Class Tests
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
  el.setAttribute = createMockFn();
  el.getAttribute = createMockFn();
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

describe("Component", function () {
  beforeEach(function () {
    mockAddEventListener.mock.calls = [];
    mockRemoveEventListener.mock.calls = [];
  });

  describe("constructor", function () {
    it("should initialize with empty props", function () {
      const c = new Component();
      expect(c.props).toEqual({});
      expect(c.state).toEqual({});
      expect(c._el).toBeNull();
      expect(c._mounted).toBe(false);
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
          return Component.h("div", {}, "X");
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
      expect(c._mounted).toBe(true);
    });
    it("should throw when parent is null", function () {
      const c = new Component();
      expect(function () {
        c.mount(null);
      }).toThrow("Parent not found");
    });
    it("should call willMount lifecycle method", function () {
      let called = false;
      class L extends Component {
        willMount() {
          called = true;
        }
        render() {
          return Component.h("div", {}, "X");
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

  describe("setState", function () {
    it("should update state with values", function () {
      class T extends Component {
        render() {
          return Component.h("div", {}, "X");
        }
      }
      const c = new T();
      c.setState({ count: 1 });
      expect(c.state.count).toBe(1);
    });
    it("should return this for chaining", function () {
      class T extends Component {
        render() {
          return Component.h("div", {}, "X");
        }
      }
      const c = new T();
      expect(c.setState({ v: 1 })).toBe(c);
    });
  });

  describe("update", function () {
    it("should re-render component", function () {
      class T extends Component {
        render() {
          return Component.h("div", { className: "u" }, "U");
        }
      }
      const p = { appendChild: createMockFn(), children: [] };
      const c = new T();
      c.mount(p);
      const old = c._el;
      c.update();
      expect(c._el).not.toBe(old);
    });
  });

  describe("getEventMap", function () {
    it("should return empty object by default", function () {
      expect(new Component().getEventMap()).toEqual({});
    });
  });

  describe("destroy", function () {
    it("should set _el to null", function () {
      class T extends Component {
        render() {
          return Component.h("div", {}, "X");
        }
      }
      const c = new T();
      c._el = createMockElement("div");
      c._mounted = true;
      c.destroy();
      expect(c._el).toBeNull();
    });
    it("should set _mounted to false", function () {
      class T extends Component {
        render() {
          return Component.h("div", {}, "X");
        }
      }
      const c = new T();
      c._mounted = true;
      c.destroy();
      expect(c._mounted).toBe(false);
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
    it("should handle mount when render returns null", function () {
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
      c.mount(p);
      expect(c._el).toBeNull();
    });
  });
});
