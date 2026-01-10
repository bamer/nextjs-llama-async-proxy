/**
 * Simple Component Base Class with Event-Based Rendering
 * Optimized for performance with memoization and selective updates
 */

class Component {
  constructor(props = {}) {
    this.props = props;
    this.state = {};
    this._el = null;
    this._mounted = false;
    this._events = {};
    this._delegatedHandlers = {};
    this._subscribedKeys = new Set();
    this._renderId = 0;
    this._pendingUpdates = new Map();
    this._abortController = null;
    this._debounceTimers = new Map();
    this._lastRenderedState = null;
    this._rafId = null;
  }

  render() {
    throw new Error("render() must be implemented");
  }

  mount(parent) {
    if (typeof parent === "string") parent = document.querySelector(parent);
    if (!parent) throw new Error("Parent not found");

    this.willMount && this.willMount();

    const rendered = this.render();
    this._lastRenderedState = { ...this.state, ...this.props };
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

  subscribe(...keys) {
    keys.forEach((key) => this._subscribedKeys.add(key));
  }

  unsubscribe(...keys) {
    keys.forEach((key) => this._subscribedKeys.delete(key));
  }

  shouldRerender(changedKeys) {
    if (this._subscribedKeys.size === 0) return true;
    return changedKeys.some((key) => this._subscribedKeys.has(key));
  }

  setState(updates, options = {}) {
    const changedKeys = Object.keys(updates);
    const oldState = { ...this.state };

    for (const [key, value] of Object.entries(updates)) {
      this._pendingUpdates.set(key, { value, oldState: this.state[key] });
    }

    this.state = { ...this.state, ...updates };

    if (options.immediate) {
      if (this._el) {
        this._conditionalUpdate(changedKeys);
        this._pendingUpdates.clear();
      }
      return this;
    }

    if (window.stateEvents) {
      window.stateEvents.emit("state:change", {
        component: this,
        keys: changedKeys,
        oldState,
        newState: this.state,
      });
    }

    if (this._el) {
      if (!this._rafId) {
        this._rafId = requestAnimationFrame(() => {
          this._rafId = null;
          const allChangedKeys = Array.from(this._pendingUpdates.keys());
          this._conditionalUpdate(allChangedKeys);
          this._pendingUpdates.clear();
        });
      }
    }

    return this;
  }

  _conditionalUpdate(changedKeys) {
    if (!this._el) return;
    if (!this.shouldRerender(changedKeys)) return;
    this.update();
  }

  forceUpdate() {
    if (this._el) {
      this.update();
    }
    return this;
  }

  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }

  _isStateChanged(oldState, newState) {
    const keys = new Set([...Object.keys(oldState), ...Object.keys(newState)]);
    for (const key of keys) {
      if (oldState[key] !== newState[key]) return true;
    }
    return false;
  }

