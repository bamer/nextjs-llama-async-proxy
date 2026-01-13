/**
 * Toast Manager - Notification queue and API
 */

window.ToastManager = {
  queue: [],
  activeToasts: new Map(),
  maxVisible: 3,
  defaultDuration: 5000,

  show(message, options = {}) {
    const id = AppUtils.generateId();
    const { type = "info", duration = this.defaultDuration, action = null, persistent = false, title = null } = options;
    const toast = { id, message, type, duration, action, persistent, title, timestamp: Date.now() };
    this.queue.push(toast);
    this._processQueue();
    if (duration > 0 && !persistent && !action) setTimeout(() => this.dismiss(id), duration);
    return id;
  },

  success(message, options = {}) { return this.show(message, { ...options, type: "success" }); },
  error(message, options = {}) { return this.show(message, { ...options, type: "error" }); },
  warning(message, options = {}) { return this.show(message, { ...options, type: "warning" }); },
  info(message, options = {}) { return this.show(message, { ...options, type: "info" }); },
  loading(message) { return this.show(message, { type: "loading", persistent: true, duration: 0 }); },

  update(id, message, options = {}) {
    const toastEl = document.getElementById(`toast-${id}`);
    if (toastEl) {
      toastEl.querySelector(".toast-message").textContent = message;
      if (options.type) toastEl.className = `toast toast-${options.type}`;
    }
  },

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

  dismissAll() {
    document.querySelectorAll(".toast").forEach((el) => el.classList.add("dismissing"));
    setTimeout(() => {
      document.querySelectorAll(".toast.dismissing").forEach((el) => el.remove());
      this.activeToasts.clear();
      this.queue = [];
    }, 300);
  },

  _processQueue() {
    const container = this._getContainer();
    for (const [id, el] of this.activeToasts) {
      if (!document.getElementById(`toast-${id}`)) this.activeToasts.delete(id);
    }
    while (this.queue.length > 0 && this.activeToasts.size < this.maxVisible) {
      const toast = this.queue.shift();
      this._renderToast(toast);
    }
  },

  _getContainer() {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      document.body.appendChild(container);
    }
    return container;
  },

  _getIcon(type) {
    const icons = {
      success: `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`,
      error: `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`,
      warning: `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>`,
      info: `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`
    };
    return icons[type] || icons.info;
  },

  _renderToast(toast) {
    const container = this._getContainer();
    const { id, message, type, action, title } = toast;
    const toastEl = document.createElement("div");
    toastEl.id = `toast-${id}`;
    toastEl.className = `toast toast-${type}`;
    toastEl.setAttribute("role", "alert");
    toastEl.setAttribute("aria-live", "polite");

    let html = type === "loading"
      ? `<div class="toast-icon"><span class="spinner-sm"></span></div>`
      : `<div class="toast-icon">${this._getIcon(type)}</div>`;

    html += `<div class="toast-content">${title ? `<div class="toast-title">${title}</div>` : ""}<div class="toast-message">${message}</div></div>`;

    if (action) {
      html += `<button class="toast-action" data-action="retry">${action.label || "Retry"}</button>`;
    }

    html += `<button class="toast-close" data-action="dismiss" aria-label="Dismiss">
      <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
    </button>`;

    toastEl.innerHTML = html;
    toastEl.addEventListener("click", (e) => {
      const target = e.target.closest("[data-action]");
      if (!target) return;
      if (target.dataset.action === "dismiss") this.dismiss(id);
      else if (target.dataset.action === "retry" && toast.action?.handler) { toast.action.handler(); this.dismiss(id); }
    });

    container.appendChild(toastEl);
    this.activeToasts.set(id, toastEl);
    requestAnimationFrame(() => toastEl.classList.add("visible"));
    console.log(`[TOAST:${type}]`, message);
  }
};

window.showToast = (message, typeOrOptions, options) => {
  if (typeof typeOrOptions === "string") return ToastManager.show(message, { type: typeOrOptions, ...options });
  return ToastManager.show(message, typeOrOptions);
};
