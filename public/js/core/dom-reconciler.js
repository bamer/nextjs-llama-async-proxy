/**
 * Selective DOM Updates - Efficient reconciliation
 * Provides keyed DOM updates to avoid full re-renders
 */

class DOMReconciler {
  /**
   * Compare two objects and return changed keys.
   * @param {object} oldProps - Previous props
   * @param {object} newProps - New props
   * @returns {string[]} Array of changed property keys
   */
  static getChangedProps(oldProps, newProps) {
    const changed = [];
    const allKeys = new Set([...Object.keys(oldProps || {}), ...Object.keys(newProps || {})]);

    for (const key of allKeys) {
      if (oldProps[key] !== newProps[key]) {
        changed.push(key);
      }
    }

    return changed;
  }

  /**
   * Update element attributes efficiently.
   * @param {Node} el - DOM element to update
   * @param {object} oldProps - Previous props
   * @param {object} newProps - New props
   * @returns {boolean} True if changes were made
   */
  static updateAttributes(el, oldProps, newProps) {
    const changes = this.getChangedProps(oldProps, newProps);

    if (changes.length === 0) {
      return false; // No changes needed
    }

    console.log("[DEBUG] DOMReconciler.updateAttributes:", {
      changes,
      element: el.tagName,
    });

    for (const key of changes) {
      const oldValue = oldProps?.[key];
      const newValue = newProps?.[key];

      if (newValue === undefined || newValue === null) {
        // Remove attribute/property
        if (key === "className") {
          el.className = "";
        } else if (key === "style") {
          Object.assign(el.style, {});
        } else if (key.startsWith("on")) {
          el.removeEventListener(key.slice(2).toLowerCase(), oldValue);
        } else if (key === "value") {
          if (el.tagName === "TEXTAREA") {
            el.setAttribute(key, "");
          }
          el[key] = "";
        } else if (typeof oldValue === "boolean") {
          el.removeAttribute(key);
        } else {
          el.removeAttribute(key);
        }
      } else {
        // Set attribute/property
        if (key === "className") {
          el.className = newValue;
        } else if (key === "style" && typeof newValue === "object") {
          // Clear old styles and apply new ones
          if (oldProps?.style) {
            for (const styleKey of Object.keys(oldProps.style)) {
              if (!(styleKey in newValue)) {
                el.style[styleKey] = "";
              }
            }
          }
          Object.assign(el.style, newValue);
        } else if (key.startsWith("on") && typeof newValue === "function") {
          if (typeof oldValue === "function") {
            el.removeEventListener(key.slice(2).toLowerCase(), oldValue);
          }
          el.addEventListener(key.slice(2).toLowerCase(), newValue);
        } else if (key === "value") {
          if (el.tagName === "SELECT") {
            el.value = newValue;
          } else if (el.tagName === "TEXTAREA") {
            el.setAttribute(key, newValue);
          }
          el[key] = newValue;
        } else if (key === "checked") {
          el.checked = newValue;
        } else if (typeof newValue === "boolean") {
          if (newValue) {
            el.setAttribute(key, "");
          } else {
            el.removeAttribute(key);
          }
        } else {
          el.setAttribute(key, newValue);
        }
      }
    }

    return true; // Changes were made
  }

  /**
   * Get element key for reconciliation from data-key attribute.
   * @param {Node} el - DOM element
   * @returns {string|null} Key value or null
   */
  static getKey(el) {
    return el.dataset?.key || null;
  }

