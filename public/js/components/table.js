/**
 * Table Component - Event-Driven DOM Updates
 * Reusable Table Component with sortable columns and action buttons
 */

class Table extends Component {
  constructor(props) {
    super(props);
    console.log("[DEBUG] Table constructor:", props);

    // Direct properties instead of state
    this.sortBy = props.sortBy || null;
    this.sortOrder = props.sortOrder || "asc";
  }

  /**
   * Binds event handlers for sortable column clicks and action buttons.
   * @returns {void}
   */
  bindEvents() {
    // Sort column clicks
    this.on("click", "[data-sort]", (e, target) => {
      const th = target.closest("[data-sort]");
      if (th) {
        const field = th.dataset.sort;
        this.handleSort(field);
      }
    });

    // Action button clicks
    this.on("click", "[data-action]", (e) => {
      this.handleAction(e);
    });
  }

  /**
   * Renders the complete table with header, body, and optional empty state.
   * @returns {HTMLElement} The rendered table element.
   */
  render() {
    const {
      columns,
      data = [],
      keyField = "id",
      className = "",
      onRowClick = null,
      sortable = true,
    } = this.props;

    console.log("[DEBUG] Table.render:", {
      columnsCount: columns.length,
      dataCount: data.length,
      className,
    });

    // Sort data if sortBy is set
    const sortedData = this.sortBy ? this._sortData(data) : data;

    // Render header
    const header = this._renderHeader(columns, sortable);

    // Render body
    const body = this._renderBody(sortedData, columns, keyField, onRowClick);

    return Component.h(
      "table",
      { className: `table ${className}` },
      Component.h("thead", {}, header),
      body
    );
  }

  /**
   * Render table header with sortable columns
   */
  _renderHeader(columns, sortable) {
    const cells = columns.map((col) => {
      const isSorted = this.sortBy === col.key;
      const sortIcon = isSorted ? (this.sortOrder === "asc" ? " ↑" : " ↓") : "";
      const sortableClass = sortable && col.sortable !== false ? "sortable" : "";
      const icon = col.icon || "";

      return Component.h(
        "th",
        {
          className: sortableClass,
          "data-sort": col.key,
          style:
            col.sortable === false
              ? {}
              : { cursor: sortable ? "pointer" : "default", userSelect: "none" },
        },
        icon ? `${icon} ${col.label}${sortIcon}` : `${col.label}${sortIcon}`
      );
    });

    return Component.h("tr", {}, ...cells);
  }

  /**
   * Render table body with rows
   */
  _renderBody(data, columns, keyField, onRowClick) {
    if (data.length === 0) {
      const emptyMessage = this.props.emptyMessage || "No data available";
      return Component.h(
        "tbody",
        {},
        Component.h(
          "tr",
          {},
          Component.h("td", { colSpan: columns.length, className: "empty" }, emptyMessage)
        )
      );
    }

    const rows = data.map((row) => {
      const key = row[keyField] || JSON.stringify(row);

      // Render cells
      const cells = columns.map((col) => {
        let content;

        if (col.render) {
          // Custom render function
          content = col.render(row, this);
        } else if (col.key) {
          // Simple value render
          content = row[col.key];
        } else {
          // Action column
          content = col.actions ? this._renderActions(row, col.actions) : null;
        }

        return Component.h(
          "td",
          {
            className: col.className || "",
            "data-field": col.key,
          },
          content
        );
      });

      // Row with optional click handler
      const rowProps = {
        key,
        "data-key": key,
      };

      if (onRowClick) {
        rowProps.className = "clickable";
        rowProps.onClick = () => onRowClick(row);
      }

      return Component.h("tr", rowProps, ...cells);
    });

    return Component.h("tbody", {}, ...rows);
  }

  /**
   * Render actions cell
   */
  _renderActions(row, actions) {
    if (!actions || actions.length === 0) {
      return null;
    }

    const buttons = actions.map((action) => {
      if (action.condition && !action.condition(row)) {
        return null;
      }

      const className = ["btn", "btn-sm", action.className || "btn-secondary"]
        .filter(Boolean)
        .join(" ");

      const disabled = action.disabled ? action.disabled(row) : false;

      return Component.h(
        "button",
        {
          className,
          disabled,
          "data-action": action.key,
          "data-row-key": row[this.props.keyField] || JSON.stringify(row),
        },
        action.label
      );
    });

    return Component.h("div", { className: "actions" }, ...buttons);
  }

