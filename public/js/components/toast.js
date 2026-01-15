/**
 * Toast Notification Component
 * Displays temporary notifications in the top-right corner
 * Supports success, error, warning, and info types with auto-dismiss
 */
class ToastNotification {
  constructor(options = {}) {
    this.position = options.position || "top-right";
    this.timeout = options.timeout || 5000;
    this.toasts = new Map();
    this.container = null;
    this.counter = 0;
    this._init();
  }

  _init() {
    this._createContainer();
  }

  _createContainer() {
    const id = `toast-container-${this.position.replace("-", "-")}`;
    this.container = document.getElementById(id);
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = id;
      this.container.className = `toast-container toast-container--${this.position}`;
      this.container.setAttribute("role", "region");
      this.container.setAttribute("aria-label", "Notifications");
      this.container.setAttribute("aria-live", "polite");
      document.body.appendChild(this.container);
    }
  }

  _createToastElement(message, type = "info", options = {}) {
    const toastId = `toast-${++this.counter}-${Date.now()}`;
    const toast = document.createElement("div");
    toast.id = toastId;
    toast.className = `toast toast--${type}`;
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-atomic", "true");
    toast.setAttribute("tabindex", "0");

    const icons = {
      success: "<svg class=\"toast__icon\" viewBox=\"0 0 20 20\" fill=\"currentColor\"><path fill-rule=\"evenodd\" d=\"M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z\" clip-rule=\"evenodd\"/></svg>",
      error: "<svg class=\"toast__icon\" viewBox=\"0 0 20 20\" fill=\"currentColor\"><path fill-rule=\"evenodd\" d=\"M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z\" clip-rule=\"evenodd\"/></svg>",
      warning: "<svg class=\"toast__icon\" viewBox=\"0 0 20 20\" fill=\"currentColor\"><path fill-rule=\"evenodd\" d=\"M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z\" clip-rule=\"evenodd\"/></svg>",
      info: "<svg class=\"toast__icon\" viewBox=\"0 0 20 20\" fill=\"currentColor\"><path fill-rule=\"evenodd\" d=\"M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z\" clip-rule=\"evenodd\"/></svg>",
    };

    toast.innerHTML = `
      ${icons[type] || icons.info}
      <div class="toast__content">
        <p class="toast__message">${this._escapeHtml(message)}</p>
        ${options.description ? `<p class="toast__description">${this._escapeHtml(options.description)}</p>` : ""}
      </div>
      <button class="toast__dismiss" aria-label="Dismiss notification" type="button">
        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
      </button>
    `;

    this._bindToastEvents(toast, toastId);
    return toast;
  }

  _bindToastEvents(toast, toastId) {
    const dismissBtn = toast.querySelector(".toast__dismiss");
    dismissBtn.addEventListener("click", () => this.dismiss(toastId));
    toast.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.dismiss(toastId);
      }
      if (e.key === "Escape") {
        this.dismiss(toastId);
      }
    });
  }

  _escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  show(message, type = "info", options = {}) {
    const toast = this._createToastElement(message, type, options);
    this.container.appendChild(toast);
    const toastId = toast.id;
    this.toasts.set(toastId, { element: toast, type, timeout: null });

    requestAnimationFrame(() => {
      toast.classList.add("toast--visible");
    });

    if (options.timeout !== false) {
      const timeout = options.timeout || this.timeout;
      const timeoutId = setTimeout(() => this.dismiss(toastId), timeout);
      this.toasts.get(toastId).timeout = timeoutId;
    }

    toast.addEventListener("mouseenter", () => {
      const data = this.toasts.get(toastId);
      if (data && data.timeout) {
        clearTimeout(data.timeout);
        data.timeout = null;
      }
    });

    toast.addEventListener("mouseleave", () => {
      const data = this.toasts.get(toastId);
      if (data && !data.timeout) {
        const timeout = options.timeout || this.timeout;
        data.timeout = setTimeout(() => this.dismiss(toastId), timeout);
      }
    });

    return toastId;
  }

  success(message, options = {}) {
    return this.show(message, "success", options);
  }

  error(message, options = {}) {
    return this.show(message, "error", options);
  }

  warning(message, options = {}) {
    return this.show(message, "warning", options);
  }

  info(message, options = {}) {
    return this.show(message, "info", options);
  }

  dismiss(toastId) {
    const data = this.toasts.get(toastId);
    if (!data) return;

    if (data.timeout) {
      clearTimeout(data.timeout);
    }

    const toast = data.element;
    toast.classList.remove("toast--visible");
    toast.classList.add("toast--hiding");

    toast.addEventListener("transitionend", () => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      this.toasts.delete(toastId);
    });

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      this.toasts.delete(toastId);
    }, 300);
  }

  dismissAll() {
    for (const toastId of this.toasts.keys()) {
      this.dismiss(toastId);
    }
  }

  destroy() {
    this.dismissAll();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.toasts.clear();
  }
}

if (typeof window !== "undefined") {
  window.ToastNotification = ToastNotification;
}