  _isPropsChanged(oldProps, newProps) {
    const keys = new Set([...Object.keys(oldProps || {}), ...Object.keys(newProps || {})]);
    for (const key of keys) {
      const oldVal = oldProps?.[key];
      const newVal = newProps?.[key];
      if (oldVal !== newVal) {
        if (typeof oldVal === "object" && typeof newVal === "object") {
          if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) return true;
        } else {
          return true;
        }
      }
    }
    return false;
  }

  update() {
    const nextProps = this.props;
    const nextState = this.state;

    if (!this.shouldComponentUpdate(nextProps, nextState)) {
      return;
    }

    const oldEl = this._el;
    this._renderId++;

    const rendered = this.render();
    this._lastRenderedState = { ...nextState, ...nextProps };

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
      this.willReceiveProps && this.willReceiveProps(this.props);
      this.bindEvents();
      this.didUpdate && this.didUpdate();
    }
  }

  get initialState() {
    return {};
  }

  getEventMap() {
    return {};
  }

  bindEvents() {
    if (!this._el) return;

    const map = this.getEventMap();
    if (Object.keys(map).length === 0) return;

    this._cleanupEvents();
    this._delegatedHandlers = {};

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

      const delegationKey = `${event}|${selector || "none"}`;

      const delegatedHandler = (e) => {
        if (!this._el || (!this._el.contains(e.target) && this._el !== e.target)) {
          return;
        }
        const target = selector ? e.target.closest(selector) : e.target;
        if (target) {
          fn(e, target);
        }
      };

      this._delegatedHandlers[delegationKey] = delegatedHandler;

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

  destroy() {
    this.willDestroy && this.willDestroy();

    this._cleanupEvents();
    this._delegatedHandlers = null;

    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }

    if (this._updateTimeout) {
      clearTimeout(this._updateTimeout);
      this._updateTimeout = null;
    }

    this._pendingUpdates.clear();

    this._abortPending();

    this._debounceTimers.forEach((timer) => clearTimeout(timer));
    this._debounceTimers.clear();

    this._subscribedKeys.clear();

    if (this._el && this._el.parentNode) {
      this._el.parentNode.removeChild(this._el);
    }
    this._el = null;
    this._mounted = false;
    this._events = {};
    this.didDestroy && this.didDestroy();
  }

  $q(selector) {
    if (!this._el) return null;
    try {
      return this._el.querySelector(selector);
    } catch (e) {
      return null;
    }
  }

  $qa(selector) {
    if (!this._el) return [];
    try {
      return Array.from(this._el.querySelectorAll(selector));
    } catch (e) {
      return [];
    }
  }

  _createAbort() {
    this._abortPending();

    const AbortControllerClass = window.AbortController;
    if (!AbortControllerClass) return null;

    this._abortController = new AbortControllerClass();
    return this._abortController;
  }

  _abortPending() {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
  }

  _getAbortSignal() {
    return this._abortController?.signal || null;
  }

  _debounceInput(fn, delay, key = "default") {
    return (...args) => {
      if (this._debounceTimers.has(key)) {
        clearTimeout(this._debounceTimers.get(key));
      }

      const timer = setTimeout(() => {
        fn.apply(this, args);
        this._debounceTimers.delete(key);
      }, delay);

      this._debounceTimers.set(key, timer);
    };
  }

  static h(tag, attrs = {}, ...children) {
    if (typeof tag === "function" && tag.prototype instanceof Component) {
      const comp = new tag(attrs);
      comp.props = attrs;
      const el = comp.render();
      if (el instanceof HTMLElement) {
        el._component = comp;
        comp._el = el;
        comp._mounted = true;
        comp.bindEvents();

        const appendChildren = (parent, childList) => {
          childList.forEach((c) => {
            if (c === null || c === undefined || c === false) {
            } else if (typeof c === "string" || typeof c === "number") {
              parent.appendChild(document.createTextNode(String(c)));
            } else if (Array.isArray(c)) {
              appendChildren(parent, c);
            } else if (c instanceof HTMLElement) {
              parent.appendChild(c);
              if (c._component && c._component.didMount) {
                c._component.didMount();
              }
            } else if (c instanceof Component) {
              const cel = c.render();
              if (cel instanceof HTMLElement) {
                parent.appendChild(cel);
                c._el = cel;
                c._mounted = true;
                c.bindEvents();
                c.didMount && c.didMount();
              }
            }
          });
        };

        appendChildren(el, children);

        if (comp.didMount) {
          comp.didMount();
        }
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
        refCallback = v;
      } else if (k === "dataset") {
        Object.entries(v).forEach(([dk, dv]) => {
          el.dataset[dk] = dv;
        });
      } else if (k === "key") {
        el.dataset.key = String(v);
      } else if (k === "value") {
        if (tag === "select") {
          valueAttr = v;
        } else {
          if (tag === "textarea") {
            el.setAttribute(k, v);
          }
          el[k] = v;
        }
      } else if (k === "checked") {
        el[k] = v;
      } else if (typeof v === "boolean") {
        if (v) {
          el.setAttribute(k, "");
        }
      } else if (v !== null && v !== undefined) {
        el.setAttribute(k, v);
      }
    });

    el._props = { ...attrs };

    const appendChildren = (parent, childList) => {
      childList.forEach((c) => {
        if (c === null || c === undefined || c === false) {
        } else if (typeof c === "string" || typeof c === "number") {
          parent.appendChild(document.createTextNode(String(c)));
        } else if (Array.isArray(c)) {
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

    if (valueAttr !== null && tag === "select") {
      el.value = valueAttr;
    }

    if (refCallback) {
      refCallback(el);
    }

    return el;
  }
}

window.Component = Component;
