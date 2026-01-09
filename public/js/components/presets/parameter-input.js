/**
 * ParameterInput Component
 * Renders individual parameter fields with validation, tooltips, and inheritance visualization
 */

class ParameterInput extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.value,
      defaultValue: props.defaultValue,
      validation: null,
      showTooltip: false,
      focused: false,
    };
    this._debounceTimer = null;
  }

  get initialState() {
    return {
      value: this.props.value,
      defaultValue: this.props.defaultValue,
      validation: null,
      showTooltip: false,
      focused: false,
    };
  }

  willMount() {
    // Initial validation
    if (this.props.value !== undefined) {
      this.validateValue(this.props.value);
    }
  }

  getEventMap() {
    return {
      "input input, change input, blur input": "handleInputChange",
      "focus input, focus select, focus textarea": "handleFocus",
      "blur input, blur select, blur textarea": "handleBlur",
      "click [data-action=reset]": "handleReset",
      "click [data-action=toggle-tooltip]": "handleToggleTooltip",
      "mouseenter [data-tooltip]": "handleTooltipEnter",
      "mouseleave [data-tooltip]": "handleTooltipLeave",
    };
  }

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

    this.setState({ value });

    // Debounced validation
    clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => {
      this.validateValue(value);
      this.notifyChange(value);
    }, 300);
  }

  handleFocus() {
    this.setState({ focused: true });
  }

  handleBlur() {
    this.setState({ focused: false });
    // Final validation on blur
    if (this.state.value !== undefined) {
      const validation = this.validateValue(this.state.value);
      if (!validation.valid) {
        this.notifyValidation(validation);
      }
    }
  }

  handleReset() {
    const defaultValue = this.props.defaultValue;
    this.setState({ value: defaultValue });
    this.validateValue(defaultValue);
    this.notifyChange(defaultValue);
  }

  handleToggleTooltip() {
    this.setState({ showTooltip: !this.state.showTooltip });
  }

  handleTooltipEnter() {
    this.setState({ showTooltip: true });
  }

  handleTooltipLeave() {
    this.setState({ showTooltip: false });
  }

  validateValue(value) {
    const validation = window.validateParameter(this.props.paramId, value);
    this.setState({ validation });
    this.notifyValidation(validation);
    return validation;
  }

  notifyChange(value) {
    if (this.props.onChange) {
      this.props.onChange(this.props.paramId, value);
    }
  }

  notifyValidation(validation) {
    if (this.props.onValidate) {
      this.props.onValidate(this.props.paramId, validation);
    }
  }

  render() {
    const { param, paramId, inheritance, editableFields } = this.props;
    const { value, defaultValue, validation, showTooltip, focused } = this.state;

    const isEditable = !editableFields || editableFields.includes(paramId);
    const inheritanceType = inheritance?.[paramId] || "global";
    const hasChanged = value !== defaultValue && value !== undefined;

    const containerClass = this.getContainerClass(inheritanceType, validation, focused, hasChanged);

    return Component.h(
      "div",
      { className: `parameter-input ${containerClass}` },
      this.renderLabel(param, paramId),
      this.renderInput(param, paramId, value, isEditable),
      this.renderInheritanceIndicator(inheritanceType, hasChanged),
      this.renderResetButton(hasChanged, isEditable),
      this.renderTooltip(param, showTooltip),
      this.renderValidationMessage(validation)
    );
  }

  getContainerClass(inheritanceType, validation, focused, hasChanged) {
    const classes = [];

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

    return classes.join(" ");
  }

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

  // Lifecycle methods
  willReceiveProps(newProps) {
    if (newProps.value !== this.state.value) {
      this.setState({ value: newProps.value });
      this.validateValue(newProps.value);
    }
  }

  didDestroy() {
    clearTimeout(this._debounceTimer);
  }
}

window.ParameterInput = ParameterInput;
