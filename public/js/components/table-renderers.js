/**
 * Table Cell Renderers
 */

const TableCellRenderers = {
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

  fileSize(bytes) {
    if (!bytes || bytes === 0) return "-";
    return window.AppUtils?.formatBytes(bytes) || String(bytes);
  },

  number(value, options = {}) {
    if (value === null || value === undefined) return options.default || "-";
    const { decimals = 0, suffix = "" } = options;
    return `${Number(value).toFixed(decimals)}${suffix}`;
  },

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

  truncate(text, options = {}) {
    const { maxLength = 50 } = options;
    if (!text) return options.default || "-";
    const str = String(text);
    return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str;
  },

  boolean(value, options = {}) {
    const { trueIcon = "✓", falseIcon = "✗" } = options;
    if (value === null || value === undefined) return options.default || "-";
    return Component.h("span", { className: value ? "text-success" : "text-danger" }, value ? trueIcon : falseIcon);
  },
};

window.TableCellRenderers = TableCellRenderers;
