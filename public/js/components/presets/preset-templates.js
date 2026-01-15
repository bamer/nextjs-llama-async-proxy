/**
 * Preset Templates Component
 * Quick preset templates for common use cases
 */

class PresetTemplates extends Component {
  constructor(props) {
    super(props);
    this.templates = [
      {
        id: "fast-chatbot",
        name: "Fast Chatbot",
        description: "Quick responses, balanced creativity",
        config: {
          ctx_size: 4096,
          batch_size: 512,
          temperature: 0.7,
          top_p: 0.9,
        },
      },
      {
        id: "creative-writing",
        name: "Creative Writing",
        description: "More creative, varied outputs",
        config: {
          ctx_size: 8192,
          batch_size: 512,
          temperature: 0.9,
          top_p: 0.95,
        },
      },
      {
        id: "code-generation",
        name: "Code Generation",
        description: "Precise, deterministic code",
        config: {
          ctx_size: 4096,
          batch_size: 512,
          temperature: 0.2,
          top_p: 0.95,
        },
      },
      {
        id: "minimal-ram",
        name: "Minimal RAM",
        description: "Low memory usage",
        config: {
          ctx_size: 2048,
          batch_size: 256,
          temperature: 0.7,
          top_p: 0.9,
        },
      },
    ];
    this.onApplyTemplate = props.onApplyTemplate || null;
  }

  /**
   * Render the preset templates component.
   * @returns {HTMLElement} The templates container element.
   */
  render() {
    return Component.h(
      "div",
      { className: "preset-templates" },
      Component.h("h2", {}, "Quick Preset Templates"),
      Component.h(
        "p",
        { className: "hint" },
        "Select a template to quickly apply common parameter settings."
      ),
      Component.h(
        "select",
        { "data-field": "template", className: "template-select" },
        Component.h("option", { value: "" }, "-- Select Template --"),
        ...this.templates.map((t) =>
          Component.h("option", { value: t.id }, `${t.name} - ${t.description}`)
        )
      ),
      Component.h(
        "button",
        { className: "btn btn-primary", "data-action": "apply-template" },
        "Apply Template"
      )
    );
  }

  /**
   * Get the event map for component event binding.
   * @returns {Object} Map of events to handler methods.
   */
  getEventMap() {
    return {
      "click [data-action=apply-template]": this.handleApplyTemplate,
    };
  }

  /**
   * Handle apply template button click.
   * Finds selected template and emits onApplyTemplate callback.
   */
  handleApplyTemplate() {
    const select = this._el?.querySelector("[data-field=template]");
    const templateId = select?.value;

    if (!templateId) {
      showNotification("Please select a template", "warning");
      return;
    }

    const template = this.templates.find((t) => t.id === templateId);
    if (!template) {
      showNotification("Template not found", "error");
      return;
    }

    console.log("[DEBUG] Applying template:", template.name);

    if (this.onApplyTemplate) {
      this.onApplyTemplate(template.config);
    }

    showNotification(`Applied "${template.name}" template`, "success");
    select.value = "";
  }
}

window.PresetTemplates = PresetTemplates;
