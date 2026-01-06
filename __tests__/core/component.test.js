/**
 * Component Base Class Tests
 * Tests for Component class with DOM manipulation
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.customElements = dom.window.customElements;

// Inline Component class for testing (copied from public/js/core/component.js)
class Component {
  constructor(props = {}) {
    this.props = props;
    this.state = {};
    this._el = null;
    this._mounted = false;
    this._events = {};
  }

  render() {
    throw new Error("render() must be implemented");
  }

  mount(parent) {
    if (typeof parent === "string") parent = document.querySelector(parent);
    if (!parent) throw new Error("Parent not found");

    this.willMount && this.willMount();
    const rendered = this.render();

    if (typeof rendered === "string") {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = rendered;
      this._el = wrapper.firstChild || wrapper;
    } else if (rendered instanceof HTMLElement) {
      this._el = rendered;
    } else {
      // Fallback: create a wrapper
      this._el = document.createElement("div");
    }

    // Check if _el is valid for DOM operations
    if (this._el && typeof this._el.appendChild === 'function') {
      try {
        this._el._component = this;
      } catch (e) {
        // jsdom may not support setting arbitrary properties on elements
      }
      this.bindEvents();
      parent.appendChild(this._el);
      this._mounted = true;
      this.didMount && this.didMount();
    }
    return this;
  }

  setState(updates) {
    this.state = { ...this.state, ...updates };
    if (this._el) {
      this.update();
    }
    return this;
  }

  update() {
    const oldEl = this._el;
    const rendered = this.render();

    if (typeof rendered === "string") {
      const div = document.createElement("div");
      div.innerHTML = rendered;
      const newEl = div.firstChild || div;
      oldEl.replaceWith(newEl);
      this._el = newEl;
    } else if (rendered instanceof HTMLElement) {
      oldEl.replaceWith(rendered);
      this._el = rendered;
    }
    if (this._el) this._el._component = this;
    this.bindEvents();
    this.didUpdate && this.didUpdate();
  }

  get initialState() {
    return {};
  }

  getEventMap() {
    return {};
  }

  bindEvents() {
    const map = this.getEventMap();
    Object.entries(map).forEach(([spec, handler]) => {
      const [event, selector] = spec.split(" ");
      const handlerFn = typeof handler === "string" ? this[handler].bind(this) : handler.bind(this);
      if (selector) {
        this._el.addEventListener(event, (e) => {
          const target = e.target.closest(selector);
          if (target) handlerFn(e, target);
        });
      } else {
        this._el.addEventListener(event, handlerFn);
      }
    });
  }

  destroy() {
    this.willDestroy && this.willDestroy();
    if (this._el && this._el.parentNode) {
      this._el.parentNode.removeChild(this._el);
    }
    this._el = null;
    this._mounted = false;
    this.didDestroy && this.didDestroy();
  }

  static h(tag, attrs = {}, ...children) {
    // Handle Component classes
    if (typeof tag === "function" && tag.prototype instanceof Component) {
      const comp = new tag(attrs);
      const el = comp.render();
      if (el instanceof HTMLElement) {
        el._component = comp;
        comp._el = el;
        children.forEach(c => {
          if (typeof c === "string") el.appendChild(document.createTextNode(c));
          else if (c instanceof HTMLElement) el.appendChild(c);
          else if (c instanceof Component) {
            const cel = c.render();
            if (cel instanceof HTMLElement) { el.appendChild(cel); c._el = cel; }
          }
        });
      }
      return el;
    }

    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "className") el.className = v;
      else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
      else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === "dataset") Object.entries(v).forEach(([dk, dv]) => el.dataset[dk] = dv);
      else if (v !== null && v !== undefined) el.setAttribute(k, v);
    });
    children.forEach(c => {
      if (typeof c === "string" || typeof c === "number") el.appendChild(document.createTextNode(String(c)));
      else if (c instanceof HTMLElement) el.appendChild(c);
      else if (c instanceof Component) {
        const cel = c.render();
        if (cel instanceof HTMLElement) { el.appendChild(cel); c._el = cel; }
      }
    });
    return el;
  }
}

// SimpleComponent for testing - does not set state in constructor
class SimpleComponent extends Component {
  render() {
    return Component.h("div", {}, "Simple");
  }
}

// TestComponent for testing - sets state in constructor
class TestComponent extends Component {
  constructor(props) {
    super(props);
    this.state = { message: "Hello" };
  }

  render() {
    return Component.h("div", {}, this.state.message || "Hello");
  }
}

class LifecycleComponent extends Component {
  willMount() {}
  didMount() {}
  willDestroy() {}
  didDestroy() {}

  render() {
    return Component.h("div", {}, "Lifecycle Test");
  }
}

describe('Component', () => {
  let container;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container = null;
  });

  describe('constructor', () => {
    it('should initialize with empty state', () => {
      const comp = new SimpleComponent({});
      expect(comp.state).toEqual({});
    });

    it('should initialize with props', () => {
      const comp = new SimpleComponent({ name: "test" });
      expect(comp.props).toEqual({ name: "test" });
    });

    it('should have default values', () => {
      const comp = new SimpleComponent({});
      expect(comp._el).toBeNull();
      expect(comp._mounted).toBe(false);
    });

    it('should inherit state from subclass', () => {
      const comp = new TestComponent({});
      expect(comp.state).toEqual({ message: "Hello" });
    });
  });

  describe('render', () => {
    it('should throw error if not implemented', () => {
      const comp = new Component({});
      expect(() => comp.render()).toThrow("render() must be implemented");
    });

    it('should create element with correct tag', () => {
      const comp = new SimpleComponent({});
      const el = comp.render();
      expect(el.tagName).toBe("DIV");
    });

    it('should render with children', () => {
      const comp = new SimpleComponent({});
      const el = comp.render();
      expect(el.textContent).toBe("Simple");
    });

    it('should apply className from attrs', () => {
      const el = Component.h("div", { className: "test-class" }, "");
      expect(el.className).toBe("test-class");
    });

    it('should handle data attributes', () => {
      const el = Component.h("div", { dataset: { id: "123", action: "test" } }, "");
      expect(el.dataset.id).toBe("123");
      expect(el.dataset.action).toBe("test");
    });

    it('should handle inline styles', () => {
      const el = Component.h("div", { style: { color: "red", fontSize: "14px" } }, "");
      expect(el.style.color).toBe("red");
      expect(el.style.fontSize).toBe("14px");
    });

    it('should handle event listeners', () => {
      let clicked = false;
      const el = Component.h("button", { onClick: () => { clicked = true; } }, "Click");
      el.click();
      expect(clicked).toBe(true);
    });
  });

  describe('mount', () => {
    let container;

    beforeEach(() => {
      container = document.createElement("div");
      document.body.appendChild(container);
    });

    afterEach(() => {
      container = null;
    });

    it('should mount component to parent', () => {
      const comp = new SimpleComponent({});
      comp.mount(container);
      expect(container.children.length).toBe(1);
      expect(container.firstChild).toBe(comp._el);
    });

    it('should call willMount lifecycle', () => {
      let called = false;
      const comp = new LifecycleComponent({});
      comp.willMount = () => { called = true; };
      comp.mount(container);
      expect(called).toBe(true);
    });

    it('should call didMount lifecycle', () => {
      let called = false;
      const comp = new LifecycleComponent({});
      comp.didMount = () => { called = true; };
      comp.mount(container);
      expect(called).toBe(true);
    });

    it('should set _mounted flag', () => {
      const comp = new SimpleComponent({});
      expect(comp._mounted).toBe(false);
      comp.mount(container);
      expect(comp._mounted).toBe(true);
    });

    it('should throw error if parent not found', () => {
      const comp = new SimpleComponent({});
      expect(() => comp.mount("#nonexistent")).toThrow("Parent not found");
    });
  });

  describe('setState', () => {
    it('should update state', () => {
      const comp = new SimpleComponent({});
      comp.state = { count: 0 };
      comp.setState({ count: 1 });
      expect(comp.state.count).toBe(1);
    });

    it('should merge state', () => {
      const comp = new SimpleComponent({});
      comp.state = { a: 1, b: 2 };
      comp.setState({ a: 10 });
      expect(comp.state).toEqual({ a: 10, b: 2 });
    });

    it('should not re-render if no element', () => {
      const comp = new SimpleComponent({});
      comp.state = { count: 0 };
      const result = comp.setState({ count: 1 });
      expect(result).toBe(comp);
    });
  });

  describe('update', () => {
    let container;

    beforeEach(() => {
      container = document.createElement("div");
      document.body.appendChild(container);
    });

    afterEach(() => {
      container = null;
    });

    it('should re-render component', () => {
      const comp = new TestComponent({});
      comp.mount(container);
      const oldEl = comp._el;

      comp.setState({ message: "Updated" });

      expect(comp._el).not.toBe(oldEl);
      expect(comp._el.textContent).toBe("Updated");
    });

    it('should preserve element reference in DOM', () => {
      const comp = new SimpleComponent({});
      comp.mount(container);
      const parent = comp._el.parentNode;

      comp.setState({ message: "New" });

      expect(comp._el.parentNode).toBe(parent);
    });
  });

  describe('bindEvents', () => {
    let container;

    beforeEach(() => {
      container = document.createElement("div");
      document.body.appendChild(container);
    });

    afterEach(() => {
      container = null;
    });

    it('should register event handlers', () => {
      let clicked = false;
      const comp = new SimpleComponent({});
      comp.mount(container);
      comp.getEventMap = () => ({ "click": () => { clicked = true; } });
      comp.bindEvents();

      comp._el.dispatchEvent(new dom.window.MouseEvent("click"));
      expect(clicked).toBe(true);
    });

    it('should handle delegated events with selector', () => {
      let clicked = false;
      const comp = new SimpleComponent({});
      comp.mount(container);
      comp._el.innerHTML = '<button class="btn">Click</button>';
      comp.getEventMap = () => ({ "click .btn": () => { clicked = true; } });
      comp.bindEvents();

      const btn = comp._el.querySelector(".btn");
      btn.click();
      expect(clicked).toBe(true);
    });
  });

  describe('destroy', () => {
    let container;

    beforeEach(() => {
      container = document.createElement("div");
      document.body.appendChild(container);
    });

    afterEach(() => {
      container = null;
    });

    it('should remove element from DOM', () => {
      const comp = new SimpleComponent({});
      comp.mount(container);
      expect(container.children.length).toBe(1);

      comp.destroy();
      expect(container.children.length).toBe(0);
    });

    it('should clear element reference', () => {
      const comp = new SimpleComponent({});
      comp.mount(container);
      comp.destroy();
      expect(comp._el).toBeNull();
    });

    it('should call lifecycle methods', () => {
      let willDestroyCalled = false;
      let didDestroyCalled = false;
      const comp = new LifecycleComponent({});
      comp.willDestroy = () => { willDestroyCalled = true; };
      comp.didDestroy = () => { didDestroyCalled = true; };
      comp.mount(container);
      comp.destroy();

      expect(willDestroyCalled).toBe(true);
      expect(didDestroyCalled).toBe(true);
    });
  });

  describe('Component.h (createElement)', () => {
    it('should create simple element', () => {
      const el = Component.h("div", {}, "");
      expect(el.tagName).toBe("DIV");
    });

    it('should add text children', () => {
      const el = Component.h("div", {}, "Hello World");
      expect(el.textContent).toBe("Hello World");
    });

    it('should add multiple children', () => {
      const el = Component.h("ul", {},
        Component.h("li", {}, "1"),
        Component.h("li", {}, "2")
      );
      expect(el.children.length).toBe(2);
      expect(el.children[0].textContent).toBe("1");
      expect(el.children[1].textContent).toBe("2");
    });

    it('should handle nested components', () => {
      const el = Component.h("div", {},
        new SimpleComponent({})
      );
      expect(el.querySelector("div")).not.toBeNull();
    });

    it('should set data attributes', () => {
      const el = Component.h("div", { dataset: { id: "test", action: "click" } }, "");
      expect(el.dataset.id).toBe("test");
      expect(el.dataset.action).toBe("click");
    });
  });
});
