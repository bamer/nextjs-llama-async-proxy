/**
 * Modal Dialog Component
 * Accessible modal dialog with focus trapping, keyboard navigation, and slot support
 */
class ModalDialog {
  constructor(options = {}) {
    this.id = options.id || `modal-${Date.now()}`;
    this.closable = options.closable !== false;
    this.closeOnOverlay = options.closeOnOverlay !== false;
    this._isOpen = false;
    this._previousActiveElement = null;
    this._callbacks = {};
    this._modalElement = null;
    this._createModalElement();
  }

  _createModalElement() {
    this._modalElement = document.createElement("div");
    this._modalElement.id = this.id;
    this._modalElement.className = "modal-overlay";
    this._modalElement.setAttribute("role", "dialog");
    this._modalElement.setAttribute("aria-modal", "true");
    this._modalElement.setAttribute("tabindex", "-1");
    this._modalElement.innerHTML = `
      <div class="modal-container" role="document">
        <div class="modal__header" id="${this.id}-header"></div>
        <div class="modal__body" id="${this.id}-body"></div>
        <div class="modal__footer" id="${this.id}-footer"></div>
        ${this.closable ? '<button class="modal__close" aria-label="Close modal" type="button"><svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg></button>' : ""}
      </div>
    `;
    this._bindEvents();
  }

  _bindEvents() {
    const overlay = this._modalElement;
    if (overlay.querySelector(".modal__close")) {
      overlay.querySelector(".modal__close").addEventListener("click", () => this.close());
    }
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay && this.closeOnOverlay) this.close();
    });
    overlay.addEventListener("keydown", (e) => {
      if (!this._isOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        this.close();
      } else if (e.key === "Tab") {
        this._trapFocus(e);
      }
    });
  }

  _trapFocus(e) {
    const focusable = Array.from(this._modalElement.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  setHeader(content) {
    const headerEl = this._modalElement.querySelector(`#${this.id}-header`);
    if (headerEl) {
      headerEl.innerHTML = content;
      const heading = headerEl.querySelector("h1, h2, h3, h4, h5, h6");
      if (heading) {
        if (!heading.id) heading.id = `modal-heading-${this.id}`;
        this._modalElement.setAttribute("aria-labelledby", heading.id);
      }
    }
  }

  setBody(content) {
    const bodyEl = this._modalElement.querySelector(`#${this.id}-body`);
    if (bodyEl) bodyEl.innerHTML = content;
  }

  setFooter(content) {
    const footerEl = this._modalElement.querySelector(`#${this.id}-footer`);
    if (footerEl) {
      footerEl.innerHTML = content;
      this._modalElement.setAttribute("aria-describedby", `${this.id}-footer`);
    }
  }

  open() {
    if (this._isOpen) return;
    this._previousActiveElement = document.activeElement;
    document.body.appendChild(this._modalElement);
    document.body.classList.add("modal-open");
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => {
      this._modalElement.classList.add("modal-overlay--visible");
      this._isOpen = true;
      const focusable = Array.from(this._modalElement.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter((el) => !el.hasAttribute("disabled"));
      (focusable[0] || this._modalElement).focus();
    });
  }

  close() {
    if (!this._isOpen) return;
    this._modalElement.classList.remove("modal-overlay--visible");
    document.body.classList.remove("modal-open");
    document.body.style.overflow = "";
    setTimeout(() => {
      if (this._modalElement.parentNode) {
        this._modalElement.parentNode.removeChild(this._modalElement);
      }
      this._isOpen = false;
      if (this._previousActiveElement && this._previousActiveElement.focus) {
        this._previousActiveElement.focus();
      }
      this._previousActiveElement = null;
    }, 300);
  }

  isOpen() {
    return this._isOpen;
  }

  on(event, callback) {
    if (!this._callbacks[event]) this._callbacks[event] = [];
    this._callbacks[event].push(callback);
  }

  off(event, callback) {
    if (this._callbacks[event]) {
      this._callbacks[event] = this._callbacks[event].filter((cb) => cb !== callback);
    }
  }

  render() {
    return this._modalElement;
  }

  destroy() {
    this.close();
    this._callbacks = {};
    this._modalElement = null;
  }
}

if (typeof window !== "undefined") {
  window.ModalDialog = ModalDialog;
}
