/**
 * Component Base - Core Component class
 * Part of component.js refactoring (≤200 lines)
 */

class Component {
  /**
   * Create a new Component instance.
   * @param {object} props - Properties passed to the component
   */
  constructor(props = {}) {
    this.props = props;
    this._el = null;
    this._eventListeners = [];
    this._pendingChildMounts = []; // Queue for child onMount calls
    console.log(`[${this.constructor.name}] Created`);
  }

  /**
   * Render the component's HTML. Must be implemented by subclasses.
   * @returns {string|Node|Component} HTML string, DOM node, or component
   * @throws {Error} When not implemented by subclass
   */
  render() {
    throw new Error("render() must be implemented");
  }

  /**
   * Mount the component to a DOM element.
   * @param {string|Node} selectorOrParent - CSS selector or parent DOM node
   * @returns {Component} Returns this for chaining
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

    const html = this.render();
    const el = this._htmlToElement(html);

    if (el instanceof Node) {
      this._el = el;
      el._component = this;
      parent.appendChild(el);
      this.bindEvents();
      this.onMount?.();
    } else {
      console.error(`[${this.constructor.name}] Failed to create DOM element from render(), got:`, el);
    }

    return this;
  }

  /**
   * Determine if the component should update. Override for optimization.
   * @returns {boolean} True if component should update (default: true)
   */
  shouldUpdate() {
    return true;
  }

  /**
   * Bind event handlers to DOM elements. Override in subclasses.
   */
  bindEvents() {}

  /**
    * Called after component is mounted to DOM. Override in subclasses.
    */
  onMount() {}

  /**
   * Mount all queued child components. Called at the end of onMount().
   * This ensures child onMount() runs AFTER parent is fully ready.
   */
  _mountChildren() {
    while (this._pendingChildMounts.length > 0) {
      const { instance, el } = this._pendingChildMounts.shift();
      if (instance && el) {
        el._component = instance;
        instance._el = el;
        instance.bindEvents();
        instance.onMount?.();
      }
    }
    this._pendingChildMounts = [];
  }

  /**
   * Senior-level cleanup with comprehensive memory management
   */
  destroy() {
    console.log(`[${this.constructor.name}] Starting cleanup...`);

    if (this._el?._component === this) {
      this._el._component = null;
    }

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

    if (this._el) {
      try {
        this._el.remove();
      } catch (e) {
        console.warn(`[${this.constructor.name}] Error removing DOM element:`, e);
      }
      this._el = null;
    }

    if (this.props) {
      this.props = {};
    }

    console.log(`[${this.constructor.name}] Cleanup completed successfully`);
  }
}

window.Component = Component;
