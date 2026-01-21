/**
 * Loading Spinner Component
 * Animated spinner with size variants and accessibility support
 */
class LoadingSpinner {
  /**
   * Creates a new LoadingSpinner instance.
   * @param {Object} [options={}] - Spinner configuration options.
   * @param {string} [options.size="medium"] - Spinner size: small, medium, or large.
   * @param {string} [options.text=""] - Optional text to display below the spinner.
   * @param {string} [options.color="currentColor"] - SVG stroke color.
   */
  constructor(options = {}) {
    this.size = options.size || "medium";
    this.text = options.text || "";
    this.color = options.color || "currentColor";
  }

  /**
   * Renders and returns the spinner DOM element.
   * @returns {HTMLElement} The spinner container div with SVG animation.
   */
  render() {
    const spinner = document.createElement("div");
    spinner.className = `spinner spinner--${this.size}`;
    spinner.setAttribute("role", "status");
    spinner.setAttribute("aria-live", "polite");

    spinner.innerHTML = `
      <svg class="spinner__svg" viewBox="0 0 50 50" fill="none" aria-hidden="true">
        <circle class="spinner__track" cx="25" cy="25" r="20" stroke-width="4" stroke="currentColor" opacity="0.25"/>
        <circle class="spinner__progress" cx="25" cy="25" r="20" stroke-width="4" stroke="currentColor" stroke-linecap="round"/>
      </svg>
      ${this.text ? `<span class="spinner__text">${this._escapeHtml(this.text)}</span>` : ""}
    `;

    return spinner;
  }

  _escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Updates the spinner text content.
   * @param {string} text - The new text to display.
   * @returns {void}
   */
  setText(text) {
    this.text = text;
  }

  /**
   * Updates the spinner size variant.
   * @param {string} size - The new size: small, medium, or large.
   * @returns {void}
   */
  setSize(size) {
    this.size = size;
  }

  /**
   * Cleans up the spinner instance.
   * @returns {void}
   */
  destroy() {
    this.text = "";
  }
}

if (typeof window !== "undefined") {
  window.LoadingSpinner = LoadingSpinner;
}
