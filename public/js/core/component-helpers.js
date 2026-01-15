/**
 * Component Helpers - DOM manipulation methods
 * Part of component.js refactoring (≤200 lines)
 */

// Add helper methods to existing Component class
// (Component class is already defined in component-base.js)

Component.prototype.$ = function (selector) {
  return this._el?.querySelector?.(selector) ?? null;
};

Component.prototype.setText = function (selector, text) {
  const el = this.$(selector);
  if (el) el.textContent = text;
  return this;
};

Component.prototype.setHTML = function (selector, html) {
  const el = this.$(selector);
  if (el) el.innerHTML = html;
  return this;
};

Component.prototype.setAttr = function (selector, attr, value) {
  const el = this.$(selector);
  if (el) {
    if (value === null || value === undefined) {
      el.removeAttribute(attr);
    } else {
      el.setAttribute(attr, value);
    }
  }
  return this;
};

Component.prototype.toggleClass = function (selector, className, add) {
  const el = this.$(selector);
  if (el) {
    if (add) {
      el.classList.add(className);
    } else {
      el.classList.remove(className);
    }
  }
  return this;
};

Component.prototype.show = function (selector) {
  return this.toggleClass(selector, "hidden", false);
};

Component.prototype.hide = function (selector) {
  return this.toggleClass(selector, "hidden", true);
};

/**
 * Enhanced event delegation with automatic listener tracking
 */
Component.prototype.on = function (event, selector, handler) {
  if (!this._el) {
    console.warn(`[${this.constructor.name}] Cannot add event listener: element not mounted`);
    return this;
  }

  if (!this._eventListeners) {
    this._eventListeners = [];
  }

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
  this._eventListeners.push([this._el, event, fn]);

  console.log(`[${this.constructor.name}] Added event listener for ${event}`);

  return this;
};

/**
 * Convert HTML string to DOM element
 */
Component.prototype._htmlToElement = function (html) {
  if (typeof html !== "string") {
    if (html instanceof Node) return html;
    console.error("[Component] _htmlToElement received non-string, non-Node:", typeof html, html?.constructor?.name);
    return null;
  }
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstElementChild || null;
};
