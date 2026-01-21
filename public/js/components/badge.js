/**
 * Status Badge Component
 * Displays status indicators with variants and optional pulse animation
 */
class StatusBadge {
  /**
   * Creates a new StatusBadge instance.
   * @param {Object} [options={}] - Badge configuration options.
   * @param {string} [options.variant="idle"] - Badge variant: running, idle, loading, error, warning.
   * @param {string} [options.text=""] - Optional text to display in the badge.
   * @param {boolean} [options.showIcon=false] - Whether to show the variant icon.
   * @param {boolean} [options.pulse=false] - Whether to show pulse animation (for loading state).
   */
  constructor(options = {}) {
    this.variant = options.variant || "idle";
    this.text = options.text || "";
    this.showIcon = options.showIcon || false;
    this.pulse = options.pulse || false;
    this._icons = {
      running: "<svg class=\"badge__icon\" viewBox=\"0 0 20 20\" fill=\"currentColor\"><path fill-rule=\"evenodd\" d=\"M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z\" clip-rule=\"evenodd\"/></svg>",
      idle: "<svg class=\"badge__icon\" viewBox=\"0 0 20 20\" fill=\"currentColor\"><path fill-rule=\"evenodd\" d=\"M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z\" clip-rule=\"evenodd\"/></svg>",
      loading: "<svg class=\"badge__icon\" viewBox=\"0 0 20 20\" fill=\"currentColor\"><path fill-rule=\"evenodd\" d=\"M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z\" clip-rule=\"evenodd\"/></svg>",
      error: "<svg class=\"badge__icon\" viewBox=\"0 0 20 20\" fill=\"currentColor\"><path fill-rule=\"evenodd\" d=\"M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z\" clip-rule=\"evenodd\"/></svg>",
      warning: "<svg class=\"badge__icon\" viewBox=\"0 0 20 20\" fill=\"currentColor\"><path fill-rule=\"evenodd\" d=\"M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z\" clip-rule=\"evenodd\"/></svg>",
    };
  }

  /**
   * Renders and returns the badge DOM element.
   * @returns {HTMLElement} The badge span element with variant styling and ARIA attributes.
   */
  render() {
    const badge = document.createElement("span");
    const classes = ["badge", `badge--${this.variant}`];
    if (this.pulse && this.variant === "loading") {
      classes.push("badge--pulse");
    }
    badge.className = classes.join(" ");

    const ariaLabel = this._getAriaLabel();
    badge.setAttribute("role", "status");
    badge.setAttribute("aria-label", ariaLabel);

    const icon = this.showIcon ? this._getIcon() : "";
    const text = this.text ? `<span class="badge__text">${this._escapeHtml(this.text)}</span>` : "";

    if (this.showIcon || this.text) {
      badge.innerHTML = `${icon}${text}`;
    } else {
      badge.setAttribute("aria-hidden", "true");
    }

    return badge;
  }

  _getIcon() {
    return this._icons[this.variant] || "";
  }

  _getAriaLabel() {
    const labels = {
      running: "Running",
      idle: "Idle",
      loading: "Loading",
      error: "Error",
      warning: "Warning",
    };
    const baseLabel = labels[this.variant] || this.variant;
    if (this.text) {
      return `${baseLabel}: ${this.text}`;
    }
    return baseLabel;
  }

  _escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Updates the badge variant/style.
   * @param {string} variant - The new variant: running, idle, loading, error, warning.
   * @returns {void}
   */
  setVariant(variant) {
    this.variant = variant;
  }

  /**
   * Updates the badge text content.
   * @param {string} text - The new text to display.
   * @returns {void}
   */
  setText(text) {
    this.text = text;
  }

  /**
   * Toggles the pulse animation state.
   * @param {boolean} pulse - Whether to enable the pulse animation.
   * @returns {void}
   */
  setPulse(pulse) {
    this.pulse = pulse;
  }

  /**
   * Cleans up the badge instance and resets all properties.
   * @returns {void}
   */
  destroy() {
    this.variant = "idle";
    this.text = "";
    this.showIcon = false;
    this.pulse = false;
  }
}

if (typeof window !== "undefined") {
  window.StatusBadge = StatusBadge;
}
