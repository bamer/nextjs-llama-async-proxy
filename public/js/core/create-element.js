/**
 * Create Element Helper
 * Utility for creating DOM elements with attributes and children
 */

function createElement(tag, attrs = {}, ...children) {
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

window.createElement = createElement;
