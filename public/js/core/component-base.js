/**
 * Component Base - Core Component class
 * Part of component.js refactoring (≤200 lines)
 */

class Component {
  constructor(props = {}) {
    this.props = props;
    this._el = null;
    this._eventListeners = [];
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

  shouldUpdate() {
    return true;
  }

  bindEvents() {}

  onMount() {}

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
