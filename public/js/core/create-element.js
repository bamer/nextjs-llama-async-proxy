/**
 * Create Element Helper
 * Utility for creating DOM elements with attributes and children
 */

/**
 * Create a DOM element with attributes and children.
 * @param {string|function} tag - HTML tag name or Component class
 * @param {object} attrs - Attributes and properties
 * @param {...(string|Node|Component)} children - Child elements
 * @returns {Node} Created DOM element
 */
function createElement(tag, attrs = {}, ...children) {
  if (typeof tag === "function" && tag.prototype instanceof Component) {
    const instance = new tag(attrs);
    instance.props = attrs;
    const html = instance.render();
    const el = instance._htmlToElement(html);

    if (el instanceof Node) {
      el._component = instance;
      instance._el = el;
      instance.bindEvents();
      instance.onMount?.();
    } else {
      console.error("[createElement] Failed to create DOM element from component render, got:", el);
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
    } else if (c instanceof Node) {
      el.appendChild(c);
    } else if (c instanceof Component) {
      // If it's a Component instance, render it first
      const childEl = c.render();
      if (childEl instanceof Node) {
        el.appendChild(childEl);
      } else {
        console.error("[createElement] Failed to render child component:", c.constructor.name, "Got:", childEl);
      }
    } else if (Array.isArray(c)) {
      c.forEach((item) => {
        if (item instanceof Node) {
          el.appendChild(item);
        } else if (typeof item === "string") {
          el.appendChild(document.createTextNode(item));
        } else if (item instanceof Component) {
          const childEl = item.render();
          if (childEl instanceof Node) {
            el.appendChild(childEl);
          }
        }
      });
    } else {
      console.error("[createElement] Invalid child type:", typeof c, c);
    }
  });

  return el;
}

window.createElement = createElement;
