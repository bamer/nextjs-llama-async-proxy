/**
 * Toast Notification System
 * Provides consistent, accessible user feedback with action buttons
 */

window.ToastManager = {
  queue: [],
  activeToasts: new Map(),
  maxVisible: 3,
  defaultDuration: 5000,

  /**
   * Show a toast notification
   * @param {string} message - The message to display
   * @param {object} options - Configuration options
   * @returns {string} toast ID
   */
  show(message, options = {}) {
    const id = AppUtils.generateId();
    const {
      type = "info",
      duration = this.defaultDuration,
      action = null,
      persistent = false,
      title = null
    } = options;

    const toast = {
      id,
      message,
      type,
      duration,
      action,
      persistent,
      title,
      timestamp: Date.now()
    };

    this.queue.push(toast);
    this._processQueue();

    // Auto-dismiss unless persistent or has action
    if (duration > 0 && !persistent && !action) {
      setTimeout(() => this.dismiss(id), duration);
    }

    return id;
  },

  /**
   * Show success toast
   */
  success(message, options = {}) {
    return this.show(message, { ...options, type: "success" });
  },

  /**
   * Show error toast
   */
  error(message, options = {}) {
    return this.show(message, { ...options, type: "error" });
  },

  /**
   * Show warning toast
   */
  warning(message, options = {}) {
    return this.show(message, { ...options, type: "warning" });
  },

  /**
   * Show info toast
   */
  info(message, options = {}) {
    return this.show(message, { ...options, type: "info" });
  },

  /**
   * Show loading toast (non-dismissible)
   */
  loading(message) {
    return this.show(message, {
      type: "loading",
      persistent: true,
      duration: 0
    });
  },

  /**
   * Update an existing toast's message
   */
  update(id, message, options = {}) {
    const toastEl = document.getElementById(`toast-${id}`);
    if (toastEl) {
      toastEl.querySelector(".toast-message").textContent = message;
      if (options.type) {
        toastEl.className = `toast toast-${options.type}`;
      }
    }
  },

  /**
   * Dismiss a specific toast
   */
  dismiss(id) {
    const toastEl = document.getElementById(`toast-${id}`);
    if (toastEl) {
      toastEl.classList.add("dismissing");
      setTimeout(() => {
        toastEl.remove();
        this.activeToasts.delete(id);
        this._processQueue();
      }, 300);
    }
  },

  /**
   * Dismiss all toasts
   */
  dismissAll() {
    document.querySelectorAll(".toast").forEach((el) => {
      el.classList.add("dismissing");
    });
    setTimeout(() => {
      document.querySelectorAll(".toast.dismissing").forEach((el) => el.remove());
      this.activeToasts.clear();
      this.queue = [];
    }, 300);
  },

  /**
   * Process the toast queue
   */
  _processQueue() {
    const container = this._getContainer();
    const visibleCount = this.activeToasts.size;

    // Remove any toasts that are no longer in DOM
    for (const [id, el] of this.activeToasts) {
      if (!document.getElementById(`toast-${id}`)) {
        this.activeToasts.delete(id);
      }
    }

    // Show new toasts if under limit
    while (this.queue.length > 0 && visibleCount < this.maxVisible) {
      const toast = this.queue.shift();
      this._renderToast(toast);
    }
  },

  /**
   * Render a single toast
   */
  _renderToast(toast) {
    const container = this._getContainer();
    const { id, message, type, action, title } = toast;

    const toastEl = document.createElement("div");
    toastEl.id = `toast-${id}`;
    toastEl.className = `toast toast-${type}`;
    toastEl.setAttribute("role", "alert");
    toastEl.setAttribute("aria-live", "polite");

    let html = "";
    if (type === "loading") {
      html = `
        <div class="toast-icon">
          <span class="spinner-sm"></span>
        </div>
      `;
    } else {
      const icon = this._getIcon(type);
      html = `<div class="toast-icon">${icon}</div>`;
    }

    html += `
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ""}
        <div class="toast-message">${message}</div>
      </div>
    `;

    if (action) {
      html += `
        <button class="toast-action" data-action="retry">
          ${action.label || "Retry"}
        </button>
      `;
    }

    html += `
      <button class="toast-close" data-action="dismiss" aria-label="Dismiss">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    `;

    toastEl.innerHTML = html;

    // Event handlers
    toastEl.addEventListener("click", (e) => {
      const target = e.target.closest("[data-action]");
      if (!target) return;

      const actionType = target.dataset.action;
      if (actionType === "dismiss") {
        this.dismiss(id);
      } else if (actionType === "retry" && toast.action?.handler) {
        toast.action.handler();
        this.dismiss(id);
      }
    });

    container.appendChild(toastEl);
    this.activeToasts.set(id, toastEl);

    // Animate in
    requestAnimationFrame(() => {
      toastEl.classList.add("visible");
    });

    // Log for debugging
    console.log(`[TOAST:${type}]`, message);
  },

  /**
   * Get the toast container, creating it if needed
   */
  _getContainer() {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      document.body.appendChild(container);
    }
    return container;
  },

  /**
   * Get icon SVG for toast type
   */
  _getIcon(type) {
    const icons = {
      success: `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`,
      error: `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`,
      warning: `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>`,
      info: `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`
    };
    return icons[type] || icons.info;
  }
};

// Global convenience function
window.showToast = (message, typeOrOptions, options) => {
  if (typeof typeOrOptions === "string") {
    return ToastManager.show(message, { type: typeOrOptions, ...options });
  }
  return ToastManager.show(message, typeOrOptions);
};

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = window.ToastManager;
}
