/**
 * DOM Utilities
 * Helper functions for DOM manipulation
 */

const DomUtils = {
  /**
   * Find element by selector within context
   * @param {string} selector - CSS selector
   * @param {HTMLElement} context - Parent element to search in
   * @returns {HTMLElement|null} Found element or null
   */
  find(selector, context = document) {
    return context.querySelector(selector);
  },

  /**
   * Find all elements by selector
   * @param {string} selector - CSS selector
   * @param {HTMLElement} context - Parent element to search in
   * @returns {NodeList} All found elements
   */
  findAll(selector, context = document) {
    return context.querySelectorAll(selector);
  },

  /**
   * Create element with attributes and children
   * @param {string} tagName - HTML tag name
   * @param {Object} attributes - Attributes to set
   * @param {...HTMLElement|string} children - Child elements or text
   * @returns {HTMLElement} Created element
   */
  create(tagName, attributes = {}, ...children) {
    const element = document.createElement(tagName);

    Object.entries(attributes).forEach(([key, value]) => {
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
        if (typeof value === 'function') {
          value(element);
        } else {
          element.ref = value;
        }
      } else if (value !== null && value !== undefined) {
        element.setAttribute(key, value);
      }
    });

    children.forEach(child => {
      if (child === null || child === undefined) return;
      if (typeof child === 'string' || typeof child === 'number') {
        element.appendChild(document.createTextNode(String(child)));
      } else if (child instanceof HTMLElement) {
        element.appendChild(child);
      }
    });

    return element;
  },

  /**
   * Add class to element
   * @param {HTMLElement} element - Target element
   * @param {string} className - Class name to add
   */
  addClass(element, className) {
    if (element) {
      element.classList.add(className);
    }
  },

  /**
   * Remove class from element
   * @param {HTMLElement} element - Target element
   * @param {string} className - Class name to remove
   */
  removeClass(element, className) {
    if (element) {
      element.classList.remove(className);
    }
  },

  /**
   * Toggle class on element
   * @param {HTMLElement} element - Target element
   * @param {string} className - Class name to toggle
   */
  toggleClass(element, className) {
    if (element) {
      element.classList.toggle(className);
    }
  },

  /**
   * Check if element has class
   * @param {HTMLElement} element - Target element
   * @param {string} className - Class name to check
   * @returns {boolean} True if element has class
   */
  hasClass(element, className) {
    return element ? element.classList.contains(className) : false;
  },

  /**
   * Show element (remove hidden class)
   * @param {HTMLElement} element - Target element
   */
  show(element) {
    if (element) {
      element.style.display = '';
      element.classList.remove('hidden');
    }
  },

  /**
   * Hide element (add hidden class)
   * @param {HTMLElement} element - Target element
   */
  hide(element) {
    if (element) {
      element.style.display = 'none';
      element.classList.add('hidden');
    }
  },

  /**
   * Set element text content
   * @param {HTMLElement} element - Target element
   * @param {string} text - Text to set
   */
  setText(element, text) {
    if (element) {
      element.textContent = text;
    }
  },

  /**
   * Get element text content
   * @param {HTMLElement} element - Target element
   * @returns {string} Text content
   */
  getText(element) {
    return element ? element.textContent : '';
  },

  /**
   * Set element attribute
   * @param {HTMLElement} element - Target element
   * @param {string} name - Attribute name
   * @param {string} value - Attribute value
   */
  setAttr(element, name, value) {
    if (element) {
      element.setAttribute(name, value);
    }
  },

  /**
   * Get element attribute
   * @param {HTMLElement} element - Target element
   * @param {string} name - Attribute name
   * @returns {string|null} Attribute value
   */
  getAttr(element, name) {
    return element ? element.getAttribute(name) : null;
  },

  /**
   * Remove element from DOM
   * @param {HTMLElement} element - Element to remove
   */
  remove(element) {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  },

  /**
   * Insert element before reference element
   * @param {HTMLElement} newElement - Element to insert
   * @param {HTMLElement} referenceElement - Reference element
   */
  insertBefore(newElement, referenceElement) {
    if (referenceElement && referenceElement.parentNode) {
      referenceElement.parentNode.insertBefore(newElement, referenceElement);
    }
  },

  /**
   * Insert element after reference element
   * @param {HTMLElement} newElement - Element to insert
   * @param {HTMLElement} referenceElement - Reference element
   */
  insertAfter(newElement, referenceElement) {
    if (referenceElement && referenceElement.parentNode) {
      if (referenceElement.nextSibling) {
        referenceElement.parentNode.insertBefore(newElement, referenceElement.nextSibling);
      } else {
        referenceElement.parentNode.appendChild(newElement);
      }
    }
  },

  /**
   * Replace element with another element
   * @param {HTMLElement} newElement - New element
   * @param {HTMLElement} oldElement - Element to replace
   */
  replace(newElement, oldElement) {
    if (oldElement && oldElement.parentNode) {
      oldElement.parentNode.replaceChild(newElement, oldElement);
    }
  },

  /**
   * Get or set data attribute
   * @param {HTMLElement} element - Target element
   * @param {string} key - Data key
   * @param {any} value - Value to set (if providing)
   * @returns {any} Value if getting, undefined if setting
   */
  data(element, key, value) {
    if (!element) return undefined;
    const dataKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    if (value === undefined) {
      return element.dataset[dataKey];
    }
    element.dataset[dataKey] = value;
    return undefined;
  },

  /**
   * Get element's closest ancestor matching selector
   * @param {HTMLElement} element - Starting element
   * @param {string} selector - CSS selector
   * @returns {HTMLElement|null} Found ancestor or null
   */
  closest(element, selector) {
    return element ? element.closest(selector) : null;
  }
};

// Export for use in other modules
window.DomUtils = DomUtils;
