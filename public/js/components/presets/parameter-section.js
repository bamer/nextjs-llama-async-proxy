/**
 * ParameterSection Component - Event-Driven DOM Updates
 * Renders a category accordion section with expandable/collapsible parameters
 */

class ParameterSection extends Component {
  constructor(props) {
    super(props);

    // Direct properties instead of state
    this.expanded = props.expanded !== undefined ? props.expanded : true;
  }

  /**
   * Bind event handlers for section toggle, expand all, and collapse all.
   */
  bindEvents() {
    // Toggle section
    this.on("click", "[data-action=toggle-section]", () => {
      this.handleToggle();
    });

    // Expand all
    this.on("click", "[data-action=expand-all]", () => {
      this.handleExpandAll();
    });

    // Collapse all
    this.on("click", "[data-action=collapse-all]", () => {
      this.handleCollapseAll();
    });
  }

  /**
   * Handle section toggle click - expands or collapses the section.
   */
  handleToggle() {
    this.expanded = !this.expanded;
    this._updateSectionUI();
  }

  /**
   * Handle expand all action - expands the section.
   */
  handleExpandAll() {
    this.expanded = true;
    this._updateSectionUI();
  }

  /**
   * Handle collapse all action - collapses the section.
   */
  handleCollapseAll() {
    this.expanded = false;
    this._updateSectionUI();
  }

  /**
   * Update section UI based on expanded state.
   * @private
   */
  _updateSectionUI() {
    const section = this.$(".parameter-section");
    if (!section) return;

    const content = section.querySelector(".section-body");
    const toggle = section.querySelector(".section-toggle");

    // Update section class
    section.className = `parameter-section section-${this.expanded ? "expanded" : "collapsed"}`;

    // Update toggle icon
    if (toggle) {
      toggle.textContent = this.expanded ? "▼" : "▶";
    }

    // Show/hide content
    if (content) {
      content.style.display = this.expanded ? "" : "none";
    }
  }

  /**
   * Render the parameter section component.
   * @returns {HTMLElement} The section element.
   */
  render() {
    const { categoryId, categoryInfo, parameters, config, defaults, inheritance, editableFields } =
      this.props;

    const filteredParameters = this.filterParameters(parameters, config);
    const displayCount = Object.keys(filteredParameters).length;

    return Component.h(
      "div",
      { className: `parameter-section section-${this.expanded ? "expanded" : "collapsed"}` },
      this.renderHeader(categoryId, categoryInfo, displayCount, this.expanded),
      this.expanded
        ? this.renderBody(filteredParameters, config, defaults, inheritance, editableFields)
        : null
    );
  }

  /**
   * Render the section header with toggle, title, and actions.
   * @param {string} categoryId - The category identifier.
   * @param {Object} categoryInfo - The category information object.
   * @param {number} count - Number of parameters in the category.
   * @param {boolean} expanded - Whether the section is expanded.
   * @returns {HTMLElement} The header element.
   */
  renderHeader(categoryId, categoryInfo, count, expanded) {
    const icon = expanded ? "▼" : "▶";

    return Component.h(
      "div",
      {
        className: "section-header",
        "data-action": "toggle-section",
      },
      Component.h(
        "div",
        { className: "section-title-area" },
        Component.h("span", { className: "section-icon section-toggle" }, icon),
        Component.h(
          "div",
          { className: "section-title-group" },
          Component.h("h3", { className: "section-title" }, categoryInfo.name),
          Component.h(
            "span",
            { className: "section-subtitle" },
            `${count} parameter${count !== 1 ? "s" : ""}`
          )
        ),
        Component.h("p", { className: "section-description" }, categoryInfo.description)
      ),
      this.renderHeaderActions(count)
    );
  }

