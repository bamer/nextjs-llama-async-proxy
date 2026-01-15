/**
 * Component Helpers - DOM manipulation methods
 * Part of component.js refactoring (≤200 lines)
 */

// Add helper methods to existing Component class
// (Component class is already defined in component-base.js)

/**
 * Query a single element within the component's DOM tree.
 * @param {string} selector - CSS selector
 * @returns {Node|null} Found element or null
 */
Component.prototype.$ = function (selector) {
  return this._el?.querySelector?.(selector) ?? null;
};

/**
 * Set text content of a matched element.
 * @param {string} selector - CSS selector
 * @param {string} text - Text content to set
 * @returns {Component} Returns this for chaining
 */
Component.prototype.setText = function (selector, text) {
  const el = this.$(selector);
  if (el) el.textContent = text;
  return this;
};

/**
 * Set HTML content of a matched element.
 * @param {string} selector - CSS selector
 * @param {string} html - HTML string to set
 * @returns {Component} Returns this for chaining
 */
Component.prototype.setHTML = function (selector, html) {
  const el = this.$(selector);
  if (el) el.innerHTML = html;
  return this;
};

/**
 * Set or remove an attribute from a matched element.
 * @param {string} selector - CSS selector
 * @param {string} attr - Attribute name
 * @param {string|null} value - Attribute value (null/undefined to remove)
 * @returns {Component} Returns this for chaining
 */
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

/**
 * Add or remove a CSS class from a matched element.
 * @param {string} selector - CSS selector
 * @param {string} className - CSS class name
 * @param {boolean} add - True to add, false to remove
 * @returns {Component} Returns this for chaining
 */
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

/**
 * Show a hidden element by removing the 'hidden' class.
 * @param {string} selector - CSS selector
 * @returns {Component} Returns this for chaining
 */
Component.prototype.show = function (selector) {
  return this.toggleClass(selector, "hidden", false);
};

/**
 * Hide an element by adding the 'hidden' class.
 * @param {string} selector - CSS selector
 * @returns {Component} Returns this for chaining
 */
Component.prototype.hide = function (selector) {
  return this.toggleClass(selector, "hidden", true);
};

/**
 * Add event listener with delegation support. Automatically tracks for cleanup.
 * @param {string} event - Event type (e.g., 'click', 'change')
 * @param {string|function} selector - CSS selector or direct handler function
 * @param {function} handler - Event handler function
 * @returns {Component} Returns this for chaining
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
 * Convert HTML string to DOM element.
 * @param {string} html - HTML string to parse
 * @returns {Node|null} Parsed DOM element or null if invalid
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
