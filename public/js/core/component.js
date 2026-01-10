/**
 * Event-Driven Component - Pure DOM Updates
 * Components render once with template strings, then use direct DOM updates
 */

class Component {
  constructor(props = {}) {
    this.props = props;
    this._el = null;
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

  bindEvents() {}

  onMount() {}

  destroy() {
    this._el?._component === this && (this._el._component = null);
    this._el?.remove();
    this._el = null;
    console.log(`[${this.constructor.name}] Destroyed`);
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
      if (value === null || value === undefined) el.removeAttribute(attr);
      else el.setAttribute(attr, value);
    }
    return this;
  }

  toggleClass(selector, className, add) {
    const el = this.$(selector);
    if (el) {
      if (add) el.classList.add(className);
      else el.classList.remove(className);
    }
    return this;
  }

  show(selector) {
    return this.toggleClass(selector, "hidden", false);
  }

  hide(selector) {
    return this.toggleClass(selector, "hidden", true);
  }

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
    return this;
  }

  _htmlToElement(html) {
    if (typeof html !== "string") return html;
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    return template.content.firstElementChild || null;
  }

  static h(tag, attrs = {}, ...children) {
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
