/**
 * Base Component Class
 * Vanilla JS component model with lifecycle hooks
 */

class Component {
  constructor(props = {}) {
    this.props = props;
    this.state = {};
    this._element = null;
    this._parent = null;
    this._children = [];
    this._mounted = false;
    this._destroyed = false;
    this._eventListeners = new Map();
    this._refs = new Map();
  }

  /**
   * Get the component element
   */
  get element() {
    return this._element;
  }

  /**
   * Get component props
   */
  get props() {
    return this._props;
  }

  /**
   * Set component props
   */
  set props(value) {
    this._props = value || {};
  }

  /**
   * Get component state
   */
  get state() {
    return this._state;
  }

   /**
    * Set component state (triggers update if changed)
    */
  set state(value) {
    this._state = value || {};
  }

   /**
   * Update component state (similar to React's setState)
   * @param {Object|Function} updates - State updates or updater function
   */
  setState(updates) {
    if (typeof updates === 'function') {
      // Functional update
      this._state = { ...this._state, ...updates(this._state) };
    } else {
      // Object update
      this._state = { ...this._state, ...updates };
    }
    return this;
  }

  /**
   * Lifecycle: Initialize before mounting
   */
  init() {
    this.state = this.getInitialState ? this.getInitialState() : {};
  }

  /**
   * Lifecycle: Get initial state
   */
  getInitialState() {
    return {};
  }

  /**
   * Lifecycle: Called before first render
   */
  willMount() {}

  /**
   * Lifecycle: Render the component
   * Must be implemented by subclasses
   */
  render() {
    throw new Error('render() must be implemented by subclass');
  }

  /**
   * Lifecycle: Called after mounting
   */
  didMount() {}

  /**
   * Lifecycle: Called before update
   */
  willUpdate(oldProps, oldState) {}

  /**
   * Lifecycle: Called after update
   */
  didUpdate(oldProps, oldState) {}

  /**
   * Lifecycle: Called before destroy
   */
  willDestroy() {}

  /**
   * Lifecycle: Called after destroy
   */
  didDestroy() {}

  /**
   * Mount the component to a DOM element
   * @param {HTMLElement|string} parent - Parent element or selector
   * @param {boolean} replace - Replace existing content
   */
  mount(parent, replace = false) {
    if (this._mounted && this._element) {
      console.warn('[Component] Component already mounted');
      return this;
    }

    this.willMount();

    // Get parent element
    if (typeof parent === 'string') {
      this._parent = document.querySelector(parent);
    } else if (parent instanceof HTMLElement) {
      this._parent = parent;
    } else {
      throw new Error('Invalid parent element');
    }

    if (!this._parent) {
      throw new Error(`Parent element not found`);
    }

    // Create and append element
    const rendered = this.render();

    if (typeof rendered === 'string') {
      const temp = document.createElement('div');
      temp.innerHTML = rendered;
      this._element = temp.firstChild;
    } else if (rendered instanceof HTMLElement) {
      this._element = rendered;
    } else {
      throw new Error('render() must return HTML string or HTMLElement');
    }

    // Store reference to component on element
    this._element._component = this;

    if (replace) {
      this._parent.innerHTML = '';
    }
    this._parent.appendChild(this._element);

    this._mounted = true;
    this.bindEvents();

    this.didMount();

    return this;
  }

  /**
   * Update the component with new props/state
   * @param {Object} newProps - New props
   * @param {Object} newState - New state
   */
  update(newProps = {}, newState = {}) {
    if (!this._mounted || this._destroyed) {
      console.warn('[Component] Cannot update unmounted or destroyed component');
      return;
    }

    const oldProps = { ...this._props };
    const oldState = { ...this._state };

    // Merge new props and state
    this._props = { ...this._props, ...newProps };
    this._state = { ...this._state, ...newState };

    this.willUpdate(oldProps, oldState);

    // Re-render and patch DOM
    const newElement = this.render();

    if (typeof newElement === 'string') {
      const temp = document.createElement('div');
      temp.innerHTML = newElement;
      const newDom = temp.firstChild;
      this.patch(this._element, newDom);
      this._element = newDom;
    } else if (newElement instanceof HTMLElement) {
      this.patch(this._element, newElement);
      this._element = newElement;
    }

    this._element._component = this;
    this.bindEvents();

    this.didUpdate(oldProps, oldState);

    return this;
  }