  /**
   * Render header action buttons (Expand All / Collapse All).
   * @param {number} count - Number of parameters in the section.
   * @returns {HTMLElement|null} The actions element or null.
   */
  renderHeaderActions(count) {
    if (count === 0) return null;

    return Component.h(
      "div",
      { className: "section-actions" },
      Component.h(
        "button",
        {
          type: "button",
          className: "btn-text btn-sm section-expand-btn",
          "data-action": "expand-all",
          title: "Expand all sections",
        },
        "Expand All"
      ),
      Component.h(
        "button",
        {
          type: "button",
          className: "btn-text btn-sm section-collapse-btn",
          "data-action": "collapse-all",
          title: "Collapse all sections",
        },
        "Collapse All"
      )
    );
  }

  /**
   * Render the section body with parameter inputs.
   * @param {Object} parameters - Map of parameter ID to parameter config.
   * @param {Object} config - Current configuration values.
   * @param {Object} defaults - Default values.
   * @param {Object} inheritance - Inheritance information.
   * @param {Array} editableFields - List of editable field IDs.
   * @returns {HTMLElement} The body element.
   */
  renderBody(parameters, config, defaults, inheritance, editableFields) {
    const paramIds = Object.keys(parameters);

    if (paramIds.length === 0) {
      return Component.h(
        "div",
        { className: "section-body section-empty" },
        Component.h("p", {}, "No parameters in this category")
      );
    }

    const ParameterInput = window.ParameterInput;

    return Component.h(
      "div",
      { className: "section-body" },
      paramIds.map((paramId) => {
        const param = parameters[paramId];
        const value = config[paramId];
        const defaultValue = defaults?.[paramId];
        const paramInheritance = inheritance?.[paramId];

        return Component.h(ParameterInput, {
          key: paramId,
          paramId,
          param,
          value,
          defaultValue,
          inheritance: paramInheritance ? { [paramId]: paramInheritance } : null,
          editableFields,
          onChange: (field, val) => this.handleParamChange(field, val),
          onValidate: (field, validation) => this.handleParamValidation(field, validation),
        });
      })
    );
  }

  /**
   * Filter parameters based on config - only show parameters with values or defaults.
   * @param {Object} parameters - Map of parameter ID to parameter config.
   * @param {Object} config - Current configuration values.
   * @returns {Object} Filtered parameters.
   */
  filterParameters(parameters, config) {
    if (!config) return parameters;

    // Filter to only show parameters that are either:
    // 1. In the config (have a value)
    // 2. Have a default value
    const filtered = {};
    Object.entries(parameters).forEach(([paramId, param]) => {
      const hasValue = config[paramId] !== undefined;
      const hasDefault = param.default !== undefined;
      if (hasValue || hasDefault) {
        filtered[paramId] = param;
      }
    });
    return filtered;
  }

  /**
   * Handle parameter value change from child component.
   * @param {string} field - The parameter field ID.
   * @param {*} value - The new value.
   */
  handleParamChange(field, value) {
    if (this.props.onChange) {
      this.props.onChange(field, value);
    }
  }

  /**
   * Handle parameter validation result from child component.
   * @param {string} field - The parameter field ID.
   * @param {Object} validation - The validation result object.
   */
  handleParamValidation(field, validation) {
    if (this.props.onValidate) {
      this.props.onValidate(field, validation);
    }
  }

  // Public method to expand/collapse
  /**
   * Set the expanded state of the section.
   * @param {boolean} expanded - Whether the section should be expanded.
   */
  setExpanded(expanded) {
    this.expanded = expanded;
    this._updateSectionUI();
  }

  // Get summary of current values
  /**
   * Get a summary of the current parameter values in this section.
   * @returns {Object} Summary with total, changed, and errors counts.
   */
  getSummary() {
    const { config, parameters } = this.props;
    const summary = {
      total: 0,
      changed: 0,
      errors: 0,
    };

    Object.keys(parameters).forEach((paramId) => {
      if (config?.[paramId] !== undefined) {
        summary.total++;
      }
    });

    return summary;
  }
}

window.ParameterSection = ParameterSection;
