/**
 * Table Cell Renderers
 * Collection of utility functions for rendering table cell content
 */

const TableCellRenderers = {
  /**
   * Renders a status badge with color-coded variant based on status value.
   * @param {string} status - The status value to display.
   * @param {Object} [options={}] - Rendering options.
   * @param {Object} [options.variants={}] - Custom status-to-variant mapping.
   * @param {string} [options.defaultVariant="default"] - Default variant for unmapped statuses.
   * @returns {HTMLElement} A span element with badge styling.
   */
  statusBadge(status, options = {}) {
    const { variants = {}, defaultVariant = "default" } = options;
    const variantClassMap = {
      success: ["loaded", "running", "active", "online"],
      warning: ["loading", "pending", "waiting"],
      danger: ["error", "failed", "stopped", "offline"],
    };
    let finalVariant = variants[status] || defaultVariant;
    for (const [cls, statuses] of Object.entries(variantClassMap)) {
      if (statuses.includes(String(status).toLowerCase())) { finalVariant = cls; break; }
    }
    return Component.h("span", { className: `badge badge-${finalVariant}` }, String(status));
  },

  /**
   * Formats bytes into human-readable file size string.
   * @param {number} bytes - The size in bytes.
   * @returns {string} Formatted size string (e.g., "1.50 MB") or "-" if null/zero.
   */
  fileSize(bytes) {
    if (!bytes || bytes === 0) return "-";
    return window.AppUtils?.formatBytes(bytes) || String(bytes);
  },

  /**
   * Formats a numeric value with optional decimals and suffix.
   * @param {number} value - The number to format.
   * @param {Object} [options={}] - Formatting options.
   * @param {number} [options.decimals=0] - Number of decimal places.
   * @param {string} [options.suffix=""] - String to append after the number.
   * @param {string} [options.default="-"] - Value to show if input is null/undefined.
   * @returns {string} The formatted number string.
   */
  number(value, options = {}) {
    if (value === null || value === undefined) return options.default || "-";
    const { decimals = 0, suffix = "" } = options;
    return `${Number(value).toFixed(decimals)}${suffix}`;
  },

  /**
   * Formats a timestamp value into a human-readable date/time string.
   * @param {number} value - The timestamp in milliseconds or seconds.
   * @param {Object} [options={}] - Formatting options.
   * @param {string} [options.format="time"] - Format type: time, date, datetime, or relative.
   * @param {string} [options.default="--:--:--"] - Value to show if input is null.
   * @returns {string} The formatted date/time string.
   */
  timestamp(value, options = {}) {
    if (!value) return options.default || "--:--:--";
    const { format = "time" } = options;
    const ms = value < 1e11 ? value * 1000 : value;
    const d = new Date(ms);
    if (format === "time") return d.toLocaleTimeString();
    if (format === "date") return d.toLocaleDateString();
    if (format === "datetime") return d.toLocaleString();
    if (format === "relative") return window.AppUtils?.formatRelativeTime(ms) || d.toLocaleString();
    return d.toLocaleString();
  },

  /**
   * Truncates text to a maximum length with ellipsis.
   * @param {string} text - The text to truncate.
   * @param {Object} [options={}] - Truncation options.
   * @param {number} [options.maxLength=50] - Maximum length before truncation.
   * @param {string} [options.default="-"] - Value to show if text is null/empty.
   * @returns {string} The truncated text with ellipsis or the default value.
   */
  truncate(text, options = {}) {
    const { maxLength = 50 } = options;
    if (!text) return options.default || "-";
    const str = String(text);
    return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str;
  },

  /**
   * Renders a boolean value as a styled checkmark or X icon.
   * @param {boolean} value - The boolean value to render.
   * @param {Object} [options={}] - Display options.
   * @param {string} [options.trueIcon="✓"] - Icon for true values.
   * @param {string} [options.falseIcon="✗"] - Icon for false values.
   * @param {string} [options.default="-"] - Value to show if input is null/undefined.
   * @returns {HTMLElement} A span element with conditional text and styling.
   */
  boolean(value, options = {}) {
    const { trueIcon = "✓", falseIcon = "✗" } = options;
    if (value === null || value === undefined) return options.default || "-";
    return Component.h("span", { className: value ? "text-success" : "text-danger" }, value ? trueIcon : falseIcon);
  },
};

window.TableCellRenderers = TableCellRenderers;
