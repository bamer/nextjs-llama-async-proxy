/**
 * ParameterInput Component - Event-Driven DOM Updates
 * Renders individual parameter fields with validation, tooltips, and inheritance visualization
 */

class ParameterInput extends Component {
  constructor(props) {
    super(props);

    // Direct properties instead of state
    this.value = props.value;
    this.defaultValue = props.defaultValue;
    this.validation = null;
    this.showTooltip = false;
    this.focused = false;

    this._debounceTimer = null;

    // Initial validation
    if (props.value !== undefined) {
      this.validateValue(props.value);
    }
  }

  /**
   * Lifecycle hook called after component is mounted to DOM.
   * Sets up tooltip event listeners.
   */
  onMount() {
    // Setup tooltip event listeners using event delegation from parent
    this._bindTooltipEvents();
  }

  /**
   * Bind event handlers for input, focus, blur, reset, and tooltip interactions.
   * Uses event delegation for performance.
   */
  bindEvents() {
    // Input change events - using event delegation
    this.on("input", "input, select, textarea", (e, target) => {
      this.handleInputChange(e);
    });

    this.on("change", "input, select, textarea", (e, target) => {
      this.handleInputChange(e);
    });

    // Focus/blur events
    this.on("focus", "input, select, textarea", () => {
      this.handleFocus();
    });

    this.on("blur", "input, select, textarea", () => {
      this.handleBlur();
    });

    // Reset button
    this.on("click", "[data-action=reset]", () => {
      this.handleReset();
    });

    // Tooltip toggle
    this.on("click", "[data-action=toggle-tooltip]", () => {
      this.handleToggleTooltip();
    });
  }

  /**
   * Bind tooltip mouseenter/mouseleave events.
   * @private
   */
  _bindTooltipEvents() {
    // Tooltip hover events
    const tooltipEl = this.$("[data-tooltip]");
    if (tooltipEl) {
      tooltipEl.addEventListener("mouseenter", () => this.handleTooltipEnter());
      tooltipEl.addEventListener("mouseleave", () => this.handleTooltipLeave());
    }
  }

