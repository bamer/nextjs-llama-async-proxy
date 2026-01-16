/**
 * Component.h - Virtual DOM element creation
 * Part of component.js refactoring (≤200 lines)
 */

// Add Component.h method to existing Component class
// (Component class is already defined in component-base.js)

/**
 * Create a virtual DOM element (JSX-like syntax).
 * @param {string|function} tag - HTML tag name or Component class
 * @param {object} attrs - Attributes and properties
 * @param {...(string|Node|Component)} children - Child elements
 * @returns {Node} Created DOM element
 */
Component.h = function (tag, attrs = {}, ...children) {
  // Handle Component instances (persistence)
  if (tag instanceof Component) {
    tag.props = attrs;
    return tag._el || tag.render();
  }

  // Handle Component classes
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
      console.error("[Component.h] Failed to create DOM element from component render, got:", el);
    }
    return el;
  }

  // Handle regular HTML elements
  const el = document.createElement(tag);
  let valueAttr = null; // Store value for select/textarea

  // Set attributes
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
    } else if (k === "value" && (tag === "select" || tag === "textarea")) {
      valueAttr = v; // Defer setting value for select/textarea
    } else if (typeof v === "boolean") {
      if (v) {
        el.setAttribute(k, "");
      }
    } else if (v !== null && v !== undefined) {
      el.setAttribute(k, v);
    }
  });

  // Filter out null, undefined, false children
  const validChildren = children.flat().filter(c => c !== null && c !== undefined && c !== false);

  // Handle children
  validChildren.forEach((c) => {
    if (typeof c === "string" || typeof c === "number") {
      el.appendChild(document.createTextNode(String(c)));
    } else if (c instanceof Node) {
      // If it's already a node, append it directly (don't wrap or clone)
      el.appendChild(c);
    } else if (c instanceof Component) {
      // A component child is assumed to return an HTML string or Node from render()
      const childEl = c.render();
      // Use _htmlToElement for consistency when processing render output
      const mountedChild = c._htmlToElement(childEl);
      if (mountedChild instanceof Node) {
        el.appendChild(mountedChild);
      } else {
        console.error("[Component.h] Failed to render child component:", c.constructor.name, "Got:", mountedChild);
      }
    } else {
      // Log error for invalid child types that were not filtered
      console.error(`[${this.constructor.name}] Invalid child type:`, typeof c, c);
    }
  });

  // Set value for select/textarea after options are appended
  if (valueAttr !== null && (tag === "select" || tag === "textarea")) {
    el.value = valueAttr;
  }

  return el;
};
