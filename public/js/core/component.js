/**
 * Simple Event-Driven Component Base Class
 * No setState, no lifecycle complexity - just direct DOM updates
 */

class Component {
  constructor(props = {}) {
    this.props = props;
    this._el = null;
    this._handlers = new Map();
    console.log(`[${this.constructor.name}] Created`);
  }

  /**
   * Must return an HTMLElement or HTML string
   */
  render() {
    throw new Error("render() must be implemented");
  }

  /**
   * Mount to DOM and bind events
   */
  mount(selectorOrParent) {
    const parent =
      typeof selectorOrParent === "string"
        ? document.querySelector(selectorOrParent)
        : selectorOrParent;

    if (!parent) {
      console.error(`[${this.constructor.name}] Parent not found`);
      return this;
    }

    let el = this.render();

    // Handle string HTML
    if (typeof el === "string") {
      const div = document.createElement("div");
      div.innerHTML = el;
      el = div.firstChild;
    }

    if (el instanceof HTMLElement) {
      this._el = el;
      el._component = this;
      parent.appendChild(el);
      this.bindEvents();
      this.onMount?.();
    }

    return this;
  }

  /**
   * Bind event handlers - override in subclasses
   */
  bindEvents() {}

  /**
   * Called after mounting - override in subclasses
   */
  onMount() {}

  /**
   * Clean up - override in subclasses for cleanup logic
   */
  destroy() {
    this._handlers.forEach((handler, element) => {
      const [event] =
        element._eventKeys?.find((k) => handler === element._eventKeys[k])?.split(" ") || [];
      if (event && element.removeEventListener) {
        element.removeEventListener(event, handler);
      }
    });
    this._handlers.clear();
    this._el?._component === this && (this._el._component = null);
    this._el?.remove();
    this._el = null;
    console.log(`[${this.constructor.name}] Destroyed`);
  }

  // ===== Event Helper Methods =====

  /**
   * Bind event to element (supports delegation)
   * @param {string} event - Event type (e.g., "click")
   * @param {string} selector - CSS selector for delegation (optional)
   * @param {Function} handler - Event handler
   */
  on(event, selector, handler) {
    if (!this._el) return;

    const fn =
      typeof selector === "function"
        ? selector.bind(this)
        : (e) => {
          const target = e.target.closest(selector);
          if (target && this._el.contains(target)) {
            handler.call(this, e, target);
          }
        };

    this._el.addEventListener(event, fn, false);
    this._handlers.set(`${event}|${selector || "root"}`, fn);
    return this;
  }

  /**
   * Bind one-time event
   */
  once(event, selector, handler) {
    if (!this._el) return;

    const fn =
      typeof selector === "function"
        ? selector.bind(this)
        : (e) => {
          const target = e.target.closest(selector);
          if (target) {
            handler.call(this, e, target);
            this._el?.removeEventListener(event, fn);
          }
        };

    this._el.addEventListener(event, fn, false);
    return this;
  }

  /**
   * Unbind event
   */
  off(event, selector) {
    const key = `${event}|${selector || "root"}`;
    const handler = this._handlers.get(key);
    if (handler && this._el) {
      this._el.removeEventListener(event, handler);
      this._handlers.delete(key);
    }
    return this;
  }

  // ===== DOM Helper Methods =====

  /**
   * Query single element within component
   */
  $(selector) {
    return this._el?.querySelector?.(selector) ?? null;
  }

  /**
   * Query all elements within component
   */
  $$(selector) {
    return this._el ? Array.from(this._el.querySelectorAll(selector)) : [];
  }

  /**
   * Update single element content
   */
  setText(selector, text) {
    const el = this.$(selector);
    if (el) el.textContent = text;
    return this;
  }

  /**
   * Update single element HTML
   */
  setHTML(selector, html) {
    const el = this.$(selector);
    if (el) el.innerHTML = html;
    return this;
  }

  /**
   * Update element attribute
   */
  setAttr(selector, attr, value) {
    const el = this.$(selector);
    if (el) {
      if (value === null || value === undefined) {
        el.removeAttribute(attr);
      } else {
        el.setAttribute(attr, value);
      }
    }
    return this;
  }

  /**
   * Add/remove CSS class
   */
  toggleClass(selector, className, add) {
    const el = this.$(selector);
    if (el) {
      if (add) el.classList.add(className);
      else el.classList.remove(className);
    }
    return this;
  }

  /**
   * Show element
   */
  show(selector) {
    return this.toggleClass(selector, "hidden", false);
  }

  /**
   * Hide element
   */
  hide(selector) {
    return this.toggleClass(selector, "hidden", true);
  }

  /**
   * Replace entire element content
   */
  replaceWith(htmlOrElement) {
    if (!this._el) return this;

    let newEl;
    if (typeof htmlOrElement === "string") {
      const div = document.createElement("div");
      div.innerHTML = htmlOrElement;
      newEl = div.firstChild;
    } else if (htmlOrElement instanceof HTMLElement) {
      newEl = htmlOrElement;
    }

    if (newEl) {
      this._el.replaceWith(newEl);
      this._el = newEl;
      newEl._component = this;
      this.bindEvents();
    }
    return this;
  }

  // ===== Static Factory Method =====

  /**
   * Create DOM element (like React.createElement)
   * Handles both string tag names and Component classes
   */
  static h(tag, attrs = {}, ...children) {
    // Handle Component classes
    if (typeof tag === "function" && tag.prototype instanceof Component) {
      const instance = new tag(attrs);
      instance.props = attrs;
      const el = instance.render();
      if (el instanceof HTMLElement) {
        el._component = instance;
        instance._el = el;
        instance.bindEvents();
        if (instance.onMount) instance.onMount();
      }
      return el;
    }

    const el = document.createElement(tag);

    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (k === "className") el.className = v;
      else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
      else if (k === "dataset") {
        Object.entries(v).forEach(([dk, dv]) => (el.dataset[dk] = dv));
      } else if (k === "ref" && typeof v === "function") v(el);
      else if (k.startsWith("on") && typeof v === "function") {
        el.addEventListener(k.slice(2).toLowerCase(), v);
      } else if (typeof v === "boolean") {
        if (v) el.setAttribute(k, "");
      } else if (v !== null && v !== undefined) {
        el.setAttribute(k, v);
      }
    });

    children.forEach((c) => {
      if (c === null || c === undefined || c === false) return;
      if (typeof c === "string" || typeof c === "number") {
        el.appendChild(document.createTextNode(String(c)));
      } else if (c instanceof HTMLElement) {
        el.appendChild(c);
      } else if (Array.isArray(c)) {
        c.forEach((item) => {
          if (item instanceof HTMLElement) el.appendChild(item);
          else if (typeof item === "string") el.appendChild(document.createTextNode(item));
        });
      }
    });

    return el;
  }
}

window.Component = Component;