  /**
   * Handle input/change events from the field element.
   * Parses value based on parameter type and triggers validation.
   * @param {Event} e - The input event object.
   */
  handleInputChange(e) {
    const input = e.target;
    let value = input.value;

    // Parse value based on type
    if (this.props.param.type === "number") {
      value = value === "" ? null : parseFloat(value);
    } else if (this.props.param.type === "boolean") {
      value = input.checked;
    } else if (this.props.param.type === "multiselect") {
      // Get selected options
      const options = Array.from(input.selectedOptions || input.querySelectorAll("option:checked"));
      value = options.map((opt) => opt.value);
    }

    this.value = value;

    // Debounced validation
    clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => {
      this.validateValue(value);
      this.notifyChange(value);
    }, 300);
  }

  /**
   * Handle focus event - updates UI state.
   */
  handleFocus() {
    this.focused = true;
    this._updateFocusUI();
  }

  /**
   * Handle blur event - performs final validation.
   */
  handleBlur() {
    this.focused = false;
    this._updateFocusUI();
    // Final validation on blur
    if (this.value !== undefined) {
      const validation = this.validateValue(this.value);
      if (!validation.valid) {
        this.notifyValidation(validation);
      }
    }
  }

  /**
   * Update focus UI state on the container element.
   * @private
   */
  _updateFocusUI() {
    const container = this.$(".parameter-input");
    if (container) {
      this.toggleClass(container, "focused", this.focused);
    }
  }

  /**
   * Handle reset button click - restores default value.
   */
  handleReset() {
    const defaultValue = this.props.defaultValue;
    this.value = defaultValue;
    this.validateValue(defaultValue);
    this.notifyChange(defaultValue);
    this._updateValueUI();
  }

  /**
   * Handle tooltip toggle button click.
   */
  handleToggleTooltip() {
    this.showTooltip = !this.showTooltip;
    this._updateTooltipUI();
  }

  /**
   * Handle mouseenter on tooltip trigger.
   */
  handleTooltipEnter() {
    this.showTooltip = true;
    this._updateTooltipUI();
  }

  /**
   * Handle mouseleave from tooltip trigger.
   */
  handleTooltipLeave() {
    this.showTooltip = false;
    this._updateTooltipUI();
  }

  /**
   * Update tooltip visibility in the DOM.
   * @private
   */
  _updateTooltipUI() {
    const tooltip = this.$(".param-tooltip");
    if (tooltip) {
      tooltip.style.display = this.showTooltip ? "block" : "none";
    }

    // Update container class
    const container = this.$(".parameter-input");
    if (container) {
      this.toggleClass(container, "tooltip-visible", this.showTooltip);
    }
  }

  /**
   * Update the input value display in the DOM.
   * @private
   */
  _updateValueUI() {
    // Update the input value display
    const input = this.$("input, select");
    if (input) {
      if (this.props.param.type === "boolean") {
        input.checked = this.value === true;
      } else {
        input.value = this.value === null || this.value === undefined ? "" : String(this.value);
      }
    }

    // Update reset button visibility
    const hasChanged = this.value !== this.defaultValue && this.value !== undefined;
    const resetBtn = this.$("[data-action=reset]");
    if (resetBtn) {
      resetBtn.style.display = hasChanged ? "inline-block" : "none";
    }
  }

  /**
   * Validate the current value and update UI.
   * @param {*} value - The value to validate.
   * @returns {Object} Validation result with valid, errors, and warnings.
   */
  validateValue(value) {
    const validation = window.validateParameter(this.props.paramId, value);
    this.validation = validation;
    this._updateValidationUI();
    this.notifyValidation(validation);
    return validation;
  }

  /**
   * Update validation UI state based on current validation result.
   * @private
   */
  _updateValidationUI() {
    const container = this.$(".parameter-input");
    if (!container) return;

    // Remove existing validation classes
    container.classList.remove("validation-error", "validation-warning", "validation-valid");

    if (this.validation) {
      if (this.validation.errors.length > 0) {
        container.classList.add("validation-error");
      } else if (this.validation.warnings.length > 0) {
        container.classList.add("validation-warning");
      } else if (this.value !== this.defaultValue && this.value !== undefined) {
        container.classList.add("validation-valid");
      }
    }

    // Update validation message
    const messageEl = this.$(".validation-message");
    if (messageEl) {
      if (!this.validation || this.validation.valid) {
        messageEl.style.display = "none";
      } else {
        messageEl.style.display = "block";
        const messages = [...this.validation.errors, ...this.validation.warnings];
        messageEl.textContent = messages.join("; ");
        messageEl.className = `validation-message ${this.validation.errors.length > 0 ? "message-error" : "message-warning"}`;
      }
    }
  }

  /**
   * Notify parent component of value change.
   * @param {*} value - The new value.
   */
  notifyChange(value) {
    if (this.props.onChange) {
      this.props.onChange(this.props.paramId, value);
    }
  }

  /**
   * Notify parent component of validation result.
   * @param {Object} validation - The validation result object.
   */
  notifyValidation(validation) {
    if (this.props.onValidate) {
      this.props.onValidate(this.props.paramId, validation);
    }
  }

  /**
   * Render the parameter input component.
   * @returns {HTMLElement} The rendered component element.
   */
  render() {
    const { param, paramId, inheritance, editableFields } = this.props;
    const isEditable = !editableFields || editableFields.includes(paramId);
    const inheritanceType = inheritance?.[paramId] || "global";
    const hasChanged = this.value !== this.defaultValue && this.value !== undefined;

    const containerClass = this.getContainerClass(inheritanceType, this.validation, this.focused, hasChanged);

    return Component.h(
      "div",
      { className: `parameter-input ${containerClass}` },
      this.renderLabel(param, paramId),
      this.renderInput(param, paramId, this.value, isEditable),
      this.renderInheritanceIndicator(inheritanceType, hasChanged),
      this.renderResetButton(hasChanged, isEditable),
      this.renderTooltip(param, this.showTooltip),
      this.renderValidationMessage(this.validation)
    );
  }

  /**
   * Generate CSS classes for the container based on state.
   * @param {string} inheritanceType - Type of inheritance (model, group, global).
   * @param {Object} validation - Current validation state.
   * @param {boolean} focused - Whether the input is focused.
   * @param {boolean} hasChanged - Whether the value differs from default.
   * @returns {string} The CSS class string.
   */
  getContainerClass(inheritanceType, validation, focused, hasChanged) {
    const classes = ["parameter-input"];

    // Inheritance visualization
    if (inheritanceType === "model") {
      classes.push("inheritance-model");
    } else if (inheritanceType === "group") {
      classes.push("inheritance-group");
    } else {
      classes.push("inheritance-global");
    }

    // Validation state
    if (validation) {
      if (validation.errors.length > 0) {
        classes.push("validation-error");
      } else if (validation.warnings.length > 0) {
        classes.push("validation-warning");
      } else if (hasChanged) {
        classes.push("validation-valid");
      }
    }

    if (focused) {
      classes.push("focused");
    }

    if (this.showTooltip) {
      classes.push("tooltip-visible");
    }

    return classes.join(" ");
  }

  /**
   * Render the label element with required mark and info button.
   * @param {Object} param - Parameter configuration object.
   * @param {string} paramId - The parameter identifier.
   * @returns {HTMLElement} The label element.
   */
  renderLabel(param, paramId) {
    const labelContent = Component.h("span", { className: "param-label-text" }, param.label);

    const requiredMark = param.validation?.required
      ? Component.h("span", { className: "required-mark" }, "*")
      : null;

    const infoButton = param.description
      ? Component.h(
        "button",
        {
          type: "button",
          className: "param-info-btn",
          "data-action": "toggle-tooltip",
          title: "Show description",
        },
        "?"
      )
      : null;

    return Component.h(
      "label",
      { className: "param-label", htmlFor: `param-${paramId}` },
      labelContent,
      requiredMark,
      infoButton
    );
  }

  /**
   * Render the input field based on parameter type.
   * @param {Object} param - Parameter configuration object.
   * @param {string} paramId - The parameter identifier.
   * @param {*} value - Current value.
   * @param {boolean} isEditable - Whether the field is editable.
   * @returns {HTMLElement} The input element.
   */
  renderInput(param, paramId, value, isEditable) {
    const inputProps = {
      id: `param-${paramId}`,
      className: "param-field",
      disabled: !isEditable,
      "data-param-id": paramId,
    };

    // Add validation attributes
    if (param.type === "number") {
      inputProps.type = "number";
      inputProps.min = param.min;
      inputProps.max = param.max;
      inputProps.step = param.step || 1;
    } else if (param.type === "text") {
      inputProps.type = "text";
      inputProps.placeholder = param.placeholder || "";
    } else if (param.type === "boolean") {
      inputProps.type = "checkbox";
      inputProps.className = "param-checkbox";
    }

    // Set value
    if (param.type === "boolean") {
      inputProps.checked = value === true;
    } else {
      inputProps.value = value === null || value === undefined ? "" : String(value);
    }

    switch (param.type) {
    case "select":
      return this.renderSelect(param, paramId, value, isEditable);
    case "multiselect":
      return this.renderMultiSelect(param, paramId, value, isEditable);
    case "boolean":
      return this.renderBoolean(param, paramId, value, isEditable);
    case "number":
    case "text":
    default:
      return Component.h("input", inputProps);
    }
  }

  /**
   * Render a select dropdown for enum parameters.
   * @param {Object} param - Parameter configuration object.
   * @param {string} paramId - The parameter identifier.
   * @param {*} value - Current value.
   * @param {boolean} isEditable - Whether the field is editable.
   * @returns {HTMLElement} The select element.
   */
  renderSelect(param, paramId, value, isEditable) {
    const options = param.options || [];
    return Component.h(
      "select",
      {
        id: `param-${paramId}`,
        className: "param-field param-select",
        disabled: !isEditable,
        "data-param-id": paramId,
        value: value !== undefined ? String(value) : "",
      },
      options.map((opt) => Component.h("option", { key: opt.value, value: opt.value }, opt.label))
    );
  }

  /**
   * Render a multi-select dropdown for array parameters.
   * @param {Object} param - Parameter configuration object.
   * @param {string} paramId - The parameter identifier.
   * @param {Array} value - Current value array.
   * @param {boolean} isEditable - Whether the field is editable.
   * @returns {HTMLElement} The select element.
   */
  renderMultiSelect(param, paramId, value, isEditable) {
    const options = param.options || [];
    const selectedValues = Array.isArray(value) ? value : [];

    return Component.h(
      "select",
      {
        id: `param-${paramId}`,
        className: "param-field param-multiselect",
        disabled: !isEditable,
        "data-param-id": paramId,
        multiple: true,
        size: Math.min(options.length, 5),
      },
      options.map((opt) =>
        Component.h(
          "option",
          {
            key: opt.value,
            value: opt.value,
            selected: selectedValues.includes(opt.value),
          },
          opt.label
        )
      )
    );
  }

  /**
   * Render a checkbox for boolean parameters.
   * @param {Object} param - Parameter configuration object.
   * @param {string} paramId - The parameter identifier.
   * @param {boolean} value - Current value.
   * @param {boolean} isEditable - Whether the field is editable.
   * @returns {HTMLElement} The checkbox wrapper element.
   */
  renderBoolean(param, paramId, value, isEditable) {
    return Component.h(
      "div",
      { className: "param-boolean-wrapper" },
      Component.h("input", {
        id: `param-${paramId}`,
        type: "checkbox",
        className: "param-field param-checkbox",
        disabled: !isEditable,
        "data-param-id": paramId,
        checked: value === true,
      }),
      Component.h(
        "label",
        { className: "param-boolean-label", htmlFor: `param-${paramId}` },
        value === true ? "Enabled" : "Disabled"
      )
    );
  }

  /**
   * Render the inheritance indicator icon showing parameter source.
   * @param {string} inheritanceType - Type of inheritance (model, group, global).
   * @param {boolean} hasChanged - Whether the value differs from default.
   * @returns {HTMLElement} The indicator element.
   */
  renderInheritanceIndicator(inheritanceType, hasChanged) {
    const titles = {
      model: "Model-specific setting",
      group: "Group override",
      global: "Inherited from global defaults",
    };

    const icons = {
      model: "M",
      group: "G",
      global: "•",
    };

    return Component.h(
      "span",
      {
        className: `inheritance-indicator inheritance-${inheritanceType}`,
        title: titles[inheritanceType] || "Unknown",
      },
      icons[inheritanceType] || "?"
    );
  }

  /**
   * Render the reset button to restore default value.
   * @param {boolean} hasChanged - Whether the value differs from default.
   * @param {boolean} isEditable - Whether the field is editable.
   * @returns {HTMLElement|null} The reset button or null if not needed.
   */
  renderResetButton(hasChanged, isEditable) {
    if (!hasChanged || !isEditable) return null;

    return Component.h(
      "button",
      {
        type: "button",
        className: "param-reset-btn",
        "data-action": "reset",
        title: "Reset to default",
      },
      "↺"
    );
  }

  /**
   * Render the tooltip with parameter description and CLI flag.
   * @param {Object} param - Parameter configuration object.
   * @param {boolean} showTooltip - Whether to show the tooltip.
   * @returns {HTMLElement|null} The tooltip element or null.
   */
  renderTooltip(param, showTooltip) {
    if (!param.description || !showTooltip) return null;

    return Component.h(
      "div",
      { className: "param-tooltip" },
      Component.h("div", { className: "tooltip-arrow" }),
      Component.h(
        "div",
        { className: "tooltip-content" },
        Component.h("strong", {}, param.label),
        Component.h("p", {}, param.description),
        param.cliFlag ? Component.h("code", { className: "tooltip-cli" }, param.cliFlag) : null
      )
    );
  }

  /**
   * Render the validation message with errors and warnings.
   * @param {Object} validation - Validation result object.
   * @returns {HTMLElement|null} The message element or null.
   */
  renderValidationMessage(validation) {
    if (!validation || validation.valid) return null;

    const messages = [...validation.errors, ...validation.warnings];
    const isError = validation.errors.length > 0;

    return Component.h(
      "div",
      { className: `validation-message ${isError ? "message-error" : "message-warning"}` },
      messages.join("; ")
    );
  }

  /**
   * Cleanup resources when component is destroyed.
   * Clears the debounce timer.
   */
  destroy() {
    clearTimeout(this._debounceTimer);
    super.destroy();
  }
}

window.ParameterInput = ParameterInput;