  /**
   * Reconcile children using keyed diffing algorithm.
   * @param {Node} parent - Parent DOM element
   * @param {Node[]} oldChildren - Previous child nodes
   * @param {Node[]} newChildren - New child nodes
   * @returns {boolean} True if DOM was modified
   */
  static reconcileChildren(parent, oldChildren, newChildren) {
    // Convert both to arrays
    const oldArray = Array.from(parent.children);
    const newArray = Array.isArray(newChildren)
      ? newChildren
      : [newChildren].filter((c) => c !== null && c !== undefined);

    if (oldArray.length === 0 && newArray.length === 0) {
      return false;
    }

    console.log("[DEBUG] DOMReconciler.reconcileChildren:", {
      oldCount: oldArray.length,
      newCount: newArray.length,
    });

    // Quick path: both empty
    if (newArray.length === 0) {
      parent.innerHTML = "";
      return true;
    }

    // Build key maps for keyed reconciliation
    const oldKeyMap = new Map();
    const newKeyMap = new Map();

    oldArray.forEach((el, i) => {
      const key = this.getKey(el) || `index-${i}`;
      oldKeyMap.set(key, { el, index: i });
    });

    newArray.forEach((node, i) => {
      if (node instanceof HTMLElement) {
        const key = this.getKey(node) || `index-${i}`;
        newKeyMap.set(key, { node, index: i });
      } else if (typeof node === "string") {
        newKeyMap.set(`text-${i}`, { node, index: i, type: "text" });
      }
    });

    // Track which old nodes were used
    const usedOldKeys = new Set();

    // Process new children
    const operations = [];
    let lastSibling = null;

    for (let i = 0; i < newArray.length; i++) {
      const newChild = newArray[i];
      const key =
        newChild instanceof HTMLElement ? this.getKey(newChild) || `index-${i}` : `text-${i}`;

      // Find matching old child
      const oldMatch = oldKeyMap.get(key);

      if (oldMatch) {
        // Reuse existing element
        const oldEl = oldMatch.el;
        usedOldKeys.add(key);

        // Move to correct position if needed
        if (lastSibling && oldEl.previousElementSibling !== lastSibling) {
          parent.insertBefore(oldEl, lastSibling.nextElementSibling);
          operations.push({ type: "move", key });
        }

        lastSibling = oldEl;
      } else {
        // Insert new element
        if (newChild instanceof HTMLElement) {
          if (lastSibling) {
            parent.insertBefore(newChild, lastSibling.nextElementSibling);
          } else {
            parent.prepend(newChild);
          }
          operations.push({ type: "insert", key });
          lastSibling = newChild;
        } else if (typeof newChild === "string") {
          const textNode = document.createTextNode(newChild);
          if (lastSibling) {
            parent.insertBefore(textNode, lastSibling.nextElementSibling);
          } else {
            parent.prepend(textNode);
          }
          lastSibling = textNode;
        }
      }
    }

    // Remove unused old children
    oldArray.forEach((el) => {
      const key = this.getKey(el) || `index-${oldArray.indexOf(el)}`;
      if (!usedOldKeys.has(key)) {
        el.remove();
        operations.push({ type: "remove", key });
      }
    });

    if (operations.length > 0) {
      console.log("[DEBUG] DOMReconciler operations:", operations);
    }

    return operations.length > 0;
  }

  /**
   * Perform selective update of a mounted component.
   * @param {Component} component - Component instance
   * @param {Node} newRendered - Newly rendered DOM element
   * @returns {boolean} True if component was updated
   */
  static updateComponent(component, newRendered) {
    if (!component._el) {
      console.warn("[DOMReconciler] Component not mounted:", component);
      return false;
    }

    const oldEl = component._el;
    const tagName = newRendered.tagName;

    // If tag changed, full replacement
    if (oldEl.tagName !== tagName) {
      console.log("[DEBUG] DOMReconciler: Tag changed, full replace");
      oldEl.replaceWith(newRendered);
      component._el = newRendered;
      newRendered._component = component;
      return true;
    }

    // Try to reconcile children
    let changed = false;

    // Update attributes
    if (this.updateAttributes(oldEl, oldEl._oldProps || {}, newRendered._props || {})) {
      changed = true;
    }

    // Store new props
    newRendered._oldProps = newRendered._props || {};

    // Reconcile children
    const oldChildren = Array.from(oldEl.childNodes);
    const newChildren = Array.from(newRendered.childNodes);

    if (this.reconcileChildren(oldEl, oldChildren, newChildren)) {
      changed = true;
    }

    return changed;
  }
}

window.DOMReconciler = DOMReconciler;
