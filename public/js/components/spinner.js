/**
 * Loading Spinner Component
 * Animated spinner with size variants and accessibility support
 */
class LoadingSpinner {
  constructor(options = {}) {
    this.size = options.size || "medium";
    this.text = options.text || "";
    this.color = options.color || "currentColor";
  }

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

  setText(text) {
    this.text = text;
  }

  setSize(size) {
    this.size = size;
  }

  destroy() {
    this.text = "";
  }
}

if (typeof window !== "undefined") {
  window.LoadingSpinner = LoadingSpinner;
}
