/**
 * Simple Component Base Class with Event-Based Rendering
 */

class Component {
  constructor(props = {}) {
    this.props = props;
    this.state = {};
    this._el = null;
    this._mounted = false;
    this._events = {};
    this._delegatedHandlers = {};
    this._subscribedKeys = new Set(); // State keys this component subscribes to
    this._renderId = 0; // Track renders for debugging
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
    this._renderId++;

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

  // Subscribe to specific state keys for selective re-rendering
  subscribe(...keys) {
    keys.forEach((key) => this._subscribedKeys.add(key));
  }

  unsubscribe(...keys) {
    keys.forEach((key) => this._subscribedKeys.delete(key));
  }

  // Check if this component cares about a state change
  shouldRerender(changedKeys) {
    // If no specific subscriptions, re-render on any change (legacy behavior)
    if (this._subscribedKeys.size === 0) return true;
    // Re-render if any of the changed keys are in our subscription
    return changedKeys.some((key) => this._subscribedKeys.has(key));
  }

  // Update state with selective re-rendering
  setState(updates, options = {}) {
    const changedKeys = Object.keys(updates);
    const oldState = { ...this.state };
    this.state = { ...this.state, ...updates };

    // Legacy: always update if no options provided
    if (options.immediate) {
      if (this._el) {
        this._conditionalUpdate(changedKeys, oldState);
      }
      return this;
    }

    // New: emit event for selective updates
    if (window.stateEvents) {
      window.stateEvents.emit("state:change", {
        component: this,
        keys: changedKeys,
        oldState,
        newState: this.state,
      });
    }

    // Debounced update for legacy components
    if (this._el) {
      if (!this._updateTimeout) {
        this._updateTimeout = setTimeout(() => {
          this._updateTimeout = null;
          this._conditionalUpdate(changedKeys, oldState);
        }, 16); // ~60fps
      }
    }

    return this;
  }

  // Conditional update based on subscriptions
  _conditionalUpdate(changedKeys, oldState) {
    if (!this._el) return;

    // Check if we should re-render
    if (!this.shouldRerender(changedKeys)) {
      return;
    }

    this.update();
  }

  // Force immediate update (bypasses subscription check)
  forceUpdate() {
    if (this._el) {
      this.update();
    }
    return this;
  }

  // Re-render - simple full replacement (native approach)
  update() {
    // Check if component wants to skip this update
    if (this.shouldUpdate && !this.shouldUpdate(this.props)) {
      return;
    }

    const oldEl = this._el;
    this._renderId++;

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

    // Always clean up old listeners first
    this._cleanupEvents();
    this._delegatedHandlers = {};

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
      const delegationKey = `${event}|${selector || "none"}`;

      // Create delegated handler
      const delegatedHandler = (e) => {
        // Early exit if event is not from within this component
        if (!this._el || (!this._el.contains(e.target) && this._el !== e.target)) {
          return;
        }
        const target = selector ? e.target.closest(selector) : e.target;
        if (target) {
          fn(e, target);
        }
      };

      // Store for cleanup
      this._delegatedHandlers[delegationKey] = delegatedHandler;

      // Attach to this component element instead of document for better performance
      if (this._el) {
        this._el.addEventListener(event, delegatedHandler, false);
      }
    });
  }

  _cleanupEvents() {
    if (!this._delegatedHandlers) return;

    Object.entries(this._delegatedHandlers).forEach(([key, handler]) => {
      const [event] = key.split("|");
      if (this._el) {
        this._el.removeEventListener(event, handler, false);
      }
    });
  }

  // Cleanup
  destroy() {
    this.willDestroy && this.willDestroy();

    // Remove delegated event listeners from document
    this._cleanupEvents();
    this._delegatedHandlers = null;

    // Clear update timeout
    if (this._updateTimeout) {
      clearTimeout(this._updateTimeout);
      this._updateTimeout = null;
    }

    // Unsubscribe from all state events
    this._subscribedKeys.clear();

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
      comp.props = attrs; // Ensure props are set
      const el = comp.render();
      if (el instanceof HTMLElement) {
        el._component = comp;
        comp._el = el;
        // Call bindEvents on the child component to attach event listeners
        comp.bindEvents();

        // Helper function to recursively flatten and append children
        const appendChildren = (parent, childList) => {
          childList.forEach((c) => {
            if (c === null || c === undefined || c === false) {
              // Skip null, undefined, or false values
            } else if (typeof c === "string" || typeof c === "number") {
              parent.appendChild(document.createTextNode(String(c)));
            } else if (Array.isArray(c)) {
              // Recursively handle nested arrays
              appendChildren(parent, c);
            } else if (c instanceof HTMLElement) {
              parent.appendChild(c);
            } else if (c instanceof Component) {
              const cel = c.render();
              if (cel instanceof HTMLElement) {
                parent.appendChild(cel);
                c._el = cel;
                c.bindEvents();
              }
            }
          });
        };

        appendChildren(el, children);
      }
      return el;
    }

    const el = document.createElement(tag);
    let valueAttr = null;
    let refCallback = null;

    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "className") {
        el.className = v;
      } else if (k === "style" && typeof v === "object") {
        Object.assign(el.style, v);
      } else if (k.startsWith("on") && typeof v === "function") {
        el.addEventListener(k.slice(2).toLowerCase(), v);
      } else if (k === "ref" && typeof v === "function") {
        // Store ref callback to call after element is fully constructed
        refCallback = v;
      } else if (k === "dataset") {
        Object.entries(v).forEach(([dk, dv]) => {
          el.dataset[dk] = dv;
        });
      } else if (k === "value") {
        // For select elements, store value and set after children are added
        if (tag === "select") {
          valueAttr = v;
        } else {
          // For input/textarea, set immediately
          if (tag === "textarea") {
            el.setAttribute(k, v);
          }
          el[k] = v;
        }
      } else if (k === "checked") {
        // Set checked as property for checkboxes and radios
        el[k] = v;
      } else if (typeof v === "boolean") {
        // Boolean attributes (disabled, checked, etc.) - only set when true
        if (v) {
          el.setAttribute(k, "");
        }
      } else if (v !== null && v !== undefined) {
        el.setAttribute(k, v);
      }
    });

    // Helper function to recursively flatten and append children
    const appendChildren = (parent, childList) => {
      childList.forEach((c) => {
        if (c === null || c === undefined || c === false) {
          // Skip null, undefined, or false values
        } else if (typeof c === "string" || typeof c === "number") {
          parent.appendChild(document.createTextNode(String(c)));
        } else if (Array.isArray(c)) {
          // Recursively handle nested arrays
          appendChildren(parent, c);
        } else if (c instanceof HTMLElement) {
          parent.appendChild(c);
        } else if (c instanceof Component) {
          const cel = c.render();
          if (cel instanceof HTMLElement) {
            parent.appendChild(cel);
            c._el = cel;
            c.bindEvents();
          }
        }
      });
    };

    appendChildren(el, children);

    // Set select value AFTER children are added
    if (valueAttr !== null && tag === "select") {
      el.value = valueAttr;
    }

    // Call ref callback AFTER element is fully constructed
    if (refCallback) {
      refCallback(el);
    }

    return el;
  }
}

window.Component = Component;