  /**
   * Simple DOM patching algorithm
   * @param {HTMLElement} oldEl - Old element
   * @param {HTMLElement} newEl - New element
   */
  patch(oldEl, newEl) {
    if (oldEl.nodeName !== newEl.nodeName) {
      oldEl.replaceWith(newEl);
      return;
    }

    // Copy attributes
    Array.from(oldEl.attributes).forEach(attr => {
      if (!newEl.hasAttribute(attr.name)) {
        oldEl.removeAttribute(attr.name);
      }
    });

    Array.from(newEl.attributes).forEach(attr => {
      if (oldEl.getAttribute(attr.name) !== attr.value) {
        oldEl.setAttribute(attr.name, attr.value);
      }
    });

    // Copy text content
    if (oldEl.textContent !== newEl.textContent) {
      oldEl.textContent = newEl.textContent;
    }

    // Handle children
    const oldChildren = Array.from(oldEl.children);
    const newChildren = Array.from(newEl.children);

    const maxLength = Math.max(oldChildren.length, newChildren.length);

    for (let i = 0; i < maxLength; i++) {
      if (i < newChildren.length && i < oldChildren.length) {
        // Both exist - patch recursively
        this.patch(oldChildren[i], newChildren[i]);
      } else if (i < newChildren.length) {
        // New child - append
        oldEl.appendChild(newChildren[i]);
      } else {
        // Old child - remove
        oldChildren[i].remove();
      }
    }
  }

  /**
   * Destroy the component
   */
  destroy() {
    if (this._destroyed) return;

    this.willDestroy();

    // Remove event listeners
    this.unbindEvents();

    // Destroy children
    this._children.forEach(child => {
      if (child.destroy) child.destroy();
    });
    this._children = [];

    // Remove from DOM
    if (this._element && this._element.parentNode) {
      this._element.parentNode.removeChild(this._element);
    }

    this._element = null;
    this._parent = null;
    this._mounted = false;
    this._destroyed = true;

    this.didDestroy();
  }

  /**
   * Bind event listeners from props
   */
  bindEvents() {
    if (!this._element) return;

    const events = this.getEventMap ? this.getEventMap() : {};

    Object.entries(events).forEach(([eventSpec, handler]) => {
      const [eventName, selector] = eventSpec.split(' ');
      const eventHandler = typeof handler === 'string' ? this[handler].bind(this) : handler.bind(this);

      if (selector) {
        // Delegated event
        this._element.addEventListener(eventName, (e) => {
          const target = e.target.closest(selector);
          if (target) eventHandler(e, target);
        });
      } else {
        // Direct event on element
        this._element.addEventListener(eventName, eventHandler);
      }

      // Store for cleanup
      const key = `${eventName}${selector ? ' ' + selector : ''}`;
      this._eventListeners.set(key, eventHandler);
    });
  }

  /**
   * Remove all event listeners
   */
  unbindEvents() {
    this._eventListeners.forEach((handler, key) => {
      const [eventName, selector] = key.split(' ');
      if (this._element) {
        if (selector) {
          this._element.removeEventListener(eventName, handler);
        } else {
          this._element.removeEventListener(eventName, handler);
        }
      }
    });
    this._eventListeners.clear();
  }

  /**
   * Get event map (override in subclasses)
   */
  getEventMap() {
    return {};
  }

   /**
    * Create an element with children
    * @param {string|Component} tag - HTML tag name or Component class
    * @param {Object} attrs - Attributes (or props if tag is a Component)
    * @param {...HTMLElement|string|Component} children - Child elements
    */
  static createElement(tag, attrs = {}, ...children) {
    // Handle Component classes
    if (typeof tag === 'function' && tag.prototype && tag.prototype instanceof Component) {
      const component = new tag(attrs);
      const element = component.render();
      if (element instanceof HTMLElement) {
        element._component = component;
        component._element = element;
        component._mounted = true;
        if (component.didMount) {
          component.didMount();
        }
      }
      // Add children if element supports it
      if (element instanceof HTMLElement) {
        children.forEach(child => {
          if (child === null || child === undefined) return;
          if (typeof child === 'string' || typeof child === 'number') {
            element.appendChild(document.createTextNode(String(child)));
          } else if (child instanceof HTMLElement) {
            element.appendChild(child);
          } else if (child instanceof Component) {
            const childEl = child.render();
            if (childEl instanceof HTMLElement) {
              element.appendChild(childEl);
              child._element = childEl;
              child._mounted = true;
              if (child.didMount) {
                child.didMount();
              }
            }
          }
        });
      }
      return element;
    }

    const element = document.createElement(tag);

    // Set attributes
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else if (key.startsWith('on') && typeof value === 'function') {
        element.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (key === 'dataset') {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          element.dataset[dataKey] = dataValue;
        });
      } else if (key === 'ref') {
        element.ref = value;
      } else if (value !== null && value !== undefined) {
        element.setAttribute(key, value);
      }
    });

    // Add children
    children.forEach(child => {
      if (child === null || child === undefined) return;
      if (typeof child === 'string' || typeof child === 'number') {
        element.appendChild(document.createTextNode(String(child)));
      } else if (child instanceof HTMLElement) {
        element.appendChild(child);
      } else if (child instanceof Component) {
        const childEl = child.render();
        if (childEl instanceof HTMLElement) {
          element.appendChild(childEl);
          child._element = childEl;
          child._mounted = true;
          if (child.didMount) {
            child.didMount();
          }
        }
      }
    });

    return element;
  }

  /**
   * Helper to create element (static method alias)
   */
  static h(tag, attrs, ...children) {
    return Component.createElement(tag, attrs, ...children);
  }
}

// Export
window.Component = Component;