  /**
   * Sort data based on current sort settings
   */
  _sortData(data) {
    if (!this.sortBy) {
      return data;
    }

    return [...data].sort((a, b) => {
      let aVal = a[this.sortBy];
      let bVal = b[this.sortBy];

      // Handle custom sort function
      const column = this.props.columns.find((c) => c.key === this.sortBy);
      if (column?.sortFn) {
        return column.sortFn(a, b, this.sortOrder);
      }

      // Handle different types
      if (aVal === undefined || aVal === null) aVal = "";
      if (bVal === undefined || bVal === null) bVal = "";

      // String comparison
      if (typeof aVal === "string" && typeof bVal === "string") {
        const result = aVal.toLowerCase().localeCompare(bVal.toLowerCase());
        return this.sortOrder === "asc" ? result : -result;
      }

      // Number comparison
      const numA = Number(aVal);
      const numB = Number(bVal);

      if (!isNaN(numA) && !isNaN(numB)) {
        const result = numA - numB;
        return this.sortOrder === "asc" ? result : -result;
      }

      // Default comparison
      if (aVal < bVal) return this.sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return this.sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }

  /**
   * Handle sort header click
   */
  /**
   * Handles sort column click and toggles sort order.
   * @param {string} field - The column key to sort by.
   * @returns {void}
   */
  handleSort(field) {
    if (this.sortBy === field) {
      // Toggle sort order
      this.sortOrder = this.sortOrder === "asc" ? "desc" : "asc";
    } else {
      // New field, default to asc
      this.sortBy = field;
      this.sortOrder = "asc";
    }

    console.log("[DEBUG] Table sort:", { field, sortBy: this.sortBy, sortOrder: this.sortOrder });

    // Update header UI
    this._updateSortUI();

    // Notify parent if callback provided
    if (this.props.onSort) {
      this.props.onSort(this.sortBy, this.sortOrder);
    }
  }

  _updateSortUI() {
    // Update all header cells
    const headers = this.$$("thead th");
    headers.forEach((th) => {
      const sortField = th.dataset.sort;
      if (sortField) {
        const isSorted = this.sortBy === sortField;
        const sortIcon = isSorted ? (this.sortOrder === "asc" ? " ↑" : " ↓") : "";

        // Remove existing sort icons
        let text = th.textContent.replace(/ ↑| ↓/g, "");

        // Add icon if sorted
        if (isSorted) {
          text = text + sortIcon;
        }

        th.textContent = text;
      }
    });
  }

  /**
   * Handle action button click
   */
  handleAction(event) {
    const action = event.target.closest("[data-action]");
    if (!action) {
      return;
    }

    const actionKey = action.dataset.action;
    const rowKey = action.dataset.rowKey;

    console.log("[DEBUG] Table action:", { actionKey, rowKey });

    // Find the action handler
    const column = this.props.columns.find((col) => col.actions);
    if (column) {
      const actionDef = column.actions.find((a) => a.key === actionKey);
      if (actionDef && actionDef.onClick) {
        // Find the row data
        const row = this.props.data.find(
          (r) => (r[this.props.keyField] || JSON.stringify(r)) === rowKey
        );
        if (row) {
          actionDef.onClick(row, event);
        }
      }
    }
  }

  /**
   * Public method to set sort
   */
  setSort(sortBy, sortOrder) {
    this.sortBy = sortBy;
    this.sortOrder = sortOrder;
    this._updateSortUI();
  }
}

/**
 * Common table cell renderers
 */
const TableCellRenderers = {
  /**
   * Status badge renderer
   */
  statusBadge(status, options = {}) {
    const { variants = {}, defaultVariant = "default" } = options;

    const variant = variants[status] || defaultVariant;

    // Default variant mapping
    const variantClassMap = {
      success: ["loaded", "running", "active", "online"],
      warning: ["loading", "pending", "waiting"],
      danger: ["error", "failed", "stopped", "offline"],
    };

    // Determine variant
    let finalVariant = variant;
    for (const [cls, statuses] of Object.entries(variantClassMap)) {
      if (statuses.includes(String(status).toLowerCase())) {
        finalVariant = cls;
        break;
      }
    }

    return Component.h("span", { className: `badge badge-${finalVariant}` }, String(status));
  },

  /**
   * File size renderer
   */
  fileSize(bytes) {
    if (!bytes || bytes === 0) {
      return "-";
    }
    return window.AppUtils?.formatBytes(bytes) || String(bytes);
  },

  /**
   * Number formatter
   */
  number(value, options = {}) {
    if (value === null || value === undefined) {
      return options.default || "-";
    }
    const { decimals = 0, suffix = "" } = options;
    return `${Number(value).toFixed(decimals)}${suffix}`;
  },

  /**
   * Date/time renderer
   */
  timestamp(value, options = {}) {
    if (!value) {
      return options.default || "--:--:--";
    }
    const { format = "time" } = options;
    const ms = value < 1e11 ? value * 1000 : value;
    const d = new Date(ms);

    if (format === "time") {
      return d.toLocaleTimeString();
    } else if (format === "date") {
      return d.toLocaleDateString();
    } else if (format === "datetime") {
      return d.toLocaleString();
    } else if (format === "relative") {
      return window.AppUtils?.formatRelativeTime(ms) || d.toLocaleString();
    }
    return d.toLocaleString();
  },

  /**
   * Truncated text renderer
   */
  truncate(text, options = {}) {
    const { maxLength = 50 } = options;
    if (!text) {
      return options.default || "-";
    }
    const str = String(text);
    return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str;
  },

  /**
   * Boolean renderer
   */
  boolean(value, options = {}) {
    const { trueIcon = "✓", falseIcon = "✗" } = options;

    if (value === null || value === undefined) {
      return options.default || "-";
    }

    return Component.h(
      "span",
      {
        className: value ? "text-success" : "text-danger",
      },
      value ? trueIcon : falseIcon
    );
  },
};

window.Table = Table;
window.TableCellRenderers = TableCellRenderers;
