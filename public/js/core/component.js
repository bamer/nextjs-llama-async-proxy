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
  }

  // Override in subclasses
  render() { throw new Error("render() must be implemented"); }

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
    console.log("[DEBUG] Component.setState called:", this.constructor.name, updates);
    this.state = { ...this.state, ...updates };
    if (this._el) {
      console.log("[DEBUG] Component.update called for:", this.constructor.name);
      this.update();
    } else {
      console.warn("[DEBUG] Component has no _el, cannot update:", this.constructor.name);
    }
    return this;
  }

  // Re-render
  update() {
    console.log("[DEBUG] Component.update START for:", this.constructor.name);
    const oldEl = this._el;
    console.log("[DEBUG] Old element tag:", oldEl?.tagName, "class:", oldEl?.className);
    const rendered = this.render();
    console.log("[DEBUG] Rendered type:", typeof rendered);

    if (typeof rendered === "string") {
      const div = document.createElement("div");
      div.innerHTML = rendered;
      const newEl = div.firstChild || div;
      console.log("[DEBUG] New element tag:", newEl?.tagName, "class:", newEl?.className);
      console.log("[DEBUG] Replacing element...");
      oldEl.replaceWith(newEl);
      this._el = newEl;
      console.log("[DEBUG] Element replaced successfully");
    } else if (rendered instanceof HTMLElement) {
      console.log("[DEBUG] Rendered is HTMLElement");
      oldEl.replaceWith(rendered);
      this._el = rendered;
    }
    if (this._el) {
      this._el._component = this;
      this.bindEvents();
      this.didUpdate && this.didUpdate();
    }
    console.log("[DEBUG] Component.update END for:", this.constructor.name);
  }

  // Get/Set state
  get initialState() { return {}; }

  // Event handling
  getEventMap() { return {}; }

  bindEvents() {
    const map = this.getEventMap();
    Object.entries(map).forEach(([spec, handler]) => {
      const [event, selector] = spec.split(" ");
      const fn = typeof handler === "string" ? this[handler].bind(this) : handler.bind(this);
      if (selector) {
        this._el.addEventListener(event, (e) => {
          const target = e.target.closest(selector);
          if (target) fn(e, target);
        });
      } else {
        this._el.addEventListener(event, fn);
      }
    });
  }

  // Cleanup
  destroy() {
    this.willDestroy && this.willDestroy();
    if (this._el && this._el.parentNode) {
      this._el.parentNode.removeChild(this._el);
    }
    this._el = null;
    this._mounted = false;
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

window.Component = Component;
