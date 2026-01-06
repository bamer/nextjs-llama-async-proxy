/**
 * Simple Component Base Class
 */

class Component {
  constructor(props = {}) {
    this.props = props;
    this.state = {};
    this._el = null;
    this._mounted = false;
    this._events = {};
    this._delegatedHandlers = {};
  }

  // Override in subclasses
  render() {
    throw new Error("render() must be implemented");
  }

  // Mount to DOM
  mount(parent) {
    if (typeof parent === "string") parent = document.querySelector(parent);
    if (!parent) throw new Error("Parent not found");

    this.willMount && this.willMount();

    const rendered = this.render();

    if (typeof rendered === "string") {
      const div = document.createElement("div");
      div.innerHTML = rendered;
      this._el = div.firstChild || div;
    } else if (rendered instanceof HTMLElement) {
      this._el = rendered;
    }

    if (this._el) {
      this._el._component = this;
      this.bindEvents();
      parent.appendChild(this._el);
      this._mounted = true;
      this.didMount && this.didMount();
    }
    return this;
  }

  // Update state and re-render
  setState(updates) {
    this.state = { ...this.state, ...updates };
    if (this._el) {
      this.update();
    }
    return this;
  }

  // Re-render - simple full replacement (native approach)
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

    if (this._el) {
      this._el._component = this;
      // Call willReceiveProps before bindEvents when updating
      this.willReceiveProps && this.willReceiveProps(this.props);
      this.bindEvents();
      this.didUpdate && this.didUpdate();
    }
  }

  // Get/Set state
  get initialState() {
    return {};
  }

  // Event handling
  getEventMap() {
    return {};
  }

  bindEvents() {
    if (!this._el) return;

    const map = this.getEventMap();
    if (Object.keys(map).length === 0) return;

    // Remove old delegated listeners before adding new ones
    if (this._delegatedHandlers) {
      Object.entries(this._delegatedHandlers).forEach(([key, handler]) => {
        const [event] = key.split("|");
        document.removeEventListener(event, handler, false);
      });
      this._delegatedHandlers = {};
    } else {
      this._delegatedHandlers = {};
    }

    // Use event delegation on document for stable event handling
    Object.entries(map).forEach(([spec, handler]) => {
      const [event, selector] = spec.split(" ");

      let fn;
      if (typeof handler === "string") {
        if (!this[handler]) return;
        fn = this[handler].bind(this);
      } else if (typeof handler === "function") {
        fn = handler.bind(this);
      } else {
        return;
      }

      // Create a unique key for this specific event+selector combination
      const delegationKey = `${event}|${selector || "none"}|${this.constructor.name}`;

      // Create delegated handler
      const delegatedHandler = (e) => {
        const target = selector ? e.target.closest(selector) : e.target;
        if (target && this._el && (this._el === target || this._el.contains(target))) {
          fn(e, target);
        }
      };

      // Store for cleanup
      this._delegatedHandlers[delegationKey] = delegatedHandler;

      // Attach to document
      document.addEventListener(event, delegatedHandler, false);
    });
  }

  // Cleanup
  destroy() {
    this.willDestroy && this.willDestroy();

    // Remove delegated event listeners from document
    if (this._delegatedHandlers) {
      Object.entries(this._delegatedHandlers).forEach(([key, handler]) => {
        const [event] = key.split("|");
        document.removeEventListener(event, handler, false);
      });
      this._delegatedHandlers = null;
    }

    if (this._el && this._el.parentNode) {
      this._el.parentNode.removeChild(this._el);
    }
    this._el = null;
    this._mounted = false;
    this._events = {};
    this.didDestroy && this.didDestroy();
  }

  // Element creator (h)
  static h(tag, attrs = {}, ...children) {
    // Handle Component classes
    if (typeof tag === "function" && tag.prototype instanceof Component) {
      const comp = new tag(attrs);
      const el = comp.render();
      if (el instanceof HTMLElement) {
        el._component = comp;
        comp._el = el;
        // Call bindEvents on the child component to attach event listeners
        comp.bindEvents();
        children.forEach((c) => {
          if (typeof c === "string") {
            el.appendChild(document.createTextNode(c));
          } else if (c instanceof HTMLElement) {
            el.appendChild(c);
          } else if (c instanceof Component) {
            const cel = c.render();
            if (cel instanceof HTMLElement) {
              el.appendChild(cel);
              c._el = cel;
              c.bindEvents();
            }
          }
        });
      }
      return el;
    }

    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "className") {
        el.className = v;
      } else if (k === "style" && typeof v === "object") {
        Object.assign(el.style, v);
      } else if (k.startsWith("on") && typeof v === "function") {
        el.addEventListener(k.slice(2).toLowerCase(), v);
      } else if (k === "dataset") {
        Object.entries(v).forEach(([dk, dv]) => {
          el.dataset[dk] = dv;
        });
      } else if (typeof v === "boolean") {
        // Boolean attributes (disabled, checked, etc.) - only set when true
        if (v) {
          el.setAttribute(k, "");
        }
      } else if (v !== null && v !== undefined) {
        el.setAttribute(k, v);
      }
    });
    children.forEach((c) => {
      if (typeof c === "string" || typeof c === "number") {
        el.appendChild(document.createTextNode(String(c)));
      } else if (c instanceof HTMLElement) {
        el.appendChild(c);
      } else if (c instanceof Component) {
        const cel = c.render();
        if (cel instanceof HTMLElement) {
          el.appendChild(cel);
          c._el = cel;
          c.bindEvents();
        }
      }
    });
    return el;
  }
}

window.Component = Component;
