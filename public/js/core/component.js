/**
 * Event-Driven Component - Pure DOM Updates with Senior-Level Memory Management
 * Components render once with template strings, then use direct DOM updates
 */

class Component {
  constructor(props = {}) {
    this.props = props;
    this._el = null;
    this._eventListeners = []; // Track all event listeners for proper cleanup
    console.log(`[${this.constructor.name}] Created`);
  }

  render() {
    throw new Error("render() must be implemented");
  }

  mount(selectorOrParent) {
    const parent =
      typeof selectorOrParent === "string"
        ? document.querySelector(selectorOrParent)
        : selectorOrParent;

    if (!parent) {
      console.error(`[${this.constructor.name}] Parent not found`);
      return this;
    }

    const html = this.render();
    const el = this._htmlToElement(html);

    if (el) {
      this._el = el;
      el._component = this;
      parent.appendChild(el);
      this.bindEvents();
      this.onMount?.();
    }

    return this;
  }

  /**
   * Called before component updates
   * @returns {boolean} True if component should update
   */
  shouldUpdate() {
    return true;
  }

  bindEvents() {
    // Base implementation - can be overridden by components
  }

  onMount() {
    // Base implementation - can be overridden by components
  }

  /**
   * Senior-level cleanup with comprehensive memory management
   * Properly removes all event listeners, DOM references, and subscriptions
   */
  destroy() {
    console.log(`[${this.constructor.name}] Starting cleanup...`);

    // Step 1: Remove component reference from DOM element
    if (this._el?._component === this) {
      this._el._component = null;
    }

    // Step 2: Remove all event listeners with error handling
    if (this._eventListeners && this._eventListeners.length > 0) {
      console.log(`[${this.constructor.name}] Removing ${this._eventListeners.length} event listeners...`);
      this._eventListeners.forEach(([el, type, handler]) => {
        try {
          if (el && el.removeEventListener && typeof handler === "function") {
            el.removeEventListener(type, handler);
          }
        } catch (e) {
          console.warn(`[${this.constructor.name}] Error removing event listener for ${type}:`, e);
        }
      });
      this._eventListeners = [];
    }

    // Step 3: Remove DOM element with error handling
    if (this._el) {
      try {
        this._el.remove();
      } catch (e) {
        console.warn(`[${this.constructor.name}] Error removing DOM element:`, e);
      }
      this._el = null;
    }

    // Step 4: Clean up any other references
    if (this.props) {
      this.props = {};
    }

    console.log(`[${this.constructor.name}] Cleanup completed successfully`);
  }

  $(selector) {
    return this._el?.querySelector?.(selector) ?? null;
  }

  setText(selector, text) {
    const el = this.$(selector);
    if (el) el.textContent = text;
    return this;
  }

  setHTML(selector, html) {
    const el = this.$(selector);
    if (el) el.innerHTML = html;
    return this;
  }

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

  toggleClass(selector, className, add) {
    const el = this.$(selector);
    if (el) {
      if (add) {
        el.classList.add(className);
      } else {
        el.classList.remove(className);
      }
    }
    return this;
  }

  show(selector) {
    return this.toggleClass(selector, "hidden", false);
  }

  hide(selector) {
    return this.toggleClass(selector, "hidden", true);
  }

  /**
   * Enhanced event delegation with automatic listener tracking
   * @param {string} event - Event type
   * @param {string|function} selector - CSS selector or handler function
   * @param {function} handler - Event handler function
   * @returns {Component} this for chaining
   */
  on(event, selector, handler) {
    if (!this._el) {
      console.warn(`[${this.constructor.name}] Cannot add event listener: element not mounted`);
      return this;
    }

    // Initialize event listeners array if not exists
    if (!this._eventListeners) {
      this._eventListeners = [];
    }

    const fn = typeof selector === "function"
      ? selector.bind(this)
      : (e) => {
        const target = e.target.closest(selector);
        if (target && this._el.contains(target)) {
          handler.call(this, e, target);
        }
      };

    this._el.addEventListener(event, fn, false);
    this._eventListeners.push([this._el, event, fn]);

    console.log(`[${this.constructor.name}] Added event listener for ${event}`);

    return this;
  }

  _htmlToElement(html) {
    if (typeof html !== "string") return html;
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    return template.content.firstElementChild || null;
  }

  /**
   * Create element using Component.h() syntax with proper memory management
   */
  static h(tag, attrs = {}, ...children) {
    // Handle Component classes
    if (typeof tag === "function" && tag.prototype instanceof Component) {
      const instance = new tag(attrs);
      instance.props = attrs;
      const html = instance.render();
      const el = instance._htmlToElement(html);

      if (el) {
        el._component = instance;
        instance._el = el;
        instance.bindEvents();
        instance.onMount?.();
      }
      return el;
    }

    // Handle regular HTML elements
    const el = document.createElement(tag);

    // Set attributes with proper handling
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (k === "className") {
        el.className = v;
      } else if (k === "style" && typeof v === "object") {
        Object.assign(el.style, v);
      } else if (k === "dataset") {
        Object.entries(v).forEach(([dk, dv]) => {
          el.dataset[dk] = dv;
        });
      } else if (k === "ref" && typeof v === "function") {
        v(el);
      } else if (k.startsWith("on") && typeof v === "function") {
        const eventName = k.slice(2).toLowerCase();
        el.addEventListener(eventName, v);
      } else if (typeof v === "boolean") {
        if (v) {
          el.setAttribute(k, "");
        }
      } else if (v !== null && v !== undefined) {
        el.setAttribute(k, v);
      }
    });

    // Handle children
    children.forEach((c) => {
      if (c === null || c === undefined || c === false) return;

      if (typeof c === "string" || typeof c === "number") {
        el.appendChild(document.createTextNode(String(c)));
      } else if (c instanceof HTMLElement) {
        el.appendChild(c);
      } else if (Array.isArray(c)) {
        c.forEach((item) => {
          if (item instanceof HTMLElement) {
            el.appendChild(item);
          } else if (typeof item === "string") {
            el.appendChild(document.createTextNode(item));
          }
        });
      }
    });

    return el;
  }
}

// Export for global use
window.Component = Component;
